import React from "react";
import { Link } from "react-router-dom";
import { type TMDBMovie, getImageUrl } from "../services/tmdb";
import { Play } from "lucide-react";
import { motion } from "motion/react";

interface MovieCardProps {
  movie: TMDBMovie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const isPerson = movie.media_type === 'person';
  const type = movie.media_type === 'tv' ? 'tv' : 'movie';
  const targetUrl = isPerson ? `/actor/${movie.id}` : `/details/${type}/${movie.id}`;
  const displayImage = isPerson ? (movie as any).profile_path : movie.poster_path;
  
  return (
    <Link 
      to={targetUrl}
      className="group relative flex flex-col gap-3 outline-none"
    >
      <motion.div 
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative aspect-[2/3] overflow-hidden rounded-[2rem] bg-[#1a2226] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/5 group-focus-visible:ring-4 group-focus-visible:ring-white/50"
      >
        <img 
          src={getImageUrl(displayImage)} 
          alt={movie.title || movie.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out"
          loading="lazy"
        />
        
        {/* Soft gradient text overlay at bottom like the design */}
        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white pl-1 shadow-2xl hover:bg-white hover:text-black transition-colors">
            {isPerson ? <span className="text-xs font-bold -ml-1 pr-1">PROFILE</span> : <Play className="w-5 h-5" fill="currentColor" />}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1 pointer-events-none text-left z-10 transition-transform duration-300 group-hover:translate-y-[-4px]">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-[#f9f8ff] drop-shadow-md">
            {movie.title || movie.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#f9f8ff]/80 font-medium">
            {isPerson ? (
               <span className="text-orange-400 font-bold tracking-widest uppercase text-[9px]">Actor / Creator</span>
            ) : (
              <>
                {movie.release_date && <span>{movie.release_date.substring(0,4)}</span>}
                {movie.first_air_date && <span>{movie.first_air_date.substring(0,4)}</span>}
                <span className="w-1 h-1 rounded-full bg-white/40 inline-block" />
                <span className="flex items-center gap-1">
                  <span className="text-[var(--color-accent)]">★</span> {(movie.vote_average || 0).toFixed(1)}
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;
