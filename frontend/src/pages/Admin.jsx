import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { TIPOS, euros, fecha, planta } from '../utils.js';

const PLAZA_VACIA = { codigo: '', planta: 0, tipo: 'normal', precio_hora: 2 };

export default function Admin() {
  const [pestana, setPestana] = useState('reservas');
  const [resumen, setResumen] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [plazas, setPlazas] = useState([]);
  const [nueva, setNueva] = useState(PLAZA_VACIA);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const [r, rs, ps] = await Promise.all([api.admin.resumen(), api.admin.reservas(), api.admin.plazas()]);
      setResumen(r);
      setReservas(rs);
      setPlazas(ps);
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => { cargar(); }, []);

  const accion = async (fn) => {
    setError('');
    try {
      await fn();
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const crearPlaza = (e) => {
    e.preventDefault();
    accion(async () => {
      await api.admin.crearPlaza(nueva);
      setNueva(PLAZA_VACIA);
    });
  };

  const editarPrecio = (p) => {
    const valor = prompt(`Nuevo precio por hora para ${p.codigo}`, p.precio_hora);
    if (valor !== null) accion(() => api.admin.editarPlaza(p.id, { precio_hora: valor.replace(',', '.') }));
  };

  const reservasFiltradas = reservas.filter((r) =>
    !filtro || [r.matricula, r.plaza?.codigo, r.usuario?.nombre].join(' ').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <>
      <h1>Administración</h1>
      {error && <div className="error">{error}</div>}

      {resumen && (
        <div className="kpis">
          <div className="tarjeta kpi"><span>Plazas activas</span><strong>{resumen.plazas_activas}</strong></div>
          <div className="tarjeta kpi"><span>Ocupadas ahora</span><strong>{resumen.ocupadas_ahora}</strong></div>
          <div className="tarjeta kpi"><span>Reservas pendientes</span><strong>{resumen.reservas_pendientes}</strong></div>
          <div className="tarjeta kpi"><span>Ingresos</span><strong>{euros(resumen.ingresos_totales)}</strong></div>
        </div>
      )}

      <div className="pestanas">
        <button className={pestana === 'reservas' ? 'activa' : ''} onClick={() => setPestana('reservas')}>Reservas</button>
        <button className={pestana === 'plazas' ? 'activa' : ''} onClick={() => setPestana('plazas')}>Plazas</button>
      </div>

      {pestana === 'reservas' && (
        <div className="tarjeta">
          <input className="filtro" placeholder="Buscar por matrícula, plaza o cliente…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          <div className="tabla-scroll">
            <table>
              <thead>
                <tr><th>Plaza</th><th>Cliente</th><th>Matrícula</th><th>Entrada</th><th>Salida</th><th>Total</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {reservasFiltradas.map((r) => (
                  <tr key={r.id}>
                    <td>{r.plaza?.codigo}</td>
                    <td>{r.usuario?.nombre || '—'}<br /><small>{r.usuario?.telefono}</small></td>
                    <td>{r.matricula}</td>
                    <td>{fecha(r.inicio)}</td>
                    <td>{fecha(r.fin)}</td>
                    <td>{euros(r.precio_total)}</td>
                    <td>
                      <select value={r.estado} onChange={(e) => accion(() => api.admin.cambiarEstado(r.id, e.target.value))}>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {reservasFiltradas.length === 0 && <tr><td colSpan={7}>No hay reservas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestana === 'plazas' && (
        <>
          <form className="tarjeta nueva-plaza" onSubmit={crearPlaza}>
            <h3>Añadir plaza</h3>
            <label>Código<input value={nueva.codigo} onChange={(e) => setNueva({ ...nueva, codigo: e.target.value.toUpperCase() })} placeholder="C-01" required /></label>
            <label>Planta<input type="number" value={nueva.planta} onChange={(e) => setNueva({ ...nueva, planta: e.target.value })} /></label>
            <label>
              Tipo
              <select value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}>
                {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.nombre}</option>)}
              </select>
            </label>
            <label>€/hora<input type="number" step="0.05" min="0" value={nueva.precio_hora} onChange={(e) => setNueva({ ...nueva, precio_hora: e.target.value })} required /></label>
            <button className="btn">Añadir</button>
          </form>

          <div className="tarjeta tabla-scroll">
            <table>
              <thead><tr><th>Código</th><th>Planta</th><th>Tipo</th><th>€/hora</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {plazas.map((p) => (
                  <tr key={p.id} className={p.activa ? '' : 'inactiva'}>
                    <td><strong>{p.codigo}</strong></td>
                    <td>{planta(p.planta)}</td>
                    <td>{TIPOS[p.tipo]?.icono} {TIPOS[p.tipo]?.nombre}</td>
                    <td><button className="enlace" onClick={() => editarPrecio(p)}>{euros(p.precio_hora)}</button></td>
                    <td>{p.activa ? 'Activa' : 'Desactivada'}</td>
                    <td>
                      <button className="btn btn-sec btn-peq" onClick={() => accion(() => api.admin.editarPlaza(p.id, { activa: !p.activa }))}>
                        {p.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
