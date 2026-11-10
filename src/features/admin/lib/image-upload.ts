/**
 * Os limites de imagem que a API aplica nas fotos de produto e nas imagens
 * enviadas na conversa (os mesmos nos dois lugares). Conferir aqui só poupa
 * a cliente de esperar o upload pra descobrir o erro; quem decide é a API.
 */
export const IMAGE_UPLOAD = {
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxBytes: 5 * 1024 * 1024,
  /** Pra mensagem: "5 MB". */
  maxLabel: '5 MB',
  /** Pra mensagem: "JPEG, PNG ou WebP". */
  typesLabel: 'JPEG, PNG ou WebP',
} as const;
