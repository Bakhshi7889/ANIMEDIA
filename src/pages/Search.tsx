import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, TrendingUp, Sparkles, Film, Tv, Ghost, User, Star, Clock, ArrowRight } from "lucide-react";
import { searchMedia, type TMDBMovie, getTrending, getAnime, getMovies, getTVShows, getHorror, getImageUrl } from "../services/tmdb";
import MovieCard from "../components/MovieCard";
import { MovieCardSkeleton } from "../components/Skeleton";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import CachedImage from "../components/CachedImage";

// A hook to use query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const QUICK_CATEGORIES = [
  { id: 'anime', label: 'Anime', icon: Sparkles, color: 'text-purple-400' },
  { id: 'movies', label: 'Movies', icon: Film, color: 'text-blue-400' },
  { id: 'tv', label: 'TV Shows', icon: Tv, color: 'text-emerald-400' },
  { id: 'horror', label: 'Horror', icon: Ghost, color: 'text-red-400' },
];

export default function Search() {
  const queryParam = useQuery().get("q") || "";
  const catParam = useQuery().get("cat") || null;
  const [query, setQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(catParam);
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [suggestions, setSuggestions] = useState<TMDBMovie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const searchInputRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Load trending initially
    getTrending('all').then(setTrending).catch(console.error);
    
    // Close suggestions on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      if (!selectedCategory) {
        setResults([]);
        if (location.pathname === "/search" && location.search) {
          navigate(`/search`, { replace: true });
        }
      }
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSelectedCategory(null);
      
      setLoading(true);
      try {
        const data = await searchMedia(query);
        setSuggestions(data.slice(0, 6)); // Top 6 for autocomplete
        setShowSuggestions(true);
        
        if (data.length === 0) setHasMore(false);
        else setHasMore(true);
        
        setResults(data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
        navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, navigate, selectedCategory]);

  const loadMoreSearch = async (q: string, p: number) => {
    setIsLoadingMore(true);
    
    try {
      const data = await searchMedia(q, p);
      if (data.length === 0) setHasMore(false);
      
      setResults(prev => {
        const combined = [...prev, ...data];
        return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCategoryClick = async (catId: string, p = 1, sort = "popularity.desc") => {
    if (p === 1) {
      setLoading(true);
      setQuery("");
      setShowSuggestions(false);
      setSelectedCategory(catId);
      setPage(1);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let data: TMDBMovie[] = [];
      switch (catId) {
        case 'anime': data = await getAnime(sort, p); break;
        case 'movies': data = await getMovies(sort, p); break;
        case 'tv': data = await getTVShows(sort, p); break;
        case 'horror': data = await getHorror(sort, p); break;
      }
      
      if (data.length === 0) setHasMore(false);

      if (p === 1) {
        setResults(data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i));
      } else {
        setResults(prev => {
          const combined = [...prev, ...data];
          return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (page > 1) {
      if (selectedCategory) {
        handleCategoryClick(selectedCategory, page);
      } else if (query) {
        loadMoreSearch(query, page);
      }
    }
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [hasMore, loading, isLoadingMore]);

  const isBrowsing = query || selectedCategory;
  const currentCategoryLabel = QUICK_CATEGORIES.find(c => c.id === selectedCategory)?.label;

  const animeSortLabels: Record<string, string> = {
    'popularity.desc': 'Most Popular',
    'vote_average.desc': 'Top Rated',
    'first_air_date.desc': 'Recently Released'
  };

  return (
    <div className="flex flex-col gap-10 px-6 py-8 min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col gap-6 items-center w-full">
        <div ref={searchInputRef} className="relative max-w-2xl w-full z-50">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-white/20" />
          </div>
          <input
            type="text"
            name="search"
            autoFocus
            placeholder="Search movies, anime, or people..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setShowSuggestions(true)}
            className="block w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-full text-white placeholder-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all text-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-3xl"
          />

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                className="absolute top-full left-0 right-0 mt-4 bg-[#111] border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl"
              >
                <div className="p-4 flex flex-col gap-1">
                  <div className="px-4 py-2 text-[10px] uppercase font-black tracking-widest text-white/20 border-b border-white/5 mb-2">Live Suggestions</div>
                  {suggestions.map((item, idx) => (
                    <Link
                      key={`${item.id}-${idx}`}
                      to={item.media_type === 'person' ? `/actor/${item.id}` : `/details/${item.media_type}/${item.id}`}
                      onClick={() => setShowSuggestions(false)}
                      className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all active:scale-95"
                    >
                      <div className="w-12 h-16 rounded-xl bg-[#222] overflow-hidden shrink-0 shadow-lg border border-white/5">
                        <CachedImage 
                          src={getImageUrl(item.poster_path || (item as any).profile_path, 'w92')} 
                          alt={item.title || item.name} 
                          type={item.media_type === 'person' ? 'character' : 'movie'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-[var(--color-accent)] transition-colors truncate">
                          {item.title || item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-white/40 uppercase tracking-wider">
                          <span className={cn("px-1.5 py-0.5 rounded-sm bg-white/5", item.media_type === 'person' ? "text-orange-400" : "text-white/60")}>
                            {item.media_type}
                          </span>
                          {item.media_type !== 'person' && (
                             <>
                               <div className="flex items-center gap-0.5 text-yellow-500">
                                 <Star className="w-3 h-3 fill-current" /> {item.vote_average?.toFixed(1)}
                               </div>
                               <span>{item.release_date?.substring(0,4) || item.first_air_date?.substring(0,4)}</span>
                             </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                  <div className="p-2 pt-4 flex justify-center">
                    <button 
                      onClick={() => { setShowSuggestions(false); navigate(`/search?q=${encodeURIComponent(query)}`); }}
                      className="text-[10px] uppercase font-black tracking-widest text-[var(--color-accent)] hover:opacity-100 opacity-60 transition-opacity"
                    >
                      View all results &rarr;
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!query && (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
              {QUICK_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-6 py-3 border rounded-full transition-all group active:scale-95",
                    selectedCategory === cat.id 
                      ? "bg-white border-white text-black" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                  )}
                >
                  <cat.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", selectedCategory === cat.id ? "text-black" : cat.color)} />
                  <span className="text-sm font-bold transition-colors">{cat.label}</span>
                </button>
              ))}
            </div>

            {selectedCategory === 'anime' && (
               <div className="flex flex-wrap justify-center gap-2 animate-in fade-in zoom-in duration-500">
                  {Object.entries(animeSortLabels).map(([val, label]) => (
                    <button 
                      key={val}
                      onClick={() => { setLoading(true); getAnime(val).then(setResults).finally(() => setLoading(false)); }}
                      className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-all active:scale-90"
                    >
                      {label}
                    </button>
                  ))}
               </div>
            )}

            {(selectedCategory && selectedCategory !== 'anime') && (
               <div className="flex flex-wrap justify-center gap-2 animate-in fade-in zoom-in duration-500">
                  {Object.entries(animeSortLabels).map(([val, label]) => (
                    <button 
                      key={val}
                      onClick={async () => {
                        setLoading(true);
                        try {
                           if (selectedCategory === 'movies') setResults(await getMovies(val));
                           if (selectedCategory === 'tv') setResults(await getTVShows(val));
                           if (selectedCategory === 'horror') setResults(await getHorror(val));
                        } finally {
                           setLoading(false);
                        }
                      }}
                      className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white transition-all active:scale-90"
                    >
                      {label}
                    </button>
                  ))}
               </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 mt-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : isBrowsing && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-20">
            <SearchIcon className="w-16 h-16 mb-4 stroke-[0.5]" />
            <h2 className="text-2xl font-light">Echos of "{query || currentCategoryLabel}" not found</h2>
          </div>
        ) : isBrowsing ? (
          <div className="flex flex-col gap-6">
            {selectedCategory && (
              <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--color-accent)] animate-in fade-in slide-in-from-left-2 duration-500">
                Browsing {currentCategoryLabel} Collections
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10 animate-in fade-in duration-500">
              {results.map((m, index) => (
                <MovieCard key={m.id + '-' + (m.media_type || 'movie') + '-' + index} movie={m} />
              ))}
            </div>
            {hasMore && (
              <div ref={loadMoreRef} className="py-12 flex justify-center w-full">
                {isLoadingMore && (
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-10 mt-4 animate-in fade-in duration-1000">
             <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                   <TrendingUp className="w-4 h-4 text-emerald-400" />
                 </div>
                 <h2 className="text-xl font-bold text-white tracking-tight uppercase">Trending Sensations</h2>
               </div>
               <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/5 px-3 py-1 rounded-full">Updated Daily</span>
             </div>
             
             {trending.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                 {trending.map((m, index) => (
                   <MovieCard key={m.id + '-' + (m.media_type || 'movie') + '-' + index} movie={m} />
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                 {Array.from({ length: 12 }).map((_, i) => (
                   <MovieCardSkeleton key={i} />
                 ))}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
