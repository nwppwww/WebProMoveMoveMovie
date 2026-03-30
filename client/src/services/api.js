import axios from 'axios'

// ─── TMDB Direct API (สำหรับการรันบน Vercel ที่ไม่มี Backend) ────────
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = 'c3bfb718ba9a7d50b163232bd60578e6';

const tmdbApi = axios.create({
  baseURL: TMDB_BASE,
  params: { api_key: TMDB_KEY, language: 'th-TH' },
  headers: { 'Content-Type': 'application/json' },
})

tmdbApi.interceptors.response.use(
  res => res,
  err => {
    console.error('TMDB API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

// ตำแหน่งเดิมของ Local API backend
const localApi = axios.create({
  baseURL: 'http://localhost:5000/api', // หากต้องการรัน Local backend
  headers: { 'Content-Type': 'application/json' },
})

// ─── Movies (TMDB) ───────────────────────────────────────────
export const movieAPI = {
  search:     (q)      => tmdbApi.get(`/search/movie?query=${encodeURIComponent(q)}`),
  getPopular: ()       => tmdbApi.get('/movie/popular'),
  getById:    (tmdbId) => tmdbApi.get(`/movie/${tmdbId}`),
}

// ─── Locations (Local Backend / Not Active on Vercel) ──────────
export const locationAPI = {
  getAll:     ()        => localApi.get('/locations'),
  getById:    (id)      => localApi.get(`/locations/${id}`),
  getByMovie: (tmdbId)  => localApi.get(`/locations/movie/${tmdbId}`),
  create:     (data)    => localApi.post('/locations', data),
  update:     (id, data)=> localApi.put(`/locations/${id}`, data),
  delete:     (id)      => localApi.delete(`/locations/${id}`),
}

// ─── Reviews (Local Backend / Not Active on Vercel) ────────────
export const reviewAPI = {
  getByLocation: (locationId) => localApi.get(`/reviews/location/${locationId}`),
  create:        (data)       => localApi.post('/reviews', data),
  delete:        (id)         => localApi.delete(`/reviews/${id}`),
}