import { motion } from 'motion/react';
import { useState } from 'react';
import { currentUser } from '../data/mockData';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { User, Shield, Zap, Heart, Box, Activity } from 'lucide-react';

interface ProfileViewProps {
  showToast: (msg: string) => void;
}

export default function ProfileView({ showToast }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'traits'>('stats');

  const tabs = [
    { id: 'stats', label: '状态', icon: Activity },
    { id: 'inventory', label: '物品', icon: Box },
    { id: 'traits', label: '特性', icon: Shield },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        <Avatar src={currentUser.avatar} alt={currentUser.name} size="xl" className="mb-4 ring-4 ring-white/10 shadow-2xl shadow-neon-purple/20" />
        
        <h1 className="text-3xl font-bold text-white tracking-tight">{currentUser.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" color="purple" className="text-[10px] px-2 py-0.5">
            {currentUser.gender}
          </Badge>
          <Badge variant="neon" color="pink" className="text-[10px] px-2 py-0.5">
            堕落度: {currentUser.corruption}%
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-[300px]"
      >
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap size={14} className="text-neon-blue" /> 临时状态
              </h3>
              <div className="space-y-2">
                {currentUser.tempStatuses.map((status) => (
                  <div key={status.name} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                    <span className="text-sm font-medium text-white">{status.name}</span>
                    <span className="text-xs text-gray-400">{status.effect}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Heart size={14} className="text-neon-pink" /> 淫纹
              </h3>
              <div className="space-y-3">
                {currentUser.tattoos.map((tattoo) => (
                  <div key={tattoo.name} className="relative group overflow-hidden rounded-lg bg-gradient-to-br from-neon-pink/10 to-transparent p-3 border border-neon-pink/20">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-bold text-neon-pink">{tattoo.name}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{tattoo.design}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="grid grid-cols-2 gap-3">
            {currentUser.inventory.map((item) => (
              <div key={item.name} className="glass-panel p-3 rounded-xl flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Box size={20} className="text-neon-blue" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{item.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1">{item.effect}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'traits' && (
          <div className="space-y-3">
             {currentUser.permTraits.map((trait) => (
               <div key={trait.name} className="glass-panel p-4 rounded-xl flex items-center gap-3 border-l-4 border-neon-purple">
                 <Shield size={20} className="text-neon-purple" />
                 <div>
                   <h4 className="text-sm font-bold text-white">{trait.name}</h4>
                   <p className="text-xs text-gray-400">永久角色特性</p>
                 </div>
               </div>
             ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
