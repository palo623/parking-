import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Valores del proyecto. La clave anon es pública (es la misma que usa el navegador);
// la seguridad la ponen las políticas y funciones de la base de datos.
// Se pueden cambiar con variables de entorno o un archivo backend/.env.
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qlhqrjbdufqwvzqlsosi.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaHFyamJkdWZxd3Z6cWxzb3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNTcwMzUsImV4cCI6MjEwOTczMzAzNX0.1hBaotN9Y4zofJ24YS9K9gJUeAbi6pXKoivNdEPflTk';

const opciones = { auth: { persistSession: false, autoRefreshToken: false } };

// Cliente sin usuario (para datos públicos y para comprobar tokens)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opciones);

// Cliente que actúa en nombre del usuario que ha iniciado sesión
export function clienteDeUsuario(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...opciones,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
