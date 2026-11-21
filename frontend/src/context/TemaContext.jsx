import { createContext, useContext, useEffect, useState } from 'react';

// Tema de la web: claro (por defecto), oscuro o según el dispositivo.
// Se elige en «Mi cuenta → Preferencias» y se recuerda en este navegador.
const TemaContext = createContext(null);
const leer = () => { try { return localStorage.getItem('tp-tema') || 'claro'; } catch { return 'claro'; } };

export function TemaProvider({ children }) {
  const [tema, setTemaState] = useState(leer);

  useEffect(() => {
    const raiz = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const aplicar = () => { raiz.dataset.theme = tema === 'oscuro' || (tema === 'sistema' && mq.matches) ? 'dark' : 'light'; };
    aplicar();
    if (tema !== 'sistema') return undefined;
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, [tema]);

  const setTema = (t) => {
    setTemaState(t);
    try { localStorage.setItem('tp-tema', t); } catch { /* sin almacenamiento */ }
  };
  return <TemaContext.Provider value={{ tema, setTema }}>{children}</TemaContext.Provider>;
}

export const useTema = () => useContext(TemaContext);
