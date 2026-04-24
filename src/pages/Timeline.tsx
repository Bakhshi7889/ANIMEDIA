import React, { useEffect, useState } from "react";
import { getRecentlyWatched, type WatchProgress } from "../lib/storage";
import { Link } from "react-router-dom";
import { Play, Clock, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export default function Timeline() {
  const [history, setHistory] = useState<WatchProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const recent = await getRecentlyWatched(50);
        setHistory(recent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-24 px-4 md:px-8 max-w-5xl mx-auto mt-6">
        <div className="flex flex-col gap-2">
           <div className="w-64 h-10 bg-white/5 rounded-xl animate-pulse" />
           <div className="w-48 h-4 bg-white/5 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="bg-white/5 rounded-3xl h-32 border border-white/5 animate-pulse" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-24 px-4 md:px-8 max-w-5xl mx-auto mt-6">
      <header className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">Continue Watching</h1>
            <button 
              onClick={async () => {
                const { clearHistory } = await import('../lib/storage');
                await clearHistory();
                setHistory([]);
              }}
              className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider rounded border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Clear History
            </button>
          </div>
          <p className="text-[#959ca3] text-sm">Pick up exactly where you left off.</p>
      </header>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
           <Clock className="w-12 h-12 text-white/10" />
           <p className="text-white/30 font-medium">Your watch history is empty.</p>
           <Link to="/" className="text-sm text-yellow-400 hover:underline">Start exploring</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {history.map((item, idx) => (
            <Link 
              key={`${item.id}-${idx}`} 
              to={`/play/${item.mediaType}/${item.id}?resume=${Math.floor(item.currentTime)}&season=${item.season || 1}&episode=${item.episode || 1}`}
              className="group relative flex flex-col gap-3 p-4 bg-[#1a2226]/50 border border-white/5 rounded-3xl hover:bg-[#1a2226] transition-all hover:scale-[1.02]"
            >
              <div className="flex gap-4">
                <div className="relative w-32 aspect-video shrink-0 rounded-xl overflow-hidden shadow-xl border border-white/5">
                  <img src={`https://image.tmdb.org/t/p/w300${item.movieDetails.backdrop_path || item.movieDetails.poster_path}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-yellow-400 transition-colors uppercase tracking-tight">
                    {item.movieDetails.title || item.movieDetails.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                      {item.mediaType === 'tv' ? `S${item.season} E${item.episode}` : 'Movie'}
                    </span>
                    <span className="text-[10px] text-white/30">{Math.round(item.progress)}% Watched</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/40 self-center" />
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                 <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${item.progress}%` }} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
