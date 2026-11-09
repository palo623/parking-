import { Link, NavLink, useLocation } from 'react-router-dom';
import { NEGOCIO, LEGAL } from '../config.js';
import { useCookies } from '../context/CookiesContext.jsx';
import Icono from '../components/Icono.jsx';

const DOMINIO = typeof window !== 'undefined' ? window.location.host : 'esta web';

function AvisoLegal() {
  return (
    <>
      <h2>1. Datos identificativos</h2>
      <p>
        En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa
        de que el titular de {DOMINIO} es:
      </p>
      <ul>
        <li><strong>Titular:</strong> {LEGAL.titular}</li>
        <li><strong>NIF:</strong> {LEGAL.nif}</li>
        <li><strong>Domicilio:</strong> {LEGAL.domicilio}</li>
        <li><strong>Datos registrales:</strong> {LEGAL.registro}</li>
        <li><strong>Email:</strong> {NEGOCIO.email} · <strong>Teléfono:</strong> {NEGOCIO.telefono}</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>Esta web permite consultar la disponibilidad del aparcamiento situado en {NEGOCIO.direccion}, {NEGOCIO.ciudad}, reservar plazas y gestionar las reservas.</p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El acceso a la web es gratuito. El usuario se compromete a hacer un uso adecuado de los contenidos y servicios, a no emplearlos para
        actividades ilícitas y a no introducir datos falsos o de terceros sin su autorización. La reserva de plazas se rige por las{' '}
        <Link to="/terminos">condiciones de reserva</Link>.
      </p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Los textos, diseños, logotipos y código de esta web pertenecen al titular o se usan con licencia. Queda prohibida su reproducción o
        distribución sin autorización. Los mapas proceden de OpenStreetMap (© colaboradores de OpenStreetMap, licencia ODbL).
      </p>

      <h2>5. Responsabilidad</h2>
      <p>
        El titular procura que la información de la web sea correcta y esté actualizada, pero no garantiza la ausencia de errores ni la
        disponibilidad ininterrumpida del servicio. Las respuestas del asistente virtual se generan automáticamente con inteligencia artificial
        y tienen carácter orientativo; en caso de discrepancia prevalecen estas condiciones y la información de tu reserva.
      </p>

      <h2>6. Legislación aplicable</h2>
      <p>Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Tarragona, salvo que la normativa de consumidores establezca otro fuero.</p>
    </>
  );
}

function Privacidad() {
  return (
    <>
      <h2>1. Responsable del tratamiento</h2>
      <p>
        {LEGAL.titular} (NIF {LEGAL.nif}), con domicilio en {LEGAL.domicilio}. Contacto para protección de datos:{' '}
        <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>.
      </p>

      <h2>2. Qué datos tratamos y para qué</h2>
      <div className="tabla-scroll">
        <table className="tabla-legal">
          <thead><tr><th>Datos</th><th>Finalidad</th><th>Base legal</th><th>Conservación</th></tr></thead>
          <tbody>
            <tr><td>Nombre, email, teléfono y contraseña (cifrada)</td><td>Crear y gestionar tu cuenta</td><td>Ejecución del contrato</td><td>Mientras tengas cuenta</td></tr>
            <tr><td>Matrícula, plaza, fechas e importe de las reservas</td><td>Gestionar reservas, acceso al parking y facturación</td><td>Ejecución del contrato y obligación legal</td><td>6 años (obligaciones fiscales y mercantiles)</td></tr>
            <tr><td>Vehículos guardados</td><td>Agilizar tus próximas reservas</td><td>Consentimiento (los guardas tú)</td><td>Hasta que los borres</td></tr>
            <tr><td>Valoraciones (puntuación y comentario)</td><td>Publicar opiniones con tu nombre de pila</td><td>Consentimiento</td><td>Hasta que pidas su retirada</td></tr>
            <tr><td>Mensajes del formulario de contacto</td><td>Responder a tu consulta</td><td>Consentimiento</td><td>1 año</td></tr>
            <tr><td>Mensajes del asistente virtual</td><td>Responder a tus dudas</td><td>Consentimiento (al usar el chat)</td><td>No se guardan en nuestra base de datos</td></tr>
          </tbody>
        </table>
      </div>

      <h2>3. Proveedores que tratan datos por nuestra cuenta</h2>
      <ul>
        <li><strong>Supabase, Inc.</strong>: alojamiento de la base de datos y autenticación, en servidores de la Unión Europea (Irlanda).</li>
        <li>
          <strong>Google (Gemini API)</strong>: si usas el asistente virtual, el texto de tus mensajes y, si has iniciado sesión, los datos de tus
          reservas recientes se envían a Google para generar la respuesta. Puede implicar transferencias internacionales amparadas en las
          garantías adecuadas previstas en el RGPD. No escribas en el chat datos que no sean necesarios.
        </li>
        <li><strong>OpenStreetMap Foundation</strong>: muestra el mapa solo si lo aceptas en la configuración de cookies.</li>
      </ul>
      <p>No vendemos ni cedemos tus datos a terceros, salvo obligación legal.</p>

      <h2>4. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a{' '}
        <a href={`mailto:${LEGAL.emailPrivacidad}`}>{LEGAL.emailPrivacidad}</a>. Puedes modificar tus datos y vehículos desde{' '}
        <Link to="/perfil">Mi perfil</Link>. Si consideras que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de
        Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noreferrer">www.aepd.es</a>).
      </p>

      <h2>5. Seguridad</h2>
      <p>Las comunicaciones van cifradas, las contraseñas se guardan cifradas y el acceso a los datos está restringido por reglas de seguridad: cada usuario solo puede ver su información.</p>
    </>
  );
}

