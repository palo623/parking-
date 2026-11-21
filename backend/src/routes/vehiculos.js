import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, normalizarMatricula, validarMatricula } from '../utils.js';

// «Mis vehículos»: matrículas guardadas del usuario
const router = Router();
router.use(requireAuth);
const CAMPOS = 'id, matricula, alias, pais, principal, creado_en';

// GET /api/vehiculos
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('vehiculos').select(CAMPOS)
    .eq('usuario_id', req.user.id).order('principal', { ascending: false }).order('creado_en');
  if (error) throw error;
  res.json(data);
}));

// POST /api/vehiculos { matricula, pais: 'ES' | 'OTRO', alias }
router.post('/', asyncHandler(async (req, res) => {
  const pais = req.body?.pais === 'OTRO' ? 'OTRO' : 'ES';
  const matricula = normalizarMatricula(req.body?.matricula);
  if (!validarMatricula(matricula, pais)) return res.status(400).json({ error: 'Matrícula no válida' });
  const alias = String(req.body?.alias || '').trim().slice(0, 40);

  const { count } = await supabase.from('vehiculos').select('id', { count: 'exact', head: true }).eq('usuario_id', req.user.id);
  if (count >= 10) return res.status(400).json({ error: 'Puedes guardar hasta 10 vehículos' });

  const { data, error } = await supabase.from('vehiculos')
    .insert({ usuario_id: req.user.id, matricula, pais, alias, principal: count === 0 })
    .select(CAMPOS).single();
  if (error?.code === '23505') return res.status(409).json({ error: 'Ya tienes ese vehículo guardado' });
  if (error) throw error;
  res.status(201).json(data);
}));

// PATCH /api/vehiculos/:id/principal
router.patch('/:id/principal', asyncHandler(async (req, res) => {
  const { data: v } = await supabase.from('vehiculos').select('id').eq('id', req.params.id).eq('usuario_id', req.user.id).single();
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  // Primero se quita el principal actual (solo puede haber uno)
  const quitar = await supabase.from('vehiculos').update({ principal: false }).eq('usuario_id', req.user.id).eq('principal', true);
  if (quitar.error) throw quitar.error;
  const poner = await supabase.from('vehiculos').update({ principal: true }).eq('id', v.id);
  if (poner.error) throw poner.error;
  const { data, error } = await supabase.from('vehiculos').select(CAMPOS).eq('usuario_id', req.user.id).order('principal', { ascending: false }).order('creado_en');
  if (error) throw error;
  res.json(data);
}));

// DELETE /api/vehiculos/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { data: v } = await supabase.from('vehiculos').select('id, principal').eq('id', req.params.id).eq('usuario_id', req.user.id).single();
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  const { error } = await supabase.from('vehiculos').delete().eq('id', v.id);
  if (error) throw error;
  // Si era el principal, pasa a serlo el más antiguo que quede
  if (v.principal) {
    const { data: resto } = await supabase.from('vehiculos').select('id').eq('usuario_id', req.user.id).order('creado_en').limit(1);
    if (resto?.[0]) await supabase.from('vehiculos').update({ principal: true }).eq('id', resto[0].id);
  }
  res.status(204).end();
}));

export default router;
