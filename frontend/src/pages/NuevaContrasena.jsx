import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Icono from '../components/Icono.jsx';

export default function NuevaContrasena() {
  const { session, cambiarContrasena, setRecuperando } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    if (password !== password2) return setError('Las contraseñas no coinciden');
    const { error } = await cambiarContrasena(password);
    if (error) return setError(error.message);
    setRecuperando(false);
    toast.ok('Contraseña actualizada');
    navigate('/reservar');
  };

  return (
    <AuthLayout>
      {!session ? (
        <div className="formulario centro">
          <h1>Enlace no válido</h1>
          <p className="texto-2">Abre esta página desde el enlace que te enviamos por email, o pide uno nuevo.</p>
          <Link to="/recuperar" className="btn btn-bloque">Pedir otro enlace</Link>
        </div>
      ) : (
        <form className="formulario" onSubmit={enviar}>
          <h1>Nueva contraseña</h1>
          {error && <div className="alerta alerta-error"><Icono nombre="alerta" /> {error}</div>}
          <label className="campo">Nueva contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus autoComplete="new-password" /></label>
          <label className="campo">Repítela<input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required autoComplete="new-password" /></label>
          <button className="btn btn-grande btn-bloque">Guardar contraseña</button>
        </form>
      )}
    </AuthLayout>
  );
}
