const ReviewModel = require('../models/reviewModel')
const reviewController = {
  getByLocation: (req, res) => {
    try {
      res.json(ReviewModel.findByLocationId(req.params.locationId))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  create: (req, res) => {
    try {
      const { location_id, username, comment, rating } = req.body
      if (!location_id || !username || !comment || !rating)
        return res.status(400).json({ error: 'All fields are required' })
      const result = ReviewModel.create({
        location_id: Number(location_id),
        username, comment,
        rating: Number(rating)
      })
      res.status(201).json({ id: result.lastInsertRowid, message: 'Created' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  delete: (req, res) => {
    try {
      ReviewModel.delete(req.params.id)
      res.json({ message: 'Deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}
module.exports = reviewController