import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth);

// GET /api/perfil
router.get('/', (req, res) => res.json(req.user));

// PATCH /api/perfil { nombre, telefono }  (el rol no se puede cambiar desde aquí)
router.patch('/', asyncHandler(async (req, res) => {
  const cambios = {};
  if (typeof req.body?.nombre === 'string') cambios.nombre = req.body.nombre.trim().slice(0, 80);
  if (typeof req.body?.telefono === 'string') cambios.telefono = req.body.telefono.trim().slice(0, 20);

  const { data, error } = await req.db
    .from('perfiles')
    .update(cambios)
    .eq('id', req.user.id)
    .select('id, nombre, telefono, rol')
    .single();
  if (error) throw error;
  res.json({ ...data, email: req.user.email });
}));

export default router;
