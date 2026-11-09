import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icono from '../components/Icono.jsx';
import Mapa from '../components/Mapa.jsx';
import Modal from '../components/Modal.jsx';
import Vacio from '../components/Vacio.jsx';
import { Agenda, Mensajes, Valoraciones } from './AdminExtra.jsx';
import { TIPOS, ESTADOS, euros, fecha, planta, estadoReal, descargarCSV } from '../utils.js';

const PLAZA_VACIA = { codigo: '', planta: 0, tipo: 'normal', precio_hora: '2.00' };

export default function Admin() {
  const [pestana, setPestana] = useState('resumen');
  const [sinLeer, setSinLeer] = useState(0);
  const contarSinLeer = () => api.admin.mensajes().then((m) => setSinLeer(m.filter((x) => !x.leido).length)).catch(() => {});
  useEffect(() => { contarSinLeer(); }, []);

  const pestanas = [
    { id: 'resumen', texto: 'Resumen', icono: 'grafica' },
    { id: 'agenda', texto: 'Agenda', icono: 'agenda' },
    { id: 'reservas', texto: 'Reservas', icono: 'ticket' },
    { id: 'plazas', texto: 'Plazas', icono: 'mapa' },
    { id: 'usuarios', texto: 'Usuarios', icono: 'usuarios' },
    { id: 'mensajes', texto: 'Mensajes', icono: 'bandeja', contador: sinLeer },
    { id: 'valoraciones', texto: 'Valoraciones', icono: 'estrella' },
  ];

  return (
    <div className="contenedor pagina">
      <div className="cabecera-pagina">
        <div>
          <h1>Administración</h1>
          <p>Controla la ocupación, las reservas y las tarifas del parking.</p>
        </div>
      </div>
      <div className="pestanas" role="tablist">
        {pestanas.map((p) => (
          <button key={p.id} className={pestana === p.id ? 'activa' : ''} onClick={() => setPestana(p.id)}>
            <Icono nombre={p.icono} tam={16} /> {p.texto}
            {p.contador > 0 && <span className="contador contador-alerta">{p.contador}</span>}
          </button>
        ))}
      </div>
      {pestana === 'resumen' && <Resumen />}
      {pestana === 'reservas' && <Reservas />}
      {pestana === 'plazas' && <Plazas />}
      {pestana === 'usuarios' && <Usuarios />}
      {pestana === 'agenda' && <Agenda />}
      {pestana === 'mensajes' && <Mensajes onCambio={contarSinLeer} />}
      {pestana === 'valoraciones' && <Valoraciones />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Resumen() {
  const [resumen, setResumen] = useState(null);
  const [stats, setStats] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const ahora = new Date();
    const enUnMinuto = new Date(ahora.getTime() + 60e3);
    Promise.all([api.admin.resumen(), api.admin.estadisticas(14), api.mapa(ahora.toISOString(), enUnMinuto.toISOString())])
      .then(([r, s, m]) => { setResumen(r); setStats(s); setMapa(m); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alerta alerta-error"><Icono nombre="alerta" /> {error}</div>;
  if (!resumen || !stats) {
    return <div className="kpis">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 88 }} />)}</div>;
  }

  const ocupacion = resumen.plazas_activas ? Math.round((resumen.ocupadas_ahora / resumen.plazas_activas) * 100) : 0;
  const max = Math.max(...stats.ingresos_diarios.map((d) => Number(d.ingresos)), 1);
  const total14 = stats.ingresos_diarios.reduce((s, d) => s + Number(d.ingresos), 0);

  const kpis = [
    { texto: 'Ocupación ahora', valor: `${ocupacion}%`, sub: `${resumen.ocupadas_ahora} de ${resumen.plazas_activas}`, icono: 'coche', color: '#2563eb', fondo: 'var(--primario-suave)' },
    { texto: 'Reservas pendientes', valor: resumen.reservas_pendientes, icono: 'calendario', color: '#d97706', fondo: 'var(--aviso-suave)' },
    { texto: 'Ingresos 14 días', valor: euros(total14), icono: 'grafica', color: '#059669', fondo: 'var(--acento-suave)' },
    { texto: 'Ingresos totales', valor: euros(resumen.ingresos_totales), icono: 'euro', color: '#7c3aed', fondo: 'color-mix(in srgb, #7c3aed 12%, transparent)' },
  ];

  return (
    <>
      <div className="kpis">
        {kpis.map((k) => (
          <div key={k.texto} className="tarjeta kpi">
            <div className="kpi-icono" style={{ background: k.fondo, color: k.color }}><Icono nombre={k.icono} tam={22} /></div>
            <div>
              <span>{k.texto}</span>
              <strong>{k.valor}</strong>
              {k.sub && <small style={{ display: 'block' }}>{k.sub}</small>}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="tarjeta">
          <div className="tarjeta-titulo"><h3>Ingresos de los últimos 14 días</h3><small>por fecha de reserva</small></div>
          <div className="grafica" role="img" aria-label="Gráfica de ingresos diarios">
            {stats.ingresos_diarios.map((d) => (
              <div key={d.dia} className="grafica-barra" title={`${new Date(d.dia).toLocaleDateString('es-ES')}: ${euros(d.ingresos)} · ${d.reservas} reservas`}>
                <div className="barra" style={{ height: `${(Number(d.ingresos) / max) * 100}%` }} />
                <small>{new Date(d.dia).getDate()}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="tarjeta">
          <div className="tarjeta-titulo"><h3>Ocupación por planta</h3><small>ahora</small></div>
          {stats.ocupacion_plantas.map((p) => (
            <div key={p.planta} className="planta-barra">
              <div className="cab"><span>{planta(p.planta)}</span><strong>{p.ocupadas} / {p.total}</strong></div>
              <div className="progreso"><div style={{ width: `${p.total ? (p.ocupadas / p.total) * 100 : 0}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      {mapa && mapa.length > 0 && (
        <div className="tarjeta">
          <div className="tarjeta-titulo"><h3>Estado del parking en este momento</h3></div>
          <Mapa plazas={mapa} soloLectura mostrarPrecio={false} />
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
function Reservas() {
  const toast = useToast();
  const [reservas, setReservas] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [estado, setEstado] = useState('');

  const cargar = () => api.admin.reservas().then(setReservas).catch((e) => toast.error(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (r, nuevo) => {
    try {
      await api.admin.cambiarEstado(r.id, nuevo);
      toast.ok(`Reserva #${r.id} marcada como ${ESTADOS[nuevo].nombre.toLowerCase()}`);
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!reservas) return <div className="skeleton" style={{ height: 300 }} />;

  const texto = filtro.toLowerCase();
  const filtradas = reservas
    .map((r) => ({ ...r, estadoActual: estadoReal(r) }))
    .filter((r) => !estado || r.estadoActual === estado)
    .filter((r) => !texto || [r.matricula, r.plaza?.codigo, r.usuario?.nombre, r.usuario?.email, `#${r.id}`].join(' ').toLowerCase().includes(texto));

  const exportar = () =>
    descargarCSV(`reservas-${new Date().toISOString().slice(0, 10)}.csv`, filtradas.map((r) => ({
      id: r.id, plaza: r.plaza?.codigo, cliente: r.usuario?.nombre, email: r.usuario?.email, telefono: r.usuario?.telefono,
      matricula: r.matricula, entrada: new Date(r.inicio).toLocaleString('es-ES'), salida: new Date(r.fin).toLocaleString('es-ES'),
      total: Number(r.precio_total).toFixed(2).replace('.', ','), estado: ESTADOS[r.estadoActual]?.nombre,
    })));

  return (
    <div className="tarjeta">
      <div className="herramientas">
        <input placeholder="Buscar matrícula, plaza, cliente o #id…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sec" onClick={exportar} disabled={!filtradas.length}><Icono nombre="descargar" /> Exportar CSV</button>
      </div>
      {filtradas.length === 0 ? (
        <Vacio icono="ticket" titulo="No hay reservas" texto="Cambia los filtros o espera a que lleguen las primeras reservas." />
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr><th>#</th><th>Plaza</th><th>Cliente</th><th>Matrícula</th><th>Entrada</th><th>Salida</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {filtradas.map((r) => (
                <tr key={r.id}>
                  <td className="texto-2">{r.id}</td>
                  <td><strong>{r.plaza?.codigo}</strong></td>
                  <td>{r.usuario?.nombre || '—'}<br /><small>{r.usuario?.email}</small></td>
                  <td><span className="matricula" style={{ fontSize: '.75rem' }}>{r.matricula}</span></td>
                  <td>{fecha(r.inicio)}</td>
                  <td>{fecha(r.fin)}</td>
                  <td><strong>{euros(r.precio_total)}</strong></td>
                  <td>
                    <select value={r.estado} onChange={(e) => cambiarEstado(r, e.target.value)} aria-label={`Estado de la reserva ${r.id}`}>
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Plazas() {
  const toast = useToast();
  const [plazas, setPlazas] = useState(null);
  const [nueva, setNueva] = useState(PLAZA_VACIA);
  const [editando, setEditando] = useState(null);

  const cargar = () => api.admin.plazas().then(setPlazas).catch((e) => toast.error(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  const crear = async (e) => {
    e.preventDefault();
    try {
      const p = await api.admin.crearPlaza({ ...nueva, precio_hora: String(nueva.precio_hora).replace(',', '.') });
      toast.ok(`Plaza ${p.codigo} creada`);
      setNueva(PLAZA_VACIA);
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    try {
      await api.admin.editarPlaza(editando.id, {
        codigo: editando.codigo, planta: editando.planta, tipo: editando.tipo,
        precio_hora: String(editando.precio_hora).replace(',', '.'),
      });
      toast.ok(`Plaza ${editando.codigo} actualizada`);
      setEditando(null);
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const alternar = async (p) => {
    try {
      await api.admin.editarPlaza(p.id, { activa: !p.activa });
      toast.info(`Plaza ${p.codigo} ${p.activa ? 'desactivada' : 'activada'}`);
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!plazas) return <div className="skeleton" style={{ height: 300 }} />;

  const campos = (valor, cambiar) => (
    <>
      <label className="campo">Código<input value={valor.codigo} onChange={(e) => cambiar({ ...valor, codigo: e.target.value.toUpperCase() })} placeholder="C-01" required /></label>
      <label className="campo">Planta<input type="number" value={valor.planta} onChange={(e) => cambiar({ ...valor, planta: e.target.value })} /></label>
      <label className="campo">
        Tipo
        <select value={valor.tipo} onChange={(e) => cambiar({ ...valor, tipo: e.target.value })}>
          {Object.entries(TIPOS).map(([k, t]) => <option key={k} value={k}>{t.nombre}</option>)}
        </select>
      </label>
      <label className="campo">€ / hora<input type="number" step="0.05" min="0" value={valor.precio_hora} onChange={(e) => cambiar({ ...valor, precio_hora: e.target.value })} required /></label>
    </>
  );

  return (
    <>
      <form className="tarjeta nueva-plaza" onSubmit={crear}>
        {campos(nueva, setNueva)}
        <button className="btn"><Icono nombre="mas" /> Añadir plaza</button>
      </form>

      <div className="tarjeta tabla-scroll">
        <table>
          <thead><tr><th>Código</th><th>Planta</th><th>Tipo</th><th>€/hora</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {plazas.map((p) => (
              <tr key={p.id} className={p.activa ? '' : 'inactiva'}>
                <td><strong>{p.codigo}</strong></td>
                <td>{planta(p.planta)}</td>
                <td><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><Icono nombre={TIPOS[p.tipo]?.icono} tam={16} /> {TIPOS[p.tipo]?.nombre}</span></td>
                <td>{euros(p.precio_hora)}</td>
                <td><span className={`badge ${p.activa ? 'badge-verde' : ''}`}>{p.activa ? 'Activa' : 'Desactivada'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-peq" onClick={() => setEditando({ ...p })}><Icono nombre="editar" tam={15} /> Editar</button>
                  <button className="btn btn-sec btn-peq" onClick={() => alternar(p)}>{p.activa ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal abierto={!!editando} titulo={`Editar plaza ${editando?.codigo || ''}`} onCerrar={() => setEditando(null)}>
        {editando && (
          <form className="formulario" onSubmit={guardarEdicion} style={{ marginTop: 12 }}>
            {campos(editando, setEditando)}
            <div className="modal-acciones">
              <button type="button" className="btn btn-sec" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn">Guardar</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Usuarios() {
  const toast = useToast();
  const { perfil } = useAuth();
  const [usuarios, setUsuarios] = useState(null);
  const [filtro, setFiltro] = useState('');

  useEffect(() => { api.admin.usuarios().then(setUsuarios).catch((e) => toast.error(e.message)); }, [toast]);

  const cambiarRol = async (u) => {
    const nuevo = u.rol === 'admin' ? 'cliente' : 'admin';
    try {
      const actualizado = await api.admin.cambiarRol(u.id, nuevo);
      setUsuarios(usuarios.map((x) => (x.id === u.id ? actualizado : x)));
      toast.ok(`${u.nombre || u.email} ahora es ${nuevo === 'admin' ? 'administrador' : 'cliente'}`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!usuarios) return <div className="skeleton" style={{ height: 300 }} />;

  const t = filtro.toLowerCase();
  const lista = usuarios.filter((u) => !t || `${u.nombre} ${u.email} ${u.telefono}`.toLowerCase().includes(t));

  return (
    <div className="tarjeta">
      <div className="herramientas">
        <input placeholder="Buscar por nombre, email o teléfono…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <span className="texto-2">{usuarios.length} usuarios</span>
      </div>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Usuario</th><th>Teléfono</th><th>Alta</th><th>Rol</th><th></th></tr></thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.nombre || '—'}</strong><br /><small>{u.email}</small></td>
                <td>{u.telefono || '—'}</td>
                <td>{new Date(u.creado_en).toLocaleDateString('es-ES')}</td>
                <td><span className={`badge ${u.rol === 'admin' ? 'badge-azul' : ''}`}>{u.rol === 'admin' ? 'Administrador' : 'Cliente'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {u.id !== perfil?.id && (
                    <button className="btn btn-sec btn-peq" onClick={() => cambiarRol(u)}>
                      {u.rol === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
