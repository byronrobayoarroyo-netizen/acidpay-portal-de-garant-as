export const TARIFARIO = {
  A: {
    banda: 'A',
    label: 'Riesgo Bajo',
    pd: 0.02,
    lgd: 0.30,
    cobertura: 0.80,
    prima: 0.008,
    aprobacion: 'automatica',
    aprobacion_label: 'Aprobación Automática',
    color: '#16A34A',
    bg: '#DCFCE7',
    text: '#15803D'
  },
  B: {
    banda: 'B',
    label: 'Riesgo Medio-Bajo',
    pd: 0.05,
    lgd: 0.35,
    cobertura: 0.75,
    prima: 0.012,
    aprobacion: 'automatica',
    aprobacion_label: 'Aprobación Automática',
    color: '#65A30D',
    bg: '#ECFCCB',
    text: '#4D7C0F'
  },
  C: {
    banda: 'C',
    label: 'Riesgo Medio',
    pd: 0.08,
    lgd: 0.40,
    cobertura: 0.70,
    prima: 0.020,
    aprobacion: 'manual',
    aprobacion_label: 'Validación Manual (1 día hábil)',
    color: '#D97706',
    bg: '#FEF3C7',
    text: '#B45309'
  },
  D: {
    banda: 'D',
    label: 'Riesgo Alto',
    pd: 0.12,
    lgd: 0.45,
    cobertura: 0.60,
    prima: 0.035,
    aprobacion: 'riesgos',
    aprobacion_label: 'Aprobación de Riesgos ACIDPAY (montos ≤ USD 5,000)',
    color: '#EA580C',
    bg: '#FFEDD5',
    text: '#C2410C'
  },
  E: {
    banda: 'E',
    label: 'Riesgo Muy Alto',
    pd: 0.20,
    lgd: 0.50,
    cobertura: 0.50,
    prima: 0.055,
    aprobacion: 'negativa',
    aprobacion_label: 'Negativa Automática',
    color: '#DC2626',
    bg: '#FEE2E2',
    text: '#B91C1C'
  }
};

export const ESTADOS_CERTIFICADO = {
  vigente: { label: 'Vigente', color: '#2563EB', bg: '#DBEAFE', text: '#1E40AF' },
  cancelado: { label: 'Cancelado', color: '#6B7280', bg: '#F3F4F6', text: '#4B5563' },
  en_mora: { label: 'En Mora', color: '#EA580C', bg: '#FFEDD5', text: '#C2410C' },
  ejecutado: { label: 'Ejecutado', color: '#7C3AED', bg: '#EDE9FE', text: '#6D28D9' },
  vencido: { label: 'Vencido', color: '#DC2626', bg: '#FEE2E2', text: '#B91C1C' }
};

export const ESTADOS_MORA = {
  reportado: { label: 'Reportado', color: '#D97706', bg: '#FEF3C7', text: '#B45309' },
  observado: { label: 'Observado', color: '#2563EB', bg: '#DBEAFE', text: '#1E40AF' },
  aprobado: { label: 'Aprobado', color: '#16A34A', bg: '#DCFCE7', text: '#15803D' },
  rechazado: { label: 'Rechazado', color: '#DC2626', bg: '#FEE2E2', text: '#B91C1C' }
};

export const ESTADOS_LIQUIDACION = {
  pendiente: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7', text: '#B45309' },
  pagada: { label: 'Pagada', color: '#16A34A', bg: '#DCFCE7', text: '#15803D' },
  parcial: { label: 'Parcial', color: '#2563EB', bg: '#DBEAFE', text: '#1E40AF' },
  vencida: { label: 'Vencida', color: '#DC2626', bg: '#FEE2E2', text: '#B91C1C' }
};