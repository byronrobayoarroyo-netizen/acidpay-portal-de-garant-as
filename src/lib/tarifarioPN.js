/**
 * Tarifario Persona Natural — configuración versionada.
 *
 * Fuente de la verdad: CGCE_v15_SB.xlsx
 *   - hoja «Scoring Bandas», tabla I. Parámetros de riesgo por banda de scoring — Persona Natural
 *   - hoja «Supuestos», celdas C24..C27
 *
 * Valores transcritos literalmente. Prohibido inventar, redondear en origen,
 * interpolar o "corregir" cualquiera de estos valores.
 *
 * Toda cotización debe persistir `version` para que un registro histórico
 * jamás se recalcule con un tarifario posterior.
 */

export const TARIFARIO_PN = {
  version: 'v15',
  fuente: 'CGCE_v15_SB.xlsx / hoja Scoring Bandas / tabla I',
  vigente_desde: '2026-01-01',

  constantes: {
    /** Supuestos!C24 — recargo sobre la EL */
    margen_prudencial: '0.40',
    /** Supuestos!C25 — 1.20% s/ base */
    gastos_administrativos: '0.012',
    /**
     * Supuestos!C26 — celda VACÍA en el modelo v15.
     * Se modela como constante independiente con valor 0.00 y debe permanecer
     * visible en la configuración para cuando se calibre. NO fusionar con las otras.
     */
    costo_capital: '0.00',
    /** Supuestos!C27 — 0.30% s/ base */
    reserva_contingencia: '0.003'
  },

  /** Score válido del modelo. Fuera de rango => error de validación, nunca banda por defecto. */
  score_min_valido: 0,
  score_max_valido: 850,

  /** Techo duro de cobertura por operación. */
  cobertura_maxima: '0.80',

  /** Tasa efectiva anual de la operación crediticia, fijada por la IFI. */
  tea_banco: '0.1677',

  bandas: [
    {
      banda: 'A',
      etiqueta: 'Excelente',
      etiqueta_riesgo: 'Riesgo Muy Bajo',
      score_min: 620,
      score_max: 850,
      pd: '0.06',
      lgd: '0.42',
      ead: '0.65',
      cobertura: '0.70',
      ticket_promedio: 4000,
      estado_inicial: 'APROBADA',
      libera: 'Automático (sistema)'
    },
    {
      banda: 'B',
      etiqueta: 'Bueno',
      etiqueta_riesgo: 'Riesgo Bajo',
      score_min: 550,
      score_max: 619,
      pd: '0.09',
      lgd: '0.45',
      ead: '0.68',
      cobertura: '0.65',
      ticket_promedio: 3500,
      estado_inicial: 'APROBADA',
      libera: 'Automático (sistema)'
    },
    {
      banda: 'C',
      etiqueta: 'Regular',
      etiqueta_riesgo: 'Riesgo Medio',
      score_min: 480,
      score_max: 549,
      pd: '0.12',
      lgd: '0.50',
      ead: '0.70',
      cobertura: '0.60',
      ticket_promedio: 3000,
      estado_inicial: 'REQUIERE_REVISION_MANUAL',
      libera: 'Analista de Riesgos ACIDPAY'
    },
    {
      banda: 'D',
      etiqueta: 'Alto',
      etiqueta_riesgo: 'Riesgo Alto',
      score_min: 400,
      score_max: 479,
      pd: '0.16',
      lgd: '0.55',
      ead: '0.72',
      cobertura: '0.55',
      ticket_promedio: 2000,
      estado_inicial: 'REQUIERE_APROBACION_RIESGOS',
      libera: 'Riesgos ACIDPAY, montos ≤ USD 5,000',
      monto_maximo: 5000
    },
    {
      banda: 'E',
      etiqueta: 'Muy Alto',
      etiqueta_riesgo: 'Riesgo Muy Alto',
      score_min: 0,
      score_max: 399,
      pd: '0.22',
      lgd: '0.60',
      ead: '0.75',
      cobertura: '0.50',
      ticket_promedio: 2000,
      estado_inicial: 'REQUIERE_EXCEPCION_ACIDPAY',
      libera: 'Administrador ACIDPAY / CRO, con justificación'
    }
  ]
};

/**
 * Tokens de color por banda. El color NUNCA es el único portador de significado:
 * toda banda muestra siempre su letra y su etiqueta de texto. Contraste WCAG AA.
 */
export const COLORES_BANDA = {
  A: { token: 'verde', color: '#15803D', bg: '#DCFCE7', text: '#14532D' },
  B: { token: 'verde oliva', color: '#4D7C0F', bg: '#ECFCCB', text: '#365314' },
  C: { token: 'ámbar', color: '#B45309', bg: '#FEF3C7', text: '#78350F' },
  D: { token: 'naranja', color: '#C2410C', bg: '#FFEDD5', text: '#7C2D12' },
  E: { token: 'rojo', color: '#B91C1C', bg: '#FEE2E2', text: '#7F1D1D' }
};

/** Estados de cotización y su significado operativo. */
export const ESTADOS_COTIZACION = {
  APROBADA: {
    label: 'Aprobada',
    emisible: true,
    descripcion: 'Liberada automáticamente por el sistema.'
  },
  REQUIERE_REVISION_MANUAL: {
    label: 'Requiere revisión manual',
    emisible: false,
    descripcion: 'Revisión manual del Analista de Riesgos ACIDPAY.'
  },
  REQUIERE_APROBACION_RIESGOS: {
    label: 'Requiere aprobación de Riesgos',
    emisible: false,
    descripcion: 'Aprobación de Riesgos ACIDPAY. Aplicable solo a montos ≤ USD 5,000.'
  },
  REQUIERE_EXCEPCION_ACIDPAY: {
    label: 'Requiere excepción ACIDPAY',
    emisible: false,
    descripcion:
      'Emisible por excepción con aprobación de Administrador ACIDPAY / CRO y justificación de 40+ caracteres. Nunca automática por la IFI.'
  },
  REQUIERE_APROBACION_CRO: {
    label: 'Requiere aprobación CRO',
    emisible: false,
    descripcion:
      'La cobertura solicitada supera la cobertura de la banda. Libera el CRO ACIDPAY.'
  }
};

/**
 * Bandera de configuración. Cuando está en false la cotización se genera y se
 * muestra el precio, pero la emisión de certificado queda bloqueada.
 */
export const BANDA_E_HABILITADA = false;

export function getBandaConfig(banda) {
  return TARIFARIO_PN.bandas.find((b) => b.banda === banda) || null;
}