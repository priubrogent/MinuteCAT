import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production on Railway, set DATA_DIR to your mounted volume path (e.g. /data)
// so clues survive redeploys. Falls back to local ./data in development.
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'clues.json');

const PORT = process.env.PORT ?? 3001;

const SEED_CLUES = [
  {
    id: 'seed-1',
    parts: [
      { text: 'Al ', type: 'linking' },
      { text: 'cabirolet', type: 'fodder' },
      { text: " s'", type: 'linking' },
      { text: 'amaga', type: 'indicator' },
      { text: ' la ', type: 'linking' },
      { text: 'primavera', type: 'definition' },
    ],
    answerLength: 5,
    answer: 'ABRIL',
    par: 3,
    solvers: 12480,
    date: '2026-04-17',
    dateLabel: "17 d'abril de 2026",
  },
];

function readClues() {
  if (!fs.existsSync(DATA_FILE)) return SEED_CLUES;
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return SEED_CLUES;
  }
}

function writeClues(clues) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(clues, null, 2), 'utf-8');
}

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.get('/api/clues', (_req, res) => {
  res.json(readClues());
});

app.put('/api/clues/:id', (req, res) => {
  const clues = readClues();
  const idx = clues.findIndex((c) => c.id === req.params.id);
  if (idx >= 0) clues[idx] = req.body;
  else clues.push(req.body);
  writeClues(clues);
  res.json({ ok: true });
});

app.delete('/api/clues/:id', (req, res) => {
  writeClues(readClues().filter((c) => c.id !== req.params.id));
  res.json({ ok: true });
});

app.post('/api/clues/import', (req, res) => {
  writeClues(req.body);
  res.json({ ok: true });
});

// In production, serve the Vite build and handle SPA routing
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server → http://localhost:${PORT}`);
  console.log(`Data   → ${DATA_FILE}`);
  console.log(`Mode   → ${process.env.NODE_ENV ?? 'development'}`);
});
