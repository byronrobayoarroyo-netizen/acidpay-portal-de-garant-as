/**
 * Arnés de verificación del motor de tarifario PN.
 *
 * Ejecuta los criterios de aceptación contra los golden values del modelo v15.
 * Cada caso incluye su versión positiva y, donde corresponde, su versión negativa.
 */

import Decimal from 'decimal.js';
import {
  getBandaFromScore,
  desglosePrima,
  primaTotalPct,
  cotizarPN,
  teaAMensual,
  cuotaMensual,
  validarCobertura
} from './motorTarifarioPN';
import { buscarEscenarioDemo } from './escenariosDemoPN';
import { ESTADOS_COTIZACION } from './tarifarioPN';

const D = (v) => new Decimal(v);

/* --------------------------- golden values --------------------------- */

const GOLDEN_PRIMAS = {
  A: { el: '0.01638000', margen: '0.00655200', bruta: '0.02293200', fijo: '0.015', total: '0.03793200' },
  B: { el: '0.02754000', margen: '0.01101600', bruta: '0.03855600', fijo: '0.015', total: '0.05355600' },
  C: { el: '0.04200000', margen: '0.01680000', bruta: '0.05880000', fijo: '0.015', total: '0.07380000' },
  D: { el: '0.06336000', margen: '0.02534400', bruta: '0.08870400', fijo: '0.015', total: '0.10370400' },
  E: { el: '0.09900000', margen: '0.03960000', bruta: '0.13860000', fijo: '0.015', total: '0.15360000' }
};

/** Tabla §9.7 — TEA 16.77% efectiva anual, cobertura por defecto de cada banda. */
const GOLDEN_ESCENARIOS = [
  { nombre: 'Juan Pérez',   banda: 'A', plazo: 12, m: 4000, gar: 2800.0, prima: 106.21, neto: 3893.79, cuota: 362.17, ctc: 0.228880 },
  { nombre: 'Juan Andrade', banda: 'B', plazo: 12, m: 3500, gar: 2275.0, prima: 121.84, neto: 3378.16, cuota: 316.90, ctc: 0.249036 },
  { nombre: 'Juan Noboa',   banda: 'C', plazo: 12, m: 3000, gar: 1800.0, prima: 132.84, neto: 2867.16, cuota: 271.63, ctc: 0.272840 },
  { nombre: 'José García',  banda: 'D', plazo: 12, m: 2000, gar: 1100.0, prima: 114.07, neto: 1885.93, cuota: 181.09, ctc: 0.306160 },
  { nombre: 'José Arias',   banda: 'E', plazo: 12, m: 2000, gar: 1000.0, prima: 153.60, neto: 1846.40, cuota: 181.09, ctc: 0.360692 },
  { nombre: 'Juan Pérez',   banda: 'A', plazo: 24, m: 4000, gar: 2800.0, prima: 106.21, neto: 3893.79, cuota: 195.10, ctc: 0.200042 },
  { nombre: 'Juan Andrade', banda: 'B', plazo: 24, m: 3500, gar: 2275.0, prima: 121.84, neto: 3378.16, cuota: 170.71, ctc: 0.210506 },
  { nombre: 'Juan Noboa',   banda: 'C', plazo: 24, m: 3000, gar: 1800.0, prima: 132.84, neto: 2867.16, cuota: 146.32, ctc: 0.222763 },
  { nombre: 'José García',  banda: 'D', plazo: 24, m: 2000, gar: 1100.0, prima: 114.07, neto: 1885.93, cuota: 97.55,  ctc: 0.239815 },
  { nombre: 'José Arias',   banda: 'E', plazo: 24, m: 2000, gar: 1000.0, prima: 153.60, neto: 1846.40, cuota: 97.55,  ctc: 0.267281 }
];

const TOL_IMPORTE = 0.01;
const TOL_TASA = 0.0001;

/* --------------------------- helpers --------------------------- */

function caso(resultados, ca, nombre, fn) {
  try {
    const r = fn();
    resultados.push({
      ca,
      nombre,
      pass: r.pass,
      esperado: r.esperado,
      obtenido: r.obtenido
    });
  } catch (e) {
    resultados.push({
      ca,
      nombre,
      pass: false,
      esperado: 'sin excepción',
      obtenido: `EXCEPCIÓN: ${e.message}`
    });
  }
}

function cerca(obtenido, esperado, tol) {
  return D(obtenido).minus(esperado).abs().lte(tol);
}

function esperaError(fn) {
  try {
    fn();
    return { lanzo: false, mensaje: null };
  } catch (e) {
    return { lanzo: true, mensaje: e.message };
  }
}

