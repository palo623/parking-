import { useLang } from '../context/LangContext.jsx';
import { BarraMovil, CabeceraPagina, SeccionBarrera, SeccionComo, SeccionGarantia, SeccionSeguridad, desdeNormal, useTarifas } from '../components/Secciones.jsx';
import { euros } from '../utils.js';

export default function ComoFunciona() {
  const { t, T, locale } = useLang();
  const { tarifas } = useTarifas();
  return (
    <>
      <CabeceraPagina eyebrow={t('hw.k')}
        titulo={T('Sin ticket, sin cajero, sin vueltas.', 'Sense tiquet, sense caixer, sense voltes.', 'No ticket, no pay machine, no circling.')}
        lead={T('Reservas, llegas y la barrera lee tu matrícula. Así funciona, y aquí puedes probarlo.', 'Reserves, arribes i la barrera llegeix la teva matrícula. Així funciona, i aquí ho pots provar.', 'Book, arrive and the barrier reads your plate. This is how it works, and you can try it here.')} />
      <SeccionComo sinCabecera />
      <SeccionGarantia />
      <SeccionBarrera />
      <SeccionSeguridad />
      <BarraMovil desde={desdeNormal(tarifas)} eur={(n) => euros(n, locale)} T={T} siempre />
    </>
  );
}
