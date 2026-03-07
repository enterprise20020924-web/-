import { Battery, Signal, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export default function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full px-6 py-2 flex justify-between items-center text-xs font-medium text-white select-none z-50 relative">
      <div className="flex items-center gap-2 w-20">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      
      {/* Dynamic Island Area */}
      <motion.div 
        initial={{ width: 100, height: 28 }}
        className="bg-black rounded-full flex items-center justify-center px-3 absolute left-1/2 -translate-x-1/2 top-2"
      >
        <div className="w-16 h-4 bg-black rounded-full" />
      </motion.div>

      <div className="flex items-center gap-1.5 w-20 justify-end">
        <Signal size={14} strokeWidth={2.5} />
        <Wifi size={14} strokeWidth={2.5} />
        <Battery size={18} strokeWidth={2.5} />
      </div>
    </div>
  );
}
