import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { Cabecera, Cargando, Matricula } from '../components/Comunes.jsx';
import { TIPOS, euros, fecha, planta } from '../utils.js';

const PLAZA_VACIA = { codigo: '', planta: 0, tipo: 'normal', precio_hora: 2, parking_id: '' };
const MOTIVOS = {
  ok: ['Correcto', 'Correcte', 'OK'], exceso: ['Con retraso', 'Amb retard', 'Late'], sin_reserva: ['Sin reserva', 'Sense reserva', 'No booking'],
  pronto: ['Antes de hora', "Abans d'hora", 'Too early'], dentro: ['Ya dentro', 'Ja a dins', 'Already inside'], no_dentro: ['No estaba dentro', 'No hi era', 'Not inside'],
};

export default function Admin() {
  const { T, locale, avisar } = useLang();
  const [pestana, setPestana] = useState('reservas');
  const [resumen, setResumen] = useState(null);
  const [reservas, setReservas] = useState(null);
  const [plazas, setPlazas] = useState([]);
  const [accesos, setAccesos] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [nueva, setNueva] = useState(PLAZA_VACIA);
  const [filtro, setFiltro] = useState('');
  const [editando, setEditando] = useState(null); // { id, valor } del precio que se edita
  const [error, setError] = useState('');
  const eur = (n) => euros(n, locale);

  const cargar = async () => {
    try {
      const [r, rs, ps, ac, pk] = await Promise.all([
        api.admin.resumen(), api.admin.reservas(), api.admin.plazas(), api.admin.accesos(), api.parkings(),
      ]);
      setResumen(r); setReservas(rs); setPlazas(ps); setAccesos(ac); setParkings(pk);
      setNueva((n) => (n.parking_id || !pk.length ? n : { ...n, parking_id: pk[0].id }));
    } catch (e) {
      setError(e.message);
    }
  };
  // Se actualiza solo: al entrar, cada 15 segundos y al volver a la pestaña
  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 15000);
    const alVolver = () => { if (document.visibilityState === 'visible') cargar(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', alVolver); };
  }, []);

  const accion = async (fn, ok) => {
    setError('');
    try {
      await fn();
      if (ok) avisar(ok);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const crearPlaza = (e) => {
    e.preventDefault();
    accion(async () => {
      await api.admin.crearPlaza(nueva);
      setNueva((n) => ({ ...PLAZA_VACIA, parking_id: n.parking_id }));
    }, T('Plaza añadida', 'Plaça afegida', 'Space added'));
  };

  const guardarPrecio = (e) => {
    e.preventDefault();
    const { id, valor } = editando;
    setEditando(null);
    accion(() => api.admin.editarPlaza(id, { precio_hora: String(valor).replace(',', '.') }), T('Precio actualizado', 'Preu actualitzat', 'Price updated'));
  };

  // Búsqueda sin importar mayúsculas, acentos, espacios ni guiones («2716 khg» = «2716KHG», «nuria» = «Núria»)
  const normal = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const junto = (t) => t.replace(/[\s\-·.]/g, '');
  const q = normal(filtro.trim());
  const reservasFiltradas = (reservas || []).filter((r) => {
    if (!q) return true;
    const texto = normal([r.codigo, r.matricula, r.plaza?.codigo, r.plaza?.parking?.nombre, r.usuario?.nombre, r.usuario?.telefono, r.estado, r.metodo_pago, r.pago_ref, fecha(r.inicio, locale)].join(' '));
    return texto.includes(q) || junto(texto).includes(junto(q));
  });

  const kpis = resumen && [
    [T('Plazas libres ahora', 'Places lliures ara', 'Free spaces now'), `${resumen.libres_ahora} / ${resumen.plazas_activas}`],
    [T('Ocupadas ahora', 'Ocupades ara', 'Occupied now'), resumen.ocupadas_ahora],
    [T('Reservas pendientes', 'Reserves pendents', 'Upcoming bookings'), resumen.reservas_pendientes],
    [T('Ingresos', 'Ingressos', 'Revenue'), eur(resumen.ingresos_totales)],
  ];

  return (
    <section className="band">
      <div className="wrap">
        <Cabecera eyebrow={T('Panel interno', 'Panell intern', 'Back office')} titulo={T('Administración', 'Administració', 'Admin')} />
        {error && <p className="note note-danger mt-6" role="alert">{error}</p>}
        {!reservas && !error && <Cargando texto={T('Cargando…', 'Carregant…', 'Loading…')} />}

        {kpis && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(([k, v]) => (
              <div key={k} className="card p-5"><p className="text-sm font-semibold text-muted">{k}</p><p className="tnum mt-1 font-mono text-3xl font-bold text-ink">{v}</p></div>
            ))}
          </div>
        )}

        {reservas && (
          <>
            <div className="tabs mt-8" role="tablist">
              {[['reservas', T('Reservas', 'Reserves', 'Bookings')], ['accesos', T('Barrera', 'Barrera', 'Barrier')], ['plazas', T('Plazas', 'Places', 'Spaces')]].map(([k, txt]) => (
                <button key={k} type="button" role="tab" aria-selected={pestana === k} onClick={() => setPestana(k)}>{txt}</button>
              ))}
            </div>

            {pestana === 'reservas' && (
              <div className="card mt-4 p-4">
                <input className="field max-w-md" placeholder={T('Buscar por código, matrícula, parking o cliente…', 'Cerca per codi, matrícula, pàrquing o client…', 'Search by code, plate, car park or customer…')}
                  aria-label={T('Buscar', 'Cercar', 'Search')} value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                <div className="mt-4 overflow-x-auto">
                  <table className="data tnum min-w-[860px]">
                    <thead><tr><th>{T('Código', 'Codi', 'Code')}</th><th>Parking</th><th>{T('Cliente', 'Client', 'Customer')}</th><th>{T('Matrícula', 'Matrícula', 'Plate')}</th><th>{T('Entrada', 'Entrada', 'Entry')}</th><th>{T('Salida', 'Sortida', 'Exit')}</th><th>Total</th><th>{T('Estado', 'Estat', 'Status')}</th></tr></thead>
                    <tbody>
                      {reservasFiltradas.map((r) => (
                        <tr key={r.id}>
                          <td className="font-mono font-bold text-ink">{r.codigo || r.id}</td>
                          <td>{r.plaza?.parking?.nombre || '—'}<br /><span className="text-xs text-muted">{r.plaza?.codigo}</span></td>
                          <td>{r.usuario?.nombre || '—'}<br /><span className="text-xs text-muted">{r.usuario?.telefono}</span></td>
                          <td><Matricula valor={r.matricula} className="text-xs" /></td>
                          <td>{fecha(r.inicio, locale)}</td>
                          <td>{fecha(r.fin, locale)}</td>
                          <td className="font-mono font-bold text-ink">{eur(r.precio_total)}{r.metodo_pago && <><br /><span className="font-sans text-xs font-normal capitalize text-muted">{r.metodo_pago}</span></>}</td>
                          <td>
                            <select className="field !min-h-[40px] !w-auto" aria-label={T('Estado', 'Estat', 'Status')} value={r.estado}
                              onChange={(e) => accion(() => api.admin.cambiarEstado(r.id, e.target.value), T('Estado cambiado', 'Estat canviat', 'Status changed'))}>
                              <option value="confirmada">{T('Confirmada', 'Confirmada', 'Confirmed')}</option>
                              <option value="completada">{T('Completada', 'Completada', 'Completed')}</option>
                              <option value="cancelada">{T('Cancelada', 'Cancel·lada', 'Cancelled')}</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {reservasFiltradas.length === 0 && <tr><td colSpan={8} className="text-muted">{T('No hay reservas.', 'No hi ha reserves.', 'No bookings.')}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pestana === 'accesos' && (
              <div className="card mt-4 overflow-x-auto p-4">
                <table className="data tnum min-w-[760px]">
                  <thead><tr><th>{T('Fecha', 'Data', 'Date')}</th><th>{T('Matrícula', 'Matrícula', 'Plate')}</th><th>{T('Tipo', 'Tipus', 'Type')}</th><th>{T('Resultado', 'Resultat', 'Result')}</th><th>{T('Reserva', 'Reserva', 'Booking')}</th><th>{T('Cliente', 'Client', 'Customer')}</th><th>{T('Extra', 'Extra', 'Extra')}</th></tr></thead>
                  <tbody>
                    {accesos.map((a) => (
                      <tr key={a.id}>
                        <td>{fecha(a.creado_en, locale)}</td>
                        <td><Matricula valor={a.matricula} className="text-xs" /></td>
                        <td>{a.tipo === 'salida' ? T('Salida', 'Sortida', 'Exit') : T('Entrada', 'Entrada', 'Entry')}</td>
                        <td><span className={`tag ${a.permitido ? (a.minutos_exceso ? 'tag-warn' : 'tag-ok') : 'tag-danger'}`}>{T(...(MOTIVOS[a.motivo] || [a.motivo]))}</span></td>
                        <td className="font-mono">{a.reserva?.codigo || '—'}</td>
                        <td>{a.usuario?.nombre || '—'}</td>
                        <td className="font-mono">{a.minutos_exceso ? `${a.minutos_exceso} min · ${eur(a.importe_extra)}` : '—'}</td>
                      </tr>
                    ))}
                    {accesos.length === 0 && <tr><td colSpan={7} className="text-muted">{T('Todavía no hay lecturas de la barrera.', 'Encara no hi ha lectures de la barrera.', 'No barrier readings yet.')}</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {pestana === 'plazas' && (
              <>
                <form className="card mt-4 grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_.7fr_1.2fr_.8fr_auto]" onSubmit={crearPlaza}>
                  <label className="label">Parking
                    <select className="field" value={nueva.parking_id} onChange={(e) => setNueva({ ...nueva, parking_id: e.target.value })} required>
                      {parkings.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </label>
                  <label className="label">{T('Código', 'Codi', 'Code')}
                    <input className="field font-mono uppercase" value={nueva.codigo} onChange={(e) => setNueva({ ...nueva, codigo: e.target.value.toUpperCase() })} placeholder="C-01" required />
                  </label>
                  <label className="label">{T('Planta', 'Planta', 'Floor')}
                    <input className="field" type="number" value={nueva.planta} onChange={(e) => setNueva({ ...nueva, planta: e.target.value })} />
                  </label>
                  <label className="label">{T('Tipo', 'Tipus', 'Type')}
                    <select className="field" value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value })}>
                      {Object.entries(TIPOS).map(([k, nombres]) => <option key={k} value={k}>{T(...nombres)}</option>)}
                    </select>
                  </label>
                  <label className="label">€/h
                    <input className="field" type="number" step="0.05" min="0" value={nueva.precio_hora} onChange={(e) => setNueva({ ...nueva, precio_hora: e.target.value })} required />
                  </label>
                  <button className="btn btn-accent">{T('Añadir plaza', 'Afegir plaça', 'Add space')}</button>
                </form>

                <div className="card mt-4 overflow-x-auto p-4">
                  <table className="data tnum min-w-[760px]">
                    <thead><tr><th>{T('Código', 'Codi', 'Code')}</th><th>Parking</th><th>{T('Planta', 'Planta', 'Floor')}</th><th>{T('Tipo', 'Tipus', 'Type')}</th><th>€/h</th><th>{T('Estado', 'Estat', 'Status')}</th><th><span className="sr-only">{T('Acciones', 'Accions', 'Actions')}</span></th></tr></thead>
                    <tbody>
                      {plazas.map((p) => (
                        <tr key={p.id} className={p.activa ? '' : 'opacity-55'}>
                          <td className="font-mono font-bold text-ink">{p.codigo}</td>
                          <td>{p.parking?.nombre || '—'}</td>
                          <td>{planta(p.planta, T)}</td>
                          <td>{TIPOS[p.tipo] ? T(...TIPOS[p.tipo]) : p.tipo}</td>
                          <td>
                            {editando?.id === p.id ? (
                              <form className="flex gap-2" onSubmit={guardarPrecio}>
                                <input className="field !min-h-[40px] w-24 font-mono" autoFocus inputMode="decimal" aria-label={T('Nuevo precio por hora', 'Nou preu per hora', 'New hourly price')}
                                  value={editando.valor} onChange={(e) => setEditando({ ...editando, valor: e.target.value })} />
                                <button className="btn btn-primary !min-h-[40px] !px-3 text-sm">OK</button>
                                <button type="button" className="btn btn-ghost !min-h-[40px] !px-3 text-sm" onClick={() => setEditando(null)}>✕<span className="sr-only">{T('Cancelar', 'Cancel·lar', 'Cancel')}</span></button>
                              </form>
                            ) : (
                              <button type="button" className="min-h-[40px] font-mono font-bold text-link underline underline-offset-4"
                                title={T('Cambiar precio', 'Canviar preu', 'Change price')} onClick={() => setEditando({ id: p.id, valor: p.precio_hora })}>{eur(p.precio_hora)}</button>
                            )}
                          </td>
                          <td><span className={`tag ${p.activa ? 'tag-ok' : 'tag-danger'}`}>{p.activa ? T('Activa', 'Activa', 'Active') : T('Desactivada', 'Desactivada', 'Disabled')}</span></td>
                          <td className="text-right">
                            <button type="button" className="btn btn-ghost !min-h-[40px] !px-3 text-sm"
                              onClick={() => accion(() => api.admin.editarPlaza(p.id, { activa: !p.activa }))}>
                              {p.activa ? T('Desactivar', 'Desactivar', 'Disable') : T('Activar', 'Activar', 'Enable')}
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
        )}
      </div>
    </section>
  );
}
