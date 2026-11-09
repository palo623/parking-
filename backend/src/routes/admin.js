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
    .select('id, matricula, inicio, fin, precio_total, estado, plaza:plazas(codigo), usuario:perfiles(nombre, telefono, email)')
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

// GET /api/admin/estadisticas?dias=14 → ingresos por día y ocupación actual por planta
router.get('/estadisticas', asyncHandler(async (req, res) => {
  const dias = Math.min(Math.max(parseInt(req.query.dias, 10) || 14, 1), 90);
  const [ingresos, plantas] = await Promise.all([
    req.db.rpc('admin_ingresos_diarios', { p_dias: dias }),
    req.db.rpc('admin_ocupacion_plantas'),
  ]);
  if (ingresos.error) throw ingresos.error;
  if (plantas.error) throw plantas.error;
  res.json({ ingresos_diarios: ingresos.data, ocupacion_plantas: plantas.data });
}));

// GET /api/admin/agenda?dia=YYYY-MM-DD → plazas y reservas que tocan ese día
router.get('/agenda', asyncHandler(async (req, res) => {
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(req.query.dia || '') ? req.query.dia : new Date().toISOString().slice(0, 10);
  const desde = new Date(`${dia}T00:00:00`);
  const hasta = new Date(desde.getTime() + 86400e3);
  const [plazas, reservas] = await Promise.all([
    req.db.from('plazas').select('id, codigo, planta, tipo').eq('activa', true).order('planta', { ascending: false }).order('codigo'),
    req.db.from('reservas')
      .select('id, plaza_id, matricula, inicio, fin, estado, precio_total, usuario:perfiles(nombre)')
      .neq('estado', 'cancelada')
      .lt('inicio', hasta.toISOString())
      .gt('fin', desde.toISOString()),
  ]);
  if (plazas.error) throw plazas.error;
  if (reservas.error) throw reservas.error;
  res.json({ dia, desde: desde.toISOString(), hasta: hasta.toISOString(), plazas: plazas.data, reservas: reservas.data });
}));

// GET /api/admin/mensajes
router.get('/mensajes', asyncHandler(async (req, res) => {
  const { data, error } = await req.db.from('mensajes_contacto').select('*').order('creado_en', { ascending: false }).limit(200);
  if (error) throw error;
  res.json(data);
}));

// PATCH /api/admin/mensajes/:id { leido }
router.patch('/mensajes/:id', asyncHandler(async (req, res) => {
  const { data, error } = await req.db.from('mensajes_contacto').update({ leido: Boolean(req.body?.leido) }).eq('id', req.params.id).select().single();
  if (error) throw error;
  res.json(data);
}));

// GET /api/admin/valoraciones
router.get('/valoraciones', asyncHandler(async (req, res) => {
  const { data, error } = await req.db
    .from('valoraciones')
    .select('id, puntuacion, comentario, visible, creado_en, usuario:perfiles(nombre, email), reserva:reservas(id, plaza:plazas(codigo))')
    .order('creado_en', { ascending: false })
    .limit(200);
  if (error) throw error;
  res.json(data);
}));

// PATCH /api/admin/valoraciones/:id { visible }
router.patch('/valoraciones/:id', asyncHandler(async (req, res) => {
  const { data, error } = await req.db.from('valoraciones').update({ visible: Boolean(req.body?.visible) }).eq('id', req.params.id).select('id, visible').single();
  if (error) throw error;
  res.json(data);
}));

// GET /api/admin/usuarios
router.get('/usuarios', asyncHandler(async (req, res) => {
  const { data, error } = await req.db
    .from('perfiles')
    .select('id, nombre, email, telefono, rol, creado_en')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

// PATCH /api/admin/usuarios/:id { rol }
router.patch('/usuarios/:id', asyncHandler(async (req, res) => {
  const { rol } = req.body || {};
  if (!['cliente', 'admin'].includes(rol)) return res.status(400).json({ error: 'Rol no válido' });
  if (req.params.id === req.user.id && rol !== 'admin') {
    return res.status(400).json({ error: 'No puedes quitarte a ti mismo el rol de administrador' });
  }
  const { data, error } = await req.db
    .from('perfiles')
    .update({ rol })
    .eq('id', req.params.id)
    .select('id, nombre, email, telefono, rol, creado_en')
    .single();
  if (error) throw error;
  res.json(data);
}));

export default router;
