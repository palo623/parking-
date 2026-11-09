import { useCookies } from '../context/CookiesContext.jsx';
import { NEGOCIO, urlMapa, urlComoLlegar } from '../config.js';
import Icono from './Icono.jsx';

// Mapa de OpenStreetMap que solo se carga si el usuario acepta contenido de terceros
export default function MapaOSM({ zoom, pequeno = false }) {
  const { permite, permitir } = useCookies();

  return (
    <div className={`mapa-embebido ${pequeno ? 'pequeno' : ''}`}>
      {permite('terceros') ? (
        <iframe title={`Mapa de ${NEGOCIO.direccion}, ${NEGOCIO.ciudad}`} src={urlMapa(zoom)} loading="lazy" />
      ) : (
        <div className="mapa-bloqueado">
          <Icono nombre="mapa" tam={34} />
          <strong>{NEGOCIO.direccion}, {NEGOCIO.ciudad}</strong>
          <p>El mapa lo ofrece OpenStreetMap, un servicio externo. Para verlo aquí necesitamos tu permiso.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-peq" onClick={() => permitir('terceros')}>Mostrar mapa</button>
            <a className="btn btn-sec btn-peq" href={urlComoLlegar()} target="_blank" rel="noreferrer">Abrir en OpenStreetMap</a>
          </div>
        </div>
      )}
    </div>
  );
}
