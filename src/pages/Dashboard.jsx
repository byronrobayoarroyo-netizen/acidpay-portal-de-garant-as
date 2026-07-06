import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Shield, DollarSign, FileText, AlertTriangle, TrendingUp,
  Building2, ArrowRight, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import BandaBadge from '@/components/BandaBadge';
import EstadoBadge from '@/components/EstadoBadge';
import { useCurrentUser, isAdmin, isBancoUser } from '@/lib/useCurrentUser';
import { formatCurrency, formatNumber, formatDate, getMesLabel } from '@/lib/calculos';
import { ESTADOS_LIQUIDACION } from '@/lib/tarifario';
import { generateAlerts } from '@/lib/generateAlerts';

export default function Dashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState({
    carteraTotal: 0,
    primaMes: 0,
    certificadosActivos: 0,
    casosMoraAbiertos: 0,
  });
  const [certificados, setCertificados] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [casosMora, setCasosMora] = useState([]);
  const [ifis, setIfis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [certs, liqs, moras, ifiList] = await Promise.all([
          base44.entities.Certificado.list('-fecha_emision', 200),
          base44.entities.Liquidacion.list('-mes', 50),
          base44.entities.CasoMora.list('-fecha_primer_incumplimiento', 50),
          isAdmin(user) ? base44.entities.IFI.list() : Promise.resolve([])
        ]);

        let filteredCerts = certs;
        let filteredLiqs = liqs;
        let filteredMoras = moras;

        if (isBancoUser(user) && user.ifi_id) {
          filteredCerts = certs.filter(c => c.ifi_id === user.ifi_id);
          filteredLiqs = liqs.filter(l => l.ifi_id === user.ifi_id);
          filteredMoras = moras.filter(m => m.ifi_id === user.ifi_id);
        }

        setCertificados(filteredCerts.filter(Boolean));
        setLiquidaciones(filteredLiqs.filter(Boolean));
        setCasosMora(filteredMoras.filter(Boolean));
        setIfis(ifiList);

        const carteraTotal = filteredCerts
          .filter(c => c.estado === 'vigente' || c.estado === 'en_mora')
          .reduce((sum, c) => sum + (c.monto_garantizado || 0), 0);

        const now = new Date();
        const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const primaMes = filteredCerts
          .filter(c => c.mes_liquidacion === mesActual)
          .reduce((sum, c) => sum + (c.prima_valor || 0), 0);

        setStats({
          carteraTotal,
          primaMes,
          certificadosActivos: filteredCerts.filter(c => c.estado === 'vigente').length,
          casosMoraAbiertos: filteredMoras.filter(m => m.estado === 'reportado' || m.estado === 'observado' || m.estado === 'aprobado').length,
        });
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    // Generate alerts on dashboard load (fire-and-forget)
    generateAlerts();
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const siniestralidad = stats.carteraTotal > 0
    ? (casosMora.filter(m => m.estado === 'aprobado').reduce((s, m) => s + (m.monto_garantizado || 0), 0) / stats.carteraTotal * 100)
    : 0;

  // Ranking by cartera
  const rankingData = {};
  certificados.forEach(c => {
    if (!c || !c.ifi_nombre) return;
    if (!rankingData[c.ifi_nombre]) rankingData[c.ifi_nombre] = { cartera: 0, prima: 0, count: 0 };
    rankingData[c.ifi_nombre].cartera += c.monto_garantizado || 0;
    rankingData[c.ifi_nombre].prima += c.prima_valor || 0;
    rankingData[c.ifi_nombre].count++;
  });
  const ranking = Object.entries(rankingData).sort((a, b) => b[1].cartera - a[1].cartera);

  const recentCerts = certificados.slice(0, 5);
  const pendingLiqs = liquidaciones.filter(l => l.estado === 'pendiente' || l.estado === 'vencida' || l.estado === 'parcial');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin(user) ? 'Vista consolidada de todas las IFIs' : `Vista consolidada de ${user.ifi_nombre || 'su institución'}`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cartera Garantizada"
          value={formatCurrency(stats.carteraTotal)}
          subtitle="Certificados vigentes y en mora"
          icon={Shield}
          accentColor="#0A2342"
        />
        <StatCard
          title="Prima Devengada del Mes"
          value={formatCurrency(stats.primaMes)}
          subtitle={`${stats.certificadosActivos} certificados activos`}
          icon={DollarSign}
          accentColor="#16A34A"
        />
        <StatCard
          title="Casos de Mora Abiertos"
          value={formatNumber(stats.casosMoraAbiertos)}
          subtitle="En verificación o aprobados"
          icon={AlertTriangle}
          accentColor="#EA580C"
        />
        <StatCard
          title="Ratio de Siniestralidad"
          value={`${siniestralidad.toFixed(2)}%`}
          subtitle="Siniestros sobre cartera"
          icon={TrendingUp}
          accentColor="#7C3AED"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent certificates */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Certificados Recientes</h2>
            <Link to="/certificados" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCerts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No hay certificados</p>
            ) : recentCerts.filter(Boolean).map(cert => (
               <Link key={cert.id} to={`/certificados/${cert.id}`} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-900 truncate">{cert.cliente_nombre}</p>
                   <p className="text-xs text-gray-500">{cert.numero} · {cert.ifi_nombre || '—'}</p>
                </div>
                <BandaBadge banda={cert.banda} showLabel={false} />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(cert.monto_garantizado)}</p>
                  <p className="text-xs text-gray-500">{formatDate(cert.fecha_emision)}</p>
                </div>
                <EstadoBadge estado={cert.estado} />
              </Link>
            ))}
          </div>
        </div>

        {/* Pending liquidations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Liquidaciones Pendientes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingLiqs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">Sin pendientes</p>
            ) : pendingLiqs.filter(Boolean).slice(0, 5).map(liq => {
              const est = ESTADOS_LIQUIDACION[liq.estado];
              return (
                <div key={liq.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{liq.ifi_nombre}</p>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: est.bg, color: est.text }}>{est.label}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{getMesLabel(liq.mes)}</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(liq.prima_total)}</span>
                  </div>
                  {liq.fecha_limite_pago && (
                    <p className="mt-1 text-xs text-gray-400">Vence: {formatDate(liq.fecha_limite_pago)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking */}
      {isAdmin(user) && ranking.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Ranking de IFIs por Cartera</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Institución</th>
                  <th className="px-5 py-3 text-right">Cartera Garantizada</th>
                  <th className="px-5 py-3 text-right">Prima Generada</th>
                  <th className="px-5 py-3 text-right">Certificados</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(([nombre, data], idx) => (
                  <tr key={nombre} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-bold text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{nombre}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(data.cartera)}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(data.prima)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{data.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}