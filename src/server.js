const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;

const server = createApp().listen(PORT, () => {
  console.log(`Notes API listening on port ${PORT}`);
});

// Graceful shutdown when Docker stops the container
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
