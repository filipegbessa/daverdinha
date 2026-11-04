import Image from 'next/image';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

type ImagePlaceholderProps = {
  /** Real photo path, once one exists. Omitted renders a styled placeholder instead. */
  src?: string;
  alt: string;
  className?: string;
  /** Largura que a imagem ocupa na tela — um card de grade é bem menor que meia tela. */
  sizes?: string;
  priority?: boolean;
};

export function ImagePlaceholder({
  src,
  alt,
  className,
  sizes = '(min-width: 768px) 50vw, 100vw',
  priority,
}: ImagePlaceholderProps) {
  if (src) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-moss/15 via-sand to-berry/10',
        className,
      )}
    >
      <Sprout className="size-12 text-moss/50" strokeWidth={1.5} />
    </div>
  );
}
