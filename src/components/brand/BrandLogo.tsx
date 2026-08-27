import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

const logoSource = '/brand/samjho-ai-logo-eclipse-ui.png';

export function BrandLogo({ compact = false, className, priority = false }: BrandLogoProps) {
  if (compact) {
    return (
      <span className={cn('relative block aspect-square shrink-0 overflow-hidden', className)}>
        <Image
          src={logoSource}
          alt=""
          aria-hidden="true"
          width={2048}
          height={768}
          priority={priority}
          className="h-full w-auto max-w-none"
        />
      </span>
    );
  }

  return (
    <Image
      src={logoSource}
      alt="Samjho AI"
      width={2048}
      height={768}
      priority={priority}
      className={cn('h-auto w-36', className)}
    />
  );
}
