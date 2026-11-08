import { Link } from 'react-router-dom';
import Icono from './Icono.jsx';

export default function Pie() {
  return (
    <footer className="pie">
      <div className="contenedor">
        <div className="pie-grid">
          <div>
            <Link to="/" className="logo" style={{ marginBottom: 14 }}><span className="logo-p">P</span> Parking</Link>
            <p>Reserva tu plaza en segundos, llega tranquilo y aparca sin dar vueltas.</p>
          </div>
          <div>
            <h4>Servicio</h4>
            <ul>
              <li><Link to="/reservar">Reservar plaza</Link></li>
              <li><Link to="/mis-reservas">Mis reservas</Link></li>
              <li><a href="/#tarifas">Tarifas</a></li>
              <li><a href="/#preguntas">Preguntas frecuentes</a></li>
            </ul>
          </div>
          <div>
            <h4>Cuenta</h4>
            <ul>
              <li><Link to="/login">Entrar</Link></li>
              <li><Link to="/registro">Crear cuenta</Link></li>
              <li><Link to="/perfil">Mi perfil</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li><Icono nombre="ubicacion" tam={16} /> Calle Mayor 1, Madrid</li>
              <li><Icono nombre="reloj" tam={16} /> Abierto 24 h, 365 días</li>
              <li><Icono nombre="email" tam={16} /> hola@parking.es</li>
            </ul>
          </div>
        </div>
        <div className="pie-legal">
          <span>© {new Date().getFullYear()} Parking. Todos los derechos reservados.</span>
          <span>Pago seguro · Datos protegidos</span>
        </div>
      </div>
    </footer>
  );
}
