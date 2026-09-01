import Image from 'next/image';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

type ImagePlaceholderProps = {
  /** Real photo path, once one exists. Omitted renders a styled placeholder instead. */
  src?: string;
  alt: string;
  className?: string;
};

export function ImagePlaceholder({ src, alt, className }: ImagePlaceholderProps) {
  if (src) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Image src={src} alt={alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
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
