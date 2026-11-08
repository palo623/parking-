import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icono from '../components/Icono.jsx';
import Mapa from '../components/Mapa.jsx';
import CamposHorario from '../components/CamposHorario.jsx';
import Vacio from '../components/Vacio.jsx';
import { TIPOS, euros, planta, aInputLocal, proximaHora, duracion, fecha } from '../utils.js';

const MATRICULA_RE = /^[A-Z0-9-]{4,10}$/;

export default function Reservar() {
  const { session } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const desdeURL = (k, def) => (params.get(k) ? aInputLocal(new Date(params.get(k))) : def);
  const [horario, setHorario] = useState({
    inicio: desdeURL('inicio', aInputLocal(proximaHora(0))),
    fin: desdeURL('fin', aInputLocal(proximaHora(2))),
  });
  const [tipo, setTipo] = useState(params.get('tipo') || '');
  const [plazas, setPlazas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [seleccion, setSeleccion] = useState(null);

  const [vehiculos, setVehiculos] = useState([]);
  const [matricula, setMatricula] = useState('');
  const [guardarVehiculo, setGuardarVehiculo] = useState(true);
  const [reservando, setReservando] = useState(false);

  const iso = useMemo(() => ({
    inicio: new Date(horario.inicio).toISOString(),
    fin: new Date(horario.fin).toISOString(),
  }), [horario]);

  const horarioValido = new Date(horario.fin) > new Date(horario.inicio);

  const cargar = useCallback(async () => {
    if (!horarioValido) return;
    setCargando(true);
    setError('');
    try {
      const datos = await api.mapa(iso.inicio, iso.fin);
      setPlazas(datos);
      setSeleccion((s) => (s && datos.find((p) => p.id === s.id && p.libre)) || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [iso, horarioValido]);

  // Busca automáticamente al cambiar el horario (con un pequeño retardo)
  useEffect(() => {
    const t = setTimeout(cargar, 300);
    setParams({ inicio: iso.inicio, fin: iso.fin, ...(tipo ? { tipo } : {}) }, { replace: true });
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargar, tipo]);

  useEffect(() => {
    if (!session) return;
    api.vehiculos().then((v) => {
      setVehiculos(v);
      if (v.length) setMatricula((m) => m || v[0].matricula);
    }).catch(() => {});
  }, [session]);

  const libres = plazas?.filter((p) => p.libre && (!tipo || p.tipo === tipo)) || [];
  const matriculaNorm = matricula.toUpperCase().replace(/\s+/g, '');
  const matriculaValida = MATRICULA_RE.test(matriculaNorm);
  const esNueva = matriculaValida && !vehiculos.some((v) => v.matricula === matriculaNorm);

  const elegirMejor = () => {
    const mejor = [...libres].sort((a, b) => a.precio_estimado - b.precio_estimado)[0];
    if (mejor) setSeleccion(mejor);
  };

  const reservar = async (e) => {
    e.preventDefault();
    if (!matriculaValida) return toast.error('Escribe una matrícula válida (por ejemplo 1234ABC)');
    setReservando(true);
    try {
      const reserva = await api.crearReserva({ plaza_id: seleccion.id, matricula: matriculaNorm, ...iso });
      if (esNueva && guardarVehiculo) api.crearVehiculo({ matricula: matriculaNorm }).catch(() => {});
      toast.ok(`¡Reserva confirmada! Plaza ${reserva.plaza?.codigo}`);
      navigate(`/reserva/${reserva.id}?nueva=1`);
    } catch (err) {
      toast.error(err.message);
      cargar();
    } finally {
      setReservando(false);
    }
  };

  return (
    <div className="contenedor pagina">
      <div className="cabecera-pagina">
        <div>
          <h1>Reserva tu plaza</h1>
          <p>Elige el horario y toca una plaza verde en el mapa.</p>
        </div>
      </div>

      <div className="tarjeta" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CamposHorario inicio={horario.inicio} fin={horario.fin} onCambiar={setHorario} />
        <div className="chips" aria-label="Tipo de plaza">
          <button type="button" className={`chip ${!tipo ? 'activo' : ''}`} onClick={() => setTipo('')}>Todas</button>
          {Object.entries(TIPOS).map(([k, t]) => (
            <button key={k} type="button" className={`chip ${tipo === k ? 'activo' : ''}`} onClick={() => setTipo(k)}>
              <Icono nombre={t.icono} tam={15} /> {t.nombre}
            </button>
          ))}
        </div>
      </div>

      {!horarioValido && <div className="alerta alerta-error" style={{ marginTop: 16 }}><Icono nombre="alerta" /> La salida debe ser posterior a la entrada.</div>}
      {error && <div className="alerta alerta-error" style={{ marginTop: 16 }}><Icono nombre="alerta" /> {error}</div>}

      <div className="reservar-layout">
        <div className="tarjeta">
          <div className="tarjeta-titulo">
            <h3>{plazas ? `${libres.length} plazas libres` : 'Cargando plazas…'} {cargando && <span className="spinner" style={{ marginLeft: 8 }} />}</h3>
            {libres.length > 0 && <button className="btn btn-sec btn-peq" onClick={elegirMejor}><Icono nombre="estrella" tam={15} /> Elegir la más barata</button>}
          </div>
          {!plazas && !error && <div className="skeleton" style={{ height: 320 }} />}
          {plazas && plazas.length === 0 && <Vacio icono="mapa" titulo="No hay plazas" texto="Todavía no hay plazas dadas de alta en el parking." />}
          {plazas && plazas.length > 0 && (
            <Mapa plazas={plazas} seleccionada={seleccion?.id} onSeleccionar={setSeleccion} filtroTipo={tipo} />
          )}
        </div>

        <aside className="tarjeta panel-reserva">
          {!seleccion ? (
            <div className="panel-vacio">
              <div className="vacio-icono"><Icono nombre="mapa" tam={28} /></div>
              <h3>Elige una plaza</h3>
              <p style={{ margin: 0 }}>Toca una plaza verde en el mapa para ver el precio y reservarla.</p>
            </div>
          ) : (
            <form className="formulario" onSubmit={reservar}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="reserva-plaza">{seleccion.codigo}<small>{TIPOS[seleccion.tipo]?.nombre}</small></div>
                <div>
                  <h3>Plaza {seleccion.codigo}</h3>
                  <small>{planta(seleccion.planta)} · {euros(seleccion.precio_hora)}/h</small>
                </div>
              </div>

              <div>
                <div className="resumen-linea"><span>Entrada</span><strong>{fecha(iso.inicio)}</strong></div>
                <div className="resumen-linea"><span>Salida</span><strong>{fecha(iso.fin)}</strong></div>
                <div className="resumen-linea"><span>Duración</span><strong>{duracion(iso.inicio, iso.fin)}</strong></div>
              </div>

              {session ? (
                <>
                  <label className="campo">
                    Matrícula del vehículo
                    <input value={matricula} onChange={(e) => setMatricula(e.target.value.toUpperCase())} placeholder="1234ABC" maxLength={10} required />
                  </label>
                  {vehiculos.length > 0 && (
                    <div className="vehiculos-rapidos">
                      {vehiculos.map((v) => (
                        <button key={v.id} type="button" className={`chip ${matriculaNorm === v.matricula ? 'activo' : ''}`} onClick={() => setMatricula(v.matricula)}>
                          <Icono nombre="coche" tam={14} /> {v.alias || v.matricula}
                        </button>
                      ))}
                    </div>
                  )}
                  {esNueva && (
                    <label className="check">
                      <input type="checkbox" checked={guardarVehiculo} onChange={(e) => setGuardarVehiculo(e.target.checked)} />
                      Guardar este vehículo para la próxima vez
                    </label>
                  )}
                </>
              ) : null}

              <div className="resumen-total">
                <span className="texto-2">Total</span>
                <strong>{euros(seleccion.precio_estimado)}</strong>
              </div>

              {session ? (
                <button className="btn btn-grande btn-bloque" disabled={reservando}>
                  {reservando ? <><span className="spinner" /> Reservando…</> : <>Confirmar reserva <Icono nombre="check" /></>}
                </button>
              ) : (
                <Link className="btn btn-grande btn-bloque" to="/login" state={{ desde: location.pathname + location.search }}>
                  Entra para reservar <Icono nombre="flecha" />
                </Link>
              )}
              <small className="centro">Cancelación gratuita hasta la hora de entrada</small>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
