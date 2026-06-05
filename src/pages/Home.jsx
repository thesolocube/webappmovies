import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTrending,
  fetchCategory,
  fetchSeries,
  fetchByGenre,
  searchMulti,
  parseMultiSearch,
  parseMovieList,
} from '../api/tmdb.js';
import {
  getCurrentUser,
  logout,
  getUserFavorites,
  getUserHistory,
  saveFavoriteItem,
  addHistoryItem,
  isFavorite,
} from '../lib/storage.js';
import HeroBanner from '../components/HeroBanner.jsx';
import MovieList from '../components/MovieList.jsx';

const genres = [
  { id: 28, label: 'Action' },
  { id: 35, label: 'Comédie' },
  { id: 16, label: 'Animation' },
  { id: 27, label: 'Horreur' },
  { id: 878, label: 'Science-Fiction' },
  { id: 53, label: 'Thriller' },
  { id: 10749, label: 'Romance' },
  { id: 99, label: 'Documentaire' },
];

export default function Home() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [series, setSeries] = useState([]);
  const [genreCollections, setGenreCollections] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchError, setSearchError] = useState('');

  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function loadUserData() {
      const favoritesData = await getUserFavorites();
      const historyData = await getUserHistory();
      setFavorites(favoritesData);
      setHistory(historyData);
    }

    loadUserData();
  }, [navigate, user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTrending(),
      fetchCategory('popular'),
      fetchCategory('top_rated'),
      fetchCategory('upcoming'),
      fetchSeries(),
      ...genres.map((genre) => fetchByGenre(genre.id)),
    ])
      .then(([trendingRes, popularRes, topRatedRes, upcomingRes, seriesRes, ...genreResponses]) => {
        setTrending(parseMultiSearch(trendingRes));
        setPopular(parseMovieList(popularRes));
        setTopRated(parseMovieList(topRatedRes));
        setUpcoming(parseMovieList(upcomingRes));
        setSeries(parseMovieList(seriesRes, 'tv'));
        setGenreCollections(
          genres.reduce((result, genre, index) => {
            result[genre.label] = parseMovieList(genreResponses[index]);
            return result;
          }, {})
        );
      })
      .catch(() => {
        setSearchError('Impossible de charger les films. Vérifiez votre connexion.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(() => {
      searchMulti(searchQuery)
        .then((data) => {
          setSearchResults(parseMultiSearch(data));
          setSearchError('');
        })
        .catch(() => setSearchError('Recherche impossible.')); 
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const currentGreeting = useMemo(() => {
    if (!user) return 'Bonjour';
    return `Bonjour, ${user.email}`;
  }, [user]);

  const featuredMovie = trending[0] || null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleHeroPlay = (movie) => {
    handleHistory(movie);
    navigate(`/details/${movie.mediaType || 'movie'}/${movie.movieId}`);
  };

  const handleHeroDetails = (movie) => {
    navigate(`/details/${movie.mediaType || 'movie'}/${movie.movieId}`);
  };

  const handleFavorite = async (movie) => {
    const alreadyFavorite = await isFavorite(movie);
    if (alreadyFavorite) {
      return;
    }
    await saveFavoriteItem(movie);
    setFavorites(await getUserFavorites());
  };

  const handleHistory = async (movie) => {
    await addHistoryItem(movie);
    setHistory(await getUserHistory());
  };

  return (
    <div className="page home-page">
      <header className="home-nav">
        <div className="brand-block">
          <button className="brand-logo-btn" onClick={() => navigate('/home')}>
            Movieee
          </button>
          <p>{currentGreeting}</p>
        </div>
        <div className="home-actions">
          <div className="search-wrapper">
            <input
              type="search"
              placeholder="Rechercher des films, séries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="button-secondary" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {history.length > 0 && <MovieList title="Continuer à regarder" movies={history} />}
      <HeroBanner movie={featuredMovie} onPlay={handleHeroPlay} onDetails={handleHeroDetails} />

      {loading && <div className="status-banner">Chargement des données...</div>}
      {searchError && <div className="status-banner status-error">{searchError}</div>}

      {searchResults.length > 0 ? (
        <MovieList title="Résultats de recherche" movies={searchResults} />
      ) : (
        <>
          {favorites.length > 0 && <MovieList title="Ma liste" movies={favorites} />}
          <MovieList title="Tendances du jour" movies={trending} />
          <MovieList title="Films populaires" movies={popular} />
          <MovieList title="Séries TV" movies={series} />
          {Object.entries(genreCollections).map(([genreName, list]) => (
            <MovieList key={genreName} title={genreName} movies={list} />
          ))}
          <MovieList title="Les mieux notés" movies={topRated} />
          <MovieList title="Prochainement" movies={upcoming} />
        </>
      )}

      <footer className="app-footer">
        <p>Web app migrée depuis l'application Android Movieee.</p>
      </footer>
    </div>
  );
}
