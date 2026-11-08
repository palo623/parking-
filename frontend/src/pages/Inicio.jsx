import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import Icono from '../components/Icono.jsx';
import CamposHorario from '../components/CamposHorario.jsx';
import { TIPOS, euros, aInputLocal, proximaHora } from '../utils.js';

const PASOS = [
  { icono: 'calendario', titulo: 'Elige cuándo', texto: 'Indica a qué hora llegas y cuándo te vas. Te enseñamos al momento las plazas libres.' },
  { icono: 'mapa', titulo: 'Escoge tu plaza', texto: 'Mira el mapa del parking y elige la plaza que prefieras: cerca de la salida, con cargador…' },
  { icono: 'ticket', titulo: 'Aparca con tu ticket', texto: 'Recibes un ticket con código QR. Llega, enséñalo y aparca sin dar vueltas.' },
];

const VENTAJAS = [
  { icono: 'reloj', titulo: 'Abierto 24 h', texto: 'Entra y sal cuando quieras, cualquier día del año.' },
  { icono: 'escudo', titulo: 'Vigilado', texto: 'Cámaras y personal de seguridad las 24 horas.' },
  { icono: 'rayo', titulo: 'Carga eléctrica', texto: 'Plazas con punto de recarga para tu coche eléctrico.' },
  { icono: 'euro', titulo: 'Pagas lo justo', texto: 'Precio por cuartos de hora. Sin sorpresas ni letra pequeña.' },
];

const PREGUNTAS = [
  { p: '¿Puedo cancelar una reserva?', r: 'Sí. Desde "Mis reservas" puedes cancelarla en cualquier momento antes de la hora de entrada.' },
  { p: '¿Cómo se calcula el precio?', r: 'Se cobra por cuartos de hora según la tarifa de la plaza. Ves el precio exacto antes de confirmar.' },
  { p: '¿Qué pasa si llego antes o me retraso?', r: 'Tu plaza está garantizada durante todo el horario reservado. Si necesitas más tiempo, haz una nueva reserva.' },
  { p: '¿Necesito imprimir el ticket?', r: 'No hace falta. Basta con enseñar el código QR desde el móvil al entrar.' },
  { p: '¿Hay plazas para motos y movilidad reducida?', r: 'Sí. Puedes filtrarlas en el mapa al reservar; las de movilidad reducida están junto a los ascensores.' },
];

