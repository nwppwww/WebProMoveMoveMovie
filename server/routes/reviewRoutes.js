const express = require('express')
const router = express.Router()
const c = require('../controllers/reviewController')
router.get('/location/:locationId', c.getByLocation)
router.post('/', c.create)
router.delete('/:id', c.delete)
module.exports = router