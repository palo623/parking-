import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const TIPOS = ['normal', 'moto', 'electrico', 'discapacitados'];

// GET /api/admin/resumen
// «Ocupadas» cuenta las plazas con coche dentro ahora o que llegan en la próxima hora
// (las reservas empiezan en la siguiente media hora, así una reserva nueva se ve al momento).
router.get('/resumen', asyncHandler(async (_req, res) => {
  const ahora = new Date();
  const enUnaHora = new Date(ahora.getTime() + 60 * 60 * 1000).toISOString();
  const [plazas, ocupadas, confirmadas, ingresos] = await Promise.all([
    supabase.from('plazas').select('id', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('reservas').select('plaza_id')
      .eq('estado', 'confirmada').lt('inicio', enUnaHora).gt('fin', ahora.toISOString()),
    supabase.from('reservas').select('id', { count: 'exact', head: true })
      .eq('estado', 'confirmada').gt('fin', ahora.toISOString()),
    supabase.from('reservas').select('precio_total').neq('estado', 'cancelada'),
  ]);
  for (const r of [plazas, ocupadas, confirmadas, ingresos]) if (r.error) throw r.error;

  const ocupadasAhora = new Set(ocupadas.data.map((r) => r.plaza_id)).size;
  res.json({
    plazas_activas: plazas.count,
    ocupadas_ahora: ocupadasAhora,
    libres_ahora: Math.max(0, plazas.count - ocupadasAhora),
    reservas_pendientes: confirmadas.count,
    ingresos_totales: Math.round(ingresos.data.reduce((s, r) => s + Number(r.precio_total), 0) * 100) / 100,
  });
}));

// GET /api/admin/reservas
router.get('/reservas', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('reservas')
    .select('id, codigo, matricula, inicio, fin, precio_base, gastos_gestion, precio_total, estado, metodo_pago, pago_ref, plaza:plazas(codigo, parking:parkings(nombre)), usuario:perfiles(nombre, telefono)')
    .order('inicio', { ascending: false })
    .limit(500);
  if (error) throw error;
  res.json(data);
}));

// PATCH /api/admin/reservas/:id { estado }
router.patch('/reservas/:id', asyncHandler(async (req, res) => {
  const { estado } = req.body || {};
  if (!['confirmada', 'cancelada', 'completada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }
  const { data, error } = await supabase.from('reservas').update({ estado }).eq('id', req.params.id).select().single();
  if (error) {
    if (error.code === '23P01') return res.status(409).json({ error: 'Se solaparía con otra reserva' });
    throw error;
  }
  res.json(data);
}));

// GET /api/admin/accesos → últimas lecturas de la barrera
router.get('/accesos', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('accesos')
    .select('id, matricula, tipo, permitido, motivo, minutos_exceso, importe_extra, creado_en, reserva:reservas(codigo), usuario:perfiles(nombre)')
    .order('creado_en', { ascending: false })
    .limit(200);
  if (error) throw error;
  res.json(data);
}));

// GET /api/admin/plazas (incluye inactivas)
router.get('/plazas', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('plazas').select('*, parking:parkings(slug, nombre)').order('codigo');
  if (error) throw error;
  res.json(data);
}));

function validarPlaza(body, parcial = false) {
  const p = {};
  if (body.codigo !== undefined) p.codigo = String(body.codigo).trim().toUpperCase();
  if (body.planta !== undefined) p.planta = parseInt(body.planta, 10);
  if (body.tipo !== undefined) p.tipo = body.tipo;
  if (body.precio_hora !== undefined) p.precio_hora = Number(body.precio_hora);
  if (body.activa !== undefined) p.activa = Boolean(body.activa);
  if (body.parking_id !== undefined) p.parking_id = parseInt(body.parking_id, 10);

  if (!parcial && (!p.codigo || p.precio_hora === undefined)) return { error: 'Código y precio son obligatorios' };
  if (p.codigo !== undefined && !p.codigo) return { error: 'Código no válido' };
  if (p.parking_id !== undefined && isNaN(p.parking_id)) return { error: 'Parking no válido' };
  if (p.planta !== undefined && isNaN(p.planta)) return { error: 'Planta no válida' };
  if (p.tipo !== undefined && !TIPOS.includes(p.tipo)) return { error: 'Tipo no válido' };
  if (p.precio_hora !== undefined && (isNaN(p.precio_hora) || p.precio_hora < 0)) return { error: 'Precio no válido' };
  return { plaza: p };
}

// POST /api/admin/plazas
router.post('/plazas', asyncHandler(async (req, res) => {
  const { plaza, error: msg } = validarPlaza(req.body || {});
  if (msg) return res.status(400).json({ error: msg });
  const { data, error } = await supabase.from('plazas').insert(plaza).select().single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ya existe una plaza con ese código' });
    if (error.code === '23503') return res.status(400).json({ error: 'Ese parking no existe' });
    throw error;
  }
  res.status(201).json(data);
}));

// PATCH /api/admin/plazas/:id
router.patch('/plazas/:id', asyncHandler(async (req, res) => {
  const { plaza, error: msg } = validarPlaza(req.body || {}, true);
  if (msg) return res.status(400).json({ error: msg });
  const { data, error } = await supabase.from('plazas').update(plaza).eq('id', req.params.id).select().single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ya existe una plaza con ese código' });
    throw error;
  }
  res.json(data);
}));

export default router;
