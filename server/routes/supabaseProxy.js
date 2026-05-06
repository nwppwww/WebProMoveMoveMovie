const express = require('express');
const axios = require('axios');
const router = express.Router();
const SUPABASE_URL = 'https://dbxerewphusfequsqthz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_8hLBy1wLAbZQ-jeHrac-ag_FNg32_LK';
router.all('*splat', async (req, res) => {
  try {
    const path = req.originalUrl.replace('/api/supabase', '');
    const targetUrl = `${SUPABASE_URL}${path}`;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    delete headers['content-length']; 
    headers['apikey'] = SUPABASE_KEY;
    headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: Object.keys(req.body).length > 0 ? req.body : undefined,
      responseType: 'arraybuffer', 
      validateStatus: () => true 
    });
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