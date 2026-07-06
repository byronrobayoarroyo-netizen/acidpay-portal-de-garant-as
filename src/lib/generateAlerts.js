import { base44 } from '@/api/base44Client';

/**
 * Escanea casos de mora y liquidaciones, genera alertas automáticas
 * cuando se acercan a fechas límite. Ejecutar al cargar el dashboard.
 */
export async function generateAlerts() {
  const now = new Date();
  let generated = 0;

  try {
    // Get existing alerts to avoid duplicates
    const existing = await base44.entities.Alerta.list('-fecha_creacion', 200);
    const existingKeys = new Set(
      existing.map(a => `${a.tipo}-${a.caso_mora_id || ''}-${a.liquidacion_id || ''}`)
    );

    const makeKey = (tipo, casoId, liqId) => `${tipo}-${casoId || ''}-${liqId || ''}`;

    // 1. Casos de mora aprobados — siniestro próximo a vencer (8 días hábiles)
    const casos = await base44.entities.CasoMora.list('-fecha_primer_incumplimiento', 100);
    const casosAprobados = casos.filter(c => c.estado === 'aprobado' && c.fecha_limite_pago_siniestro);

    for (const caso of casosAprobados) {
      const limite = new Date(caso.fecha_limite_pago_siniestro);
      const diasRest = Math.ceil((limite - now) / (1000 * 60 * 60 * 24));

      if (diasRest <= 3) {
        const key = makeKey('siniestro_proximo', caso.id, null);
        if (!existingKeys.has(key)) {
          await base44.entities.Alerta.create({
            tipo: 'siniestro_proximo',
            titulo: 'Pago de siniestro próximo a vencer',
            mensaje: `Caso ${caso.certificado_numero} — ${caso.cliente_nombre} (${caso.ifi_nombre}). ${diasRest <= 0 ? `Vencido hace ${Math.abs(diasRest)} días` : `Faltan ${diasRest} días`} para el pago del siniestro.`,
            ifi_id: caso.ifi_id,
            caso_mora_id: caso.id,
            fecha_limite: caso.fecha_limite_pago_siniestro,
            dias_restantes: diasRest,
            leida: false,
            fecha_creacion: now.toISOString()
          });
          existingKeys.add(key);
          generated++;
        }
      }
    }

    // 2. Casos observados sin respuesta por más de 5 días
    const casosObservados = casos.filter(c => c.estado === 'observado' && c.fecha_decision);
    for (const caso of casosObservados) {
      const fechaDecision = new Date(caso.fecha_decision);
      const diasDesde = Math.ceil((now - fechaDecision) / (1000 * 60 * 60 * 24));

      if (diasDesde >= 5) {
        const key = makeKey('mora_proxima', caso.id, null);
        if (!existingKeys.has(key)) {
          await base44.entities.Alerta.create({
            tipo: 'mora_proxima',
            titulo: 'Caso observado sin respuesta',
            mensaje: `Caso ${caso.certificado_numero} — ${caso.cliente_nombre} (${caso.ifi_nombre}). Han pasado ${diasDesde} días desde la observación. El banco debe completar la evidencia de gestión de cobranza.`,
            ifi_id: caso.ifi_id,
            caso_mora_id: caso.id,
            fecha_limite: caso.fecha_decision,
            dias_restantes: -diasDesde,
            leida: false,
            fecha_creacion: now.toISOString()
          });
          existingKeys.add(key);
          generated++;
        }
      }
    }

    // 3. Liquidaciones próximas a vencer o vencidas
    const liquidaciones = await base44.entities.Liquidacion.list('-mes', 100);
    const liqPendientes = liquidaciones.filter(l => l.estado === 'pendiente' || l.estado === 'parcial');

    for (const liq of liqPendientes) {
      if (!liq.fecha_limite_pago) continue;
      const limite = new Date(liq.fecha_limite_pago);
      const diasRest = Math.ceil((limite - now) / (1000 * 60 * 60 * 24));

      if (diasRest <= 5) {
        const tipo = diasRest <= 0 ? 'liquidacion_vencida' : 'liquidacion_proxima';
        const key = makeKey(tipo, null, liq.id);
        if (!existingKeys.has(key)) {
          await base44.entities.Alerta.create({
            tipo,
            titulo: diasRest <= 0 ? 'Liquidación vencida' : 'Liquidación próxima a vencer',
            mensaje: `${liq.ifi_nombre} — ${liq.mes}. ${diasRest <= 0 ? `Vencida hace ${Math.abs(diasRest)} días` : `Faltan ${diasRest} días`}. Prima pendiente: USD ${(liq.prima_total - (liq.pago_monto || 0)).toFixed(2)}.`,
            ifi_id: liq.ifi_id,
            liquidacion_id: liq.id,
            fecha_limite: liq.fecha_limite_pago,
            dias_restantes: diasRest,
            leida: false,
            fecha_creacion: now.toISOString()
          });
          existingKeys.add(key);
          generated++;
        }
      }
    }
  } catch (e) {
    console.error('Error generating alerts:', e);
  }

  return generated;
}