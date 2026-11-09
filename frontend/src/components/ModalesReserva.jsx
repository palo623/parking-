import { useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from './Modal.jsx';
import Icono from './Icono.jsx';
import { ElegirEstrellas } from './Estrellas.jsx';
import { euros, fecha, duracion, aInputLocal } from '../utils.js';

// Mismo cálculo que la base de datos: cuartos de hora × tarifa
const precio = (precioHora, inicio, fin) =>
  Math.round(Math.ceil((new Date(fin) - new Date(inicio)) / 900000) * 0.25 * Number(precioHora) * 100) / 100;

const EXTRAS = [
  { texto: '+30 min', min: 30 },
  { texto: '+1 h', min: 60 },
  { texto: '+2 h', min: 120 },
  { texto: '+4 h', min: 240 },
];

export function ModalAmpliar({ reserva, onCerrar, onHecho }) {
  const toast = useToast();
  const finActual = new Date(reserva.fin);
  const [nuevoFin, setNuevoFin] = useState(aInputLocal(new Date(finActual.getTime() + 3600e3)));
  const [guardando, setGuardando] = useState(false);

  const finISO = new Date(nuevoFin).toISOString();
  const valido = new Date(nuevoFin) > finActual;
  const nuevoTotal = reserva.plaza?.precio_hora != null ? precio(reserva.plaza.precio_hora, reserva.inicio, finISO) : null;
  const diferencia = nuevoTotal != null ? nuevoTotal - Number(reserva.precio_total) : null;

  const confirmar = async () => {
    setGuardando(true);
    try {
      const r = await api.ampliarReserva(reserva.id, finISO);
      toast.ok(`Reserva ampliada hasta ${fecha(r.fin)}`);
      onHecho(r);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      titulo={`Ampliar reserva · plaza ${reserva.plaza?.codigo}`}
      onCerrar={onCerrar}
      acciones={
        <>
          <button className="btn btn-sec" onClick={onCerrar}>Volver</button>
          <button className="btn" onClick={confirmar} disabled={!valido || guardando}>
            {guardando && <span className="spinner" />} Ampliar {diferencia > 0 && `(+${euros(diferencia)})`}
          </button>
        </>
      }
    >
      <p>Ahora termina el <strong>{fecha(reserva.fin)}</strong>. Elige la nueva hora de salida:</p>
      <div className="chips" style={{ marginBottom: 14 }}>
        {EXTRAS.map((x) => {
          const valor = aInputLocal(new Date(finActual.getTime() + x.min * 60000));
          return <button key={x.min} type="button" className={`chip ${nuevoFin === valor ? 'activo' : ''}`} onClick={() => setNuevoFin(valor)}>{x.texto}</button>;
        })}
      </div>
      <label className="campo">
        Nueva salida
        <input type="datetime-local" value={nuevoFin} min={aInputLocal(finActual)} onChange={(e) => setNuevoFin(e.target.value)} />
      </label>
      {valido && nuevoTotal != null && (
        <div style={{ marginTop: 14 }}>
          <div className="resumen-linea"><span>Duración total</span><strong>{duracion(reserva.inicio, finISO)}</strong></div>
          <div className="resumen-linea"><span>Nuevo total</span><strong>{euros(nuevoTotal)}</strong></div>
          <div className="resumen-linea"><span>Diferencia a pagar</span><strong style={{ color: 'var(--primario)' }}>+{euros(diferencia)}</strong></div>
        </div>
      )}
      {!valido && <div className="alerta alerta-error" style={{ marginTop: 12 }}><Icono nombre="alerta" /> La nueva salida debe ser posterior a la actual.</div>}
    </Modal>
  );
}

export function ModalValorar({ reserva, onCerrar, onHecho }) {
  const toast = useToast();
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async () => {
    setGuardando(true);
    try {
      await api.valorarReserva(reserva.id, puntuacion, comentario.trim());
      toast.ok('¡Gracias por tu valoración!');
      onHecho({ puntuacion, comentario });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      titulo="¿Qué tal tu experiencia?"
      onCerrar={onCerrar}
      acciones={
        <>
          <button className="btn btn-sec" onClick={onCerrar}>Ahora no</button>
          <button className="btn" onClick={enviar} disabled={!puntuacion || guardando}>{guardando && <span className="spinner" />} Enviar valoración</button>
        </>
      }
    >
      <p>Plaza {reserva.plaza?.codigo} · {fecha(reserva.inicio)}</p>
      <ElegirEstrellas valor={puntuacion} onCambiar={setPuntuacion} />
      <label className="campo" style={{ marginTop: 16 }}>
        Comentario (opcional)
        <textarea rows={3} maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="¿Qué te ha gustado? ¿Qué podemos mejorar?" />
        <span className="campo-ayuda">Se publicará con tu nombre de pila. {comentario.length}/500</span>
      </label>
    </Modal>
  );
}
