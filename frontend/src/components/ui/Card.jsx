import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      'rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl text-white shadow-2xl',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';
