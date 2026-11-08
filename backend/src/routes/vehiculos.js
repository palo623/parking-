import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, normalizarMatricula, MATRICULA_RE } from '../utils.js';

const router = Router();
router.use(requireAuth);

// GET /api/vehiculos
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await req.db
    .from('vehiculos')
    .select('id, matricula, alias')
    .order('creado_en');
  if (error) throw error;
  res.json(data);
}));

// POST /api/vehiculos { matricula, alias }
router.post('/', asyncHandler(async (req, res) => {
  const matricula = normalizarMatricula(req.body?.matricula);
  if (!MATRICULA_RE.test(matricula)) return res.status(400).json({ error: 'Matrícula no válida' });
  const alias = String(req.body?.alias || '').trim().slice(0, 40) || null;

  const { data, error } = await req.db
    .from('vehiculos')
    .insert({ matricula, alias })
    .select('id, matricula, alias')
    .single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ya tienes guardado ese vehículo' });
    throw error;
  }
  res.status(201).json(data);
}));

// DELETE /api/vehiculos/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await req.db.from('vehiculos').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ ok: true });
}));

export default router;
