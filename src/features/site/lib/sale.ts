import { categoryHref } from '@/features/site/lib/paths';
import type { Product, ProductCategory } from '@/features/site/types/catalog';

/**
 * "Promoção": uma categoria que não existe no admin. Junta os produtos com
 * desconto valendo agora (o `listPrice` da API, o "de" riscado), de qualquer
 * categoria, e some sozinha quando nenhum está em promoção. A API reserva o
 * slug, pra nenhuma categoria de verdade ficar com a mesma URL.
 */
export const SALE_CATEGORY: ProductCategory = {
  id: 'promocao',
  name: 'Promoção',
  slug: 'promocao',
  description: 'Os produtos do ateliê com desconto agora. Os preços valem enquanto durar a promoção.',
};

export const SALE_HREF = categoryHref(SALE_CATEGORY.slug);

export function isOnSale(product: Product): boolean {
  return product.listPrice != null && product.listPrice > product.price;
}
