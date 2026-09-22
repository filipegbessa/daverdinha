/**
 * Gera os assets derivados (logo, favicon, ícones do PWA) a partir dos
 * originais versionados em `public/original/`.
 *
 *   node scripts/generate-assets.mjs
 *
 * Os arquivos gerados são commitados — isto aqui não roda no build. Existe pra
 * que as dimensões e o tratamento de cada tamanho fiquem escritos em algum
 * lugar, em vez de virarem um "alguém exportou assim uma vez".
 *
 * Usa o `sharp` que o Next.js já instala; de propósito não é dependência
 * declarada, porque nada em runtime depende dele. Se sumir, este script quebra
 * com barulho e os assets já commitados seguem intactos.
 *
 * Por que PNG com paleta: as duas artes são ilustrações de cor chapada (verde
 * #185928 e creme #e4dfce). Quantizar pra paleta indexada corta a maior parte
 * do peso sem diferença visível — o degradê só existe no antialiasing das
 * bordas. `dither: 0` porque dither em arte chapada só adiciona ruído, e ruído
 * comprime mal.
 *
 * Por que exatamente 16 cores, e não 32 ou 64: o PNG indexado usa 4 bits por
 * pixel até 16 cores e 8 bits a partir de 32 — o custo **dobra num degrau**,
 * não sobe suave. Medido neste projeto, o badge em 512px dá 29 KB com 16 cores
 * e 117 KB com 32; a logo em 1200px dá 80 KB contra 282 KB. Comparando os dois
 * lados a 1:1, inclusive no texto "DAVERDINHA", não há diferença visível — o
 * original tem ~7.400 cores só por causa de textura de fundo e antialiasing,
 * nada que precise de mais de 16 níveis.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BADGE = resolve(root, 'public/original/favicon.png');
const LOCKUP = resolve(root, 'public/original/logo.png');

/** Cor de fundo do manifest — `background_color` em `src/app/manifest.ts`. */
const SAND = '#e4dfce';
/** Cor da marca — `theme_color` no manifest e `themeColor` no layout. */
const MOSS = '#185928';

const png = { palette: true, colours: 16, dither: 0, effort: 10, compressionLevel: 9 };

async function write(path, buffer) {
  const full = resolve(root, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, buffer);
  console.log(`${(buffer.length / 1024).toFixed(1).padStart(7)} KB  ${path}`);
}

/** Redimensiona preservando a transparência. */
function scaled(src, size) {
  return sharp(src).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
}

/**
 * Recorta o cacto do selo, com transparência, pra poder remontá-lo sobre
 * qualquer fundo e em qualquer tamanho.
 *
 * O selo original é creme sobre verde escuro — duas tonalidades só —, então a
 * luminância normalizada já é o canal alpha do glifo: dá a silhueta com o
 * antialiasing das bordas preservado, que um corte por limiar duro jogaria
 * fora. O recorte em `GLYPH_RADIUS` descarta o anel creme da borda do selo; a
 * arte em si não passa de 0,59 do raio, então nada dela é cortado.
 */
let glyphCache;
async function glyph() {
  if (glyphCache) return glyphCache;

  const SIZE = 1024;
  const GLYPH_RADIUS = 0.6;
  const [DARK, LIGHT] = [45, 230]; // luminância do verde e do creme

  const { data } = await sharp(BADGE).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(SIZE * SIZE * 4);
  const centre = (SIZE - 1) / 2;

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const i = (y * SIZE + x) * 4;
      let alpha = 0;
      if (Math.hypot(x - centre, y - centre) / centre < GLYPH_RADIUS && data[i + 3] > 128) {
        const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        alpha = Math.max(0, Math.min(1, (luma - DARK) / (LIGHT - DARK)));
      }
      out[i] = 255;
      out[i + 1] = 251;
      out[i + 2] = 235;
      out[i + 3] = Math.round(alpha * 255);
    }
  }

  glyphCache = await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
  return glyphCache;
}

/**
 * Só o cacto, sem as estrelas nem os pontinhos.
 *
 * A arte tem 7 formas soltas e o cacto sozinho é 92,7% da tinta, então "maior
 * componente conectado" já separa os dois grupos sem precisar de recorte à
 * mão. Serve onde não há pixel pra gastar: a 16px a arte inteira vira um
 * borrão verde, e no badge de notificação as estrelas viram sujeira.
 */
let cactusCache;
async function cactusOnly() {
  if (cactusCache) return cactusCache;

  const { data, info } = await sharp(await glyph()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const inked = (i) => data[i * 4 + 3] > 76;

  const label = new Int32Array(width * height).fill(-1);
  const sizes = [];
  for (let seed = 0; seed < width * height; seed += 1) {
    if (!inked(seed) || label[seed] >= 0) continue;
    const id = sizes.length;
    const stack = [seed];
    label[seed] = id;
    let count = 0;
    while (stack.length) {
      const p = stack.pop();
      count += 1;
      const x = p % width;
      const y = (p - x) / width;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const q = ny * width + nx;
          if (inked(q) && label[q] < 0) {
            label[q] = id;
            stack.push(q);
          }
        }
      }
    }
    sizes.push(count);
  }
  const biggest = sizes.indexOf(Math.max(...sizes));

  const out = Buffer.from(data);
  for (let i = 0; i < width * height; i += 1) {
    if (label[i] !== biggest) out[i * 4 + 3] = 0;
  }

  cactusCache = await sharp(out, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
  return cactusCache;
}

