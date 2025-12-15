import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  animation?: 'fade-in-up' | 'fade-in' | 'scale-in' | 'slide-in-left' | 'slide-in-right' | 'blur-in';
  hover?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, delay = 0, animation = 'fade-in-up', hover = true, style, ...props }, forwardedRef) => {
    const [scrollRef, isVisible] = useScrollAnimation<HTMLDivElement>();

    return (
      <div
        ref={(node) => {
          // Handle both refs
          (scrollRef as any).current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        className={cn(
          'transition-all duration-500 ease-out',
          hover && 'card-hover',
          isVisible ? `animate-${animation}` : 'opacity-0 translate-y-4',
          className
        )}
        style={{
          ...style,
          animationDelay: `${delay}s`,
          animationFillMode: 'forwards',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
