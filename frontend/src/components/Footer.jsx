import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { Logo } from './Comunes.jsx';
import { PARKING_CA } from './Reserva.jsx';

// Pie oscuro de varias columnas (estilo Contipark / Q-Park)
export default function Footer() {
  const { t, T, lang } = useLang();
  const nombres = {
    centro: T('Parking Centro', PARKING_CA.centro[0], 'Centre Car Park'),
    puerto: T('Parking Puerto', PARKING_CA.puerto[0], 'Port Car Park'),
    estacion: T('Parking Estación', PARKING_CA.estacion[0], 'Station Car Park'),
  };
  const columnas = [
    [T('Reservar', 'Reservar', 'Book'), [['/#reservar', t('n.book')], ['/parkings#tarifas', t('n.rates')], ['/parkings', T('Parkings y mapa', 'Pàrquings i mapa', 'Car parks & map')]]],
    [T('Parkings', 'Pàrquings', 'Car parks'), Object.values(nombres).map((n) => ['/parkings', n])],
    [T('Ayuda', 'Ajuda', 'Help'), [['/como-funciona', t('n.how')], ['/como-funciona#barrera', t('n.gate')], ['/ayuda', T('Preguntas frecuentes', 'Preguntes freqüents', 'FAQ')]]],
    [T('Tu cuenta', 'El teu compte', 'Your account'), [['/login', t('n.login')], ['/registro', t('n.signup')], ['/mis-reservas', t('n.mine')]]],
  ];
  return (
    <footer className="site-footer">
      <div className="wrap grid gap-10 py-14 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5"><Logo claro /></Link>
          <p className="mt-4 max-w-xs text-sm">{t('ft.p')}</p>
          <p className="mt-4 text-sm"><span className="font-bold text-ink">{t('ft.where')}:</span> Tarragona, Catalunya · {t('ft.parks')}</p>
        </div>
        <nav className="grid grid-cols-2 gap-8 sm:grid-cols-4" aria-label={T('Pie de página', 'Peu de pàgina', 'Footer')}>
          {columnas.map(([titulo, enlaces]) => (
            <div key={titulo}>
              <p className="f-title text-sm font-bold uppercase tracking-wider">{titulo}</p>
              <ul className="mt-3 grid gap-1 text-sm">
                {enlaces.map(([to, txt]) => <li key={txt}><Link to={to} className="inline-flex min-h-[36px] items-center">{txt}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-line/10">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-5 text-xs">
          <p lang={lang}>© {new Date().getFullYear()} Tarraco Parkings · {t('ft.copy')}</p>
          <button type="button" className="min-h-[36px] underline underline-offset-4 hover:text-ink" onClick={() => window.dispatchEvent(new Event('tp-cookies'))}>
            {T('Configurar cookies', 'Configurar galetes', 'Cookie settings')}
          </button>
        </div>
      </div>
    </footer>
  );
}
