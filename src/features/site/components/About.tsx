import { businessInfo } from '@/data/business';
import { ContactLink } from '@/features/site/components/ContactLink';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';
import type { AboutContent } from '@/features/site/types/about';

/** O texto de antes do cadastro no admin: vale enquanto o "Sobre" nunca foi salvo. */
export const DEFAULT_ABOUT = {
  title: 'Um espaço pra plantar, criar e brindar',
  paragraphs: [
    `Daverdinha é um ateliê de plantas no ${businessInfo.address.neighborhood} 🌱 Atendimento e entrega combinados direto pelo WhatsApp — é só chamar a gente por lá.`,
  ],
  imageUrl: null as string | null,
  instagramLabel: businessInfo.contact.instagram.handle as string | null,
};

/** Parágrafos separados por linha em branco; quebra simples vira espaço. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

/**
 * A seção "Sobre" da home. Com o "Sobre" salvo no admin, mostra o título, os
 * parágrafos, a foto e o link pro Instagram de lá (sem texto do link, sem
 * link); sem ele, o texto do código.
 */
export function About({ content }: { content?: AboutContent | null }) {
  const about =
    content?.configured && content.title && content.text
      ? {
          title: content.title,
          paragraphs: toParagraphs(content.text),
          imageUrl: content.imageUrl,
          instagramLabel: content.instagramLabel,
        }
      : DEFAULT_ABOUT;

  return (
    <section id="sobre" className="scroll-mt-24 px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <ImagePlaceholder
          src={about.imageUrl ?? undefined}
          alt="Foto do espaço da Daverdinha"
          className="order-last aspect-4/3 max-h-105 rounded-[1rem_2.5rem_1rem_2.5rem] shadow-card md:order-first"
        />
        <div className="text-center md:text-left">
          <Eyebrow>Sobre</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">{about.title}</h2>
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-4 text-lg text-ink-soft">
              {paragraph}
            </p>
          ))}
          {about.instagramLabel && (
            <ContactLink
              href={businessInfo.contact.instagram.url}
              channel="instagram"
              location="about"
              className="mt-4 inline-block font-medium text-berry underline underline-offset-4"
            >
              {about.instagramLabel}
            </ContactLink>
          )}
        </div>
      </div>
    </section>
  );
}
