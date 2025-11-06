import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  // URL에서 쿼리 파라미터와 해시 제거
  const urlPath = req.url.split('?')[0].split('#')[0];
  
  let filePath = '.' + urlPath;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // favicon.ico 요청에 대한 명시적 처리
  if (urlPath === '/favicon.ico') {
    filePath = './favicon.ico';
  }
  
  // 경로 정규화
  filePath = path.normalize(filePath);
  
  // 경로 보안: 상위 디렉토리 접근 방지 (../ 패턴 체크)
  if (filePath.includes('..')) {
    // 정규화 후에도 상위 디렉토리가 있는지 확인
    const resolvedPath = path.resolve(__dirname, filePath);
    const rootPath = path.resolve(__dirname);
    if (!resolvedPath.startsWith(rootPath)) {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end('<h1>403 Forbidden</h1>', 'utf-8');
      return;
    }
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
});
