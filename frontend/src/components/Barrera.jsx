import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { euros, fmtMatricula, hora, normMatricula } from '../utils.js';

// Simulador de la barrera conectado al backend:
// cada «Entrar» / «Salir» se comprueba contra tus reservas y se guarda en la tabla accesos.
const HUD = {
  idle: ['En espera', 'En espera', 'Waiting'], read: ['Leyendo…', 'Llegint…', 'Reading…'], ok: ['Reserva activa', 'Reserva activa', 'Booking found'],
  no: ['Sin reserva', 'Sense reserva', 'No booking'], soon: ['Aún no', 'Encara no', 'Not yet'], in: ['Ya está dentro', 'Ja és a dins', 'Already inside'],
  bye: ['¡Buen viaje!', 'Bon viatge!', 'Safe travels!'], noin: ['Sin entrada', 'Sense entrada', 'No entry'], err: ['Error', 'Error', 'Error'],
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Barrera({ matricula, version }) {
  const { session } = useAuth();
  const { t, T, locale } = useLang();
  const [plate, setPlate] = useState('');
  const [hud, setHud] = useState('idle');
  const [hudPlate, setHudPlate] = useState('— — —');
  const [log, setLog] = useState(null); // [es, ca, en]
  const [busy, setBusy] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [scan, setScan] = useState(false);
  const [abierta, setAbierta] = useState(false);

  const escena = useRef(null), coche = useRef(null), poste = useRef(null), brazo = useRef(null);
  const carX = useRef(-160);
  const reducir = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => { if (matricula) setPlate(fmtMatricula(matricula)); }, [matricula]);

  // Matrículas de tus reservas vigentes, para probar con un clic
  useEffect(() => {
    if (!session) { setSugerencias([]); return; }
    api.misReservas().then((rs) => {
      const ahora = Date.now();
      const vigentes = rs.filter((r) => r.estado === 'confirmada' && new Date(r.fin) > ahora);
      const unicas = [...new Set(vigentes.map((r) => fmtMatricula(r.matricula)))].slice(0, 2);
      setSugerencias(unicas);
      setPlate((p) => p || unicas[0] || '');
    }).catch(() => setSugerencias([]));
  }, [session, version]);

  const mover = useCallback(async (x, ms, el = coche.current) => {
    el.classList.add('moving');
    const a = el.animate([{ transform: `translateX(${carX.current}px)` }, { transform: `translateX(${x}px)` }],
      { duration: reducir ? 1 : ms, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' });
    await a.finished;
    carX.current = x;
    el.style.transform = `translateX(${x}px)`;
    a.cancel();
    el.classList.remove('moving');
  }, [reducir]);

  const ciclo = async (tipo) => {
    const n = normMatricula(plate);
    if (!n) return setLog(['Escribe una matrícula.', 'Escriu una matrícula.', 'Enter a plate.']);
    if (busy) return;
    setBusy(true);
    const pl = fmtMatricula(n);
    const inicio = -coche.current.offsetWidth - 40;
    const parada = Math.max(4, poste.current.offsetLeft - brazo.current.offsetWidth - coche.current.offsetWidth - 10);
    carX.current = inicio;
    coche.current.style.transform = `translateX(${inicio}px)`;
    setHudPlate('· · ·');
    setHud('read');

    // La consulta al servidor va en paralelo con la animación
    const consulta = api.barrera(n, tipo).then((r) => ({ r }), (e) => ({ e }));
    await mover(parada, 1000);
    setScan(true);
    await espera(reducir ? 50 : 900);
    setScan(false);
    setHudPlate(pl);
    const { r, e } = await consulta;

    let abrir = false;
    if (e) { setHud('err'); setLog([e.message]); }
    else if (tipo === 'entrada') {
      if (r.permitido) { abrir = true; setHud('ok'); setLog([`${pl}: reserva ${r.reserva.codigo} encontrada. Barrera abierta.`, `${pl}: reserva ${r.reserva.codigo} trobada. Barrera oberta.`, `${pl}: booking ${r.reserva.codigo} found. Barrier open.`]); }
      else if (r.motivo === 'dentro') { setHud('in'); setLog([`${pl} ya está dentro del parking.`, `${pl} ja és dins del pàrquing.`, `${pl} is already inside the car park.`]); }
      else if (r.motivo === 'pronto') {
        const h = hora(r.reserva.inicio, locale);
        setHud('soon');
        setLog([`${pl}: tu reserva ${r.reserva.codigo} empieza a las ${h}. Puedes entrar desde 15 min antes.`, `${pl}: la teva reserva ${r.reserva.codigo} comença a les ${h}. Pots entrar des de 15 min abans.`, `${pl}: your booking ${r.reserva.codigo} starts at ${h}. You can enter from 15 min before.`]);
      } else { setHud('no'); setLog([`${pl} no tiene ninguna reserva activa ahora. La barrera no se abre.`, `${pl} no té cap reserva activa ara. La barrera no s'obre.`, `${pl} has no active booking right now. The barrier stays closed.`]); }
    } else if (r.permitido) {
      abrir = true; setHud('bye');
      if (r.minutos_exceso > 0) {
        const imp = euros(r.importe_extra, locale);
        setLog([`${pl}: salida con ${r.minutos_exceso} min de más. Se cobran ${imp} extra.`, `${pl}: sortida amb ${r.minutos_exceso} min de més. Es cobren ${imp} extra.`, `${pl}: left ${r.minutos_exceso} min late. ${imp} extra is charged.`]);
      } else setLog([`${pl}: salida a tiempo. Sin cargos extra.`, `${pl}: sortida a temps. Sense càrrecs extra.`, `${pl}: left on time. No extra charge.`]);
    } else { setHud('noin'); setLog([`${pl} no consta dentro del parking. Pulsa primero «Entrar».`, `${pl} no consta dins del pàrquing. Prem primer «Entrar».`, `${pl} is not inside the car park. Press «Enter» first.`]); }

    if (abrir) {
      setAbierta(true);
      await espera(reducir ? 50 : 750);
      await mover(escena.current.clientWidth + 40, 1200);
      setAbierta(false);
    } else {
      await espera(800);
      await mover(inicio, 1000);
    }
    setBusy(false);
  };

  return (
    <div className="tile min-w-0 p-4 hover:!transform-none hover:!shadow-none sm:p-5">
      <div ref={escena} className={`scene ${scan ? 'scanning' : ''}`}>
        <div className="hud">
          <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">{t('g.cam')}</p>
          <div className="plate mt-1 text-lg"><span className="eu" aria-hidden="true">E</span><span className="num">{hudPlate}</span></div>
          <p className="mt-1 text-xs font-bold">{T(...HUD[hud])}</p>
        </div>
        <div className="road" />
        <div ref={poste} className="pole">
          <div className="cam" /><div className="beam" />
          <div ref={brazo} className={`arm ${abierta ? 'open' : ''}`} />
          <span className={`lamp ${abierta ? 'go' : ''}`} />
        </div>
        <div ref={coche} className="car" style={{ transform: 'translateX(-160px)' }}>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2"><span className="plate text-[10px]"><span className="num">{fmtMatricula(plate) || '—'}</span></span></div>
          <div className="cabin" /><div className="bodywork" /><div className="lampf" />
          <div className="wheel" style={{ left: 14 }} /><div className="wheel" style={{ right: 14 }} />
        </div>
      </div>

      {session ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1 text-sm font-semibold text-muted">
              <span>{t('g.plate')}</span>
              <input className="field font-mono uppercase tracking-widest" maxLength={10} autoComplete="off" spellCheck="false"
                value={plate} placeholder="0000 BBB" onChange={(e) => setPlate(e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => ciclo('entrada')}>{t('g.in')}</button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => ciclo('salida')}>{t('g.out')}</button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted">{T('Prueba con:', 'Prova amb:', 'Try with:')}</span>
            {[...sugerencias.map((m) => [m, true]), ['9999 ZZZ', false]].map(([m, ok]) => (
              <button key={m} type="button" className="chip font-mono text-sm" onClick={() => setPlate(m)}>
                {m}<span className={`ml-2 font-sans text-xs font-bold ${ok ? 'text-ok' : 'text-danger'}`}>{ok ? T('tu reserva', 'la teva reserva', 'your booking') : T('sin reserva', 'sense reserva', 'no booking')}</span>
              </button>
            ))}
          </div>
          <p className="log mt-3 min-h-[52px] p-3 text-sm font-semibold text-ink" aria-live="polite">
            {log ? T(...log) : t('g.log')}
          </p>
        </>
      ) : (
        <div className="log mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm font-semibold text-ink">{T('Entra en tu cuenta para probar la barrera con tus reservas.', 'Entra al teu compte per provar la barrera amb les teves reserves.', 'Sign in to try the barrier with your bookings.')}</p>
          <Link to="/login" state={{ desde: '/#barrera' }} className="btn btn-primary">{t('n.login')}</Link>
        </div>
      )}
    </div>
  );
}
