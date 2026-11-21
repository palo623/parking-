import { Router } from 'express';
import { supabase } from '../supabase.js';
import { parseRango, desglosePrecio, asyncHandler } from '../utils.js';

const router = Router();
const TIPOS = ['normal', 'moto', 'electrico', 'discapacitados'];

// GET /api/parkings → parkings activos con su tarifa más baja por tipo de plaza
router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('parkings')
    .select('id, slug, nombre, zona, plazas(tipo, precio_hora, activa)')
    .eq('activo', true)
    .order('id');
  if (error) throw error;

  res.json(data.map(({ plazas, ...p }) => {
    const activas = plazas.filter((pl) => pl.activa);
    const tarifas = {};
    for (const t of TIPOS) {
      const precios = activas.filter((pl) => pl.tipo === t).map((pl) => Number(pl.precio_hora));
      if (precios.length) tarifas[t] = Math.min(...precios);
    }
    return { ...p, total_plazas: activas.length, tarifas };
  }));
}));

// GET /api/parkings/disponibles?inicio=...&fin=...&tipo=normal
// Por cada parking: plazas libres de ese tipo y precio de la más barata
router.get('/disponibles', asyncHandler(async (req, res) => {
  const rango = parseRango(req.query.inicio, req.query.fin);
  if (rango.error) return res.status(400).json({ error: rango.error });
  const { inicio, fin } = rango;
  const tipo = TIPOS.includes(req.query.tipo) ? req.query.tipo : 'normal';

  const [parkings, plazas, ocupadas] = await Promise.all([
    supabase.from('parkings').select('id, slug, nombre, zona').eq('activo', true).order('id'),
    supabase.from('plazas').select('id, parking_id, precio_hora').eq('activa', true).eq('tipo', tipo),
    supabase.from('reservas').select('plaza_id').eq('estado', 'confirmada')
      .lt('inicio', fin.toISOString()).gt('fin', inicio.toISOString()),
  ]);
  for (const r of [parkings, plazas, ocupadas]) if (r.error) throw r.error;

  const idsOcupadas = new Set(ocupadas.data.map((r) => r.plaza_id));
  res.json(parkings.data.map((p) => {
    const delParking = plazas.data.filter((pl) => pl.parking_id === p.id);
    const libres = delParking.filter((pl) => !idsOcupadas.has(pl.id));
    const masBarata = libres.reduce((min, pl) => (!min || Number(pl.precio_hora) < Number(min.precio_hora) ? pl : min), null);
    return {
      ...p,
      tipo,
      total: delParking.length,
      libres: libres.length,
      precio_hora: masBarata ? Number(masBarata.precio_hora) : null,
      ...(masBarata ? desglosePrecio(masBarata.precio_hora, inicio, fin) : { precio_base: null, gastos_gestion: null, precio_total: null }),
    };
  }));
}));

export default router;
