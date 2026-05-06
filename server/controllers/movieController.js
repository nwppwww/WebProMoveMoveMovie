const axios = require('axios')
const MovieModel = require('../models/movieModel')
const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env.TMDB_API_KEY
const movieController = {
  search: async (req, res) => {
    try {
      const { q } = req.query
      if (!q) return res.status(400).json({ error: 'Query is required' })
      const response = await axios.get(`${TMDB_BASE}/search/movie`, {
        params: { api_key: API_KEY, query: q, language: 'th-TH' }
      })
      res.json(response.data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  getPopular: async (req, res) => {
    try {
      const response = await axios.get(`${TMDB_BASE}/movie/popular`, {
        params: { api_key: API_KEY, language: 'th-TH' }
      })
      res.json(response.data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
  getById: async (req, res) => {
    try {
      const { tmdbId } = req.params
      const response = await axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
        params: { api_key: API_KEY, language: 'th-TH' }
      })
      const data = response.data
      MovieModel.upsert({
        tmdb_id: data.id,
        title: data.title,
        poster_path: data.poster_path,
        overview: data.overview,
        release_year: data.release_date ? new Date(data.release_date).getFullYear() : null
      })
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}
module.exports = movieController