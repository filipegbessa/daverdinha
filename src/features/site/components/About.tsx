import Link from 'next/link';

export function About() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-lg text-ink-soft">
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
    </section>
  );
}
