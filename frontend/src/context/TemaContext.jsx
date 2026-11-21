import { createContext, useContext, useEffect, useState } from 'react';

// Tema de la web: claro (por defecto) u oscuro.
// Se elige en «Mi cuenta → Preferencias» y se recuerda en este navegador.
const TemaContext = createContext(null);
const valido = (t) => (t === 'oscuro' ? 'oscuro' : 'claro');
const leer = () => { try { return valido(localStorage.getItem('tp-tema')); } catch { return 'claro'; } };

export function TemaProvider({ children }) {
  const [tema, setTemaState] = useState(leer);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'oscuro' ? 'dark' : 'light';
  }, [tema]);

  const setTema = (t) => {
    const v = valido(t);
    setTemaState(v);
    try { localStorage.setItem('tp-tema', v); } catch { /* sin almacenamiento */ }
  };
  return <TemaContext.Provider value={{ tema, setTema }}>{children}</TemaContext.Provider>;
}

export const useTema = () => useContext(TemaContext);
