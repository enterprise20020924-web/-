import { MapPin, Calendar, Clock } from 'lucide-react';

interface GameHeaderProps {
  location: string;
  date: string;
  time: string;
}

export default function GameHeader({ location, date, time }: GameHeaderProps) {
  return (
    <div className="w-full px-6 py-4 flex justify-between items-center text-white/80 border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm z-40 sticky top-0">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neon-blue tracking-wider uppercase">
          <MapPin size={12} />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-light text-white/60">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{time}</span>
          </div>
        </div>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink p-[1px]">
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">LV.5</span>
        </div>
      </div>
    </div>
  );
}
