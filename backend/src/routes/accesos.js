import { Router } from 'express';
import { supabase } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { importeExceso, normalizarMatricula, asyncHandler } from '../utils.js';

// Simulador de la barrera: lee una matrícula y decide si abre.
// Solo mira las reservas del usuario que ha iniciado sesión (no deja
// comprobar matrículas de otras personas) y guarda cada intento en "accesos".
const router = Router();
router.use(requireAuth);

const MARGEN_ENTRADA_MIN = 15; // se puede entrar 15 min antes de la hora reservada

async function registrar(fila) {
  const { data, error } = await supabase.from('accesos').insert(fila)
    .select('id, matricula, tipo, permitido, motivo, minutos_exceso, importe_extra, creado_en').single();
  if (error) throw error;
  return data;
}

// Último acceso permitido de una reserva (para saber si el coche está dentro)
async function ultimoAcceso(reservaId) {
  const { data, error } = await supabase.from('accesos').select('tipo')
    .eq('reserva_id', reservaId).eq('permitido', true)
    .order('creado_en', { ascending: false }).limit(1);
  if (error) throw error;
  return data[0]?.tipo || null;
}

// GET /api/accesos → últimos accesos del usuario
router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('accesos')
    .select('id, matricula, tipo, permitido, motivo, minutos_exceso, importe_extra, creado_en, reserva:reservas(codigo)')
    .eq('usuario_id', req.user.id)
    .order('creado_en', { ascending: false })
    .limit(20);
  if (error) throw error;
  res.json(data);
}));

// POST /api/accesos  { matricula, tipo: 'entrada' | 'salida' }
router.post('/', asyncHandler(async (req, res) => {
  const matricula = normalizarMatricula(req.body?.matricula);
  const tipo = req.body?.tipo === 'salida' ? 'salida' : 'entrada';
  if (!/^[A-Z0-9]{2,10}$/.test(matricula)) return res.status(400).json({ error: 'Matrícula no válida' });

  const ahora = new Date();
  const base = { usuario_id: req.user.id, matricula, tipo };

  // Reservas confirmadas de este usuario con esa matrícula que aún no han terminado
  // (o que terminaron hace poco, para poder salir con retraso)
  const { data: reservas, error } = await supabase.from('reservas')
    .select('id, codigo, inicio, fin, plaza:plazas(codigo, precio_hora, parking:parkings(nombre))')
    .eq('usuario_id', req.user.id).eq('matricula', matricula).eq('estado', 'confirmada')
    .gt('fin', new Date(ahora - 24 * 3600 * 1000).toISOString())
    .order('inicio');
  if (error) throw error;

  if (tipo === 'entrada') {
    const margen = MARGEN_ENTRADA_MIN * 60 * 1000;
    const valida = reservas.find((r) => new Date(r.inicio) - margen <= ahora && ahora < new Date(r.fin));
    if (!valida) {
      const futura = reservas.find((r) => new Date(r.inicio) - margen > ahora);
      const motivo = futura ? 'pronto' : 'sin_reserva';
      const acceso = await registrar({ ...base, permitido: false, motivo });
      return res.json({ ...acceso, reserva: futura ? { codigo: futura.codigo, inicio: futura.inicio, fin: futura.fin } : null });
    }
    if (await ultimoAcceso(valida.id) === 'entrada') {
      const acceso = await registrar({ ...base, reserva_id: valida.id, permitido: false, motivo: 'dentro' });
      return res.json({ ...acceso, reserva: valida });
    }
    const acceso = await registrar({ ...base, reserva_id: valida.id, permitido: true, motivo: 'ok' });
    return res.json({ ...acceso, reserva: valida });
  }

  // Salida: la reserva cuyo coche está dentro
  let dentro = null;
  for (const r of reservas) if (await ultimoAcceso(r.id) === 'entrada') { dentro = r; break; }
  if (!dentro) {
    const acceso = await registrar({ ...base, permitido: false, motivo: 'no_dentro' });
    return res.json({ ...acceso, reserva: null });
  }

  const minutos = Math.max(0, Math.ceil((ahora - new Date(dentro.fin)) / 60000));
  const importe = minutos ? importeExceso(dentro.plaza.precio_hora, minutos) : 0;
  const acceso = await registrar({
    ...base, reserva_id: dentro.id, permitido: true,
    motivo: minutos ? 'exceso' : 'ok', minutos_exceso: minutos, importe_extra: importe,
  });
  // Al salir, la reserva queda como completada
  const { error: errUpd } = await supabase.from('reservas').update({ estado: 'completada' }).eq('id', dentro.id);
  if (errUpd) throw errUpd;
  res.json({ ...acceso, reserva: dentro });
}));

export default router;
