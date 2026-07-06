import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isAdmin, isBancoUser } from '@/lib/useCurrentUser';
import {
  ArrowLeft, FileText, Upload, User, Shield, DollarSign,
  AlertTriangle, Calendar, Download, FileCheck, FilePlus
} from 'lucide-react';
import BandaBadge from '@/components/BandaBadge';
import EstadoBadge from '@/components/EstadoBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/calculos';
import { TARIFARIO } from '@/lib/tarifario';

const DOC_TYPES = [
  { value: 'contrato', label: 'Contrato de crédito firmado' },
  { value: 'cedula', label: 'Cédula/RUC del beneficiario' },
  { value: 'solicitud', label: 'Solicitud de crédito' },
  { value: 'soporte', label: 'Documento de soporte adicional' }
];

export default function CertificadoDetail() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const [cert, setCert] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [docTipo, setDocTipo] = useState('contrato');
  const [docFile, setDocFile] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const certData = await base44.entities.Certificado.get(id);
        setCert(certData);
        const docs = await base44.entities.DocumentoExpediente.filter({ certificado_id: id });
        setDocumentos(docs);
      } catch (e) {
        console.error('Error loading certificado:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleUpload = async () => {
    if (!docFile) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: docFile });
      await base44.entities.DocumentoExpediente.create({
        certificado_id: id,
        certificado_numero: cert.numero,
        tipo: docTipo,
        tipo_label: DOC_TYPES.find(d => d.value === docTipo)?.label || docTipo,
        nombre_archivo: docFile.name,
        file_url,
        fecha_carga: new Date().toISOString(),
        cargado_por: user?.full_name || 'Usuario'
      });
      const docs = await base44.entities.DocumentoExpediente.filter({ certificado_id: id });
      setDocumentos(docs);
      setShowUpload(false);
      setDocFile(null);
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleReportMora = () => {
    window.location.href = `/casos-mora/nuevo?cert_id=${id}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  if (!cert) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Certificado no encontrado</p>
        <Link to="/certificados" className="mt-3 inline-block text-blue-600 text-sm">Volver a certificados</Link>
      </div>
    );
  }

  const bandaInfo = TARIFARIO[cert.banda];
  const canEdit = !isBancoUser(user) ? isAdmin(user) && user?.tipo_usuario === 'admin_acidpay' : true;
  const canUpload = user?.tipo_usuario === 'admin_acidpay' || user?.tipo_usuario === 'oficial_comercial';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link to="/certificados" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{cert.numero}</h1>
            <EstadoBadge estado={cert.estado} size="md" />
          </div>
          <p className="text-sm text-gray-500 mt-1">{cert.cliente_nombre} · {cert.ifi_nombre}</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-x divide-gray-100">
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Shield size={12} /> Banda de Riesgo</p>
            <div className="mt-2"><BandaBadge banda={cert.banda} size="md" /></div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{cert.score}</p>
            <p className="text-xs text-gray-400">Score del beneficiario</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><DollarSign size={12} /> Monto Garantizado</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(cert.monto_garantizado)}</p>
            <p className="text-xs text-gray-400">{formatCurrency(cert.monto_credito)} crédito · {(cert.porcentaje_cobertura * 100).toFixed(0)}% cobertura</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Prima ACIDPAY</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: bandaInfo?.color }}>{formatCurrency(cert.prima_valor)}</p>
            <p className="text-xs text-gray-400">{(cert.prima_porcentaje * 100).toFixed(2)}% sobre garantizado</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tasa Total al Cliente</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{cert.tasa_total?.toFixed(2)}%</p>
            <p className="text-xs text-gray-400">Base {cert.tasa_base}% + prima</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User size={16} className="text-blue-900" />
            <h2 className="font-semibold text-gray-900 text-sm">Datos del Cliente</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div><p className="text-xs text-gray-400">Nombre</p><p className="font-medium text-gray-900">{cert.cliente_nombre}</p></div>
            <div><p className="text-xs text-gray-400">Cédula/RUC</p><p className="font-medium text-gray-900">{cert.cliente_cedula}</p></div>
            <div><p className="text-xs text-gray-400">Segmento</p><p className="font-medium text-gray-900">{cert.segmento}</p></div>
            <div><p className="text-xs text-gray-400">Destino del crédito</p><p className="font-medium text-gray-900">{cert.destino_credito || '—'}</p></div>
            <div><p className="text-xs text-gray-400">Oficial comercial</p><p className="font-medium text-gray-900">{cert.ofi_nombre || '—'}</p></div>
            <div><p className="text-xs text-gray-400">Plazo</p><p className="font-medium text-gray-900">{cert.plazo_meses} meses</p></div>
            <div><p className="text-xs text-gray-400">Cuota mensual estimada</p><p className="font-medium text-gray-900">{formatCurrency(cert.cuota_mensual)}</p></div>
            <div><p className="text-xs text-gray-400">Fecha de emisión</p><p className="font-medium text-gray-900">{formatDate(cert.fecha_emision)}</p></div>
          </div>
        </div>

        {/* Expediente */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-900" />
              <h2 className="font-semibold text-gray-900 text-sm">Expediente del Cliente</h2>
            </div>
            {canUpload && (
              <button onClick={() => setShowUpload(!showUpload)}
                className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-medium hover:bg-blue-800 flex items-center gap-1.5 transition-colors">
                <FilePlus size={14} /> Subir documento
              </button>
            )}
          </div>

          {/* Upload form */}
          {showUpload && (
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
              <select value={docTipo} onChange={e => setDocTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setDocFile(e.target.files[0])}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
              <button onClick={handleUpload} disabled={!docFile || uploading}
                className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-40 flex items-center gap-2 transition-colors">
                {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Subiendo...</> : <><Upload size={14} /> Confirmar carga</>}
              </button>
            </div>
          )}

          {/* Documents list */}
          <div className="divide-y divide-gray-50">
            {documentos.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FileText size={32} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No hay documentos cargados</p>
              </div>
            ) : documentos.map(doc => (
              <div key={doc.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileCheck size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.tipo_label || doc.tipo}</p>
                  <p className="text-xs text-gray-400 truncate">{doc.nombre_archivo} · {formatDateTime(doc.fecha_carga)}</p>
                </div>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download size={16} className="text-gray-500 hover:text-blue-600" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {cert.estado === 'vigente' && (user?.tipo_usuario === 'oficial_comercial' || user?.tipo_usuario === 'supervisor_banco') && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">¿El beneficiario entró en mora?</p>
            <p className="text-xs text-amber-700">Reporte el caso para iniciar la verificación de gestión de cobranza</p>
          </div>
          <button onClick={handleReportMora}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-500 transition-colors whitespace-nowrap">
            Reportar Mora
          </button>
        </div>
      )}
    </div>
  );
}