import { supabase, clienteDeUsuario } from '../supabase.js';

// Comprueba el token de Supabase que envía el front end (Authorization: Bearer <token>)
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No has iniciado sesión' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Sesión no válida o caducada' });

    req.db = clienteDeUsuario(token);
    const { data: perfil } = await req.db
      .from('perfiles')
      .select('id, nombre, telefono, rol')
      .eq('id', data.user.id)
      .single();

    req.user = { id: data.user.id, email: data.user.email, ...(perfil || { rol: 'cliente' }) };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'Solo para administradores' });
  next();
}
