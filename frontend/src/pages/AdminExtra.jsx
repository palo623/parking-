import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Icono from '../components/Icono.jsx';
import Vacio from '../components/Vacio.jsx';
import { Estrellas } from '../components/Estrellas.jsx';
import { TIPOS, planta, soloHora, euros } from '../utils.js';

const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const moverDia = (dia, n) => {
  const d = new Date(`${dia}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------
   Agenda: línea de tiempo de 24 h con una fila por plaza
   ------------------------------------------------------------------ */
export function Agenda() {
  const toast = useToast();
  const [dia, setDia] = useState(hoyLocal);
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    setDatos(null);
    api.admin.agenda(dia).then(setDatos).catch((e) => toast.error(e.message));
  }, [dia, toast]);

  const inicioDia = new Date(`${dia}T00:00:00`).getTime();
  const pos = (iso) => Math.min(Math.max((new Date(iso).getTime() - inicioDia) / 864e5, 0), 1) * 100;
  const ahora = (Date.now() - inicioDia) / 864e5;
  const horas = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  const ocupacionMedia = datos?.plazas.length
    ? Math.round(datos.reservas.reduce((s, r) => s + (pos(r.fin) - pos(r.inicio)), 0) / datos.plazas.length)
    : 0;

  return (
    <div className="tarjeta">
      <div className="herramientas">
        <button className="btn btn-sec btn-icono" onClick={() => setDia(moverDia(dia, -1))} aria-label="Día anterior"><Icono nombre="flechaIzq" /></button>
        <input type="date" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} style={{ maxWidth: 180 }} />
        <button className="btn btn-sec btn-icono" onClick={() => setDia(moverDia(dia, 1))} aria-label="Día siguiente"><Icono nombre="flecha" /></button>
        {dia !== hoyLocal() && <button className="btn btn-ghost btn-peq" onClick={() => setDia(hoyLocal())}>Hoy</button>}
        <span style={{ flex: 1 }} />
        {datos && <span className="texto-2">{datos.reservas.length} reservas · ocupación media {ocupacionMedia}%</span>}
      </div>

      {!datos ? <div className="skeleton" style={{ height: 360 }} /> : (
        <div className="agenda">
          <div className="agenda-fila agenda-cabecera">
            <div className="agenda-plaza" />
            <div className="agenda-pista">
              {horas.map((h) => <span key={h} style={{ left: `${(h / 24) * 100}%` }}>{String(h).padStart(2, '0')}:00</span>)}
            </div>
          </div>
          {datos.plazas.map((p) => (
            <div key={p.id} className="agenda-fila">
              <div className="agenda-plaza">
                <Icono nombre={TIPOS[p.tipo]?.icono} tam={14} /> <strong>{p.codigo}</strong>
                <small>{planta(p.planta)}</small>
              </div>
              <div className="agenda-pista">
                {horas.slice(1, -1).map((h) => <i key={h} className="agenda-guia" style={{ left: `${(h / 24) * 100}%` }} />)}
                {ahora > 0 && ahora < 1 && <i className="agenda-ahora" style={{ left: `${ahora * 100}%` }} />}
                {datos.reservas.filter((r) => r.plaza_id === p.id).map((r) => (
                  <div
                    key={r.id}
                    className={`agenda-bloque ${r.estado}`}
                    style={{ left: `${pos(r.inicio)}%`, width: `${Math.max(pos(r.fin) - pos(r.inicio), 0.8)}%` }}
                    title={`#${r.id} · ${r.usuario?.nombre || 'Cliente'} · ${r.matricula}\n${soloHora(r.inicio)} – ${soloHora(r.fin)} · ${euros(r.precio_total)}`}
                  >
                    <span>{r.matricula}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Mensajes del formulario de contacto
   ------------------------------------------------------------------ */
export function Mensajes({ onCambio }) {
  const toast = useToast();
  const [mensajes, setMensajes] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => { api.admin.mensajes().then(setMensajes).catch((e) => toast.error(e.message)); }, [toast]);

  const marcar = async (m, leido) => {
    try {
      const act = await api.admin.marcarMensaje(m.id, leido);
      setMensajes((ms) => ms.map((x) => (x.id === m.id ? act : x)));
      onCambio?.();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const abrir = (m) => {
    setAbierto(abierto === m.id ? null : m.id);
    if (!m.leido) marcar(m, true);
  };

  if (!mensajes) return <div className="skeleton" style={{ height: 300 }} />;
  const lista = mensajes.filter((m) => filtro === 'todos' || (filtro === 'sin-leer' ? !m.leido : m.leido));

  return (
    <div className="tarjeta">
      <div className="herramientas">
        <div className="chips">
          {[['todos', 'Todos'], ['sin-leer', `Sin leer (${mensajes.filter((m) => !m.leido).length})`], ['leidos', 'Leídos']].map(([k, t]) => (
            <button key={k} className={`chip ${filtro === k ? 'activo' : ''}`} onClick={() => setFiltro(k)}>{t}</button>
          ))}
        </div>
      </div>
      {lista.length === 0 ? (
        <Vacio icono="bandeja" titulo="No hay mensajes" texto="Los mensajes del formulario de contacto aparecerán aquí." />
      ) : (
        <div className="bandeja">
          {lista.map((m) => (
            <article key={m.id} className={`mensaje ${m.leido ? '' : 'no-leido'} ${abierto === m.id ? 'abierto' : ''}`}>
              <button className="mensaje-cabecera" onClick={() => abrir(m)}>
                <span className="avatar">{m.nombre[0]?.toUpperCase()}</span>
                <div className="mensaje-resumen">
                  <strong>{m.nombre} <small>&lt;{m.email}&gt;</small></strong>
                  <span><b>{m.asunto}</b> — {m.mensaje.slice(0, 90)}{m.mensaje.length > 90 ? '…' : ''}</span>
                </div>
                <small>{new Date(m.creado_en).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
              </button>
              {abierto === m.id && (
                <div className="mensaje-cuerpo">
                  <p>{m.mensaje}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a className="btn btn-peq" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.asunto}`)}`}><Icono nombre="email" tam={15} /> Responder por email</a>
                    <button className="btn btn-sec btn-peq" onClick={() => marcar(m, false)}>Marcar como no leído</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Valoraciones: ver y ocultar/mostrar en la web
   ------------------------------------------------------------------ */
export function Valoraciones() {
  const toast = useToast();
  const [lista, setLista] = useState(null);

  useEffect(() => { api.admin.valoraciones().then(setLista).catch((e) => toast.error(e.message)); }, [toast]);

  const alternar = async (v) => {
    try {
      await api.admin.moderarValoracion(v.id, !v.visible);
      setLista((l) => l.map((x) => (x.id === v.id ? { ...x, visible: !v.visible } : x)));
      toast.info(v.visible ? 'Valoración ocultada de la web' : 'Valoración visible en la web');
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!lista) return <div className="skeleton" style={{ height: 300 }} />;
  const media = lista.length ? lista.reduce((s, v) => s + v.puntuacion, 0) / lista.length : 0;
  const reparto = [5, 4, 3, 2, 1].map((n) => ({ n, c: lista.filter((v) => v.puntuacion === n).length }));

  return (
    <div className="admin-grid">
      <div className="tarjeta">
        {lista.length === 0 ? (
          <Vacio icono="estrella" titulo="Aún no hay valoraciones" texto="Los clientes pueden valorar desde 'Mis reservas' cuando ya han usado el parking." />
        ) : (
          <div className="lista-valoraciones">
            {lista.map((v) => (
              <div key={v.id} className={`valoracion-admin ${v.visible ? '' : 'oculta'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <Estrellas valor={v.puntuacion} />
                  <button className="btn btn-ghost btn-peq" onClick={() => alternar(v)} title={v.visible ? 'Ocultar en la web' : 'Mostrar en la web'}>
                    <Icono nombre={v.visible ? 'ojo' : 'ojoNo'} tam={16} /> {v.visible ? 'Visible' : 'Oculta'}
                  </button>
                </div>
                {v.comentario ? <p>“{v.comentario}”</p> : <p className="texto-2"><em>Sin comentario</em></p>}
                <small>{v.usuario?.nombre || 'Cliente'} · {v.usuario?.email} · reserva #{v.reserva?.id} (plaza {v.reserva?.plaza?.codigo}) · {new Date(v.creado_en).toLocaleDateString('es-ES')}</small>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tarjeta">
        <h3 style={{ marginBottom: 6 }}>Resumen</h3>
        <div className="media-opiniones" style={{ justifyContent: 'flex-start', margin: '10px 0 18px' }}>
          <strong>{lista.length ? media.toFixed(1).replace('.', ',') : '—'}</strong>
          <div><Estrellas valor={media} tam={18} /><small>{lista.length} valoraciones</small></div>
        </div>
        {reparto.map(({ n, c }) => (
          <div key={n} className="planta-barra">
            <div className="cab"><span>{n} ★</span><strong>{c}</strong></div>
            <div className="progreso"><div style={{ width: `${lista.length ? (c / lista.length) * 100 : 0}%`, background: '#f59e0b' }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
