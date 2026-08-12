/**
 * Motor de tarifario Persona Natural.
 *
 * Aritmética decimal exacta con Decimal.js. Prohibido float/Number para dinero.
 * PRIMA_TOTAL se calcula y almacena con precisión completa; el redondeo ocurre
 * solo en la capa de presentación / al persistir el importe facturable.
 */

import Decimal from 'decimal.js';
import { TARIFARIO_PN, getBandaConfig } from './tarifarioPN';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const D = (v) => new Decimal(v);

/** Redondeo a 2 decimales, ROUND_HALF_UP. Solo para presentar / persistir importes. */
export function money(value) {
  return D(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/* ------------------------------------------------------------------ */
/* Banda por score                                                     */
/* ------------------------------------------------------------------ */

/**
 * Asigna banda por score. Rangos inclusivos en ambos extremos.
 * Score fuera de [0, 850] lanza error — nunca banda por defecto.
 */
export function getBandaFromScore(score) {
  if (score == null || !Number.isFinite(Number(score))) {
    throw new Error('Score inválido: debe ser un número.');
  }
  const s = Number(score);
  if (s < TARIFARIO_PN.score_min_valido || s > TARIFARIO_PN.score_max_valido) {
    throw new Error(
      `Score fuera de rango válido (${TARIFARIO_PN.score_min_valido}–${TARIFARIO_PN.score_max_valido}): ${s}`
    );
  }
  const banda = TARIFARIO_PN.bandas.find((b) => s >= b.score_min && s <= b.score_max);
  if (!banda) throw new Error(`No existe banda para el score ${s}`);
  return banda.banda;
}

/* ------------------------------------------------------------------ */
/* Componentes de la prima — orden de operaciones de la hoja           */
/* ------------------------------------------------------------------ */

/** COMPONENTE_FIJO = GASTOS_ADM + COSTO_CAPITAL + RESERVA_CONTINGENCIA  (col J) */
export function componenteFijo() {
  const c = TARIFARIO_PN.constantes;
  return D(c.gastos_administrativos).plus(c.costo_capital).plus(c.reserva_contingencia);
}

/**
 * Descompone la prima de una banda replicando las columnas G, H, I, J, K.
 * Devuelve Decimals con precisión completa (sin redondear).
 */
export function desglosePrima(banda) {
  const cfg = getBandaConfig(banda);
  if (!cfg) throw new Error(`Banda desconocida: ${banda}`);

  const el = D(cfg.pd).times(cfg.lgd).times(cfg.ead);                       // (1) col G
  const margen = el.times(TARIFARIO_PN.constantes.margen_prudencial);       // (2) col H
  const primaBruta = el.plus(margen);                                      // (3) col I
  const fijo = componenteFijo();                                           // (4) col J
  const primaTotal = primaBruta.plus(fijo);                                // (5) col K

  return { el, margen, primaBruta, componenteFijo: fijo, primaTotal };
}

/** PRIMA_TOTAL con precisión completa (Decimal). */
export function primaTotalPct(banda) {
  return desglosePrima(banda).primaTotal;
}

/* ------------------------------------------------------------------ */
/* Cobertura aplicada                                                  */
/* ------------------------------------------------------------------ */

/**
 * Valida la cobertura solicitada. 0 < cobertura <= 0.80 (techo duro por operación).
 * Lanza error de validación cuando está fuera de rango.
 */
export function validarCobertura(cobertura) {
  const c = D(cobertura);
  if (c.lte(0)) {
    throw new Error('La cobertura aplicada debe ser mayor que 0.');
  }
  if (c.gt(TARIFARIO_PN.cobertura_maxima)) {
    throw new Error(
      `La cobertura aplicada excede el techo duro de ${D(TARIFARIO_PN.cobertura_maxima).times(100)}% por operación.`
    );
  }
  return c;
}

/* ------------------------------------------------------------------ */
/* Tasa del banco y cuota                                              */
/* ------------------------------------------------------------------ */

/**
 * TEA_BANCO es tasa EFECTIVA anual. La conversión a mensual es geométrica.
 * i_mensual = (1 + TEA)^(1/12) - 1.
 * Prohibido TEA/12 (división nominal).
 */
export function teaAMensual(tea = TARIFARIO_PN.tea_banco) {
  return D(1).plus(tea).pow(D(1).div(12)).minus(1);
}

/**
 * CUOTA = M * i / (1 - (1 + i)^-n)
 * Se calcula sobre el monto formalizado M, nunca sobre el desembolso neto.
 */
export function cuotaMensual(montoFormalizado, plazoMeses, tea = TARIFARIO_PN.tea_banco) {
  const m = D(montoFormalizado);
  const n = Number(plazoMeses);
  if (!Number.isInteger(n) || n <= 0) throw new Error('El plazo en meses debe ser un entero positivo.');

  const i = teaAMensual(tea);
  if (i.isZero()) return m.div(n);

  const denom = D(1).minus(D(1).plus(i).pow(-n));
  return m.times(i).div(denom);
}

/* ------------------------------------------------------------------ */
/* Costo Total al Cliente (CTC)                                        */
/* ------------------------------------------------------------------ */

/**
 * TIR mensual que iguala el desembolso neto recibido con el flujo de cuotas:
 *   (M - PRIMA) = Σ[t=1..n] CUOTA / (1 + r)^t
 * Bisección en [-0.5, 1.0], tolerancia 1e-12, máximo 200 iteraciones.
 * Si no converge lanza error explícito — nunca un valor por defecto.
 */
export function tirMensual(desembolsoNeto, cuota, plazoMeses) {
  const neto = D(desembolsoNeto);
  const c = D(cuota);
  const n = Number(plazoMeses);

  const vp = (r) => {
    let total = D(0);
    for (let t = 1; t <= n; t++) {
      total = total.plus(c.div(D(1).plus(r).pow(t)));
    }
    return total.minus(neto);
  };

  let lo = D('-0.5');
  let hi = D('1.0');
  const tol = D('1e-12');

  let fLo = vp(lo);
  let fHi = vp(hi);
  if (fLo.times(fHi).gt(0)) {
    throw new Error('No se pudo acotar la TIR: la función no cambia de signo en [-0.5, 1.0].');
  }

  for (let iter = 0; iter < 200; iter++) {
    const mid = lo.plus(hi).div(2);
    const fMid = vp(mid);
    if (fMid.abs().lt(tol) || hi.minus(lo).abs().lt(tol)) {
      return mid;
    }
    if (fLo.times(fMid).lt(0)) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  throw new Error('El cálculo del Costo Total al Cliente no convergió en 200 iteraciones.');
}

/** CTC_EA = (1 + r_mensual)^12 - 1 */
export function ctcEfectivoAnual(desembolsoNeto, cuota, plazoMeses) {
  const r = tirMensual(desembolsoNeto, cuota, plazoMeses);
  return D(1).plus(r).pow(12).minus(1);
}

/* ------------------------------------------------------------------ */
/* Cotización completa                                                 */
/* ------------------------------------------------------------------ */

/**
 * Determina el estado inicial de la cotización.
 * Una cobertura por encima de la de la banda escala a CRO, con prioridad
 * sobre el estado propio de la banda.
 */
export function estadoInicialCotizacion(banda, coberturaAplicada, montoCredito) {
  const cfg = getBandaConfig(banda);
  if (D(coberturaAplicada).gt(cfg.cobertura)) return 'REQUIERE_APROBACION_CRO';
  return cfg.estado_inicial;
}

/**
 * Cotiza una operación de Persona Natural.
 *
 * @param {object} params
 * @param {number|string} params.montoCredito   monto formalizado M
 * @param {number} params.plazoMeses
 * @param {number} params.score
 * @param {number|string} [params.coberturaAplicada] por defecto la cobertura de la banda
 * @param {boolean} [params.esDemo]
 */
export function cotizarPN({ montoCredito, plazoMeses, score, coberturaAplicada, esDemo = false }) {
  const banda = getBandaFromScore(score);
  const cfg = getBandaConfig(banda);

  const monto = D(montoCredito);
  if (monto.lte(0)) throw new Error('El monto del crédito debe ser mayor que 0.');

  const cobertura = validarCobertura(coberturaAplicada != null ? coberturaAplicada : cfg.cobertura);

  const desglose = desglosePrima(banda);

  // (6) La prima se calcula sobre el MONTO GARANTIZADO, nunca sobre el monto total del crédito.
  const montoGarantizado = money(monto.times(cobertura));
  // (7)
  const primaUsd = money(montoGarantizado.times(desglose.primaTotal));
  // prima_usd se redondea ANTES del neto, para que el neto sea el importe transferido.
  const desembolsoNeto = money(monto.minus(primaUsd));

  const iMensual = teaAMensual();
  const cuota = money(cuotaMensual(monto, plazoMeses));
  const ctcEa = ctcEfectivoAnual(desembolsoNeto, cuota, plazoMeses);

  return {
    tarifario_version: TARIFARIO_PN.version,
    banda,
    etiqueta_riesgo: cfg.etiqueta_riesgo,
    score: Number(score),
    monto_credito: money(monto).toNumber(),
    cobertura_aplicada: cobertura.toNumber(),
    cobertura_banda: D(cfg.cobertura).toNumber(),
    monto_garantizado: montoGarantizado.toNumber(),
    prima_total_pct: desglose.primaTotal.toDecimalPlaces(8).toNumber(),
    prima_usd: primaUsd.toNumber(),
    desembolso_neto: desembolsoNeto.toNumber(),
    tea_banco: D(TARIFARIO_PN.tea_banco).toNumber(),
    i_mensual: iMensual.toDecimalPlaces(10).toNumber(),
    plazo_meses: Number(plazoMeses),
    cuota_mensual: cuota.toNumber(),
    ctc_ea: ctcEa.toDecimalPlaces(8).toNumber(),
    estado: estadoInicialCotizacion(banda, cobertura, monto),
    es_demo: esDemo,
    desglose_prima: {
      el: desglose.el.toDecimalPlaces(8).toNumber(),
      margen: desglose.margen.toDecimalPlaces(8).toNumber(),
      prima_bruta: desglose.primaBruta.toDecimalPlaces(8).toNumber(),
      componente_fijo: desglose.componenteFijo.toDecimalPlaces(8).toNumber()
    }
  };
}

/* ------------------------------------------------------------------ */
/* Formato de presentación                                             */
/* ------------------------------------------------------------------ */

export function formatUSD(value) {
  if (value == null || !Number.isFinite(Number(value))) return 'USD 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value));
}

/** Porcentaje con `dec` decimales. prima_total_pct se muestra con 4. */
export function formatPct(fraccion, dec = 2) {
  if (fraccion == null || !Number.isFinite(Number(fraccion))) return '—';
  return `${D(fraccion).times(100).toDecimalPlaces(dec, Decimal.ROUND_HALF_UP).toFixed(dec)}%`;
}