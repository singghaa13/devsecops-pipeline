// Notes API — intentionally small, but written with security basics in mind.
const express = require('express');
const helmet = require('helmet');

function createApp() {
  const app = express();

  // --- Security middleware -------------------------------------------------
  app.disable('x-powered-by');             // don't advertise "Express"
  app.use(helmet());                       // CSP, X-Frame-Options, nosniff, HSTS, etc.
  app.use(express.json({ limit: '10kb' })); // block huge request bodies

  // --- In-memory "database" ------------------------------------------------
  const notes = [];
  let nextId = 1;

  // --- Routes --------------------------------------------------------------
  app.get('/', (req, res) => {
    res.type('html').send(
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
        '<title>DevSecOps Notes API</title></head>' +
        '<body><h1>DevSecOps Notes API</h1>' +
        '<p>Try <a href="/health">/health</a> or <a href="/api/notes">/api/notes</a>.</p>' +
        '</body></html>'
    );
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/notes', (req, res) => {
    res.json(notes);
  });

  app.get('/api/notes/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const note = notes.find((n) => n.id === id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  });

  app.post('/api/notes', (req, res) => {
    const text = req.body ? req.body.text : undefined;

    // Input validation: only accept a non-empty string up to 500 chars
    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
      return res
        .status(400)
        .json({ error: 'text must be a non-empty string of up to 500 characters' });
    }

    const note = { id: nextId++, text: text.trim(), createdAt: new Date().toISOString() };
    notes.push(note);
    res.status(201).json(note);
  });

  app.delete('/api/notes/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    notes.splice(index, 1);
    res.status(204).end();
  });

  // --- 404 + error handling (never leak stack traces) ----------------------
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status && err.status < 500 ? err.status : 500;
    if (status === 500) {
      console.error(err);
    }
    res.status(status).json({ error: status === 500 ? 'Internal server error' : 'Bad request' });
  });

  return app;
}

module.exports = { createApp };
