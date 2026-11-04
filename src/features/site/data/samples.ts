import type { Product, ProductCategory } from '@/features/site/types/catalog';
import type { SiteEvent } from '@/features/site/types/event';
import type { HeroSlide } from '@/features/site/types/hero-slide';
import { DEFAULT_HERO_SLIDE } from '@/features/site/data/hero';

/**
 * Conteúdo de exemplo pra cliente validar o layout em `/site` antes de a API
 * de catálogo e agenda existir. Só aparece antes do lançamento
 * (`SITE_MODE` ≠ 'full') e só quando a API não devolve nada — ver
 * `withPreviewFallback` em `lib/public-api.ts`. Toda página que mostra isto
 * exibe o aviso de prévia (`PreviewNotice`).
 *
 * Os ids começam com `sample-`: é por eles que a página sabe que está
 * mostrando exemplo.
 */
const SAMPLE_PREFIX = 'sample-';

export function isSample(item: { id: string }): boolean {
  return item.id.startsWith(SAMPLE_PREFIX);
}

export const SAMPLE_CATEGORIES: ProductCategory[] = [
  {
    id: 'sample-cat-vasos',
    name: 'Vasos',
    slug: 'vasos',
    description:
      'Vasos de cerâmica, terracota e cimento pintados à mão no ateliê, do tamanho de uma suculenta ao de uma costela-de-adão.',
  },
  {
    id: 'sample-cat-mudas',
    name: 'Mudas',
    slug: 'mudas',
    description: 'Mudas saudáveis, aclimatadas no ateliê e prontas pra ir pra casa, com dica de cuidado na entrega.',
  },
  {
    id: 'sample-cat-arranjos',
    name: 'Arranjos',
    slug: 'arranjos',
    description: 'Arranjos montados sob medida pra presente, mesa posta ou um canto da casa que pede verde.',
  },
  {
    id: 'sample-cat-kits',
    name: 'Kits',
    slug: 'kits',
    description: 'Tudo o que precisa pra montar o seu: vaso, substrato, planta e o passo a passo.',
  },
];

function category(slug: string): Product['category'] {
  const found = SAMPLE_CATEGORIES.find((c) => c.slug === slug)!;
  return { id: found.id, name: found.name, slug: found.slug };
}

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'sample-p1',
    name: 'Vaso Terracota M',
    slug: 'vaso-terracota-m',
    description:
      'Vaso de terracota de 18 cm, com furo de drenagem e prato. A terracota respira e ajuda a raiz a não encharcar — bom pra quem rega demais.',
    price: 89.9,
    images: [],
    category: category('vasos'),
  },
  {
    id: 'sample-p2',
    name: 'Vaso Pintado Folhagem',
    slug: 'vaso-pintado-folhagem',
    description: 'Cerâmica de 14 cm pintada à mão no ateliê. Cada peça sai um pouco diferente da outra.',
    price: 119,
    images: [],
    category: category('vasos'),
  },
  {
    id: 'sample-p3',
    name: 'Jiboia em cuia',
    slug: 'jiboia-em-cuia',
    description: 'Jiboia já enraizada numa cuia de coco. Gosta de luz indireta e rega quando a terra secar.',
    price: 59,
    images: [],
    category: category('mudas'),
  },
  {
    id: 'sample-p4',
    name: 'Suculenta Echeveria',
    slug: 'suculenta-echeveria',
    description: 'Echeveria em vaso de 8 cm. Sol pela manhã e pouca água.',
    price: 32,
    images: [],
    category: category('mudas'),
  },
  {
    id: 'sample-p5',
    name: 'Arranjo Tropical',
    slug: 'arranjo-tropical',
    description: 'Folhagens tropicais num cachepô de palha, montado no dia da entrega.',
    price: 159,
    images: [],
    category: category('arranjos'),
  },
  {
    id: 'sample-p6',
    name: 'Kit Terrário Pequeno',
    slug: 'kit-terrario-pequeno',
    description: 'Pote de vidro, pedrisco, carvão, substrato, duas mudas e o passo a passo pra montar em casa.',
    price: 129,
    images: [],
    category: category('kits'),
  },
  {
    id: 'sample-p7',
    name: 'Kit Kokedama',
    slug: 'kit-kokedama',
    description: 'Musgo, substrato, barbante e uma muda pra fazer sua kokedama.',
    price: 89,
    images: [],
    category: category('kits'),
  },
  {
    id: 'sample-p8',
    name: 'Arranjo de Mesa',
    slug: 'arranjo-de-mesa',
    description: 'Arranjo baixo pra centro de mesa, com suculentas e musgo.',
    price: 99,
    images: [],
    category: category('arranjos'),
  },
];

