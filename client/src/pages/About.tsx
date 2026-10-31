import AboutHero from '@/components/about/AboutHero';
import { Different, Landscape, Purpose, QuoteBanner, Values } from '@/components/about/AboutSections';

export default function About() {
  return (
    <>
      <AboutHero />
      <Purpose />
      <Different />
      <QuoteBanner />
      <Values />
      <Landscape />
    </>
  );
}