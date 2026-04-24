import React, { useEffect, useState } from "react";
import { getTrending, getDetails, type TMDBMovie, getImageUrl } from "../services/tmdb";
import MovieCard from "../components/MovieCard";
import { getRecentlyWatched, type WatchProgress } from "../lib/storage";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton, MovieCardSkeleton } from "../components/Skeleton";
import CachedImage from "../components/CachedImage";

export default function Home() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<WatchProgress[]>([]);
  const [heroTrailer, setHeroTrailer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const carouselRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [trendingData, recentData] = await Promise.all([
          getTrending('all'),
          getRecentlyWatched(10)
        ]);
        const uniqueTrending = trendingData.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setMovies(uniqueTrending);
        setRecentlyWatched(recentData);
      } catch (err: any) {
        setError(err.message || "Failed to load trending items");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function fetchHeroTrailer() {
       if (movies.length > 0 && movies[activeHeroIndex]) {
           const heroMovie = movies[activeHeroIndex];
           setHeroTrailer(null);
           try {
             const heroDetails = await getDetails(heroMovie.id.toString(), (heroMovie.media_type || 'movie') as any);
             if (heroDetails.videos?.results) {
               const ytTrailer = heroDetails.videos.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') 
               || heroDetails.videos.results.find((v: any) => v.site === 'YouTube');
               
               if (ytTrailer) {
                  setHeroTrailer(ytTrailer.key);
               }
             }
           } catch {
             // Silently ignore
           }
       }
    }
    fetchHeroTrailer();
  }, [movies, activeHeroIndex]);

  useEffect(() => {
     if (movies.length === 0) return;
     const interval = setInterval(() => {
        setActiveHeroIndex((prev) => {
           const next = (prev + 1) % Math.min(6, movies.length);
           if (carouselRef.current) {
               const container = carouselRef.current;
               const child = container.children[next] as HTMLElement;
               if (child) {
                   container.scrollTo({ left: child.offsetLeft - container.offsetWidth / 2 + child.offsetWidth / 2, behavior: 'smooth' });
               }
           }
           return next;
        });
     }, 10000); 
     
     return () => clearInterval(interval);
  }, [movies.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let minDistance = Infinity;
    
    Array.from(container.children).forEach((child: any, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(center - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closest = index;
      }
    });
    
    if (closest !== activeHeroIndex) setActiveHeroIndex(closest);
  };

  const handleNextBtn = () => {
      setActiveHeroIndex((prev) => (prev + 1) % Math.min(6, movies.length));
  };

  const handlePrevBtn = () => {
      setActiveHeroIndex((prev) => (prev - 1 + Math.min(6, movies.length)) % Math.min(6, movies.length));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-10 lg:px-0">
         <div className="hidden lg:block h-[65vh] w-full rounded-[2.5rem] bg-white/5 animate-pulse" />
         <div className="lg:hidden h-[45vh] w-full bg-white/5 animate-pulse" />
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-6 lg:px-0">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[2/3] w-full bg-white/5 rounded-2xl animate-pulse" />)}
         </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
           <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">Terminal Error</h2>
        <p className="text-white/40 max-w-sm mb-8">{error}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[var(--color-accent)] text-black font-bold rounded-full hover:scale-105 transition-transform active:scale-95">Reinitialize</button>
      </div>
    );
  }

  const heroMovie = movies[activeHeroIndex];
  const CATEGORIES = ["Trending", "Anime", "Action", "Horror", "Sci-Fi", "Comedy"];

  return (
    <div className="flex flex-col gap-12 pb-32">
      {/* Desktop Hero Section */}
      <section className="hidden lg:block relative w-full h-[65vh] rounded-[2.5rem] overflow-hidden shrink-0 border border-white/5 bg-black group/hero">
        <AnimatePresence mode="wait">
           {heroMovie && (
             <motion.div 
               key={heroMovie.id}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 1.2 }}
               className="absolute inset-0"
             >
                {heroTrailer ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${heroTrailer}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroTrailer}&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1`}
                    className="absolute top-1/2 left-1/2 w-[250%] h-[150%] -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
                    title="Hero Trailer"
                  />
                ) : (
                  <CachedImage 
                    src={getImageUrl(heroMovie.backdrop_path, 'w1280')}
                    alt="Hero"
                    type="movie"
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
             </motion.div>
           )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1518] via-[#0e1518]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e1518]/60 via-transparent to-transparent hidden lg:block" />
        
        {/* Navigation */}
        <button onClick={handlePrevBtn} className="absolute left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-all hover:bg-black/60 hover:scale-110 active:scale-90">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button onClick={handleNextBtn} className="absolute right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-all hover:bg-black/60 hover:scale-110 active:scale-90">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>

        {/* Hero Info */}
        <div className="absolute bottom-12 left-12 right-12 flex items-end justify-between z-20">
           <motion.div 
             key={heroMovie?.id}
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.2, duration: 0.8 }}
             className="flex flex-col gap-4 max-w-2xl"
           >
              <div className="flex items-center gap-2">
                 <span className="px-3 py-1 bg-[var(--color-accent)] text-black text-[10px] font-black uppercase tracking-widest rounded-md">Trending</span>
                 <span className="text-white/60 text-sm font-bold tracking-tight">{heroMovie?.release_date?.substring(0,4) || heroMovie?.first_air_date?.substring(0,4)}</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tighter leading-[0.9] uppercase drop-shadow-2xl">
                {heroMovie?.title || heroMovie?.name}
              </h1>
              <p className="text-white/60 text-lg line-clamp-2 max-w-xl font-medium mt-2">
                {heroMovie?.overview}
              </p>
              <div className="flex items-center gap-4 mt-6">
                 <Link 
                   to={`/details/${heroMovie?.media_type || 'movie'}/${heroMovie?.id}`}
                   className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-full hover:scale-105 transition-transform active:scale-95 shadow-2xl"
                 >
                   Details
                 </Link>
                 <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0e1518] bg-white/10 backdrop-blur-md" />)}
                    </div>
                    <span className="text-xs text-white/40 font-bold uppercase tracking-wider">+400 active</span>
                 </div>
              </div>
           </motion.div>

           {/* Carousel Indicators */}
           <div className="flex items-center gap-3 mb-4">
              {movies.slice(0, 6).map((_, idx) => (
                  <button 
                     key={idx} 
                     onClick={() => setActiveHeroIndex(idx)}
                     className={cn("h-1 rounded-full transition-all duration-500", idx === activeHeroIndex ? "w-10 bg-white" : "w-2 bg-white/20 hover:bg-white/40")} 
                  />
              ))}
           </div>
        </div>
      </section>

      {/* Mobile Hero View */}
      <section className="lg:hidden flex flex-col gap-8">
        <div 
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-[10vw] no-scrollbar pb-4 pt-4 px-[20vw]"
          onScroll={handleScroll}
        >
          {movies.slice(0, 6).map((m, idx) => {
             const isActive = idx === activeHeroIndex;
             return (
               <Link 
                 key={m.id}
                 to={`/details/${m.media_type || 'movie'}/${m.id}`}
                 className={cn(
                    "snap-center shrink-0 w-[60vw] flex flex-col items-center gap-8 transition-all duration-500 ease-out",
                    isActive ? "scale-110 opacity-100" : "scale-90 opacity-40 blur-[2px]"
                 )}
               >
                  <div className={cn("w-full aspect-[2/3] rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl bg-[#1a2226]")}>
                    <CachedImage 
                      alt={m.title || m.name} 
                      src={getImageUrl(m.poster_path, 'w500')} 
                      type="movie"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className={cn("flex flex-col items-center gap-2 text-center w-full", isActive ? "opacity-100" : "opacity-0")}>
                    <h2 className="text-2xl font-bold text-white tracking-tight leading-none uppercase">{m.title || m.name}</h2>
                    <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-[0.2em]">★ {(m.vote_average || 0).toFixed(1)} Rating</span>
                  </div>
               </Link>
             );
          })}
        </div>
      </section>

      {/* Continue Watching Row */}
      {recentlyWatched.length > 0 && (
        <section className="flex flex-col gap-6 px-6 lg:px-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight uppercase px-2 py-1 bg-white/5 rounded-md">Continue Watching</h2>
            <Link to="/timeline" className="text-[10px] uppercase font-black tracking-widest text-white/30 hover:text-white transition-colors">History &rarr;</Link>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-6 pr-6">
            {recentlyWatched.map((item, idx) => (
              <motion.div
                key={item.id + '-' + idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/play/${item.mediaType}/${item.id}?resume=${Math.floor(item.currentTime)}`} className="relative w-72 h-40 shrink-0 rounded-[2rem] overflow-hidden group border border-white/5 bg-[#111] block">
                  <CachedImage 
                    alt={item.movieDetails.title || item.movieDetails.name} 
                    src={getImageUrl(item.movieDetails.backdrop_path || item.movieDetails.poster_path, 'w300')} 
                    type="movie"
                    className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-2xl">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5V19L19 12L8 5Z"></path></svg>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                    <span className="text-sm font-bold text-white line-clamp-1 truncate">{item.movieDetails.title || item.movieDetails.name}</span>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--color-accent)]" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid */}
      <section className="flex flex-col gap-8 px-6 lg:px-0">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold text-white tracking-tight uppercase px-2 py-1 bg-white/5 rounded-md">Premierest Items</h2>
           <div className="flex gap-2">
              {["All", "Movie", "Series", "Anime"].map(l => (
                <span 
                  key={l} 
                  onClick={() => setActiveCategory(l)}
                  className={cn("text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full hover:bg-white hover:text-black cursor-pointer transition-all", activeCategory === l ? "bg-white text-black" : "")}>
                    {l}
                </span>
              ))}
           </div>
        </div>
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-12"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {movies
            .filter(m => {
              if (activeCategory === "All") return true;
              if (activeCategory === "Movie") return m.media_type === "movie";
              if (activeCategory === "Series") return m.media_type === "tv";
              if (activeCategory === "Anime") return m.genre_ids?.includes(16);
              return true;
            })
            .slice(0, 18).map((m, index) => (
            <motion.div
              key={m.id + '-' + index}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
            >
              <MovieCard movie={m} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
