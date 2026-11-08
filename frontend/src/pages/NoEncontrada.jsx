import { Link } from 'react-router-dom';
import Vacio from '../components/Vacio.jsx';

export default function NoEncontrada() {
  return (
    <div className="contenedor pagina">
      <Vacio icono="mapa" titulo="Esta página no existe" texto="Parece que te has perdido por el parking. Volvamos a la entrada.">
        <Link to="/" className="btn">Ir al inicio</Link>
      </Vacio>
    </div>
  );
}
