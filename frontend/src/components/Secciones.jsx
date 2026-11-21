import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { nombreParking, zonaParking } from './Reserva.jsx';
import Barrera from './Barrera.jsx';
import { Flecha, Icono } from './Comunes.jsx';
import { TIPOS, euros, precioEstimado } from '../utils.js';

const HORAS_TARIFA = [1, 2, 4, 8, 12];
export const LETRA = { centro: 'C', puerto: 'P', estacion: 'E' };
export const DESTINOS = [
  ['centro', 'pin', ['Rambla Nova y centro', 'Rambla Nova i centre', 'Rambla Nova & centre']],
  ['estacion', 'pin', ['Estación de tren', 'Estació de tren', 'Train station']],
  ['puerto', 'pin', ['El Serrallo y el puerto', 'El Serrallo i el port', 'El Serrallo & port']],
];

// Barra inferior fija en móvil cuando la reserva queda fuera de la pantalla
export function BarraMovil({ desde, eur, T, siempre = false }) {
  const [ver, setVer] = useState(siempre);
  useEffect(() => {
    if (siempre) return undefined;
    const caja = document.getElementById('reservar');
    if (!caja || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVer(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(caja);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    document.body.classList.toggle('con-barra', ver);
    return () => document.body.classList.remove('con-barra');
  }, [ver]);
  if (!ver) return null;
  return (
    <div className="barra-movil md:hidden">
      <p className="text-sm">{desde != null && <>{T('Desde', 'Des de', 'From')} <span className="tnum precio text-lg text-ink">{eur(desde)}</span>/h</>}</p>
      <Link to="/#reservar" className="btn btn-accent !min-h-[44px]">{T('Reservar plaza', 'Reservar plaça', 'Book a space')}</Link>
    </div>
  );
}

// Mapa esquemático de Tarragona (no a escala) con los tres parkings
const POS = { centro: [470, 120], estacion: [560, 222], puerto: [300, 240] };
function MapaTarragona({ parkings, lang, T, onElegir }) {
  const manzanas = [];
  for (let i = 0; i < 44; i++) {
    const x = 30 + (i % 11) * 80, y = 16 + Math.floor(i / 11) * 50;
    if (y + (900 - x) * 0.06 < 230 && !(x > 640 && y < 70)) manzanas.push(<rect key={i} x={x} y={y} width="68" height="38" rx="5" fill="#FFFFFF" />);
  }
  return (
    <figure className="mapa mt-8">
      <svg viewBox="0 0 900 320" className="block h-auto w-full" role="img" aria-label={T('Mapa esquemático con los tres parkings', 'Mapa esquemàtic amb els tres pàrquings', 'Schematic map of the three car parks')}>
        <rect width="900" height="320" fill="#EEF2F6" />
        {manzanas}
        {/* parques */}
        <rect x="110" y="66" width="148" height="38" rx="8" fill="#BBF7D0" />
        <rect x="830" y="30" width="60" height="70" rx="10" fill="#BBF7D0" />
        {/* Part Alta y catedral */}
        <path d="M660 20 h160 v76 h-160 z" fill="#FDE7C8" rx="8" />
        <g transform="translate(720 40)"><rect x="0" y="12" width="40" height="26" fill="#D97706" opacity=".85" /><path d="M-4 14 L20 -4 L44 14 Z" fill="#B45309" /><rect x="16" y="22" width="8" height="16" fill="#FFF7ED" /></g>
        <text x="740" y="92" textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400E">{T('Catedral', 'Catedral', 'Cathedral')}</text>
        {/* mar y playa */}
        <path d="M0 300 C 160 272, 300 284, 420 266 S 700 236, 900 176 L 900 320 L 0 320 Z" fill="#7DD3FC" />
        <path d="M0 312 C 200 296, 420 300, 900 230 L 900 320 L 0 320 Z" fill="#38BDF8" opacity=".55" />
        <path d="M640 246 C 720 232, 800 212, 900 176 L 900 196 C 800 228, 720 248, 650 258 Z" fill="#FDE68A" />
        <text x="790" y="238" fontSize="12" fontWeight="700" fill="#92400E" transform="rotate(-12 790 238)">{T('Playa del Miracle', 'Platja del Miracle', 'Miracle Beach')}</text>
        <text x="40" y="306" fontSize="15" fontStyle="italic" fontWeight="600" fill="#0C4A6E">{T('Mar Mediterráneo', 'Mar Mediterrània', 'Mediterranean Sea')}</text>
        {/* puerto */}
        <path d="M240 270 L 240 304 L 380 304" fill="none" stroke="#475569" strokeWidth="9" strokeLinecap="round" />
        {[0, 1, 2].map((i) => <path key={i} d={`M${262 + i * 34} 292 l12 -6 l12 6 z`} fill="#FFFFFF" />)}
        {/* anfiteatro romano */}
        <g transform="translate(806 150)">
          <ellipse cx="0" cy="0" rx="30" ry="18" fill="#FCD34D" stroke="#B45309" strokeWidth="3" />
          <ellipse cx="0" cy="0" rx="16" ry="8" fill="#FEF3C7" />
        </g>
        <text x="806" y="124" textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400E">{T('Anfiteatro romano', 'Amfiteatre romà', 'Roman amphitheatre')}</text>
        {/* Rambla Nova con árboles y vía del tren */}
        <path d="M250 40 L 640 210" fill="none" strokeWidth="16" strokeLinecap="round" stroke="#E2E8F0" />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={266 + i * 32} cy={55 + i * 14} r="5" fill="#22C55E" />)}
        <text x="320" y="58" fontSize="13" fontWeight="700" transform="rotate(23.5 320 58)" fill="#475569">Rambla Nova</text>
        <path d="M110 268 C 330 252, 560 238, 900 158" fill="none" stroke="#475569" strokeWidth="3" strokeDasharray="10 7" />
        {/* parkings */}
        {parkings.map((p) => {
          const [x, y] = POS[p.slug] || [450, 160];
          const color = `rgb(var(--c-${p.slug}, var(--accent)))`;
          return (
            <g key={p.id} className="mapa-pin" role="button" tabIndex={0} aria-label={`${T('Reservar en', 'Reservar a', 'Book at')} ${nombreParking(p, lang)}`}
              onClick={() => onElegir(p.slug)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onElegir(p.slug); } }}>
              <path d={`M${x} ${y} l-17 -23 a21 21 0 1 1 34 0 z`} style={{ fill: color, stroke: '#fff', strokeWidth: 3 }} />
              <text x={x} y={y - 29} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{LETRA[p.slug] || 'P'}</text>
              <rect className="mapa-lbl" x={x + 24} y={y - 50} rx="8" width={nombreParking(p, lang).length * 8 + 22} height="30" fill="#fff" style={{ stroke: color, strokeWidth: 1.5 }} />
              <text className="mapa-lbl" x={x + 35} y={y - 30} fontSize="14" fontWeight="700" fill="#0F172A">{nombreParking(p, lang)}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2 border-t border-line/10 px-4 py-3">
        {parkings.map((p) => (
          <button key={p.id} type="button" className={`destino c-${p.slug} !min-h-[40px] !shadow-none`} onClick={() => onElegir(p.slug)}>
            <span className="pk-dot" aria-hidden="true">{LETRA[p.slug]}</span>{nombreParking(p, lang)}
          </button>
        ))}
      </div>
      <figcaption className="px-4 pb-3 text-xs text-muted">{T('Esquema orientativo, no a escala. Pulsa un parking para reservar en él.', "Esquema orientatiu, no a escala. Prem un pàrquing per reservar-hi.", 'Not to scale. Tap a car park to book there.')}</figcaption>
    </figure>
  );
}

const ICONO_TIPO = { normal: 'coche', electrico: 'rayo', moto: 'moto', discapacitados: 'accesible' };
const DESC_TIPO = {
  normal: ['Para coches y furgonetas pequeñas.', 'Per a cotxes i furgonetes petites.', 'For cars and small vans.'],
  electrico: ['Plazas reservadas para vehículos eléctricos.', 'Places reservades per a vehicles elèctrics.', 'Spaces reserved for electric vehicles.'],
  moto: ['Plazas más pequeñas y más baratas para motos.', 'Places més petites i més barates per a motos.', 'Smaller, cheaper spaces for motorbikes.'],
  discapacitados: ['Plazas adaptadas para personas con movilidad reducida.', 'Places adaptades per a persones amb mobilitat reduïda.', 'Spaces adapted for people with reduced mobility.'],
};

// Paleta de las ilustraciones (coches de colores, árboles, mar y arena)
export const COCHES = ['#2563EB', '#F59E0B', '#14B8A6', '#FB7185', '#334155', '#FFFFFF', '#8B5CF6', '#22C55E'];
// Coche visto desde arriba
export function Coche({ x, y, w = 34, h = 62, color, giro = 0 }) {
  const borde = color === '#FFFFFF' ? '#CBD5E1' : 'none';
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro} ${w / 2} ${h / 2})`}>
      <rect x="2" y="3" width={w} height={h} rx="9" fill="#0F172A" opacity=".08" />
      <rect width={w} height={h} rx="9" fill={color} stroke={borde} strokeWidth="1.5" />
      <rect x="5" y={h * 0.2} width={w - 10} height={h * 0.18} rx="4" fill="#0F172A" opacity=".55" />
      <rect x="5" y={h * 0.62} width={w - 10} height={h * 0.13} rx="4" fill="#0F172A" opacity=".45" />
      <rect x="6" y={h * 0.4} width={w - 12} height={h * 0.2} rx="3" fill="#FFFFFF" opacity=".18" />
    </g>
  );
}
function Arbol({ x, y, r = 16, tono = 0 }) {
  return (
    <g>
      <circle cx={x + 2} cy={y + 3} r={r} fill="#0F172A" opacity=".08" />
      <circle cx={x} cy={y} r={r} fill={tono ? '#10B981' : '#34D399'} />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.45} fill="#FFFFFF" opacity=".22" />
    </g>
  );
}

// Ilustración de la portada: acera con árboles, plazas con coches de colores y calzada
export function VistaAerea() {
  const plazas = [];
  for (let i = 0; i < 26; i++) {
    const x = 20 + i * 56;
    plazas.push(<rect key={`b${i}`} x={x} y="62" width="56" height="84" fill="none" stroke="#FFFFFF" strokeWidth="3" />);
    const libre = [3, 9, 14, 21].includes(i);
    if (i === 9) plazas.push(<g key="libre"><rect x={x + 4} y="66" width="48" height="76" rx="6" fill="#22C55E" opacity=".18" /><text x={x + 28} y="112" textAnchor="middle" fontSize="22" fontWeight="800" fill="#16A34A">P</text></g>);
    else if (!libre) plazas.push(<Coche key={`c${i}`} x={x + 11} y="72" color={COCHES[(i * 5) % COCHES.length]} />);
  }
  return (
    <svg className="hero-art w-full" style={{ inset: 'auto 0 0 0', height: 210 }} viewBox="0 0 1480 210" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect y="0" width="1480" height="58" fill="#E2E8F0" />
      {Array.from({ length: 20 }, (_, i) => <Arbol key={i} x={40 + i * 76} y={28} r={i % 3 ? 17 : 21} tono={i % 2} />)}
      <rect y="58" width="1480" height="152" fill="#CBD5E1" />
      <rect y="58" width="1480" height="92" fill="#94A3B8" opacity=".55" />
      {plazas}
      <rect y="150" width="1480" height="60" fill="#64748B" opacity=".55" />
      <path d="M0 182 H1480" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="34 26" />
      <Coche x={300} y={157} w={30} h={56} color="#F59E0B" giro={90} />
      <Coche x={980} y={157} w={30} h={56} color="#14B8A6" giro={-90} />
      <g transform="translate(1180 8)">
        <rect x="18" y="20" width="5" height="40" fill="#64748B" />
        <rect width="42" height="42" rx="7" fill="#2563EB" stroke="#FFFFFF" strokeWidth="3" />
        <text x="21" y="31" textAnchor="middle" fontSize="28" fontWeight="800" fill="#FFFFFF">P</text>
      </g>
    </svg>
  );
}

// Dibujo de cabecera de cada tarjeta de parking
function PlazasArt({ semilla }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 132" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <rect x={14 + i * 44} y="14" width="44" height="72" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
          {(i + semilla) % 4 === 2
            ? <rect x={18 + i * 44} y="18" width="36" height="64" rx="6" fill="rgb(var(--pk))" opacity=".22" />
            : <Coche x={22 + i * 44} y={20} w={28} h={58} color={COCHES[(i * 3 + semilla * 2) % COCHES.length]} />}
        </g>
      ))}
      <path d="M0 110 H400" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="22 16" />
    </svg>
  );
}

// Tarifas de los parkings, leídas del backend
export function useTarifas() {
  const [tarifas, setTarifas] = useState(null);
  const [errorTarifas, setErrorTarifas] = useState('');
  useEffect(() => {
    api.parkings().then(setTarifas).catch((e) => { setTarifas([]); setErrorTarifas(e.message); });
  }, []);
  return { tarifas, errorTarifas };
}

// Desde otras páginas: «Reservar aquí» lleva a la reserva de la portada con el parking elegido
export function useElegir() {
  const navigate = useNavigate();
  return useCallback((pedido) => navigate('/#reservar', { state: { pedido: { ...pedido, n: Date.now() } } }), [navigate]);
}

// Precio por hora más bajo de una plaza normal (para la barra del móvil)
export const desdeNormal = (tarifas) => {
  const v = (tarifas || []).map((p) => p.tarifas?.normal).filter((x) => x != null);
  return v.length ? Math.min(...v) : null;
};

// Cabecera de las páginas interiores, con una tira de coches de colores
export function CabeceraPagina({ eyebrow, titulo, lead, children }) {
  return (
    <section className="page-head">
      <div className="wrap relative z-[1] pb-16 pt-10 sm:pt-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display h-hero mt-3 !text-[clamp(2.2rem,3.2vw+1rem,3.4rem)]">{titulo}</h1>
        {lead && <p className="lead mt-4">{lead}</p>}
        {children}
      </div>
      <svg className="page-head-art" viewBox="0 0 1440 46" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <rect width="1440" height="46" fill="#CBD5E1" />
        <path d="M0 23 H1440" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="30 22" />
        {[90, 330, 610, 880, 1150, 1380].map((x, i) => <Coche key={x} x={x} y={-2} w={22} h={44} color={COCHES[(i * 3 + 1) % COCHES.length]} giro={i % 2 ? -90 : 90} />)}
      </svg>
    </section>
  );
}

export function SeccionVentajas({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ SIN TICKET · SIN EFECTIVO · SIN ESTRÉS (APCOA) ============ */}
      <section className="usp" aria-label={T('Ventajas', 'Avantatges', 'Benefits')}>
        <ul className="wrap grid gap-6 py-8 md:grid-cols-3">
          {[
            ['ticket', T('Sin ticket', 'Sense tiquet', 'No ticket'), T('Tu matrícula abre la barrera.', 'La teva matrícula obre la barrera.', 'Your number plate opens the barrier.')],
            ['efectivo', T('Sin efectivo', 'Sense efectiu', 'No cash'), T('Reservas y pagas online, antes de llegar.', 'Reserves i pagues en línia, abans d\'arribar.', 'Book and pay online before you arrive.')],
            ['calma', T('Sin estrés', 'Sense estrès', 'No stress'), T('Tu plaza te espera, aunque el centro esté lleno.', 'La teva plaça t\'espera, encara que el centre sigui ple.', 'Your space is waiting, even when the centre is full.')],
          ].map(([ico, h, p]) => (
            <li key={ico} className="flex items-center gap-4">
              <span className="usp-ico"><Icono nombre={ico} /></span>
              <span><span className="block font-display text-lg font-extrabold text-ink">{h}.</span><span className="text-sm">{p}</span></span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export function SeccionParkings({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ NUESTROS PARKINGS (Q-Park: tarjetas de ubicaciones) ============ */}
      <section id="parkings" className={`band ${completo ? '!pt-10' : ''}`}>
        <div className="wrap">
          {!sinCabecera && <div className="section-head">
            <div>
              <p className="eyebrow">{T('Nuestros parkings', 'Els nostres pàrquings', 'Our car parks')}</p>
              <h2 className="display h-sec mt-3">{T('Tres parkings, a un paso de todo.', 'Tres pàrquings, a un pas de tot.', 'Three car parks, close to everything.')}</h2>
            </div>
            {completo
              ? <a href="#tarifas" className="more-link">{T('Ver todas las tarifas', 'Veure totes les tarifes', 'See all prices')}<Flecha /></a>
              : <Link to="/parkings" className="more-link">{T('Ver mapa y tarifas', 'Veure mapa i tarifes', 'See map and prices')}<Flecha /></Link>}
          </div>}
          {/* Cifras reales, leídas de la base de datos */}
          {completo && tarifas?.length > 0 && (
            <dl className={`cifras ${sinCabecera ? '' : 'mt-8'}`}>
              {[
                [tarifas.length, T('parkings en Tarragona', 'pàrquings a Tarragona', 'car parks in Tarragona')],
                [tarifas.reduce((a, p) => a + (p.total_plazas || 0), 0), T('plazas reservables', 'places reservables', 'bookable spaces')],
                [eur(Math.min(...tarifas.flatMap((p) => Object.values(p.tarifas || {})))), T('precio por hora más bajo', 'preu per hora més baix', 'lowest hourly price')],
                ['15 min', T('de margen para entrar antes', "de marge per entrar abans", 'early entry allowed')],
              ].map(([n, txt]) => (
                <div key={txt}><dt className="sr-only">{txt}</dt><dd><span className="tnum block font-display text-3xl font-extrabold text-ink">{n}</span><span className="text-sm">{txt}</span></dd></div>
              ))}
            </dl>
          )}
          {completo && <MapaTarragona parkings={tarifas || []} lang={lang} T={T} onElegir={(slug) => setPedido({ slug, n: Date.now() })} />}
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {tarifas === null && [0, 1, 2].map((i) => <div key={i} className="pcard h-[330px] animate-pulse" aria-hidden="true" />)}
            {tarifas?.map((p, i) => {
              const precios = Object.values(p.tarifas || {});
              const desde = p.tarifas?.normal ?? (precios.length ? Math.min(...precios) : null);
              return (
                <article key={p.id} className={`pcard c-${p.slug}`}>
                  <div className="pcard-art">
                    <PlazasArt semilla={i} />
                    <span className="pcard-pin" aria-hidden="true">{LETRA[p.slug] || 'P'}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-0 p-5 pt-9 [&>ul]:mb-5">
                    <h3 className="text-xl font-extrabold">{nombreParking(p, lang)}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm"><Icono nombre="pin" className="!h-4 !w-4 text-accent" />{zonaParking(p, lang)}</p>
                    <ul className="mt-4 flex gap-1.5" aria-label={T('Tipos de plaza', 'Tipus de plaça', 'Space types')}>
                      {Object.keys(p.tarifas || {}).map((tp) => (
                        <li key={tp} className="tipo-ico" title={T(...TIPOS[tp])}><Icono nombre={ICONO_TIPO[tp]} className="!h-[18px] !w-[18px]" /><span className="sr-only">{T(...TIPOS[tp])}</span></li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/10 pt-4">
                      <p className="text-sm">
                        {desde != null && <><span className="block">{T('desde', 'des de', 'from')}</span><span className="tnum precio text-2xl text-ink">{eur(desde)}</span><span className="text-muted">/h</span></>}
                        <span className="block text-xs text-muted">{p.total_plazas} {T('plazas', 'places', 'spaces')}</span>
                      </p>
                      <button type="button" className="btn btn-primary" onClick={() => setPedido({ slug: p.slug, n: Date.now() })}>
                        {T('Reservar aquí', 'Reservar aquí', 'Book here')}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {tarifas?.length === 0 && <p className="note note-danger mt-6">{errorTarifas || T('Aún no hay parkings dados de alta.', 'Encara no hi ha pàrquings donats d\'alta.', 'No car parks have been added yet.')}</p>}
        </div>
      </section>
    </>
  );
}

export function SeccionComo({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ CÓMO FUNCIONA: recorrido con la línea del carril ============ */}
      <section id="como-funciona" className="band">
        <div className="wrap">
          {!sinCabecera && <><p className="eyebrow">{t('hw.k')}</p>
          <h2 className="display h-sec mt-3">{t('hw.h')}</h2></>}
          <ol className={`ruta ${sinCabecera ? 'mt-2' : 'mt-12'}`}>
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="ruta-paso">
                <span className="how-n" aria-hidden="true">{n}</span>
                <h3 className="mt-5 text-xl font-extrabold">{t(`hw.${n}h`)}</h3>
                <p className="mt-2 max-w-[30ch]">{t(`hw.${n}p`)}</p>
              </li>
            ))}
          </ol>
          {!completo && <Link to="/como-funciona" className="more-link mt-8">{T('Ver cómo funciona la barrera', 'Veure com funciona la barrera', 'See how the barrier works')}<Flecha /></Link>}
        </div>
      </section>
    </>
  );
}

export function SeccionGarantia({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ GARANTÍA (SpotHero / JustPark) ============ */}
      <section className="band !pt-0" aria-labelledby="garantiaH">
        <div className="wrap">
          <div className="garantia">
            <div className="max-w-sm">
              <p className="eyebrow">{T('Garantía Tarraco', 'Garantia Tarraco', 'Tarraco promise')}</p>
              <h2 id="garantiaH" className="display mt-3 text-3xl leading-tight">{T('Reserva tranquilo. Te lo ponemos fácil.', 'Reserva tranquil. T\'ho posem fàcil.', 'Book with confidence. We keep it simple.')}</h2>
            </div>
            <ul className="grid flex-1 gap-6 sm:grid-cols-3">
              {[
                ['escudo', T('Precio cerrado', 'Preu tancat', 'Fixed price'), T('Pagas lo que ves al reservar. Si la tarifa cambia después, tu precio no.', 'Pagues el que veus en reservar. Si la tarifa canvia després, el teu preu no.', 'You pay what you see when booking. If the rate changes later, your price does not.')],
                ['reloj', T('Cancela desde tu cuenta', 'Cancel·la des del teu compte', 'Cancel from your account'), T('Hasta la hora de entrada, en «Mis reservas», con un clic.', "Fins a l'hora d'entrada, a «Les meves reserves», amb un clic.", 'Up to your arrival time, in «My bookings», in one click.')],
                ['tarjeta', T('Sin multas', 'Sense multes', 'No fines'), T('Si te pasas de la hora, solo pagas los minutos de más a la misma tarifa.', "Si et passes de l'hora, només pagues els minuts de més a la mateixa tarifa.", 'If you stay longer, you only pay the extra minutes at the same rate.')],
              ].map(([ico, h, p]) => (
                <li key={h}>
                  <span className="usp-ico !h-11 !w-11"><Icono nombre={ico} /></span>
                  <h3 className="mt-3 text-lg font-extrabold">{h}</h3>
                  <p className="mt-1 text-sm">{p}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export function SeccionTarifas({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  const [tipoTarifa, setTipoTarifa] = useState('normal');
  return (
    <>
      {/* ============ TARIFAS (desde la base de datos) ============ */}
      <section id="tarifas" className="band bg-surface">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">{t('t.k')}</p>
              <h2 className="display h-sec mt-2">{t('t.h')}</h2>
            </div>
            <p className="max-w-md">{t('t.p')}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={T('Tipo de plaza', 'Tipus de plaça', 'Space type')}>
            {Object.keys(TIPOS).map((tp) => (
              <button key={tp} type="button" className="pill" aria-pressed={tipoTarifa === tp} onClick={() => setTipoTarifa(tp)}>
                <Icono nombre={ICONO_TIPO[tp]} className="!h-[18px] !w-[18px]" />{T(...TIPOS[tp])}
              </button>
            ))}
          </div>
          <div className="relative mt-5 overflow-x-auto rounded-2xl border border-line/10 bg-surface shadow-[var(--shadow)]">
            <table className="rates tnum">
              <thead>
                <tr>
                  <th scope="col">Parking</th>
                  {HORAS_TARIFA.map((h) => <th key={h} scope="col">{h} h</th>)}
                  <th scope="col"><span className="sr-only">{t('t.act')}</span></th>
                </tr>
              </thead>
              <tbody>
                {tarifas === null && <tr><td colSpan={7} className="!text-left text-muted">{T('Cargando tarifas…', 'Carregant tarifes…', 'Loading prices…')}</td></tr>}
                {tarifas?.filter((p) => p.tarifas?.[tipoTarifa] != null).map((p) => (
                  <tr key={p.id}>
                    <th scope="row">
                      <span className="block text-lg font-bold text-ink">{nombreParking(p, lang)}</span>
                      <span className="block text-sm font-normal text-muted">{zonaParking(p, lang)} · {eur(p.tarifas[tipoTarifa])}/h</span>
                    </th>
                    {HORAS_TARIFA.map((h) => <td key={h} className="precio text-ink">{eur(precioEstimado(p.tarifas[tipoTarifa], h * 60).total)}</td>)}
                    <td>
                      <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 text-sm"
                        aria-label={`${T('Reservar en', 'Reservar a', 'Book at')} ${nombreParking(p, lang)}`}
                        onClick={() => setPedido({ slug: p.slug, tipo: tipoTarifa, n: Date.now() })}>
                        {T('Reservar', 'Reservar', 'Book')}
                      </button>
                    </td>
                  </tr>
                ))}
                {tarifas?.length === 0 && (
                  <tr><td colSpan={7} className="!text-left text-danger">{errorTarifas || T('Aún no hay parkings dados de alta.', 'Encara no hi ha pàrquings donats d\'alta.', 'No car parks have been added yet.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">{T('Precios de la plaza más barata de cada tipo en cada parking, leídos de la base de datos. Incluyen el 10 % de gestión.', 'Preus de la plaça més barata de cada tipus a cada pàrquing, llegits de la base de dades. Inclouen el 10 % de gestió.', 'Prices of the cheapest space of each type in each car park, read from the database. They include the 10 % fee.')}</p>
        </div>
      </section>
    </>
  );
}

export function SeccionBarrera({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ PRUEBA LA BARRERA ============ */}
      <section id="barrera" className="band">
        <div className="wrap grid items-center gap-10 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="eyebrow">{t('g.k')}</p>
            <h2 className="display h-sec mt-2">{t('g.h')}</h2>
            <p className="lead mt-4">{t('g.p')}</p>
            <ul className="mt-6 grid gap-3">
              <li className="flex items-start gap-3"><span className="tag tag-ok mt-0.5">{t('g.t1')}</span><span>{t('g.l1')}</span></li>
              <li className="flex items-start gap-3"><span className="tag tag-danger mt-0.5">{t('g.t2')}</span><span>{t('g.l2')}</span></li>
              <li className="flex items-start gap-3"><span className="tag tag-warn mt-0.5">{t('g.t3')}</span><span>{t('g.l3')}</span></li>
            </ul>
          </div>
          <Barrera matricula={ultima?.matricula} version={ultima?.id} />
        </div>
      </section>
    </>
  );
}

export function SeccionSeguridad({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ SEGURIDAD ============ */}
      <section className="band bg-surface">
        <div className="wrap">
          <p className="eyebrow">{t('s.k')}</p>
          <h2 className="display h-sec mt-2">{t('s.h')}</h2>
          <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="flex gap-4 border-t-2 border-line/10 pt-5">
                <Icono nombre={['candado', 'tarjeta', 'escudo', 'copia'][n - 1]} className="mt-0.5 flex-none text-accent" />
                <div><h3 className="text-lg font-extrabold">{t(`s.${n}h`)}</h3><p className="mt-1 text-[.95rem]">{t(`s.${n}p`)}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export function SeccionOpiniones({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ OPINIONES (ilustrativas, avisado en la página) ============ */}
      <section id="opiniones" className="band">
        <div className="wrap">
          <p className="eyebrow">{t('o.k')}</p>
          <h2 className="display h-sec mt-2">{t('o.h')}</h2>
          <p className="note note-warn mt-5 max-w-2xl">{t('o.disc')}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <figure key={n} className="tile flex flex-col p-6">
                <blockquote className="flex-1 text-lg text-ink">{t(`o.${n}q`)}</blockquote>
                <figcaption className="mt-5 border-t-[1.5px] border-line/10 pt-4 text-sm">
                  <span className="block font-bold text-ink">{t(`o.${n}w`)}</span>
                  <span className="text-muted">{t(`o.ex${n}`)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function SeccionFaq({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ AYUDA / FAQ ============ */}
      <section id="faq" className="band !pt-10">
        <div className="wrap grid gap-8 lg:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <div>
            <p className="eyebrow">{t('f.k')}</p>
            <h2 className="display h-sec mt-2">{t('f.h')}</h2>
            <div className="card mt-8 hidden max-w-sm p-6 lg:block">
              <p className="font-display text-lg font-extrabold text-ink">{T('¿Prefieres verlo funcionar?', 'Prefereixes veure-ho funcionar?', 'Rather see it in action?')}</p>
              <p className="mt-2 text-sm">{T('Haz una reserva de prueba y pásala por la barrera: es la forma más rápida de entenderlo.', 'Fes una reserva de prova i passa-la per la barrera: és la manera més ràpida d\'entendre-ho.', 'Make a test booking and drive it through the barrier: the quickest way to get it.')}</p>
              <Link to="/como-funciona#barrera" className="more-link mt-2">{t('n.gate')}<Flecha /></Link>
            </div>
          </div>
          <div className="min-w-0 border-t-[1.5px] border-line/15">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <details key={n} className="faq" open={n === 1}>
                <summary><span>{t(`f.${n}q`)}</span><span className="pm" aria-hidden="true">+</span></summary>
                <p>{t(`f.${n}a`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function SeccionCta({ tarifas = null, errorTarifas = '', onElegir = () => {}, ultima = null, completo = true, sinCabecera = false }) {
  const { t, T, lang, locale } = useLang();
  const eur = (n) => euros(n, locale);
  const setPedido = onElegir;
  return (
    <>
      {/* ============ CTA FINAL ============ */}
      <section className="band">
        <div className="wrap">
          <div className="cta-oscura flex flex-wrap items-center justify-between gap-8 rounded-2xl p-8 pb-24 sm:p-12 sm:pb-24">
            <svg className="cta-art" viewBox="0 0 1200 70" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <rect y="0" width="1200" height="70" fill="#1E3A8A" opacity=".35" />
              <path d="M0 36 H1200" stroke="#FFFFFF" strokeOpacity=".45" strokeWidth="3" strokeDasharray="30 22" />
              {[80, 260, 470, 690, 900, 1090].map((x, i) => <Coche key={x} x={x} y={6} w={26} h={50} color={COCHES[(i * 3) % COCHES.length]} giro={i % 2 ? -90 : 90} />)}
            </svg>
            <div className="relative flex min-w-0 items-center gap-6">
              <span className="sign hidden !h-20 !w-20 !rounded-2xl !text-5xl sm:grid" aria-hidden="true">P</span>
              <h2 className="display h-sec max-w-xl">{t('c.h')}</h2>
            </div>
            <Link to="/#reservar" className="btn btn-accent relative"><span>{t('c.b')}</span><Flecha /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

