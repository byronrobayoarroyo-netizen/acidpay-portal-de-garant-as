import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  ifiIdDeSesion,
  tipoUsuarioEfectivo,
  getBandaFromScore,
  validarCobertura,
  COBERTURA_BANDA,
  TARIFARIO_VERSION,
  registrarBitacora
} from '../../shared/reglasTarifarioPN.js';

/**
 * Valida una cotización PN en servidor.
 * - ifi_id SIEMPRE se deriva de la sesión; cualquier ifi_id del payload se ignora.
 * - Techo de cobertura del 80% aplicado aquí, no solo en la UI.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tipo = tipoUsuarioEfectivo(user);
    const ifiId = ifiIdDeSesion(user);

    const ifiIdRecibido =
      body.ifi_id ||
      new URL(req.url).searchParams.get('ifi_id') ||
      req.headers.get('x-ifi-id') ||
      null;

    let banda;
    let cobertura;
    try {
      banda = getBandaFromScore(body.score);
      cobertura =
        body.cobertura_aplicada === undefined || body.cobertura_aplicada === null
          ? COBERTURA_BANDA[banda]
          : validarCobertura(body.cobertura_aplicada);
    } catch (validacion) {
      await registrarBitacora(base44, {
        accion: 'cotizacion',
        resultado: 'denegado',
        motivo: validacion.message,
        usuario_id: user.id,
        usuario_nombre: user.full_name,
        usuario_email: user.email,
        usuario_tipo: tipo,
        ifi_id: ifiId,
        score: Number(body.score) || null,
        monto_credito: Number(body.monto_credito) || null,
        cobertura_aplicada: Number(body.cobertura_aplicada) || null
      });
      return Response.json(
        { error: validacion.message },
        { status: validacion.status || 400 }
      );
    }

    const requiereCRO = cobertura > COBERTURA_BANDA[banda];

    return Response.json({
      ok: true,
      tarifario_version: TARIFARIO_VERSION,
      ifi_id: ifiId,
      ifi_id_origen: 'sesion',
      ifi_id_recibido_ignorado: ifiIdRecibido,
      usuario_tipo: tipo,
      banda,
      cobertura_aplicada: cobertura,
      cobertura_banda: COBERTURA_BANDA[banda],
      requiere_aprobacion_cro: requiereCRO,
      requiere_excepcion_banda_e: banda === 'E'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 500 });
  }
}