import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RutaProtegida({ children, admin = false }) {
  const { session, perfil, cargando, esAdmin } = useAuth();
  const location = useLocation();

  if (cargando || (session && !perfil)) return <p className="cargando">Cargando…</p>;
  if (!session) return <Navigate to="/login" state={{ desde: location.pathname }} replace />;
  if (admin && !esAdmin) return <Navigate to="/" replace />;
  return children;
}
