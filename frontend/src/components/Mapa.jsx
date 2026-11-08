import { useEffect, useMemo, useState } from 'react';
import Icono from './Icono.jsx';
import { TIPOS, euros, planta as nombrePlanta } from '../utils.js';

/**
 * Mapa visual del parking.
 * plazas: [{ id, codigo, planta, tipo, libre, precio_estimado }]
 */
export default function Mapa({ plazas, seleccionada, onSeleccionar, filtroTipo = '', soloLectura = false, mostrarPrecio = true }) {
  const plantas = useMemo(
    () => [...new Set(plazas.map((p) => p.planta))].sort((a, b) => b - a),
    [plazas]
  );
  const [plantaActiva, setPlantaActiva] = useState(plantas[0]);

  useEffect(() => {
    if (!plantas.includes(plantaActiva)) setPlantaActiva(plantas[0]);
  }, [plantas, plantaActiva]);

  // Si la plaza seleccionada está en otra planta, saltar a ella
  useEffect(() => {
    const p = plazas.find((x) => x.id === seleccionada);
    if (p && p.planta !== plantaActiva) setPlantaActiva(p.planta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionada]);

  const dePlanta = plazas.filter((p) => p.planta === plantaActiva);
  const mitad = Math.ceil(dePlanta.length / 2);
  const filas = [dePlanta.slice(0, mitad), dePlanta.slice(mitad)];
  const columnas = Math.max(mitad, 1);

  const celda = (p) => {
    const atenuada = filtroTipo && p.tipo !== filtroTipo;
    const disponible = p.libre && !atenuada && !soloLectura;
    const clases = [
      'plaza-celda',
      p.libre ? 'libre' : 'ocupada',
      seleccionada === p.id ? 'seleccionada' : '',
      atenuada ? 'atenuada' : '',
      soloLectura ? 'solo-lectura' : '',
    ].join(' ');
    return (
      <button
        key={p.id}
        type="button"
        className={clases}
        disabled={!disponible}
        onClick={() => disponible && onSeleccionar?.(p)}
        title={`${p.codigo} · ${TIPOS[p.tipo]?.nombre} · ${p.libre ? 'Libre' : 'Ocupada'}`}
        aria-pressed={seleccionada === p.id}
      >
        {p.libre ? (
          <Icono nombre={TIPOS[p.tipo]?.icono || 'coche'} tam={20} />
        ) : (
          <Icono nombre="coche" tam={26} className="coche" />
        )}
        <span className="codigo">{p.codigo}</span>
        {mostrarPrecio && p.libre && p.precio_estimado != null && <span className="precio">{euros(p.precio_estimado)}</span>}
      </button>
    );
  };

  if (!plazas.length) return null;

  return (
    <div className="mapa">
      <div className="mapa-cabecera">
        <div className="mapa-plantas" role="tablist">
          {plantas.map((n) => {
            const libres = plazas.filter((p) => p.planta === n && p.libre && (!filtroTipo || p.tipo === filtroTipo)).length;
            return (
              <button key={n} role="tab" className={n === plantaActiva ? 'activo' : ''} onClick={() => setPlantaActiva(n)}>
                <Icono nombre="plantas" tam={16} /> {nombrePlanta(n)}
                <span className="contador">{libres} libres</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mapa-suelo" style={{ '--columnas': columnas }}>
        <div className="mapa-fila">{filas[0].map(celda)}</div>
        <div className="mapa-carril"><span>Entrada <Icono nombre="flecha" tam={14} /> Salida</span></div>
        <div className="mapa-fila">{filas[1].map(celda)}</div>
      </div>

      <div className="leyenda">
        <span><i style={{ background: 'var(--plaza-libre)', borderColor: 'var(--plaza-libre-borde)' }} /> Libre</span>
        <span><i style={{ background: 'var(--plaza-ocupada)', borderColor: 'var(--plaza-ocupada-borde)' }} /> Ocupada</span>
        {!soloLectura && <span><i style={{ background: 'var(--primario)', borderColor: 'var(--primario)' }} /> Tu selección</span>}
        {Object.entries(TIPOS).filter(([k]) => k !== 'normal').map(([k, t]) => (
          <span key={k}><Icono nombre={t.icono} tam={15} /> {t.nombre}</span>
        ))}
      </div>
    </div>
  );
}
