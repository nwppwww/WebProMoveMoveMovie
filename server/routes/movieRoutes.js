const express = require('express')
const router = express.Router()
const c = require('../controllers/movieController')
router.get('/search', c.search)
router.get('/popular', c.getPopular)
router.get('/:tmdbId', c.getById)
module.exports = router