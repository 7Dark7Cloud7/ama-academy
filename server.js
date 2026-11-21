import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const BLOCKED_ROOT_FILES = new Set([
  '/package.json',
  '/package-lock.json',
  '/server.js',
  '/metadata.json',
  '/vercel.json',
]);

// Prevent exposing server files, dotfiles, or node_modules as public static assets.
app.use((req, res, next) => {
  const normalizedPath = path.posix.normalize(req.path);
  if (
    BLOCKED_ROOT_FILES.has(normalizedPath) ||
    normalizedPath === '/node_modules' ||
    normalizedPath.startsWith('/node_modules/') ||
    normalizedPath.split('/').some((segment) => segment.startsWith('.') && segment.length > 1)
  ) {
    return res.status(404).type('text/plain').send('Not found');
  }
  next();
});

// Serve static assets from project root with cache rules matching vercel.json.
app.use(
  express.static(__dirname, {
    index: 'index.html',
    dotfiles: 'ignore',
    setHeaders(res, filePath) {
      if (/\.(css|js)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=300');
      }
    },
  })
);

// SPA fallback for navigation routes while keeping missing asset requests as 404.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (path.extname(req.path)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`AMA static server running at http://${HOST}:${PORT}`);
});
