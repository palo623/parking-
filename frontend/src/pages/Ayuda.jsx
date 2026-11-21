import { useLang } from '../context/LangContext.jsx';
import { CabeceraPagina, SeccionCta, SeccionFaq, SeccionOpiniones } from '../components/Secciones.jsx';

export default function Ayuda() {
  const { T } = useLang();
  return (
    <>
      <CabeceraPagina eyebrow={T('Ayuda', 'Ajuda', 'Help')}
        titulo={T('¿En qué te ayudamos?', 'En què t\'ajudem?', 'How can we help?')}
        lead={T('Las dudas más habituales sobre precios, horarios y cancelaciones.', 'Els dubtes més habituals sobre preus, horaris i cancel·lacions.', 'The most common questions about prices, times and cancellations.')} />
      <SeccionFaq />
      <SeccionOpiniones />
      <SeccionCta />
    </>
  );
}
