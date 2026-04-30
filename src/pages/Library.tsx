import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFavorites, getRecentlyWatched, WatchProgress, getAllWatchList, WatchListItem } from "../lib/storage";
import { TMDBMovie } from "../services/tmdb";
import MovieCard from "../components/MovieCard";
import { Download, Play, Heart, Bookmark, Eye, Check } from "lucide-react";

export default function Library() {
  const [favorites, setFavorites] = useState<TMDBMovie[]>([]);
  const [watchList, setWatchList] = useState<WatchListItem[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<WatchProgress[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'plan_to_watch' | 'watching' | 'completed'>('favorites');

  useEffect(() => {
    async function loadLibrary() {
      try {
        const [favs, recent, wList] = await Promise.all([
          getFavorites(),
          getRecentlyWatched(20),
          getAllWatchList()
        ]);
        setFavorites(favs.reverse());
        setRecentlyWatched(recent);
        setWatchList(wList.reverse());
        
        try {
          const down = JSON.parse(localStorage.getItem('animedia_downloads') || "[]");
          setDownloads(down);
        } catch (e) {}
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 px-6 lg:px-12 py-8 max-w-7xl mx-auto">
        <header className="flex flex-col gap-2 relative z-10 pt-12">
          <div className="w-48 h-10 bg-white/5 rounded-xl animate-pulse" />
          <div className="w-64 h-4 bg-white/5 rounded-md animate-pulse" />
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] w-full bg-white/5 rounded-2xl animate-pulse" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-24 px-6 pt-12">
      {downloads.length > 0 && (
        <section className="flex flex-col gap-6 bg-blue-500/5 -mx-6 px-6 py-8 border-y border-blue-500/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white uppercase">Offline Vault</h2>
          </div>
          <div className="flex flex-col gap-3">
            {downloads.map((d, idx) => (
              <Link 
                key={idx} 
                to={d.type === 'movie' ? `/play/movie/${d.id}` : `/play/tv/${d.id}/${d.season}/${d.episode}`}
                className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all group"
              >
                <div className="flex items-center gap-4">
                   <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 relative bg-black">
                     <img src={d.poster} alt={d.title} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Play className="w-6 h-6 text-white fill-white" />
                     </div>
                   </div>
                   <div className="flex flex-col">
                     <h3 className="font-bold text-white text-lg">{d.title}</h3>
                     {d.type === 'tv' && (
                       <span className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">
                         Season {d.season} EP {d.episode}
                       </span>
                     )}
                     <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md">{d.quality}</span>
                       <span className="text-[10px] uppercase font-mono text-white/40">{d.size}</span>
                     </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-serif font-light">Your Lists</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'favorites' ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
            >
              <Heart className="w-4 h-4" /> Favorites
            </button>
            <button
              onClick={() => setActiveTab('plan_to_watch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'plan_to_watch' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
            >
              <Bookmark className="w-4 h-4" /> Plan to Watch
            </button>
            <button
              onClick={() => setActiveTab('watching')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'watching' ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
            >
              <Eye className="w-4 h-4" /> Watching
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'completed' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
            >
              <Check className="w-4 h-4" /> Completed
            </button>
          </div>
        </div>

        {/* Dynamic List Content */}
        {activeTab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div className="text-white/50 italic py-8 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-sm">
                You haven't added any favorites yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                {favorites.map((m, index) => (
                  <MovieCard key={m.id + '-' + index} movie={m} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab !== 'favorites' && (
          <>
            {watchList.filter(item => item.status === activeTab).length === 0 ? (
              <div className="text-white/50 italic py-8 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-sm">
                Your list is empty.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                {watchList.filter(item => item.status === activeTab).map((item, index) => (
                  <MovieCard key={item.id + '-' + index} movie={item.movie} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-8 mt-4">
        <div className="flex items-end justify-between border-t border-white/10 pt-12">
          <h2 className="text-3xl font-serif font-light">Recently Watched</h2>
        </div>
        {recentlyWatched.length === 0 ? (
          <div className="text-white/50 italic py-8 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-sm">
            Your watch history is empty.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
            {recentlyWatched.map((progressItem, index) => (
              <div key={progressItem.id + '-' + index} className="relative">
                <MovieCard movie={progressItem.movieDetails} />
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-white/10 rounded-full overflow-hidden z-10">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(0, progressItem.progress))}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
