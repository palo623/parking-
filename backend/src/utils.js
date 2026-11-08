// Valida y convierte el rango de fechas recibido
export function parseRango(inicioStr, finStr) {
  const inicio = new Date(inicioStr);
  const fin = new Date(finStr);
  if (isNaN(inicio) || isNaN(fin)) return { error: 'Fechas no válidas' };
  if (fin <= inicio) return { error: 'La fecha de salida debe ser posterior a la de entrada' };
  if (fin - inicio > 30 * 24 * 3600 * 1000) return { error: 'La reserva no puede superar 30 días' };
  return { inicio, fin };
}

// Precio = horas (redondeadas al cuarto de hora hacia arriba) × precio/hora
export function calcularPrecio(precioHora, inicio, fin) {
  const cuartos = Math.ceil((fin - inicio) / (15 * 60 * 1000));
  return Math.round(cuartos * 0.25 * Number(precioHora) * 100) / 100;
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
