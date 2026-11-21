import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Logo, Matricula } from './Comunes.jsx';
import { METODOS_PAGO, nombreParking, zonaParking } from './Reserva.jsx';
import { TIPOS, euros } from '../utils.js';

// Justificante de una reserva, listo para imprimir o guardar como PDF
// (en el diálogo de imprimir del navegador, «Guardar como PDF»).
export default function Justificante({ reserva: r, onCerrar }) {
  const { perfil } = useAuth();
  const { T, lang, locale } = useLang();
  const caja = useRef(null);
  const eur = (n) => euros(n, locale);
  const f = (iso) => { const x = new Date(iso).toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); return x.charAt(0).toUpperCase() + x.slice(1); };

  useEffect(() => {
    caja.current?.focus();
    const esc = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', esc);
    document.body.classList.add('imprimiendo-justificante');
    return () => { document.removeEventListener('keydown', esc); document.body.classList.remove('imprimiendo-justificante'); };
  }, [onCerrar]);

  const tipo = r.plaza?.tipo && TIPOS[r.plaza.tipo] ? T(...TIPOS[r.plaza.tipo]) : '';
  const base = r.precio_base ?? Math.round((r.precio_total / 1.1) * 100) / 100;
  const gestion = r.gastos_gestion ?? Math.round((r.precio_total - base) * 100) / 100;
  const metodo = METODOS_PAGO.find((m) => m[0] === r.metodo_pago);

  // Se pinta directamente en <body> para quedar por encima de la cabecera
  return createPortal((
    <div className="modal-fondo" onClick={onCerrar}>
      <div ref={caja} tabIndex={-1} role="dialog" aria-modal="true" aria-label={T('Justificante de reserva', 'Justificant de reserva', 'Booking receipt')}
        className="modal justificante" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-line/10 pb-5">
          <div className="flex items-center gap-2.5"><Logo /></div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{T('Justificante de reserva', 'Justificant de reserva', 'Booking receipt')}</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-ink">{r.codigo}</p>
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-4 py-5 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">{T('Titular', 'Titular', 'Account holder')}</dt><dd className="font-bold text-ink">{perfil?.nombre || perfil?.email || '—'}</dd></div>
          <div><dt className="text-muted">{T('Matrícula', 'Matrícula', 'Plate')}</dt><dd><Matricula valor={r.matricula} className="mt-1 text-sm" /></dd></div>
          <div className="sm:col-span-2"><dt className="text-muted">Parking</dt><dd className="font-bold text-ink">{nombreParking(r.plaza?.parking, lang)} · {T('plaza', 'plaça', 'space')} {r.plaza?.codigo}{tipo && ` · ${tipo}`}</dd><dd className="text-muted">{zonaParking(r.plaza?.parking, lang)}, Tarragona</dd></div>
          <div><dt className="text-muted">{T('Entrada', 'Entrada', 'Entry')}</dt><dd className="font-bold text-ink">{f(r.inicio)}</dd></div>
          <div><dt className="text-muted">{T('Salida', 'Sortida', 'Exit')}</dt><dd className="font-bold text-ink">{f(r.fin)}</dd></div>
        </dl>

        <table className="w-full border-t border-line/10 text-sm">
          <tbody className="tnum">
            <tr><td className="py-2 text-muted">{T('Tarifa por horas', 'Tarifa per hores', 'Hourly rate')}</td><td className="py-2 text-right text-ink">{eur(base)}</td></tr>
            <tr><td className="py-2 text-muted">{T('Gastos de gestión (10 %)', 'Despeses de gestió (10 %)', 'Booking fee (10 %)')}</td><td className="py-2 text-right text-ink">{eur(gestion)}</td></tr>
            <tr className="border-t border-line/15"><td className="pt-3 font-bold text-ink">Total</td><td className="precio pt-3 text-right text-2xl text-ink">{eur(r.precio_total)}</td></tr>
            {metodo && <tr><td className="pt-2 text-muted">{T('Pagado con', 'Pagat amb', 'Paid with')}</td><td className="pt-2 text-right text-ink">{metodo[0] === 'tarjeta' ? T(...metodo[2]) : T(...metodo[1])}{r.pago_ref && <span className="block font-mono text-xs text-muted">{r.pago_ref}</span>}</td></tr>}
          </tbody>
        </table>

        <p className="mt-5 rounded-lg bg-sunken p-3 text-xs text-muted">
          {T('Enseña la matrícula, no este papel: la cámara la lee y abre la barrera. Documento sin valor fiscal · Proyecto académico.',
            'Ensenya la matrícula, no aquest paper: la càmera la llegeix i obre la barrera. Document sense valor fiscal · Projecte acadèmic.',
            'Show your plate, not this paper: the camera reads it and opens the barrier. Not a tax invoice · School project.')}
          {' '}{T('Emitido el', 'Emès el', 'Issued on')} {new Date().toLocaleDateString(locale)}.
        </p>

        <div className="no-imprimir mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onCerrar}>{T('Cerrar', 'Tancar', 'Close')}</button>
          <button type="button" className="btn btn-accent" onClick={() => window.print()}>
            <svg className="ico !h-5 !w-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="7" rx="1" /></svg>
            {T('Imprimir o guardar PDF', 'Imprimir o desar PDF', 'Print or save PDF')}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
