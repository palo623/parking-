import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase, clienteDeUsuario } from '../supabase.js';
import { asyncHandler } from '../utils.js';

const router = Router();

// GET /api/valoraciones → media, total y últimas opiniones visibles
router.get('/valoraciones', asyncHandler(async (_req, res) => {
  const [resumen, lista] = await Promise.all([
    supabase.rpc('resumen_valoraciones'),
    supabase.rpc('valoraciones_publicas', { p_limite: 6 }),
  ]);
  if (resumen.error) throw resumen.error;
  if (lista.error) throw lista.error;
  const r = resumen.data?.[0] || {};
  res.json({
    media: r.media != null ? Number(r.media) : null,
    total: Number(r.total || 0),
    opiniones: lista.data.map(({ puntuacion, comentario, nombre, creado_en }) => ({ puntuacion, comentario, nombre, creado_en })),
  });
}));

// POST /api/contacto { nombre, email, asunto, mensaje } → máximo 5 mensajes por hora e IP
const limiteContacto = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Has enviado varios mensajes seguidos. Inténtalo más tarde.' },
});

router.post('/contacto', limiteContacto, asyncHandler(async (req, res) => {
  const limpiar = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const datos = {
    nombre: limpiar(req.body?.nombre, 80),
    email: limpiar(req.body?.email, 120).toLowerCase(),
    asunto: limpiar(req.body?.asunto, 120) || 'Consulta general',
    mensaje: limpiar(req.body?.mensaje, 2000),
  };
  if (!datos.nombre) return res.status(400).json({ error: 'Escribe tu nombre' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email)) return res.status(400).json({ error: 'Escribe un email válido' });
  if (datos.mensaje.length < 5) return res.status(400).json({ error: 'El mensaje es demasiado corto' });

  // Campo trampa anti-spam: los humanos no lo ven ni lo rellenan
  if (req.body?.web) return res.status(201).json({ ok: true });

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const db = token ? clienteDeUsuario(token) : supabase;
  const { error } = await db.from('mensajes_contacto').insert(datos);
  if (error) throw error;
  res.status(201).json({ ok: true });
}));

export default router;
