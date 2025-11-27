#!/usr/bin/env node

/**
 * 번들 크기 분석 스크립트
 * 
 * 빌드된 파일들의 크기를 분석하고 리포트를 생성합니다.
 */

const fs = require('fs');
const path = require('path');

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = 1024 * 1024;

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
function formatSize(bytes) {
  if (bytes < BYTES_PER_KB) {
    return `${bytes}B`;
  } else if (bytes < BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_KB).toFixed(2)}KB`;
  } else {
    return `${(bytes / BYTES_PER_MB).toFixed(2)}MB`;
  }
}

/**
 * 디렉토리의 모든 파일 크기 계산
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stat.size;
    }
  });

  return totalSize;
}

/**
 * 파일 크기 정보 수집
 */
function collectFileSizes(dirPath, basePath = '') {
  const files = [];
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      files.push(...collectFileSizes(itemPath, relativePath));
    } else {
      files.push({
        path: relativePath,
        size: stat.size,
        formattedSize: formatSize(stat.size)
      });
    }
  });

  return files;
}

/**
 * 메인 실행
 */
function main() {
  console.log('📦 번들 크기 분석 시작...\n');

  const distPath = path.join(process.cwd(), 'dist');
  const jsPath = path.join(process.cwd(), 'js');
  const mainJsPath = path.join(process.cwd(), 'main.js');

  const results = {
    dist: { files: [], totalSize: 0 },
    js: { files: [], totalSize: 0 },
    main: { size: 0 }
  };

  // dist 디렉토리 분석
  if (fs.existsSync(distPath)) {
    results.dist.files = collectFileSizes(distPath, 'dist');
    results.dist.totalSize = results.dist.files.reduce((sum, file) => sum + file.size, 0);
  }

  // js 디렉토리 분석
  if (fs.existsSync(jsPath)) {
    results.js.files = collectFileSizes(jsPath, 'js');
    results.js.totalSize = results.js.files.reduce((sum, file) => sum + file.size, 0);
  }

  // main.js 분석
  if (fs.existsSync(mainJsPath)) {
    const stat = fs.statSync(mainJsPath);
    results.main.size = stat.size;
  }

  // 결과 출력
  console.log('📊 번들 크기 분석 결과:\n');
  
  console.log('📁 dist 디렉토리:');
  console.log(`   총 크기: ${formatSize(results.dist.totalSize)}`);
  console.log(`   파일 수: ${results.dist.files.length}\n`);

  // 큰 파일 상위 10개
  const topFiles = [...results.dist.files, ...results.js.files]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  console.log('🔝 상위 10개 큰 파일:');
  topFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.path}: ${file.formattedSize}`);
  });

  console.log('\n📁 js 디렉토리:');
  console.log(`   총 크기: ${formatSize(results.js.totalSize)}`);
  console.log(`   파일 수: ${results.js.files.length}\n`);

  console.log('📄 main.js:');
  console.log(`   크기: ${formatSize(results.main.size)}\n`);

  // 모듈별 크기 분석
  const moduleSizes = {};
  [...results.dist.files, ...results.js.files].forEach(file => {
    if (file.path.includes('modules/')) {
      const moduleName = path.basename(file.path, path.extname(file.path));
      if (!moduleSizes[moduleName]) {
        moduleSizes[moduleName] = 0;
      }
      moduleSizes[moduleName] += file.size;
    }
  });

  console.log('📦 모듈별 크기 (상위 10개):');
  const sortedModules = Object.entries(moduleSizes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  sortedModules.forEach(([module, size], index) => {
    console.log(`   ${index + 1}. ${module}: ${formatSize(size)}`);
  });

  console.log('\n✅ 분석 완료!');
}

main();

