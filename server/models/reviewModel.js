const db = require('../database/db')
const ReviewModel = {
  findByLocationId: (location_id) =>
    db.prepare('SELECT * FROM reviews WHERE location_id = ? ORDER BY created_at DESC')
      .all(location_id),
  create: (review) =>
    db.prepare(`
      INSERT INTO reviews (location_id, username, comment, rating)
      VALUES (@location_id, @username, @comment, @rating)
    `).run(review),
  delete: (id) =>
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id)
}
module.exports = ReviewModel