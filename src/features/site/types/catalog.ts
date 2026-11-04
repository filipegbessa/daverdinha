/**
 * Contrato público do catálogo, igual ao que a API devolve em
 * `GET /product-categories/active` e `GET /products/active` (ver
 * `docs/plans/2026-11-04-catalogo-produtos.md` nos dois repositórios).
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
}
