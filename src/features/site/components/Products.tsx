import { PRODUCT_CATEGORIES } from '@/data/products';
import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

export function Products() {
  if (PRODUCT_CATEGORIES.length === 0) return null;

  return (
    <section className="bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <Eyebrow>Catálogo</Eyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Produtos</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          {PRODUCT_CATEGORIES.map((category) => (
            <div
              key={category.name}
              className="overflow-hidden rounded-2xl border border-sand-line bg-paper text-left shadow-card transition-shadow hover:shadow-soft"
            >
              <ImagePlaceholder alt={category.name} className="aspect-[16/10]" />
              <div className="p-6">
                <h3 className="font-medium text-berry">{category.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
