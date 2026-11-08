import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { session, perfil, esAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const salir = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="contenedor navbar-interior">
        <Link to="/" className="logo">
          <span className="logo-p">P</span> Parking
        </Link>
        <nav>
          <NavLink to="/" end>Reservar</NavLink>
          {session && <NavLink to="/mis-reservas">Mis reservas</NavLink>}
          {esAdmin && <NavLink to="/admin">Administración</NavLink>}
          {session ? (
            <>
              <NavLink to="/perfil" className="usuario">{perfil?.nombre || session.user.email}</NavLink>
              <button className="btn btn-sec btn-peq" onClick={salir}>Salir</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Entrar</NavLink>
              <Link to="/registro" className="btn btn-peq">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
