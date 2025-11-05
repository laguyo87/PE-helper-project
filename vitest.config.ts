/**
 * Vitest 설정 파일
 * 
 * 테스트 환경 및 옵션을 설정합니다.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 테스트 환경 (DOM API 필요)
    environment: 'happy-dom',
    
    // 글로벌 테스트 API 사용 여부 (describe, it, expect 등)
    globals: true,
    
    // 테스트 파일 패턴
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // 제외할 파일
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },
    
    // 타임아웃 (ms)
    testTimeout: 10000,
    
    // 설정 파일
    setupFiles: ['./src/test/setup.ts'],
    
    // 출력 옵션
    outputFile: './test-results.json',
    reporters: ['verbose']
  },
  
  // 해상도 설정
  resolve: {
    alias: {
      '@': './src'
    }
  }
});

