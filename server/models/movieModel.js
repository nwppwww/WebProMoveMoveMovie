const db = require('../database/db')
const MovieModel = {
  findByTmdbId: (tmdb_id) =>
    db.prepare('SELECT * FROM movies WHERE tmdb_id = ?').get(tmdb_id),
  findAll: () =>
    db.prepare('SELECT * FROM movies').all(),
  upsert: (movie) =>
    db.prepare(`
      INSERT INTO movies (tmdb_id, title, poster_path, overview, release_year)
      VALUES (@tmdb_id, @title, @poster_path, @overview, @release_year)
      ON CONFLICT(tmdb_id) DO UPDATE SET
        title = @title,
        poster_path = @poster_path,
        overview = @overview,
        release_year = @release_year
    `).run(movie)
}
module.exports = MovieModel