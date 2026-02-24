import { motion } from 'motion/react';
import { useState } from 'react';
import React from 'react';
import StatusBar from './StatusBar';
import TabBar from './TabBar';
import GameHeader from './GameHeader';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-abyss-dark p-4 sm:p-8">
      {/* iPhone Frame */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[400px] h-[850px] bg-black rounded-[55px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-[8px] border-gray-900 overflow-hidden flex flex-col"
      >
        {/* Screen Content */}
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-abyss-black via-abyss-dark to-abyss-gray overflow-hidden rounded-[48px]">
          
          {/* Status Bar */}
          <StatusBar />
          
          {/* Game Header (Date/Location) */}
          <GameHeader location="Neo-Tokyo, Sector 4" date="2045.09.12" time="23:42" />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide pb-24">
            {children}
          </main>

          {/* Tab Bar (Fixed Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 z-50">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-[60]" />
        </div>
        
        {/* Reflection/Glare Overlay */}
        <div className="absolute inset-0 rounded-[55px] pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent z-[70]" />
      </motion.div>
    </div>
  );
}
