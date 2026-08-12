/**
 * Reglas del tarifario PN que DEBEN vivir en el servidor.
 * Compartidas por las funciones de backend; nunca duplicar esta lógica.
 */

export const TARIFARIO_VERSION = 'v15';
export const COBERTURA_MAXIMA = 0.8;
export const SCORE_MIN = 0;
export const SCORE_MAX = 850;
export const JUSTIFICACION_MIN_CHARS = 40;

/** Cobertura por defecto de cada banda (tabla 2.2 v15). */
export const COBERTURA_BANDA = { A: 0.7, B: 0.65, C: 0.6, D: 0.55, E: 0.5 };

/** Solo estos perfiles pueden autorizar una excepción de banda E. */
export const ROLES_APROBACION_EXCEPCION = ['admin_acidpay'];

/**
 * Perfil efectivo del usuario. Principio de menor privilegio: si el registro no
 * declara tipo_usuario NO se asume administrador, se asume oficial comercial.
 */
export function tipoUsuarioEfectivo(user) {
  const tipos = ['admin_acidpay', 'analista_riesgos', 'oficial_comercial', 'supervisor_banco'];
  return tipos.includes(user?.tipo_usuario) ? user.tipo_usuario : 'oficial_comercial';
}

/**
 * ifi_id derivado EXCLUSIVAMENTE de la sesión. Nunca se lee del body,
 * del query string ni de un header.
 */
export function ifiIdDeSesion(user) {
  const tipo = tipoUsuarioEfectivo(user);
  if (tipo === 'admin_acidpay' || tipo === 'analista_riesgos') {
    return user?.ifi_id || null; // ACIDPAY puede no estar adscrito a una IFI
  }
  if (!user?.ifi_id) {
    const e = new Error('El usuario no tiene una IFI asignada en su sesión.');
    e.status = 403;
    throw e;
  }
  return user.ifi_id;
}

export function getBandaFromScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n) || n < SCORE_MIN || n > SCORE_MAX) {
    const e = new Error(`Score fuera de rango válido (${SCORE_MIN}-${SCORE_MAX}): ${score}`);
    e.status = 400;
    throw e;
  }
  if (n >= 620) return 'A';
  if (n >= 550) return 'B';
  if (n >= 480) return 'C';
  if (n >= 400) return 'D';
  return 'E';
}

/** Techo duro de cobertura: 0 < c <= 0.80. */
export function validarCobertura(cobertura) {
  const c = Number(cobertura);
  if (!Number.isFinite(c) || c <= 0) {
    const e = new Error(`Cobertura inválida: ${cobertura}`);
    e.status = 400;
    throw e;
  }
  if (c > COBERTURA_MAXIMA) {
    const e = new Error(
      `La cobertura aplicada excede el techo duro de ${COBERTURA_MAXIMA * 100}% por operación.`
    );
    e.status = 400;
    throw e;
  }
  return c;
}

export function validarJustificacion(texto) {
  const t = typeof texto === 'string' ? texto.trim() : '';
  if (t.length < JUSTIFICACION_MIN_CHARS) {
    const e = new Error(
      `La justificación debe tener al menos ${JUSTIFICACION_MIN_CHARS} caracteres (recibidos ${t.length}).`
    );
    e.status = 400;
    throw e;
  }
  return t;
}

/**
 * Bitácora append-only: solo se crean registros, nunca se actualizan ni borran.
 * Los intentos DENEGADOS también se registran.
 */
export async function registrarBitacora(base44, datos) {
  return await base44.asServiceRole.entities.BitacoraExcepcion.create({
    ...datos,
    tarifario_version: TARIFARIO_VERSION,
    fecha: new Date().toISOString()
  });
}