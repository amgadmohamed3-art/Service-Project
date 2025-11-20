require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

/*
Example routing:

* /users -> http://localhost:4001/api
* /auth  -> http://localhost:4002/api
* /contents -> http://localhost:4003/api
  Adjust ports to match each service's PORT in .env
  */

app.use('/users', createProxyMiddleware({ target: 'http://localhost:6001', changeOrigin: true }));
app.use('/auth', createProxyMiddleware({ target: 'http://localhost:6002', changeOrigin: true }));
app.use('/contents', createProxyMiddleware({ target: 'http://localhost:6003', changeOrigin: true }));
app.use('/recs', createProxyMiddleware({ target: 'http://localhost:6004', changeOrigin: true }));
app.use('/search', createProxyMiddleware({ target: 'http://localhost:6005', changeOrigin: true }));
app.use('/reviews', createProxyMiddleware({ target: 'http://localhost:6006', changeOrigin: true }));
app.use('/notify', createProxyMiddleware({ target: 'http://localhost:6007', changeOrigin: true }));
app.use('/admin', createProxyMiddleware({ target: 'http://localhost:6008', changeOrigin: true }));

app.get('/', (req,res)=> res.json({ gateway: true }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, ()=> console.log('API Gateway listening on', PORT));
