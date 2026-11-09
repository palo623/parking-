import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { parseRango, asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth);

const CAMPOS = 'id, plaza_id, matricula, inicio, fin, precio_total, estado, creado_en, plaza:plazas(codigo, planta, tipo, precio_hora), valoracion:valoraciones(puntuacion, comentario)';

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

// GET /api/reservas/:id → una reserva (para el ticket)
router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await req.db
    .from('reservas')
    .select(CAMPOS)
    .eq('id', req.params.id)
    .eq('usuario_id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Reserva no encontrada' });
  res.json(data);
}));

// POST /api/reservas/:id/ampliar { fin }
router.post('/:id/ampliar', asyncHandler(async (req, res) => {
  const fin = new Date(req.body?.fin);
  if (isNaN(fin)) return res.status(400).json({ error: 'Fecha de salida no válida' });
  const { error } = await req.db.rpc('ampliar_reserva', { p_id: Number(req.params.id), p_nuevo_fin: fin.toISOString() });
  if (error) {
    if (error.code === '23P01') return res.status(409).json({ error: 'La plaza ya está reservada por otra persona en ese horario' });
    throw error;
  }
  const { data, error: err2 } = await req.db.from('reservas').select(CAMPOS).eq('id', req.params.id).single();
  if (err2) throw err2;
  res.json(data);
}));

// POST /api/reservas/:id/valoracion { puntuacion, comentario }
router.post('/:id/valoracion', asyncHandler(async (req, res) => {
  const puntuacion = parseInt(req.body?.puntuacion, 10);
  if (!(puntuacion >= 1 && puntuacion <= 5)) return res.status(400).json({ error: 'Elige de 1 a 5 estrellas' });
  const comentario = typeof req.body?.comentario === 'string' ? req.body.comentario.slice(0, 500) : null;
  const { error } = await req.db.rpc('valorar_reserva', { p_reserva_id: Number(req.params.id), p_puntuacion: puntuacion, p_comentario: comentario });
  if (error) throw error;
  res.status(201).json({ ok: true });
}));

// PATCH /api/reservas/:id/cancelar
router.patch('/:id/cancelar', asyncHandler(async (req, res) => {
  const { error } = await req.db.rpc('cancelar_reserva', { p_id: Number(req.params.id) });
  if (error) throw error;
  res.json({ ok: true });
}));

export default router;
