import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isAdmin, isBancoUser, isReadOnly } from '@/lib/useCurrentUser';
import { Receipt, DollarSign, Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import EstadoBadge from '@/components/EstadoBadge';
import { formatCurrency, formatDate, getMesLabel } from '@/lib/calculos';
import { ESTADOS_LIQUIDACION } from '@/lib/tarifario';

export default function Liquidaciones() {
  const { user } = useCurrentUser();
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [ifis, setIfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLiq, setSelectedLiq] = useState(null);
  const [pagoFecha, setPagoFecha] = useState('');
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoReferencia, setPagoReferencia] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [liqs, ifiList] = await Promise.all([
          base44.entities.Liquidacion.list('-mes', 100),
          isAdmin(user) ? base44.entities.IFI.list() : Promise.resolve([])
        ]);

        let filtered = liqs;
        if (isBancoUser(user) && user.ifi_id) {
          filtered = liqs.filter(l => l.ifi_id === user.ifi_id);
        }

        setLiquidaciones(filtered);
        setIfis(ifiList);
      } catch (e) {
        console.error('Error loading liquidaciones:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleRegistrarPago = async () => {
    if (!selectedLiq || !pagoMonto) return;
    setSaving(true);
    try {
      const monto = parseFloat(pagoMonto);
      const estado = monto >= selectedLiq.prima_total ? 'pagada' : 'parcial';
      await base44.entities.Liquidacion.update(selectedLiq.id, {
        pago_fecha: pagoFecha,
        pago_monto: monto,
        pago_referencia: pagoReferencia,
        estado
      });
      const liqs = await base44.entities.Liquidacion.list('-mes', 100);
      let filtered = liqs;
      if (isBancoUser(user) && user.ifi_id) {
        filtered = liqs.filter(l => l.ifi_id === user.ifi_id);
      }
      setLiquidaciones(filtered);
      setSelectedLiq(null);
      setPagoFecha(''); setPagoMonto(''); setPagoReferencia('');
    } catch (e) {
      console.error('Error registrando pago:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  // Group by IFI
  const grouped = {};
  liquidaciones.forEach(l => {
    if (!grouped[l.ifi_nombre]) grouped[l.ifi_nombre] = [];
    grouped[l.ifi_nombre].push(l);
  });

  const totalPendiente = liquidaciones
    .filter(l => l.estado === 'pendiente' || l.estado === 'vencida' || l.estado === 'parcial')
    .reduce((s, l) => s + (l.prima_total - (l.pago_monto || 0)), 0);

  const totalPagado = liquidaciones
    .filter(l => l.estado === 'pagada')
    .reduce((s, l) => s + (l.pago_monto || l.prima_total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Liquidaciones Mensuales</h1>
        <p className="text-sm text-gray-500 mt-1">Estados de cuenta por IFI y mes</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Pagado</p>
            <CheckCircle2 size={18} className="text-green-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-green-700">{formatCurrency(totalPagado)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Pendiente</p>
            <AlertCircle size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-amber-700">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Liquidaciones Totales</p>
            <Receipt size={18} className="text-blue-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-gray-900">{liquidaciones.length}</p>
        </div>
      </div>

      {/* Liquidaciones grouped by IFI */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([ifiNombre, liqs]) => (
          <div key={ifiNombre} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">{ifiNombre}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {liqs.map(liq => {
                const est = ESTADOS_LIQUIDACION[liq.estado];
                const isOverdue = liq.estado === 'pendiente' && liq.fecha_limite_pago && new Date(liq.fecha_limite_pago) < new Date();
                return (
                  <div key={liq.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-900">{getMesLabel(liq.mes)}</p>
                        <EstadoBadge estado={liq.estado} tipo="liquidacion" />
                        {isOverdue && <span className="text-xs text-red-600 font-medium">Vencida</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        <span>{liq.numero_certificados} certificados</span>
                        <span>Garantizado: {formatCurrency(liq.monto_total_garantizado)}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> Vence: {formatDate(liq.fecha_limite_pago)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(liq.prima_total)}</p>
                      {liq.pago_monto && <p className="text-xs text-green-600">Pagado: {formatCurrency(liq.pago_monto)}</p>}
                    </div>
                    {!isReadOnly(user) && (user?.tipo_usuario === 'admin_acidpay') && liq.estado !== 'pagada' && (
                      <button onClick={() => { setSelectedLiq(liq); setPagoMonto(liq.prima_total.toString()); setPagoFecha(new Date().toISOString().split('T')[0]); }}
                        className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-medium hover:bg-blue-800 transition-colors whitespace-nowrap">
                        Registrar pago
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Payment modal */}
      {selectedLiq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedLiq(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">Registrar Pago</h3>
            <p className="text-sm text-gray-500 mt-1">{selectedLiq.ifi_nombre} — {getMesLabel(selectedLiq.mes)}</p>
            <p className="mt-3 text-sm text-gray-600">Prima total: <span className="font-bold">{formatCurrency(selectedLiq.prima_total)}</span></p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monto recibido (USD)</label>
                <input type="number" value={pagoMonto} onChange={e => setPagoMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de pago</label>
                <input type="date" value={pagoFecha} onChange={e => setPagoFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Referencia bancaria</label>
                <input value={pagoReferencia} onChange={e => setPagoReferencia(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Transferencia #..." />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setSelectedLiq(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleRegistrarPago} disabled={!pagoMonto || saving}
                className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-40 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Guardando...</> : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}