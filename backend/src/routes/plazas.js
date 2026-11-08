import { Router } from 'express';
import { supabase } from '../supabase.js';
import { parseRango, asyncHandler } from '../utils.js';

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

  const { data, error } = await supabase.rpc('plazas_disponibles', {
    p_inicio: rango.inicio.toISOString(),
    p_fin: rango.fin.toISOString(),
    p_tipo: req.query.tipo || null,
  });
  if (error) throw error;
  res.json(data);
}));

export default router;
