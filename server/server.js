// server/server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const open = require('open').default;

const app = express();
const PORT = process.env.PORT || 3000;

// Path to your built Vite app in docs/
const docsPath = path.join(__dirname, '..', 'docs');

// 1️⃣ Serve static files under /ShotMasterRT
app.use('/ShotMasterRT', express.static(docsPath));

// 2️⃣ Parse raw body for POST/PUT/PATCH
app.use(express.raw({ type: '*/*' }));

// 3️⃣ Proxy route (same as your Flask server)
app.all('/proxy/*', async (req, res) => {
  try {
    const targetUrl = decodeURIComponent(req.params[0]);

    if (req.method === 'OPTIONS') {
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': '*',
      });
      return res.sendStatus(200);
    }

    const headers = { ...req.headers };
    delete headers.host;

    const response = await axios.request({
      url: targetUrl,
      method: req.method,
      headers,
      params: req.query,
      data: req.body,
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    const excludedHeaders = ['content-encoding', 'transfer-encoding', 'content-length'];
    for (const [key, value] of Object.entries(response.headers)) {
      if (!excludedHeaders.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });

    res.status(response.status).send(response.data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error');
  }
});

// 4️⃣ SPA fallback — only for requests under /ShotMasterRT
app.get('/ShotMasterRT/*', (req, res) => {
  // Remove /ShotMasterRT prefix to get relative path in docs
  const relativePath = req.path.replace(/^\/ShotMasterRT\//, '');
  const requestedFile = path.join(docsPath, relativePath);

  if (fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return res.sendFile(requestedFile);
  }

  // Otherwise serve index.html
  res.sendFile(path.join(docsPath, 'index.html'));
});

// 5️⃣ Start server
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}/ShotMasterRT`);
  try {
    await open(`http://localhost:${PORT}/ShotMasterRT`);
  } catch (err) {
    console.warn('Failed to open browser automatically:', err.message);
  }
});
