import { useEffect, useState } from 'react';
import { useLang } from '../context/LangContext.jsx';

// Aviso de cookies con dos opciones: «Solo necesarias» o «Aceptar todas».
// Hoy la web solo usa cookies técnicas (la sesión), así que las dos opciones
// funcionan igual; se guarda la elección para no volver a preguntar y para
// respetarla cuando se añada analítica (solo con «todas»).
const CLAVE = 'tp-cookies';
export const leerCookies = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };

export default function CookieBanner() {
  const { T } = useLang();
  const [visible, setVisible] = useState(() => !leerCookies());

  // El enlace «Cookies» del pie vuelve a abrir el aviso
  useEffect(() => {
    const abrir = () => setVisible(true);
    window.addEventListener('tp-cookies', abrir);
    return () => window.removeEventListener('tp-cookies', abrir);
  }, []);

  const elegir = (valor) => {
    try { localStorage.setItem(CLAVE, valor); } catch { /* sin almacenamiento */ }
    setVisible(false);
  };
  if (!visible) return null;

  return (
    <div className="cookie-bar panel-in p-4 sm:p-5" role="region" aria-label="Cookies">
      <p className="text-sm text-ink">
        <span className="mr-1 font-bold">{T('Cookies.', 'Galetes.', 'Cookies.')}</span>
        {T('Usamos cookies necesarias para que la web funcione (por ejemplo, mantener tu sesión). Con tu permiso, en el futuro usaremos también cookies de análisis para mejorarla.',
          "Fem servir galetes necessàries perquè la web funcioni (per exemple, mantenir la sessió). Amb el teu permís, en el futur també farem servir galetes d'anàlisi per millorar-la.",
          'We use necessary cookies so the site works (for example, to keep you signed in). With your permission, we will also use analytics cookies in the future to improve it.')}
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn btn-ghost !min-h-[44px] !px-4 !text-sm max-sm:flex-1" onClick={() => elegir('necesarias')}>
          {T('Solo necesarias', 'Només necessàries', 'Necessary only')}
        </button>
        <button type="button" className="btn btn-accent !min-h-[44px] !px-4 !text-sm max-sm:flex-1" onClick={() => elegir('todas')}>
          {T('Aceptar todas', 'Acceptar-les totes', 'Accept all')}
        </button>
      </div>
    </div>
  );
}
