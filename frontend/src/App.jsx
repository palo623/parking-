import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Pie from './components/Pie.jsx';
import Chat from './components/Chat.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Inicio from './pages/Inicio.jsx';
import Reservar from './pages/Reservar.jsx';
import Ticket from './pages/Ticket.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Recuperar from './pages/Recuperar.jsx';
import NuevaContrasena from './pages/NuevaContrasena.jsx';
import MisReservas from './pages/MisReservas.jsx';
import Perfil from './pages/Perfil.jsx';
import Admin from './pages/Admin.jsx';
import NoEncontrada from './pages/NoEncontrada.jsx';
import Contacto from './pages/Contacto.jsx';
import Legal from './pages/Legal.jsx';
import BotonArriba from './components/BotonArriba.jsx';
import { useAuth } from './context/AuthContext.jsx';

const SIN_PIE = ['/login', '/registro', '/recuperar', '/nueva-contrasena'];

export default function App() {
  const { pathname } = useLocation();
  const { recuperando } = useAuth();
  const navigate = useNavigate();

  // Volver arriba al cambiar de página
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  // Si el usuario llega desde el email de recuperar contraseña
  useEffect(() => {
    if (recuperando && pathname !== '/nueva-contrasena') navigate('/nueva-contrasena');
  }, [recuperando, pathname, navigate]);

  return (
    <>
      <a href="#contenido" className="saltar">Saltar al contenido</a>
      <Navbar />
      <main key={pathname} id="contenido" className="aparecer">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/reservar" element={<Reservar />} />
          <Route path="/contacto" element={<Contacto />} />
          {['/aviso-legal', '/privacidad', '/cookies', '/terminos'].map((r) => <Route key={r} path={r} element={<Legal />} />)}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
          <Route path="/reserva/:id" element={<RutaProtegida><Ticket /></RutaProtegida>} />
          <Route path="/mis-reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />
          <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
          <Route path="/admin" element={<RutaProtegida admin><Admin /></RutaProtegida>} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      {!SIN_PIE.includes(pathname) && <Pie />}
      <Chat />
      <BotonArriba />
    </>
  );
}
