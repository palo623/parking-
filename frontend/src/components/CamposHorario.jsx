import { aInputLocal } from '../utils.js';

const DURACIONES = [
  { texto: '1 h', horas: 1 },
  { texto: '2 h', horas: 2 },
  { texto: '4 h', horas: 4 },
  { texto: '8 h', horas: 8 },
  { texto: '24 h', horas: 24 },
];

// Campos de entrada/salida con atajos de duración
export default function CamposHorario({ inicio, fin, onCambiar, mostrarAtajos = true }) {
  const horasActuales = (new Date(fin) - new Date(inicio)) / 3600e3;

  const ponerDuracion = (h) => {
    const f = new Date(inicio);
    f.setHours(f.getHours() + h);
    onCambiar({ inicio, fin: aInputLocal(f) });
  };

  const cambiarInicio = (valor) => {
    // Mantiene la misma duración al mover la entrada
    const dur = new Date(fin) - new Date(inicio);
    const nuevoFin = new Date(new Date(valor).getTime() + (dur > 0 ? dur : 2 * 3600e3));
    onCambiar({ inicio: valor, fin: aInputLocal(nuevoFin) });
  };

  return (
    <>
      <div className="fila">
        <label className="campo">
          Entrada
          <input type="datetime-local" value={inicio} min={aInputLocal(new Date())} onChange={(e) => cambiarInicio(e.target.value)} required />
        </label>
        <label className="campo">
          Salida
          <input type="datetime-local" value={fin} min={inicio} onChange={(e) => onCambiar({ inicio, fin: e.target.value })} required />
        </label>
      </div>
      {mostrarAtajos && (
        <div className="chips" aria-label="Duración rápida">
          {DURACIONES.map((d) => (
            <button key={d.horas} type="button" className={`chip ${horasActuales === d.horas ? 'activo' : ''}`} onClick={() => ponerDuracion(d.horas)}>
              {d.texto}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
