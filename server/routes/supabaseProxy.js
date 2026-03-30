const express = require('express');
const axios = require('axios');
const router = express.Router();

const SUPABASE_URL = 'https://dbxerewphusfequsqthz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_8hLBy1wLAbZQ-jeHrac-ag_FNg32_LK';

// Catch all requests exactly via /api/supabase/
router.all('/*', async (req, res) => {
  try {
    // Map localhost:5000/api/supabase/rest/v1/... -> supabase.co/rest/v1/...
    const path = req.originalUrl.replace('/api/supabase', '');
    const targetUrl = `${SUPABASE_URL}${path}`;

    // Pass necessary headers
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    delete headers['content-length']; // <--- สำคัญมาก: ให้ Axios รันคำนวณ body size ใหม่
    // Inject the real Supabase key securely from the Backend
    headers['apikey'] = SUPABASE_KEY;
    headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: Object.keys(req.body).length > 0 ? req.body : undefined,
      responseType: 'arraybuffer', // Handle JSON and potentially binary safely
      validateStatus: () => true // Resolve all HTTP statuses
    });

    // Mirror the Headers
    Object.keys(response.headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'transfer-encoding' && lowerKey !== 'content-encoding') {
        res.setHeader(key, response.headers[key]);
      }
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).json({ error: 'Proxy implementation error', details: error.message });
  }
});

module.exports = router;
