import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Icono from '../components/Icono.jsx';
import { Confirmar } from '../components/Modal.jsx';
import Vacio from '../components/Vacio.jsx';
import { TIPOS, ESTADOS, euros, fecha, planta, duracion, estadoReal, tiempoRelativo } from '../utils.js';

export default function MisReservas() {
  const toast = useToast();
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('proximas');
  const [aCancelar, setACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const cargar = () => api.misReservas().then(setReservas).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const cancelar = async () => {
    setCancelando(true);
    try {
      await api.cancelarReserva(aCancelar.id);
      toast.ok(`Reserva de la plaza ${aCancelar.plaza?.codigo} cancelada`);
      setACancelar(null);
      cargar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelando(false);
    }
  };

  const conEstado = (reservas || []).map((r) => ({ ...r, estadoActual: estadoReal(r) }));
  const proximas = conEstado
    .filter((r) => ['confirmada', 'en_curso'].includes(r.estadoActual))
    .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  const historial = conEstado.filter((r) => !['confirmada', 'en_curso'].includes(r.estadoActual));
  const gastado = conEstado.filter((r) => r.estado !== 'cancelada').reduce((s, r) => s + Number(r.precio_total), 0);
  const lista = pestana === 'proximas' ? proximas : historial;

  return (
    <div className="contenedor pagina">
      <div className="cabecera-pagina">
        <div>
          <h1>Mis reservas</h1>
          {reservas && <p>{conEstado.length} reservas en total · {euros(gastado)} gastados</p>}
        </div>
        <Link to="/reservar" className="btn"><Icono nombre="mas" /> Nueva reserva</Link>
      </div>

      {error && <div className="alerta alerta-error"><Icono nombre="alerta" /> {error}</div>}

      <div className="pestanas" role="tablist">
        <button className={pestana === 'proximas' ? 'activa' : ''} onClick={() => setPestana('proximas')}>
          Próximas <span className="contador">{proximas.length}</span>
        </button>
        <button className={pestana === 'historial' ? 'activa' : ''} onClick={() => setPestana('historial')}>
          Historial <span className="contador">{historial.length}</span>
        </button>
      </div>

      {!reservas && !error && (
        <div className="lista-reservas">{[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 110 }} />)}</div>
      )}

      {reservas && lista.length === 0 && (
        pestana === 'proximas' ? (
          <Vacio icono="ticket" titulo="No tienes reservas próximas" texto="Cuando reserves una plaza aparecerá aquí con su ticket.">
            <Link to="/reservar" className="btn">Reservar una plaza</Link>
          </Vacio>
        ) : (
          <Vacio icono="reloj" titulo="Sin historial todavía" texto="Aquí verás tus reservas pasadas y canceladas." />
        )
      )}

      <div className="lista-reservas">
        {lista.map((r) => (
          <article key={r.id} className={`tarjeta reserva-tarjeta ${pestana === 'historial' ? 'pasada' : ''}`}>
            <div className="reserva-plaza">
              <Icono nombre={TIPOS[r.plaza?.tipo]?.icono || 'coche'} tam={18} />
              {r.plaza?.codigo}
            </div>
            <div className="reserva-info">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{fecha(r.inicio)}</strong>
                <span className={`badge ${ESTADOS[r.estadoActual]?.clase}`}>{ESTADOS[r.estadoActual]?.nombre}</span>
                {r.estadoActual === 'confirmada' && <small>· empieza {tiempoRelativo(r.inicio)}</small>}
                {r.estadoActual === 'en_curso' && <small>· termina {tiempoRelativo(r.fin)}</small>}
              </div>
              <div className="linea">
                <Icono nombre="reloj" tam={15} /> {duracion(r.inicio, r.fin)}
                <span>·</span>
                <Icono nombre="plantas" tam={15} /> {planta(r.plaza?.planta)}
                <span>·</span>
                <span className="matricula" style={{ fontSize: '.78rem' }}>{r.matricula}</span>
              </div>
            </div>
            <div className="reserva-acciones">
              <strong>{euros(r.precio_total)}</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                {r.estadoActual !== 'cancelada' && (
                  <Link to={`/reserva/${r.id}`} className="btn btn-sec btn-peq"><Icono nombre="ticket" tam={15} /> Ticket</Link>
                )}
                {r.estadoActual === 'confirmada' && (
                  <button className="btn btn-peligro-sec btn-peq" onClick={() => setACancelar(r)}>Cancelar</button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <Confirmar
        abierto={!!aCancelar}
        titulo="¿Cancelar esta reserva?"
        mensaje={aCancelar ? `Plaza ${aCancelar.plaza?.codigo}, ${fecha(aCancelar.inicio)}. Esta acción no se puede deshacer.` : ''}
        textoBoton="Sí, cancelar"
        peligro
        cargando={cancelando}
        onConfirmar={cancelar}
        onCerrar={() => setACancelar(null)}
      />
    </div>
  );
}
