import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  // URL에서 쿼리 파라미터와 해시 제거
  const urlPath = req.url.split('?')[0].split('#')[0];
  
  // 루트 경로 처리
  let relativePath = urlPath;
  if (relativePath === '/') {
    relativePath = '/index.html';
  }
  
  // 앞의 슬래시 제거하고 상대 경로로 변환
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.substring(1);
  }
  
  // 파일 경로 생성 (절대 경로로 변환)
  const filePath = path.join(__dirname, relativePath);
  
  // 경로 보안: 상위 디렉토리 접근 방지
  const rootPath = path.resolve(__dirname);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(rootPath)) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>', 'utf-8');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
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
  
  // ES 모듈을 위한 추가 헤더
  const headers = {
    'Content-Type': contentType
  };
  
  // JavaScript 파일의 경우 CORS 및 모듈 지원 헤더 추가
  if (extname === '.js') {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  // 디버깅 로그
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} -> ${filePath}`);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.error(`404 Not Found: ${req.url} -> ${filePath}`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<h1>404 Not Found</h1><p>File: ${filePath}</p>`, 'utf-8');
      } else {
        console.error(`Server Error: ${error.code} for ${filePath}`);
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, headers);
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
});
