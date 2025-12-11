#!/usr/bin/env node
/**
 * 배포 시 버전 번호를 업데이트하는 스크립트
 * HTML 파일의 스크립트와 스타일시트에 버전 쿼리 파라미터를 추가합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 현재 날짜와 시간을 버전 번호로 사용 (YYYY-MM-DD-HHMM 형식)
const now = new Date();
const version = now.toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3-$4$5');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // app-version 메타 태그 업데이트 (가장 중요: HTML 버전 체크용)
    if (html.includes('name="app-version"')) {
        html = html.replace(
            /<meta\s+name=["']app-version["']\s+content=["'][^"']*["']/i,
            `<meta name="app-version" content="${version}"`
        );
    } else {
        // app-version 메타 태그가 없으면 naver-site-verification 다음에 추가
        html = html.replace(
            /(<meta\s+name=["']naver-site-verification["'][^>]*>)/i,
            `$1\n  <meta name="app-version" content="${version}" />`
        );
    }
    
    // styles.css 버전 업데이트
    html = html.replace(
        /href="styles\.css\?v=[^"]*"/,
        `href="styles.css?v=${version}"`
    );
    
    // main.js 버전 업데이트
    html = html.replace(
        /src="main\.js\?v=[^"]*"/,
        `src="main.js?v=${version}"`
    );
    
    // 버전이 없는 경우 추가
    if (!html.includes('styles.css?v=')) {
        html = html.replace(
            /href="styles\.css"/,
            `href="styles.css?v=${version}"`
        );
    }
    
    if (!html.includes('main.js?v=')) {
        html = html.replace(
            /src="main\.js"/,
            `src="main.js?v=${version}"`
        );
    }
    
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`✅ 버전 번호 업데이트 완료: ${version}`);
} catch (error) {
    console.error('❌ 버전 번호 업데이트 실패:', error);
    process.exit(1);
}

