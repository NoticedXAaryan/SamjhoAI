import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

const lockupSource = '/brand/samjho-ai-logo-transparent.png';
const markSource = '/brand/samjho-ai-mark-transparent.png';

export function BrandLogo({ compact = false, className, priority = false }: BrandLogoProps) {
  if (compact) {
    return (
      <span className={cn('relative block aspect-square shrink-0 overflow-hidden', className)}>
        <Image
          src={markSource}
          alt=""
          aria-hidden="true"
          fill
          sizes="64px"
          priority={priority}
          className="object-contain"
        />
      </span>
    );
  }

  return (
    <Image
      src={lockupSource}
      alt="Samjho AI"
      width={2048}
      height={768}
      priority={priority}
      className={cn('h-auto w-36', className)}
    />
  );
}
