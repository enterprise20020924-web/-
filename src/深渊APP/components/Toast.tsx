import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
        >
          <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
          <span className="text-sm font-medium text-white">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
