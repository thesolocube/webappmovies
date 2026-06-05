import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDetails, fetchCredits, fetchVideos, fetchExternalIds, posterUrl } from '../api/tmdb.js';
import { getCurrentUser, logout, saveFavoriteItem, addHistoryItem, isFavorite } from '../lib/storage.js';

function buildVidApiUrl(movie, resumeAt = 0) {
  const id = movie.imdbId || movie.movieId;
  const params = new URLSearchParams();
  params.set('primaryColor', '#e50914');
  params.set('autoplay', '1');
  params.set('title', movie.movieName || 'Movieee');
  params.set('poster', posterUrl(movie.movieImage));
  params.set('ds_lang', 'fr');
  if (resumeAt > 0) {
    params.set('resumeAt', String(Math.floor(resumeAt)));
  }

  if (movie.mediaType === 'tv') {
    const season = movie.season || 1;
    const episode = movie.episode || 1;
    return `https://vaplayer.ru/embed/tv/${id}/${season}/${episode}?${params.toString()}`;
  }

  return `https://vaplayer.ru/embed/movie/${id}?${params.toString()}`;
}

function getVidApiProgressKey(movie) {
  const id = movie.imdbId || movie.movieId;
  return `progress_${id}`;
}

export default function MovieDetail() {
  const { id, mediaType } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailerKey, setTrailerKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState(false);
  const [resumeAt, setResumeAt] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  const user = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    Promise.all([
      fetchDetails(mediaType || 'movie', id),
      fetchCredits(mediaType || 'movie', id),
      fetchVideos(mediaType || 'movie', id),
      fetchExternalIds(mediaType || 'movie', id),
    ])
      .then(([details, credits, videos, externalIds]) => {
        const item = {
          movieId: details.id,
          movieName: details.title || details.name || 'Titre inconnu',
          movieDate: details.release_date || details.first_air_date || '',
          movieImage: details.poster_path || details.backdrop_path || '',
          movieDescription: details.overview || '',
          imdbId: externalIds?.imdb_id || details.imdb_id || '',
          mediaType: mediaType || 'movie',
          season: mediaType === 'tv' ? selectedSeason : null,
          episode: mediaType === 'tv' ? selectedEpisode : null,
          totalSeasons: mediaType === 'tv' ? (details.number_of_seasons || 1) : null,
          progress: 0,
        };
        setMovie(item);
        const savedResume = Number(localStorage.getItem(getVidApiProgressKey(item)) || 0);
        setResumeAt(savedResume);
        isFavorite(item).then(setFavoriteStatus).catch(() => setFavoriteStatus(false));

        const crew = credits.crew || [];
        const director = crew.find((member) => member.job === 'Director');
        const castList = (credits.cast || []).slice(0, 12).map((actor) => ({
          name: actor.name,
          character: actor.character,
          image: actor.profile_path || '',
        }));
        setCast(castList);

        const trailer = (videos.results || []).find((video) => video.type === 'Trailer' && video.site === 'YouTube');
        setTrailerKey(trailer ? trailer.key : '');
      })
      .catch(() => {
        setError('Impossible de charger les détails du film.');
      })
      .finally(() => setLoading(false));
  }, [id, mediaType, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/home');
  };

  const handleFavorite = async () => {
    if (movie) {
      await saveFavoriteItem(movie);
      setFavoriteStatus(true);
    }
  };

  const handleWatchHistory = async () => {
    if (movie) {
      await addHistoryItem(movie);
    }
  };

  const handleImdb = () => {
    if (movie && movie.imdbId) {
      window.open(`https://www.imdb.com/title/${movie.imdbId}`, '_blank');
    }
  };

  const handlePlayFull = async () => {
    if (movie) {
      const playerSection = document.getElementById('player-section');
      playerSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const updatedMovie = {
        ...movie,
        progress: resumeAt > 0 ? Math.min(resumeAt / 3600, 0.98) : 0.34,
        lastWatchedTime: Date.now(),
      };
      await addHistoryItem(updatedMovie);
      setMovie(updatedMovie);
    }
  };

  useEffect(() => {
    function handlePlayerMessage(event) {
      if (!event.data || event.data.type !== 'PLAYER_EVENT') return;
      const { player_info, player_progress } = event.data.data || {};
      if (!player_info) return;
      const id = player_info.imdb || player_info.tmdb;
      if (!id) return;
      localStorage.setItem(`progress_${id}`, player_progress);
    }

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, []);

  if (loading) {
    return <div className="page status-page">Chargement des détails...</div>;
  }

  if (error) {
    return <div className="page status-page status-error">{error}</div>;
  }

  if (!movie) {
    return <div className="page status-page">Aucun film sélectionné.</div>;
  }

  const videoSrc = buildVidApiUrl(
    {
      ...movie,
      season: movie.mediaType === 'tv' ? selectedSeason : null,
      episode: movie.mediaType === 'tv' ? selectedEpisode : null,
    },
    resumeAt
  );

  return (
    <div className="page detail-page">
      <header className="home-nav detail-nav">
        <div className="brand-block">
          <button className="brand-logo-btn" onClick={() => navigate('/home')}>
            Movieee
          </button>
          <p>Page détail</p>
        </div>
        <div className="home-actions">
          <button className="button-secondary" onClick={handleBack}>
            ← Retour
          </button>
          <button className="button-secondary" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>
      <section className="player-section" id="player-section">
        <div className="player-content">
          <div>
            <span className="player-badge">Lecteur intégré</span>
            <h2>{movie.movieName}</h2>
            <p>Lecture intégrée sans pop-up, sans redirection et compatible VidAPI.</p>
          </div>
          <div className="player-wrapper">
            <iframe
              title={`Lecteur ${movie.movieName}`}
              src={videoSrc}
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <header className="detail-header">
        <div>
          <h1>{movie.movieName}</h1>
          <p>{movie.movieDate ? `Sortie: ${movie.movieDate}` : ''}</p>
          {movie.mediaType === 'tv' && movie.totalSeasons && (
            <div className="series-controls">
              <div className="control-group">
                <label>Saison:</label>
                <select value={selectedSeason} onChange={(e) => setSelectedSeason(Number(e.target.value))}>
                  {Array.from({ length: movie.totalSeasons }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Saison {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-group">
                <label>Épisode:</label>
                <select value={selectedEpisode} onChange={(e) => setSelectedEpisode(Number(e.target.value))}>
                  {Array.from({ length: 13 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Épisode {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="detail-actions">
          <button className="button-secondary" onClick={handleImdb} disabled={!movie.imdbId}>
            IMDb
          </button>
        </div>
      </header>

      <section className="detail-grid">
        <div className="detail-poster">
          <img src={posterUrl(movie.movieImage)} alt={movie.movieName} />
        </div>
        <div className="detail-body">
          <p>{movie.movieDescription}</p>
          <div className="detail-meta">
            <span>Type: {movie.mediaType.toUpperCase()}</span>
            <span>Favoris: {favoriteStatus ? 'Oui' : 'Non'}</span>
            {movie.progress > 0 && (
              <span>Progression: {Math.round(movie.progress * 100)}%</span>
            )}
          </div>

          <div className="detail-buttons">
            <button onClick={handleFavorite} disabled={favoriteStatus}>
              {favoriteStatus ? 'Ajouté aux favoris' : 'Ajouter aux favoris'}
            </button>
            <button onClick={handleWatchHistory}>Sauvegarder dans l'historique</button>
            <button onClick={handlePlayFull}>
              {movie.progress > 0 ? 'Reprendre' : 'Regarder maintenant'}
            </button>
          </div>

          {trailerKey && (
            <div className="trailer-section">
              <h2>Bande-annonce</h2>
              <div className="video-wrapper">
                <iframe
                  title="Trailer"
                  src={`https://www.youtube.com/embed/${trailerKey}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {cast.length > 0 && (
        <section className="cast-section">
          <h2>Distribution</h2>
          <div className="cast-grid">
            {cast.map((actor) => (
              <div key={`${actor.name}-${actor.character}`} className="cast-card">
                <img src={posterUrl(actor.image)} alt={actor.name} />
                <div>
                  <strong>{actor.name}</strong>
                  <span>{actor.character}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
