import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setEnviando(true);
    setError('');
    const { data, error } = await registro(form.email, form.password, form.nombre, form.telefono);
    setEnviando(false);
    if (error) return setError(error.message);
    // Si Supabase pide confirmar el email, no habrá sesión todavía
    if (!data.session) return setMensaje('Te hemos enviado un email para confirmar tu cuenta. Después podrás entrar.');
    navigate('/');
  };

  if (mensaje) {
    return (
      <div className="tarjeta formulario">
        <h1>Revisa tu correo</h1>
        <p>{mensaje}</p>
        <Link to="/login" className="btn">Ir a entrar</Link>
      </div>
    );
  }

  return (
    <form className="tarjeta formulario" onSubmit={enviar}>
      <h1>Crear cuenta</h1>
      {error && <div className="error">{error}</div>}
      <label>Nombre<input name="nombre" value={form.nombre} onChange={cambiar} required autoFocus /></label>
      <label>Teléfono<input name="telefono" type="tel" value={form.telefono} onChange={cambiar} /></label>
      <label>Email<input name="email" type="email" value={form.email} onChange={cambiar} required /></label>
      <label>Contraseña<input name="password" type="password" value={form.password} onChange={cambiar} required /></label>
      <button className="btn" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</button>
      <p>¿Ya tienes cuenta? <Link to="/login">Entra</Link></p>
    </form>
  );
}
