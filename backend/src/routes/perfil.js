import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth);

// GET /api/perfil
router.get('/', (req, res) => res.json(req.user));

// PATCH /api/perfil { nombre, telefono, preferencias }  (el rol no se puede cambiar desde aquí)
router.patch('/', asyncHandler(async (req, res) => {
  const cambios = {};
  if (typeof req.body?.nombre === 'string') cambios.nombre = req.body.nombre.trim().slice(0, 80);
  if (typeof req.body?.telefono === 'string') cambios.telefono = req.body.telefono.trim().slice(0, 20);
  // Preferencias: solo las claves conocidas y con valores válidos
  const p = req.body?.preferencias;
  if (p && typeof p === 'object') {
    const prefs = {};
    if (['claro', 'oscuro'].includes(p.tema)) prefs.tema = p.tema;
    if (['es', 'ca', 'en'].includes(p.idioma)) prefs.idioma = p.idioma;
    if (p.avisos && typeof p.avisos === 'object') {
      prefs.avisos = Object.fromEntries(['fin', 'email', 'ofertas'].filter((k) => k in p.avisos).map((k) => [k, Boolean(p.avisos[k])]));
    }
    cambios.preferencias = { ...(req.user.preferencias || {}), ...prefs };
  }
  if (!Object.keys(cambios).length) return res.status(400).json({ error: 'Nada que cambiar' });

  const { data, error } = await supabase
    .from('perfiles')
    .update(cambios)
    .eq('id', req.user.id)
    .select('id, nombre, telefono, rol, preferencias')
    .single();
  if (error) throw error;
  res.json({ ...data, email: req.user.email });
}));

export default router;
