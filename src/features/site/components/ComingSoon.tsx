import Image from "next/image";
import Link from "next/link";
import { AtSign, MapPin, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { businessInfo } from "@/data/business";
import { getWhatsAppUrl } from "@/features/site/lib/whatsapp";
import { Eyebrow } from "@/features/site/components/Eyebrow";

/**
 * A landing que `/` mostra enquanto `SITE_MODE` não for 'full'.
 *
 * Só entra aqui informação que já é verdade confirmada sobre o negócio —
 * logo, frase, endereço, WhatsApp, Instagram. Nada de placeholder: o motivo
 * de esconder o site institucional é justamente ele ainda ter placeholders.
 * Não há e-mail porque o negócio não tem um; um `mailto:` inventado seria
 * um canal de contato que ninguém lê.
 */
export function ComingSoon() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Image
        src="/logo.png"
        alt="Daverdinha — Ateliê de Plantas"
        width={176}
        height={176}
        priority
        className="size-36 rounded-full shadow-soft md:size-44"
      />

      <div className="max-w-md">
        <Eyebrow>Em breve</Eyebrow>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-ink md:text-4xl">
          Nosso site está chegando
        </h1>
        <p className="mt-3 text-ink-soft">{businessInfo.description}</p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href={getWhatsAppUrl("Oi! Vim pelo site da Daverdinha 🌱")}
          target="_blank"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "gap-2 rounded-full bg-moss shadow-card transition-shadow hover:bg-moss/90 hover:shadow-soft",
          )}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Falar no WhatsApp
        </Link>
        <Link
          href={businessInfo.contact.instagram.url}
          target="_blank"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "gap-2 rounded-full border-moss-line text-ink hover:bg-moss/10",
          )}
        >
          <AtSign className="size-4 text-moss" aria-hidden="true" />
          {businessInfo.contact.instagram.handle}
        </Link>
      </div>

      <p className="flex max-w-sm items-center justify-center gap-1.5 text-sm text-ink-soft">
        <MapPin
          className="size-4 shrink-0 text-berry"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        {businessInfo.address.formatted}
      </p>

      <div className="mt-4 flex flex-col items-center gap-1 border-t border-moss-line pt-6 text-xs text-ink-soft">
        <Link
          href="/politica-de-privacidade"
          className="underline underline-offset-4"
        >
          Política de Privacidade
        </Link>
        <p>
          © {new Date().getFullYear()} Daverdinha · CNPJ{" "}
          {businessInfo.legal.cnpj}
        </p>
      </div>
    </main>
  );
}
