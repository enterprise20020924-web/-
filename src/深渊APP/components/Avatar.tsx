import { motion } from 'motion/react';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export default function Avatar({ src, alt, size = 'md', status, className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    busy: 'bg-red-500'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/10 shadow-lg`}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </motion.div>
      {status && (
        <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-black ${statusColors[status]}`} />
      )}
    </div>
  );
}
