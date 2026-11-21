import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // En local van en backend/.env; en Vercel, en Settings → Environment Variables
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (backend/.env o variables de Vercel)');
}

// Cliente con service_role: solo se usa en el servidor
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
