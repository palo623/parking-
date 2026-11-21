import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { parseRango, desglosePrecio, normalizarMatricula, asyncHandler } from '../utils.js';

const router = Router();
router.use(requireAuth);

// Se aceptan matrículas extranjeras y antiguas: de 2 a 10 letras o números
const MATRICULA_RE = /^[A-Z0-9]{2,10}$/;
const TIPOS = ['normal', 'moto', 'electrico', 'discapacitados'];
const CAMPOS = `id, codigo, matricula, inicio, fin, precio_base, gastos_gestion, precio_total, estado, creado_en,
  plaza:plazas(codigo, planta, tipo, parking:parkings(slug, nombre, zona))`;

// GET /api/reservas → reservas del usuario
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('reservas')
    .select(CAMPOS)
    .eq('usuario_id', req.user.id)
    .order('inicio', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

// Plazas libres de un parking y tipo en ese horario, de la más barata a la más cara
async function plazasLibres(parkingId, tipo, inicio, fin) {
  const [plazas, ocupadas] = await Promise.all([
    supabase.from('plazas').select('id, precio_hora')
      .eq('parking_id', parkingId).eq('tipo', tipo).eq('activa', true)
      .order('precio_hora').order('codigo'),
    supabase.from('reservas').select('plaza_id').eq('estado', 'confirmada')
      .lt('inicio', fin.toISOString()).gt('fin', inicio.toISOString()),
  ]);
  if (plazas.error) throw plazas.error;
  if (ocupadas.error) throw ocupadas.error;
  const ids = new Set(ocupadas.data.map((r) => r.plaza_id));
  return plazas.data.filter((p) => !ids.has(p.id));
}

// POST /api/reservas  { parking_id | plaza_id, tipo?, matricula, inicio, fin }
// Con parking_id el servidor asigna la plaza libre más barata de ese tipo.
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const matricula = normalizarMatricula(body.matricula);
  const tipo = TIPOS.includes(body.tipo) ? body.tipo : 'normal';

  if (!body.parking_id && !body.plaza_id) return res.status(400).json({ error: 'Falta el parking' });
  if (!MATRICULA_RE.test(matricula)) return res.status(400).json({ error: 'Matrícula no válida' });

  const rango = parseRango(body.inicio, body.fin);
  if (rango.error) return res.status(400).json({ error: rango.error });
  const { inicio, fin } = rango;
  if (inicio < new Date(Date.now() - 5 * 60 * 1000)) {
    return res.status(400).json({ error: 'No puedes reservar en el pasado' });
  }

  // Candidatas: una plaza concreta o las libres del parking
  let candidatas;
  if (body.plaza_id) {
    const { data: plaza } = await supabase.from('plazas')
      .select('id, precio_hora, activa').eq('id', body.plaza_id).single();
    if (!plaza || !plaza.activa) return res.status(404).json({ error: 'La plaza no existe' });
    candidatas = [plaza];
  } else {
    candidatas = await plazasLibres(body.parking_id, tipo, inicio, fin);
    if (!candidatas.length) return res.status(409).json({ error: 'No quedan plazas libres en ese parking para ese horario' });
  }

  // Si otra persona reserva la misma plaza a la vez (23P01), probamos con la siguiente
  for (const plaza of candidatas.slice(0, 5)) {
    const { data, error } = await supabase
      .from('reservas')
      .insert({
        usuario_id: req.user.id,
        plaza_id: plaza.id,
        matricula,
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        ...desglosePrecio(plaza.precio_hora, inicio, fin),
      })
      .select(CAMPOS)
      .single();
    if (!error) return res.status(201).json(data);
    if (error.code !== '23P01') throw error;
  }
  res.status(409).json({ error: 'Esa plaza se acaba de reservar. Prueba otra vez.' });
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
    .select(CAMPOS)
    .single();
  if (error) throw error;
  res.json(data);
}));

export default router;
