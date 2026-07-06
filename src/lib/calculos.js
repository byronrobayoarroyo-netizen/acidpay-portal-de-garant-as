import { TARIFARIO } from './tarifario';

export function simulateScore(cedula) {
  if (!cedula || cedula.length < 3) return 500;
  let hash = 0;
  for (let i = 0; i < cedula.length; i++) {
    hash = ((hash << 5) - hash) + cedula.charCodeAt(i);
    hash = hash & hash;
  }
  return 300 + (Math.abs(hash) % 551);
}

export function getBandaFromScore(score) {
  if (score >= 750) return 'A';
  if (score >= 650) return 'B';
  if (score >= 550) return 'C';
  if (score >= 450) return 'D';
  return 'E';
}

export function calcularCotizacion(monto, plazoMeses, banda, tasaBase) {
  const params = TARIFARIO[banda];
  if (!params) return null;

  const montoGarantizado = monto * params.cobertura;
  const primaValor = montoGarantizado * params.prima;
  const primaRateAnual = (primaValor / monto) * (12 / plazoMeses) * 100;
  const tasaTotal = tasaBase + primaRateAnual;

  const tasaMensual = tasaTotal / 100 / 12;
  let cuotaMensual;
  if (tasaMensual === 0) {
    cuotaMensual = monto / plazoMeses;
  } else {
    cuotaMensual = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
      (Math.pow(1 + tasaMensual, plazoMeses) - 1);
  }

  return {
    montoGarantizado: Math.round(montoGarantizado * 100) / 100,
    primaValor: Math.round(primaValor * 100) / 100,
    primaRateAnual: Math.round(primaRateAnual * 100) / 100,
    tasaTotal: Math.round(tasaTotal * 100) / 100,
    cuotaMensual: Math.round(cuotaMensual * 100) / 100,
    porcentajeCobertura: params.cobertura,
    primaPorcentaje: params.prima
  };
}

export function generateCertificadoNumero(fecha = new Date()) {
  const yy = String(fecha.getFullYear()).slice(2);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `ACP-${yy}${mm}${dd}-${seq}`;
}

export function sumarDiasHabiles(fecha, dias) {
  const result = new Date(fecha);
  let added = 0;
  while (added < dias) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

export function formatCurrency(value) {
  if (value == null || isNaN(value)) return 'USD 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

export function formatNumber(value) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('es-EC', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function getMesLabel(mesStr) {
  const [year, month] = mesStr.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[parseInt(month) - 1]} ${year}`;
}