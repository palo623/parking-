import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icono from '../components/Icono.jsx';
import { NEGOCIO, urlMapa } from '../config.js';

const ASUNTOS = ['Consulta general', 'Problema con una reserva', 'Facturación y cobros', 'Objetos perdidos', 'Abonos y empresas', 'Otro'];

export default function Contacto() {
  const { perfil, session } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    nombre: perfil?.nombre || '',
    email: perfil?.email || session?.user?.email || '',
    asunto: ASUNTOS[0],
    mensaje: '',
    web: '',
  });
  const [enviando, setEnviando] = useState(false);

  // Rellena nombre y email cuando se carga el perfil
  useEffect(() => {
    if (!perfil) return;
    setForm((f) => ({ ...f, nombre: f.nombre || perfil.nombre || '', email: f.email || perfil.email || '' }));
  }, [perfil]);
  const [enviado, setEnviado] = useState(false);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.contacto(form);
      setEnviado(true);
      toast.ok('Mensaje enviado. Te responderemos pronto.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const abrirChat = () => document.querySelector('.chat-boton:not(.abierto)')?.click();

  return (
    <div className="contenedor pagina">
      <div className="cabecera-pagina">
        <div>
          <span className="eyebrow">Contacto</span>
          <h1>¿En qué podemos ayudarte?</h1>
          <p>Respondemos en menos de 24 horas. Para dudas rápidas, prueba nuestro asistente.</p>
        </div>
      </div>

      <div className="contacto-grid">
        <div className="tarjeta">
          {enviado ? (
            <div className="vacio">
              <div className="vacio-icono"><Icono nombre="checkCirculo" tam={28} /></div>
              <h3>¡Mensaje recibido!</h3>
              <p>Gracias, {form.nombre.split(' ')[0]}. Te responderemos a <strong>{form.email}</strong> lo antes posible.</p>
              <button className="btn btn-sec" onClick={() => { setEnviado(false); setForm({ ...form, mensaje: '' }); }}>Enviar otro mensaje</button>
            </div>
          ) : (
            <form className="formulario" onSubmit={enviar}>
              <div className="fila">
                <label className="campo">Nombre<input name="nombre" value={form.nombre} onChange={cambiar} required maxLength={80} autoComplete="name" /></label>
                <label className="campo">Email<input name="email" type="email" value={form.email} onChange={cambiar} required maxLength={120} autoComplete="email" /></label>
              </div>
              <label className="campo">
                Asunto
                <select name="asunto" value={form.asunto} onChange={cambiar}>
                  {ASUNTOS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label className="campo">
                Mensaje
                <textarea name="mensaje" value={form.mensaje} onChange={cambiar} required minLength={5} maxLength={2000} rows={6} placeholder="Cuéntanos qué necesitas. Si es sobre una reserva, indica su número (#)." />
                <span className="campo-ayuda" style={{ textAlign: 'right' }}>{form.mensaje.length} / 2000</span>
              </label>
              {/* Campo trampa anti-spam: oculto para personas */}
              <input name="web" value={form.web} onChange={cambiar} tabIndex={-1} autoComplete="off" className="trampa" aria-hidden="true" />
              <button className="btn btn-grande" disabled={enviando}>
                {enviando ? <><span className="spinner" /> Enviando…</> : <>Enviar mensaje <Icono nombre="enviar" tam={17} /></>}
              </button>
            </form>
          )}
        </div>

        <aside className="contacto-lado">
          <button className="tarjeta contacto-chat" onClick={abrirChat}>
            <span className="chat-avatar"><Icono nombre="chat" tam={20} /></span>
            <div><strong>Habla con el asistente</strong><small>Respuesta inmediata, 24 h</small></div>
            <Icono nombre="flecha" />
          </button>
          <div className="tarjeta">
            <div className="dato-llegar"><Icono nombre="email" /><div><strong>Email</strong><a href={`mailto:${NEGOCIO.email}`}>{NEGOCIO.email}</a></div></div>
            <div className="dato-llegar"><Icono nombre="telefono" /><div><strong>Teléfono</strong><a href={`tel:${NEGOCIO.telefono.replace(/\s/g, '')}`}>{NEGOCIO.telefono}</a></div></div>
            <div className="dato-llegar"><Icono nombre="ubicacion" /><div><strong>{NEGOCIO.direccion}</strong><small>{NEGOCIO.ciudad}</small></div></div>
            <div className="dato-llegar"><Icono nombre="reloj" /><div><strong>Horario</strong><small>{NEGOCIO.horario}</small></div></div>
          </div>
          <div className="mapa-embebido pequeno">
            <iframe title="Mapa del parking" src={urlMapa(0.004)} loading="lazy" />
          </div>
        </aside>
      </div>
    </div>
  );
}
