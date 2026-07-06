import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isAdmin, isBancoUser } from '@/lib/useCurrentUser';
import { AlertTriangle, Search, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import EstadoBadge from '@/components/EstadoBadge';
import { formatCurrency, formatDate } from '@/lib/calculos';

export default function CasosMora() {
  const { user } = useCurrentUser();
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await base44.entities.CasoMora.list('-fecha_primer_incumplimiento', 100);
        let filtered = data;
        if (isBancoUser(user) && user.ifi_id) {
          filtered = data.filter(c => c.ifi_id === user.ifi_id);
        }
        setCasos(filtered);
      } catch (e) {
        console.error('Error loading casos mora:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const filtered = casos.filter(c => {
    if (search && !`${c.cliente_nombre} ${c.certificado_numero}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filtroEstado !== 'all' && c.estado !== filtroEstado) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Casos de Mora</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de default y verificación de cobranza</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar por cliente o certificado..." />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los estados</option>
            <option value="reportado">Reportado</option>
            <option value="observado">Observado</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left">Certificado</th>
                {isAdmin(user) && <th className="px-4 py-3 text-left">IFI</th>}
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-right">Monto Garantizado</th>
                <th className="px-4 py-3 text-center">Días Mora</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-left">Reportado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin(user) ? 7 : 6} className="px-4 py-12 text-center text-gray-400">
                  <AlertTriangle size={32} className="mx-auto mb-2 text-gray-300" />
                  No hay casos de mora
                </td></tr>
              ) : filtered.map(caso => (
                <tr key={caso.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/casos-mora/${caso.id}`}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-900 font-medium">{caso.certificado_numero}</td>
                  {isAdmin(user) && <td className="px-4 py-3 text-gray-600">{caso.ifi_nombre}</td>}
                  <td className="px-4 py-3 font-medium text-gray-900">{caso.cliente_nombre}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(caso.monto_garantizado)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{caso.dias_mora}</td>
                  <td className="px-4 py-3 text-center"><EstadoBadge estado={caso.estado} tipo="mora" /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(caso.fecha_primer_incumplimiento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}