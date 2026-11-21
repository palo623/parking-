import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anonKey);

if (!supabaseConfigurado) {
  console.warn('Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en frontend/.env');
}

// Solo se usa para iniciar sesión / registrarse. Los datos van por el backend.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder');
