import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const TIPOS = ['normal', 'moto', 'electrico', 'discapacitados'];

// GET /api/admin/resumen
router.get('/resumen', asyncHandler(async (req, res) => {
  const ahora = new Date().toISOString();
  const [plazas, activasAhora, confirmadas, ingresos] = await Promise.all([
    req.db.from('plazas').select('id', { count: 'exact', head: true }).eq('activa', true),
    req.db.from('reservas').select('id', { count: 'exact', head: true })
      .eq('estado', 'confirmada').lte('inicio', ahora).gt('fin', ahora),
    req.db.from('reservas').select('id', { count: 'exact', head: true })
      .eq('estado', 'confirmada').gt('fin', ahora),
    req.db.from('reservas').select('precio_total').neq('estado', 'cancelada'),
  ]);
  for (const r of [plazas, activasAhora, confirmadas, ingresos]) if (r.error) throw r.error;

  res.json({
    plazas_activas: plazas.count,
    ocupadas_ahora: activasAhora.count,
    reservas_pendientes: confirmadas.count,
    ingresos_totales: ingresos.data.reduce((s, r) => s + Number(r.precio_total), 0),
  });
}));

// GET /api/admin/reservas
router.get('/reservas', asyncHandler(async (req, res) => {
  const { data, error } = await req.db
    .from('reservas')
    .select('id, matricula, inicio, fin, precio_total, estado, plaza:plazas(codigo), usuario:perfiles(nombre, telefono)')
    .order('inicio', { ascending: false })
    .limit(200);
  if (error) throw error;
  res.json(data);
}));

// PATCH /api/admin/reservas/:id { estado }
router.patch('/reservas/:id', asyncHandler(async (req, res) => {
  const { estado } = req.body || {};
  if (!['confirmada', 'cancelada', 'completada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }
  const { data, error } = await req.db.from('reservas').update({ estado }).eq('id', req.params.id).select().single();
  if (error) {
    if (error.code === '23P01') return res.status(409).json({ error: 'Se solaparía con otra reserva' });
    throw error;
  }
  res.json(data);
}));

// GET /api/admin/plazas (incluye inactivas)
router.get('/plazas', asyncHandler(async (req, res) => {
  const { data, error } = await req.db.from('plazas').select('*').order('codigo');
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

  if (!parcial && (!p.codigo || p.precio_hora === undefined)) return { error: 'Código y precio son obligatorios' };
  if (p.codigo !== undefined && !p.codigo) return { error: 'Código no válido' };
  if (p.planta !== undefined && isNaN(p.planta)) return { error: 'Planta no válida' };
  if (p.tipo !== undefined && !TIPOS.includes(p.tipo)) return { error: 'Tipo no válido' };
  if (p.precio_hora !== undefined && (isNaN(p.precio_hora) || p.precio_hora < 0)) return { error: 'Precio no válido' };
  return { plaza: p };
}

// POST /api/admin/plazas
router.post('/plazas', asyncHandler(async (req, res) => {
  const { plaza, error: msg } = validarPlaza(req.body || {});
  if (msg) return res.status(400).json({ error: msg });
  const { data, error } = await req.db.from('plazas').insert(plaza).select().single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ya existe una plaza con ese código' });
    throw error;
  }
  res.status(201).json(data);
}));

// PATCH /api/admin/plazas/:id
router.patch('/plazas/:id', asyncHandler(async (req, res) => {
  const { plaza, error: msg } = validarPlaza(req.body || {}, true);
  if (msg) return res.status(400).json({ error: msg });
  const { data, error } = await req.db.from('plazas').update(plaza).eq('id', req.params.id).select().single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ya existe una plaza con ese código' });
    throw error;
  }
  res.json(data);
}));

export default router;
