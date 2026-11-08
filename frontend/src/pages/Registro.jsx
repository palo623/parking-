import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Icono from '../components/Icono.jsx';

function fuerza(p) {
  let n = 0;
  if (p.length >= 8) n++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++;
  if (/\d/.test(p)) n++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) n++;
  return n;
}
const NIVELES = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Muy buena'];
const COLORES = ['var(--peligro)', 'var(--peligro)', 'var(--aviso)', 'var(--acento)', 'var(--acento)'];

export default function Registro() {
  const { registro } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const nivel = fuerza(form.password);

  const enviar = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
    setEnviando(true);
    setError('');
    const { data, error } = await registro(form.email.trim(), form.password, form.nombre.trim(), form.telefono.trim());
    setEnviando(false);
    if (error) return setError(error.message === 'User already registered' ? 'Ya existe una cuenta con ese email' : error.message);
    if (!data.session) return setEnviado(true);
    toast.ok(`¡Bienvenido, ${form.nombre}!`);
    navigate(location.state?.desde || '/reservar');
  };

  return (
    <AuthLayout>
      {enviado ? (
        <div className="formulario centro">
          <div className="vacio-icono" style={{ margin: '0 auto' }}><Icono nombre="email" tam={28} /></div>
          <h1>Revisa tu correo</h1>
          <p className="texto-2">Te hemos enviado un enlace a <strong>{form.email}</strong> para confirmar tu cuenta. Después podrás entrar.</p>
          <Link to="/login" className="btn btn-bloque">Ir a entrar</Link>
        </div>
      ) : (
        <form className="formulario" onSubmit={enviar}>
          <div>
            <h1>Crear cuenta</h1>
            <p className="texto-2" style={{ margin: 0 }}>Gratis y en menos de un minuto.</p>
          </div>
          {error && <div className="alerta alerta-error"><Icono nombre="alerta" /> {error}</div>}
          <div className="fila">
            <label className="campo">Nombre<input name="nombre" value={form.nombre} onChange={cambiar} required autoFocus autoComplete="given-name" /></label>
            <label className="campo">Teléfono <input name="telefono" type="tel" value={form.telefono} onChange={cambiar} autoComplete="tel" placeholder="Opcional" /></label>
          </div>
          <label className="campo">Email<input name="email" type="email" value={form.email} onChange={cambiar} required autoComplete="email" /></label>
          <label className="campo">
            Contraseña
            <input name="password" type="password" value={form.password} onChange={cambiar} required autoComplete="new-password" />
            {form.password && (
              <span className="campo-ayuda" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="progreso" style={{ flex: 1, height: 6 }}>
                  <div style={{ width: `${(nivel / 4) * 100}%`, background: COLORES[nivel] }} />
                </span>
                {NIVELES[nivel]}
              </span>
            )}
          </label>
          <button className="btn btn-grande btn-bloque" disabled={enviando}>
            {enviando ? <><span className="spinner" /> Creando cuenta…</> : 'Crear cuenta'}
          </button>
          <p className="separador">¿Ya tienes cuenta? <Link to="/login" state={location.state}>Entra</Link></p>
        </form>
      )}
    </AuthLayout>
  );
}
