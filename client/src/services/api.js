import axios from 'axios'
const SUPABASE_URL = 'https://dbxerewphusfequsqthz.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_8hLBy1wLAbZQ-jeHrac-ag_FNg32_LK';
const sbApi = axios.create({
  baseURL: SUPABASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  },
})
sbApi.interceptors.response.use(
  res => res,
  err => {
    console.error('Supabase API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)
export const movieAPI = {
  getPopular: () => sbApi.get('/movies?order=releaseyear.desc&limit=12&select=*'),
  getAll: () => sbApi.get('/movies?select=*'),
  search: (q) => sbApi.get(`/movies?title=ilike.*${encodeURIComponent(q)}*&select=*`),
  getById: (id) => sbApi.get(`/movies?id=eq.${id}&select=*`),
  getScenes: (movieId) => sbApi.get(`/scenes?movieid=eq.${movieId}&select=*`),
}
export const locationAPI = {
  getAll: () => sbApi.get('/locations?hidden=eq.false&select=*'),
}
export const reviewAPI = {
  getByLocation: (locationId) => sbApi.get(`/reviews?locationid=eq.${locationId}&select=*`),
}