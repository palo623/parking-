// Valida y convierte el rango de fechas recibido
export function parseRango(inicioStr, finStr) {
  const inicio = new Date(inicioStr);
  const fin = new Date(finStr);
  if (isNaN(inicio) || isNaN(fin)) return { error: 'Fechas no válidas' };
  if (fin <= inicio) return { error: 'La fecha de salida debe ser posterior a la de entrada' };
  if (fin - inicio > 30 * 24 * 3600 * 1000) return { error: 'La reserva no puede superar 30 días' };
  return { inicio, fin };
}

const redondear = (n) => Math.round(n * 100) / 100;

// Porcentaje de gastos de gestión que se suma a la tarifa
export const GESTION = 0.10;

// Precio base = horas (redondeadas al cuarto de hora hacia arriba) × precio/hora
export function calcularPrecio(precioHora, inicio, fin) {
  const cuartos = Math.ceil((fin - inicio) / (15 * 60 * 1000));
  return redondear(cuartos * 0.25 * Number(precioHora));
}

// Precio desglosado: base + 10 % de gestión = total
export function desglosePrecio(precioHora, inicio, fin) {
  const base = calcularPrecio(precioHora, inicio, fin);
  const gestion = redondear(base * GESTION);
  return { precio_base: base, gastos_gestion: gestion, precio_total: redondear(base + gestion) };
}

// Importe de los minutos de más al salir: minutos × (precio/hora ÷ 60)
export function importeExceso(precioHora, minutos) {
  return redondear((Number(precioHora) / 60) * minutos);
}

// Matrícula sin espacios ni guiones y en mayúsculas: "1234 bcd" → "1234BCD"
export function normalizarMatricula(valor) {
  return String(valor || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// España (desde 2000): 4 números + 3 letras sin vocales, Ñ ni Q.
// Extranjeras o españolas antiguas: de 2 a 10 letras o números.
export function validarMatricula(matricula, pais = 'ES') {
  if (pais === 'ES') return /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/.test(matricula);
  return /^[A-Z0-9]{2,10}$/.test(matricula);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
