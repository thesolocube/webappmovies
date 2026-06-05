import { posterUrl } from '../api/tmdb.js';

function truncate(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export default function HeroBanner({ movie, onPlay, onDetails }) {
  if (!movie) {
    return null;
  }

  const title = movie.movieName || 'À la une';
  const description = truncate(movie.movieDescription, 180);
  const backdrop = posterUrl(movie.movieImage);

  return (
    <section className="hero-banner" style={{ backgroundImage: `url(${backdrop})` }}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="hero-subtitle">Recommandé pour vous</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="hero-actions">
          <button className="button-primary" onClick={() => onPlay(movie)}>
            Continuer
          </button>
          <button className="button-secondary" onClick={() => onDetails(movie)}>
            Voir les détails
          </button>
        </div>
      </div>
    </section>
  );
}
