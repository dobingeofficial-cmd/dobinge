export async function searchTMDBMetadata(title: string, year: string, type: 'movie' | 'tv') {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  // Search TMDB for the specific title the AI recommended
  const url = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(title)}&year=${year}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      return {
        id: match.id,
        title: match.title || match.name,
        overview: match.overview,
        poster_path: match.poster_path,
        backdrop_path: match.backdrop_path,
        vote_average: match.vote_average,
        release_year: match.release_date ? match.release_date.split('-')[0] : match.first_air_date?.split('-')[0],
        media_type: type
      };
    }
    return null;
  } catch (error) {
    console.error(`TMDB Search Failed for ${title}:`, error);
    return null;
  }
}