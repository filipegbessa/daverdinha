import { absoluteUrl, productHref } from '@/features/site/lib/paths';
import type { Product } from '@/features/site/types/catalog';

/**
 * O feed de produtos (RSS 2.0 com o namespace `g:`), no formato que o Google
 * Merchant Center e o Gerenciador de Comércio da Meta (catálogo do Instagram
 * e do WhatsApp) leem pela mesma URL. Campos:
 * https://support.google.com/merchants/answer/7052112
 */

const BRAND = 'Daverdinha';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** "89.90 BRL": ponto decimal, com a moeda, como o Google pede. */
function feedPrice(value: number): string {
  return `${value.toFixed(2)} BRL`;
}

/**
 * Sob encomenda vende sem limite, então é `in_stock` (o `backorder` do
 * Google exige uma data de disponibilidade, que não temos).
 */
function feedAvailability(product: Product): 'in_stock' | 'out_of_stock' {
  return product.availability === 'sold_out' ? 'out_of_stock' : 'in_stock';
}

/** Texto puro, sem quebras repetidas, no limite de 5000 caracteres do Google. */
function feedDescription(product: Product): string {
  const text = product.description.replace(/\s+/g, ' ').trim() || product.name;
  return text.slice(0, 5000);
}

function tag(name: string, value: string): string {
  return `<${name}>${escapeXml(value)}</${name}>`;
}

function item(product: Product): string {
  const onSale = typeof product.listPrice === 'number' && product.listPrice > product.price;
  const [image, ...more] = product.images;
  const fields = [
    tag('g:id', product.id),
    tag('g:title', product.name.slice(0, 150)),
    tag('g:description', feedDescription(product)),
    tag('g:link', absoluteUrl(productHref(product))),
    tag('g:image_link', image),
    ...more.slice(0, 10).map((url) => tag('g:additional_image_link', url)),
    tag('g:availability', feedAvailability(product)),
    tag('g:price', feedPrice(onSale ? product.listPrice! : product.price)),
    ...(onSale ? [tag('g:sale_price', feedPrice(product.price))] : []),
    tag('g:condition', 'new'),
    tag('g:brand', BRAND),
    // Peça artesanal não tem GTIN nem código do fabricante.
    tag('g:identifier_exists', 'no'),
    tag('g:product_type', product.category.name),
  ];
  return `<item>${fields.join('')}</item>`;
}

/**
 * Produto sem foto fica de fora: o Google e a Meta recusam item sem
 * `image_link`, e um item recusado só gera aviso no painel da cliente.
 */
export function productFeedXml(products: Product[]): string {
  const items = products.filter((p) => p.images.length > 0).map(item);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    tag('title', `${BRAND}: produtos`),
    tag('link', absoluteUrl('/produtos')),
    tag('description', 'Catálogo do ateliê Daverdinha'),
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n');
}
