import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import plazasRouter from './routes/plazas.js';
import reservasRouter from './routes/reservas.js';
import perfilRouter from './routes/perfil.js';
import vehiculosRouter from './routes/vehiculos.js';
import adminRouter from './routes/admin.js';
import chatRouter from './routes/chat.js';
import { respuestaDeError } from './utils.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '20kb' }));

// Máximo 300 peticiones cada 15 minutos por IP, y 20 reservas por hora
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espera unos minutos.' } }));
const limiteReservas = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Has hecho demasiadas reservas seguidas. Inténtalo más tarde.' } });

app.get('/api/salud', (_req, res) => res.json({ ok: true, hora: new Date().toISOString() }));
app.use('/api/plazas', plazasRouter);
app.post('/api/reservas', limiteReservas);
app.use('/api/reservas', reservasRouter);
app.use('/api/perfil', perfilRouter);
app.use('/api/vehiculos', vehiculosRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const [estado, mensaje] = respuestaDeError(err);
  if (estado === 500) console.error(err);
  res.status(estado).json({ error: mensaje });
});

app.listen(PORT, () => {
  console.log(`API del parking en http://localhost:${PORT}`);
  console.log(process.env.GEMINI_API_KEY
    ? `Asistente Gemini activo (modelo: ${process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'})`
    : 'Asistente Gemini desactivado: añade GEMINI_API_KEY en backend/.env para activarlo');
});
