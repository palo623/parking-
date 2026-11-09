import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import Icono from '../components/Icono.jsx';
import CamposHorario from '../components/CamposHorario.jsx';
import Revelar from '../components/Revelar.jsx';
import { Estrellas } from '../components/Estrellas.jsx';
import { NEGOCIO, urlMapa, urlComoLlegar } from '../config.js';
import { TIPOS, euros, aInputLocal, proximaHora } from '../utils.js';

const PASOS = [
  { icono: 'calendario', titulo: 'Elige cuándo', texto: 'Indica a qué hora llegas y cuándo te vas. Ves al momento las plazas libres y su precio.' },
  { icono: 'mapa', titulo: 'Escoge tu plaza', texto: 'Elige en el mapa la plaza que prefieras: cerca de la salida, con cargador, para moto…' },
  { icono: 'ticket', titulo: 'Aparca con tu QR', texto: 'Recibes un ticket con código QR. Enséñalo en la barrera y aparca sin dar vueltas.' },
];

const VENTAJAS = [
  { icono: 'reloj', titulo: 'Abierto 24 h', texto: 'Entra y sal cuando quieras, cualquier día del año.' },
  { icono: 'escudo', titulo: 'Vigilado', texto: 'Cámaras y personal de seguridad las 24 horas.' },
  { icono: 'rayo', titulo: 'Carga eléctrica', texto: 'Plazas con punto de recarga para tu coche eléctrico.' },
  { icono: 'mas30', titulo: 'Amplía cuando quieras', texto: '¿Te alargas? Amplía la reserva desde el móvil en un toque.' },
  { icono: 'euro', titulo: 'Pagas lo justo', texto: 'Precio por cuartos de hora. Sin sorpresas ni letra pequeña.' },
  { icono: 'chat', titulo: 'Ayuda al instante', texto: 'Nuestro asistente responde tus dudas a cualquier hora.' },
];

const PREGUNTAS = [
  { p: '¿Puedo cancelar una reserva?', r: 'Sí. Desde "Mis reservas" puedes cancelarla gratis en cualquier momento antes de la hora de entrada.' },
  { p: '¿Y si necesito más tiempo?', r: 'Desde "Mis reservas" pulsa "Ampliar" y elige la nueva hora de salida. Solo pagas la diferencia, siempre que la plaza siga libre.' },
  { p: '¿Cómo se calcula el precio?', r: 'Se cobra por cuartos de hora según la tarifa de la plaza. Ves el precio exacto antes de confirmar.' },
  { p: '¿Necesito imprimir el ticket?', r: 'No hace falta. Basta con enseñar el código QR desde el móvil al entrar.' },
  { p: '¿Hay plazas para motos y movilidad reducida?', r: 'Sí. Puedes filtrarlas en el mapa al reservar; las de movilidad reducida están junto a los ascensores.' },
];

