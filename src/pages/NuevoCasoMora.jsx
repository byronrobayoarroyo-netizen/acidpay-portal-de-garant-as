import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { ArrowLeft, AlertTriangle, Save, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/calculos';

export default function NuevoCasoMora() {
  const { id: certId } = useParams();
  const [searchParams] = useSearchParams();
  const certificadoId = certId || searchParams.get('cert_id');
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fechaIncumplimiento, setFechaIncumplimiento] = useState('');
  const [diasMora, setDiasMora] = useState('');
  const [evidencia, setEvidencia] = useState('');

  useEffect(() => {
    async function loadCert() {
      if (!certificadoId) { setLoading(false); return; }
      try {
        const c = await base44.entities.Certificado.get(certificadoId);
        setCert(c);
      } catch (e) {
        console.error('Error loading cert:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCert();
  }, [certificadoId]);

  const handleSubmit = async () => {
    if (!cert || !fechaIncumplimiento || !evidencia) return;
    setSaving(true);
    try {
      const caso = await base44.entities.CasoMora.create({
        certificado_id: cert.id,
        certificado_numero: cert.numero,
        ifi_id: cert.ifi_id,
        ifi_nombre: cert.ifi_nombre,
        cliente_nombre: cert.cliente_nombre,
        cliente_cedula: cert.cliente_cedula,
        monto_garantizado: cert.monto_garantizado,
        fecha_primer_incumplimiento: fechaIncumplimiento,
        dias_mora: parseInt(diasMora) || 0,
        evidencia_gestion: evidencia,
        estado: 'reportado'
      });

      await base44.entities.BitacoraCaso.create({
        caso_mora_id: caso.id,
        usuario_nombre: user?.full_name || 'Usuario',
        accion: 'Caso reportado',
        detalle: `Mora reportada por ${user?.full_name || 'usuario'}. Fecha de incumplimiento: ${fechaIncumplimiento}`,
        fecha: new Date().toISOString()
      });

      await base44.entities.Certificado.update(cert.id, { estado: 'en_mora' });

      navigate(`/casos-mora/${caso.id}`);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  if (!cert) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Certificado no encontrado</p>
        <button onClick={() => navigate('/certificados')} className="mt-3 text-blue-600 text-sm">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportar Caso de Mora</h1>
          <p className="text-sm text-gray-500 mt-1">{cert.numero} · {cert.cliente_nombre}</p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Verificación de gestión de cobranza</p>
          <p className="text-xs text-amber-700 mt-1">Antes de reportar la mora, asegúrese de documentar toda la gestión de cobranza realizada. ACIDPAY revisará esta evidencia antes de aprobar cualquier pago de siniestro.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
          <div><p className="text-xs text-gray-400">Cliente</p><p className="text-sm font-medium text-gray-900">{cert.cliente_nombre}</p></div>
          <div><p className="text-xs text-gray-400">Monto garantizado</p><p className="text-sm font-bold text-gray-900">{formatCurrency(cert.monto_garantizado)}</p></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><Calendar size={12} /> Fecha de primer incumplimiento</label>
            <input type="date" value={fechaIncumplimiento} onChange={e => setFechaIncumplimiento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Días de mora</label>
            <input type="number" value={diasMora} onChange={e => setDiasMora(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="30" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Evidencia de gestión de cobranza</label>
          <textarea value={evidencia} onChange={e => setEvidencia(e.target.value)} rows={8}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detalle la gestión de cobranza realizada: registro de llamadas, notificaciones enviadas, visitas, acuerdos de pago intentados, fechas de cada gestión..." />
          <p className="mt-1 text-xs text-gray-400">Incluya fechas, tipos de contacto y resultados de cada acción de cobranza.</p>
        </div>

        <button onClick={handleSubmit} disabled={!fechaIncumplimiento || !evidencia || saving}
          className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-500 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Guardando...</> : <><Save size={16} /> Reportar Mora</>}
        </button>
      </div>
    </div>
  );
}