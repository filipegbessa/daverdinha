import { businessInfo } from '@/data/business';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

export function About() {
  return (
    <section id="sobre" className="scroll-mt-24 bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <ImagePlaceholder
          alt="Foto do espaço da Daverdinha"
          className="order-last aspect-4/3 max-h-105 rounded-[1rem_2.5rem_1rem_2.5rem] shadow-card md:order-first"
        />
        <div className="text-center md:text-left">
          <Eyebrow>Sobre</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">
            Um espaço pra plantar, criar e brindar
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Daverdinha é um ateliê de plantas no {businessInfo.address.neighborhood} 🌱 Atendimento e entrega
            combinados direto pelo WhatsApp — é só chamar a gente por lá.
          </p>
          <ContactLink
            href={businessInfo.contact.instagram.url}
            channel="instagram"
            location="about"
            className="mt-4 inline-block font-medium text-berry underline underline-offset-4"
          >
            {businessInfo.contact.instagram.handle}
          </ContactLink>
        </div>
      </div>
    </section>
  );
}
