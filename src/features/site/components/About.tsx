import Link from 'next/link';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

export function About() {
  return (
    <section className="bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <ImagePlaceholder
          alt="Foto do espaço da Da Verdinha"
          className="order-last aspect-[4/3] max-h-[420px] rounded-[1rem_2.5rem_1rem_2.5rem] shadow-card md:order-first"
        />
        <div className="text-center md:text-left">
          <Eyebrow>Sobre</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink">Da Verdinha</h2>
          <p className="mt-4 text-lg text-ink-soft">
            Da Verdinha é um espaço pra plantar, criar e brindar 🌱 Atendimento e entrega combinados direto pelo
            WhatsApp — é só chamar a gente por lá.
          </p>
          <Link
            href="https://www.instagram.com/daverdinha_/"
            target="_blank"
            className="mt-4 inline-block font-medium text-berry underline underline-offset-4"
          >
            @daverdinha_
          </Link>
        </div>
      </div>
    </section>
  );
}
