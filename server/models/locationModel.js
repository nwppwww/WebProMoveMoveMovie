const db = require('../database/db')
const LocationModel = {
  findAll: () =>
    db.prepare(`
      SELECT l.*, m.title as movie_title, m.tmdb_id, m.poster_path
      FROM locations l
      JOIN movies m ON l.movie_id = m.id
      ORDER BY l.created_at DESC
    `).all(),
  findById: (id) =>
    db.prepare(`
      SELECT l.*, m.title as movie_title, m.tmdb_id, m.poster_path
      FROM locations l
      JOIN movies m ON l.movie_id = m.id
      WHERE l.id = ?
    `).get(id),
  findByMovieId: (movie_id) =>
    db.prepare('SELECT * FROM locations WHERE movie_id = ?').all(movie_id),
  create: (loc) =>
    db.prepare(`
      INSERT INTO locations (movie_id, name, description, lat, lng, image_url)
      VALUES (@movie_id, @name, @description, @lat, @lng, @image_url)
    `).run(loc),
  update: (id, loc) =>
    db.prepare(`
      UPDATE locations
      SET name = @name, description = @description,
          lat = @lat, lng = @lng, image_url = @image_url
      WHERE id = @id
    `).run({ ...loc, id }),
  delete: (id) =>
    db.prepare('DELETE FROM locations WHERE id = ?').run(id)
}
module.exports = LocationModel