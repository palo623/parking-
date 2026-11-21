import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useLang } from './context/LangContext.jsx';
import { useTema } from './context/TemaContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import Asistente from './components/Asistente.jsx';
import Cuenta from './pages/Cuenta.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import MisReservas from './pages/MisReservas.jsx';
import Admin from './pages/Admin.jsx';
import Parkings from './pages/Parkings.jsx';
import ComoFunciona from './pages/ComoFunciona.jsx';
import Ayuda from './pages/Ayuda.jsx';
import { supabaseConfigurado } from './supabase.js';

export default function App() {
  const { pathname, hash, key } = useLocation();

  const { session, perfil } = useAuth();
  const { setLang } = useLang();
  const { setTema } = useTema();

  // Al entrar, aplica el tema y el idioma guardados en tu cuenta
  useEffect(() => {
    const p = perfil?.preferencias;
    if (p?.tema) setTema(p.tema);
    if (p?.idioma) setLang(p.idioma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil?.id]);
  const navigate = useNavigate();

  // Al volver de Google con la sesión iniciada, regresa a donde estaba (p. ej. la reserva)
  useEffect(() => {
    if (!session) return;
    let volver = null;
    try { volver = sessionStorage.getItem('tp-volver'); sessionStorage.removeItem('tp-volver'); } catch { /* nada */ }
    if (volver) navigate(volver, { replace: true });
  }, [session, navigate]);

  // Al cambiar de página (sin #ancla), vuelve arriba
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    // Lleva a la sección del #ancla (también al venir de otra página)
    const id = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(id);
  }, [pathname, hash, key]);

  return (
    <>
      <Navbar />
      {!supabaseConfigurado && (
        <div className="note note-warn rounded-none text-center">
          Falta configurar Supabase: copia <code>frontend/.env.example</code> como <code>frontend/.env</code> y rellena las claves.
        </div>
      )}
      <main id="contenido">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/parkings" element={<Parkings />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/ayuda" element={<Ayuda />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/mis-reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />
          <Route path="/perfil" element={<RutaProtegida><Cuenta /></RutaProtegida>} />
          <Route path="/cuenta" element={<RutaProtegida><Cuenta /></RutaProtegida>} />
          <Route path="/admin" element={<RutaProtegida admin><Admin /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Asistente />
      <CookieBanner />
    </>
  );
}
