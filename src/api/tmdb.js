const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const LANGUAGE = 'fr-FR';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export function posterUrl(path) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : 'https://via.placeholder.com/342x513?text=No+Image';
}

export async function fetchTrending() {
  return fetchJson(`${BASE_URL}/trending/all/day?api_key=${API_KEY}&language=${LANGUAGE}`);
}

export async function fetchCategory(category) {
  return fetchJson(`${BASE_URL}/movie/${category}?api_key=${API_KEY}&language=${LANGUAGE}`);
}

export async function fetchSeries() {
  return fetchJson(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=${LANGUAGE}`);
}

export async function fetchByGenre(genreId) {
  return fetchJson(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&language=${LANGUAGE}`);
}

export async function searchMulti(query) {
  return fetchJson(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=${LANGUAGE}`);
}

export async function fetchDetails(mediaType, id) {
  return fetchJson(`${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&language=${LANGUAGE}`);
}

export async function fetchCredits(mediaType, id) {
  return fetchJson(`${BASE_URL}/${mediaType}/${id}/credits?api_key=${API_KEY}&language=${LANGUAGE}`);
}

export async function fetchVideos(mediaType, id) {
  return fetchJson(`${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`);
}

export async function fetchExternalIds(mediaType, id) {
  return fetchJson(`${BASE_URL}/${mediaType}/${id}/external_ids?api_key=${API_KEY}`);
}

export function parseMovieList(response, fallbackMediaType = 'movie') {
  return (response.results || []).map((item) => ({
    movieId: item.id,
    movieName: item.title || item.name || 'Sans titre',
    movieDate: item.release_date || item.first_air_date || '',
    movieImage: item.poster_path || item.backdrop_path || '',
    movieDescription: item.overview || '',
    mediaType: item.media_type || fallbackMediaType,
  }));
}

export function parseMultiSearch(response) {
  return (response.results || []).map((item) => ({
    movieId: item.id,
    movieName: item.title || item.name || 'Sans titre',
    movieDate: item.release_date || item.first_air_date || '',
    movieImage: item.poster_path || item.backdrop_path || '',
    movieDescription: item.overview || '',
    mediaType: item.media_type || 'movie',
  }));
}
