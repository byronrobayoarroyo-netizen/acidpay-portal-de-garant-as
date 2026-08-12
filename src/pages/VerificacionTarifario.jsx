import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, PlayCircle, ServerCog } from 'lucide-react';
import { ejecutarVerificacion, CRITERIOS_PENDIENTES_BACKEND } from '@/lib/verificacionTarifarioPN';

export default function VerificacionTarifario() {
  const [ejecucion, setEjecucion] = useState(0);
  const resultados = useMemo(() => ejecutarVerificacion(), [ejecucion]);

  const total = resultados.length;
  const pasan = resultados.filter((r) => r.pass).length;
  const fallan = total - pasan;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificación del tarifario PN</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ejecuta los criterios de aceptación contra los golden values del modelo v15.
          </p>
        </div>
        <button
          onClick={() => setEjecucion((n) => n + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <PlayCircle size={16} /> Volver a ejecutar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-600">Aserciones</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <p className="text-xs text-green-800">Pasan</p>
          <p className="text-2xl font-bold text-green-800 tabular-nums">{pasan}</p>
        </div>
        <div
          className={`bg-white rounded-xl border p-4 ${fallan > 0 ? 'border-red-300' : 'border-gray-200'}`}
        >
          <p className={`text-xs ${fallan > 0 ? 'text-red-800' : 'text-gray-600'}`}>Fallan</p>
          <p
            className={`text-2xl font-bold tabular-nums ${fallan > 0 ? 'text-red-800' : 'text-gray-900'}`}
          >
            {fallan}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left w-24">Criterio</th>
              <th className="px-4 py-3 text-left">Aserción</th>
              <th className="px-4 py-3 text-left">Esperado</th>
              <th className="px-4 py-3 text-left">Obtenido</th>
              <th className="px-4 py-3 text-center w-20">Estado</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-gray-100 ${r.pass ? '' : 'bg-red-50'}`}
              >
                <td className="px-4 py-2.5 font-mono text-[11px] text-gray-700 align-top">{r.ca}</td>
                <td className="px-4 py-2.5 text-xs text-gray-900 align-top">{r.nombre}</td>
                <td className="px-4 py-2.5 text-[11px] text-gray-600 font-mono align-top">
                  {r.esperado}
                </td>
                <td
                  className={`px-4 py-2.5 text-[11px] font-mono align-top ${r.pass ? 'text-gray-600' : 'text-red-800 font-semibold'}`}
                >
                  {r.obtenido}
                </td>
                <td className="px-4 py-2.5 text-center align-top">
                  {r.pass ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-800">
                      <CheckCircle2 size={13} /> PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800">
                      <XCircle size={13} /> FAIL
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2">
          <ServerCog size={16} className="text-gray-600" />
          <h2 className="text-sm font-bold text-gray-900">
            Criterios que exigen servidor — fuera de este paso
          </h2>
        </div>
        <ul className="mt-3 space-y-2">
          {CRITERIOS_PENDIENTES_BACKEND.map((c) => (
            <li key={c.ca} className="flex gap-2 text-xs text-gray-700">
              <span className="font-mono font-semibold text-gray-900 flex-shrink-0">{c.ca}</span>
              <span>{c.detalle}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}