export default function Inicio() {
  const navigate = useNavigate();
  const [horario, setHorario] = useState({ inicio: aInputLocal(proximaHora(0)), fin: aInputLocal(proximaHora(2)) });
  const [plazas, setPlazas] = useState([]);
  const [libresAhora, setLibresAhora] = useState(null);

  useEffect(() => {
    api.plazas().then(setPlazas).catch(() => {});
    const ahora = new Date();
    api.mapa(ahora.toISOString(), new Date(ahora.getTime() + 3600e3).toISOString())
      .then((m) => setLibresAhora(m.filter((p) => p.libre).length))
      .catch(() => {});
  }, []);

  const tarifas = useMemo(() => {
    const porTipo = {};
    for (const p of plazas) {
      const t = (porTipo[p.tipo] ||= { tipo: p.tipo, desde: Infinity, total: 0 });
      t.desde = Math.min(t.desde, Number(p.precio_hora));
      t.total++;
    }
    return Object.keys(TIPOS).filter((k) => porTipo[k]).map((k) => porTipo[k]);
  }, [plazas]);

  const precioMinimo = tarifas.length ? Math.min(...tarifas.map((t) => t.desde)) : null;

  const buscar = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      inicio: new Date(horario.inicio).toISOString(),
      fin: new Date(horario.fin).toISOString(),
    });
    navigate(`/reservar?${params}`);
  };

  return (
    <>
      <section className="hero">
        <div className="contenedor hero-grid">
          <div>
            <span className="badge badge-verde">
              <span className="punto-verde latido" /> {libresAhora != null ? `${libresAhora} plazas libres ahora mismo` : 'Abierto ahora · 24 h'}
            </span>
            <h1 style={{ marginTop: 18 }}>Aparca sin dar vueltas. <span>Reserva tu plaza</span> en segundos.</h1>
            <p className="hero-sub">Elige el día y la hora, escoge tu plaza en el mapa y llega con tu ticket listo. Así de fácil.</p>
            <div className="hero-stats">
              <div><strong>{plazas.length || '—'}</strong><span>plazas disponibles</span></div>
              <div><strong>{precioMinimo != null ? euros(precioMinimo) : '—'}</strong><span>desde, por hora</span></div>
              <div><strong>24/7</strong><span>abierto todo el año</span></div>
            </div>
          </div>

          <form className="tarjeta buscador" onSubmit={buscar}>
            <h3><Icono nombre="buscar" /> ¿Cuándo necesitas aparcar?</h3>
            <CamposHorario inicio={horario.inicio} fin={horario.fin} onCambiar={setHorario} />
            <button className="btn btn-grande btn-bloque">
              Ver plazas libres <Icono nombre="flecha" />
            </button>
            <small className="centro">Cancelación gratuita antes de la hora de entrada</small>
          </form>
        </div>
      </section>

      <section className="seccion seccion-alt">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <span className="eyebrow">Cómo funciona</span>
            <h2>Tu plaza reservada en tres pasos</h2>
          </div>
          <div className="pasos">
            {PASOS.map((p, i) => (
              <div key={p.titulo} className="tarjeta paso">
                <div className="paso-num"><Icono nombre={p.icono} tam={22} /></div>
                <h3>{i + 1}. {p.titulo}</h3>
                <p>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="seccion" id="tarifas">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <span className="eyebrow">Tarifas</span>
            <h2>Una plaza para cada vehículo</h2>
            <p>Precios por hora, cobrados por cuartos de hora. Sin cuotas ni permanencia.</p>
          </div>
          <div className="tarifas">
            {(tarifas.length ? tarifas : Object.keys(TIPOS).map((tipo) => ({ tipo }))).map((t) => (
              <div key={t.tipo} className="tarjeta tarifa">
                <div className="tarifa-icono" style={{ background: TIPOS[t.tipo].fondo, color: TIPOS[t.tipo].color }}>
                  <Icono nombre={TIPOS[t.tipo].icono} tam={24} />
                </div>
                <h3>{TIPOS[t.tipo].nombre}</h3>
                <div className="tarifa-precio">
                  {t.desde != null ? <>{euros(t.desde)} <small>/ hora</small></> : <span className="skeleton" style={{ display: 'block', height: 36, width: 120 }} />}
                </div>
                <small>{t.total ? `${t.total} ${t.total === 1 ? 'plaza' : 'plazas'}` : ' '}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="seccion seccion-alt">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <span className="eyebrow">Por qué elegirnos</span>
            <h2>Todo pensado para que aparcar no sea un problema</h2>
          </div>
          <div className="ventajas">
            {VENTAJAS.map((v) => (
              <div key={v.titulo} className="tarjeta ventaja">
                <div className="paso-num"><Icono nombre={v.icono} tam={22} /></div>
                <h3>{v.titulo}</h3>
                <p>{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="seccion" id="preguntas">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2>¿Tienes dudas?</h2>
          </div>
          <div className="faq">
            {PREGUNTAS.map((q) => (
              <details key={q.p}>
                <summary>{q.p}</summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="seccion" style={{ paddingTop: 0 }}>
        <div className="contenedor">
          <div className="cta">
            <div>
              <h2>¿Listo para aparcar sin estrés?</h2>
              <p>Reserva ahora y llega con tu plaza garantizada.</p>
            </div>
            <Link to="/reservar" className="btn btn-grande">Reservar mi plaza <Icono nombre="flecha" /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
