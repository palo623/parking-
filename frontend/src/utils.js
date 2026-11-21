// Utilidades comunes de formato

export const TIPOS = {
  normal: ['Normal', 'Normal', 'Standard'],
  moto: ['Moto', 'Moto', 'Motorbike'],
  electrico: ['Eléctrico', 'Elèctric', 'Electric'],
  discapacitados: ['Movilidad reducida', 'Mobilitat reduïda', 'Reduced mobility'],
};

export const GESTION = 0.10; // 10 % de gastos de gestión (igual que el backend)

const pad = (n) => String(n).padStart(2, '0');

// 12.5 → "12,50 €"
export const euros = (n, locale = 'es-ES') =>
  Number(n || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

// minutos desde medianoche → "09:30"
export const hhmm = (m) => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);

// Date → "2026-11-15" (hora local)
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const diaIso = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return isoDate(d); };

// "2026-11-15" → "dom, 15 nov"
export const fechaCorta = (iso, locale = 'es-ES') =>
  new Date(iso + 'T00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

// ISO completo → "dom, 15 nov, 09:30"
export const fecha = (iso, locale = 'es-ES') =>
  new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const hora = (iso, locale = 'es-ES') =>
  new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

// Fecha "AAAA-MM-DD" + minutos → Date en hora local
export const aFecha = (dia, minutos) => {
  const d = new Date(dia + 'T00:00');
  d.setMinutes(minutos);
  return d;
};

export const planta = (n, T = (es) => es) =>
  n === 0 ? T('Planta baja', 'Planta baixa', 'Ground floor') : n < 0 ? T(`Sótano ${-n}`, `Soterrani ${-n}`, `Basement ${-n}`) : T(`Planta ${n}`, `Planta ${n}`, `Floor ${n}`);

// Matrícula: "1234 bcd" → "1234BCD" y vuelta a "1234 BCD"
export const normMatricula = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const fmtMatricula = (v) => {
  const n = normMatricula(v);
  return /^\d{4}[A-Z]{3}$/.test(n) ? `${n.slice(0, 4)} ${n.slice(4)}` : n;
};

// Precio con la misma regla que el servidor (cuartos de hora + 10 %)
export function precioEstimado(precioHora, minutos) {
  const base = Math.round(Math.ceil(minutos / 15) * 0.25 * precioHora * 100) / 100;
  const gestion = Math.round(base * GESTION * 100) / 100;
  return { base, gestion, total: Math.round((base + gestion) * 100) / 100 };
}

// ---- Matrículas ----
// España (desde 2000): 4 números + 3 letras sin vocales, Ñ ni Q → «1234 BCD».
// Matrículas extranjeras o antiguas españolas (p. ej. «T 1234 AB») tienen otros
// formatos, así que para ellas solo se pide entre 2 y 10 letras o números.
export const PAISES = {
  ES: ['España', 'Espanya', 'Spain'],
  OTRO: ['Otro país o antigua', 'Un altre país o antiga', 'Other country or old'],
};
const RE_ES = /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;
export function validarMatricula(valor, pais = 'ES') {
  const n = normMatricula(valor);
  if (pais === 'ES') return RE_ES.test(n);
  return /^[A-Z0-9]{2,10}$/.test(n);
}
// Adivina el país al cargar una matrícula guardada
export const paisDe = (valor) => (RE_ES.test(normMatricula(valor)) ? 'ES' : 'OTRO');
