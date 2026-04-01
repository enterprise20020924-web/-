import { motion } from 'motion/react';
import { useState } from 'react';
import { contacts } from '../data/mockData';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { Zap, Shield, Heart, Box, Sparkles, Flame } from 'lucide-react';

interface ContactsViewProps {
  showToast: (msg: string) => void;
}

export default function ContactsView({ showToast }: ContactsViewProps) {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white mb-6 px-2">联系人</h2>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            onClick={() => setSelectedContact(contact.id)}
            className="glass-panel rounded-xl p-3 flex items-center gap-4 cursor-pointer transition-colors group"
          >
            <Avatar src={contact.avatar} alt={contact.name} size="md" status={contact.isOnline ? 'online' : 'offline'} />
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-white truncate">{contact.name}</h3>
                <span className="text-[10px] text-gray-500">{contact.lastSeen}</span>
              </div>
              
              <p className="text-xs text-gray-400 truncate italic">"{contact.quote}"</p>
              
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" color="purple" className="text-[9px] px-1.5 py-0.5">
                  堕落: {contact.corruption}%
                </Badge>
                <Badge variant="outline" color="pink" className="text-[9px] px-1.5 py-0.5">
                  好感: {contact.affection}%
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal for Contact Details */}
      {selectedContact && (() => {
        const contact = contacts.find(c => c.id === selectedContact);
        if (!contact) return null;
        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-abyss-gray border border-white/10 rounded-2xl w-full max-w-sm p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedContact(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
              >
                ✕
              </button>
              
              <div className="text-center mb-6 shrink-0">
                <Avatar 
                  src={contact.avatar} 
                  alt="Avatar" 
                  size="xl" 
                  className="mx-auto mb-4 border-4 border-neon-purple/20"
                />
                <h2 className="text-2xl font-bold text-white">{contact.name}</h2>
                <p className="text-sm text-neon-pink mt-1">"{contact.quote}"</p>
                
                <div className="flex justify-center gap-2 mt-3">
                  <Badge variant="outline" color="purple" className="text-[10px] px-2 py-0.5">
                    堕落度: {contact.corruption}%
                  </Badge>
                  <Badge variant="outline" color="pink" className="text-[10px] px-2 py-0.5">
                    好感度: {contact.affection}%
                  </Badge>
                </div>
              </div>

              <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {/* 临时状态 */}
                {contact.tempStatuses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-neon-blue uppercase tracking-wider mb-2 flex items-center gap-1"><Zap size={12}/> 临时状态</h4>
                    <div className="space-y-1">
                      {contact.tempStatuses.map(s => (
                        <div key={s.name} className="bg-white/5 p-2 rounded text-xs flex justify-between items-center">
                          <span className="text-white font-medium">{s.name}</span>
                          <span className="text-gray-400 text-[10px]">{s.effect}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 永久特性 */}
                {contact.permTraits.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-neon-purple uppercase tracking-wider mb-2 flex items-center gap-1"><Shield size={12}/> 永久特性</h4>
                    <div className="flex flex-wrap gap-2">
                      {contact.permTraits.map(t => (
                        <Badge key={t.name} color="purple">{t.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 淫纹 */}
                {contact.tattoos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-neon-pink uppercase tracking-wider mb-2 flex items-center gap-1"><Heart size={12}/> 淫纹</h4>
                    <div className="space-y-2">
                      {contact.tattoos.map(t => (
                        <div key={t.name} className="bg-neon-pink/5 border border-neon-pink/20 p-2 rounded text-xs">
                          <span className="text-neon-pink font-medium block mb-1">{t.name}</span>
                          <span className="text-gray-300">{t.design}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 堕落物品 */}
                {contact.corruptedItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-1"><Box size={12}/> 堕落物品</h4>
                    <div className="space-y-1">
                      {contact.corruptedItems.map(i => (
                        <div key={i.name} className="bg-white/5 p-2 rounded text-xs">
                          <span className="text-gold font-medium block">{i.name}</span>
                          <span className="text-gray-400">{i.effect}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 妆容 */}
                {contact.makeup.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-neon-blue uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles size={12}/> 妆容</h4>
                    <div className="space-y-1">
                      {contact.makeup.map(m => (
                        <div key={m.name} className="bg-white/5 p-2 rounded text-xs">
                          <span className="text-white font-medium block">{m.name}</span>
                          <span className="text-gray-400">{m.style}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 核心技能 */}
                {contact.coreSkills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Flame size={12}/> 核心技能</h4>
                    <div className="space-y-1">
                      {contact.coreSkills.map(s => (
                        <div key={s.name} className="bg-red-500/10 border border-red-500/20 p-2 rounded text-xs">
                          <span className="text-red-400 font-medium block">{s.name}</span>
                          <span className="text-gray-300">{s.effect}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button className="w-full mt-4 shrink-0 bg-neon-purple hover:bg-neon-pink text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-neon-purple/20" onClick={() => showToast('消息已发送')}>
                发送消息
              </button>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
