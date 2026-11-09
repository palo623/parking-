import { useState } from 'react';

const Estrella = ({ llena, tam }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true">
    <polygon
      points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"
      fill={llena ? '#f59e0b' : 'none'}
      stroke={llena ? '#f59e0b' : 'var(--borde-fuerte)'}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

// Muestra una puntuación (admite medias como 4.5 redondeando)
export function Estrellas({ valor = 0, tam = 16 }) {
  const n = Math.round(valor);
  return (
    <span className="estrellas" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => <Estrella key={i} llena={i <= n} tam={tam} />)}
    </span>
  );
}

// Selector de 1 a 5 estrellas
export function ElegirEstrellas({ valor, onCambiar, tam = 34 }) {
  const [hover, setHover] = useState(0);
  const textos = ['', 'Muy mala', 'Mejorable', 'Correcta', 'Muy buena', '¡Excelente!'];
  const mostrado = hover || valor;
  return (
    <div className="elegir-estrellas">
      <div role="radiogroup" aria-label="Puntuación" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={valor === i}
            aria-label={`${i} estrellas`}
            onMouseEnter={() => setHover(i)}
            onClick={() => onCambiar(i)}
          >
            <Estrella llena={i <= mostrado} tam={tam} />
          </button>
        ))}
      </div>
      <span>{textos[mostrado] || 'Toca una estrella'}</span>
    </div>
  );
}
