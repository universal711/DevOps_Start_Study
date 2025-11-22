const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

let visitCount = 0;

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  visitCount++;
  res.json({
    message: 'Hello from Docker & Kubernetes!',
    visitCount: visitCount,
    timestamp: new Date().toISOString(),
    containerId: process.env.HOSTNAME || 'local',
    nodeVersion: process.version
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'visit-counter',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/stats', (req, res) => {
  res.json({
    totalVisits: visitCount,
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    visitCount: visitCount,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /stats',
      'GET /metrics'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Main endpoint: http://localhost:${PORT}/`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
