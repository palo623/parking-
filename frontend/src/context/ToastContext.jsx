import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Icono from '../components/Icono.jsx';

const ToastContext = createContext(null);
let siguienteId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const quitar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const mostrar = useCallback((mensaje, tipo = 'info', ms = 4000) => {
    const id = siguienteId++;
    setToasts((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => quitar(id), ms);
  }, [quitar]);

  const toast = useMemo(() => ({
    ok: (m) => mostrar(m, 'ok'),
    error: (m) => mostrar(m, 'error', 6000),
    info: (m) => mostrar(m, 'info'),
  }), [mostrar]);

  const iconos = { ok: 'checkCirculo', error: 'alerta', info: 'info' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            <Icono nombre={iconos[t.tipo]} tam={20} />
            <span style={{ flex: 1 }}>{t.mensaje}</span>
            <button className="btn btn-ghost btn-icono" onClick={() => quitar(t.id)} aria-label="Cerrar aviso">
              <Icono nombre="cerrar" tam={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
