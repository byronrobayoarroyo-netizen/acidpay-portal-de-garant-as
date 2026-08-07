export const TARIFARIO = {
  A: {
    banda: 'A',
    label: 'Riesgo Bajo',
    pd: 0.06,
    lgd: 0.42,
    ead: 0.65,
    adm: 0.015,
    margen_prudencial_factor: 0.4,
    cobertura: 0.70,
    ticket_promedio: 4000,
    prima: 0.037932,
    aprobacion: 'automatica',
    aprobacion_label: 'Aprobación Automática',
    color: '#16A34A',
    bg: '#DCFCE7',
    text: '#15803D'
  },
  B: {
    banda: 'B',
    label: 'Riesgo Medio-Bajo',
    pd: 0.09,
    lgd: 0.45,
    ead: 0.68,
    adm: 0.015,
    margen_prudencial_factor: 0.4,
    cobertura: 0.65,
    ticket_promedio: 3500,
    prima: 0.053556,
    aprobacion: 'automatica',
    aprobacion_label: 'Aprobación Automática',
    color: '#65A30D',
    bg: '#ECFCCB',
    text: '#4D7C0F'
  },
  C: {
    banda: 'C',
    label: 'Riesgo Medio',
    pd: 0.12,
    lgd: 0.50,
    ead: 0.70,
    adm: 0.015,
    margen_prudencial_factor: 0.4,
    cobertura: 0.60,
    ticket_promedio: 3000,
    prima: 0.0738,
    aprobacion: 'manual',
    aprobacion_label: 'Validación Manual (1 día hábil)',
    color: '#D97706',
    bg: '#FEF3C7',
    text: '#B45309'
  },
  D: {
    banda: 'D',
    label: 'Riesgo Alto',
    pd: 0.16,
    lgd: 0.55,
    ead: 0.75,
    adm: 0.015,
    margen_prudencial_factor: 0.4,
    cobertura: 0.50,
    ticket_promedio: 2500,
    prima: 0.1074,
    aprobacion: 'riesgos',
    aprobacion_label: 'Aprobación de Riesgos ACIDPAY (montos ≤ USD 5,000)',
    color: '#EA580C',
    bg: '#FFEDD5',
    text: '#C2410C'
  },
  E: {
    banda: 'E',
    label: 'Riesgo Muy Alto',
    pd: 0.25,
    lgd: 0.65,
    ead: 0.85,
    adm: 0.015,
    margen_prudencial_factor: 0.4,
    cobertura: 0.40,
    ticket_promedio: 2000,
    prima: 0.208375,
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

export const EJEMPLOS_PERFIL = [
  { banda: 'A', label: 'Excelente', nombre: 'Juan Pérez', cedula: '1712345678', monto: 4000, plazo: 24 },
  { banda: 'B', label: 'Bueno', nombre: 'Juan Andrade', cedula: '1712345679', monto: 3500, plazo: 24 },
  { banda: 'C', label: 'Regular', nombre: 'Juan Noboa', cedula: '1712345680', monto: 3000, plazo: 24 },
  { banda: 'D', label: 'Alto', nombre: 'Carlos Mendoza', cedula: '1712345681', monto: 2500, plazo: 24 },
  { banda: 'E', label: 'Muy Alto', nombre: 'Pedro Vargas', cedula: '1712345682', monto: 2000, plazo: 24 }
];