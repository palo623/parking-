import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icono from '../components/Icono.jsx';
import Modal from '../components/Modal.jsx';

/*
 * Consentimiento de cookies y almacenamiento local.
 * - Necesarias: sesión de usuario y la propia elección de cookies (siempre activas).
 * - Preferencias: recordar el modo claro/oscuro.
 * - Terceros: mapa de OpenStreetMap incrustado.
 * Esta web no usa cookies de analítica ni de publicidad.
 */
const CLAVE = 'consentimiento-cookies';
const VERSION = 1;

function leer() {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE));
    return c?.version === VERSION ? c : null;
  } catch {
    return null;
  }
}

// Se puede consultar fuera de React (por ejemplo, antes de guardar el tema)
export const consentimientoActual = () => leer();

const CookiesContext = createContext(null);

export function CookiesProvider({ children }) {
  const [consentimiento, setConsentimiento] = useState(leer);
  const [panel, setPanel] = useState(false);
  const [borrador, setBorrador] = useState({ preferencias: true, terceros: true });
  const bannerRef = useRef(null);
  const bannerVisible = !consentimiento && !panel;

  // Sube el chat y el botón "arriba" por encima del aviso mientras se ve
  useEffect(() => {
    const raiz = document.documentElement;
    const el = bannerRef.current;
    if (!bannerVisible || !el) {
      raiz.style.setProperty('--alto-cookies', '0px');
      return;
    }
    const medir = () => raiz.style.setProperty('--alto-cookies', `${el.offsetHeight + 16}px`);
    medir();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    obs?.observe(el);
    return () => obs?.disconnect();
  }, [bannerVisible]);

  const guardar = (opciones) => {
    const c = { version: VERSION, fecha: new Date().toISOString(), preferencias: !!opciones.preferencias, terceros: !!opciones.terceros };
    try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch { /* sin almacenamiento */ }
    try {
      if (c.preferencias) localStorage.setItem('tema', document.documentElement.dataset.theme === 'dark' ? 'oscuro' : 'claro');
      else localStorage.removeItem('tema');
    } catch { /* sin almacenamiento */ }
    setConsentimiento(c);
    setPanel(false);
  };

  const abrirPanel = () => {
    setBorrador({ preferencias: consentimiento?.preferencias ?? true, terceros: consentimiento?.terceros ?? true });
    setPanel(true);
  };

  const valor = {
    consentimiento,
    permite: (tipo) => !!consentimiento?.[tipo],
    aceptarTodo: () => guardar({ preferencias: true, terceros: true }),
    soloNecesarias: () => guardar({ preferencias: false, terceros: false }),
    permitir: (tipo) => guardar({ ...(consentimiento || {}), [tipo]: true }),
    abrirPanel,
  };

  return (
    <CookiesContext.Provider value={valor}>
      {children}

      {bannerVisible && (
        <div ref={bannerRef} className="cookies-banner" role="dialog" aria-label="Aviso de cookies">
          <div className="cookies-texto">
            <span className="cookies-icono"><Icono nombre="galleta" tam={22} /></span>
            <p>
              Usamos almacenamiento local imprescindible para que puedas iniciar sesión y reservar. Con tu permiso, también
              recordamos tus preferencias y mostramos el mapa de OpenStreetMap. <strong>No usamos cookies de publicidad ni de analítica.</strong>{' '}
              <Link to="/cookies">Más información</Link>
            </p>
          </div>
          <div className="cookies-botones">
            <button className="btn btn-ghost" onClick={abrirPanel}>Configurar</button>
            <button className="btn btn-sec" onClick={valor.soloNecesarias}>Solo necesarias</button>
            <button className="btn" onClick={valor.aceptarTodo}>Aceptar todo</button>
          </div>
        </div>
      )}

      <Modal abierto={panel} titulo="Configuración de cookies" onCerrar={() => setPanel(false)}>
        <p>Elige qué permites. Puedes cambiarlo cuando quieras desde el enlace "Configurar cookies" del pie de página.</p>
        <div className="cookies-opciones">
          <div className="cookies-opcion">
            <div><strong>Necesarias</strong><small>Sesión de usuario, seguridad y guardar esta elección. Sin ellas la web no funciona.</small></div>
            <span className="badge">Siempre activas</span>
          </div>
          <label className="cookies-opcion">
            <div><strong>Preferencias</strong><small>Recordar si prefieres el modo claro u oscuro.</small></div>
            <input type="checkbox" className="interruptor" checked={borrador.preferencias} onChange={(e) => setBorrador({ ...borrador, preferencias: e.target.checked })} />
          </label>
          <label className="cookies-opcion">
            <div><strong>Contenido de terceros</strong><small>Mapa interactivo de OpenStreetMap en "Cómo llegar" y "Contacto".</small></div>
            <input type="checkbox" className="interruptor" checked={borrador.terceros} onChange={(e) => setBorrador({ ...borrador, terceros: e.target.checked })} />
          </label>
        </div>
        <div className="modal-acciones">
          <button className="btn btn-sec" onClick={valor.soloNecesarias}>Solo necesarias</button>
          <button className="btn" onClick={() => guardar(borrador)}>Guardar selección</button>
        </div>
      </Modal>
    </CookiesContext.Provider>
  );
}

export const useCookies = () => useContext(CookiesContext);
