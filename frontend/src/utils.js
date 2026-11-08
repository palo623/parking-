export const TIPOS = {
  normal: { nombre: 'Normal', icono: 'coche', color: '#2563eb', fondo: 'var(--primario-suave)' },
  electrico: { nombre: 'Eléctrico', icono: 'rayo', color: '#059669', fondo: 'var(--acento-suave)' },
  moto: { nombre: 'Moto', icono: 'moto', color: '#d97706', fondo: 'var(--aviso-suave)' },
  discapacitados: { nombre: 'Movilidad reducida', icono: 'accesible', color: '#7c3aed', fondo: 'color-mix(in srgb, #7c3aed 12%, transparent)' },
};

export const ESTADOS = {
  confirmada: { nombre: 'Confirmada', clase: 'badge-azul' },
  en_curso: { nombre: 'En curso', clase: 'badge-verde' },
  completada: { nombre: 'Completada', clase: '' },
  cancelada: { nombre: 'Cancelada', clase: 'badge-rojo' },
};

export const euros = (n) =>
  Number(n || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

export const fecha = (iso) =>
  new Date(iso).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const soloFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

export const soloHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

export const planta = (n) => (n === 0 ? 'Planta baja' : n < 0 ? `Sótano ${-n}` : `Planta ${n}`);

export function duracion(inicio, fin) {
  const min = Math.round((new Date(fin) - new Date(inicio)) / 60000);
  if (min <= 0) return '—';
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return [d && `${d} d`, h && `${h} h`, m && `${m} min`].filter(Boolean).join(' ');
}

export function tiempoRelativo(iso) {
  const diff = new Date(iso) - new Date();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (abs < 3600e3) return rtf.format(Math.round(diff / 60e3), 'minute');
  if (abs < 86400e3) return rtf.format(Math.round(diff / 3600e3), 'hour');
  return rtf.format(Math.round(diff / 86400e3), 'day');
}

// Estado "real" de una reserva teniendo en cuenta la hora actual
export function estadoReal(r) {
  if (r.estado !== 'confirmada') return r.estado;
  const ahora = new Date();
  if (new Date(r.fin) <= ahora) return 'completada';
  if (new Date(r.inicio) <= ahora) return 'en_curso';
  return 'confirmada';
}

// Valor para <input type="datetime-local"> en hora local
export function aInputLocal(d) {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function proximaHora(offsetHoras = 0) {
  const d = new Date();
  d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
  d.setHours(d.getHours() + offsetHoras);
  return d;
}

export const iniciales = (texto = '') =>
  texto.trim().split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || '?';

// Descarga un archivo .ics para añadir la reserva al calendario
export function descargarCalendario(r) {
  const f = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Parking//Reservas//ES', 'BEGIN:VEVENT',
    `UID:reserva-${r.id}@parking`, `DTSTAMP:${f(new Date().toISOString())}`,
    `DTSTART:${f(r.inicio)}`, `DTEND:${f(r.fin)}`,
    `SUMMARY:Parking · plaza ${r.plaza?.codigo}`,
    `DESCRIPTION:Reserva #${r.id} · Matrícula ${r.matricula}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  descargar(`reserva-${r.id}.ics`, ics, 'text/calendar');
}

export function descargarCSV(nombre, filas) {
  if (!filas.length) return;
  const cab = Object.keys(filas[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cab.map(esc).join(';'), ...filas.map((f) => cab.map((k) => esc(f[k])).join(';'))].join('\n');
  descargar(nombre, '﻿' + csv, 'text/csv;charset=utf-8');
}

function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Lectura/escritura segura de localStorage
export const almacen = {
  leer: (k, def = null) => { try { return localStorage.getItem(k) ?? def; } catch { return def; } },
  guardar: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
};
