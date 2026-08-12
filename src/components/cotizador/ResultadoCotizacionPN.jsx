import { FlaskConical, Lock, ShieldCheck } from 'lucide-react';
import BandaPNBadge from './BandaPNBadge';
import DesgloseDesembolso from './DesgloseDesembolso';
import CostoCreditoPanel from './CostoCreditoPanel';
import { COLORES_BANDA, ESTADOS_COTIZACION, BANDA_E_HABILITADA } from '@/lib/tarifarioPN';
import { formatPct, formatUSD } from '@/lib/motorTarifarioPN';

export default function ResultadoCotizacionPN({ cotizacion }) {
  const c = COLORES_BANDA[cotizacion.banda];
  const estado = ESTADOS_COTIZACION[cotizacion.estado];
  const bandaEBloqueada = cotizacion.banda === 'E' && !BANDA_E_HABILITADA;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4" style={{ backgroundColor: c.bg, color: c.text }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-80">Score del beneficiario</p>
            <p className="text-3xl font-bold tabular-nums">{cotizacion.score}</p>
          </div>
          <BandaPNBadge banda={cotizacion.banda} size="lg" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {cotizacion.es_demo && (
          <div className="flex items-center gap-2 rounded-lg bg-purple-100 border border-purple-300 px-3 py-2">
            <FlaskConical size={14} className="text-purple-800" />
            <span className="text-xs font-bold text-purple-900 tracking-wide">ESCENARIO DEMO</span>
            <span className="text-[11px] text-purple-800">
              · no puede convertirse en certificado real
            </span>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-900">{estado.label}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-600">{estado.descripcion}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
            <span className="text-xs text-gray-600">Cobertura aplicada</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {formatPct(cotizacion.cobertura_aplicada, 2)}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
            <span className="text-xs text-gray-600">Monto garantizado</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {formatUSD(cotizacion.monto_garantizado)}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
            <span className="text-xs text-gray-600">Prima de garantía (% s/ monto garantizado)</span>
            <span className="text-sm font-bold text-gray-900 tabular-nums">
              {formatPct(cotizacion.prima_total_pct, 4)}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-gray-600">Prima de garantía ACIDPAY</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: c.color }}>
              {formatUSD(cotizacion.prima_usd)}
            </span>
          </div>
        </div>

        <DesgloseDesembolso cotizacion={cotizacion} />
        <CostoCreditoPanel cotizacion={cotizacion} />

        {bandaEBloqueada && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
            <Lock size={14} className="text-red-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-900">Banda E pendiente de habilitación contractual.</p>
          </div>
        )}

        <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          Tarifario Persona Natural {cotizacion.tarifario_version} · prima calculada sobre el monto
          garantizado.
        </p>
      </div>
    </div>
  );
}