/* --------------------------- suite --------------------------- */

export function ejecutarVerificacion() {
  const r = [];

  /* ---------- CA-01 — Asignación de banda por score ---------- */

  caso(r, 'CA-01', 'DEMO_MODE=true · "Juan Noboa" ⇒ score 515, banda C, "Riesgo Medio"', () => {
    const esc = buscarEscenarioDemo('Juan Noboa', true);
    const cot = cotizarPN({ montoCredito: 3000, plazoMeses: 12, score: esc.score, esDemo: true });
    const ok = esc.score === 515 && cot.banda === 'C' && cot.etiqueta_riesgo === 'Riesgo Medio';
    return {
      pass: ok,
      esperado: '515 / C / Riesgo Medio',
      obtenido: `${esc.score} / ${cot.banda} / ${cot.etiqueta_riesgo}`
    };
  });

  const fronteras = [
    [549, 'C'], [550, 'B'], [479, 'D'], [480, 'C'],
    [619, 'B'], [620, 'A'], [399, 'E'], [400, 'D'],
    [0, 'E'], [850, 'A']
  ];
  fronteras.forEach(([score, esperada]) => {
    caso(r, 'CA-01', `Frontera exacta · score ${score} ⇒ banda ${esperada}`, () => {
      const obtenida = getBandaFromScore(score);
      return { pass: obtenida === esperada, esperado: esperada, obtenido: obtenida };
    });
  });

  [-1, 851].forEach((score) => {
    caso(r, 'CA-01 (neg)', `Score ${score} fuera de rango ⇒ error de validación, no banda por defecto`, () => {
      const res = esperaError(() => getBandaFromScore(score));
      return {
        pass: res.lanzo,
        esperado: 'error de validación',
        obtenido: res.lanzo ? `error: ${res.mensaje}` : 'no lanzó error'
      };
    });
  });

  /* ---------- CA-02 — Prima total por banda ---------- */

  Object.entries(GOLDEN_PRIMAS).forEach(([banda, g]) => {
    caso(r, 'CA-02', `Banda ${banda} · PRIMA_TOTAL = ${g.total} (8 decimales exactos)`, () => {
      const obtenido = primaTotalPct(banda).toDecimalPlaces(8).toFixed(8);
      return { pass: obtenido === D(g.total).toFixed(8), esperado: D(g.total).toFixed(8), obtenido };
    });

    caso(r, 'CA-02', `Banda ${banda} · desglose EL / margen / bruta / fijo`, () => {
      const d = desglosePrima(banda);
      const obtenido = [
        d.el.toDecimalPlaces(8).toFixed(8),
        d.margen.toDecimalPlaces(8).toFixed(8),
        d.primaBruta.toDecimalPlaces(8).toFixed(8),
        d.componenteFijo.toDecimalPlaces(3).toFixed(3)
      ].join(' / ');
      const esperado = [
        D(g.el).toFixed(8),
        D(g.margen).toFixed(8),
        D(g.bruta).toFixed(8),
        D(g.fijo).toFixed(3)
      ].join(' / ');
      return { pass: obtenido === esperado, esperado, obtenido };
    });
  });

  /* ---------- CA-03 — Base de cálculo de la prima ---------- */

  caso(r, 'CA-03', 'Monto 2000 · banda D · cobertura 0.55 ⇒ garantizado 1100.00 y prima 114.07', () => {
    const c = cotizarPN({ montoCredito: 2000, plazoMeses: 12, score: 440, coberturaAplicada: '0.55' });
    const ok = cerca(c.monto_garantizado, 1100.0, TOL_IMPORTE) && cerca(c.prima_usd, 114.07, TOL_IMPORTE);
    return {
      pass: ok,
      esperado: 'garantizado 1100.00 · prima 114.07',
      obtenido: `garantizado ${c.monto_garantizado.toFixed(2)} · prima ${c.prima_usd.toFixed(2)}`
    };
  });

  caso(r, 'CA-03 (neg)', 'La prima NO se calcula sobre el monto total del crédito (≠ 207.41)', () => {
    const c = cotizarPN({ montoCredito: 2000, plazoMeses: 12, score: 440, coberturaAplicada: '0.55' });
    const sobreMontoTotal = D(2000).times('0.103704').toDecimalPlaces(2).toNumber(); // 207.41
    const ok = !cerca(c.prima_usd, sobreMontoTotal, TOL_IMPORTE);
    return {
      pass: ok,
      esperado: `prima_usd ≠ ${sobreMontoTotal.toFixed(2)} (base = monto garantizado)`,
      obtenido: c.prima_usd.toFixed(2)
    };
  });

  /* ---------- CA-04 — Techo de cobertura ---------- */

  caso(r, 'CA-04', 'Cobertura 0.80 ⇒ aceptada', () => {
    const res = esperaError(() => validarCobertura('0.80'));
    return { pass: !res.lanzo, esperado: 'aceptada', obtenido: res.lanzo ? `rechazada: ${res.mensaje}` : 'aceptada' };
  });

  ['0.8001', '0.95'].forEach((cob) => {
    caso(r, 'CA-04 (neg)', `Cobertura ${cob} ⇒ rechazada por validación`, () => {
      const res = esperaError(() => validarCobertura(cob));
      return {
        pass: res.lanzo,
        esperado: 'rechazada',
        obtenido: res.lanzo ? `rechazada: ${res.mensaje}` : 'ACEPTADA (fallo)'
      };
    });
  });

  caso(r, 'CA-04 (neg)', 'Cobertura 0 ⇒ rechazada (rango es 0 < c ≤ 0.80)', () => {
    const res = esperaError(() => validarCobertura('0'));
    return { pass: res.lanzo, esperado: 'rechazada', obtenido: res.lanzo ? 'rechazada' : 'ACEPTADA (fallo)' };
  });

  /* ---------- CA-05 — Cobertura sobre la banda dispara CRO ---------- */

  caso(r, 'CA-05', 'Banda C (defecto 60%) con cobertura 0.75 ⇒ REQUIERE_APROBACION_CRO y no emisible', () => {
    const c = cotizarPN({ montoCredito: 3000, plazoMeses: 12, score: 515, coberturaAplicada: '0.75' });
    const emisible = ESTADOS_COTIZACION[c.estado].emisible;
    return {
      pass: c.estado === 'REQUIERE_APROBACION_CRO' && emisible === false,
      esperado: 'REQUIERE_APROBACION_CRO · emisible=false',
      obtenido: `${c.estado} · emisible=${emisible}`
    };
  });

  caso(r, 'CA-05', 'Cobertura igual a la de la banda no escala a CRO', () => {
    const c = cotizarPN({ montoCredito: 3000, plazoMeses: 12, score: 515, coberturaAplicada: '0.60' });
    return {
      pass: c.estado === 'REQUIERE_REVISION_MANUAL',
      esperado: 'REQUIERE_REVISION_MANUAL',
      obtenido: c.estado
    };
  });

  /* ---------- CA-06 — Modo demo aislado ---------- */

  caso(r, 'CA-06 (neg)', 'DEMO_MODE=false · "Juan Pérez" no siembra score alguno', () => {
    const esc = buscarEscenarioDemo('Juan Pérez', false);
    return { pass: esc === null, esperado: 'null (camino normal de buró)', obtenido: String(esc) };
  });

  caso(r, 'CA-06', 'DEMO_MODE=true · nombre parcial "Juan" no dispara escenario', () => {
    const esc = buscarEscenarioDemo('Juan', true);
    return { pass: esc === null, esperado: 'null', obtenido: String(esc) };
  });

  caso(r, 'CA-06', 'Normalización · "  jose arias  " coincide con "José Arias"', () => {
    const esc = buscarEscenarioDemo('  jose arias  ', true);
    return { pass: esc?.score === 365, esperado: 'score 365', obtenido: String(esc?.score) };
  });

  caso(r, 'CA-06', 'Cotización demo se marca es_demo = true', () => {
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735, esDemo: true });
    return { pass: c.es_demo === true, esperado: 'es_demo=true', obtenido: `es_demo=${c.es_demo}` };
  });

  /* ---------- CA-08 — Precisión decimal ---------- */

  caso(r, 'CA-08', 'Banda A · garantizado 2800 ⇒ prima 106.21 (no 106.12)', () => {
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735 });
    const ok = cerca(c.prima_usd, 106.21, 0.005) && !cerca(c.prima_usd, 106.12, 0.005);
    return { pass: ok, esperado: '106.21', obtenido: c.prima_usd.toFixed(2) };
  });

  caso(r, 'CA-08 (neg)', 'No se usa el porcentaje redondeado a 4 decimales (0.0379) como insumo', () => {
    const conRedondeado = D(2800).times('0.0379').toDecimalPlaces(2).toNumber(); // 106.12
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735 });
    return {
      pass: !cerca(c.prima_usd, conRedondeado, 0.005),
      esperado: `prima_usd ≠ ${conRedondeado.toFixed(2)}`,
      obtenido: c.prima_usd.toFixed(2)
    };
  });

  /* ---------- CA-09 — Tasa efectiva, no nominal ---------- */

  caso(r, 'CA-09', 'TEA 0.1677 ⇒ i_mensual = 0.0130034863 (±1e-9)', () => {
    const i = teaAMensual('0.1677');
    return {
      pass: cerca(i, '0.0130034863', '1e-9'),
      esperado: '0.0130034863',
      obtenido: i.toDecimalPlaces(10).toFixed(10)
    };
  });

  caso(r, 'CA-09 (neg)', 'i_mensual ≠ TEA/12 (0.013975 · división nominal)', () => {
    const i = teaAMensual('0.1677');
    const nominal = D('0.1677').div(12);
    return {
      pass: !cerca(i, nominal, '1e-6'),
      esperado: `i_mensual ≠ ${nominal.toDecimalPlaces(6).toFixed(6)}`,
      obtenido: i.toDecimalPlaces(10).toFixed(10)
    };
  });

  /* ---------- CA-10 — Descuento al desembolso ---------- */

  caso(r, 'CA-10', 'Juan Pérez · 4000 · 12m ⇒ prima 106.21, neto 3893.79, cuota 362.17', () => {
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735, esDemo: true });
    const ok =
      cerca(c.prima_usd, 106.21, TOL_IMPORTE) &&
      cerca(c.desembolso_neto, 3893.79, TOL_IMPORTE) &&
      cerca(c.cuota_mensual, 362.17, TOL_IMPORTE);
    return {
      pass: ok,
      esperado: '106.21 / 3893.79 / 362.17',
      obtenido: `${c.prima_usd.toFixed(2)} / ${c.desembolso_neto.toFixed(2)} / ${c.cuota_mensual.toFixed(2)}`
    };
  });

  caso(r, 'CA-10 (neg)', 'La cuota NO se calcula sobre el desembolso neto (≠ 352.55)', () => {
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735 });
    const sobreNeto = cuotaMensual(c.desembolso_neto, 12).toDecimalPlaces(2).toNumber();
    return {
      pass: !cerca(c.cuota_mensual, sobreNeto, TOL_IMPORTE),
      esperado: `cuota ≠ ${sobreNeto.toFixed(2)} (base = monto formalizado)`,
      obtenido: c.cuota_mensual.toFixed(2)
    };
  });

  caso(r, 'CA-10', 'prima_usd se redondea antes del neto: M − prima_usd = neto exacto', () => {
    const c = cotizarPN({ montoCredito: 3000, plazoMeses: 12, score: 515 });
    const esperado = D(3000).minus(c.prima_usd).toDecimalPlaces(2).toFixed(2);
    return {
      pass: D(c.desembolso_neto).toFixed(2) === esperado,
      esperado,
      obtenido: c.desembolso_neto.toFixed(2)
    };
  });

  /* ---------- CA-11 — Costo Total al Cliente · tabla §9.7 completa ---------- */

  GOLDEN_ESCENARIOS.forEach((g) => {
    caso(r, 'CA-11', `${g.nombre} · banda ${g.banda} · ${g.plazo}m ⇒ CTC ${(g.ctc * 100).toFixed(4)}%`, () => {
      const esc = buscarEscenarioDemo(g.nombre, true);
      const c = cotizarPN({ montoCredito: g.m, plazoMeses: g.plazo, score: esc.score, esDemo: true });
      const checks = {
        gar: cerca(c.monto_garantizado, g.gar, TOL_IMPORTE),
        prima: cerca(c.prima_usd, g.prima, TOL_IMPORTE),
        neto: cerca(c.desembolso_neto, g.neto, TOL_IMPORTE),
        cuota: cerca(c.cuota_mensual, g.cuota, TOL_IMPORTE),
        ctc: cerca(c.ctc_ea, g.ctc, TOL_TASA)
      };
      const ok = Object.values(checks).every(Boolean);
      return {
        pass: ok,
        esperado: `gar ${g.gar.toFixed(2)} · prima ${g.prima.toFixed(2)} · neto ${g.neto.toFixed(2)} · cuota ${g.cuota.toFixed(2)} · ctc ${(g.ctc * 100).toFixed(4)}%`,
        obtenido: `gar ${c.monto_garantizado.toFixed(2)} · prima ${c.prima_usd.toFixed(2)} · neto ${c.desembolso_neto.toFixed(2)} · cuota ${c.cuota_mensual.toFixed(2)} · ctc ${(c.ctc_ea * 100).toFixed(4)}%`
      };
    });
  });

  caso(r, 'CA-11 (neg)', 'CTC_EA > TEA_BANCO siempre que prima_usd > 0 (las 10 filas)', () => {
    const fallos = [];
    GOLDEN_ESCENARIOS.forEach((g) => {
      const esc = buscarEscenarioDemo(g.nombre, true);
      const c = cotizarPN({ montoCredito: g.m, plazoMeses: g.plazo, score: esc.score });
      if (!(c.prima_usd > 0 && c.ctc_ea > c.tea_banco)) {
        fallos.push(`${g.nombre}/${g.plazo}m`);
      }
    });
    return {
      pass: fallos.length === 0,
      esperado: 'ctc_ea > tea_banco en las 10 filas',
      obtenido: fallos.length === 0 ? '10/10 cumplen' : `fallan: ${fallos.join(', ')}`
    };
  });

  /* ---------- CA-12 — Presentación de dos líneas ---------- */

  caso(r, 'CA-12', 'La cotización expone tea_banco y ctc_ea como campos separados', () => {
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735 });
    const ok = 'tea_banco' in c && 'ctc_ea' in c && c.tea_banco !== c.ctc_ea;
    return {
      pass: ok,
      esperado: 'tea_banco y ctc_ea presentes y distintos',
      obtenido: `tea_banco=${c.tea_banco} · ctc_ea=${c.ctc_ea}`
    };
  });

  caso(r, 'CA-12 (neg)', 'No existe campo de tasa única que sume prima anualizada a la tasa base', () => {
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735 });
    const prohibidos = ['tasa_total', 'tasaTotal', 'prima_rate_anual', 'primaRateAnual', 'tasa_total_cliente'];
    const presentes = prohibidos.filter((k) => k in c);
    return {
      pass: presentes.length === 0,
      esperado: 'ningún campo de tasa combinada',
      obtenido: presentes.length === 0 ? 'ninguno presente' : `presentes: ${presentes.join(', ')}`
    };
  });

  /* ---------- Estado inicial por banda · §10.2 ---------- */

  const estadosEsperados = [
    [735, 'A', 'APROBADA'],
    [585, 'B', 'APROBADA'],
    [515, 'C', 'REQUIERE_REVISION_MANUAL'],
    [440, 'D', 'REQUIERE_APROBACION_RIESGOS'],
    [365, 'E', 'REQUIERE_EXCEPCION_ACIDPAY']
  ];
  estadosEsperados.forEach(([score, banda, estado]) => {
    caso(r, '§10.2', `Banda ${banda} · estado inicial ${estado}`, () => {
      const c = cotizarPN({ montoCredito: 2000, plazoMeses: 12, score });
      return { pass: c.estado === estado, esperado: estado, obtenido: c.estado };
    });
  });

  caso(r, '§10.1', 'Banda E NO es negativa automática: se cotiza y muestra precio', () => {
    const c = cotizarPN({ montoCredito: 2000, plazoMeses: 12, score: 365 });
    const ok = c.prima_usd > 0 && c.estado === 'REQUIERE_EXCEPCION_ACIDPAY';
    return {
      pass: ok,
      esperado: 'precio calculado · REQUIERE_EXCEPCION_ACIDPAY',
      obtenido: `prima ${c.prima_usd.toFixed(2)} · ${c.estado}`
    };
  });

  /* ---------- Versionado del tarifario ---------- */

  caso(r, '§8', 'Toda cotización persiste la versión del tarifario usado', () => {
    const c = cotizarPN({ montoCredito: 4000, plazoMeses: 12, score: 735 });
    return { pass: c.tarifario_version === 'v15', esperado: 'v15', obtenido: String(c.tarifario_version) };
  });

  return r;
}

/** Criterios que exigen servidor y quedan fuera de este paso. */
export const CRITERIOS_PENDIENTES_BACKEND = [
  {
    ca: 'CA-04 (neg)',
    detalle: 'Rechazo del techo de cobertura en el endpoint (petición HTTP directa con cobertura=0.95 ⇒ 4xx).'
  },
  {
    ca: 'CA-07',
    detalle: 'Aislamiento de tenant: ifi_id derivado de la sesión; ningún endpoint lo acepta en body, query o header.'
  },
  {
    ca: 'CA-13',
    detalle:
      'Excepción banda E: aprobación por Administrador ACIDPAY / CRO, justificación mínima de 40 caracteres, 403 para Oficial Comercial y bitácora append-only de intentos fallidos.'
  },
  {
    ca: 'CA-06 (parcial)',
    detalle: 'Un registro demo no puede transicionar a certificado emitido: validación de estado en el servidor al emitir.'
  }
];