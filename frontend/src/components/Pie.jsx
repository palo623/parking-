import { Link } from 'react-router-dom';
import Icono from './Icono.jsx';
import { NEGOCIO } from '../config.js';
import { useCookies } from '../context/CookiesContext.jsx';

export default function Pie() {
  const { abrirPanel } = useCookies();
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
              <li><a href="/#como-llegar">Cómo llegar</a></li>
              <li><a href="/#opiniones">Opiniones</a></li>
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
              <li><Icono nombre="ubicacion" tam={16} /> {NEGOCIO.direccion}, {NEGOCIO.ciudad}</li>
              <li><Icono nombre="reloj" tam={16} /> {NEGOCIO.horario}</li>
              <li><Icono nombre="telefono" tam={16} /> <a href={`tel:${NEGOCIO.telefono.replace(/\s/g, '')}`}>{NEGOCIO.telefono}</a></li>
              <li><Icono nombre="email" tam={16} /> <Link to="/contacto">{NEGOCIO.email}</Link></li>
            </ul>
          </div>
        </div>
        <div className="pie-legal">
          <span>© {new Date().getFullYear()} Parking. Todos los derechos reservados.</span>
          <nav className="pie-legales" aria-label="Información legal">
            <Link to="/aviso-legal">Aviso legal</Link>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/terminos">Condiciones</Link>
            <button className="enlace" onClick={abrirPanel}>Configurar cookies</button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
