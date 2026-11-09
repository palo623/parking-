import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTema } from '../context/TemaContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icono from './Icono.jsx';
import { iniciales } from '../utils.js';

export default function Navbar() {
  const { session, esAdmin, nombreVisible, logout } = useAuth();
  const { tema, alternar } = useTema();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => setAbierto(false), [pathname]);

  const salir = async () => {
    await logout();
    toast.info('Has cerrado sesión');
    navigate('/');
  };

  const enlaces = [
    { to: '/reservar', texto: 'Reservar', icono: 'mapa' },
    ...(session ? [{ to: '/mis-reservas', texto: 'Mis reservas', icono: 'ticket' }] : []),
    ...(esAdmin ? [{ to: '/admin', texto: 'Administración', icono: 'grafica' }] : []),
    { to: '/contacto', texto: 'Contacto', icono: 'email' },
  ];

  return (
    <header className="navbar">
      <div className="contenedor navbar-interior">
        <Link to="/" className="logo" aria-label="Ir al inicio">
          <span className="logo-p">P</span> Parking
        </Link>

        <nav className="nav-enlaces" aria-label="Principal">
          {enlaces.map((e) => (
            <NavLink key={e.to} to={e.to} className="nav-link">
              <Icono nombre={e.icono} tam={17} /> {e.texto}
            </NavLink>
          ))}
        </nav>

        <div className="nav-acciones">
          <button className="btn btn-ghost btn-icono" onClick={alternar} aria-label="Cambiar tema" title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}>
            <Icono nombre={tema === 'oscuro' ? 'sol' : 'luna'} />
          </button>
          {session ? (
            <>
              <Link to="/perfil" className="oculto-movil" title="Mi perfil" aria-label="Mi perfil">
                <span className="avatar">{iniciales(nombreVisible)}</span>
              </Link>
              <button className="btn btn-ghost btn-icono oculto-movil" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión">
                <Icono nombre="salir" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost oculto-movil">Entrar</Link>
              <Link to="/registro" className="btn oculto-movil">Crear cuenta</Link>
            </>
          )}
          <button className="btn btn-ghost btn-icono boton-menu" onClick={() => setAbierto(!abierto)} aria-label="Abrir menú" aria-expanded={abierto}>
            <Icono nombre={abierto ? 'cerrar' : 'menu'} />
          </button>
        </div>
      </div>

      {abierto && (
        <nav className="menu-movil" aria-label="Menú móvil">
          {enlaces.map((e) => (
            <NavLink key={e.to} to={e.to}><Icono nombre={e.icono} /> {e.texto}</NavLink>
          ))}
          {session ? (
            <>
              <NavLink to="/perfil"><Icono nombre="usuario" /> Mi perfil</NavLink>
              <button className="enlace-menu" onClick={salir}><Icono nombre="salir" /> Cerrar sesión</button>
            </>
          ) : (
            <>
              <NavLink to="/login"><Icono nombre="usuario" /> Entrar</NavLink>
              <NavLink to="/registro"><Icono nombre="mas" /> Crear cuenta</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
