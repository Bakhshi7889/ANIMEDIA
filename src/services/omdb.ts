export interface OMDbRating {
  Source: string;
  Value: string;
}

export interface OMDbDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OMDbRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

export async function getOmdbDetails(imdbId: string): Promise<OMDbDetails | null> {
  const apiKey = (import.meta as any).env.VITE_OMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`);
    const data = await res.json();
    if (data.Response === "True") {
      return data as OMDbDetails;
    }
    return null;
  } catch (e) {
    console.error("OMDb fetch failed", e);
    return null;
  }
}
