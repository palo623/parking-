import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icono from '../components/Icono.jsx';
import { iniciales } from '../utils.js';

export default function Perfil() {
  const { perfil, setPerfil, cambiarContrasena, nombreVisible } = useAuth();
  const toast = useToast();

  const [nombre, setNombre] = useState(perfil?.nombre || '');
  const [telefono, setTelefono] = useState(perfil?.telefono || '');
  const [guardando, setGuardando] = useState(false);

  const [vehiculos, setVehiculos] = useState([]);
  const [nuevaMatricula, setNuevaMatricula] = useState('');
  const [nuevoAlias, setNuevoAlias] = useState('');

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  useEffect(() => { api.vehiculos().then(setVehiculos).catch(() => {}); }, []);

  const guardarDatos = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      setPerfil(await api.actualizarPerfil({ nombre, telefono }));
      toast.ok('Datos guardados');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const anadirVehiculo = async (e) => {
    e.preventDefault();
    try {
      const v = await api.crearVehiculo({ matricula: nuevaMatricula, alias: nuevoAlias });
      setVehiculos([...vehiculos, v]);
      setNuevaMatricula('');
      setNuevoAlias('');
      toast.ok('Vehículo añadido');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const borrarVehiculo = async (v) => {
    try {
      await api.borrarVehiculo(v.id);
      setVehiculos(vehiculos.filter((x) => x.id !== v.id));
      toast.info(`Vehículo ${v.matricula} eliminado`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const cambiarPass = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres');
    if (password !== password2) return toast.error('Las contraseñas no coinciden');
    const { error } = await cambiarContrasena(password);
    if (error) return toast.error(error.message);
    setPassword('');
    setPassword2('');
    toast.ok('Contraseña cambiada');
  };

  return (
    <div className="contenedor pagina">
      <div className="cabecera-pagina">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="avatar" style={{ width: 60, height: 60, fontSize: '1.3rem' }}>{iniciales(nombreVisible)}</span>
          <div>
            <h1>{nombreVisible}</h1>
            <p style={{ margin: 0 }}>{perfil?.email} {perfil?.rol === 'admin' && <span className="badge badge-azul" style={{ marginLeft: 6 }}>Administrador</span>}</p>
          </div>
        </div>
      </div>

      <div className="perfil-grid">
        <form className="tarjeta formulario" onSubmit={guardarDatos}>
          <h3><Icono nombre="usuario" /> Datos personales</h3>
          <label className="campo">Email<input value={perfil?.email || ''} disabled /></label>
          <label className="campo">Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} /></label>
          <label className="campo">Teléfono<input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} placeholder="600 000 000" /></label>
          <button className="btn" disabled={guardando}>{guardando && <span className="spinner" />} Guardar cambios</button>
        </form>

        <div className="tarjeta">
          <h3 style={{ marginBottom: 12 }}><Icono nombre="coche" /> Mis vehículos</h3>
          {vehiculos.length === 0 && <p className="texto-2" style={{ marginTop: 0 }}>Guarda tus matrículas para reservar más rápido.</p>}
          {vehiculos.map((v) => (
            <div key={v.id} className="vehiculo">
              <span className="matricula">{v.matricula}</span>
              <span style={{ flex: 1 }} className="texto-2">{v.alias}</span>
              <button className="btn btn-ghost btn-icono" onClick={() => borrarVehiculo(v)} aria-label={`Eliminar ${v.matricula}`}>
                <Icono nombre="papelera" tam={17} />
              </button>
            </div>
          ))}
          <form onSubmit={anadirVehiculo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginTop: 16 }}>
            <input value={nuevaMatricula} onChange={(e) => setNuevaMatricula(e.target.value.toUpperCase())} placeholder="Matrícula" maxLength={10} required aria-label="Matrícula" />
            <input value={nuevoAlias} onChange={(e) => setNuevoAlias(e.target.value)} placeholder="Alias (opcional)" maxLength={40} aria-label="Alias" />
            <button className="btn"><Icono nombre="mas" /></button>
          </form>
        </div>

        <form className="tarjeta formulario" onSubmit={cambiarPass}>
          <h3><Icono nombre="candado" /> Cambiar contraseña</h3>
          <label className="campo">Nueva contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
          <label className="campo">Repite la contraseña<input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" /></label>
          <button className="btn btn-sec">Cambiar contraseña</button>
        </form>
      </div>
    </div>
  );
}
