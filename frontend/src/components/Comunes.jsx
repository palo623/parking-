import { fmtMatricula } from '../utils.js';

// Matrícula europea (franja azul con la "E")
export function Matricula({ valor, className = '' }) {
  return (
    <span className={`plate ${className}`}>
      {/^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/.test(String(valor || '').toUpperCase().replace(/[^A-Z0-9]/g, '')) && <span className="eu" aria-hidden="true">E</span>}
      <span className="num">{fmtMatricula(valor) || '— — —'}</span>
    </span>
  );
}

// Flecha de los botones (se desplaza al pasar el ratón)
export function Flecha() {
  return (
    <svg className="arr h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

// Logo: señal "P" azul marino con franja roja + nombre
export function Logo({ claro = false }) {
  return (
    <>
      <span className="sign" aria-hidden="true">P</span>
      <span className={`display text-[1.35rem] leading-[1.05] text-ink`}>
        Tarraco<span className="block text-[.78em] font-bold tracking-[.14em] text-accent">PARKINGS</span>
      </span>
    </>
  );
}

// Iconos de línea (24×24). Dibujados a mano, sin librerías.
const ICONOS = {
  ticket: <><path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" /><path d="M4 4l16 16" /></>,
  efectivo: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M3 3l18 18" /></>,
  calma: <><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01" /></>,
  coche: <><path d="M5 16h14v-4l-2-5H7l-2 5z" /><path d="M5 12h14" /><circle cx="8" cy="16.5" r="1.5" /><circle cx="16" cy="16.5" r="1.5" /></>,
  rayo: <path d="M13 3L5 14h6l-1 7 8-11h-6z" />,
  moto: <><circle cx="6" cy="16" r="3" /><circle cx="18" cy="16" r="3" /><path d="M6 16l4-6h5l3 6M13 10l-1-3h-2" /></>,
  accesible: <><circle cx="11" cy="4.5" r="1.5" /><path d="M11 7v6h5l2 5M11 10h4" /><path d="M8 11.5A5 5 0 1 0 14.5 18" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  candado: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  tarjeta: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  escudo: <><path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  copia: <><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};
export function Icono({ nombre, className = '' }) {
  return <svg className={`ico ${className}`} viewBox="0 0 24 24" aria-hidden="true">{ICONOS[nombre]}</svg>;
}

// Cabecera de las páginas interiores
export function Cabecera({ eyebrow, titulo, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display h-sec mt-2">{titulo}</h1>
      </div>
      {children}
    </div>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return <p className="flex items-center gap-3 py-10 font-semibold text-muted"><span className="spinner !border-line/20 !border-t-ink" aria-hidden="true" />{texto}</p>;
}
