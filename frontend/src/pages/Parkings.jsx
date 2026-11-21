import { useLang } from '../context/LangContext.jsx';
import { BarraMovil, CabeceraPagina, SeccionParkings, SeccionTarifas, desdeNormal, useElegir, useTarifas } from '../components/Secciones.jsx';
import { euros } from '../utils.js';

export default function Parkings() {
  const { T, locale } = useLang();
  const { tarifas, errorTarifas } = useTarifas();
  const elegir = useElegir();
  return (
    <>
      <CabeceraPagina eyebrow={T('Parkings y tarifas', 'Pàrquings i tarifes', 'Car parks & prices')}
        titulo={T('Dónde aparcar y cuánto cuesta.', 'On aparcar i quant costa.', 'Where to park and what it costs.')}
        lead={T('Tres parkings en Tarragona. Mira dónde está cada uno y el precio final de cada tipo de plaza.', 'Tres pàrquings a Tarragona. Mira on és cadascun i el preu final de cada tipus de plaça.', 'Three car parks in Tarragona. See where each one is and the final price of every space type.')} />
      <SeccionParkings tarifas={tarifas} errorTarifas={errorTarifas} onElegir={elegir} sinCabecera />
      <SeccionTarifas tarifas={tarifas} errorTarifas={errorTarifas} onElegir={elegir} />
      <BarraMovil desde={desdeNormal(tarifas)} eur={(n) => euros(n, locale)} T={T} siempre />
    </>
  );
}
