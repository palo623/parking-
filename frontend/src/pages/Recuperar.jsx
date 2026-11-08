import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/AuthLayout.jsx';
import Icono from '../components/Icono.jsx';

export default function Recuperar() {
  const { enviarRecuperacion } = useAuth();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    const { error } = await enviarRecuperacion(email.trim());
    setEnviando(false);
    if (error) return setError(error.message);
    setEnviado(true);
  };

  return (
    <AuthLayout>
      {enviado ? (
        <div className="formulario centro">
          <div className="vacio-icono" style={{ margin: '0 auto' }}><Icono nombre="email" tam={28} /></div>
          <h1>Revisa tu correo</h1>
          <p className="texto-2">Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para crear una contraseña nueva.</p>
          <Link to="/login" className="btn btn-sec btn-bloque">Volver a entrar</Link>
        </div>
      ) : (
        <form className="formulario" onSubmit={enviar}>
          <div>
            <h1>Recuperar contraseña</h1>
            <p className="texto-2" style={{ margin: 0 }}>Te enviaremos un enlace para crear una nueva.</p>
          </div>
          {error && <div className="alerta alerta-error"><Icono nombre="alerta" /> {error}</div>}
          <label className="campo">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
          <button className="btn btn-grande btn-bloque" disabled={enviando}>{enviando && <span className="spinner" />} Enviar enlace</button>
          <p className="separador"><Link to="/login">Volver a entrar</Link></p>
        </form>
      )}
    </AuthLayout>
  );
}
