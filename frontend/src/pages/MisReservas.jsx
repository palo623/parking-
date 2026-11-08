import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { TIPOS, euros, fecha, planta } from '../utils.js';

const ETIQUETA = { confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada' };

export default function MisReservas() {
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState('');

  const cargar = () => api.misReservas().then(setReservas).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const cancelar = async (id) => {
    if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return;
    try {
      await api.cancelarReserva(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <div className="error">{error}</div>;
  if (!reservas) return <p className="cargando">Cargando…</p>;

  const ahora = new Date();
  const proximas = reservas.filter((r) => r.estado === 'confirmada' && new Date(r.fin) > ahora);
  const historial = reservas.filter((r) => !proximas.includes(r));

  const Tarjeta = ({ r }) => (
    <article className="tarjeta reserva">
      <div>
        <div className="plaza-codigo">{TIPOS[r.plaza?.tipo]?.icono} {r.plaza?.codigo}</div>
        <div className="plaza-info">{planta(r.plaza?.planta)} · {r.matricula}</div>
        <div>{fecha(r.inicio)} → {fecha(r.fin)}</div>
      </div>
      <div className="reserva-lado">
        <span className={`estado estado-${r.estado}`}>{ETIQUETA[r.estado]}</span>
        <strong>{euros(r.precio_total)}</strong>
        {r.estado === 'confirmada' && new Date(r.inicio) > ahora && (
          <button className="btn btn-peligro btn-peq" onClick={() => cancelar(r.id)}>Cancelar</button>
        )}
      </div>
    </article>
  );

  return (
    <>
      <h1>Mis reservas</h1>
      {reservas.length === 0 && (
        <div className="tarjeta">
          <p>Todavía no tienes reservas.</p>
          <Link to="/" className="btn">Reservar una plaza</Link>
        </div>
      )}
      {proximas.length > 0 && (<><h2>Próximas</h2>{proximas.map((r) => <Tarjeta key={r.id} r={r} />)}</>)}
      {historial.length > 0 && (<><h2>Historial</h2>{historial.map((r) => <Tarjeta key={r.id} r={r} />)}</>)}
    </>
  );
}
