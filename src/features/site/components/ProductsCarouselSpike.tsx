import { Eyebrow } from '@/features/site/components/Eyebrow';
import { ImagePlaceholder } from '@/features/site/components/ImagePlaceholder';

const MOCK_PRODUCTS = [
  { name: 'Vaso Terracota M', price: 'R$ 89' },
  { name: 'Suculenta Echeveria', price: 'R$ 39' },
  { name: 'Kit Jardinagem Iniciante', price: 'R$ 129' },
  { name: 'Arranjo Tropical', price: 'R$ 159' },
  { name: 'Muda de Jiboia', price: 'R$ 59' },
  { name: 'Terrário Pequeno', price: 'R$ 99' },
];

/**
 * SPIKE — só prova de layout pro carrossel de produtos (posição entre About
 * e DeliveryZones, dados fake, sem integração com API/admin). Troca de volta
 * pra <Products /> assim que a discussão de design fechar; não é pra virar
 * produção como está.
 */
export function ProductsCarouselSpike() {
  return (
    <section className="bg-sand px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <Eyebrow>Catálogo</Eyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink md:text-3xl">Produtos</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          (Prévia de layout — produtos e preços fictícios, ainda sem integração)
        </p>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-4">
        {MOCK_PRODUCTS.map((product) => (
          <div
            key={product.name}
            className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-sand-line bg-paper text-left shadow-card transition-shadow hover:shadow-soft"
          >
            <ImagePlaceholder alt={product.name} className="aspect-square" />
            <div className="p-5">
              <h3 className="font-medium text-berry">{product.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{product.price}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <span className="text-sm font-medium text-moss underline underline-offset-4">Ver todos os produtos</span>
      </div>
    </section>
  );
}
