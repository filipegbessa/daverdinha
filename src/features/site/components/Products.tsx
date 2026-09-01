import { PRODUCT_CATEGORIES } from '@/data/products';

export function Products() {
  if (PRODUCT_CATEGORIES.length === 0) return null;

  return (
    <section className="px-6 py-16">
      <h2 className="text-center text-2xl font-semibold">Produtos</h2>
      <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
        {PRODUCT_CATEGORIES.map((category) => (
          <div key={category.name} className="rounded border border-sand-line bg-sand p-4">
            <h3 className="font-medium text-berry">{category.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{category.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
