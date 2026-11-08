export const TIPOS = {
  normal: { nombre: 'Normal', icono: '🚗' },
  moto: { nombre: 'Moto', icono: '🏍️' },
  electrico: { nombre: 'Eléctrico', icono: '⚡' },
  discapacitados: { nombre: 'Movilidad reducida', icono: '♿' },
};

export const euros = (n) =>
  Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export const fecha = (iso) =>
  new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

export const planta = (n) => (n === 0 ? 'Planta baja' : n < 0 ? `Sótano ${-n}` : `Planta ${n}`);

// Valor para <input type="datetime-local"> en hora local
export function aInputLocal(d) {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function horaRedonda(offsetHoras = 0) {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1 + offsetHoras);
  return d;
}
