import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando } from './Vacio.jsx';

export default function RutaProtegida({ children, admin = false }) {
  const { session, perfil, cargando, esAdmin } = useAuth();
  const location = useLocation();

  if (cargando || (session && !perfil)) return <Cargando />;
  if (!session) return <Navigate to="/login" state={{ desde: location.pathname + location.search }} replace />;
  if (admin && !esAdmin) return <Navigate to="/" replace />;
  return children;
}
