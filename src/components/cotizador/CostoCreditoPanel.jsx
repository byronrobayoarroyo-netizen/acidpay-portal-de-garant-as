import { AlertTriangle } from 'lucide-react';
import { formatPct, formatUSD } from '@/lib/motorTarifarioPN';

/**
 * DOS LÍNEAS, NUNCA UNA TASA ÚNICA.
 * La TEA de la operación y el Costo Total al Cliente se presentan como cifras
 * separadas y etiquetadas, cada una con su nota al pie.
 */
export default function CostoCreditoPanel({ cotizacion }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-gray-700">Tasa del crédito (TEA)</span>
          <span className="text-lg font-bold text-gray-900 tabular-nums">
            {formatPct(cotizacion.tea_banco, 2)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          Tasa efectiva anual de la operación crediticia, fijada por la IFI.
        </p>
      </div>

      <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-gray-700">Costo total al cliente (CTC)</span>
          <span className="text-lg font-bold text-gray-900 tabular-nums">
            {formatPct(cotizacion.ctc_ea, 2)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          Incluye el efecto de la prima de garantía descontada del desembolso. No es la TEA de la
          operación.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
        <AlertTriangle size={14} className="text-amber-700 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-amber-900">
          El Costo Total al Cliente no es la Tasa Efectiva Anual de la operación crediticia. Su
          tratamiento regulatorio está pendiente de validación.
        </p>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-gray-600">
          Cuota mensual ({cotizacion.plazo_meses} meses)
        </span>
        <span className="font-bold text-gray-900 tabular-nums">
          {formatUSD(cotizacion.cuota_mensual)}
        </span>
      </div>
    </div>
  );
}