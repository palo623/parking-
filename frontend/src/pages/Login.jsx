import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
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
    const { error } = await login(email, password);
    setEnviando(false);
    if (error) return setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message);
    navigate(location.state?.desde || '/', { replace: true });
  };

  return (
    <form className="tarjeta formulario" onSubmit={enviar}>
      <h1>Entrar</h1>
      {error && <div className="error">{error}</div>}
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      </label>
      <label>
        Contraseña
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <button className="btn" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      <p>¿No tienes cuenta? <Link to="/registro">Créala aquí</Link></p>
    </form>
  );
}
