import { useEffect, useRef, useState } from 'react';

// Hace aparecer su contenido con una animación suave al entrar en pantalla
export default function Revelar({ children, retraso = 0, className = '', as: Etiqueta = 'div', ...resto }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return setVisible(true);
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Etiqueta ref={ref} className={`revelar ${visible ? 'visible' : ''} ${className}`} style={{ transitionDelay: `${retraso}ms` }} {...resto}>
      {children}
    </Etiqueta>
  );
}
