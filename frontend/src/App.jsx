import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import MisReservas from './pages/MisReservas.jsx';
import Perfil from './pages/Perfil.jsx';
import Admin from './pages/Admin.jsx';
import { supabaseConfigurado } from './supabase.js';

export default function App() {
  return (
    <>
      <Navbar />
      {!supabaseConfigurado && (
        <div className="aviso">
          Falta configurar Supabase: copia <code>frontend/.env.example</code> como <code>frontend/.env</code> y rellena las claves.
        </div>
      )}
      <main className="contenedor">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/mis-reservas" element={<RutaProtegida><MisReservas /></RutaProtegida>} />
          <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
          <Route path="/admin" element={<RutaProtegida admin><Admin /></RutaProtegida>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="pie">© {new Date().getFullYear()} Parking · Reserva tu plaza online</footer>
    </>
  );
}
