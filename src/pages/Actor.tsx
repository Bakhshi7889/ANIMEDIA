import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPersonDetails, getImageUrl } from "../services/tmdb";
import MovieCard from "../components/MovieCard";
import CachedImage from "../components/CachedImage";

export default function Actor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getPersonDetails(id);
        setPerson(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 flex justify-center text-white/50">Loading...</div>;
  if (!person) return <div className="p-8 text-white/50">Not found</div>;

  const allCredits = person.combined_credits?.cast || [];
  const uniqueCreditsMap = new Map();
  allCredits.forEach((c: any) => {
    if (!uniqueCreditsMap.has(c.id)) {
      uniqueCreditsMap.set(c.id, c);
    }
  });
  const credits = Array.from(uniqueCreditsMap.values()) as any[];
  // sort by vote_count
  credits.sort((a: any, b: any) => b.vote_count - a.vote_count);

  return (
    <div className="flex flex-col gap-10 pb-24 max-w-7xl mx-auto px-4 md:px-8 mt-8">
      <button 
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full bg-[#1a2226] border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <div className="flex flex-col md:flex-row landscape:flex-row gap-8">
        <div className="w-full md:w-1/3 landscape:w-1/3 max-w-sm shrink-0">
          <CachedImage 
            src={getImageUrl(person.profile_path, 'w500')} 
            alt={person.name}
            type="character"
            className="w-full rounded-[2rem] shadow-2xl object-cover aspect-[2/3] border border-white/5"
          />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{person.name}</h1>
          {person.birthday && <p className="text-[#959ca3] font-medium">Born: {person.birthday} {person.place_of_birth ? `in ${person.place_of_birth}` : ''}</p>}
          <div className="text-white/70 max-w-3xl leading-relaxed whitespace-pre-wrap mt-4 text-sm md:text-base">
            {person.biography || "No biography available."}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 mt-8">
        <h2 className="text-2xl font-bold text-white">Known For</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 landscape:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
          {credits.map((m: any) => (
            <MovieCard key={`${m.id}-${m.media_type}`} movie={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