/**
 * Os exemplos "em destaque" (o `featured` do admin). São 6 de propósito:
 * mais do que cabe numa linha no desktop, pra cliente ver a vitrine virar
 * carrossel.
 */
const SAMPLE_FEATURED_IDS = new Set(['sample-p1', 'sample-p2', 'sample-p3', 'sample-p5', 'sample-p6', 'sample-p7']);

export const SAMPLE_FEATURED_PRODUCTS = SAMPLE_PRODUCTS.filter((p) => SAMPLE_FEATURED_IDS.has(p.id));

/**
 * O primeiro é o slide padrão de verdade (o que a home mostra sem API); os
 * outros dois existem só pra cliente ver o slideshow funcionando.
 */
export const SAMPLE_HERO_SLIDES: HeroSlide[] = [
  DEFAULT_HERO_SLIDE,
  {
    id: 'sample-h2',
    eyebrow: 'Oficina no ateliê',
    title: 'Monte seu terrário com a gente',
    description: 'Duas horas, todo o material incluso, e o terrário vai pra casa com você.',
    imageUrl: null,
    linkLabel: 'Ver agenda',
    linkUrl: '/agenda',
  },
  {
    id: 'sample-h3',
    eyebrow: 'Presentes',
    title: 'Kits prontos pra presentear',
    description: 'Vaso, planta e o passo a passo numa caixa só.',
    imageUrl: null,
    linkLabel: 'Ver kits',
    linkUrl: '/produtos/kits',
  },
];

/** Próximo sábado (ou o de daqui a `weeks` semanas), no formato YYYY-MM-DD. */
function saturday(now: Date, weeks: number): string {
  const days = ((6 - now.getUTCDay() + 7) % 7 || 7) + weeks * 7;
  const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

/**
 * Datas relativas a hoje: com datas fixas, os exemplos venceriam e a faixa do
 * topo sumiria no meio da validação.
 */
export function sampleEvents(now: Date = new Date()): SiteEvent[] {
  return [
    {
      id: 'sample-e1',
      title: 'Oficina de terrário',
      slug: 'oficina-de-terrario',
      description:
        'Em duas horas você monta o seu terrário do zero: escolha das plantas, camadas de drenagem e o cuidado depois. Todo o material está incluso e o terrário vai pra casa com você.',
      startsAt: `${saturday(now, 0)}T10:00:00-03:00`,
      endsAt: `${saturday(now, 0)}T12:00:00-03:00`,
      locationName: null,
      locationAddress: null,
      price: 120,
      spots: 8,
      imageUrl: null,
      ctaUrl: null,
    },
    {
      id: 'sample-e2',
      title: 'Feirinha verde do Santo Cristo',
      slug: 'feirinha-verde-do-santo-cristo',
      description: 'A Daverdinha leva mudas, vasos e arranjos pra feira do bairro. Entrada gratuita.',
      startsAt: `${saturday(now, 1)}T09:00:00-03:00`,
      endsAt: `${saturday(now, 1)}T15:00:00-03:00`,
      locationName: 'Praça da Harmonia',
      locationAddress: 'Praça da Harmonia, Gamboa, Rio de Janeiro',
      price: null,
      spots: null,
      imageUrl: null,
      ctaUrl: null,
    },
    {
      id: 'sample-e3',
      title: 'Plantar e brindar: kokedama',
      slug: 'plantar-e-brindar-kokedama',
      description: 'Fim de tarde no ateliê fazendo kokedama, com uma bebida pra brindar no final.',
      startsAt: `${saturday(now, 3)}T16:00:00-03:00`,
      endsAt: `${saturday(now, 3)}T18:00:00-03:00`,
      locationName: null,
      locationAddress: null,
      price: 150,
      spots: 10,
      imageUrl: null,
      ctaUrl: null,
    },
  ];
}
