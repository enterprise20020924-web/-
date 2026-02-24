import { motion } from 'motion/react';
import { discoveryPeople } from '../data/mockData';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { MapPin } from 'lucide-react';

interface DiscoveryViewProps {
  showToast: (msg: string) => void;
}

export default function DiscoveryView({ showToast }: DiscoveryViewProps) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white mb-6 px-2">附近的人</h2>

      <div className="grid grid-cols-1 gap-4">
        {discoveryPeople.map((person) => (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-neon-blue/10 px-3 py-1 rounded-bl-xl text-[10px] font-medium text-neon-blue flex items-center gap-1">
              <MapPin size={10} />
              {person.distance}
            </div>

            <div className="flex gap-4">
              <Avatar src={person.avatar} alt={person.name} size="lg" className="border-2 border-neon-blue/30" />
              
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-bold text-lg text-white">{person.name}</h3>
                <p className="text-xs text-neon-blue mb-1">{person.identity} • {person.location}</p>
                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {person.currentStatus}
                </p>
                
                <div className="bg-black/40 rounded-lg p-2 mb-3 border-l-2 border-neon-purple">
                  <p className="text-xs text-gray-300 italic">"{person.thoughts}"</p>
                </div>

                <div className="space-y-1">
                  {person.coreSkills.map(skill => (
                    <div key={skill.name} className="bg-white/5 p-2 rounded text-xs">
                      <span className="text-red-400 font-medium block">{skill.name}</span>
                      <span className="text-gray-400 text-[10px]">{skill.effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => showToast('已忽略该用户')}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium py-2 rounded-lg transition-colors"
              >
                忽略
              </button>
              <button 
                onClick={() => showToast('连接请求已发送')}
                className="flex-1 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/30 text-neon-blue text-xs font-medium py-2 rounded-lg transition-colors shadow-[0_0_10px_rgba(0,204,255,0.1)]"
              >
                连接
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
