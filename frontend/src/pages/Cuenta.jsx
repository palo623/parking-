import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { supabase } from '../supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useTema } from '../context/TemaContext.jsx';
import { Cargando, Flecha, Icono, Matricula } from '../components/Comunes.jsx';
import { nombreParking } from '../components/Reserva.jsx';
import Justificante from '../components/Justificante.jsx';
import { PAISES, euros, fecha, fmtMatricula, hora, normMatricula, validarMatricula } from '../utils.js';

// «Mi cuenta»: lo típico de las apps de parking (Telpark, EasyPark, SpotHero):
// próxima reserva y repetir, vehículos guardados, justificantes, datos,
// preferencias (tema, idioma, avisos), pagos y seguridad.
const APARTADOS = [
  ['resumen', 'reloj', ['Resumen', 'Resum', 'Overview']],
  ['vehiculos', 'coche', ['Mis vehículos', 'Els meus vehicles', 'My vehicles']],
  ['justificantes', 'tarjeta', ['Justificantes', 'Justificants', 'Receipts']],
  ['datos', 'pin', ['Datos personales', 'Dades personals', 'Personal details']],
  ['preferencias', 'calma', ['Preferencias', 'Preferències', 'Preferences']],
  ['pagos', 'tarjeta', ['Métodos de pago', 'Mètodes de pagament', 'Payment methods']],
  ['seguridad', 'candado', ['Seguridad', 'Seguretat', 'Security']],
];

export default function Cuenta() {
  const { perfil } = useAuth();
  const { T } = useLang();
  const [ap, setAp] = useState('resumen');
  const [reservas, setReservas] = useState(null);
  const [justificante, setJustificante] = useState(null);

  useEffect(() => { api.misReservas().then(setReservas).catch(() => setReservas([])); }, []);

  const props = { reservas, abrirJustificante: setJustificante, irA: setAp };
  return (
    <section className="band !pt-10">
      <div className="wrap">
        <p className="eyebrow">{T('Mi cuenta', 'El meu compte', 'My account')}</p>
        <h1 className="display h-sec mt-3">{T('Hola', 'Hola', 'Hi')}, {perfil?.nombre?.split(' ')[0] || perfil?.email}</h1>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <nav className="cuenta-nav" aria-label={T('Apartados de la cuenta', 'Apartats del compte', 'Account sections')}>
            {APARTADOS.map(([k, ico, n]) => (
              <button key={k} type="button" aria-current={ap === k ? 'page' : undefined} onClick={() => setAp(k)}>
                <Icono nombre={ico} className="!h-5 !w-5" />{T(...n)}
              </button>
            ))}
          </nav>
          <div className="min-w-0">
            {ap === 'resumen' && <Resumen {...props} />}
            {ap === 'vehiculos' && <Vehiculos />}
            {ap === 'justificantes' && <Justificantes {...props} />}
            {ap === 'datos' && <Datos />}
            {ap === 'preferencias' && <Preferencias />}
            {ap === 'pagos' && <Pagos />}
            {ap === 'seguridad' && <Seguridad />}
          </div>
        </div>
      </div>
      {justificante && <Justificante reserva={justificante} onCerrar={() => setJustificante(null)} />}
    </section>
  );
}

