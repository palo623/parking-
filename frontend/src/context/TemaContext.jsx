import { createContext, useContext, useEffect, useState } from 'react';
import { almacen } from '../utils.js';
import { consentimientoActual } from './CookiesContext.jsx';

const TemaContext = createContext(null);

function temaInicial() {
  const guardado = almacen.leer('tema');
  if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'oscuro' ? 'dark' : 'light';
    // Solo se recuerda si el usuario ha aceptado las cookies de preferencias
    if (consentimientoActual()?.preferencias) almacen.guardar('tema', tema);
  }, [tema]);

  const alternar = () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  return <TemaContext.Provider value={{ tema, alternar }}>{children}</TemaContext.Provider>;
}

export const useTema = () => useContext(TemaContext);
