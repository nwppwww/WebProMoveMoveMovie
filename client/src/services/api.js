import axios from 'axios'

// ─── Backend Proxy for Supabase REST API (Secured) ────────
const PROXY_URL = '/api/supabase/rest/v1';

const sbApi = axios.create({
  baseURL: PROXY_URL,
  headers: { 
    'Content-Type': 'application/json'
    // Apikey and Authorization are injected by the backend proxy securely
  },
})

sbApi.interceptors.response.use(
  res => res,
  err => {
    console.error('Supabase API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

// ─── Movies (Axios) ───────────────────────────────────────────
export const movieAPI = {
  // ดึงหนังยอดนิยม (เรียงตามปีล่าสุด)
  getPopular: () => sbApi.get('/movies?order=releaseyear.desc&limit=12&select=*'),
  // ดึงรายชื่อหนังทั้งหมด
  getAll: () => sbApi.get('/movies?select=*'),
  // ค้นหาหนัง (Filter ผ่าน REST API ของ Supabase)
  search: (q) => sbApi.get(`/movies?title=ilike.*${encodeURIComponent(q)}*&select=*`),
  // ดึงหนังรายเรื่อง
  getById: (id) => sbApi.get(`/movies?id=eq.${id}&select=*`),
  // ดึงฉากของหนัง
  getScenes: (movieId) => sbApi.get(`/scenes?movieid=eq.${movieId}&select=*`),
}

// ─── Locations (Axios) ─────────────────────────────────────────
export const locationAPI = {
  // ดึงสถานที่ทั้งหมดมาแสดงบนแผนที่
  getAll: () => sbApi.get('/locations?hidden=eq.false&select=*'),
}

// ─── Reviews (Axios) ──────────────────────────────────────────
export const reviewAPI = {
  getByLocation: (locationId) => sbApi.get(`/reviews?locationid=eq.${locationId}&select=*`),
}