import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, AlertTriangle, Clock, Receipt } from 'lucide-react';
import { useCurrentUser, isAdmin, isBancoUser } from '@/lib/useCurrentUser';
import { formatDate } from '@/lib/calculos';

const TIPO_CONFIG = {
  mora_proxima: { icon: AlertTriangle, color: '#D97706', bg: '#FEF3C7' },
  mora_vencida: { icon: AlertTriangle, color: '#DC2626', bg: '#FEE2E2' },
  siniestro_proximo: { icon: Clock, color: '#EA580C', bg: '#FFEDD5' },
  liquidacion_vencida: { icon: Receipt, color: '#DC2626', bg: '#FEE2E2' },
  liquidacion_proxima: { icon: Receipt, color: '#D97706', bg: '#FEF3C7' }
};

export default function AlertBell() {
  const { user } = useCurrentUser();
  const [alertas, setAlertas] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const loadAlertas = async () => {
    if (!user) return;
    try {
      let all = await base44.entities.Alerta.list('-fecha_creacion', 50);
      // Filter by IFI for banco users
      if (isBancoUser(user) && user.ifi_id) {
        all = all.filter(a => !a.ifi_id || a.ifi_id === user.ifi_id);
      }
      setAlertas(all);
    } catch (e) {
      console.error('Error loading alertas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertas();
    // Refresh every 60 seconds
    const interval = setInterval(loadAlertas, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const noLeidas = alertas.filter(a => !a.leida).length;

  const handleMarkRead = async (alertaId) => {
    try {
      await base44.entities.Alerta.update(alertaId, { leida: true });
      setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, leida: true } : a));
    } catch (e) {
      console.error('Error marking read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alertas.filter(a => !a.leida);
    for (const a of unread) {
      try {
        await base44.entities.Alerta.update(a.id, { leida: true });
      } catch (e) { /* ignore */ }
    }
    setAlertas(prev => prev.map(a => ({ ...a, leida: true })));
  };

  const getAlertLink = (alerta) => {
    if (alerta.caso_mora_id) return `/casos-mora/${alerta.caso_mora_id}`;
    if (alerta.liquidacion_id) return `/liquidaciones`;
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        title="Alertas"
      >
        <Bell size={20} className={noLeidas > 0 ? 'text-yellow-300' : 'text-blue-200'} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-blue-900" />
              <h3 className="font-semibold text-gray-900 text-sm">Alertas</h3>
              {noLeidas > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">{noLeidas} nuevas</span>}
            </div>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Marcar todas leídas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-800 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : alertas.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={28} className="text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-400">No hay alertas</p>
              </div>
            ) : alertas.map(alerta => {
              const config = TIPO_CONFIG[alerta.tipo] || TIPO_CONFIG.mora_proxima;
              const Icon = config.icon;
              const link = getAlertLink(alerta);
              return (
                <div
                  key={alerta.id}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!alerta.leida ? 'bg-blue-50/40' : ''}`}
                  onClick={() => {
                    handleMarkRead(alerta.id);
                    if (link) {
                      window.location.href = link;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bg }}>
                      <Icon size={15} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alerta.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{alerta.mensaje}</p>
                      {alerta.fecha_limite && (
                        <p className="text-xs mt-1 font-medium" style={{ color: config.color }}>
                          {alerta.dias_restantes != null
                            ? alerta.dias_restantes > 0
                              ? `Faltan ${alerta.dias_restantes} días · Vence ${formatDate(alerta.fecha_limite)}`
                              : `Vencido hace ${Math.abs(alerta.dias_restantes)} días`
                            : `Vence ${formatDate(alerta.fecha_limite)}`}
                        </p>
                      )}
                    </div>
                    {!alerta.leida && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}