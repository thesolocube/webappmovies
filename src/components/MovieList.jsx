import MovieCard from './MovieCard.jsx';

export default function MovieList({ title, movies }) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="row-section">
      <div className="row-header">
        <h2>{title}</h2>
      </div>
      <div className="row-cards">
        {movies.map((movie) => (
          <MovieCard key={`${movie.mediaType}-${movie.movieId}`} movie={movie} />
        ))}
      </div>
    </section>
  );
}
