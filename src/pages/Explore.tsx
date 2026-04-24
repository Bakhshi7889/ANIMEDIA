import React, { useEffect, useState, useRef } from "react";
import { getTrending, type TMDBMovie, getDetails } from "../services/tmdb";
import { Link } from "react-router-dom";
import { Play, Heart, MessageCircle, Share2, Info } from "lucide-react";
import { cn } from "../lib/utils";

export default function Explore() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [trailers, setTrailers] = useState<Record<number, string | null>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!hasMore || isLoadingMore) return;
      try {
        setIsLoadingMore(true);
        const trending = await getTrending('movie', page);
        
        if (trending.length === 0) {
          setHasMore(false);
          return;
        }

        setMovies(prev => {
          const combined = [...prev, ...trending];
          return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        });
        
        // Fetch trailers for the upcoming batch
        const startIndex = (page - 1) * trending.length;
        for (let i = startIndex; i < Math.min(startIndex + 5, startIndex + trending.length); i++) {
          fetchTrailerFor(trending[i - startIndex], i);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMore(false);
      }
    }
    load();
  }, [page]);

  const fetchTrailerFor = async (movie: TMDBMovie, index: number) => {
    try {
      const details = await getDetails(movie.id.toString(), 'movie');
      if (details.videos?.results) {
        const ytTrailer = details.videos.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')
                       || details.videos.results.find((v: any) => v.site === 'YouTube');
        if (ytTrailer) {
          setTrailers(prev => ({ ...prev, [index]: ytTrailer.key }));
        } else {
          setTrailers(prev => ({ ...prev, [index]: null }));
        }
      }
    } catch {
      setTrailers(prev => ({ ...prev, [index]: null }));
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollY = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIdx = Math.round(scrollY / height);
    
    if (newIdx !== activeIdx) {
      setActiveIdx(newIdx);
      // preemptively fetch next trailers
      if (movies[newIdx]) fetchTrailerFor(movies[newIdx], newIdx);
      if (movies[newIdx+1]) fetchTrailerFor(movies[newIdx+1], newIdx+1);
      
      // Load next page if we're near the end (e.g. 3 items from the end)
      if (newIdx >= movies.length - 3 && hasMore && !isLoadingMore) {
        setPage(p => p + 1);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 bg-black z-[100] overflow-y-scroll snap-y snap-mandatory no-scrollbar"
    >
      {movies.map((m, idx) => {
        const isActive = activeIdx === idx;
        const trailerKey = trailers[idx];

        return (
          <div key={`${m.id}-${idx}`} className="w-full h-screen snap-center relative flex items-center justify-center bg-black overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute inset-0 z-0">
               {isActive && trailerKey ? (
                 <iframe
                   src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${trailerKey}&modestbranding=1&showinfo=0&rel=0`}
                   allow="autoplay; encrypted-media"
                   className={cn(
                     "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-1000",
                     "w-[350vw] h-[350vw] sm:w-[150vw] sm:h-[150vw] md:w-[100vw] md:h-[100vw]",
                     isActive ? "opacity-100 scale-100" : "opacity-0 scale-105"
                   )}
                 />
               ) : (
                 <img 
                   src={`https://image.tmdb.org/t/p/original${m.poster_path}`} 
                   className={cn(
                     "w-full h-full object-cover transition-opacity duration-1000",
                     isActive ? "opacity-90 blur-sm scale-110" : "opacity-0"
                   )}
                 />
               )}
               <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 pointer-events-none" />
            </div>

            {/* UI Overlay */}
            {isActive && (
              <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none flex flex-col justify-end p-6 pb-24 lg:pb-12 gap-4 z-10">
                <div className="flex items-end justify-between w-full max-w-lg mx-auto pointer-events-auto">
                   
                   {/* Left side content */}
                   <div className="flex flex-col gap-3 flex-1 pr-12">
                     <h2 className="text-3xl font-bold text-white drop-shadow-lg line-clamp-2">{m.title || m.name}</h2>
                     <p className="text-white/80 text-sm line-clamp-3 drop-shadow-md">{m.overview}</p>
                     
                     <div className="flex items-center gap-4 mt-2">
                       <Link 
                         to={`/play/movie/${m.id}`}
                         className="flex items-center gap-2 bg-[var(--color-accent)] text-black px-6 py-2.5 rounded-full font-semibold hover:scale-105 transition-transform"
                       >
                         <Play className="w-4 h-4 fill-black" /> Watch
                       </Link>
                       <Link 
                         to={`/details/movie/${m.id}`}
                         className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-6 py-2.5 rounded-full font-semibold hover:bg-white/30 transition-colors"
                       >
                         <Info className="w-4 h-4" /> Details
                       </Link>
                     </div>
                   </div>

                   {/* Right side interactions (TikTok style) */}
                   <div className="flex flex-col gap-6 items-center shrink-0">
                     <button className="flex flex-col items-center gap-1 group">
                       <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                         <Heart className="w-6 h-6" />
                       </div>
                       <span className="text-xs text-white drop-shadow-md font-medium">Like</span>
                     </button>
                     <button className="flex flex-col items-center gap-1 group">
                       <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                         <MessageCircle className="w-6 h-6" />
                       </div>
                       <span className="text-xs text-white drop-shadow-md font-medium">Chat</span>
                     </button>
                     <button className="flex flex-col items-center gap-1 group">
                       <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                         <Share2 className="w-6 h-6" />
                       </div>
                       <span className="text-xs text-white drop-shadow-md font-medium">Share</span>
                     </button>
                   </div>

                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Persistent Top Nav */}
      <div className="absolute top-0 inset-x-0 p-6 pt-safe flex items-center justify-between z-50 pointer-events-none">
        <h1 className="text-white font-bold text-xl drop-shadow-md pointer-events-auto">Animedia<span className="text-[var(--color-accent)]">.explore</span></h1>
        <Link to="/" className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto hover:bg-white/20 border border-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Link>
      </div>
    </div>
  );
}
