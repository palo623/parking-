import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TIPOS, euros, planta, aInputLocal, horaRedonda, fecha } from '../utils.js';

export default function Inicio() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [inicio, setInicio] = useState(aInputLocal(horaRedonda(0)));
  const [fin, setFin] = useState(aInputLocal(horaRedonda(2)));
  const [tipo, setTipo] = useState('');
  const [plazas, setPlazas] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  const [seleccionada, setSeleccionada] = useState(null);
  const [matricula, setMatricula] = useState('');
  const [reservando, setReservando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  const rangoISO = () => ({
    inicio: new Date(inicio).toISOString(),
    fin: new Date(fin).toISOString(),
  });

  const buscar = async (e) => {
    e?.preventDefault();
    setError('');
    setConfirmacion(null);
    setSeleccionada(null);
    setBuscando(true);
    try {
      const { inicio: i, fin: f } = rangoISO();
      setPlazas(await api.plazasDisponibles(i, f, tipo));
    } catch (err) {
      setError(err.message);
      setPlazas(null);
    } finally {
      setBuscando(false);
    }
  };

  const elegir = (plaza) => {
    if (!session) return navigate('/login', { state: { desde: '/' } });
    setSeleccionada(plaza);
    setError('');
  };

  const reservar = async (e) => {
    e.preventDefault();
    setReservando(true);
    setError('');
    try {
      const plazaId = seleccionada.id;
      const reserva = await api.crearReserva({ plaza_id: plazaId, matricula, ...rangoISO() });
      setConfirmacion(reserva);
      setSeleccionada(null);
      setMatricula('');
      setPlazas((ps) => ps?.filter((p) => p.id !== plazaId));
    } catch (err) {
      setError(err.message);
    } finally {
      setReservando(false);
    }
  };

  return (
    <>
      <section className="hero">
        <h1>Reserva tu plaza de parking en segundos</h1>
        <p>Elige cuándo llegas y cuándo te vas, y te enseñamos las plazas libres con su precio exacto.</p>

        <form className="buscador tarjeta" onSubmit={buscar}>
          <label>
            Entrada
            <input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
          </label>
          <label>
            Salida
            <input type="datetime-local" value={fin} min={inicio} onChange={(e) => setFin(e.target.value)} required />
          </label>
          <label>
            Tipo de plaza
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todas</option>
              {Object.entries(TIPOS).map(([k, t]) => (
                <option key={k} value={k}>{t.icono} {t.nombre}</option>
              ))}
            </select>
          </label>
          <button className="btn" disabled={buscando}>{buscando ? 'Buscando…' : 'Buscar plazas'}</button>
        </form>
      </section>

      {error && <div className="error">{error}</div>}

      {confirmacion && (
        <div className="exito tarjeta">
          <h3>✅ ¡Reserva confirmada!</h3>
          <p>
            Plaza <strong>{confirmacion.plaza?.codigo}</strong> para <strong>{confirmacion.matricula}</strong>,
            del {fecha(confirmacion.inicio)} al {fecha(confirmacion.fin)}.
            Total: <strong>{euros(confirmacion.precio_total)}</strong>
          </p>
          <button className="btn btn-sec" onClick={() => navigate('/mis-reservas')}>Ver mis reservas</button>
        </div>
      )}

      {seleccionada && (
        <form className="tarjeta reservar" onSubmit={reservar}>
          <h3>Reservar plaza {seleccionada.codigo}</h3>
          <p>{fecha(rangoISO().inicio)} → {fecha(rangoISO().fin)} · <strong>{euros(seleccionada.precio_estimado)}</strong></p>
          <label>
            Matrícula del vehículo
            <input
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="1234ABC"
              maxLength={10}
              required
              autoFocus
            />
          </label>
          <div className="fila-botones">
            <button className="btn" disabled={reservando}>{reservando ? 'Reservando…' : 'Confirmar reserva'}</button>
            <button type="button" className="btn btn-sec" onClick={() => setSeleccionada(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {plazas && (
        <section>
          <h2>{plazas.length ? `${plazas.length} plazas libres` : 'No hay plazas libres en ese horario'}</h2>
          <div className="rejilla">
            {plazas.map((p) => (
              <article key={p.id} className={`plaza tarjeta ${seleccionada?.id === p.id ? 'activa' : ''}`}>
                <div className="plaza-icono">{TIPOS[p.tipo]?.icono}</div>
                <div className="plaza-codigo">{p.codigo}</div>
                <div className="plaza-info">{planta(p.planta)} · {TIPOS[p.tipo]?.nombre}</div>
                <div className="plaza-precio">
                  {euros(p.precio_estimado)} <small>({euros(p.precio_hora)}/h)</small>
                </div>
                <button className="btn btn-peq" onClick={() => elegir(p)}>Reservar</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {!plazas && (
        <section className="ventajas">
          <div className="tarjeta"><h3>🕒 24 horas</h3><p>Reserva para cualquier hora del día, todos los días.</p></div>
          <div className="tarjeta"><h3>⚡ Carga eléctrica</h3><p>Plazas con cargador para vehículos eléctricos.</p></div>
          <div className="tarjeta"><h3>💶 Pagas lo justo</h3><p>Precio por cuartos de hora, sin sorpresas.</p></div>
        </section>
      )}
    </>
  );
}
