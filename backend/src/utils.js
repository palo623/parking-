// Valida y convierte el rango de fechas recibido
export function parseRango(inicioStr, finStr) {
  const inicio = new Date(inicioStr);
  const fin = new Date(finStr);
  if (isNaN(inicio) || isNaN(fin)) return { error: 'Fechas no válidas' };
  if (fin <= inicio) return { error: 'La fecha de salida debe ser posterior a la de entrada' };
  if (fin - inicio > 30 * 24 * 3600 * 1000) return { error: 'La reserva no puede superar 30 días' };
  return { inicio, fin };
}

export const MATRICULA_RE = /^[A-Z0-9-]{4,10}$/;
export const normalizarMatricula = (m) => String(m || '').toUpperCase().replace(/\s+/g, '');

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Convierte los errores de la base de datos en respuestas claras
export function respuestaDeError(err) {
  switch (err?.code) {
    case 'P0001': return [400, err.message];                                  // raise exception en funciones SQL
    case '23P01': return [409, 'Esa plaza ya está reservada en ese horario'];  // reservas solapadas
    case '23505': return [409, 'Ya existe una plaza con ese código'];
    case '42501': return [403, 'No tienes permiso para hacer esto'];
    case 'PGRST116': return [404, 'No encontrado'];
    default: return [500, 'Error interno del servidor'];
  }
}
