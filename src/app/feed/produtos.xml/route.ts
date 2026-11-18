import { getActiveProducts } from '@/features/site/lib/public-api';
import { productFeedXml } from '@/features/site/lib/product-feed';

// O Google e a Meta buscam o feed algumas vezes por dia: uma hora de cache
// basta, e preço e estoque continuam em dia com o site.
export const revalidate = 3600;

/**
 * `GET /feed/produtos.xml`: o catálogo para o Google Merchant Center e o
 * catálogo da Meta.
 */
export async function GET() {
  const products = await getActiveProducts();
  return new Response(productFeedXml(products), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
