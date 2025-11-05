#!/usr/bin/env node
/**
 * main.js의 import 경로를 수정하는 스크립트
 * './modules/' → './js/modules/'로 변경
 */

const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '..', 'main.js');

if (!fs.existsSync(mainJsPath)) {
  console.error('main.js 파일을 찾을 수 없습니다.');
  process.exit(1);
}

let content = fs.readFileSync(mainJsPath, 'utf8');

// './modules/'를 './js/modules/'로 변경
const fixedContent = content.replace(/from '\.\/modules\//g, "from './js/modules/");

if (content !== fixedContent) {
  fs.writeFileSync(mainJsPath, fixedContent, 'utf8');
  console.log('✅ main.js의 import 경로를 수정했습니다.');
} else {
  console.log('ℹ️  변경할 경로가 없습니다.');
}

