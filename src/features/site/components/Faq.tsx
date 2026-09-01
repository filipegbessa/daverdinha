import { FAQ_ITEMS } from '@/data/faq';

export function Faq() {
  if (FAQ_ITEMS.length === 0) return null;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h2 className="text-center text-2xl font-semibold">Perguntas frequentes</h2>
      <div className="mt-8 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="rounded border border-moss-line p-4">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-2 text-sm text-ink-soft">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
