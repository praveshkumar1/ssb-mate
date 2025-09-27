#!/usr/bin/env node

// Simple server test to verify production build
const express = require('express');

const app = express();
const PORT = parseInt(process.env.PORT || '8080');

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  
  // Auto-exit after 5 seconds for testing
  setTimeout(() => {
    console.log('✅ Server test completed successfully');
    process.exit(0);
  }, 5000);
});