import { Link } from 'react-router-dom';
import { posterUrl } from '../api/tmdb.js';

export default function MovieCard({ movie }) {
  const label = movie.movieName || 'Titre inconnu';
  const date = movie.movieDate ? `(${movie.movieDate.slice(0, 4)})` : '';
  const progress = movie.progress || 0;
  return (
    <Link
      to={`/details/${movie.mediaType || 'movie'}/${movie.movieId}`}
      className="movie-card"
      title={label}
    >
      <div className="movie-card-media">
        <img
          src={posterUrl(movie.movieImage)}
          alt={label}
          className="movie-card-image"
        />
        {progress > 0 && (
          <div className="movie-card-progress">
            <span>Reprendre ({Math.round(progress * 100)}%)</span>
            <div className="movie-card-progress-bar">
              <div className="movie-card-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="movie-card-title">
        <strong>{label}</strong>
        <span>{date}</span>
      </div>
    </Link>
  );
}
