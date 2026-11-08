import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import plazasRouter from './routes/plazas.js';
import reservasRouter from './routes/reservas.js';
import perfilRouter from './routes/perfil.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/salud', (_req, res) => res.json({ ok: true }));
app.use('/api/plazas', plazasRouter);
app.use('/api/reservas', reservasRouter);
app.use('/api/perfil', perfilRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejador de errores
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`API del parking en http://localhost:${PORT}`));
