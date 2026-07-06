import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isAdmin, isBancoUser, isReadOnly } from '@/lib/useCurrentUser';
import {
  ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Clock,
  FileText, MessageSquare, Send, Calendar, Shield
} from 'lucide-react';
import EstadoBadge from '@/components/EstadoBadge';
import { formatCurrency, formatDate, formatDateTime, sumarDiasHabiles } from '@/lib/calculos';

export default function CasoMoraDetail() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const [caso, setCaso] = useState(null);
  const [bitacora, setBitacora] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDecision, setShowDecision] = useState(false);
  const [decision, setDecision] = useState('aprobado');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const casoData = await base44.entities.CasoMora.get(id);
        setCaso(casoData);
        const logs = await base44.entities.BitacoraCaso.filter({ caso_mora_id: id });
        setBitacora(logs.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      } catch (e) {
        console.error('Error loading caso mora:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleDecision = async () => {
    setSaving(true);
    try {
      const now = new Date();
      const updates = {
        estado: decision,
        motivo_decision: motivo,
        fecha_decision: now.toISOString().split('T')[0],
        decidido_por: user?.full_name || 'Admin'
      };

      if (decision === 'aprobado') {
        const fechaAprob = now.toISOString().split('T')[0];
        const fechaLimite = sumarDiasHabiles(now, 8);
        updates.fecha_aprobacion = fechaAprob;
        updates.fecha_limite_pago_siniestro = fechaLimite.toISOString().split('T')[0];
      }

      await base44.entities.CasoMora.update(id, updates);

      await base44.entities.BitacoraCaso.create({
        caso_mora_id: id,
        usuario_nombre: user?.full_name || 'Admin',
        accion: `Caso ${decision}`,
        detalle: motivo || `Decisión: ${decision}`,
        fecha: now.toISOString()
      });

      const updated = await base44.entities.CasoMora.get(id);
      setCaso(updated);
      const logs = await base44.entities.BitacoraCaso.filter({ caso_mora_id: id });
      setBitacora(logs.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      setShowDecision(false);
      setMotivo('');
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await base44.entities.BitacoraCaso.create({
        caso_mora_id: id,
        usuario_nombre: user?.full_name || 'Usuario',
        accion: 'Nota',
        detalle: newNote,
        fecha: new Date().toISOString()
      });
      const logs = await base44.entities.BitacoraCaso.filter({ caso_mora_id: id });
      setBitacora(logs.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      setNewNote('');
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  if (!caso) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Caso no encontrado</p>
        <Link to="/casos-mora" className="mt-3 inline-block text-blue-600 text-sm">Volver a casos de mora</Link>
      </div>
    );
  }

  const canDecide = user?.tipo_usuario === 'admin_acidpay' && caso.estado === 'reportado';
  const canObserve = user?.tipo_usuario === 'admin_acidpay' && caso.estado === 'observado';

  // Calculate 8-day countdown
  let diasRestantes = null;
  if (caso.estado === 'aprobado' && caso.fecha_aprobacion) {
    const limite = new Date(caso.fecha_limite_pago_siniestro);
    const now = new Date();
    diasRestantes = Math.ceil((limite - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/casos-mora" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Caso de Mora</h1>
            <EstadoBadge estado={caso.estado} tipo="mora" size="md" />
          </div>
          <p className="text-sm text-gray-500 mt-1">{caso.certificado_numero} · {caso.cliente_nombre} · {caso.ifi_nombre}</p>
        </div>
      </div>

      {/* Countdown banner */}
      {caso.estado === 'aprobado' && diasRestantes !== null && (
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${diasRestantes <= 2 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <Clock size={24} className={diasRestantes <= 2 ? 'text-red-600' : 'text-green-600'} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Cronómetro reglamentario de pago de siniestro</p>
            <p className="text-xs text-gray-500">Aprobado: {formatDate(caso.fecha_aprobacion)} · Vence: {formatDate(caso.fecha_limite_pago_siniestro)}</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${diasRestantes <= 2 ? 'text-red-600' : 'text-green-700'}`}>{diasRestantes}</p>
            <p className="text-xs text-gray-500">días restantes</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case details */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Shield size={16} className="text-blue-900" />
              <h2 className="font-semibold text-gray-900 text-sm">Datos del Siniestro</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-gray-400">Cliente</p><p className="font-medium text-gray-900">{caso.cliente_nombre}</p></div>
              <div><p className="text-xs text-gray-400">Cédula</p><p className="font-medium text-gray-900">{caso.cliente_cedula || '—'}</p></div>
              <div><p className="text-xs text-gray-400">Monto garantizado</p><p className="font-medium text-gray-900">{formatCurrency(caso.monto_garantizado)}</p></div>
              <div><p className="text-xs text-gray-400">Fecha primer incumplimiento</p><p className="font-medium text-gray-900">{formatDate(caso.fecha_primer_incumplimiento)}</p></div>
              <div><p className="text-xs text-gray-400">Días de mora</p><p className="font-medium text-gray-900">{caso.dias_mora} días</p></div>
              {caso.fecha_decision && (
                <>
                  <div><p className="text-xs text-gray-400">Decidido por</p><p className="font-medium text-gray-900">{caso.decidido_por}</p></div>
                  <div><p className="text-xs text-gray-400">Fecha de decisión</p><p className="font-medium text-gray-900">{formatDate(caso.fecha_decision)}</p></div>
                  {caso.motivo_decision && (
                    <div><p className="text-xs text-gray-400">Motivo</p><p className="text-xs text-gray-700 mt-0.5">{caso.motivo_decision}</p></div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <FileText size={16} className="text-blue-900" />
              <h2 className="font-semibold text-gray-900 text-sm">Evidencia de Gestión de Cobranza</h2>
            </div>
            <p className="mt-3 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{caso.evidencia_gestion || 'Sin evidencia registrada'}</p>
          </div>
        </div>

        {/* Bitácora and actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Decision buttons */}
          {(canDecide || canObserve) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Decisión de ACIDPAY</h2>
              {!showDecision ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setShowDecision(true); setDecision('aprobado'); }}
                    className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-2 transition-colors">
                    <CheckCircle2 size={16} /> Aprobar
                  </button>
                  <button onClick={() => { setShowDecision(true); setDecision('observado'); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 flex items-center gap-2 transition-colors">
                    <AlertTriangle size={16} /> Observar
                  </button>
                  <button onClick={() => { setShowDecision(true); setDecision('rechazado'); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 flex items-center gap-2 transition-colors">
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Decisión:</span>
                    <EstadoBadge estado={decision} tipo="mora" />
                  </div>
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={decision === 'aprobado' ? 'Confirme que la gestión de cobranza cumple con el Convenio Marco...' : decision === 'observado' ? 'Indique qué evidencia falta o debe corregirse...' : 'Documente el motivo del rechazo...'} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowDecision(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button onClick={handleDecision} disabled={saving}
                      className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-40 flex items-center gap-2">
                      {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Procesando...</> : 'Confirmar decisión'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bitácora */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-900" />
              <h2 className="font-semibold text-gray-900 text-sm">Bitácora del Caso</h2>
            </div>
            <div className="p-5 space-y-3">
              {bitacora.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin registros en la bitácora</p>
              ) : bitacora.map((entry, idx) => (
                <div key={entry.id || idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    </div>
                    {idx < bitacora.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{entry.accion}</p>
                      <span className="text-xs text-gray-400">{formatDateTime(entry.fecha)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{entry.usuario_nombre}</p>
                    {entry.detalle && <p className="text-xs text-gray-600 mt-1">{entry.detalle}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Add note */}
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input value={newNote} onChange={e => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agregar comentario a la bitácora..." />
                <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
                  className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-40 flex items-center gap-1 transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}