import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { parseRango, asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth);

const CAMPOS = 'id, plaza_id, matricula, inicio, fin, precio_total, estado, creado_en, plaza:plazas(codigo, planta, tipo)';

// GET /api/reservas → reservas del usuario
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await req.db
    .from('reservas')
    .select(CAMPOS)
    .eq('usuario_id', req.user.id)
    .order('inicio', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

// POST /api/reservas  { plaza_id, matricula, inicio, fin }
router.post('/', asyncHandler(async (req, res) => {
  const { plaza_id, matricula, inicio: i, fin: f } = req.body || {};
  if (!plaza_id) return res.status(400).json({ error: 'Falta la plaza' });
  const rango = parseRango(i, f);
  if (rango.error) return res.status(400).json({ error: rango.error });

  // La base de datos valida, calcula el precio y evita solapes
  const { data: id, error } = await req.db.rpc('crear_reserva', {
    p_plaza_id: plaza_id,
    p_matricula: matricula,
    p_inicio: rango.inicio.toISOString(),
    p_fin: rango.fin.toISOString(),
  });
  if (error) throw error;

  const { data, error: err2 } = await req.db.from('reservas').select(CAMPOS).eq('id', id).single();
  if (err2) throw err2;
  res.status(201).json(data);
}));

// PATCH /api/reservas/:id/cancelar
router.patch('/:id/cancelar', asyncHandler(async (req, res) => {
  const { error } = await req.db.rpc('cancelar_reserva', { p_id: Number(req.params.id) });
  if (error) throw error;
  res.json({ ok: true });
}));

export default router;