function PoliticaCookies() {
  const { abrirPanel, consentimiento } = useCookies();
  return (
    <>
      <h2>1. Qué usamos</h2>
      <p>
        Esta web no usa cookies de publicidad ni de analítica. Utiliza el almacenamiento local del navegador (similar a las cookies) para que
        funcione el inicio de sesión y para recordar algunas preferencias.
      </p>
      <div className="tabla-scroll">
        <table className="tabla-legal">
          <thead><tr><th>Nombre</th><th>Tipo</th><th>Finalidad</th><th>Duración</th></tr></thead>
          <tbody>
            <tr><td><code>sb-…-auth-token</code></td><td>Necesaria · propia</td><td>Mantener tu sesión iniciada</td><td>Hasta cerrar sesión</td></tr>
            <tr><td><code>consentimiento-cookies</code></td><td>Necesaria · propia</td><td>Recordar tu elección sobre cookies</td><td>Hasta que la cambies</td></tr>
            <tr><td><code>parking-chat</code></td><td>Necesaria · propia</td><td>Mantener la conversación del asistente mientras navegas</td><td>Hasta cerrar la pestaña</td></tr>
            <tr><td><code>tema</code></td><td>Preferencias · propia</td><td>Recordar el modo claro u oscuro</td><td>Hasta que la borres</td></tr>
            <tr><td>Mapa de OpenStreetMap</td><td>Terceros</td><td>Mostrar el mapa de ubicación</td><td>Según OpenStreetMap</td></tr>
          </tbody>
        </table>
      </div>

      <h2>2. Cómo gestionarlas</h2>
      <p>
        Tu elección actual:{' '}
        <strong>
          {consentimiento
            ? `preferencias ${consentimiento.preferencias ? 'permitidas' : 'rechazadas'}, terceros ${consentimiento.terceros ? 'permitidos' : 'rechazados'}`
            : 'todavía no has elegido'}
        </strong>.
      </p>
      <button className="btn" onClick={abrirPanel}><Icono nombre="galleta" tam={17} /> Configurar cookies</button>
      <p>También puedes borrar estos datos desde la configuración de tu navegador; si borras la sesión tendrás que volver a iniciarla.</p>
    </>
  );
}

function Terminos() {
  return (
    <>
      <h2>1. Reserva</h2>
      <p>
        La reserva garantiza una plaza concreta del aparcamiento de {NEGOCIO.direccion} durante el horario elegido. Se confirma al pulsar
        "Confirmar reserva" y queda disponible en "Mis reservas" con su ticket y código QR.
      </p>

      <h2>2. Precio</h2>
      <p>
        El precio se calcula por cuartos de hora según la tarifa de la plaza y se muestra antes de confirmar. Los precios incluyen IVA. El
        titular puede modificar las tarifas, pero nunca afectarán a reservas ya confirmadas.
      </p>

      <h2>3. Cancelación y ampliación</h2>
      <ul>
        <li>Puedes cancelar gratis cualquier reserva antes de la hora de entrada desde "Mis reservas".</li>
        <li>Una reserva ya empezada no se puede cancelar.</li>
        <li>Puedes ampliar la hora de salida, incluso con la reserva en curso, si la plaza sigue libre. Se cobra la diferencia.</li>
      </ul>

      <h2>4. Uso del aparcamiento</h2>
      <ul>
        <li>Accede con el código QR de tu reserva y con el vehículo cuya matrícula indicaste.</li>
        <li>Usa solo la plaza asignada. Las plazas de movilidad reducida requieren la tarjeta correspondiente visible.</li>
        <li>Altura máxima: {NEGOCIO.alturaMaxima}. Respeta la señalización y circula a velocidad reducida.</li>
        <li>Si sales después de la hora reservada, el tiempo extra se cobrará según la tarifa de la plaza.</li>
      </ul>

      <h2>5. Responsabilidad</h2>
      <p>
        El titular responde de los daños causados por su culpa o negligencia, conforme a la Ley 40/2002 reguladora del contrato de
        aparcamiento de vehículos. No responde de objetos dejados en el interior del vehículo que no hayan sido declarados.
      </p>

      <h2>6. Reclamaciones</h2>
      <p>
        Puedes escribirnos desde <Link to="/contacto">Contacto</Link> o a {NEGOCIO.email}. Tienes a tu disposición hojas oficiales de
        reclamación en las instalaciones.
      </p>
    </>
  );
}

const PAGINAS = {
  '/aviso-legal': { titulo: 'Aviso legal', Contenido: AvisoLegal },
  '/privacidad': { titulo: 'Política de privacidad', Contenido: Privacidad },
  '/cookies': { titulo: 'Política de cookies', Contenido: PoliticaCookies },
  '/terminos': { titulo: 'Condiciones de reserva', Contenido: Terminos },
};

export default function Legal() {
  const { pathname } = useLocation();
  const { titulo, Contenido } = PAGINAS[pathname] || PAGINAS['/aviso-legal'];

  return (
    <div className="contenedor pagina legal-layout">
      <aside className="legal-menu">
        <span className="eyebrow">Información legal</span>
        {Object.entries(PAGINAS).map(([ruta, p]) => (
          <NavLink key={ruta} to={ruta}>{p.titulo}</NavLink>
        ))}
      </aside>
      <article className="tarjeta legal">
        <h1>{titulo}</h1>
        <p className="texto-2">Última actualización: {LEGAL.ultimaActualizacion}</p>
        <Contenido />
      </article>
    </div>
  );
}
