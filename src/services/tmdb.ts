const TMDB_API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const fetchTmdb = async (endpoint: string, params: Record<string, string> = {}) => {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB API Key is missing. Please add VITE_TMDB_API_KEY to your Secrets.");
  }
  
  const searchParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: 'en-US',
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.statusText}`);
  }
  return response.json();
};

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string; // For TV shows
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string; // For TV shows
  vote_average: number;
  media_type?: 'movie' | 'tv';
  runtime?: number;
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  seasons?: { season_number: number; episode_count: number; name: string }[];
  imdb_id?: string;
  external_ids?: { imdb_id: string };
}

export const getTrending = async (type: 'movie' | 'tv' | 'all' = 'all', page: number = 1) => {
  const data = await fetchTmdb(`/trending/${type}/day`, { page: String(page) });
  return data.results as TMDBMovie[];
};

export const getAnime = async (sortBy: string = 'popularity.desc', page: number = 1) => {
  const data = await fetchTmdb('/discover/tv', {
    with_genres: '16',
    with_original_language: 'ja',
    sort_by: sortBy,
    page: String(page)
  });
  return data.results.map((m: any) => ({ ...m, media_type: 'tv' })) as TMDBMovie[];
};

export const getTrendingAnime = async () => {
  const data = await fetchTmdb('/trending/tv/week');
  // Simple filter for anime in trending
  return data.results
    .filter((m: any) => m.genre_ids?.includes(16) && m.original_language === 'ja')
    .map((m: any) => ({ ...m, media_type: 'tv' })) as TMDBMovie[];
};

export const getMovies = async (sortBy: string = 'popularity.desc', page: number = 1) => {
  const data = await fetchTmdb('/discover/movie', {
    sort_by: sortBy,
    page: String(page)
  });
  return data.results.map((m: any) => ({ ...m, media_type: 'movie' })) as TMDBMovie[];
};

export const getTVShows = async (sortBy: string = 'popularity.desc', page: number = 1) => {
  const data = await fetchTmdb('/discover/tv', {
    sort_by: sortBy,
    page: String(page)
  });
  return data.results.map((m: any) => ({ ...m, media_type: 'tv' })) as TMDBMovie[];
};

export const getHorror = async (sortBy: string = 'popularity.desc', page: number = 1) => {
  const data = await fetchTmdb('/discover/movie', {
    with_genres: '27',
    sort_by: sortBy,
    page: String(page)
  });
  return data.results.map((m: any) => ({ ...m, media_type: 'movie' })) as TMDBMovie[];
};

export const searchMedia = async (query: string, page: number = 1) => {
  const data = await fetchTmdb('/search/multi', {
    query,
    include_adult: 'false',
    page: String(page)
  });
  // Keep movies, tv shows, and people
  return data.results.filter((item: any) => 
    item.media_type === 'movie' || 
    item.media_type === 'tv' || 
    item.media_type === 'person'
  ) as TMDBMovie[];
};

export const getDetails = async (id: string, type: 'movie' | 'tv' = 'movie') => {
  const data = await fetchTmdb(`/${type}/${id}`, { append_to_response: 'credits,videos,external_ids' });
  return { ...data, media_type: type } as TMDBMovie & { credits?: any, videos?: any };
};

export const getTvSeasons = async (id: string, seasonNumber: number) => {
  const data = await fetchTmdb(`/tv/${id}/season/${seasonNumber}`);
  return data;
};

export const getImageUrl = (path: string | null, size: 'w92' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w342') => {
  if (!path) return 'https://via.placeholder.com/342x513/111111/333333?text=No+Image';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const getPersonDetails = async (personId: string) => {
  return await fetchTmdb(`/person/${personId}`, {
    append_to_response: 'combined_credits'
  });
};

export const getUpcoming = async () => {
  const data = await fetchTmdb('/movie/upcoming');
  return data.results.map((m: any) => ({ ...m, media_type: 'movie' })) as TMDBMovie[];
};

