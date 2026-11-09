import { useEffect, useState } from 'react';
import Icono from './Icono.jsx';

export default function BotonArriba() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alHacerScroll = () => setVisible(window.scrollY > 700);
    window.addEventListener('scroll', alHacerScroll, { passive: true });
    return () => window.removeEventListener('scroll', alHacerScroll);
  }, []);

  return (
    <button
      className={`boton-arriba ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
    >
      <Icono nombre="flecha" tam={20} style={{ transform: 'rotate(-90deg)' }} />
    </button>
  );
}
