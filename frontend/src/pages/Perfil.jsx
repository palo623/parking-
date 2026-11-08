import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Perfil() {
  const { perfil, setPerfil } = useAuth();
  const [nombre, setNombre] = useState(perfil?.nombre || '');
  const [telefono, setTelefono] = useState(perfil?.telefono || '');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const guardar = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    try {
      setPerfil(await api.actualizarPerfil({ nombre, telefono }));
      setMensaje('Datos guardados');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="tarjeta formulario" onSubmit={guardar}>
      <h1>Mi perfil</h1>
      {mensaje && <div className="exito">{mensaje}</div>}
      {error && <div className="error">{error}</div>}
      <label>Email<input value={perfil?.email || ''} disabled /></label>
      <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
      <label>Teléfono<input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></label>
      <button className="btn">Guardar</button>
    </form>
  );
}
