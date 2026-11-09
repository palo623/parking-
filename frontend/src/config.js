// =====================================================================
//  Datos del negocio: cámbialos aquí y se actualizan en toda la web
// =====================================================================
export const NEGOCIO = {
  nombre: 'Parking',
  eslogan: 'Reserva tu plaza en segundos',
  direccion: 'Rambla Nova',
  ciudad: '43001 Tarragona',
  telefono: '+34 977 000 000',
  email: 'hola@parking.es',
  horario: 'Abierto 24 h, los 365 días',
  alturaMaxima: '2,10 m',
  // Coordenadas para el mapa (búscalas en openstreetmap.org → clic derecho → "Mostrar dirección")
  lat: 41.1167,
  lon: 1.2499,
  transporte: [
    { icono: 'tren', texto: 'Estación de tren de Tarragona (Renfe) a menos de 15 min a pie' },
    { icono: 'ubicacion', texto: 'En pleno centro, junto a la Rambla Nova' },
    { icono: 'ubicacion', texto: 'A un paseo del Balcó del Mediterrani y la Part Alta' },
  ],
};

export const urlMapa = (zoom = 0.006) => {
  const { lat, lon } = NEGOCIO;
  const bbox = [lon - zoom, lat - zoom / 2, lon + zoom, lat + zoom / 2].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
};

export const urlComoLlegar = () =>
  `https://www.openstreetmap.org/directions?route=%3B${NEGOCIO.lat}%2C${NEGOCIO.lon}#map=16/${NEGOCIO.lat}/${NEGOCIO.lon}`;

// =====================================================================
//  Datos legales (aparecen en el aviso legal y la política de privacidad)
//  ⚠ Sustituye los valores entre corchetes por los reales de tu empresa
// =====================================================================
export const LEGAL = {
  titular: '[Nombre de la empresa, S.L.]',
  nif: '[B00000000]',
  domicilio: 'Rambla Nova, 43001 Tarragona',
  registro: '[Registro Mercantil de Tarragona, tomo X, folio X, hoja T-XXXXX]',
  emailPrivacidad: 'privacidad@parking.es',
  ultimaActualizacion: '8 de noviembre de 2026',
};
