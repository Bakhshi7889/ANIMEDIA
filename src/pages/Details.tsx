import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getDetails, getTvSeasons, type TMDBMovie, getImageUrl } from "../services/tmdb";
import { Play, ArrowLeft, Heart, Ticket, Clock, Star, Info, Check, Eye, Bookmark, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isFavorite, toggleFavorite, getProgress, type WatchProgress, getWatchListStatus, setWatchListStatus, type WatchStatus } from "../lib/storage";
import { FastAverageColor } from 'fast-average-color';
import { getOmdbDetails, type OMDbDetails } from "../services/omdb";
import CachedImage from "../components/CachedImage";

export default function Details() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(null);
  const [dominantColor, setDominantColor] = useState<string>('#0e1518');
  const [omdbData, setOmdbData] = useState<OMDbDetails | null>(null);
  const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id || !type) return;
      try {
        const details = await getDetails(id, type as any);
        setData(details);
        
        // Find trailer
        const trailer = details.videos?.results?.find(
          (video: any) => video.site === 'YouTube' && video.type === 'Trailer'
        );
        if (trailer) setTrailerKey(trailer.key);

        // Try to fetch omdb details if we have an IMDB ID
        const imdbId = details.imdb_id || details.external_ids?.imdb_id;
        if (imdbId) {
          getOmdbDetails(imdbId).then(omdbDataRes => {
            if (omdbDataRes) setOmdbData(omdbDataRes);
          });
        }

        if (details.poster_path) {
          try {
            const fac = new FastAverageColor();
            // Use a tiny version for faster extraction and less load/CORS issues
            const thumbUrl = getImageUrl(details.poster_path, 'w92');
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = thumbUrl;
            
            // Wait for image to be ready for processing
            await img.decode();
            const color = fac.getColor(img);
            setDominantColor(color.hex);
          } catch (e) {
            console.warn("Color extraction failed, using fallback", e);
            // Fallback is already the default state #0e1518
          }
        }

        const [favStatus, progress, wStatus] = await Promise.all([
          isFavorite(id),
          getProgress(id),
          getWatchListStatus(id)
        ]);
        
        setFavorite(favStatus);
        setWatchStatus(wStatus || null);
        
        if (progress && progress.progress > 0 && progress.progress < 95) {
          setWatchProgress(progress);
        }

      } catch (err) {
        console.error("Failed to load details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, type]);

  const handleFavorite = async () => {
    if (!data) return;
    const newStatus = await toggleFavorite(data);
    setFavorite(newStatus);
  };

  const handleWatchStatus = async (status: WatchStatus | null) => {
    if (!data) return;
    // if clicking the currently active status, clear it
    const newStatus = watchStatus === status ? null : status;
    await setWatchListStatus(data, newStatus);
    setWatchStatus(newStatus);
  };

  const handlePlayClick = (e: React.MouseEvent<HTMLElement>) => {
    // Pass the movie details via location state so Player can save it
    if (data) {
      navigate(`/play/${type}/${id}`, { state: { movieDetails: data } });
      e.preventDefault();
    }
  };

  const handleResumeClick = (e: React.MouseEvent<HTMLElement>) => {
    if (data && watchProgress) {
      navigate(`/play/${type}/${id}?resume=${Math.floor(watchProgress.currentTime)}&season=${watchProgress.season || 1}&episode=${watchProgress.episode || 1}`, { state: { movieDetails: data } });
      e.preventDefault();
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col pt-24 px-6 md:px-12 gap-8 items-center md:items-start animite-in fade-in duration-300">
         <div className="w-64 md:w-96 h-12 bg-white/5 rounded-xl animate-pulse" />
         <div className="w-48 h-6 bg-white/5 rounded-full animate-pulse" />
         <div className="w-full max-w-2xl h-32 bg-white/5 rounded-xl animate-pulse mt-4" />
         
         <div className="flex gap-4 mt-8 w-full max-w-2xl">
           <div className="w-1/3 h-24 bg-white/5 rounded-2xl animate-pulse" />
           <div className="w-1/3 h-24 bg-white/5 rounded-2xl animate-pulse" />
           <div className="w-1/3 h-24 bg-white/5 rounded-2xl animate-pulse" />
         </div>
         
         <div className="flex gap-4 mt-8 w-full">
           <div className="w-48 h-16 bg-white/5 rounded-full animate-pulse" />
           <div className="w-48 h-16 bg-white/5 rounded-full animate-pulse" />
         </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center">Not found</div>;

  const bgUrl = data.backdrop_path 
    ? getImageUrl(data.backdrop_path, 'w1280')
    : '';

  return (
    <div 
      className="relative min-h-screen flex flex-col transition-colors duration-1000"
      style={{ '--color-dominant': dominantColor } as React.CSSProperties}
    >
      {/* Trailer Overlay */}
      <AnimatePresence>
        {showTrailer && trailerKey && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md"
          >
            <motion.button 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setShowTrailer(false)}
              className="absolute top-6 right-6 text-white hover:text-white/70 bg-white/10 p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-8 h-8" />
            </motion.button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-5xl aspect-video px-4"
            >
              <iframe 
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                className="w-full h-full rounded-3xl shadow-2xl border border-white/10"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-[100] px-6 py-4 pt-12 pt-safe flex items-center justify-between bg-[#050505]/40 backdrop-blur-xl border-b border-white/5 landscape:hidden md:hidden">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-bold text-xs uppercase tracking-tighter leading-none">Back</span>
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Preview Mode</span>
      </div>

      {/* Dynamic Colored Glow */}
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none transition-opacity duration-1000"
        style={{ background: `radial-gradient(circle at 70% 30%, var(--color-dominant) 0%, transparent 70%)` }}
      />
      
      {/* Background (Desktop) */}
      <div className="hidden landscape:block md:block absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#0e1518]/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1518] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e1518] via-[#0e1518]/80 to-transparent z-10" />
        {trailerKey ? (
          <div className="absolute inset-0 w-full h-full scale-[1.3] pointer-events-none">
            <iframe 
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1`}
              className="w-full h-full object-cover"
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : bgUrl ? (
          <CachedImage 
            src={bgUrl} 
            alt="backdrop" 
            type="movie"
            className="w-full h-full object-cover opacity-30"
          />
        ) : null}
      </div>

      {/* Mobile Top Image (Purrweb style) */}
      <div className="landscape:hidden md:hidden relative w-full h-[45vh] shrink-0 border-b border-white/5 overflow-hidden">
         {trailerKey ? (
            <div className="absolute inset-0 w-full h-full scale-[1.5] pointer-events-none">
              <iframe 
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&rel=0&showinfo=0&modestbranding=1`}
                className="w-full h-full object-cover"
                allow="autoplay; encrypted-media"
              />
            </div>
         ) : bgUrl ? (
            <CachedImage 
              src={bgUrl} 
              alt="backdrop" 
              type="movie"
              className="w-full h-full object-cover"
            />
         ) : (
            <div className="w-full h-full bg-[#1a2226]" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/20 to-transparent z-10" />
         
         {/* Colored reflection for mobile */}
         <div 
           className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t to-transparent opacity-30 z-10"
           style={{ backgroundImage: `linear-gradient(to top, var(--color-dominant), transparent)` }}
         />
         
         {/* Safe padding on top for iOS notch */}
         {/* Movie navigation header removed */}
         
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
           <button onClick={handlePlayClick} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
             <Play className="w-6 h-6 ml-1" fill="currentColor" />
           </button>
         </div>
      </div>

      <div className="relative z-20 flex-1 px-6 landscape:px-12 md:px-12 py-8 landscape:py-12 md:py-12 flex flex-col justify-center w-full max-w-4xl gap-8 landscape:gap-8 md:gap-8 mx-auto landscape:mx-0 md:mx-0 items-center text-center landscape:items-start md:items-start landscape:text-left md:text-left">
        
        <button 
          onClick={() => navigate('/')}
          className="hidden landscape:flex md:flex items-center gap-2 text-white/50 hover:text-white self-start transition-colors z-30 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold text-xs uppercase tracking-tighter">Back</span>
        </button>

        <div className="flex flex-col gap-2 landscape:gap-4 md:gap-4 items-center landscape:items-start md:items-start">
          <h1 className="text-4xl landscape:text-5xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-none text-[#f9f8ff]">
            {data.title || data.name}
          </h1>
          <span className="text-sm font-semibold text-[#959ca3]">{data.genres?.[0]?.name || 'Movie'}</span>

          {/* Purrweb Stats Layout (Mobile) vs Serivia Stats (Desktop) */}
          <div className="flex items-center gap-8 landscape:gap-3 md:gap-3 text-xs landscape:tracking-widest md:tracking-widest landscape:uppercase md:uppercase text-white/60 font-semibold mt-4 landscape:mt-0 md:mt-0">
             {/* Year */}
             <div className="flex flex-col landscape:flex-row md:flex-row items-center gap-1">
               <span className="text-xl landscape:text-xs md:text-xs font-bold text-white landscape:text-white/60 md:text-white/60">{data.release_date?.substring(0,4) || data.first_air_date?.substring(0,4)}</span>
               <span className="text-[10px] landscape:text-xs md:text-xs text-[#959ca3] landscape:text-white/60 md:text-white/60 uppercase font-medium landscape:font-semibold md:font-semibold">year</span>
             </div>
             <span className="hidden landscape:block md:block">&bull;</span>
             
             {/* IMDB */}
             <div className="flex flex-col landscape:flex-row md:flex-row items-center gap-1">
               <span className="text-xl landscape:text-xs md:text-xs font-bold text-white landscape:text-white/60 md:text-white/60 flex items-center landscape:gap-1 md:gap-1"><span className="hidden landscape:block md:block text-[var(--color-accent)]">★</span> {data.vote_average?.toFixed(1)}</span>
               <span className="text-[10px] landscape:text-xs md:text-xs text-[#959ca3] landscape:text-white/60 md:text-white/60 uppercase font-medium landscape:font-semibold md:font-semibold">IMDB</span>
             </div>

             {/* Rotten Tomatoes */}
             {omdbData?.Ratings?.find(r => r.Source === "Rotten Tomatoes") && (
               <>
                 <span className="hidden landscape:block md:block">&bull;</span>
                 <div className="flex flex-col landscape:flex-row md:flex-row items-center gap-1">
                   <span className="text-xl landscape:text-xs md:text-xs font-bold text-white landscape:text-white/60 md:text-white/60 flex items-center landscape:gap-1 md:gap-1">
                     <span className="hidden landscape:block md:block text-[#fa320a]">🍅</span> 
                     {omdbData.Ratings.find(r => r.Source === "Rotten Tomatoes")?.Value}
                   </span>
                   <span className="text-[10px] landscape:text-xs md:text-xs text-[#fa320a] landscape:text-white/60 md:text-white/60 uppercase font-medium landscape:font-semibold md:font-semibold">RT</span>
                 </div>
               </>
             )}
             
             {data.runtime ? (
               <>
                 <span className="hidden landscape:block md:block">&bull;</span>
                 {/* Runtime */}
                 <div className="flex flex-col landscape:flex-row md:flex-row items-center gap-1">
                    <span className="text-xl landscape:text-xs md:text-xs font-bold text-white landscape:text-white/60 md:text-white/60">{Math.floor(data.runtime/60)}h {data.runtime%60}m</span>
                    <span className="text-[10px] landscape:text-xs md:text-xs text-[#959ca3] landscape:text-white/60 md:text-white/60 uppercase font-medium landscape:font-semibold md:font-semibold">time</span>
                 </div>
               </>
             ) : null}

            <span className="hidden landscape:block md:block">&bull;</span>
            <span className="hidden landscape:block md:block">{type === 'movie' ? 'Movie' : 'Series'}</span>
          </div>

          <div className="hidden landscape:flex md:flex flex-wrap gap-2 text-xs uppercase tracking-wider mt-2 items-center font-medium">
            {data.genres?.map(g => (
              <span key={g.id} className="px-3 py-1 rounded-full border border-white/10 bg-[#1a2226]/50 backdrop-blur-sm text-[#959ca3]">
                {g.name}
              </span>
            ))}
            <button 
              onClick={handleFavorite}
              className="ml-2 w-8 h-8 rounded-full border border-white/10 bg-[#1a2226]/50 backdrop-blur-sm flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Toggle Favorite"
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-[#959ca3]'}`} />
            </button>
          </div>

          <p className="text-[#959ca3] text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl mt-4 md:mt-4 font-medium text-left drop-shadow-md">
            {data.overview}
          </p>
          
          {/* Interactive Bento-Box Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 w-full max-w-3xl">
             <div className="bg-[#1a2226]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-1 border border-white/5 hover:border-white/10 transition-colors">
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"><Star className="w-3 h-3 text-[var(--color-accent)]" /> Score</span>
                <span className="text-2xl font-bold text-white tracking-tight">{data.vote_average?.toFixed(1)} <span className="text-sm font-medium text-white/30">/ 10</span></span>
             </div>
             
             {data.runtime ? (
             <div className="bg-[#1a2226]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-1 border border-white/5 hover:border-white/10 transition-colors">
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3 text-[var(--color-accent)]" /> Duration</span>
                <span className="text-2xl font-bold text-white tracking-tight">{Math.floor(data.runtime/60)}<span className="text-sm font-medium text-white/30 mr-1">h</span>{data.runtime%60}<span className="text-sm font-medium text-white/30">m</span></span>
             </div>
             ) : (
                <div className="bg-[#1a2226]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-1 border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"><Ticket className="w-3 h-3 text-[var(--color-accent)]" /> Status</span>
                  <span className="text-xl font-bold text-white tracking-tight break-words">{(data as any).status || "Released"}</span>
                </div>
             )}
             
             <div className="bg-[#1a2226]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-1 border border-white/5 hover:border-white/10 transition-colors landscape:col-span-1 lg:col-span-2">
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"><Info className="w-3 h-3 text-[var(--color-accent)]" /> Details</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {data.release_date || data.first_air_date ? <span className="text-sm font-semibold text-white/90">{data.release_date || data.first_air_date}</span> : null}
                  {(data as any).budget && (data as any).budget > 0 ? <span className="text-sm font-semibold text-white/90 border-l border-white/10 pl-3">${((data as any).budget / 1000000).toFixed(1)}M Budget</span> : null}
                  {(data as any).revenue && (data as any).revenue > 0 ? <span className="text-sm font-semibold text-white/90 border-l border-white/10 pl-3">${((data as any).revenue / 1000000).toFixed(1)}M Box Office</span> : null}
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-center landscape:justify-start md:justify-start gap-4 mt-8 flex-wrap w-full">
          {watchProgress ? (
            <>
              <button 
                onClick={handleResumeClick}
                className="group flex-1 landscape:flex-none flex items-center justify-center gap-3 bg-[var(--color-accent)] text-black px-8 py-4 rounded-full font-bold hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                Resume ({Math.round(watchProgress.progress)}%)
              </button>
              <button 
                onClick={handlePlayClick}
                className="group flex-1 landscape:flex-none flex items-center justify-center gap-3 bg-white/5 text-white border border-white/20 px-8 py-4 rounded-full font-bold hover:bg-white/10 hover:border-white/40 transition-all shadow-xl"
              >
                Restart
              </button>
            </>
          ) : (
            <button 
              onClick={handlePlayClick}
              className="group w-full landscape:w-auto flex items-center justify-center gap-3 bg-[var(--color-accent)] text-black px-12 py-4 rounded-full font-bold hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Watch Now
            </button>
          )}
          {trailerKey && (
            <button 
              onClick={() => setShowTrailer(true)}
              className="group w-full landscape:w-auto flex items-center justify-center gap-3 bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full font-bold hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 shadow-lg"
            >
              <span className="text-red-500 font-bold">▶</span>
              Watch Trailer
            </button>
          )}
        </div>

        {/* Watch Status Selector */}
        <div className="flex flex-col gap-3 mt-4 w-full">
          <span className="text-sm font-semibold text-white/50 uppercase tracking-widest text-center landscape:text-left md:text-left">Your List</span>
          <div className="flex flex-wrap items-center justify-center landscape:justify-start md:justify-start gap-3 w-full">
            <button 
              onClick={() => handleWatchStatus('plan_to_watch')}
              className={`flex-1 min-w-[120px] landscape:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${watchStatus === 'plan_to_watch' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
            >
              <Bookmark className="w-4 h-4" />
              Plan to Watch
            </button>
            <button 
              onClick={() => handleWatchStatus('watching')}
              className={`flex-1 min-w-[120px] landscape:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${watchStatus === 'watching' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
            >
              <Eye className="w-4 h-4" />
              Watching
            </button>
            <button 
              onClick={() => handleWatchStatus('completed')}
              className={`flex-1 min-w-[120px] landscape:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${watchStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
            >
              <Check className="w-4 h-4" />
              Completed
            </button>
          </div>
        </div>

        {/* X-Ray Cast Section */}
        {data.credits?.cast && data.credits.cast.length > 0 && (
          <div className="mt-8 landscape:mt-12 md:mt-12 flex flex-col gap-4 w-full landscape:max-w-[100vw] md:max-w-[100vw]">
            <div className="flex items-center justify-between pointer-events-auto px-4 landscape:px-0 md:px-0">
                <h2 className="text-xl landscape:text-2xl md:text-2xl font-bold text-white/90">Cast</h2>
                <span className="text-sm font-semibold text-[#959ca3] hover:text-white cursor-pointer mr-6 sm:mr-12">See all</span>
            </div>
            <div className="flex items-start gap-4 overflow-x-auto pb-4 no-scrollbar pointer-events-auto pr-8 px-4 landscape:px-0 md:px-0">
              {data.credits.cast.slice(0, 10).map((actor: any, idx: number) => (
                <Link to={`/actor/${actor.id}`} key={`${actor.id}-${idx}`} className="relative flex flex-col shrink-0 w-[110px] h-[140px] landscape:w-[130px] landscape:h-[160px] md:w-[130px] md:h-[160px] rounded-[1.2rem] group cursor-pointer transition-transform hover:-translate-y-1 overflow-hidden shadow-lg border border-white/5 bg-[#1a2226]">
                  {actor.profile_path ? (
                    <CachedImage 
                      src={getImageUrl(actor.profile_path, 'w185')} 
                      alt={actor.name}
                      type="character"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/20 text-center px-2">No Image</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0e1518] via-[#0e1518]/70 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-2 right-2 flex flex-col items-center text-center">
                     <span className="text-xs landscape:text-sm md:text-sm font-bold text-[#f9f8ff] line-clamp-1 drop-shadow-md w-full">{actor.name}</span>
                     <span className="text-[10px] landscape:text-xs md:text-xs font-semibold text-[#959ca3] line-clamp-1 w-full">{actor.character}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
