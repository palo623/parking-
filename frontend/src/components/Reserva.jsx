import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Flecha, Matricula } from './Comunes.jsx';
import { PAISES, TIPOS, aFecha, diaIso, euros, fechaCorta, fmtMatricula, hhmm, normMatricula, paisDe, validarMatricula } from '../utils.js';
import Justificante from './Justificante.jsx';

// Nombres de los parkings en catalán e inglés (en la base de datos están en castellano)
const PARKING_EN = {
  centro: ['Centre Car Park', 'Next to the Rambla Nova'],
  puerto: ['Port Car Park', 'Serrallo and port area'],
  estacion: ['Station Car Park', 'Right by the train station'],
};
export const PARKING_CA = {
  centro: ['Pàrquing Centre', 'A tocar de la Rambla Nova'],
  puerto: ['Pàrquing Port', 'Zona del Serrallo i el port'],
  estacion: ['Pàrquing Estació', "A peu de l'estació de tren"],
};
const traduccion = (p, lang) => (lang === 'ca' ? PARKING_CA : lang === 'en' ? PARKING_EN : {})[p?.slug];
export const nombreParking = (p, lang) => traduccion(p, lang)?.[0] || p?.nombre || '';
export const zonaParking = (p, lang) => traduccion(p, lang)?.[1] || p?.zona || '';

const DURACIONES = [60, 120, 180, 240, 360, 480, 720];
const BORRADOR = 'tp-borrador'; // reserva a medias mientras el usuario inicia sesión

// Franjas de entrada cada 30 min; si es hoy, solo las que quedan
function franjas(dia) {
  let inicio = 0;
  if (dia === diaIso(0)) {
    const n = new Date();
    inicio = Math.ceil((n.getHours() * 60 + n.getMinutes() + 5) / 30) * 30;
  }
  const out = [];
  for (let m = inicio; m <= 1410; m += 30) out.push(m);
  return out;
}

function leerBorrador() {
  try {
    const b = JSON.parse(sessionStorage.getItem(BORRADOR) || 'null');
    sessionStorage.removeItem(BORRADOR);
    return b && b.date >= diaIso(0) ? b : null;
  } catch { return null; }
}

