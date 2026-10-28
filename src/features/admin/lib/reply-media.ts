/**
 * Espelham os limites do backend (`MEDIA_RULES` na API), que continua sendo
 * quem decide. Aqui é só para o operador descobrir o problema antes de subir
 * o arquivo e só então ouvir um não.
 */
export const REPLY_MEDIA_RULES = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 5 * 1024 * 1024,
    tooLarge: 'A imagem excede o limite de 5 MB.',
  },
  audio: {
    // Exatamente o que a Cloud API do WhatsApp aceita. `audio/webm` — o que o
    // Chrome grava por padrão — fica de fora porque a Meta recusa.
    mimeTypes: ['audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/amr'],
    maxBytes: 16 * 1024 * 1024,
    tooLarge: 'O áudio excede o limite de 16 MB.',
  },
} as const;

export type ReplyMediaKind = keyof typeof REPLY_MEDIA_RULES;

export const ACCEPTED_REPLY_TYPES = [
  ...REPLY_MEDIA_RULES.image.mimeTypes,
  ...REPLY_MEDIA_RULES.audio.mimeTypes,
  // O seletor de arquivo do macOS e do Windows reporta estes nomes não
  // padronizados para .m4a/.aac/.mp3; `normalizeMimeType` os traduz.
  'audio/x-m4a',
  'audio/x-aac',
  'audio/mp3',
].join(',');

const MIME_ALIASES: Record<string, string> = {
  'audio/x-m4a': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/x-aac': 'audio/aac',
  'audio/mp3': 'audio/mpeg',
};

/** `audio/ogg; codecs=opus` → `audio/ogg`, e os apelidos acima no nome certo. */
export function normalizeMimeType(mimeType: string): string {
  const base = mimeType.split(';')[0].trim().toLowerCase();
  return MIME_ALIASES[base] ?? base;
}

export type ReplyAttachment = { kind: ReplyMediaKind; file: File };

/**
 * Decide se o arquivo pode ser enviado e por qual rota. Quando o tipo
 * precisou de tradução, devolve uma cópia do arquivo já com o tipo que o
 * backend reconhece — o `type` de um `File` não muda depois de criado, e é ele
 * que vira o `Content-Type` da parte no multipart.
 */
export function classifyReplyFile(file: File): ReplyAttachment | { error: string } {
  const mimeType = normalizeMimeType(file.type);
  const kind = (Object.keys(REPLY_MEDIA_RULES) as ReplyMediaKind[]).find((k) =>
    (REPLY_MEDIA_RULES[k].mimeTypes as readonly string[]).includes(mimeType),
  );
  if (!kind) {
    return { error: 'Só imagem (JPEG, PNG ou WebP) ou áudio (OGG, MP3, M4A, AAC ou AMR).' };
  }
  if (file.size > REPLY_MEDIA_RULES[kind].maxBytes) {
    return { error: REPLY_MEDIA_RULES[kind].tooLarge };
  }
  const normalized = mimeType === file.type ? file : new File([file], file.name, { type: mimeType });
  return { kind, file: normalized };
}
