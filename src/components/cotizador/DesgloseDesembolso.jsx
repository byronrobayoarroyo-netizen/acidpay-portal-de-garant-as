import { formatUSD } from '@/lib/motorTarifarioPN';

/**
 * DESGLOSE DEL DESEMBOLSO.
 * La prima la asume económicamente el beneficiario y se descuenta del desembolso:
 * formaliza y amortiza M, pero recibe M − prima. Pago único al desembolso.
 */
export default function DesgloseDesembolso({ cotizacion }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
          Desglose del desembolso
        </p>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Monto del crédito formalizado</span>
          <span className="font-medium text-gray-900 tabular-nums">
            {formatUSD(cotizacion.monto_credito)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">(−) Prima de garantía ACIDPAY</span>
          <span className="font-medium text-gray-900 tabular-nums">
            {formatUSD(cotizacion.prima_usd)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
          <span className="font-semibold text-gray-900">= Monto que recibe el beneficiario</span>
          <span className="font-bold text-gray-900 tabular-nums">
            {formatUSD(cotizacion.desembolso_neto)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 pt-1">
          Pago único al momento del desembolso. El beneficiario amortiza sobre el monto
          formalizado ({formatUSD(cotizacion.monto_credito)}).
        </p>
      </div>
    </div>
  );
}