import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  ifiIdDeSesion,
  tipoUsuarioEfectivo,
  getBandaFromScore,
  validarCobertura,
  validarJustificacion,
  COBERTURA_BANDA,
  ROLES_APROBACION_EXCEPCION,
  registrarBitacora
} from '../../shared/reglasTarifarioPN.js';

/**
 * Autoriza (o deniega) una excepción de banda E.
 * Solo Administrador ACIDPAY / CRO. Justificación mínima obligatoria.
 * Todo intento —permitido o denegado— queda en la bitácora append-only.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tipo = tipoUsuarioEfectivo(user);
    const ifiId = ifiIdDeSesion(user);

    const base = {
      accion: 'excepcion_banda_e',
      usuario_id: user.id,
      usuario_nombre: user.full_name,
      usuario_email: user.email,
      usuario_tipo: tipo,
      ifi_id: ifiId,
      score: Number(body.score) || null,
      monto_credito: Number(body.monto_credito) || null,
      justificacion: typeof body.justificacion === 'string' ? body.justificacion.trim() : null
    };

    if (!ROLES_APROBACION_EXCEPCION.includes(tipo)) {
      const motivo = `Perfil ${tipo} no está autorizado a aprobar excepciones de banda E.`;
      await registrarBitacora(base44, { ...base, resultado: 'denegado', motivo });
      return Response.json({ error: motivo }, { status: 403 });
    }

    let banda;
    let cobertura;
    let justificacion;
    try {
      banda = getBandaFromScore(body.score);
      if (banda !== 'E') {
        const e = new Error(`La operación es banda ${banda}: no requiere excepción de banda E.`);
        e.status = 400;
        throw e;
      }
      cobertura =
        body.cobertura_aplicada === undefined || body.cobertura_aplicada === null
          ? COBERTURA_BANDA.E
          : validarCobertura(body.cobertura_aplicada);
      justificacion = validarJustificacion(body.justificacion);
    } catch (validacion) {
      await registrarBitacora(base44, {
        ...base,
        resultado: 'denegado',
        motivo: validacion.message,
        banda: banda || null,
        cobertura_aplicada: Number(body.cobertura_aplicada) || null
      });
      return Response.json({ error: validacion.message }, { status: validacion.status || 400 });
    }

    const registro = await registrarBitacora(base44, {
      ...base,
      resultado: 'permitido',
      motivo: 'Excepción de banda E autorizada.',
      banda: 'E',
      cobertura_aplicada: cobertura,
      justificacion
    });

    return Response.json({
      ok: true,
      aprobado: true,
      bitacora_id: registro.id,
      aprobado_por: user.full_name,
      aprobado_por_tipo: tipo,
      banda: 'E',
      cobertura_aplicada: cobertura
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}