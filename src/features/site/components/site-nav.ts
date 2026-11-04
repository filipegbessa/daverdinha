import { AGENDA_HREF, PRODUCTS_HREF } from '@/features/site/lib/paths';

export interface NavLink {
  href: string;
  label: string;
}

/**
 * O menu do cabeçalho e do rodapé. Produtos e Agenda são páginas; o resto são
 * seções da home — por isso a home entra como parâmetro (`/` ou `/site`).
 */
export function siteNav(home: string): NavLink[] {
  return [
    { href: PRODUCTS_HREF, label: 'Produtos' },
    { href: AGENDA_HREF, label: 'Agenda' },
    { href: `${home}#entregas`, label: 'Entregas' },
    { href: `${home}#sobre`, label: 'Sobre' },
    { href: `${home}#visite`, label: 'Visite' },
  ];
}
