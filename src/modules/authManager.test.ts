/**
 * AuthManager 모듈 테스트
 * 
 * 인증 관리 로직의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthManager, FirebaseUser } from './authManager.js';

describe('AuthManager 모듈', () => {
  let authManager: AuthManager;
  let mockFirebase: any;

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
    
    // Firebase Mock
    mockFirebase = {
      auth: {},
      onAuthStateChanged: vi.fn((auth: any, callback: (user: any) => void) => {
        // 즉시 null로 콜백 호출 (로그아웃 상태)
        callback(null);
      }),
      signInWithEmailAndPassword: vi.fn(),
      createUserWithEmailAndPassword: vi.fn(),
      signInWithPopup: vi.fn(),
      signOut: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      GoogleAuthProvider: vi.fn()
    };

    (window as any).firebase = mockFirebase;
    
    // AuthManager 인스턴스 생성
    authManager = new AuthManager();
  });

  describe('초기화', () => {
    it('AuthManager가 정상적으로 생성되어야 함', () => {
      expect(authManager).toBeInstanceOf(AuthManager);
    });

    it('초기 상태는 로그아웃 상태여야 함', () => {
      expect(authManager.isLoggedIn()).toBe(false);
      expect(authManager.getCurrentUser()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('로그아웃 상태에서는 null을 반환해야 함', () => {
      expect(authManager.getCurrentUser()).toBeNull();
    });

    it('사용자 정보를 반환해야 함', () => {
      const mockUser: FirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      // 직접 currentUser 설정 (테스트용)
      (authManager as any).currentUser = mockUser;
      
      const user = authManager.getCurrentUser();
      expect(user).toEqual(mockUser);
      expect(user?.uid).toBe('test-uid');
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('isLoggedIn', () => {
    it('로그아웃 상태에서는 false를 반환해야 함', () => {
      expect(authManager.isLoggedIn()).toBe(false);
    });

    it('로그인 상태에서는 true를 반환해야 함', () => {
      (authManager as any).currentUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null
      };
      
      expect(authManager.isLoggedIn()).toBe(true);
    });
  });

  describe('onAuthStateChange', () => {
    it('인증 상태 변경 콜백이 등록되어야 함', () => {
      const callback = vi.fn();
      authManager.onAuthStateChange(callback);
      
      // 인증 상태 변경 시뮬레이션
      const mockUser: FirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null
      };
      
      (authManager as any).notifyAuthStateChange(mockUser);
      
      expect(callback).toHaveBeenCalledWith(mockUser);
    });

    it('여러 콜백이 모두 호출되어야 함', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      authManager.onAuthStateChange(callback1);
      authManager.onAuthStateChange(callback2);
      
      const mockUser: FirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null
      };
      
      (authManager as any).notifyAuthStateChange(mockUser);
      
      expect(callback1).toHaveBeenCalledWith(mockUser);
      expect(callback2).toHaveBeenCalledWith(mockUser);
    });

    it('콜백에서 에러가 발생해도 다른 콜백은 실행되어야 함', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();
      
      authManager.onAuthStateChange(errorCallback);
      authManager.onAuthStateChange(normalCallback);
      
      const mockUser: FirebaseUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null
      };
      
      expect(() => {
        (authManager as any).notifyAuthStateChange(mockUser);
      }).not.toThrow();
      
      expect(normalCallback).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('cleanup', () => {
    it('리소스가 정리되어야 함', () => {
      const callback = vi.fn();
      authManager.onAuthStateChange(callback);
      
      authManager.cleanup();
      
      // cleanup 후에도 인스턴스는 유지되어야 함
      expect(authManager).toBeInstanceOf(AuthManager);
    });
  });

  describe('setupFirebaseAuth', () => {
    it('Firebase가 없으면 로컬 모드로 설정해야 함', () => {
      (window as any).firebase = null;
      const localAuthManager = new AuthManager();
      
      localAuthManager.setupFirebaseAuth();
      
      // 로컬 모드로 설정됨
      expect(localAuthManager.getCurrentUser()).toBeNull();
    });

    it('Firebase가 있으면 인증 상태 리스너를 설정해야 함', () => {
      const stateCallback = vi.fn();
      mockFirebase.onAuthStateChanged = vi.fn((auth: any, callback: (user: any) => void) => {
        // 테스트를 위해 즉시 호출
        callback(null);
        return () => {}; // unsubscribe 함수 반환
      });

      authManager.setupFirebaseAuth();
      
      expect(mockFirebase.onAuthStateChanged).toHaveBeenCalled();
    });
  });
});

