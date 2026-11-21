import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Flecha } from '../components/Comunes.jsx';
import { BotonGoogle, CajaCuenta } from './Login.jsx';

export default function Registro() {
  const { registro } = useAuth();
  const { T } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ nombre: '', apellidos: '', telefono: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const apellidos = form.apellidos.trim();
    if (!nombre || !apellidos) return setError(T('Escribe tu nombre y tus apellidos.', 'Escriu el teu nom i els cognoms.', 'Enter your first and last name.'));
    if (form.password.length < 6) return setError(T('La contraseña debe tener al menos 6 caracteres.', 'La contrasenya ha de tenir almenys 6 caràcters.', 'The password must be at least 6 characters.'));
    setEnviando(true);
    setError('');
    const { data, error } = await registro(form.email, form.password, `${nombre} ${apellidos}`, form.telefono);
    setEnviando(false);
    if (error) return setError(error.message);
    // Si Supabase pide confirmar el email, todavía no hay sesión
    if (!data.session) return setConfirmar(true);
    navigate(location.state?.desde || '/', { replace: true });
  };

  if (confirmar) {
    return (
      <CajaCuenta eyebrow={T('Casi está', 'Gairebé fet', 'Almost done')} titulo={T('Revisa tu correo', 'Revisa el correu', 'Check your email')}>
        <p className="mt-4">{T('Te hemos enviado un email para confirmar la cuenta. Después ya puedes entrar.', "T'hem enviat un correu per confirmar el compte. Després ja pots entrar.", 'We have sent you an email to confirm your account. Then you can sign in.')}</p>
        <Link to="/login" state={location.state} className="btn btn-accent mt-6 w-full">{T('Ir a entrar', 'Anar a entrar', 'Go to sign in')}</Link>
      </CajaCuenta>
    );
  }

  return (
    <CajaCuenta eyebrow={T('Nueva cuenta', 'Compte nou', 'New account')} titulo={T('Crear cuenta', 'Crear compte', 'Create account')}>
      <BotonGoogle desde={location.state?.desde || '/'} />
      <form className="mt-5 grid gap-4" onSubmit={enviar}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">{T('Nombre', 'Nom', 'First name')}
            <input className="field" name="nombre" autoComplete="given-name" value={form.nombre} onChange={cambiar} required autoFocus />
          </label>
          <label className="label">{T('Apellidos', 'Cognoms', 'Last name')}
            <input className="field" name="apellidos" autoComplete="family-name" value={form.apellidos} onChange={cambiar} required />
          </label>
        </div>
        <label className="label">{T('Teléfono (opcional)', 'Telèfon (opcional)', 'Phone (optional)')}
          <input className="field" name="telefono" type="tel" autoComplete="tel" value={form.telefono} onChange={cambiar} />
        </label>
        <label className="label">Email
          <input className="field" name="email" type="email" autoComplete="email" value={form.email} onChange={cambiar} required />
        </label>
        <label className="label">{T('Contraseña (mínimo 6 caracteres)', 'Contrasenya (mínim 6 caràcters)', 'Password (at least 6 characters)')}
          <input className="field" name="password" type="password" autoComplete="new-password" value={form.password} onChange={cambiar} required />
        </label>
        {error && <p className="note note-danger" role="alert">{error}</p>}
        <button className="btn btn-accent w-full" disabled={enviando}>
          {enviando ? <><span className="spinner" />{T('Creando…', 'Creant…', 'Creating…')}</> : <><span>{T('Crear cuenta', 'Crear compte', 'Create account')}</span><Flecha /></>}
        </button>
      </form>
      <p className="mt-5 text-sm">
        {T('¿Ya tienes cuenta?', 'Ja tens compte?', 'Already have an account?')}{' '}
        <Link to="/login" state={location.state} className="font-bold text-link underline underline-offset-4">{T('Entra', 'Entra', 'Sign in')}</Link>
      </p>
    </CajaCuenta>
  );
}
