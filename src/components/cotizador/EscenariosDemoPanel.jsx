import { FlaskConical } from 'lucide-react';
import { ESCENARIOS_DEMO_PN } from '@/lib/escenariosDemoPN';
import { COLORES_BANDA } from '@/lib/tarifarioPN';

/**
 * Atajos de los escenarios demo. Solo se renderiza cuando DEMO_MODE está activo.
 * Autocompleta el nombre disparador y el monto sugerido (Ticket Promedio),
 * que el usuario puede seguir editando.
 */
export default function EscenariosDemoPanel({ onSeleccionar }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical size={15} className="text-purple-700" />
        <p className="text-xs font-semibold text-gray-700">
          Escenarios demo (modo demo activo)
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {ESCENARIOS_DEMO_PN.map((esc) => {
          const c = COLORES_BANDA[esc.banda];
          return (
            <button
              key={esc.nombre}
              type="button"
              onClick={() => onSeleccionar(esc)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-opacity hover:opacity-80"
              style={{ backgroundColor: c.bg, color: c.text, borderColor: c.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
              {esc.nombre}
              <span className="font-normal">· banda {esc.banda} · score {esc.score}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        El monto es un valor sugerido (ticket promedio de la banda), no un límite: puede editarlo
        y la prima se recalcula.
      </p>
    </div>
  );
}