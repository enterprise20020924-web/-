import { Heart, MessageSquare, Share2, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import Avatar from './Avatar';
import Badge from './Badge';

interface PostCardProps {
  post: {
    id: string;
    author: string;
    authorAvatar: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    tags: string[];
    isHot?: boolean;
  };
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-4 mb-4 relative overflow-hidden group hover:bg-white/10 transition-colors"
    >
      {/* Hot Badge */}
      {post.isHot && (
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-neon-pink to-transparent w-16 h-16 flex justify-end items-start p-2">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider rotate-45 translate-x-1 translate-y-1">HOT</span>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar src={post.authorAvatar} alt={post.author} size="md" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-white text-sm">{post.author}</h3>
              <span className="text-xs text-gray-400">{post.timestamp}</span>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          
          <p className="mt-2 text-sm text-gray-200 leading-relaxed font-light">
            {post.content}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map(tag => (
              <Badge key={tag} variant="ghost" color="blue" className="text-[10px] px-1.5 py-0.5 bg-neon-blue/10 rounded text-neon-blue">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-4 text-gray-400">
            <button className="flex items-center gap-1.5 hover:text-neon-pink transition-colors group/heart">
              <Heart size={16} className="group-hover/heart:fill-neon-pink transition-colors" />
              <span className="text-xs font-medium">{post.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-neon-blue transition-colors">
              <MessageSquare size={16} />
              <span className="text-xs font-medium">{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
