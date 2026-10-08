/**
 * Clair Private Beta Web Server
 * Built with native Node.js HTTP module (zero dependencies).
 * Enforces HTTP Basic Auth, X-Robots-Tag: noindex, nofollow, and static asset streaming.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const USER = process.env.BASIC_AUTH_USER || 'clair';
const PASS = process.env.BASIC_AUTH_PASS || 'clair-beta-2026';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Always enforce Search Engine Blocking / No-Follow
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Health check endpoint for DigitalOcean App Platform (bypass auth)
  if (req.url === '/_health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // 1. Password Protection (HTTP Basic Authentication)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="Clair Private Beta Access"',
      'Content-Type': 'text/plain; charset=utf-8'
    });
    return res.end('401 Unauthorized: Credentials required to view Clair Private Beta.');
  }

  try {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8').split(':');
    const incomingUser = credentials[0];
    const incomingPass = credentials.slice(1).join(':');

    if (incomingUser !== USER || incomingPass !== PASS) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Clair Private Beta Access"',
        'Content-Type': 'text/plain; charset=utf-8'
      });
      return res.end('401 Unauthorized: Invalid username or password.');
    }
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('400 Bad Request');
  }

  // 2. Safe Static File Resolution
  const cleanUrl = req.url.split('?')[0].split('#')[0];
  const relativePath = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
  let targetFile = path.resolve(__dirname, relativePath);

  // Directory traversal check
  if (!targetFile.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(targetFile, (err, stats) => {
    if (err || !stats.isFile()) {
      // If client requested non-existent file, serve index.html for SPA/anchor links or 404
      if (cleanUrl !== '/favicon.ico' && !path.extname(cleanUrl)) {
        targetFile = path.resolve(__dirname, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('404 Not Found');
      }
    }

    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Browser caching: 1 hour for static assets, no-cache for index.html
    if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(targetFile).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Clair Private Beta server listening on port ${PORT}`);
  console.log(`Basic Auth active: user=${USER}`);
});
