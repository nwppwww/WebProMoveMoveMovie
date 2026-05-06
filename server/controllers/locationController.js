const LocationModel = require('../models/locationModel')
const MovieModel = require('../models/movieModel')
const locationController = {
  getAll: (req, res) => {
    try {
      res.json(LocationModel.findAll())
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  getById: (req, res) => {
    try {
      const location = LocationModel.findById(req.params.id)
      if (!location) return res.status(404).json({ error: 'Not found' })
      res.json(location)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  getByMovieTmdbId: (req, res) => {
    try {
      const movie = MovieModel.findByTmdbId(req.params.tmdbId)
      if (!movie) return res.json([])
      res.json(LocationModel.findByMovieId(movie.id))
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  create: (req, res) => {
    try {
      const { tmdb_id, name, description, lat, lng, image_url } = req.body
      if (!tmdb_id || !name || lat == null || lng == null)
        return res.status(400).json({ error: 'tmdb_id, name, lat, lng are required' })
      const movie = MovieModel.findByTmdbId(tmdb_id)
      if (!movie) return res.status(404).json({ error: 'Movie not found. Please load the movie first.' })
      const result = LocationModel.create({
        movie_id: movie.id, name, description,
        lat: parseFloat(lat), lng: parseFloat(lng), image_url: image_url || null
      })
      res.status(201).json({ id: result.lastInsertRowid, message: 'Created' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  update: (req, res) => {
    try {
      const { name, description, lat, lng, image_url } = req.body
      LocationModel.update(req.params.id, {
        name, description,
        lat: parseFloat(lat), lng: parseFloat(lng),
        image_url: image_url || null
      })
      res.json({ message: 'Updated' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  delete: (req, res) => {
    try {
      LocationModel.delete(req.params.id)
      res.json({ message: 'Deleted' })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}
module.exports = locationController