import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, { method = 'GET', body } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se puede conectar con el servidor. ¿Está arrancado el backend?');
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

const q = (obj) => new URLSearchParams(Object.fromEntries(Object.entries(obj).filter(([, v]) => v))).toString();

export const api = {
  plazas: () => request('/plazas'),
  mapa: (inicio, fin) => request(`/plazas/mapa?${q({ inicio, fin })}`),
  plazasDisponibles: (inicio, fin, tipo) => request(`/plazas/disponibles?${q({ inicio, fin, tipo })}`),

  misReservas: () => request('/reservas'),
  reserva: (id) => request(`/reservas/${id}`),
  crearReserva: (datos) => request('/reservas', { method: 'POST', body: datos }),
  cancelarReserva: (id) => request(`/reservas/${id}/cancelar`, { method: 'PATCH' }),

  ampliarReserva: (id, fin) => request(`/reservas/${id}/ampliar`, { method: 'POST', body: { fin } }),
  valorarReserva: (id, puntuacion, comentario) => request(`/reservas/${id}/valoracion`, { method: 'POST', body: { puntuacion, comentario } }),
  valoraciones: () => request('/valoraciones'),
  contacto: (datos) => request('/contacto', { method: 'POST', body: datos }),

  perfil: () => request('/perfil'),
  actualizarPerfil: (datos) => request('/perfil', { method: 'PATCH', body: datos }),

  vehiculos: () => request('/vehiculos'),
  crearVehiculo: (datos) => request('/vehiculos', { method: 'POST', body: datos }),
  borrarVehiculo: (id) => request(`/vehiculos/${id}`, { method: 'DELETE' }),

  chatEstado: () => request('/chat/estado'),
  chat: (mensajes) => request('/chat', { method: 'POST', body: { mensajes: mensajes.map(({ rol, texto }) => ({ rol, texto })) } }),

  admin: {
    resumen: () => request('/admin/resumen'),
    estadisticas: (dias = 14) => request(`/admin/estadisticas?dias=${dias}`),
    reservas: () => request('/admin/reservas'),
    cambiarEstado: (id, estado) => request(`/admin/reservas/${id}`, { method: 'PATCH', body: { estado } }),
    plazas: () => request('/admin/plazas'),
    crearPlaza: (datos) => request('/admin/plazas', { method: 'POST', body: datos }),
    editarPlaza: (id, datos) => request(`/admin/plazas/${id}`, { method: 'PATCH', body: datos }),
    agenda: (dia) => request(`/admin/agenda?dia=${dia}`),
    mensajes: () => request('/admin/mensajes'),
    marcarMensaje: (id, leido) => request(`/admin/mensajes/${id}`, { method: 'PATCH', body: { leido } }),
    valoraciones: () => request('/admin/valoraciones'),
    moderarValoracion: (id, visible) => request(`/admin/valoraciones/${id}`, { method: 'PATCH', body: { visible } }),
    usuarios: () => request('/admin/usuarios'),
    cambiarRol: (id, rol) => request(`/admin/usuarios/${id}`, { method: 'PATCH', body: { rol } }),
  },
};
