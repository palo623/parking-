// Iconos SVG propios (trazo, estilo lineal)
const RUTAS = {
  coche: <><path d="M3 13l2.2-5.2A2 2 0 0 1 7 6.6h10a2 2 0 0 1 1.8 1.2L21 13v4a1 1 0 0 1-1 1h-1.2a2.2 2.2 0 0 1-4.3 0H9.5a2.2 2.2 0 0 1-4.3 0H4a1 1 0 0 1-1-1z" /><path d="M3 13h18" /></>,
  moto: <><circle cx="5.5" cy="16.5" r="3" /><circle cx="18.5" cy="16.5" r="3" /><path d="M5.5 16.5L9 10h5l4.5 6.5M13 10l1.5-3H18" /></>,
  rayo: <polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />,
  accesible: <><circle cx="12" cy="4.5" r="2" /><path d="M9 9h6M12 9v5h4l2 5" /><path d="M8.5 12.5A5 5 0 1 0 15 19" /></>,
  reloj: <><circle cx="12" cy="12" r="9.5" /><polyline points="12 7 12 12 15.5 14" /></>,
  calendario: <><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></>,
  escudo: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>,
  ubicacion: <><path d="M20 10c0 6.5-8 12-8 12s-8-5.5-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  ticket: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5V10a2 2 0 0 0 0 4v2.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5V14a2 2 0 0 0 0-4z" /><path d="M14 5v14" strokeDasharray="2 2" /></>,
  usuario: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  usuarios: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  salir: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><path d="M21 12H9" /></>,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  luna: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  cerrar: <path d="M18 6L6 18M6 6l12 12" />,
  check: <polyline points="20 6 9 17 4 12" />,
  checkCirculo: <><circle cx="12" cy="12" r="9.5" /><polyline points="8 12 11 15 16 9" /></>,
  alerta: <><circle cx="12" cy="12" r="9.5" /><path d="M12 7.5v5M12 16.5h.01" /></>,
  info: <><circle cx="12" cy="12" r="9.5" /><path d="M12 11v5.5M12 7.5h.01" /></>,
  papelera: <><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" /></>,
  descargar: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><path d="M12 15V3" /></>,
  buscar: <><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.6-4.6" /></>,
  imprimir: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  euro: <><path d="M17.5 6.5A7 7 0 1 0 17.5 17.5" /><path d="M4 10h9M4 14h9" /></>,
  grafica: <path d="M18 20V10M12 20V4M6 20v-6" />,
  plantas: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  mas: <path d="M12 5v14M5 12h14" />,
  flecha: <><path d="M5 12h14" /><polyline points="12 5 19 12 12 19" /></>,
  flechaIzq: <><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></>,
  email: <><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 6 12 13 2 6" /></>,
  telefono: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  candado: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  editar: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  estrella: <polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />,
  chat: <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8z" /><path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" /></>,
  enviar: <><path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  recargar: <><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" /><path d="M3 21v-5h5" /></>,
  compartir: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></>,
  tren: <><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 11h14M9 21l-2-4M15 21l2-4M9 14h.01M15 14h.01" /></>,
  altura: <><path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" /></>,
  mas30: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
  bandeja: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z" /></>,
  ojo: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  ojoNo: <><path d="M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22" /></>,
  agenda: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h3M8 18h6" /></>,
  galleta: <><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5z" /><path d="M8.5 8.5h.01M16 15.5h.01M12 12h.01M11 17h.01M7 14h.01" /></>,
  mapa: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><path d="M8 2v16M16 6v16" /></>,
};

export default function Icono({ nombre, tam = 18, grosor = 2, className = '', ...resto }) {
  return (
    <svg
      className={`icono ${className}`}
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {RUTAS[nombre]}
    </svg>
  );
}
