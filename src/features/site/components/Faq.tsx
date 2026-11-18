import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { faqItems, type FaqItem } from '@/data/faq';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { JsonLd } from '@/features/site/components/JsonLd';

/**
 * Perguntas frequentes da home. As respostas vêm prontas de quem busca os
 * dados do admin (`getFaqItems`); sem elas, valem as respostas padrão. O
 * JSON-LD `FAQPage` deixa o Google mostrar as perguntas na busca.
 */
export function Faq({ items = faqItems() }: { items?: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="duvidas" className="scroll-mt-24 px-6 py-16 md:py-24">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }}
      />
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Eyebrow>Dúvidas</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Perguntas frequentes</h2>
        </div>
        <div className="mt-10 space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-sand-line bg-paper p-5 shadow-card open:shadow-soft"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <ChevronDown
                  className="size-5 shrink-0 text-berry transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{item.answer}</p>
              {item.link && (
                <Link
                  href={item.link.href}
                  className="mt-2 inline-block text-sm font-medium text-moss underline underline-offset-4"
                >
                  {item.link.label}
                </Link>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
