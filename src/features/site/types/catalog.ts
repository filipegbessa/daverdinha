/**
 * Contrato público do catálogo, igual ao que a API devolve em
 * `GET /product-categories/active` e `GET /products/active` (ver o README
 * do daverdinha-api, "Catálogo do site").
 */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  /** Texto de abertura da página da categoria — é o que dá ao Google o que ler. */
  description: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  /** A primeira é a capa. Pode vir vazia: o card cai no `ImagePlaceholder`. */
  images: string[];
  category: Pick<ProductCategory, 'id' | 'name' | 'slug'>;
  /**
   * Pronta entrega, sob encomenda ou esgotado — a API já desconta as
   * unidades reservadas por pedidos que ainda estão sendo pagos.
   */
  availability: ProductAvailability;
  /** Prazo de confecção em dias; só vem em `made_to_order` (e pode faltar). */
  leadTimeDays: number | null;
}

export type ProductAvailability = 'in_stock' | 'made_to_order' | 'sold_out';