export default function Inicio() {
  const navigate = useNavigate();
  const [horario, setHorario] = useState({ inicio: aInputLocal(proximaHora(0)), fin: aInputLocal(proximaHora(2)) });
  const [plazas, setPlazas] = useState([]);
  const [libresAhora, setLibresAhora] = useState(null);
  const [opiniones, setOpiniones] = useState(null);

  useEffect(() => {
    api.plazas().then(setPlazas).catch(() => {});
    api.valoraciones().then(setOpiniones).catch(() => setOpiniones({ media: null, total: 0, opiniones: [] }));
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
    const params = new URLSearchParams({ inicio: new Date(horario.inicio).toISOString(), fin: new Date(horario.fin).toISOString() });
    navigate(`/reservar?${params}`);
  };

  const cifras = [
    { valor: plazas.length || '—', texto: 'plazas en total', icono: 'coche' },
    { valor: libresAhora ?? '—', texto: 'libres ahora mismo', icono: 'checkCirculo' },
    { valor: opiniones?.total ? `${opiniones.media.toLocaleString('es-ES')} ★` : 'Nuevo', texto: opiniones?.total ? `${opiniones.total} valoraciones` : 'sé el primero en valorar', icono: 'estrella' },
    { valor: '24/7', texto: 'abierto todo el año', icono: 'reloj' },
  ];

  return (
    <>
      {/* ---------- Portada ---------- */}
      <section className="hero">
        <div className="hero-cuadricula" aria-hidden="true" />
        <div className="contenedor hero-grid">
          <div>
            <span className="badge badge-verde">
              <span className="punto-verde latido" /> {libresAhora != null ? `${libresAhora} plazas libres ahora mismo` : 'Abierto ahora · 24 h'}
            </span>
            <h1 style={{ marginTop: 18 }}>Aparca sin dar vueltas. <span>Reserva tu plaza</span> en segundos.</h1>
            <p className="hero-sub">Elige el día y la hora, escoge tu plaza en el mapa y llega con tu ticket listo. Sin colas, sin sorpresas.</p>
            <div className="hero-confianza">
              <span><Icono nombre="check" tam={16} /> Cancelación gratuita</span>
              <span><Icono nombre="check" tam={16} /> {precioMinimo != null ? `Desde ${euros(precioMinimo)}/h` : 'Precio por cuartos de hora'}</span>
              <span><Icono nombre="check" tam={16} /> Ticket con QR</span>
            </div>
          </div>

          <div className="hero-tarjetas">
            <form className="tarjeta buscador" onSubmit={buscar}>
              <h3><Icono nombre="buscar" /> ¿Cuándo necesitas aparcar?</h3>
              <CamposHorario inicio={horario.inicio} fin={horario.fin} onCambiar={setHorario} />
              <button className="btn btn-grande btn-bloque">Ver plazas libres <Icono nombre="flecha" /></button>
              <small className="centro">Sin registro para consultar · pagas solo lo que usas</small>
            </form>
            <div className="flotante flotante-1" aria-hidden="true">
              <span className="flotante-icono verde"><Icono nombre="check" tam={16} /></span>
              <div><strong>Plaza A-03 reservada</strong><small>Hoy · 18:00 – 20:00</small></div>
            </div>
            <div className="flotante flotante-2" aria-hidden="true">
              <span className="flotante-icono azul"><Icono nombre="rayo" tam={16} /></span>
              <div><strong>Carga eléctrica</strong><small>Plazas con cargador</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Cifras ---------- */}
      <section className="contenedor">
        <div className="banda-cifras">
          {cifras.map((c, i) => (
            <Revelar key={c.texto} retraso={i * 80} className="cifra">
              <Icono nombre={c.icono} tam={22} />
              <div><strong>{c.valor}</strong><span>{c.texto}</span></div>
            </Revelar>
          ))}
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section className="seccion">
        <div className="contenedor">
          <Revelar className="seccion-cabecera">
            <span className="eyebrow">Cómo funciona</span>
            <h2>Tu plaza reservada en tres pasos</h2>
          </Revelar>
          <div className="pasos">
            {PASOS.map((p, i) => (
              <Revelar key={p.titulo} retraso={i * 120} className="tarjeta paso">
                <span className="paso-numero">{i + 1}</span>
                <div className="paso-num"><Icono nombre={p.icono} tam={22} /></div>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tarifas ---------- */}
      <section className="seccion seccion-alt" id="tarifas">
        <div className="contenedor">
          <Revelar className="seccion-cabecera">
            <span className="eyebrow">Tarifas</span>
            <h2>Una plaza para cada vehículo</h2>
            <p>Precios por hora, cobrados por cuartos de hora. Sin cuotas ni permanencia.</p>
          </Revelar>
          <div className="tarifas">
            {(tarifas.length ? tarifas : Object.keys(TIPOS).map((tipo) => ({ tipo }))).map((t, i) => (
              <Revelar key={t.tipo} retraso={i * 80} className="tarjeta tarifa">
                <div className="tarifa-icono" style={{ background: TIPOS[t.tipo].fondo, color: TIPOS[t.tipo].color }}>
                  <Icono nombre={TIPOS[t.tipo].icono} tam={24} />
                </div>
                <h3>{TIPOS[t.tipo].nombre}</h3>
                <div className="tarifa-precio">
                  {t.desde != null ? <>{euros(t.desde)} <small>/ hora</small></> : <span className="skeleton" style={{ display: 'block', height: 36, width: 120 }} />}
                </div>
                <small>{t.total ? `${t.total} ${t.total === 1 ? 'plaza' : 'plazas'} · 2 h = ${euros(t.desde * 2)}` : ' '}</small>
                <Link to={`/reservar?tipo=${t.tipo}`} className="btn btn-sec btn-peq" style={{ marginTop: 'auto' }}>Ver plazas <Icono nombre="flecha" tam={15} /></Link>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Ventajas ---------- */}
      <section className="seccion">
        <div className="contenedor">
          <Revelar className="seccion-cabecera">
            <span className="eyebrow">Por qué elegirnos</span>
            <h2>Todo pensado para que aparcar no sea un problema</h2>
          </Revelar>
          <div className="ventajas">
            {VENTAJAS.map((v, i) => (
              <Revelar key={v.titulo} retraso={(i % 3) * 100} className="ventaja">
                <div className="paso-num"><Icono nombre={v.icono} tam={22} /></div>
                <div>
                  <h3>{v.titulo}</h3>
                  <p>{v.texto}</p>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Opiniones reales ---------- */}
      <section className="seccion seccion-alt" id="opiniones">
        <div className="contenedor">
          <Revelar className="seccion-cabecera">
            <span className="eyebrow">Opiniones</span>
            <h2>Lo que dicen nuestros clientes</h2>
            {opiniones?.total > 0 && (
              <div className="media-opiniones">
                <strong>{opiniones.media.toLocaleString('es-ES')}</strong>
                <div><Estrellas valor={opiniones.media} tam={20} /><small>{opiniones.total} valoraciones verificadas</small></div>
              </div>
            )}
          </Revelar>
          {opiniones?.opiniones?.length > 0 ? (
            <div className="opiniones">
              {opiniones.opiniones.map((o, i) => (
                <Revelar key={i} retraso={(i % 3) * 100} className="tarjeta opinion">
                  <Estrellas valor={o.puntuacion} />
                  <p>“{o.comentario}”</p>
                  <div className="opinion-autor">
                    <span className="avatar">{o.nombre[0]?.toUpperCase()}</span>
                    <div><strong>{o.nombre}</strong><small>Cliente verificado · {new Date(o.creado_en).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</small></div>
                  </div>
                </Revelar>
              ))}
            </div>
          ) : (
            <Revelar className="tarjeta opiniones-vacio">
              <Icono nombre="estrella" tam={28} />
              <div>
                <h3>Todavía no hay opiniones</h3>
                <p>Después de aparcar podrás valorar tu experiencia desde "Mis reservas". ¡Tu opinión ayuda a otros conductores!</p>
              </div>
            </Revelar>
          )}
        </div>
      </section>

      {/* ---------- Cómo llegar ---------- */}
      <section className="seccion" id="como-llegar">
        <div className="contenedor">
          <Revelar className="seccion-cabecera">
            <span className="eyebrow">Ubicación</span>
            <h2>Cómo llegar</h2>
          </Revelar>
          <div className="como-llegar">
            <Revelar className="mapa-embebido">
              <iframe title={`Mapa de ${NEGOCIO.direccion}`} src={urlMapa()} loading="lazy" />
            </Revelar>
            <Revelar retraso={100} className="tarjeta info-llegar">
              <div className="dato-llegar"><Icono nombre="ubicacion" /><div><strong>{NEGOCIO.direccion}</strong><small>{NEGOCIO.ciudad}</small></div></div>
              <div className="dato-llegar"><Icono nombre="reloj" /><div><strong>{NEGOCIO.horario}</strong><small>Acceso con tu código QR</small></div></div>
              <div className="dato-llegar"><Icono nombre="altura" /><div><strong>Altura máxima {NEGOCIO.alturaMaxima}</strong><small>Furgonetas pequeñas incluidas</small></div></div>
              {NEGOCIO.transporte.map((t) => (
                <div key={t.texto} className="dato-llegar"><Icono nombre={t.icono} /><div><span>{t.texto}</span></div></div>
              ))}
              <a href={urlComoLlegar()} target="_blank" rel="noreferrer" className="btn btn-bloque">Abrir indicaciones <Icono nombre="flecha" /></a>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ---------- Preguntas ---------- */}
      <section className="seccion seccion-alt" id="preguntas">
        <div className="contenedor">
          <Revelar className="seccion-cabecera">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2>¿Tienes dudas?</h2>
            <p>Y si no encuentras la respuesta, pregunta a nuestro asistente o <Link to="/contacto">escríbenos</Link>.</p>
          </Revelar>
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

      <section className="seccion">
        <div className="contenedor">
          <Revelar className="cta">
            <div>
              <h2>¿Listo para aparcar sin estrés?</h2>
              <p>Reserva ahora y llega con tu plaza garantizada.</p>
            </div>
            <Link to="/reservar" className="btn btn-grande">Reservar mi plaza <Icono nombre="flecha" /></Link>
          </Revelar>
        </div>
      </section>
    </>
  );
}
