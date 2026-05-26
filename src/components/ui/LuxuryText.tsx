import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface LuxuryTextProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

export function LuxuryText({ children, className, as: Component = 'p' }: LuxuryTextProps) {
  return (
    <Component
      className={cn(
        'font-sans text-white tracking-[0.1em] uppercase antialiased',
        className
      )}
    >
      {children}
    </Component>
  );
}
