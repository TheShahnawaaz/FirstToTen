import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
  const variants = {
    primary: 'bg-white text-black hover:bg-zinc-200 border border-transparent shadow-sm',
    secondary: 'bg-zinc-900 text-white hover:bg-zinc-800 border border-white/10',
    ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5',
    danger: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20'
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8 text-lg font-medium',
    icon: 'h-10 w-10 p-2 flex items-center justify-center'
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50 select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
