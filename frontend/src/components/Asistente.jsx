import { useEffect, useRef, useState } from 'react';
import { useLang } from '../context/LangContext.jsx';

// Instrucciones para el asistente (se usarán al conectar Gemini con la clave
// de Google AI Studio, que irá en el backend, nunca en el navegador).
export const INSTRUCCIONES_ASISTENTE = `Eres el asistente de Tarraco Parkings, un servicio de reserva de plazas
en tres parkings de Tarragona (Centro, Puerto y Estación).
Responde SOLO a dudas sobre: reservas, tarifas y precios, horarios, tipos de plaza,
la barrera con lectura de matrícula, cancelaciones, la cuenta del usuario y cómo llegar a los parkings.
Si te preguntan cualquier otra cosa, contesta con amabilidad que solo puedes ayudar con el parking.
No inventes precios ni plazas libres: usa solo los datos que te pase el servidor.
No pidas nunca contraseñas ni datos de tarjeta. Contesta en el idioma del usuario (castellano, catalán o inglés),
en frases cortas.`;

const SUGERENCIAS = [
  ['¿Cuánto cuesta aparcar 2 horas?', 'Quant costa aparcar 2 hores?', 'How much is 2 hours?'],
  ['¿Puedo cancelar mi reserva?', 'Puc cancel·lar la reserva?', 'Can I cancel my booking?'],
  ['¿Qué pasa si salgo más tarde?', 'Què passa si surto més tard?', 'What if I leave late?'],
];

// Botón flotante abajo a la derecha. De momento solo abre el panel:
// el chat se conectará más adelante.
export default function Asistente() {
  const { T } = useLang();
  const [abierto, setAbierto] = useState(false);
  const panel = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    panel.current?.focus();
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [abierto]);

  return (
    <div className="asistente">
      {abierto && (
        <section ref={panel} tabIndex={-1} className="asistente-panel panel-in" aria-label={T('Asistente', 'Assistent', 'Assistant')}>
          <header className="flex items-center gap-3 border-b border-line/10 p-4">
            <span className="asistente-avatar" aria-hidden="true">P</span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-extrabold text-ink">{T('Asistente Tarraco', 'Assistent Tarraco', 'Tarraco assistant')}</p>
              <p className="text-xs text-muted">{T('Solo dudas sobre el parking', 'Només dubtes sobre el pàrquing', 'Parking questions only')}</p>
            </div>
            <span className="tag tag-warn">{T('Pronto', 'Aviat', 'Soon')}</span>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-sunken" onClick={() => setAbierto(false)} aria-label={T('Cerrar', 'Tancar', 'Close')}>
              <svg className="ico !h-5 !w-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </header>
          <div className="grid gap-3 p-4">
            <p className="burbuja">{T('¡Hola! Soy el asistente de Tarraco Parkings. Te ayudaré con reservas, tarifas, la barrera y tu cuenta.', 'Hola! Sóc l\'assistent de Tarraco Parkings. T\'ajudaré amb reserves, tarifes, la barrera i el teu compte.', 'Hi! I\'m the Tarraco Parkings assistant. I\'ll help with bookings, prices, the barrier and your account.')}</p>
            <p className="burbuja">{T('Todavía no estoy conectado. Mientras tanto, tienes las respuestas en Ayuda.', 'Encara no estic connectat. Mentrestant, tens les respostes a Ajuda.', 'I\'m not connected yet. Meanwhile, the answers are in Help.')}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGERENCIAS.map((s) => <button key={s[0]} type="button" className="chip !min-h-[36px] text-sm" disabled>{T(...s)}</button>)}
            </div>
          </div>
          <form className="flex gap-2 border-t border-line/10 p-3" onSubmit={(e) => e.preventDefault()}>
            <input className="field !min-h-[44px]" disabled placeholder={T('Disponible pronto…', 'Disponible aviat…', 'Available soon…')} aria-label={T('Escribe tu pregunta', 'Escriu la teva pregunta', 'Type your question')} />
            <button type="submit" className="btn btn-accent !min-h-[44px] !px-4" disabled aria-label={T('Enviar', 'Enviar', 'Send')}>
              <svg className="ico !h-5 !w-5" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5z" /></svg>
            </button>
          </form>
        </section>
      )}
      <button type="button" className="asistente-fab" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}
        aria-label={abierto ? T('Cerrar el asistente', 'Tancar l\'assistent', 'Close assistant') : T('Abrir el asistente', 'Obrir l\'assistent', 'Open assistant')}>
        {abierto
          ? <svg className="ico !h-6 !w-6" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          : <svg className="ico !h-6 !w-6" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.6" /></svg>}
      </button>
    </div>
  );
}