function Panel({ titulo, texto, children, accion }) {
  return (
    <div className="card p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-xl font-extrabold">{titulo}</h2>{texto && <p className="mt-1 text-sm text-muted">{texto}</p>}</div>
        {accion}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Resumen({ reservas, abrirJustificante, irA }) {
  const { T, lang, locale } = useLang();
  const navigate = useNavigate();
  if (!reservas) return <Cargando texto={T('Cargando…', 'Carregant…', 'Loading…')} />;
  const ahora = Date.now();
  const proxima = reservas.filter((r) => r.estado === 'confirmada' && new Date(r.fin) > ahora).sort((a, b) => new Date(a.inicio) - new Date(b.inicio))[0];
  const ultima = reservas.filter((r) => r.estado !== 'cancelada').sort((a, b) => new Date(b.inicio) - new Date(a.inicio))[0];
  const gastado = reservas.filter((r) => r.estado !== 'cancelada').reduce((a, r) => a + Number(r.precio_total || 0), 0);
  const enCurso = proxima && new Date(proxima.inicio) <= ahora;
  return (
    <div className="grid gap-6">
      <Panel titulo={enCurso ? T('Reserva en curso', 'Reserva en curs', 'Current booking') : T('Tu próxima reserva', 'La teva propera reserva', 'Your next booking')}>
        {proxima ? (
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="min-w-0">
              <p className="font-mono text-lg font-bold tracking-widest text-ink">{proxima.codigo}</p>
              <p className="mt-1 font-bold text-ink">{nombreParking(proxima.plaza?.parking, lang)} · {T('plaza', 'plaça', 'space')} {proxima.plaza?.codigo}</p>
              <p className="tnum text-sm">{fecha(proxima.inicio, locale)} – {hora(proxima.fin, locale)}</p>
              <Matricula valor={proxima.matricula} className="mt-2 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-accent" onClick={() => abrirJustificante(proxima)}>{T('Ver justificante', 'Veure justificant', 'View receipt')}</button>
              <Link to="/mis-reservas" className="btn btn-ghost">{T('Mis reservas', 'Les meves reserves', 'My bookings')}</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p>{T('No tienes ninguna reserva pendiente.', 'No tens cap reserva pendent.', 'You have no upcoming bookings.')}</p>
            <Link to="/#reservar" className="btn btn-accent">{T('Reservar plaza', 'Reservar plaça', 'Book a space')}</Link>
          </div>
        )}
      </Panel>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-muted">{T('Reservas hechas', 'Reserves fetes', 'Bookings made')}</p><p className="precio mt-1 text-3xl text-ink">{reservas.filter((r) => r.estado !== 'cancelada').length}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">{T('Total gastado', 'Total gastat', 'Total spent')}</p><p className="precio mt-1 text-3xl text-ink">{euros(gastado, locale)}</p></div>
        <button type="button" className="card p-5 text-left transition hover:shadow-[var(--shadow-lg)]" onClick={() => irA('vehiculos')}>
          <p className="text-sm text-muted">{T('Tus vehículos', 'Els teus vehicles', 'Your vehicles')}</p>
          <p className="more-link !min-h-0 mt-2">{T('Gestionar', 'Gestionar', 'Manage')}<Flecha /></p>
        </button>
      </div>
      {ultima && ultima !== proxima && (
        <Panel titulo={T('Repetir una reserva', 'Repetir una reserva', 'Book again')} texto={T('Mismo parking y tipo de plaza, en un clic.', 'Mateix pàrquing i tipus de plaça, amb un clic.', 'Same car park and space type, in one click.')}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-bold text-ink">{nombreParking(ultima.plaza?.parking, lang)} <span className="font-normal text-muted">· {fecha(ultima.inicio, locale)}</span></p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/#reservar', { state: { pedido: { slug: ultima.plaza?.parking?.slug, tipo: ultima.plaza?.tipo, n: Date.now() } } })}>
              {T('Reservar otra vez', 'Reservar un altre cop', 'Book again')}
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Vehiculos() {
  const { T, avisar } = useLang();
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState({ alias: '', matricula: '', pais: 'ES' });
  const [error, setError] = useState('');
  const cargar = () => api.vehiculos().then(setLista).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const anadir = async (e) => {
    e.preventDefault();
    if (!validarMatricula(form.matricula, form.pais)) {
      return setError(form.pais === 'ES' ? T('Matrícula española no válida (4 números y 3 letras, p. ej. 1234 BCD).', 'Matrícula espanyola no vàlida (4 números i 3 lletres, p. ex. 1234 BCD).', 'Invalid Spanish plate (4 numbers and 3 letters, e.g. 1234 BCD).') : T('Escribe entre 2 y 10 letras o números.', 'Escriu entre 2 i 10 lletres o números.', 'Enter 2 to 10 letters or numbers.'));
    }
    setError('');
    try { await api.crearVehiculo({ ...form, matricula: normMatricula(form.matricula) }); setForm({ alias: '', matricula: '', pais: form.pais }); avisar(T('Vehículo guardado', 'Vehicle desat', 'Vehicle saved')); cargar(); } catch (err) { setError(err.message); }
  };

  return (
    <Panel titulo={T('Mis vehículos', 'Els meus vehicles', 'My vehicles')} texto={T('El principal se pone solo al reservar. Puedes guardar varios.', 'El principal es posa sol en reservar. En pots desar diversos.', 'The main one is filled in when you book. You can save several.')}>
      {!lista ? <Cargando texto="…" /> : (
        <ul className="grid gap-3">
          {lista.length === 0 && <li className="text-muted">{T('Aún no tienes vehículos guardados.', 'Encara no tens vehicles desats.', 'No saved vehicles yet.')}</li>}
          {lista.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/10 p-4">
              <div className="flex min-w-0 items-center gap-4">
                <Matricula valor={v.matricula} className="text-base" />
                <div className="min-w-0"><p className="truncate font-bold text-ink">{v.alias || T('Sin nombre', 'Sense nom', 'No name')}</p><p className="text-xs text-muted">{T(...PAISES[v.pais || 'ES'])}</p></div>
                {v.principal && <span className="tag tag-ok">{T('Principal', 'Principal', 'Main')}</span>}
              </div>
              <div className="flex gap-2">
                {!v.principal && <button type="button" className="btn btn-ghost !min-h-[40px] !px-3 text-sm" onClick={() => api.vehiculoPrincipal(v.id).then(cargar)}>{T('Hacer principal', 'Fer principal', 'Make main')}</button>}
                <button type="button" className="btn btn-ghost !min-h-[40px] !px-3 text-sm" onClick={() => api.borrarVehiculo(v.id).then(cargar)}>{T('Quitar', 'Treure', 'Remove')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="mt-6 grid items-end gap-3 border-t border-line/10 pt-5 sm:grid-cols-[1fr_auto_1fr_auto]" onSubmit={anadir}>
        <label className="label">{T('Nombre (opcional)', 'Nom (opcional)', 'Name (optional)')}<input className="field" value={form.alias} placeholder={T('Coche del trabajo', 'Cotxe de la feina', 'Work car')} onChange={(e) => setForm({ ...form, alias: e.target.value })} /></label>
        <label className="label">{T('País', 'País', 'Country')}
          <select className="field" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })}>{Object.entries(PAISES).map(([k, n]) => <option key={k} value={k}>{T(...n)}</option>)}</select>
        </label>
        <label className="label">{T('Matrícula', 'Matrícula', 'Plate')}<input className="field font-mono uppercase" maxLength={form.pais === 'ES' ? 8 : 12} value={form.matricula} placeholder={form.pais === 'ES' ? '0000 BBB' : 'AB 123 CD'} onChange={(e) => setForm({ ...form, matricula: e.target.value.toUpperCase() })} required /></label>
        <button className="btn btn-accent">{T('Añadir', 'Afegir', 'Add')}</button>
      </form>
      {error && <p className="note note-danger mt-3" role="alert">{error}</p>}
    </Panel>
  );
}

function Justificantes({ reservas, abrirJustificante }) {
  const { T, lang, locale } = useLang();
  const lista = (reservas || []).filter((r) => r.estado !== 'cancelada');
  return (
    <Panel titulo={T('Justificantes', 'Justificants', 'Receipts')} texto={T('Ábrelos para imprimirlos o guardarlos en PDF.', 'Obre\'ls per imprimir-los o desar-los en PDF.', 'Open them to print or save as PDF.')}>
      {!reservas ? <Cargando texto="…" /> : lista.length === 0 ? <p className="text-muted">{T('Todavía no tienes justificantes.', 'Encara no tens justificants.', 'No receipts yet.')}</p> : (
        <ul className="divide-y divide-line/10">
          {lista.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="font-mono font-bold text-ink">{r.codigo}</p><p className="text-sm">{nombreParking(r.plaza?.parking, lang)} · {fecha(r.inicio, locale)}</p></div>
              <div className="flex items-center gap-4"><span className="precio text-lg text-ink">{euros(r.precio_total, locale)}</span>
                <button type="button" className="btn btn-ghost !min-h-[40px] !px-3 text-sm" onClick={() => abrirJustificante(r)}>{T('Ver', 'Veure', 'View')}</button></div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Datos() {
  const { perfil, setPerfil } = useAuth();
  const { T, avisar } = useLang();
  const [nombre, setNombre] = useState(perfil?.nombre || '');
  const [telefono, setTelefono] = useState(perfil?.telefono || '');
  const [error, setError] = useState('');
  const guardar = async (e) => {
    e.preventDefault(); setError('');
    try { setPerfil(await api.actualizarPerfil({ nombre, telefono })); avisar(T('Datos guardados', 'Dades desades', 'Details saved')); } catch (err) { setError(err.message); }
  };
  return (
    <Panel titulo={T('Datos personales', 'Dades personals', 'Personal details')}>
      <form className="grid max-w-lg gap-4" onSubmit={guardar}>
        <label className="label">Email<input className="field" value={perfil?.email || ''} disabled /></label>
        <label className="label">{T('Nombre', 'Nom', 'Name')}<input className="field" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
        <label className="label">{T('Teléfono', 'Telèfon', 'Phone')}<input className="field" type="tel" autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></label>
        {error && <p className="note note-danger" role="alert">{error}</p>}
        <button className="btn btn-accent justify-self-start">{T('Guardar cambios', 'Desar canvis', 'Save changes')}</button>
      </form>
    </Panel>
  );
}

const AVISOS_INICIALES = { fin: true, email: true, ofertas: false };

function Preferencias() {
  const { perfil, setPerfil } = useAuth();
  const { T, lang, setLang, avisar } = useLang();
  const { tema, setTema } = useTema();
  const [avisos, setAvisos] = useState({ ...AVISOS_INICIALES, ...(perfil?.preferencias?.avisos || {}) });

  // Las preferencias se guardan en tu cuenta (Supabase), así valen en cualquier dispositivo
  const guardar = async (prefs) => {
    try { setPerfil(await api.actualizarPerfil({ preferencias: prefs })); } catch (e) { avisar(e.message); }
  };
  const cambiarTema = (t) => { setTema(t); guardar({ tema: t }); };
  const cambiarIdioma = (l) => { setLang(l); guardar({ idioma: l }); };
  const cambiarAviso = (k) => {
    const n = { ...avisos, [k]: !avisos[k] };
    setAvisos(n);
    guardar({ avisos: n });
  };
  const TEMAS = [
    ['claro', ['Claro', 'Clar', 'Light'], 'muestra-clara'],
    ['oscuro', ['Oscuro', 'Fosc', 'Dark'], 'muestra-oscura'],
    ['sistema', ['Como el dispositivo', 'Com el dispositiu', 'Match device'], 'muestra-auto'],
  ];
  return (
    <div className="grid gap-6">
      <Panel titulo={T('Apariencia', 'Aparença', 'Appearance')} texto={T('Elige cómo quieres ver la web.', 'Tria com vols veure la web.', 'Choose how the site looks.')}>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={T('Tema', 'Tema', 'Theme')}>
          {TEMAS.map(([k, n, cls]) => (
            <button key={k} type="button" role="radio" aria-checked={tema === k} className="tema-op" onClick={() => cambiarTema(k)}>
              <span className={`muestra ${cls}`} aria-hidden="true"><i /><i /><i /></span>
              <span className="font-bold text-ink">{T(...n)}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel titulo={T('Idioma', 'Idioma', 'Language')}>
        <div className="seg" role="group" aria-label={T('Idioma', 'Idioma', 'Language')}>
          {[['es', 'Castellano'], ['ca', 'Català'], ['en', 'English']].map(([k, n]) => <button key={k} type="button" aria-pressed={lang === k} onClick={() => cambiarIdioma(k)}>{n}</button>)}
        </div>
      </Panel>
      <Panel titulo={T('Avisos', 'Avisos', 'Notifications')} texto={T('Se guardan en tu cuenta.', 'Es desen al teu compte.', 'Saved to your account.')}>
        <ul className="grid gap-1">
          {[
            ['fin', T('Avisarme 15 minutos antes de que acabe mi reserva', 'Avisar-me 15 minuts abans que acabi la reserva', 'Remind me 15 minutes before my booking ends')],
            ['email', T('Enviarme el justificante por email', 'Enviar-me el justificant per correu', 'Email me the receipt')],
            ['ofertas', T('Novedades y ofertas de Tarraco Parkings', 'Novetats i ofertes de Tarraco Parkings', 'News and offers from Tarraco Parkings')],
          ].map(([k, txt]) => (
            <li key={k}><label className="flex min-h-[48px] cursor-pointer items-center justify-between gap-4">
              <span>{txt}</span>
              <input type="checkbox" role="switch" className="interruptor" checked={!!avisos[k]} onChange={() => cambiarAviso(k)} />
            </label></li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Pagos() {
  const { T } = useLang();
  return (
    <Panel titulo={T('Métodos de pago', 'Mètodes de pagament', 'Payment methods')}>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-line/20 p-5">
        <span className="usp-ico"><Icono nombre="tarjeta" /></span>
        <div className="min-w-0 flex-1"><p className="font-bold text-ink">{T('Aún no hay pasarela de pago', 'Encara no hi ha passarel·la de pagament', 'No payment gateway yet')}</p>
          <p className="text-sm text-muted">{T('En el proyecto no se cobra nada. Cuando se conecte, la tarjeta la guardará la pasarela, no nosotros.', 'Al projecte no es cobra res. Quan es connecti, la targeta la desarà la passarel·la, no nosaltres.', 'Nothing is charged in this project. Once connected, the gateway will store the card, not us.')}</p></div>
        <button type="button" className="btn btn-ghost" disabled>{T('Añadir tarjeta · pronto', 'Afegir targeta · aviat', 'Add card · soon')}</button>
      </div>
    </Panel>
  );
}

function Seguridad() {
  const { logout } = useAuth();
  const { T, avisar } = useLang();
  const navigate = useNavigate();
  const [pass, setPass] = useState({ a: '', b: '' });
  const [error, setError] = useState('');
  const cambiar = async (e) => {
    e.preventDefault(); setError('');
    if (pass.a.length < 6) return setError(T('Mínimo 6 caracteres.', 'Mínim 6 caràcters.', 'At least 6 characters.'));
    if (pass.a !== pass.b) return setError(T('Las dos contraseñas no coinciden.', 'Les dues contrasenyes no coincideixen.', 'Passwords do not match.'));
    const { error: err } = await supabase.auth.updateUser({ password: pass.a });
    if (err) return setError(err.message);
    setPass({ a: '', b: '' }); avisar(T('Contraseña cambiada', 'Contrasenya canviada', 'Password changed'));
  };
  return (
    <div className="grid gap-6">
      <Panel titulo={T('Cambiar contraseña', 'Canviar contrasenya', 'Change password')} texto={T('Si entras con Google, no la necesitas.', 'Si entres amb Google, no la necessites.', 'Not needed if you sign in with Google.')}>
        <form className="grid max-w-lg gap-4" onSubmit={cambiar}>
          <label className="label">{T('Nueva contraseña', 'Nova contrasenya', 'New password')}<input className="field" type="password" autoComplete="new-password" value={pass.a} onChange={(e) => setPass({ ...pass, a: e.target.value })} /></label>
          <label className="label">{T('Repítela', 'Repeteix-la', 'Repeat it')}<input className="field" type="password" autoComplete="new-password" value={pass.b} onChange={(e) => setPass({ ...pass, b: e.target.value })} /></label>
          {error && <p className="note note-danger" role="alert">{error}</p>}
          <button className="btn btn-accent justify-self-start">{T('Cambiar contraseña', 'Canviar contrasenya', 'Change password')}</button>
        </form>
      </Panel>
      <Panel titulo={T('Sesión', 'Sessió', 'Session')}>
        <button type="button" className="btn btn-ghost" onClick={async () => { await logout(); navigate('/'); }}>{T('Cerrar sesión', 'Tancar sessió', 'Sign out')}</button>
      </Panel>
    </div>
  );
}
