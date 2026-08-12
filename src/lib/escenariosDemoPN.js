/**
 * Escenarios demo de Persona Natural — disparo por nombre.
 *
 * El modo demo se activa SOLO cuando DEMO_MODE está en true. En producción estos
 * nombres no tienen ningún comportamiento especial.
 *
 * Ninguna cédula real se siembra. Se usa un único placeholder documentado que el
 * validador de módulo 10 debe excluir explícitamente.
 */

/** Placeholder de identificación para escenarios demo. No es una cédula válida. */
export const CEDULA_PLACEHOLDER_DEMO = '0000000000';

/**
 * DEMO_MODE. En el build de producción queda en false salvo que se declare
 * explícitamente VITE_DEMO_MODE=true.
 */
export const DEMO_MODE =
  import.meta.env?.VITE_DEMO_MODE != null
    ? String(import.meta.env.VITE_DEMO_MODE) === 'true'
    : Boolean(import.meta.env?.DEV);

/**
 * Escenarios. `monto_sugerido` es el Ticket Promedio de la banda: valor de
 * referencia que se autocompleta, NO un límite ni una validación de máximo.
 */
export const ESCENARIOS_DEMO_PN = [
  { nombre: 'Juan Pérez', score: 735, banda: 'A', monto_sugerido: 4000 },
  { nombre: 'Juan Andrade', score: 585, banda: 'B', monto_sugerido: 3500 },
  { nombre: 'Juan Noboa', score: 515, banda: 'C', monto_sugerido: 3000 },
  { nombre: 'José García', score: 440, banda: 'D', monto_sugerido: 2000 },
  { nombre: 'José Arias', score: 365, banda: 'E', monto_sugerido: 2000 }
];

/** Normaliza: minúsculas, sin acentos, sin espacios extremos, espacios internos colapsados. */
export function normalizarNombre(nombre) {
  if (!nombre) return '';
  return String(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Busca el escenario demo correspondiente al nombre completo.
 * La coincidencia es por nombre completo exacto tras normalización:
 * un nombre parcial ("Juan") no dispara nada.
 *
 * @param {string} nombreCompleto
 * @param {boolean} demoMode  estado de DEMO_MODE (inyectable para tests)
 * @returns {object|null}
 */
export function buscarEscenarioDemo(nombreCompleto, demoMode = DEMO_MODE) {
  if (!demoMode) return null;
  const objetivo = normalizarNombre(nombreCompleto);
  if (!objetivo) return null;
  return ESCENARIOS_DEMO_PN.find((e) => normalizarNombre(e.nombre) === objetivo) || null;
}