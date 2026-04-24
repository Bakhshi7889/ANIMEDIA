import { useEffect, useState } from "react";
import { getAnime, type TMDBMovie } from "../services/tmdb";
import MovieCard from "../components/MovieCard";

export default function Anime() {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const animeData = await getAnime();
        setMovies(animeData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-24 px-4 md:px-8 max-w-7xl mx-auto mt-6">
        <header className="flex flex-col gap-3 relative z-10 pt-4">
          <div className="w-48 h-10 bg-white/5 rounded-xl animate-pulse" />
          <div className="flex gap-2">
            <div className="w-24 h-8 bg-white/5 rounded-full animate-pulse" />
            <div className="w-24 h-8 bg-white/5 rounded-full animate-pulse" />
          </div>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
           {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full bg-white/5 rounded-[2rem] animate-pulse" />
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-24 px-6 relative">
      {/* Background glow for anime mode */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[100vw] h-[100vw] bg-purple-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col gap-8">
        <header className="flex flex-col gap-2 mt-4">
          <h1 className="text-4xl font-serif font-light text-white flex items-center gap-3">
            <span className="text-purple-400">Otaku</span> Zone
          </h1>
          <p className="text-white/50 text-sm">Top trending anime streamed directly from JP broadcast.</p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
          {movies.map((m, index) => (
            <MovieCard key={m.id + '-' + index} movie={m} />
          ))}
        </section>
      </div>
    </div>
  );
}