/**
 * Um ícone de app: fundo verde ocupando tudo, com o cacto no centro.
 *
 * É a mesma estrutura dos ícones que existiam antes (retângulo da marca +
 * símbolo), e é o que todo sistema espera. Um PNG circular com os cantos
 * transparentes — que era o que estava indo — aparece como um adesivo
 * flutuando, porque o próprio sistema já desenha a forma do ícone.
 *
 * `radius` é a fração do lado: 0 deixa o quadrado inteiro, pra quando quem
 * recorta é o sistema.
 *
 * Composto sempre em 1024 e reduzido no fim — montar direto em 32px deixaria
 * tanto o canto arredondado quanto o cacto serrilhados.
 */
async function appIcon(size, { radius = 0.1875, scale = 0.62, art = glyph } = {}) {
  const CANVAS = 1024;
  const mark = await sharp(await art())
    .resize(Math.round(CANVAS * scale), Math.round(CANVAS * scale), {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}">` +
      `<rect width="${CANVAS}" height="${CANVAS}" rx="${CANVAS * radius}" fill="${MOSS}"/></svg>`,
  );

  // Dois pipelines, e não `.composite(...).resize(...)` em cadeia: o sharp
  // aplica o resize **antes** do composite, na ordem fixa dele e não na ordem
  // das chamadas. Encadeado, a base encolhe pra 32px antes de receber um cacto
  // de 635 e ele recusa compor. Reduzir só depois de montado também é o que
  // mantém o canto arredondado e o cacto limpos nos tamanhos pequenos.
  const composed = await sharp(background)
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();

  return sharp(composed).resize(size, size).png(png).toBuffer();
}

/**
 * Monta um .ico a partir de PNGs já codificados. O formato aceita PNG embutido
 * direto desde o Vista, que é o que todo navegador atual lê.
 *
 * Cabeçalho de 6 bytes, uma entrada de diretório de 16 bytes por tamanho, e
 * então os blobs. Largura/altura 0 significaria 256 — nenhum tamanho aqui
 * chega lá, mas o `% 256` deixa isso correto de graça.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // 1 = ícone
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size % 256, 0);
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt8(0, 2); // paleta: 0 = não usa tabela de cores do .ico
    entry.writeUInt8(0, 3); // reservado
    entry.writeUInt16LE(1, 4); // planos
    entry.writeUInt16LE(32, 6); // bits por pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function main() {
  // A logo completa (lockup com texto). Serve a dois donos: o <Image> da
  // ComingSoon, que o Next reprocessa sozinho, e a imagem de OpenGraph, que
  // crawler baixa crua — é esse segundo uso que manda no tamanho. 1200px é o
  // padrão das redes sociais e sobra pro render de 176px da página.
  await write('public/logo.png', await scaled(LOCKUP, 1200).png(png).toBuffer());

  // Favicon do navegador: 16 e 32 são o que a aba desenha; 48 entra pro
  // atalho de desktop do Windows.
  // Abaixo de 48px não há pixel pra arte inteira — a 16px ela empasta num
  // borrão. Esses tamanhos levam só o cacto, e maior, porque sem as estrelas
  // sobra espaço. Simplificar a marca conforme ela encolhe é o normal em
  // desenho de ícone, não uma inconsistência.
  const SMALL = { art: cactusOnly, scale: 0.72 };
  const ico = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      data: await appIcon(size, size < 48 ? SMALL : {}),
    })),
  );
  await write('public/favicon.ico', buildIco(ico));
  await write('public/icons/icon-32.png', await appIcon(32, SMALL));

  // `purpose: 'any'` — usado onde ninguém recorta (aba, alternador de apps,
  // splash). O canto arredondado vem no próprio arquivo.
  await write('public/icons/icon-192.png', await appIcon(192));
  await write('public/icons/icon-512.png', await appIcon(512));

  // iOS: aplica a própria máscara e não lê o manifest. Vai quadrado e opaco —
  // arredondar aqui daria canto arredondado duas vezes, e transparência o iOS
  // compõe em preto.
  await write('public/icons/apple-touch-icon.png', await appIcon(180, { radius: 0 }));

  // `purpose: 'maskable'` — quem recorta é o launcher do Android, em formato
  // que varia por fabricante. Fundo sangra até a borda e a marca fica menor:
  // só o círculo central de 80% do lado é garantido, e um símbolo quase
  // quadrado só cabe nele até 0,8/√2 ≈ 0,57 do lado.
  await write('public/icons/icon-maskable-192.png', await appIcon(192, { radius: 0, scale: 0.52 }));
  await write('public/icons/icon-maskable-512.png', await appIcon(512, { radius: 0, scale: 0.52 }));

  // Badge da notificação. O Android descarta a cor e desenha só o alpha, em
  // branco, com uns 24dp na barra de status — então vai o cacto sozinho, sem
  // fundo. Mandar o ícone colorido aqui, como estava, dá uma bolinha branca
  // sólida: o alpha dele é um disco cheio.
  await write(
    'public/icons/badge-96.png',
    await sharp(await cactusOnly())
      .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png(png)
      .toBuffer(),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
