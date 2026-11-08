import Icono from './Icono.jsx';

export default function Vacio({ icono = 'info', titulo, texto, children }) {
  return (
    <div className="vacio">
      <div className="vacio-icono"><Icono nombre={icono} tam={28} /></div>
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}

export function Cargando() {
  return (
    <div className="cargando-pagina"><span className="spinner" style={{ width: 28, height: 28 }} /></div>
  );
}
