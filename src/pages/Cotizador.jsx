import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser, isBancoUser, isAdmin } from '@/lib/useCurrentUser';
import {
  Calculator, User, FileCheck, Shield, CheckCircle2, XCircle,
  Clock, FileText, DollarSign, TrendingUp, Info
} from 'lucide-react';
import BandaBadge from '@/components/BandaBadge';
import { simulateScore, getBandaFromScore, calcularCotizacion, generateCertificadoNumero, formatCurrency } from '@/lib/calculos';
import { TARIFARIO } from '@/lib/tarifario';

export default function Cotizador() {
  const { user } = useCurrentUser();
  const [ifi, setIfi] = useState(null);
  const [loadingIfi, setLoadingIfi] = useState(true);

  // Form state
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCedula, setClienteCedula] = useState('');
  const [segmento, setSegmento] = useState('Persona Natural');
  const [destino, setDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('');

  // Result state
  const [cotizacion, setCotizacion] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [emitido, setEmitido] = useState(null);

  useEffect(() => {
    async function loadIFI() {
      if (user?.ifi_id) {
        try {
          const ifiData = await base44.entities.IFI.get(user.ifi_id);
          setIfi(ifiData);
        } catch { /* ignore */ }
      }
      setLoadingIfi(false);
    }
    loadIFI();
  }, [user]);

  if (loadingIfi) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin"></div></div>;
  }

  const tasaBase = ifi?.tasa_base || 12;

  const handleCotizar = () => {
    if (!clienteNombre || !clienteCedula || !monto || !plazo) return;
    setCalculando(true);
    setEmitido(null);

    setTimeout(() => {
      const score = simulateScore(clienteCedula);
      const banda = getBandaFromScore(score);
      const calc = calcularCotizacion(parseFloat(monto), parseInt(plazo), banda, tasaBase, ifi?.cobertura_base);
      setCotizacion({ score, banda, ...calc });
      setCalculando(false);
    }, 800);
  };

  const handleEmitir = async () => {
    if (!cotizacion) return;
    try {
      const now = new Date();
      const mesLiq = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const numero = generateCertificadoNumero(now);

      const cert = await base44.entities.Certificado.create({
        numero,
        ifi_id: user.ifi_id,
        ifi_nombre: ifi.nombre,
        ofi_nombre: user.full_name,
        cliente_nombre: clienteNombre,
        cliente_cedula: clienteCedula,
        segmento,
        destino_credito: destino,
        monto_credito: parseFloat(monto),
        plazo_meses: parseInt(plazo),
        score: cotizacion.score,
        banda: cotizacion.banda,
        porcentaje_cobertura: cotizacion.porcentajeCobertura,
        monto_garantizado: cotizacion.montoGarantizado,
        tasa_base: tasaBase,
        prima_porcentaje: cotizacion.primaPorcentaje,
        prima_valor: cotizacion.primaValor,
        tasa_total: cotizacion.tasaTotal,
        cuota_mensual: cotizacion.cuotaMensual,
        estado: 'vigente',
        fecha_emision: now.toISOString().split('T')[0],
        mes_liquidacion: mesLiq
      });
      setEmitido(cert);
    } catch (e) {
      console.error('Error emitiendo certificado:', e);
    }
  };

  const handleReset = () => {
    setClienteNombre(''); setClienteCedula(''); setDestino('');
    setMonto(''); setPlazo(''); setCotizacion(null); setEmitido(null);
  };

  const bandaInfo = cotizacion ? TARIFARIO[cotizacion.banda] : null;
  const isNegativa = cotizacion?.banda === 'E';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cotizador de Garantía</h1>
        <p className="text-sm text-gray-500 mt-1">
          {ifi ? `${ifi.nombre} · Tasa base: ${tasaBase}% anual` : 'Ingrese los datos del cliente y la operación'}
        </p>
      </div>

      {emitido ? (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Certificado Emitido</h2>
          <p className="mt-1 text-sm text-gray-500">El certificado se ha generado correctamente</p>
          <div className="mt-6 inline-flex flex-col items-center gap-2 bg-gray-50 rounded-xl px-8 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Número de Certificado</p>
            <p className="text-2xl font-bold text-blue-900 font-mono">{emitido.numero}</p>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <a href={`/certificados/${emitido.id}`} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
              Ver Expediente
            </a>
            <button onClick={handleReset} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Nueva Cotización
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <User size={18} className="text-blue-900" />
              <h2 className="font-semibold text-gray-900">Datos del Cliente</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombres completos</label>
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cédula / RUC</label>
                <input value={clienteCedula} onChange={e => setClienteCedula(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1712345678" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Segmento</label>
                <select value={segmento} onChange={e => setSegmento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Persona Natural</option>
                  <option>PYME</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Destino del crédito</label>
                <input value={destino} onChange={e => setDestino(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Consumo, Vivienda, Comercio..." />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 pb-3 border-t border-b border-gray-100">
              <FileCheck size={18} className="text-blue-900" />
              <h2 className="font-semibold text-gray-900">Datos de la Operación</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monto del crédito (USD)</label>
                <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plazo (meses)</label>
                <input type="number" value={plazo} onChange={e => setPlazo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24" />
              </div>
            </div>

            <button
              onClick={handleCotizar}
              disabled={!clienteNombre || !clienteCedula || !monto || !plazo || calculando}
              className="w-full py-2.5 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {calculando ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Consultando score...</>
              ) : (
                <><Calculator size={16} /> Cotizar Garantía</>
              )}
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {cotizacion ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-0">
                <div className="px-5 py-4" style={{ backgroundColor: bandaInfo.bg, color: bandaInfo.text }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide opacity-75">Score del Beneficiario</p>
                      <p className="text-3xl font-bold">{cotizacion.score}</p>
                    </div>
                    <BandaBadge banda={cotizacion.banda} size="lg" />
                  </div>
                  <p className="mt-2 text-xs font-medium">{bandaInfo.label}</p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Aprobación level */}
                  <div className={`flex items-start gap-2 p-3 rounded-lg ${isNegativa ? 'bg-red-50' : bandaInfo.aprobacion === 'automatica' ? 'bg-green-50' : 'bg-amber-50'}`}>
                    {isNegativa ? <XCircle size={18} className="text-red-600 mt-0.5" /> : bandaInfo.aprobacion === 'automatica' ? <CheckCircle2 size={18} className="text-green-600 mt-0.5" /> : <Clock size={18} className="text-amber-600 mt-0.5" />}
                    <p className="text-xs text-gray-700">{bandaInfo.aprobacion_label}</p>
                  </div>

                  {!isNegativa && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><Shield size={14} /> % de cobertura</span>
                          <span className="text-sm font-bold text-gray-900">{(cotizacion.porcentajeCobertura * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><DollarSign size={14} /> Monto garantizado</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(cotizacion.montoGarantizado)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><TrendingUp size={14} /> Tasa total al cliente</span>
                          <span className="text-sm font-bold text-gray-900">{cotizacion.tasaTotal.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-xs text-gray-500">Cuota mensual estimada</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(cotizacion.cuotaMensual)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-xs text-gray-500 flex items-center gap-1.5"><Shield size={14} /> Prima ACIDPAY</span>
                          <span className="text-sm font-bold" style={{ color: bandaInfo.color }}>{formatCurrency(cotizacion.primaValor)}</span>
                        </div>
                      </div>

                      {/* Desglose interno */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Desglose interno (uso del banco)</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Tasa base del banco</span>
                          <span className="font-medium text-gray-700">{tasaBase.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Prima ACIDPAY (anualizada)</span>
                          <span className="font-medium text-gray-700">+{cotizacion.primaRateAnual.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                          <span className="text-gray-600 font-medium">Tasa total</span>
                          <span className="font-bold text-gray-900">{cotizacion.tasaTotal.toFixed(2)}%</span>
                        </div>
                      </div>

                      <button onClick={handleEmitir}
                        className="w-full py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                        <FileText size={16} /> Confirmar y Emitir Certificado
                      </button>
                    </>
                  )}

                  {isNegativa && (
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <XCircle size={28} className="text-red-600 mx-auto" />
                      <p className="mt-2 text-sm font-medium text-red-800">No es posible emitir certificado</p>
                      <p className="text-xs text-red-600 mt-1">Banda E: riesgo muy alto según ACIDPAY-MET-002</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <Calculator size={32} className="text-gray-300 mx-auto" />
                <p className="mt-3 text-sm text-gray-400">Complete los datos y presione "Cotizar Garantía" para ver el resultado</p>
                <div className="mt-4 flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-left">
                  <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">El score se consulta vía Equifax/Aval Buró (simulado). La prima se calcula sobre el monto garantizado, no sobre el monto total del crédito.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}