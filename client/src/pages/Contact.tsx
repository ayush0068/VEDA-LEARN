import Mandala from '@/components/common/Mandala';
import ContactForm from '@/components/contact/ContactForm';
import ContactHero from '@/components/contact/ContactHero';
import ContactInfo from '@/components/contact/ContactInfo';
import ContactLandscape from '@/components/contact/ContactLandscape';
import ContactPromises from '@/components/contact/ContactPromises';

export default function Contact() {
  return (
    <>
      <ContactHero />

      <section className="relative overflow-hidden pb-6 pt-4 lg:pt-6" aria-label="Contact details and message form">
        <Mandala className="pointer-events-none absolute -right-28 top-10 hidden h-72 w-72 animate-spin-slow text-gold/20 [stroke-width:0.4] motion-reduce:animate-none lg:block" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-14 xl:gap-20">
            <div className="lg:pt-14">
              <ContactInfo />
            </div>
            <ContactForm />
          </div>

          <div className="mt-10 lg:mt-12">
            <ContactPromises />
          </div>
        </div>
      </section>

      <ContactLandscape />
    </>
  );
}