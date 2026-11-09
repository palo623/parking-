import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Icono from './Icono.jsx';

const BIENVENIDA = { rol: 'asistente', texto: '¡Hola! Soy **Aparca**, el asistente del parking. ¿En qué te puedo ayudar?' };
const SUGERENCIAS = ['¿Cómo reservo una plaza?', '¿Cuánto cuesta?', '¿Cómo cancelo una reserva?', 'Tengo un problema con mi reserva'];
const CLAVE = 'parking-chat';

function leerHistorial() {
  try {
    const h = JSON.parse(sessionStorage.getItem(CLAVE));
    return Array.isArray(h) && h.length ? h : [BIENVENIDA];
  } catch {
    return [BIENVENIDA];
  }
}

// Convierte **negrita** y listas con guiones en elementos React (sin HTML inseguro)
function Formato({ texto }) {
  const negritas = (linea) =>
    linea.split(/(\*\*[^*]+\*\*)/g).map((t, i) => (t.startsWith('**') && t.endsWith('**') ? <strong key={i}>{t.slice(2, -2)}</strong> : t));
  const lineas = texto.split('\n');
  const bloques = [];
  let lista = null;
  lineas.forEach((l, i) => {
    const item = l.match(/^\s*[-*•]\s+(.*)/) || l.match(/^\s*\d+[.)]\s+(.*)/);
    if (item) {
      lista ||= [];
      lista.push(<li key={i}>{negritas(item[1])}</li>);
    } else {
      if (lista) { bloques.push(<ul key={`u${i}`}>{lista}</ul>); lista = null; }
      if (l.trim()) bloques.push(<p key={i}>{negritas(l)}</p>);
    }
  });
  if (lista) bloques.push(<ul key="ufin">{lista}</ul>);
  return <>{bloques}</>;
}

export default function Chat() {
  const { session } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState(leerHistorial);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [activo, setActivo] = useState(true);
  const finRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { api.chatEstado().then((e) => setActivo(e.activo)).catch(() => setActivo(false)); }, []);

  useEffect(() => {
    try { sessionStorage.setItem(CLAVE, JSON.stringify(mensajes.slice(-30))); } catch { /* sin almacenamiento */ }
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, escribiendo, abierto]);

  useEffect(() => { if (abierto) setTimeout(() => inputRef.current?.focus(), 50); }, [abierto]);

  const enviar = async (contenido) => {
    const limpio = contenido.trim();
    if (!limpio || escribiendo) return;
    const nuevos = [...mensajes, { rol: 'usuario', texto: limpio }];
    setMensajes(nuevos);
    setTexto('');
    setEscribiendo(true);
    try {
      const { texto: respuesta } = await api.chat(nuevos.filter((m) => !m.error));
      setMensajes((m) => [...m, { rol: 'asistente', texto: respuesta }]);
    } catch (e) {
      setMensajes((m) => [...m, { rol: 'asistente', texto: e.message, error: true }]);
    } finally {
      setEscribiendo(false);
    }
  };

  const reiniciar = () => setMensajes([BIENVENIDA]);

  return (
    <>
      {abierto && (
        <section className="chat" aria-label="Asistente virtual">
          <header className="chat-cabecera">
            <div className="chat-avatar"><Icono nombre="chat" tam={20} /></div>
            <div style={{ flex: 1 }}>
              <strong>Aparca · Asistente</strong>
              <small>{activo ? <><span className="punto-verde" /> En línea · responde al instante</> : 'No disponible ahora mismo'}</small>
            </div>
            <button className="btn btn-ghost btn-icono" onClick={reiniciar} title="Nueva conversación" aria-label="Nueva conversación"><Icono nombre="recargar" tam={17} /></button>
            <button className="btn btn-ghost btn-icono" onClick={() => setAbierto(false)} aria-label="Cerrar asistente"><Icono nombre="cerrar" tam={18} /></button>
          </header>

          <div className="chat-mensajes" aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className={`burbuja ${m.rol} ${m.error ? 'error' : ''}`}>
                <Formato texto={m.texto} />
              </div>
            ))}
            {escribiendo && <div className="burbuja asistente escribiendo"><span /><span /><span /></div>}
            {mensajes.length === 1 && !escribiendo && (
              <div className="chat-sugerencias">
                {SUGERENCIAS.map((s) => <button key={s} className="chip" onClick={() => enviar(s)}>{s}</button>)}
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form className="chat-entrada" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={activo ? 'Escribe tu pregunta…' : 'El asistente no está configurado'}
              maxLength={1000}
              disabled={!activo}
              aria-label="Mensaje"
            />
            <button className="btn btn-icono" disabled={!texto.trim() || escribiendo || !activo} aria-label="Enviar"><Icono nombre="enviar" tam={18} /></button>
          </form>
          <p className="chat-aviso">
            Respuestas generadas con IA (Google Gemini); pueden contener errores. No compartas datos sensibles. <Link to="/privacidad">Privacidad</Link>. {!session && 'Entra en tu cuenta para que pueda consultar tus reservas.'}
          </p>
        </section>
      )}

      <button className={`chat-boton ${abierto ? 'abierto' : ''}`} onClick={() => setAbierto(!abierto)} aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}>
        <Icono nombre={abierto ? 'cerrar' : 'chat'} tam={26} />
      </button>
    </>
  );
}
