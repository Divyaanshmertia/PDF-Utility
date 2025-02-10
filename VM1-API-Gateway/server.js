// server.js
require('dotenv').config();
 // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS if your front end is hosted separately
app.use(cors());

// (Optional) Serve static files if needed - currently commented out
// app.use(express.static(path.join(__dirname, 'build')));

// Proxy configuration using environment variables
const pdfMergerUrl = process.env.PDF_MERGER_URL || 'http://192.168.56.102:4000';
const pdfConverterUrl = process.env.PDF_CONVERTER_URL || 'http://192.168.56.103:5000';

// Proxy endpoint for merging PDFs
app.use('/merge', createProxyMiddleware({
  target: pdfMergerUrl,
  changeOrigin: true,
  pathRewrite: { '^/merge': '' },
  onError: (err, req, res) => {
    console.error('Error in proxy for /merge:', err);
    res.status(500).send('Proxy error for /merge');
  }
}));

// Proxy endpoint for converting PDF to images
app.use('/convert', createProxyMiddleware({
  target: pdfConverterUrl,
  changeOrigin: true,
  pathRewrite: { '^/convert': '' },
  onError: (err, req, res) => {
    console.error('Error in proxy for /convert:', err);
    res.status(500).send('Proxy error for /convert');
  }
}));

// Fallback route (if needed)
app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});

