import { motion } from 'motion/react';
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'neon' | 'outline' | 'ghost';
  color?: 'pink' | 'purple' | 'blue' | 'gold' | 'gray';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', color = 'gray', className = '' }) => {
  const colors = {
    pink: 'text-neon-pink border-neon-pink/30 bg-neon-pink/10',
    purple: 'text-neon-purple border-neon-purple/30 bg-neon-purple/10',
    blue: 'text-neon-blue border-neon-blue/30 bg-neon-blue/10',
    gold: 'text-gold border-gold/30 bg-gold/10',
    gray: 'text-gray-300 border-white/10 bg-white/5'
  };

  const variants = {
    default: `${colors[color]} border`,
    neon: `${colors[color]} border shadow-[0_0_8px_rgba(var(--color-${color}),0.3)]`,
    outline: `border ${colors[color].split(' ')[1]} text-${color === 'gray' ? 'white' : `neon-${color}`}`,
    ghost: `${colors[color].split(' ')[0]} bg-transparent`
  };

  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
