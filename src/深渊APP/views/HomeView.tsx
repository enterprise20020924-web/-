import { motion } from 'motion/react';
import { useState } from 'react';
import { forumPosts } from '../data/mockData';
import PostCard from '../components/PostCard';

interface HomeViewProps {
  showToast: (msg: string) => void;
}

export default function HomeView({ showToast }: HomeViewProps) {
  const [posts, setPosts] = useState(forumPosts);

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="搜索深渊论坛..." 
          className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 transition-all"
          onKeyDown={(e) => e.key === 'Enter' && showToast('搜索功能暂不可用')}
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center py-4">
        <button className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-widest font-medium">
          加载更多
        </button>
      </div>
    </div>
  );
}
