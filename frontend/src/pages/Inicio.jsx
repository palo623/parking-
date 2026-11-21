import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import Reserva from '../components/Reserva.jsx';
import {
  BarraMovil, DESTINOS, LETRA, SeccionComo, SeccionCta, SeccionParkings, SeccionVentajas, VistaAerea, desdeNormal, useTarifas,
} from '../components/Secciones.jsx';
import { euros } from '../utils.js';

// Portada corta: reservar es lo primero; el resto, en sus propias páginas
export default function Inicio() {
  const { t, T, locale } = useLang();
  const location = useLocation();
  const [pedido, setPedido] = useState(null);   // parking elegido desde otra parte
  const [ultima, setUltima] = useState(null);
  const { tarifas, errorTarifas } = useTarifas();
  const eur = (n) => euros(n, locale);

  // «Reservar aquí» desde otra página trae el parking elegido
  useEffect(() => {
    if (location.state?.pedido) setPedido(location.state.pedido);
  }, [location.key, location.state]);

  const elegir = (p) => setPedido({ ...p, n: Date.now() });

  return (
    <>
      {/* ============ PORTADA (APCOA): fondo oscuro + buscador encima ============ */}
      <section id="inicio" className="hero pb-[150px] pt-10 sm:pt-14 lg:pb-[120px]">
        <VistaAerea />
        <div className="wrap grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-14">
          <div className="min-w-0 lg:pt-10">
            <p className="eyebrow">{t('h.eyebrow')}</p>
            <h1 className="display h-hero mt-4"><span>{t('h.l1')}</span><br /><span className="paint">{t('h.l2')}</span></h1>
            <p className="lead mt-5">{t('h.p')}</p>
            {/* Accesos rápidos por destino (como SpotHero / JustPark) */}
            <div className="mt-7">
              <p className="text-sm font-bold uppercase tracking-wider text-muted">{T('¿A dónde vas?', 'On vas?', 'Where are you going?')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DESTINOS.map(([slug, ico, nombres]) => (
                  <button key={slug} type="button" className={`destino c-${slug}`} onClick={() => setPedido({ slug, n: Date.now() })}>
                    <span className="pk-dot" aria-hidden="true">{LETRA[slug]}</span>{T(...nombres)}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink">
              {['h.t1', 'h.t3'].map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <svg className="ico !h-4 !w-4 text-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" strokeWidth="3" /></svg>{t(k)}
                </li>
              ))}
            </ul>
          </div>
          <Reserva pedido={pedido} onReservada={setUltima} />
        </div>
      </section>


      <BarraMovil desde={desdeNormal(tarifas)} eur={eur} T={T} />
      <SeccionVentajas />
      <SeccionParkings tarifas={tarifas} errorTarifas={errorTarifas} onElegir={elegir} completo={false} />
      <SeccionComo completo={false} />
      <SeccionCta />
    </>
  );
}
