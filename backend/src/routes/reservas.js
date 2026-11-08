import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { parseRango, calcularPrecio, asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth);

const MATRICULA_RE = /^[A-Z0-9-]{4,10}$/;

// GET /api/reservas → reservas del usuario
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('reservas')
    .select('id, matricula, inicio, fin, precio_total, estado, creado_en, plaza:plazas(codigo, planta, tipo)')
    .eq('usuario_id', req.user.id)
    .order('inicio', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

// POST /api/reservas  { plaza_id, matricula, inicio, fin }
router.post('/', asyncHandler(async (req, res) => {
  const { plaza_id, inicio: i, fin: f } = req.body || {};
  const matricula = String(req.body?.matricula || '').toUpperCase().replace(/\s+/g, '');

  if (!plaza_id) return res.status(400).json({ error: 'Falta la plaza' });
  if (!MATRICULA_RE.test(matricula)) return res.status(400).json({ error: 'Matrícula no válida' });

  const rango = parseRango(i, f);
  if (rango.error) return res.status(400).json({ error: rango.error });
  const { inicio, fin } = rango;
  if (inicio < new Date(Date.now() - 5 * 60 * 1000)) {
    return res.status(400).json({ error: 'No puedes reservar en el pasado' });
  }

  const { data: plaza, error: errPlaza } = await supabase
    .from('plazas')
    .select('id, precio_hora, activa')
    .eq('id', plaza_id)
    .single();
  if (errPlaza || !plaza || !plaza.activa) return res.status(404).json({ error: 'La plaza no existe' });

  const { data, error } = await supabase
    .from('reservas')
    .insert({
      usuario_id: req.user.id,
      plaza_id: plaza.id,
      matricula,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      precio_total: calcularPrecio(plaza.precio_hora, inicio, fin),
    })
    .select('id, matricula, inicio, fin, precio_total, estado, plaza:plazas(codigo, planta, tipo)')
    .single();

  if (error) {
    // 23P01 = violación de la restricción de no solape
    if (error.code === '23P01') return res.status(409).json({ error: 'Esa plaza ya está reservada en ese horario' });
    throw error;
  }
  res.status(201).json(data);
}));

// PATCH /api/reservas/:id/cancelar
router.patch('/:id/cancelar', asyncHandler(async (req, res) => {
  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, usuario_id, inicio, estado')
    .eq('id', req.params.id)
    .single();

  if (!reserva || reserva.usuario_id !== req.user.id) return res.status(404).json({ error: 'Reserva no encontrada' });
  if (reserva.estado !== 'confirmada') return res.status(400).json({ error: 'Esta reserva ya no se puede cancelar' });
  if (new Date(reserva.inicio) <= new Date()) return res.status(400).json({ error: 'La reserva ya ha empezado' });

  const { data, error } = await supabase
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', reserva.id)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
}));

export default router;
