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

  const json = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

export const api = {
  // Público
  parkings: () => request('/parkings'),
  parkingsDisponibles: (inicio, fin, tipo = 'normal') =>
    request(`/parkings/disponibles?${new URLSearchParams({ inicio, fin, tipo })}`),

  asistenteEstado: () => request('/asistente/estado'),
  asistente: (mensajes) => request('/asistente', { method: 'POST', body: { mensajes } }),

  // Cliente
  misReservas: () => request('/reservas'),
  crearReserva: (datos) => request('/reservas', { method: 'POST', body: datos }),
  cancelarReserva: (id) => request(`/reservas/${id}/cancelar`, { method: 'PATCH' }),
  barrera: (matricula, tipo) => request('/accesos', { method: 'POST', body: { matricula, tipo } }),
  misAccesos: () => request('/accesos'),
  perfil: () => request('/perfil'),
  vehiculos: () => request('/vehiculos'),
  crearVehiculo: (datos) => request('/vehiculos', { method: 'POST', body: datos }),
  borrarVehiculo: (id) => request(`/vehiculos/${id}`, { method: 'DELETE' }),
  vehiculoPrincipal: (id) => request(`/vehiculos/${id}/principal`, { method: 'PATCH' }),
  actualizarPerfil: (datos) => request('/perfil', { method: 'PATCH', body: datos }),

  // Administración
  admin: {
    resumen: () => request('/admin/resumen'),
    reservas: () => request('/admin/reservas'),
    accesos: () => request('/admin/accesos'),
    cambiarEstado: (id, estado) => request(`/admin/reservas/${id}`, { method: 'PATCH', body: { estado } }),
    plazas: () => request('/admin/plazas'),
    crearPlaza: (datos) => request('/admin/plazas', { method: 'POST', body: datos }),
    editarPlaza: (id, datos) => request(`/admin/plazas/${id}`, { method: 'PATCH', body: datos }),
  },
};
