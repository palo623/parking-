import { useEffect } from 'react';

export default function Modal({ abierto, titulo, children, onCerrar, acciones }) {
  useEffect(() => {
    if (!abierto) return;
    const tecla = (e) => e.key === 'Escape' && onCerrar?.();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <h3>{titulo}</h3>
        {children}
        {acciones && <div className="modal-acciones">{acciones}</div>}
      </div>
    </div>
  );
}

// Ventana de confirmación sencilla
export function Confirmar({ abierto, titulo, mensaje, textoBoton = 'Confirmar', peligro = false, cargando, onConfirmar, onCerrar }) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCerrar}
      acciones={
        <>
          <button className="btn btn-sec" onClick={onCerrar}>Volver</button>
          <button className={`btn ${peligro ? 'btn-peligro' : ''}`} onClick={onConfirmar} disabled={cargando}>
            {cargando && <span className="spinner" />} {textoBoton}
          </button>
        </>
      }
    >
      <p>{mensaje}</p>
    </Modal>
  );
}
