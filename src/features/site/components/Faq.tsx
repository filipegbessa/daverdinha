import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '@/data/faq';
import { Eyebrow } from '@/features/site/components/Eyebrow';

export function Faq() {
  if (FAQ_ITEMS.length === 0) return null;

  return (
    <section className="bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Eyebrow>Dúvidas</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Perguntas frequentes</h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item) => (
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
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
