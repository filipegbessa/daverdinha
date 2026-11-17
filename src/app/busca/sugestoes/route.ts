import { NextResponse } from 'next/server';
import { getActiveProducts } from '@/features/site/lib/public-api';
import { searchProducts } from '@/features/site/lib/catalog-list';
import { productHref } from '@/features/site/lib/paths';

/** O que a caixa de busca do cabeçalho mostra enquanto a compradora digita. */
export interface SearchSuggestion {
  name: string;
  href: string;
  image: string | null;
  category: string;
  price: number;
  listPrice: number | null;
}

const LIMIT = 6;

/**
 * `GET /busca/sugestoes?q=`: os primeiros resultados da mesma busca da
 * página `/busca`, sobre o catálogo que o site já guarda por 60 s (não vai
 * à API a cada tecla). Menos de 2 letras devolve vazio.
 */
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json([]);

  const products = searchProducts(await getActiveProducts(), q).slice(0, LIMIT);
  const suggestions: SearchSuggestion[] = products.map((p) => ({
    name: p.name,
    href: productHref(p),
    image: p.images[0] ?? null,
    category: p.category.name,
    price: p.price,
    listPrice: p.listPrice ?? null,
  }));
  return NextResponse.json(suggestions);
}
