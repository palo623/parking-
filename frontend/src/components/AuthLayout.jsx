import Icono from './Icono.jsx';

export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth-lado">
        <h2>Tu plaza te está esperando.</h2>
        <ul>
          <li><Icono nombre="mapa" /> Elige tu plaza en el mapa del parking</li>
          <li><Icono nombre="ticket" /> Ticket con código QR al instante</li>
          <li><Icono nombre="coche" /> Guarda tus vehículos y reserva en segundos</li>
          <li><Icono nombre="escudo" /> Cancelación gratuita antes de entrar</li>
        </ul>
      </aside>
      <div className="auth-form">{children}</div>
    </div>
  );
}
