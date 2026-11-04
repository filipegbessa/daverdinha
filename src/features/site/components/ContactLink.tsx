"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type ContactLinkProps = Omit<ComponentProps<typeof Link>, "onClick" | "target"> & {
  channel: "whatsapp" | "instagram";
  /** Onde o botão está, pra separar as conversões por tela no GA. */
  location: string;
};

/**
 * Link pra um canal de contato que conta como conversão no GA.
 *
 * Um único evento (`contact_click`) pra todos os canais, com `channel` como
 * parâmetro: basta marcar esse evento como evento-chave no GA4 e o WhatsApp
 * e o Instagram contam juntos, sem precisar de uma conversão por canal.
 *
 * Mede o clique, não a conversa: quem clica e desiste no WhatsApp conta igual.
 * O link abre em outra aba, então a página continua viva pra o gtag mandar
 * o evento.
 */
export function ContactLink({ channel, location, ...props }: ContactLinkProps) {
  return (
    <Link
      {...props}
      target="_blank"
      onClick={() => window.gtag?.("event", "contact_click", { channel, location })}
    />
  );
}
