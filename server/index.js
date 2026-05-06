const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()
const movieRoutes = require('./routes/movieRoutes')
const locationRoutes = require('./routes/locationRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const supabaseProxy = require('./routes/supabaseProxy') 
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
app.use('/api/supabase', supabaseProxy) 
app.use('/api/movies', movieRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/reviews', reviewRoutes)
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  message: '🎬 movemovemovie API is running!',
  timestamp: new Date().toISOString()
}))
app.use((req, res) => {
  const filePath = path.resolve(__dirname, '..', 'client', 'dist', 'index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Failed to serve React App:', err.message);
      res.status(500).send('Frontend not built. Run "npm run build" in the client folder.');
    }
  });
})
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🎬 movemovemovie Server`)
  console.log(`✅ Running on http://localhost:${PORT}`)
  console.log(`📡 API: http://localhost:${PORT}/api/health\n`)
})