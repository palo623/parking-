import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { Icono, Logo } from './Comunes.jsx';

// Cabecera en dos pisos, como APCOA: barra fina oscura (idioma y cuenta)
// y barra blanca con logo, secciones y botón rojo de reservar.
export default function Navbar() {
  const { session, perfil, esAdmin, logout } = useAuth();
  const { t, T, lang, setLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const menu = useRef(null);
  const [scroll, setScroll] = useState(false);
  useEffect(() => {
    const f = () => setScroll(window.scrollY > 8);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  // Cierra el menú móvil al navegar, al pulsar fuera o con Escape
  useEffect(() => { if (menu.current) menu.current.open = false; }, [location]);
  useEffect(() => {
    const fuera = (e) => { if (menu.current?.open && !menu.current.contains(e.target)) menu.current.open = false; };
    const esc = (e) => { if (e.key === 'Escape' && menu.current) menu.current.open = false; };
    document.addEventListener('click', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', fuera); document.removeEventListener('keydown', esc); };
  }, []);

  const salir = async () => { await logout(); navigate('/'); };
  const nombre = perfil?.nombre || session?.user?.email || '';

  const secciones = [
    ['/parkings', T('Parkings y tarifas', 'Pàrquings i tarifes', 'Car parks & prices')],
    ['/como-funciona', t('n.how')],
    ['/ayuda', t('n.help')],
  ];
  const cuenta = session
    ? [['/mis-reservas', t('n.mine')], ...(esAdmin ? [['/admin', t('n.admin')]] : []), ['/perfil', t('n.profile')]]
    : [['/login', t('n.login')], ['/registro', t('n.signup')]];

  return (
    <header className={`navbar ${scroll ? 'is-scrolled' : ''}`}>
      <a href="#contenido" className="skip-link">{T('Ir al contenido', 'Anar al contingut', 'Skip to content')}</a>
      {/* Piso 1 · barra oscura */}
      <div className="topbar">
        <div className="wrap flex items-center justify-between gap-2">
          <p className="hidden items-center gap-2 font-semibold sm:flex">
            <Icono nombre="pin" className="!h-4 !w-4 text-accent" />{t('h.eyebrow')}
          </p>
          <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
            <div className="flex" role="group" aria-label="Idioma / Language">
              {['es', 'ca', 'en'].map((l) => (
                <button key={l} type="button" className="lang-btn" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <span className="mx-1 hidden h-4 w-px bg-line/15 sm:block" aria-hidden="true" />
            {session ? (
              <div className="flex min-w-0 items-center">
                <Link to="/perfil" className="top-link min-w-0" title={nombre}><svg className="ico !h-4 !w-4" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg><span>{t('n.profile')}</span></Link>
                <button type="button" className="top-link" onClick={salir}>{t('n.logout')}</button>
              </div>
            ) : (
              <div className="flex items-center">
                <Link to="/login" className="top-link">{t('n.login')}</Link>
                <Link to="/registro" className="top-link hidden sm:inline-flex">{t('n.signup')}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Piso 2 · barra blanca */}
      <div className="wrap flex items-center justify-between gap-3 py-2.5">
        <Link to="/" className="flex min-h-[44px] items-center gap-2.5"><Logo /></Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
          {secciones.map(([to, txt]) => <NavLink key={to} to={to} className="nav-link">{txt}</NavLink>)}
          {session && <NavLink to="/mis-reservas" className="nav-link">{t('n.mine')}</NavLink>}
          {esAdmin && <NavLink to="/admin" className="nav-link">{t('n.admin')}</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/#reservar" className="btn btn-accent max-sm:!hidden">{t('n.cta')}</Link>
          <details ref={menu} className="menu relative lg:hidden">
            <summary className="grid h-11 w-11 place-items-center rounded-lg border-[1.5px] border-line/15 text-ink" aria-label="Menú">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg>
            </summary>
            <nav className="card absolute right-0 top-[52px] z-10 grid w-64 gap-1 p-2" aria-label="Menú móvil">
              <Link to="/#reservar" className="btn btn-accent mb-1">{t('n.book')}</Link>
              {secciones.map(([to, txt]) => <NavLink key={to} to={to} className="nav-link">{txt}</NavLink>)}
              <div className="my-1 h-px bg-line/10" aria-hidden="true" />
              {cuenta.map(([to, txt]) => <NavLink key={to} to={to} className="nav-link">{txt}</NavLink>)}
              {session && <button type="button" className="nav-link text-left" onClick={salir}>{t('n.logout')}</button>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
