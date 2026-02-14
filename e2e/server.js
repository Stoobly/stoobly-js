const path = require('path');
const { SERVER_URL } = require('./server-config.js');

// server.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/headers', (req, res) => {
  console.log('GET /headers');
  res.json(req.headers);
});

app.get('/api/data', (req, res) => {
  console.log('GET /api/data');
  res.json(req.headers);
});

app.listen(3000, () => {
  console.log(`Mock server running on ${SERVER_URL}`);
});
