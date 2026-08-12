import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Calculator, User, FileCheck, CheckCircle2, Info, FileText } from 'lucide-react';
import ResultadoCotizacionPN from '@/components/cotizador/ResultadoCotizacionPN';
import EscenariosDemoPanel from '@/components/cotizador/EscenariosDemoPanel';
import { cotizarPN, formatPct } from '@/lib/motorTarifarioPN';
import { TARIFARIO_PN, getBandaConfig, ESTADOS_COTIZACION } from '@/lib/tarifarioPN';
import {
  DEMO_MODE,
  buscarEscenarioDemo,
  CEDULA_PLACEHOLDER_DEMO
} from '@/lib/escenariosDemoPN';

export default function Cotizador() {
  const { user } = useCurrentUser();
  const [ifi, setIfi] = useState(null);
  const [loadingIfi, setLoadingIfi] = useState(true);

  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteCedula, setClienteCedula] = useState('');
  const [destino, setDestino] = useState('');
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('12');
  const [cobertura, setCobertura] = useState('');

  const [cotizacion, setCotizacion] = useState(null);
  const [error, setError] = useState(null);
  const [emitido, setEmitido] = useState(null);

  useEffect(() => {
    async function loadIFI() {
      if (user?.ifi_id) {
        try {
          setIfi(await base44.entities.IFI.get(user.ifi_id));
        } catch { /* ignore */ }
      }
      setLoadingIfi(false);
    }
    loadIFI();
  }, [user]);

  const escenario = buscarEscenarioDemo(clienteNombre);

  const aplicarEscenario = (esc) => {
    setClienteNombre(esc.nombre);
    setClienteCedula(CEDULA_PLACEHOLDER_DEMO);
    setMonto(String(esc.monto_sugerido));
    setCobertura(String(getBandaConfig(esc.banda).cobertura));
    setCotizacion(null);
    setError(null);
    setEmitido(null);
  };

  const handleCotizar = () => {
    setError(null);
    setEmitido(null);
    const esc = buscarEscenarioDemo(clienteNombre);
    if (!esc) {
      setCotizacion(null);
      setError(
        DEMO_MODE
          ? 'Sin score disponible. La consulta al buró de crédito no está integrada; en modo demo use uno de los nombres de escenario.'
          : 'Sin score disponible. La consulta al buró de crédito no está integrada todavía.'
      );
      return;
    }
    try {
      setCotizacion(
        cotizarPN({
          montoCredito: monto,
          plazoMeses: parseInt(plazo, 10),
          score: esc.score,
          coberturaAplicada: cobertura !== '' ? cobertura : undefined,
          esDemo: true
        })
      );
    } catch (e) {
      setCotizacion(null);
      setError(e.message);
    }
  };

  const handleReset = () => {
    setClienteNombre(''); setClienteCedula(''); setDestino('');
    setMonto(''); setPlazo('12'); setCobertura('');
    setCotizacion(null); setError(null); setEmitido(null);
  };

  const puedeEmitir =
    cotizacion && !cotizacion.es_demo && ESTADOS_COTIZACION[cotizacion.estado].emisible;

  const handleEmitir = async () => {
    if (!puedeEmitir) return;
    const now = new Date();
    const cert = await base44.entities.Certificado.create({
      numero: `ACP-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
      ifi_id: user.ifi_id,
      ifi_nombre: ifi?.nombre,
      ofi_nombre: user.full_name,
      cliente_nombre: clienteNombre,
      cliente_cedula: clienteCedula,
      segmento: 'Persona Natural',
      destino_credito: destino,
      monto_credito: cotizacion.monto_credito,
      plazo_meses: cotizacion.plazo_meses,
      score: cotizacion.score,
      banda: cotizacion.banda,
      porcentaje_cobertura: cotizacion.cobertura_aplicada,
      monto_garantizado: cotizacion.monto_garantizado,
      prima_porcentaje: cotizacion.prima_total_pct,
      prima_valor: cotizacion.prima_usd,
      cuota_mensual: cotizacion.cuota_mensual,
      estado: 'vigente',
      fecha_emision: now.toISOString().split('T')[0],
      mes_liquidacion: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    });
    setEmitido(cert);
  };

  if (loadingIfi) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  const coberturaBanda = escenario ? getBandaConfig(escenario.banda).cobertura : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizador de Garantía</h1>
          <p className="text-sm text-gray-600 mt-1">
            Persona Natural · consumo y microcrédito · tarifario {TARIFARIO_PN.version}
          </p>
        </div>
        {ifi && (
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: ifi.color_hex || '#1B4F8A' }}
            >
              {ifi.logo_iniciales || ifi.codigo}
            </div>
            <div>
              <p className="text-xs text-gray-500">Institución cotizante</p>
              <p className="text-sm font-bold text-gray-900">{ifi.nombre}</p>
            </div>
            <div className="ml-2 pl-3 border-l border-gray-200">
              <p className="text-xs text-gray-500">Tasa del crédito (TEA)</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatPct(TARIFARIO_PN.tea_banco, 2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {emitido ? (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-8 text-center">
          <CheckCircle2 size={40} className="text-green-700 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Certificado de garantía emitido</h2>
          <p className="mt-4 text-2xl font-bold text-blue-900 font-mono">{emitido.numero}</p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href={`/certificados/${emitido.id}`}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
            >
              Ver expediente
            </a>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Nueva cotización
            </button>
          </div>
        </div>
      ) : (
        <>
          {DEMO_MODE && <EscenariosDemoPanel onSeleccionar={aplicarEscenario} />}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <User size={18} className="text-blue-900" />
                <h2 className="font-semibold text-gray-900">Datos del beneficiario</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nombres completos
                  </label>
                  <input
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {escenario && (
                    <p className="mt-1 text-[11px] text-purple-800">
                      Escenario demo · score sembrado {escenario.score} · banda {escenario.banda}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cédula / RUC</label>
                  <input
                    value={clienteCedula}
                    onChange={(e) => setClienteCedula(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Destino del crédito
                  </label>
                  <input
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Consumo, microcrédito..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 pb-3 border-t border-b border-gray-100">
                <FileCheck size={18} className="text-blue-900" />
                <h2 className="font-semibold text-gray-900">Datos de la operación</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Monto formalizado (USD)
                  </label>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Plazo (meses)
                  </label>
                  <input
                    type="number"
                    value={plazo}
                    onChange={(e) => setPlazo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Cobertura aplicada
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cobertura}
                    onChange={(e) => setCobertura(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder={coberturaBanda || 'por banda'}
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Fracción. Techo duro {formatPct(TARIFARIO_PN.cobertura_maxima, 0)} por operación.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCotizar}
                disabled={!clienteNombre || !monto || !plazo}
                className="w-full py-2.5 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Calculator size={16} /> Cotizar garantía
              </button>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs text-red-900">{error}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              {cotizacion ? (
                <>
                  <ResultadoCotizacionPN cotizacion={cotizacion} />
                  <button
                    onClick={handleEmitir}
                    disabled={!puedeEmitir}
                    className="w-full py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FileText size={16} /> Emitir certificado de garantía
                  </button>
                  {!puedeEmitir && (
                    <p className="text-[11px] text-gray-500 text-center">
                      {cotizacion.es_demo
                        ? 'Un escenario demo nunca puede convertirse en un certificado real.'
                        : 'La emisión requiere la liberación indicada en el estado de la cotización.'}
                    </p>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                  <Calculator size={32} className="text-gray-300 mx-auto" />
                  <p className="mt-3 text-sm text-gray-600">
                    Complete los datos y presione «Cotizar garantía».
                  </p>
                  <div className="mt-4 flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-left">
                    <Info size={14} className="text-blue-700 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-900">
                      La prima de garantía se calcula sobre el monto garantizado, no sobre el monto
                      total del crédito.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}