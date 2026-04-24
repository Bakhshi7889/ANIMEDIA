import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useComments, addComment, signInWithGoogle } from '../lib/firebase';
import { MessageSquare, Send, LogIn, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveChatProps {
  mediaId: string; // e.g. "movie_123" or "tv_123_s1_e1"
  currentTimeMs: number; // Approximate playback time from wrapper, if available
}

export default function LiveChat({ mediaId, currentTimeMs }: LiveChatProps) {
  const { user, loading } = useAuth();
  const comments = useComments(mediaId);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new comments
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !mediaId) return;
    
    setSubmitting(true);
    setError(null);
    try {
      await addComment(mediaId, user, text.trim(), currentTimeMs || 0);
      setText('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (ms: number) => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[500px] xl:h-full w-full bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
      <div className="px-4 py-3 border-b border-white/5 bg-[#1a2226]/50 flex items-center justify-between shrink-0">
         <h3 className="font-bold text-white flex items-center gap-2">
           <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" /> Live Chat
         </h3>
         <span className="text-xs font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded-md">{comments.length}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2">
            <MessageSquare className="w-8 h-8 opacity-50" />
            <p className="text-sm">No comments yet. Be the first!</p>
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="flex gap-3 items-start animate-fade-in group">
              {c.userPhoto ? (
                <img src={c.userPhoto} alt={c.userName} className="w-8 h-8 rounded-full bg-white/5 shrink-0 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] flex items-center justify-center font-bold text-xs shrink-0 border border-[var(--color-accent)]/30">
                  {c.userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col group-hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/80">{c.userName}</span>
                  <span className="text-[10px] text-white/30 font-medium whitespace-nowrap bg-black/20 px-1.5 py-0.5 rounded-sm">
                    {formatTimestamp(c.videoTimeMs)}
                  </span>
                  <span className="text-[10px] text-white/20 whitespace-nowrap hidden group-hover:inline-block transition-opacity opacity-50">
                     {c.createdAt ? formatDistanceToNow(c.createdAt, { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-white/90 leading-snug mt-0.5 break-words">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-[#1a2226]/50 border-t border-white/5 shrink-0">
        {loading ? (
          <div className="h-10 animate-pulse bg-white/5 rounded-xl w-full" />
        ) : user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {error && (
              <div className="text-red-400 text-xs flex items-center gap-1.5 bg-red-400/10 p-2 rounded-lg">
                <AlertCircle className="w-3 h-3 shrink-0" /> {error}
              </div>
            )}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full p-1 pl-4 focus-within:border-[var(--color-accent)] transition-colors">
              <input 
                type="text" 
                placeholder="Say something..." 
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={submitting}
                maxLength={500}
              />
              <button 
                type="submit" 
                disabled={submitting || !text.trim()}
                className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-black flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30 transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2.5 rounded-full transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign in with Google to Chat
          </button>
        )}
      </div>
    </div>
  );
}
