import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Icono from '../components/Icono.jsx';
import { Confirmar } from '../components/Modal.jsx';
import Vacio, { Cargando } from '../components/Vacio.jsx';
import { TIPOS, ESTADOS, euros, planta, soloFecha, soloHora, duracion, estadoReal, descargarCalendario, tiempoRelativo } from '../utils.js';

export default function Ticket() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const esNueva = params.get('nueva') === '1';
  const navigate = useNavigate();
  const toast = useToast();
  const [reserva, setReserva] = useState(null);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    api.reserva(id).then(setReserva).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!reserva) return;
    const contenido = `PARKING|${reserva.id}|${reserva.plaza?.codigo}|${reserva.matricula}|${reserva.inicio}|${reserva.fin}`;
    QRCode.toDataURL(contenido, { margin: 1, width: 360, color: { dark: '#0f172a', light: '#ffffff' } }).then(setQr);
  }, [reserva]);

  const cancelar = async () => {
    setCancelando(true);
    try {
      await api.cancelarReserva(reserva.id);
      toast.ok('Reserva cancelada');
      setReserva({ ...reserva, estado: 'cancelada' });
      setConfirmar(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCancelando(false);
    }
  };

  const compartir = () =>
    navigator.share({
      title: `Reserva de parking · plaza ${reserva.plaza?.codigo}`,
      text: `Plaza ${reserva.plaza?.codigo} (${planta(reserva.plaza?.planta)}) del ${soloFecha(reserva.inicio)} a las ${soloHora(reserva.inicio)} hasta las ${soloHora(reserva.fin)}. Matrícula ${reserva.matricula}.`,
      url: window.location.href.split('?')[0],
    }).catch(() => {});

  if (error) {
    return (
      <div className="contenedor pagina">
        <Vacio icono="alerta" titulo="No encontramos esta reserva" texto={error}>
          <Link to="/mis-reservas" className="btn">Ver mis reservas</Link>
        </Vacio>
      </div>
    );
  }
  if (!reserva) return <Cargando />;

  const estado = estadoReal(reserva);
  const sePuedeCancelar = estado === 'confirmada';
  const tipo = TIPOS[reserva.plaza?.tipo];

  return (
    <div className="contenedor pagina">
      <div className="no-imprimir" style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/mis-reservas')}><Icono nombre="flechaIzq" /> Mis reservas</button>
      </div>

      {esNueva && estado !== 'cancelada' && (
        <div className="alerta alerta-ok no-imprimir" style={{ maxWidth: 460, margin: '0 auto 20px' }}>
          <Icono nombre="checkCirculo" /> <div><strong>¡Reserva confirmada!</strong><br />Enseña este código QR al entrar al parking.</div>
        </div>
      )}

      <article className="ticket">
        <div className="ticket-cabecera">
          <div>
            <small style={{ color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>PLAZA</small>
            <div className="codigo-grande">{reserva.plaza?.codigo}</div>
            <small style={{ color: 'rgba(255,255,255,.85)' }}>{planta(reserva.plaza?.planta)} · {tipo?.nombre}</small>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${ESTADOS[estado]?.clase}`}>{ESTADOS[estado]?.nombre}</span>
            <div style={{ marginTop: 10, opacity: .85, fontSize: '.85rem' }}>Reserva #{reserva.id}</div>
          </div>
        </div>

        <div className="ticket-cuerpo">
          <div className="ticket-dato"><span>Entrada</span><strong>{soloHora(reserva.inicio)}</strong><br /><small>{soloFecha(reserva.inicio)}</small></div>
          <div className="ticket-dato"><span>Salida</span><strong>{soloHora(reserva.fin)}</strong><br /><small>{soloFecha(reserva.fin)}</small></div>
          <div className="ticket-dato"><span>Matrícula</span><span className="matricula">{reserva.matricula}</span></div>
          <div className="ticket-dato"><span>Duración</span><strong>{duracion(reserva.inicio, reserva.fin)}</strong></div>
          <div className="ticket-dato"><span>Total</span><strong style={{ fontSize: '1.3rem' }}>{euros(reserva.precio_total)}</strong></div>
          <div className="ticket-dato"><span>{estado === 'confirmada' ? 'Empieza' : 'Estado'}</span><strong>{estado === 'confirmada' ? tiempoRelativo(reserva.inicio) : ESTADOS[estado]?.nombre}</strong></div>
        </div>

        <div className="ticket-corte" />

        <div className="ticket-qr">
          {estado === 'cancelada' ? (
            <div className="alerta alerta-error"><Icono nombre="alerta" /> Esta reserva está cancelada y el código ya no es válido.</div>
          ) : (
            <>
              {qr ? <img src={qr} alt={`Código QR de la reserva ${reserva.id}`} /> : <div className="skeleton" style={{ width: 180, height: 180 }} />}
              <small>Escanéalo en la barrera de entrada</small>
            </>
          )}
        </div>
      </article>

      {estado !== 'cancelada' && (
        <div className="ticket-acciones">
          <button className="btn btn-sec" onClick={() => window.print()}><Icono nombre="imprimir" /> Imprimir</button>
          <button className="btn btn-sec" onClick={() => descargarCalendario(reserva)}><Icono nombre="calendario" /> Añadir al calendario</button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button className="btn btn-sec" onClick={compartir}><Icono nombre="compartir" /> Compartir</button>
          )}
          {sePuedeCancelar && <button className="btn btn-peligro-sec" onClick={() => setConfirmar(true)}><Icono nombre="cerrar" /> Cancelar reserva</button>}
        </div>
      )}

      <Confirmar
        abierto={confirmar}
        titulo="¿Cancelar esta reserva?"
        mensaje={`La plaza ${reserva.plaza?.codigo} quedará libre para otras personas. Esta acción no se puede deshacer.`}
        textoBoton="Sí, cancelar"
        peligro
        cargando={cancelando}
        onConfirmar={cancelar}
        onCerrar={() => setConfirmar(false)}
      />
    </div>
  );
}
