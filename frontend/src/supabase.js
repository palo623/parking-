import { createClient } from '@supabase/supabase-js';

// Datos públicos del proyecto de Supabase (la clave anon está pensada para usarse en el navegador).
// Se pueden cambiar con un archivo frontend/.env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://qlhqrjbdufqwvzqlsosi.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaHFyamJkdWZxd3Z6cWxzb3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNTcwMzUsImV4cCI6MjEwOTczMzAzNX0.1hBaotN9Y4zofJ24YS9K9gJUeAbi6pXKoivNdEPflTk';

export const supabaseConfigurado = Boolean(url && anonKey);

// Solo se usa para iniciar sesión / registrarse. Los datos van por el backend.
export const supabase = createClient(url, anonKey);
