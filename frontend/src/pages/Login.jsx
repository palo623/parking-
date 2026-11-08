import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Icono from '../components/Icono.jsx';

const traducir = (m) =>
  ({
    'Invalid login credentials': 'Email o contraseña incorrectos',
    'Email not confirmed': 'Todavía no has confirmado tu email. Revisa tu correo.',
  })[m] || m;

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    const { error } = await login(email.trim(), password);
    setEnviando(false);
    if (error) return setError(traducir(error.message));
    toast.ok('¡Hola de nuevo!');
    navigate(location.state?.desde || '/reservar', { replace: true });
  };

  return (
    <AuthLayout>
      <form className="formulario" onSubmit={enviar}>
        <div>
          <h1>Entrar</h1>
          <p className="texto-2" style={{ margin: 0 }}>Accede para reservar y ver tus tickets.</p>
        </div>
        {error && <div className="alerta alerta-error"><Icono nombre="alerta" /> {error}</div>}
        <label className="campo">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" />
        </label>
        <label className="campo">
          <span style={{ display: 'flex', justifyContent: 'space-between' }}>
            Contraseña <Link to="/recuperar" style={{ fontWeight: 500 }}>¿La has olvidado?</Link>
          </span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <button className="btn btn-grande btn-bloque" disabled={enviando}>
          {enviando ? <><span className="spinner" /> Entrando…</> : 'Entrar'}
        </button>
        <p className="separador">¿No tienes cuenta? <Link to="/registro" state={location.state}>Créala gratis</Link></p>
      </form>
    </AuthLayout>
  );
}
