'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { TWEENS } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const variants = {
    default: 'bg-ink text-canvas hover:bg-ink/90',
    secondary: 'bg-ink/10 text-ink hover:bg-ink/20',
    outline: 'border border-border text-ink hover:bg-ink/5',
    ghost: 'text-ink hover:bg-ink/5',
  };

  const sizes = {
    sm: 'h-9 px-3 rounded-xl text-sm',
    md: 'h-10 py-2 px-4',
    lg: 'h-11 px-8 rounded-xl text-lg',
  };

  return (
    <motion.button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      transition={TWEENS.snappy}
      {...props}
    />
  );
}