export default function Reserva({ pedido, onReservada }) {
  const { session } = useAuth();
  const { t, T, lang, locale, avisar } = useLang();
  const navigate = useNavigate();
  const fecha = (iso) => fechaCorta(iso, locale);
  const eur = (n) => euros(n, locale);

  const borrador = useRef(leerBorrador()).current;
  const [step, setStep] = useState(borrador ? 2 : 1);
  const [day, setDay] = useState(borrador?.day || '0');
  const [date, setDate] = useState(borrador?.date || diaIso(0));
  const [otroDia, setOtroDia] = useState(borrador?.day === 'other' ? borrador.date : diaIso(2));
  const [tIn, setTIn] = useState(borrador?.tIn ?? 540);
  const [dur, setDur] = useState(borrador?.dur || 120);
  const [park, setPark] = useState(borrador?.park || null);
  const [tipo, setTipo] = useState(borrador?.tipo || 'normal');
  const [plate, setPlate] = useState(borrador?.plate || '');
  const [pais, setPais] = useState(borrador?.pais || 'ES');
  const [vehiculos, setVehiculos] = useState([]);
  const [verJustificante, setVerJustificante] = useState(false);
  const [terms, setTerms] = useState(Boolean(borrador));
  const [errores, setErrores] = useState({});
  const [paying, setPaying] = useState(false);
  const [last, setLast] = useState(null);

  // Disponibilidad leída del backend
  const [parkings, setParkings] = useState(null);
  const [cargaError, setCargaError] = useState('');
  const [reintento, setReintento] = useState(0);

  const caja = useRef(null);
  const plateRef = useRef(null);

  // Franjas válidas; si hoy ya no quedan, pasa a mañana
  const slots = useMemo(() => franjas(date), [date]);
  useEffect(() => {
    if (!slots.length) { setDay('1'); setDate(diaIso(1)); return; }
    if (!slots.includes(tIn)) setTIn(date === diaIso(0) ? slots[0] : (slots.includes(540) ? 540 : slots[0]));
  }, [slots, tIn, date]);

  const inicio = useMemo(() => aFecha(date, tIn), [date, tIn]);
  const fin = useMemo(() => new Date(inicio.getTime() + dur * 60000), [inicio, dur]);

  // Pide al backend las plazas libres y el precio de cada parking
  useEffect(() => {
    let vigente = true;
    setCargaError('');
    const id = setTimeout(() => {
      api.parkingsDisponibles(inicio.toISOString(), fin.toISOString(), tipo)
        .then((d) => { if (vigente) setParkings(d); })
        .catch((e) => { if (vigente) { setParkings((p) => p || []); setCargaError(e.message); } });
    }, 150);
    return () => { vigente = false; clearTimeout(id); };
  }, [inicio, fin, tipo, reintento]);

  const disponibles = (parkings || []).filter((p) => p.libres > 0);
  const elegido = parkings?.find((p) => p.slug === park) || null;
  useEffect(() => {
    if (park && parkings && !(elegido && elegido.libres > 0) && !paying && step === 1) setPark(null);
  }, [parkings, elegido, park, paying, step]);
  const minimo = disponibles.length > 1 ? Math.min(...disponibles.map((p) => p.precio_total)) : -1;

  const irA = useCallback((n, enfocar) => {
    setStep(n);
    if (enfocar) {
      caja.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      if (n === 2) setTimeout(() => plateRef.current?.focus({ preventScroll: true }), 350);
    }
  }, []);

  // Botones «Reservar» de las tarjetas y de la tabla de tarifas
  useEffect(() => {
    if (!pedido) return;
    setPark(pedido.slug || null);
    if (pedido.tipo) setTipo(pedido.tipo);
    setLast(null);
    irA(1, true);
  }, [pedido, irA]);

  const elegirDia = (d) => {
    setDay(d);
    setDate(d === 'other' ? otroDia : diaIso(Number(d)));
  };

  const continuar = () => {
    if (!elegido || elegido.libres === 0) return setErrores({ paso1: T('Elige un parking para continuar.', 'Tria un pàrquing per continuar.', 'Choose a car park to continue.') });
    setErrores({});
    irA(2, true);
  };

  const plateOk = () => validarMatricula(plate, pais);

  // Vehículos guardados en «Mi cuenta»: se ofrecen con un clic
  useEffect(() => {
    if (!session || step !== 2) return;
    api.vehiculos().then((vs) => {
      setVehiculos(vs);
      const principal = vs.find((v) => v.principal);
      if (principal) setPlate((p) => { if (p) return p; setPais(principal.pais || paisDe(principal.matricula)); return fmtMatricula(principal.matricula); });
    }).catch(() => setVehiculos([]));
  }, [session, step]);

  const pagar = async () => {
    if (paying) return;
    if (!plateOk()) {
      setErrores({ plate: pais === 'ES'
        ? T('Las matrículas españolas son 4 números y 3 letras sin vocales, por ejemplo 1234 BCD. Si es extranjera o antigua, elige «Otro país».', 'Les matrícules espanyoles són 4 números i 3 lletres sense vocals, per exemple 1234 BCD. Si és estrangera o antiga, tria «Un altre país».', 'Spanish plates are 4 numbers and 3 letters without vowels, e.g. 1234 BCD. If it is foreign or old, choose «Other country».')
        : T('Escribe entre 2 y 10 letras o números.', 'Escriu entre 2 i 10 lletres o números.', 'Enter 2 to 10 letters or numbers.') });
      return plateRef.current?.focus();
    }
    if (!terms) return setErrores({ terms: T('Acepta las condiciones para poder reservar.', 'Accepta les condicions per poder reservar.', 'Accept the terms to book.') });
    setErrores({});

    // Sin sesión: guardamos la reserva a medias y vamos a iniciar sesión
    if (!session) {
      try {
        sessionStorage.setItem(BORRADOR, JSON.stringify({ day, date, tIn, dur, park, tipo, plate, pais }));
      } catch { /* sin almacenamiento: tocará rellenarla otra vez */ }
      return navigate('/login', { state: { desde: '/#reservar' } });
    }

    setPaying(true);
    try {
      const r = await api.crearReserva({
        parking_id: elegido.id,
        tipo,
        matricula: normMatricula(plate),
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
      });
      setLast(r);
      onReservada?.(r);
      setReintento((n) => n + 1); // refresca plazas libres
      irA(3, true);
    } catch (e) {
      setErrores({ pago: e.message });
    } finally {
      setPaying(false);
    }
  };

  const copiar = () => {
    if (!last) return;
    navigator.clipboard?.writeText(last.codigo)
      .then(() => avisar(T('Código copiado', 'Codi copiat', 'Code copied')))
      .catch(() => avisar(T('No se ha podido copiar', "No s'ha pogut copiar", 'Could not copy')));
  };

  const nueva = () => { setPlate(''); setTerms(false); setLast(null); setPark(null); irA(1, true); };

  const fin2 = tIn + dur;
  const estadoPaso = (n) => (step === 3 || n < step ? 'done' : n === step ? 'current' : 'todo');
  const Paso = ({ n, texto }) => {
    const estado = estadoPaso(n);
    const contenido = <><span className="n">{estado === 'done' ? '✓' : n}</span><span>{texto}</span></>;
    if (n === 3) return <span className="step-tab" data-state={estado}>{contenido}</span>;
    return (
      <button type="button" className="step-tab" data-state={estado} aria-current={step === n ? 'step' : undefined}
        onClick={() => { if (step === 3 || paying) return; n === 1 ? irA(1) : continuar(); }}>
        {contenido}
      </button>
    );
  };

  return (
    <section id="reservar" ref={caja} className="min-w-0 scroll-mt-24" aria-labelledby="bookTitle">
      <h2 id="bookTitle" className="sr-only">{t('b.title')}</h2>
      {/* Pestañas del buscador (como Q-Park): de momento solo «por horas» */}
      <div className="search-tabs" role="tablist" aria-label={t('b.title')}>
        <button type="button" role="tab" className="search-tab" aria-selected="true">
          <svg className="ico !h-5 !w-5" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {T('Reservar por horas', 'Reservar per hores', 'Book by the hour')}
        </button>
        <button type="button" role="tab" className="search-tab" aria-selected="false" disabled>
          {T('Abono mensual', 'Abonament mensual', 'Monthly pass')}
          <span className="tag bg-accent text-on-accent">{T('Pronto', 'Aviat', 'Soon')}</span>
        </button>
      </div>
      <div className="booking has-tabs p-4 sm:p-6">
      <ol className="flex items-center justify-between gap-2 border-b-[1.5px] border-line/10 pb-3" aria-label="Pasos">
        <li><Paso n={1} texto={t('b.s1')} /></li>
        <li aria-hidden="true" className="h-0.5 flex-1 bg-line/15" />
        <li><Paso n={2} texto={t('b.s2')} /></li>
        <li aria-hidden="true" className="h-0.5 flex-1 bg-line/15" />
        <li><Paso n={3} texto={t('b.s3')} /></li>
      </ol>

      {/* Paso 1 · cuándo y dónde */}
      {step === 1 && (
        <div className="panel-in pt-5">
          <fieldset className="grid gap-3">
            <legend className="legend">{t('b.when')}</legend>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={T('Día', 'Dia', 'Day')}>
              {[['0', t('b.today')], ['1', t('b.tomorrow')], ['other', t('b.other')]].map(([d, txt]) => (
                <button key={d} type="button" className="chip chip-dia" aria-pressed={day === d} onClick={() => elegirDia(d)}>
                  <span>{txt}</span>
                  <span className="chip-sub">{d === 'other' ? (day === 'other' ? fechaCorta(date, locale).replace(/^\S+\s/, '') : T('elegir', 'triar', 'pick')) : fechaCorta(diaIso(Number(d)), locale).replace(/^\S+\s/, '')}</span>
                </button>
              ))}
              {day === 'other' && (
                <input type="date" className="field !w-auto" aria-label={T('Fecha', 'Data', 'Date')} min={diaIso(0)} value={otroDia}
                  onChange={(e) => { if (e.target.value) { setOtroDia(e.target.value); setDate(e.target.value); } }} />
              )}
            </div>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-muted">
                <span>{t('b.in')}</span>
                <select className="field tnum" value={tIn} onChange={(e) => setTIn(Number(e.target.value))}>
                  {slots.map((m) => <option key={m} value={m}>{hhmm(m)}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-muted">
                <span>{T('Tipo de plaza', 'Tipus de plaça', 'Space type')}</span>
                <select className="field" value={tipo} onChange={(e) => { setTipo(e.target.value); setPark(null); }}>
                  {Object.entries(TIPOS).map(([k, nombres]) => <option key={k} value={k}>{T(...nombres)}</option>)}
                </select>
              </label>
              <div className="grid gap-1 text-sm font-semibold text-muted sm:col-span-2">
                <span id="durLbl">{t('b.dur')}</span>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="durLbl">
                  {DURACIONES.map((d) => (
                    <button key={d} type="button" className="chip" aria-pressed={dur === d} onClick={() => setDur(d)}>{d / 60} h</button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-ink" aria-live="polite">
              {T(`${fecha(date)} · entras a las ${hhmm(tIn)} y sales a las ${hhmm(fin2)}${fin2 >= 1440 ? ' del día siguiente' : ''}`,
                `${fecha(date)} · entres a les ${hhmm(tIn)} i surts a les ${hhmm(fin2)}${fin2 >= 1440 ? " de l'endemà" : ''}`, `${fecha(date)} · in at ${hhmm(tIn)}, out at ${hhmm(fin2)}${fin2 >= 1440 ? ' the next day' : ''}`)}
            </p>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="legend">{t('b.where')}</legend>
            <div className="mt-3 grid gap-2.5" aria-busy={parkings === null}>
              {parkings === null && [0, 1, 2].map((i) => <div key={i} className="park h-[76px] animate-pulse !cursor-default bg-sunken" aria-hidden="true" />)}
              {parkings?.map((p) => {
                const ok = p.libres > 0;
                const sel = park === p.slug;
                const pct = p.total ? p.libres / p.total : 0;
                return (
                  <label key={p.id} className={`park ${sel ? 'is-sel' : ''} ${ok ? '' : 'is-off'}`}>
                    <input className="sr-only" type="radio" name="park" value={p.slug} checked={sel} disabled={!ok}
                      onChange={() => { setPark(p.slug); setErrores({}); }} />
                    <span className="radio row-span-2" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-lg font-bold leading-tight text-ink">{nombreParking(p, lang)}</span>
                      <span className="block text-sm text-muted">{zonaParking(p, lang)}</span>
                    </span>
                    <span className="tnum precio row-span-2 text-right text-xl text-ink">
                      {ok ? eur(p.precio_total) : '—'}
                      {ok && <span className="block font-sans text-xs font-semibold text-muted">{eur(p.precio_hora)}/h</span>}
                    </span>
                    <span className="col-start-2 flex flex-wrap gap-1.5">
                      {!ok ? <span className="tag tag-danger">{p.total === 0 ? T('Sin plazas de este tipo', 'Sense places d\'aquest tipus', 'No spaces of this type') : T('Completo en esa franja', 'Complet en aquesta franja', 'Full at that time')}</span>
                        : pct < 0.2 ? <span className="tag tag-warn">{(p.libres === 1 ? T('Queda 1 plaza', 'Queda 1 plaça', 'Only 1 space left') : T(`Quedan ${p.libres} plazas`, `Queden ${p.libres} places`, `Only ${p.libres} spaces left`))}</span>
                          : <span className="tag tag-ok">{(p.libres === 1 ? T('1 plaza libre', '1 plaça lliure', '1 space free') : T(`${p.libres} plazas libres`, `${p.libres} places lliures`, `${p.libres} spaces free`))}</span>}
                      {ok && p.precio_total === minimo && <span className="tag bg-accent text-on-accent">{T('Más barato', 'Més barat', 'Cheapest')}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            {cargaError && (
              <div className="note note-danger mt-3" role="alert">
                {cargaError}{' '}
                <button type="button" className="min-h-[44px] font-bold underline underline-offset-4" onClick={() => setReintento((n) => n + 1)}>
                  {T('Reintentar', 'Tornar-ho a provar', 'Try again')}
                </button>
              </div>
            )}
            {parkings && !cargaError && parkings.length > 0 && disponibles.length === 0 && (
              <p className="note note-warn mt-3">{T('No quedan plazas en ningún parking en ese horario. Prueba otra hora.', 'No queden places a cap pàrquing en aquest horari. Prova una altra hora.', 'No car park has free spaces at that time. Try another time.')}</p>
            )}
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t-[1.5px] border-line/10 pt-5">
            <div>
              <p className="text-sm font-semibold text-muted">{t('b.total')}</p>
              <p className="tnum precio text-3xl text-ink">{elegido?.precio_total != null ? eur(elegido.precio_total) : '—'}</p>
              <p className="tnum text-xs text-muted">
                {elegido?.precio_total != null
                  ? T(`${dur / 60} h × ${eur(elegido.precio_hora)} + ${eur(elegido.gastos_gestion)} de gestión`, `${dur / 60} h × ${eur(elegido.precio_hora)} + ${eur(elegido.gastos_gestion)} de gestió`, `${dur / 60} h × ${eur(elegido.precio_hora)} + ${eur(elegido.gastos_gestion)} booking fee`)
                  : T('Elige un parking', 'Tria un pàrquing', 'Choose a car park')}
              </p>
            </div>
            <button type="button" className="btn btn-accent max-sm:w-full" onClick={continuar}><span>{t('b.next')}</span><Flecha /></button>
          </div>
          {errores.paso1 && <p className="note note-danger mt-3" role="alert">{errores.paso1}</p>}
        </div>
      )}

      {/* Paso 2 · matrícula y confirmación */}
      {step === 2 && (
        <div className="panel-in pt-5">
          <label className="legend block" htmlFor="bPlate">{t('b.plate')}</label>
          <p className="mt-1 text-sm text-muted">{t('b.plateHelp')}</p>
          {vehiculos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={T('Tus vehículos', 'Els teus vehicles', 'Your vehicles')}>
              {vehiculos.map((v) => (
                <button key={v.id} type="button" className="chip !min-h-[40px] text-sm" aria-pressed={normMatricula(plate) === v.matricula}
                  onClick={() => { setPlate(fmtMatricula(v.matricula)); setPais(v.pais || paisDe(v.matricula)); setErrores({}); }}>
                  <span className="font-mono">{fmtMatricula(v.matricula)}</span>{v.alias && <span className="ml-1.5 font-normal opacity-75">· {v.alias}</span>}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="seg" role="group" aria-label={T('País de la matrícula', 'País de la matrícula', 'Plate country')}>
              {Object.entries(PAISES).map(([k, n]) => (
                <button key={k} type="button" aria-pressed={pais === k} onClick={() => { setPais(k); setErrores({}); }}>{T(...n)}</button>
              ))}
            </div>
          </div>
          <div className={`plate plate-input mt-3 ${pais === 'ES' ? '' : 'sin-eu'}`}>
            <span className="eu text-base" aria-hidden="true">{pais === 'ES' ? 'E' : '?'}</span>
            <input id="bPlate" ref={plateRef} type="text" autoComplete="off" autoCapitalize="characters" spellCheck="false" maxLength={pais === 'ES' ? 8 : 12}
              placeholder={pais === 'ES' ? '0000 BBB' : 'AB 123 CD'} aria-describedby="bErrPlate bAyudaPlate" value={plate}
              onChange={(e) => { setPlate(e.target.value.toUpperCase()); setErrores({}); }}
              onBlur={() => { if (plateOk() && pais === 'ES') setPlate(fmtMatricula(plate)); }} />
          </div>
          <p id="bAyudaPlate" className="mt-2 text-xs text-muted">{pais === 'ES'
            ? T('4 números y 3 letras (sin vocales, Ñ ni Q).', '4 números i 3 lletres (sense vocals, Ñ ni Q).', '4 numbers and 3 letters (no vowels, Ñ or Q).')
            : T('Matrícula extranjera o española antigua: de 2 a 10 letras y números.', 'Matrícula estrangera o espanyola antiga: de 2 a 10 lletres i números.', 'Foreign or old Spanish plate: 2 to 10 letters and numbers.')}</p>
          {errores.plate && <p id="bErrPlate" className="mt-2 text-sm font-semibold text-danger" role="alert">{errores.plate}</p>}

          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-2xl bg-sunken p-4 text-sm">
            {[
              ['Parking', nombreParking(elegido, lang)],
              [T('Plaza', 'Plaça', 'Space'), T(...TIPOS[tipo])],
              [T('Día', 'Dia', 'Day'), fecha(date)],
              [T('Horario', 'Horari', 'Time'), `${hhmm(tIn)} – ${hhmm(fin2)}`],
              ['Total', elegido ? eur(elegido.precio_total) : '—'],
            ].map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="tnum text-right font-bold text-ink">{v}</dd></div>
            ))}
          </dl>

          <label className="mt-5 flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--primary))]" checked={terms}
              onChange={(e) => { setTerms(e.target.checked); setErrores({}); }} />
            <span>{t('b.terms')}</span>
          </label>
          {errores.terms && <p className="mt-1 text-sm font-semibold text-danger" role="alert">{errores.terms}</p>}
          {!session && (
            <p className="note note-warn mt-3">{T('Para confirmar necesitas entrar en tu cuenta. Guardamos lo que has elegido.', 'Per confirmar has d\'entrar al teu compte. Desem el que has triat.', 'To confirm you need to sign in. We keep what you chose.')}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-line/10 pt-5">
            <button type="button" className="btn btn-ghost" onClick={() => { if (!paying) irA(1, true); }}>{t('b.back')}</button>
            <button type="button" className="btn btn-accent max-sm:flex-1" disabled={paying} onClick={pagar}>
              {paying ? <><span className="spinner" />{T('Guardando…', 'Desant…', 'Saving…')}</>
                : session ? `${T('Reservar', 'Reservar', 'Book')} · ${elegido ? eur(elegido.precio_total) : ''}`
                  : <><span>{T('Entrar y reservar', 'Entrar i reservar', 'Sign in and book')}</span><Flecha /></>}
            </button>
          </div>
          {errores.pago && <p className="note note-danger mt-3" role="alert">{errores.pago}</p>}
          <p className="mt-3 text-xs text-muted">{t('b.demo')}</p>
        </div>
      )}

      {/* Paso 3 · ticket */}
      {step === 3 && last && (
        <div className="panel-in pt-5">
          <p className="tag tag-ok text-sm">{t('b.ok')}</p>
          <h3 className="display mt-3 text-4xl leading-none">{t('b.okH')}</h3>
          <div className="mt-5 overflow-hidden rounded-2xl border-2 border-ink">
            <div className="bg-primary p-5 text-on-primary">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">{T('Código de reserva', 'Codi de reserva', 'Booking code')}</p>
              <p className="font-mono text-3xl font-bold tracking-widest">{last.codigo}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 bg-surface p-5 text-sm">
              <div className="col-span-2"><dt className="text-muted">Parking</dt><dd className="font-bold text-ink">{nombreParking(last.plaza?.parking, lang)} · {T('plaza', 'plaça', 'space')} {last.plaza?.codigo}</dd></div>
              <div><dt className="text-muted">{T('Día', 'Dia', 'Day')}</dt><dd className="font-bold text-ink">{new Date(last.inicio).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}</dd></div>
              <div><dt className="text-muted">{T('Horario', 'Horari', 'Time')}</dt><dd className="tnum font-bold text-ink">{new Date(last.inicio).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} – {new Date(last.fin).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</dd></div>
              <div><dt className="text-muted">{T('Matrícula', 'Matrícula', 'Plate')}</dt><dd><Matricula valor={last.matricula} className="mt-1 text-sm" /></dd></div>
              <div><dt className="text-muted">Total</dt><dd className="tnum precio text-xl text-ink">{eur(last.precio_total)}</dd></div>
            </dl>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn btn-accent" onClick={() => setVerJustificante(true)}>
              <svg className="ico !h-5 !w-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="7" rx="1" /></svg>
              {T('Justificante', 'Justificant', 'Receipt')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={copiar}>{t('b.copy')}</button>
            <Link to="/como-funciona#barrera" className="btn btn-ghost">{t('b.try')}</Link>
          </div>
          <button type="button" className="mt-4 min-h-[44px] font-semibold text-link underline underline-offset-4" onClick={nueva}>{t('b.new')}</button>
        </div>
      )}
      </div>
      {verJustificante && last && <Justificante reserva={last} onCerrar={() => setVerJustificante(false)} />}
    </section>
  );
}
