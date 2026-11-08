import { Router } from 'express';
import { supabase } from '../supabase.js';
import { parseRango, calcularPrecio, asyncHandler } from '../utils.js';

const router = Router();

// GET /api/plazas → todas las plazas activas
router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('plazas')
    .select('id, codigo, planta, tipo, precio_hora')
    .eq('activa', true)
    .order('codigo');
  if (error) throw error;
  res.json(data);
}));

// GET /api/plazas/disponibles?inicio=...&fin=...&tipo=...
router.get('/disponibles', asyncHandler(async (req, res) => {
  const rango = parseRango(req.query.inicio, req.query.fin);
  if (rango.error) return res.status(400).json({ error: rango.error });
  const { inicio, fin } = rango;

  let query = supabase
    .from('plazas')
    .select('id, codigo, planta, tipo, precio_hora')
    .eq('activa', true)
    .order('codigo');
  if (req.query.tipo) query = query.eq('tipo', req.query.tipo);
  const { data: plazas, error } = await query;
  if (error) throw error;

  // Reservas confirmadas que se solapan con el rango pedido
  const { data: ocupadas, error: err2 } = await supabase
    .from('reservas')
    .select('plaza_id')
    .eq('estado', 'confirmada')
    .lt('inicio', fin.toISOString())
    .gt('fin', inicio.toISOString());
  if (err2) throw err2;

  const idsOcupadas = new Set(ocupadas.map((r) => r.plaza_id));
  res.json(
    plazas
      .filter((p) => !idsOcupadas.has(p.id))
      .map((p) => ({ ...p, precio_estimado: calcularPrecio(p.precio_hora, inicio, fin) }))
  );
}));

export default router;
