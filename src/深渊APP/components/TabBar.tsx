import { Home, Users, Search, User } from 'lucide-react';
import { motion } from 'motion/react';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'home', icon: Home, label: '论坛' },
    { id: 'contacts', icon: Users, label: '联系人' },
    { id: 'discovery', icon: Search, label: '发现' },
    { id: 'profile', icon: User, label: '我的' },
  ];

  return (
    <div className="w-full h-[88px] glass-panel-dark border-t border-white/10 flex justify-around items-start pt-4 pb-8 px-2 relative z-50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 w-16 transition-colors duration-300 ${
              isActive ? 'text-neon-pink' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <tab.icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,0,85,0.5)]' : ''}`}
              />
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-pink rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
