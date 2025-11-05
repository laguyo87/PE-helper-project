/**
 * 테스트 설정 파일
 * 
 * 테스트 실행 전 공통 설정 및 Mock을 정의합니다.
 */

import { vi, beforeEach } from 'vitest';

// ========================================
// DOM Mock 설정
// ========================================

// localStorage Mock (실제 동작하도록 구현)
const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => {
    return localStorageStore[key] || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach(key => {
      delete localStorageStore[key];
    });
  }),
  get length() {
    return Object.keys(localStorageStore).length;
  },
  key: vi.fn((index: number) => {
    const keys = Object.keys(localStorageStore);
    return keys[index] || null;
  })
};

global.localStorage = localStorageMock as any;

// sessionStorage Mock
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.sessionStorage = sessionStorageMock as any;

// ========================================
// Window 객체 Mock
// ========================================

// Firebase Mock
(global as any).window = {
  ...global.window,
  firebase: {
    db: {},
    auth: {},
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    collection: vi.fn(),
  },
  getComputedStyle: vi.fn(() => ({
    display: '',
    pointerEvents: '',
  })),
  location: {
    hostname: 'localhost',
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
};

// ========================================
// 전역 함수 Mock
// ========================================

// console 메서드 Mock (테스트 중 로그 줄이기 위해)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// alert, confirm, prompt Mock
(global as any).alert = vi.fn();
(global as any).confirm = vi.fn(() => true);
(global as any).prompt = vi.fn(() => 'test');

// ========================================
// 각 테스트 전 실행
// ========================================

beforeEach(() => {
  // localStorage 스토어 초기화
  localStorageMock.clear();
  
  // localStorage Mock 함수 초기화
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // sessionStorage 초기화
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // console Mock 초기화
  vi.clearAllMocks();
});

