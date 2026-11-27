import { NextResponse } from 'next/server';

/**
 * `GET /health`: o healthcheck do Coolify. O Coolify sobe o contêiner novo e
 * só derruba o antigo quando esta rota responde 200, então um deploy que não
 * sobe não tira o site do ar.
 *
 * Não consulta a API de propósito: com a API fora do ar o site continua de
 * pé (catálogo vazio, WhatsApp funcionando), e um healthcheck que dependesse
 * dela faria o Coolify recusar um deploy do site que está bom.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
