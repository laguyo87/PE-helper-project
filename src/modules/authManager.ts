/**
 * 사용자 인증 및 관리 모듈
 *
 * 이 모듈은 Firebase Authentication을 통한 사용자 인증, 로그인/로그아웃,
 * 회원가입, 비밀번호 재설정 등의 기능을 담당합니다.
 * TypeScript로 작성되어 타입 안정성을 보장합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

import { logger, logInfo, logWarn, logError } from './logger.js';

// ========================================
// 타입 정의
// ========================================

/**
 * Firebase 사용자 정보 타입
 */
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * 인증 폼 타입
 */
export type AuthFormType = 'login' | 'signup' | 'reset';

/**
 * 인증 오류 타입
 */
export type AuthErrorType = 'login' | 'signup' | 'reset';

/**
 * 인증 상태 변경 콜백 함수 타입
 */
export type AuthStateChangeCallback = (user: FirebaseUser | null) => void;

/**
 * 인증 오류 정보 타입
 */
export interface AuthError {
  code: string;
  message: string;
}

/**
 * 인증 설정 옵션 타입
 */
export interface AuthConfig {
  enableGoogleAuth: boolean;
  enablePasswordReset: boolean;
  enableEmailVerification: boolean;
}

// ========================================
// 상수 정의
// ========================================

/** 기본 인증 설정 */
const DEFAULT_AUTH_CONFIG: AuthConfig = {
  enableGoogleAuth: true,
  enablePasswordReset: true,
  enableEmailVerification: false
};

/** 인증 오류 메시지 매핑 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': '가입되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
  'auth/user-disabled': '비활성화된 계정입니다.',
  'auth/too-many-requests': '너무 많은 시도로 인해 일시적으로 차단되었습니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.',
  'auth/operation-not-allowed': '이 인증 방법은 허용되지 않습니다.',
  'auth/network-request-failed': '네트워크 오류가 발생했습니다.',
  'auth/invalid-credential': '인증 정보가 올바르지 않습니다.'
};

// ========================================
// 유틸리티 함수
// ========================================

/**
 * DOM 요소를 안전하게 선택합니다.
 * @param selector CSS 선택자
 * @returns 선택된 요소 또는 null
 */
const $ = (selector: string): HTMLElement | null => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    logWarn(`querySelector error (${selector}):`, error);
    return null;
  }
};

/**
 * 로그를 출력합니다.
 * @param message 로그 메시지
 * @param data 추가 데이터
 */
const log = (message: string, data?: any): void => {
  logger.debug(`[AuthManager] ${message}`, data || '');
};

/**
 * 오류를 로그로 출력합니다.
 * @param message 오류 메시지
 * @param error 오류 객체
 */
const logErrorLocal = (message: string, error?: any): void => {
  logError(`[AuthManager] ${message}`, error || '');
};

// ========================================
// 인증 관리 클래스
// ========================================

/**
 * 사용자 인증 및 관리 클래스
 */
export class AuthManager {
  private currentUser: FirebaseUser | null = null;
  private authStateCallbacks: AuthStateChangeCallback[] = [];
  private config: AuthConfig;
  private firebase: any = null;
  private abortController: AbortController | null = null;
  private googleLoginHandler: ((e: Event) => void) | null = null;
  private logoutHandler: ((e: Event) => void) | null = null;
  private eventListenerSetupRetryCount: number = 0;
  private readonly MAX_EVENT_LISTENER_RETRY: number = 5;
  private dataReloadCallback: (() => Promise<void>) | null = null;
  private isLoggingIn: boolean = false; // 로그인 진행 중 플래그
  private isReloadingData: boolean = false; // 데이터 재로드 진행 중 플래그

  constructor(config: Partial<AuthConfig> = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.config = { ...DEFAULT_AUTH_CONFIG, ...config };
    this.abortController = new AbortController();
    this.initializeFirebase();
  }

  /**
   * 리소스 정리 (메모리 누수 방지)
   * 이벤트 리스너를 정리합니다.
   */
  public cleanup(): void {
    // AbortController로 등록된 모든 이벤트 리스너 정리
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    // 수동으로 등록된 이벤트 리스너 정리
    // (cloneNode를 사용한 경우 DOM에서 제거되므로 별도 정리 불필요)
    
    // 콜백 목록 정리
    this.authStateCallbacks = [];
    
    log('AuthManager 리소스 정리 완료');
  }

  /**
   * Firebase 초기화
   */
  private initializeFirebase(): void {
    if (typeof window !== 'undefined' && (window as any).firebase) {
      this.firebase = (window as any).firebase;
      log('Firebase 인스턴스 초기화 완료', {
        hasAuth: !!this.firebase.auth,
        hasSignIn: !!this.firebase.signInWithEmailAndPassword,
        hasCreateUser: !!this.firebase.createUserWithEmailAndPassword,
        keys: Object.keys(this.firebase)
      });
    } else {
      log('Firebase가 사용할 수 없음, 로컬 모드로 작동');
      // Firebase가 나중에 로드될 수 있으므로 주기적으로 확인
      if (typeof window !== 'undefined') {
        const checkFirebase = setInterval(() => {
          if ((window as any).firebase) {
            this.firebase = (window as any).firebase;
            log('Firebase 인스턴스 지연 초기화 완료');
            clearInterval(checkFirebase);
            // Firebase가 로드되면 인증 설정
            if (this.firebase) {
              this.setupFirebaseAuth();
            }
          }
        }, 500);
        // 10초 후 체크 중단
        setTimeout(() => clearInterval(checkFirebase), 10000);
      }
    }
  }

  /**
   * 현재 사용자 정보를 반환합니다.
   * @returns 현재 사용자 정보 또는 null
   */
  public getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  /**
   * 사용자가 로그인되어 있는지 확인합니다.
   * @returns 로그인 상태
   */
  public isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * 인증 상태 변경 콜백을 등록합니다.
   * @param callback 콜백 함수
   */
  public onAuthStateChange(callback: AuthStateChangeCallback): void {
    this.authStateCallbacks.push(callback);
  }

  /**
   * 데이터 재로드 콜백을 등록합니다.
   * 로그인 성공 후 Firebase에서 데이터를 다시 로드하기 위해 사용됩니다.
   * @param callback 데이터 재로드 콜백 함수
   */
  public setDataReloadCallback(callback: (() => Promise<void>) | null): void {
    this.dataReloadCallback = callback;
    log('데이터 재로드 콜백 등록됨', { hasCallback: !!callback });
  }

  /**
   * 인증 상태 변경을 알립니다.
   * @param user 사용자 정보
   */
  private notifyAuthStateChange(user: FirebaseUser | null): void {
    this.currentUser = user;
    this.authStateCallbacks.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        logErrorLocal('인증 상태 변경 콜백 실행 중 오류:', error);
      }
    });
  }

  /**
   * Firebase 인증을 설정합니다.
   */
  public setupFirebaseAuth(): void {
    if (!this.firebase) {
      log('Firebase가 사용할 수 없음, 로컬 모드로 작동');
      this.setupLocalMode();
      return;
    }

    const { auth, onAuthStateChanged } = this.firebase;

    // 인증 상태 변경 리스너 설정
    onAuthStateChanged(auth, (user: any) => {
      log('=== Firebase 인증 상태 변경 ===');
      log('상태:', user ? '로그인됨' : '로그아웃됨');
      log('사용자 정보:', user);
      log('사용자 UID:', user ? user.uid : '없음');
      log('사용자 이메일:', user ? user.email : '없음');
      
      const firebaseUser: FirebaseUser | null = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      } : null;

      this.notifyAuthStateChange(firebaseUser);
    });

    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 초기 로그인 상태 UI 업데이트 (인증 상태 변경 리스너가 호출되기 전에 UI를 업데이트)
    requestAnimationFrame(() => {
      log('초기 로그인 상태 UI 업데이트');
      this.updateLoginStatus();
    });
  }

  /**
   * 로컬 모드를 설정합니다.
   */
  public setupLocalMode(): void {
    log('로컬 모드로 설정');
    this.notifyAuthStateChange(null);
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너를 설정합니다.
   */
  private setupEventListeners(): void {
    // 기존 AbortController가 있으면 취소하고 새로 생성 (중복 방지)
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // 회원가입 폼
    const signupForm = $('#signup-form') as HTMLFormElement;
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e), { signal });
      log('회원가입 폼 이벤트 리스너 등록 완료');
    } else {
      logWarn('회원가입 폼을 찾을 수 없음');
    }

    // 로그인 폼
    const loginForm = $('#login-form') as HTMLFormElement;
    if (loginForm) {
      // 기존 이벤트 리스너 제거 (AbortController가 이미 정리했을 수 있지만 안전을 위해)
      const existingSubmitHandler = (loginForm as any).__loginSubmitListeners;
      if (existingSubmitHandler) {
        try {
          loginForm.removeEventListener('submit', existingSubmitHandler);
          // 제거 성공 시에만 디버그 로그 (경고가 아닌 디버그 레벨)
          log('기존 로그인 폼 이벤트 리스너 제거 완료');
        } catch (error) {
          // 제거 실패는 정상 (AbortController가 이미 정리했을 수 있음)
          log('기존 로그인 폼 이벤트 리스너 제거 시도 (이미 정리되었을 수 있음)');
        }
      }
      
      // 폼 제출 이벤트 핸들러
      const submitHandler = (e: Event) => {
        console.log('🔵 [로그인 폼] 제출 이벤트 발생!', {
          eventType: e.type,
          target: (e.target as HTMLElement)?.id,
          currentTarget: (e.currentTarget as HTMLElement)?.id,
          defaultPrevented: e.defaultPrevented,
          formId: loginForm.id,
          timestamp: new Date().toISOString()
        });
        log('로그인 폼 제출 이벤트 발생', {
          eventType: e.type,
          target: (e.target as HTMLElement)?.id,
          currentTarget: (e.currentTarget as HTMLElement)?.id,
          defaultPrevented: e.defaultPrevented,
          formId: loginForm.id
        });
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.handleLogin(e);
      };
      
      // 폼 제출 이벤트 리스너 등록 (capture 단계에서도 등록하여 확실하게 잡기)
      loginForm.addEventListener('submit', submitHandler, { signal, once: false, capture: true });
      loginForm.addEventListener('submit', submitHandler, { signal, once: false, capture: false });
      (loginForm as any).__loginSubmitListeners = submitHandler;
      
      // 로그인 버튼에도 직접 클릭 이벤트 리스너 추가 (안전장치)
      const loginSubmitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (loginSubmitBtn) {
        const existingBtnHandler = (loginSubmitBtn as any).__loginBtnClickHandler;
        if (existingBtnHandler) {
          try {
            loginSubmitBtn.removeEventListener('click', existingBtnHandler);
            log('기존 로그인 제출 버튼 이벤트 리스너 제거 완료');
          } catch (error) {
            // 제거 실패는 정상 (AbortController가 이미 정리했을 수 있음)
            log('기존 로그인 제출 버튼 이벤트 리스너 제거 시도 (이미 정리되었을 수 있음)');
          }
        }
        
        const btnClickHandler = (e: Event) => {
          console.log('🔴 [로그인 제출 버튼] 클릭 이벤트 발생!', {
            buttonType: loginSubmitBtn.type,
            formId: loginForm.id,
            formVisible: !loginForm.classList.contains('hidden'),
            timestamp: new Date().toISOString()
          });
          log('로그인 제출 버튼 클릭 이벤트 발생', {
            buttonType: loginSubmitBtn.type,
            formId: loginForm.id,
            formVisible: !loginForm.classList.contains('hidden')
          });
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // 직접 handleLogin 호출 (더 확실함)
          const emailInput = $('#login-email') as HTMLInputElement;
          const passwordInput = $('#login-password') as HTMLInputElement;
          if (emailInput && passwordInput) {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            if (email && password) {
              console.log('🔴 [로그인 제출 버튼] 직접 로그인 처리 시작', { email });
              this.performLogin(email, password, emailInput, passwordInput).catch(err => {
                console.error('❌ [로그인 제출 버튼] 직접 로그인 처리 실패', err);
              });
            } else {
              console.warn('⚠️ [로그인 제출 버튼] 이메일 또는 비밀번호가 비어있음');
              this.showAuthError('이메일과 비밀번호를 입력해주세요.', 'login');
            }
          } else {
            console.error('❌ [로그인 제출 버튼] 입력 필드를 찾을 수 없음');
          }
          
          // 폼 제출 이벤트도 트리거 (이중 안전장치)
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          loginForm.dispatchEvent(submitEvent);
        };
        
        loginSubmitBtn.addEventListener('click', btnClickHandler, { signal, once: false });
        (loginSubmitBtn as any).__loginBtnClickHandler = btnClickHandler;
        
        log('로그인 제출 버튼 이벤트 리스너 등록 완료', {
          buttonId: loginSubmitBtn.id || '없음',
          buttonType: loginSubmitBtn.type,
          buttonInDOM: loginSubmitBtn.isConnected
        });
      }
      
      log('로그인 폼 이벤트 리스너 등록 완료', {
        formId: loginForm.id,
        formVisible: !loginForm.classList.contains('hidden'),
        parentVisible: !loginForm.parentElement?.classList.contains('hidden'),
        authContainerVisible: !loginForm.closest('#auth-container')?.classList.contains('hidden'),
        formInDOM: loginForm.isConnected,
        hasSubmitHandler: typeof submitHandler === 'function',
        hasSubmitButton: !!loginSubmitBtn
      });
      this.eventListenerSetupRetryCount = 0; // 성공 시 리셋
    } else {
      this.eventListenerSetupRetryCount++;
      if (this.eventListenerSetupRetryCount < this.MAX_EVENT_LISTENER_RETRY) {
        logWarn(`로그인 폼을 찾을 수 없음, 재시도 중 (${this.eventListenerSetupRetryCount}/${this.MAX_EVENT_LISTENER_RETRY})`);
        // DOM이 준비되지 않았을 수 있으므로 재시도
        setTimeout(() => this.setupEventListeners(), 500);
      } else {
        logErrorLocal('로그인 폼을 찾을 수 없음 (최대 재시도 횟수 초과)');
      }
    }

    // 비밀번호 재설정 폼
    const resetForm = $('#reset-form') as HTMLFormElement;
    if (resetForm) {
      resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e), { signal });
    }

    // 링크 클릭 이벤트
    const forgotPasswordLink = $('#forgot-password-link');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showAuthForm('reset');
      }, { signal });
    }

    // 로그인 버튼 클릭 이벤트 (헤더의 로그인 버튼)
    // 여러 방법으로 이벤트 리스너 등록 (안정성 향상)
    const loginBtn = $('#login-btn');
    if (loginBtn) {
      // 기존 이벤트 리스너 제거 (중복 방지)
      const existingHandler = (loginBtn as any).__loginClickHandler;
      if (existingHandler) {
        try {
          loginBtn.removeEventListener('click', existingHandler);
          log('기존 로그인 버튼 이벤트 리스너 제거 완료');
        } catch (error) {
          // 제거 실패는 정상 (AbortController가 이미 정리했을 수 있음)
          log('기존 로그인 버튼 이벤트 리스너 제거 시도 (이미 정리되었을 수 있음)');
        }
      }
      
      // 새로운 이벤트 핸들러 생성
      const clickHandler = (e: Event) => {
        console.log('🟢 [로그인 버튼] 클릭 이벤트 발생!', {
          buttonId: loginBtn.id,
          buttonVisible: !loginBtn.classList.contains('hidden'),
          parentVisible: !loginBtn.parentElement?.classList.contains('hidden'),
          buttonInDOM: loginBtn.isConnected,
          buttonDisabled: (loginBtn as HTMLButtonElement).disabled,
          buttonStyle: window.getComputedStyle(loginBtn).pointerEvents,
          timestamp: new Date().toISOString()
        });
        log('로그인 버튼 클릭 이벤트 발생', {
          buttonId: loginBtn.id,
          buttonVisible: !loginBtn.classList.contains('hidden'),
          parentVisible: !loginBtn.parentElement?.classList.contains('hidden'),
          buttonInDOM: loginBtn.isConnected,
          buttonDisabled: (loginBtn as HTMLButtonElement).disabled,
          buttonStyle: window.getComputedStyle(loginBtn).pointerEvents
        });
        e.preventDefault();
        e.stopPropagation();
        this.showLoginModal();
      };
      
      // 핸들러 참조 저장 (나중에 제거하기 위해)
      (loginBtn as any).__loginClickHandler = clickHandler;
      
      // 이벤트 리스너 등록 (AbortController와 함께)
      loginBtn.addEventListener('click', clickHandler, { signal, capture: false });
      
      // 추가 안전장치: 전역 함수도 설정 (onclick 속성 대체)
      (window as any).__handleLoginButtonClick = () => {
        log('전역 함수를 통한 로그인 버튼 클릭');
        this.showLoginModal();
      };
      
      log('로그인 버튼 이벤트 리스너 등록 완료', {
        buttonId: loginBtn.id,
        buttonVisible: !loginBtn.classList.contains('hidden'),
        parentVisible: !loginBtn.parentElement?.classList.contains('hidden'),
        buttonInDOM: loginBtn.isConnected,
        hasHandler: typeof clickHandler === 'function',
        hasGlobalHandler: typeof (window as any).__handleLoginButtonClick === 'function'
      });
    } else {
      logWarn('로그인 버튼을 찾을 수 없음');
      // 버튼이 나중에 나타날 수 있으므로 재시도
      this.eventListenerSetupRetryCount++;
      if (this.eventListenerSetupRetryCount < this.MAX_EVENT_LISTENER_RETRY) {
        logWarn(`로그인 버튼을 찾을 수 없음, 재시도 중 (${this.eventListenerSetupRetryCount}/${this.MAX_EVENT_LISTENER_RETRY})`);
        setTimeout(() => this.setupEventListeners(), 500);
      }
    }

    const backToLoginLink = $('#back-to-login-link');
    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showAuthForm('login');
      }, { signal });
    }

    // Google 로그인 버튼 이벤트 리스너 설정
    this.setupGoogleLoginButton();

    // 로그아웃 버튼은 main.js에서 관리하므로 여기서는 설정하지 않음
    // 중복 등록을 방지하기 위해 주석 처리
    // const logoutBtn = $('#logout-btn');
    // if (logoutBtn) {
    //   logoutBtn.addEventListener('click', () => this.signOut());
    // }
  }

  /**
   * 회원가입을 처리합니다.
   * @param event 폼 제출 이벤트
   */
  private async handleSignup(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.firebase) {
      this.showAlert('Firebase가 초기화되지 않아 회원가입을 할 수 없습니다. 로컬 모드로 사용해주세요.');
      return;
    }

    const nameInput = $('#signup-name') as HTMLInputElement;
    const emailInput = $('#signup-email') as HTMLInputElement;
    const passwordInput = $('#signup-password') as HTMLInputElement;

    if (!nameInput || !emailInput || !passwordInput) {
      logErrorLocal('회원가입 폼 요소를 찾을 수 없음');
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!name || !email || !password) {
      this.showAuthError('닉 네임, 이메일, 비밀번호를 모두 입력해주세요.', 'signup');
      return;
    }

    try {
      const { auth, createUserWithEmailAndPassword, updateProfile } = this.firebase;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필에 이름 설정
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
      
      log('회원가입 성공:', email);
      log('사용자 이름:', name);
    } catch (error: any) {
      logErrorLocal('회원가입 실패:', error);
      this.handleAuthError(error, 'signup');
    }
  }

  /**
   * 로그인을 처리합니다.
   * @param event 폼 제출 이벤트
   */
  private async handleLogin(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🟠 [handleLogin] 호출됨!', { timestamp: new Date().toISOString() });
    log('=== handleLogin 호출됨 ===');
    
    const emailInput = $('#login-email') as HTMLInputElement;
    const passwordInput = $('#login-password') as HTMLInputElement;

    if (!emailInput || !passwordInput) {
      logErrorLocal('로그인 폼 요소를 찾을 수 없음', {
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput
      });
      return;
    }
    
    log('로그인 폼 요소 확인 완료');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      this.showAuthError('이메일과 비밀번호를 입력해주세요.', 'login');
      // 입력 필드가 비어있으면 해당 필드에 포커스
      if (!email) {
        emailInput.focus();
        emailInput.select();
      } else if (!password) {
        passwordInput.focus();
        passwordInput.select();
      }
      return;
    }

    if (!this.firebase) {
      // Firebase가 아직 초기화되지 않았으면 잠시 대기 후 재시도
      logInfo('Firebase 초기화 대기 중, 1초 후 재시도...');
      setTimeout(async () => {
        if ((window as any).firebase) {
          this.firebase = (window as any).firebase;
          // 재시도 시 이벤트 객체를 재사용하지 않고 직접 처리
          await this.performLogin(email, password, emailInput, passwordInput);
        } else {
          this.showAlert('Firebase 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
          this.showAuthError('Firebase 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.', 'login');
        }
      }, 1000);
      return;
    }

    await this.performLogin(email, password, emailInput, passwordInput);
  }

  /**
   * 실제 로그인을 수행합니다.
   * @param email 이메일
   * @param password 비밀번호
   * @param emailInput 이메일 입력 필드
   * @param passwordInput 비밀번호 입력 필드
   */
  private async performLogin(
    email: string,
    password: string,
    emailInput: HTMLInputElement,
    passwordInput: HTMLInputElement
  ): Promise<void> {
    // 중복 로그인 시도 방지
    if (this.isLoggingIn) {
      console.log('⚠️ [performLogin] 이미 로그인 진행 중, 중복 요청 무시', { email });
      return;
    }
    
    this.isLoggingIn = true;
    console.log('🔵 [performLogin] 시작!', { email, hasPassword: !!password, timestamp: new Date().toISOString() });
    
    try {
      if (!this.firebase) {
        console.error('❌ [performLogin] Firebase가 초기화되지 않음');
        logErrorLocal('Firebase가 초기화되지 않음');
        this.showAuthError('Firebase 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.', 'login');
        return;
      }

      // Firebase 객체 유효성 검사
      if (!this.firebase.auth || !this.firebase.signInWithEmailAndPassword) {
        console.error('❌ [performLogin] Firebase Auth 또는 signInWithEmailAndPassword가 없음', {
          hasAuth: !!this.firebase.auth,
          hasSignIn: !!this.firebase.signInWithEmailAndPassword,
          firebaseKeys: Object.keys(this.firebase)
        });
        logErrorLocal('Firebase Auth 또는 signInWithEmailAndPassword가 없음', {
          hasAuth: !!this.firebase.auth,
          hasSignIn: !!this.firebase.signInWithEmailAndPassword,
          firebaseKeys: Object.keys(this.firebase)
        });
        this.showAuthError('Firebase 인증 기능을 사용할 수 없습니다. 페이지를 새로고침해주세요.', 'login');
        return;
      }
      const { auth, signInWithEmailAndPassword } = this.firebase;
      
      console.log('🟣 [performLogin] 로그인 시도 시작', { email, hasAuth: !!auth, hasSignIn: !!signInWithEmailAndPassword });
      log('로그인 시도:', { email, hasAuth: !!auth, hasSignIn: !!signInWithEmailAndPassword });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('✅ [performLogin] 로그인 성공!', { 
        email, 
        uid: userCredential.user?.uid,
        displayName: userCredential.user?.displayName 
      });
      log('로그인 성공:', { 
        email, 
        uid: userCredential.user?.uid,
        displayName: userCredential.user?.displayName 
      });
      
      // 로그인 성공 시 에러 메시지 숨기기
      this.clearAuthErrors();
      
      // 로그인 성공 후 Firebase에서 데이터 다시 로드
      // onAuthStateChanged가 호출되지만, 명시적으로도 데이터를 다시 로드하여 확실하게 처리
      // 중복 데이터 로드 방지
      if (this.dataReloadCallback && !this.isReloadingData) {
        this.isReloadingData = true;
        console.log('🔄 [performLogin] 데이터 재로드 시작...');
        log('로그인 성공 후 데이터 재로드 시작');
        try {
          await this.dataReloadCallback();
          console.log('✅ [performLogin] 데이터 재로드 완료');
          log('로그인 성공 후 데이터 재로드 완료');
        } catch (error) {
          console.error('❌ [performLogin] 데이터 재로드 실패', error);
          logErrorLocal('로그인 성공 후 데이터 재로드 실패:', error);
        } finally {
          this.isReloadingData = false;
        }
      } else if (this.isReloadingData) {
        console.log('⚠️ [performLogin] 데이터 재로드가 이미 진행 중, 중복 요청 무시');
      } else {
        console.warn('⚠️ [performLogin] 데이터 재로드 콜백이 등록되지 않음');
        logWarn('데이터 재로드 콜백이 등록되지 않음');
      }
    } catch (error: any) {
      console.error('❌ [performLogin] 로그인 실패!', {
        error,
        code: error?.code,
        message: error?.message,
        email
      });
      // 에러 상세 정보 로깅
      logErrorLocal('로그인 실패:', {
        error,
        code: error?.code,
        message: error?.message,
        email
      });
      
      // 에러 코드가 없으면 기본 메시지 사용
      const errorCode = error?.code || 'unknown-error';
      const authError: AuthError = {
        code: errorCode,
        message: error?.message || '알 수 없는 오류가 발생했습니다.'
      };
      
      this.handleAuthError(authError, 'login');
      
      // 로그인 실패 시 이메일 필드에 포커스하고 텍스트 선택
      requestAnimationFrame(() => {
        emailInput.focus();
        emailInput.select();
      });
    } finally {
      // 로그인 시도 완료 (성공 또는 실패)
      this.isLoggingIn = false;
    }
  }

  /**
   * Google 로그인을 처리합니다.
   * 팝업 방식을 사용하며, COOP 에러는 필터링으로 처리됩니다.
   */
  public async signInWithGoogle(): Promise<void> {
    if (!this.firebase) {
      // Firebase가 아직 초기화되지 않았으면 잠시 대기 후 재시도
      logInfo('Firebase 초기화 대기 중, 1초 후 재시도...');
      setTimeout(() => {
        if ((window as any).firebase) {
          this.firebase = (window as any).firebase;
          this.signInWithGoogle();
        } else {
          this.showAlert('Firebase 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        }
      }, 1000);
      return;
    }

    try {
      const { auth, GoogleAuthProvider, signInWithPopup } = this.firebase;
      const provider = new GoogleAuthProvider();
      // 팝업 방식 사용 (COOP 에러는 콘솔 필터링으로 처리)
      await signInWithPopup(auth, provider);
      log('Google 로그인 성공');
    } catch (error: any) {
      logErrorLocal('Google 로그인 실패:', error);
      // 팝업이 닫힌 경우는 정상적인 플로우
      if (error.code === 'auth/popup-closed-by-user') {
        log('사용자가 로그인 팝업을 닫음');
        return;
      }
      this.handleAuthError(error, 'login');
    }
  }

  /**
   * 로그아웃을 처리합니다.
   */
  public async signOut(): Promise<void> {
    if (!this.firebase) {
      log('Firebase가 사용할 수 없음, 로컬 로그아웃 처리');
      this.notifyAuthStateChange(null);
      return;
    }

    try {
      const { auth, signOut } = this.firebase;
      await signOut(auth);
      log('로그아웃 성공');
    } catch (error: any) {
      logErrorLocal('로그아웃 실패:', error);
    }
  }

  /**
   * 비밀번호 재설정을 처리합니다.
   * @param event 폼 제출 이벤트
   */
  private async handlePasswordReset(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.firebase) {
      this.showAlert('Firebase가 초기화되지 않아 비밀번호 재설정을 할 수 없습니다.');
      return;
    }

    const emailInput = $('#reset-email') as HTMLInputElement;
    const messageElement = $('#reset-message');

    if (!emailInput) {
      logErrorLocal('비밀번호 재설정 폼 요소를 찾을 수 없음');
      return;
    }

    const email = emailInput.value.trim();

    if (!email) {
      this.showResetMessage('이메일을 입력해주세요.', 'error');
      return;
    }

    try {
      const { auth, sendPasswordResetEmail } = this.firebase;
      await sendPasswordResetEmail(auth, email);
      this.showResetMessage('비밀번호 재설정 이메일이 발송되었습니다. 받은편지함을 확인해주세요.', 'success');
      log('비밀번호 재설정 이메일 발송 성공:', email);
    } catch (error: any) {
      logErrorLocal('비밀번호 재설정 실패:', error);
      this.handleAuthError(error, 'reset');
    }
  }

  /**
   * 인증 폼을 표시합니다.
   * @param formName 폼 타입
   */
  public showAuthForm(formName: AuthFormType): void {
    const loginForm = $('#login-form');
    const signupForm = $('#signup-form');
    const resetForm = $('#reset-form');
    const authTabs = $('.auth-tabs');
    const divider = $('.divider');
    const socialButtons = $('.social-buttons');
    const authTitle = $('#auth-title');

    if (!loginForm || !signupForm || !resetForm) {
      logErrorLocal('인증 폼 요소를 찾을 수 없음');
      return;
    }

    // 폼 표시/숨김 처리
    loginForm.classList.toggle('hidden', formName !== 'login');
    signupForm.classList.toggle('hidden', formName !== 'signup');
    resetForm.classList.toggle('hidden', formName !== 'reset');

    const isReset = formName === 'reset';

    // UI 요소 표시/숨김 처리
    if (authTabs) authTabs.classList.toggle('hidden', isReset);
    if (divider) divider.classList.toggle('hidden', isReset);
    if (socialButtons) socialButtons.classList.toggle('hidden', isReset);

    // 제목 변경
    if (authTitle) {
      authTitle.textContent = isReset ? '비밀번호 재설정' : '체육 수업 도우미';
    }

    // 탭 활성화 상태 변경
    const loginTabBtn = $('#login-tab-btn');
    const signupTabBtn = $('#signup-tab-btn');
    
    if (loginTabBtn) loginTabBtn.classList.toggle('active', formName === 'login');
    if (signupTabBtn) signupTabBtn.classList.toggle('active', formName === 'signup');

    // 오류 메시지 숨김
    this.clearAuthErrors();
  }

  /**
   * 로그인 모달을 표시합니다.
   */
  public showLoginModal(): void {
    console.log('🟡 [showLoginModal] 호출됨!', { timestamp: new Date().toISOString() });
    log('=== showLoginModal 호출됨 ===');
    const authContainer = $('#auth-container');
    const appRoot = $('#app-root');

    log('모달 요소 확인', {
      hasAuthContainer: !!authContainer,
      hasAppRoot: !!appRoot,
      authContainerHidden: authContainer?.classList.contains('hidden'),
      appRootHidden: appRoot?.classList.contains('hidden')
    });

    if (authContainer && appRoot) {
      authContainer.classList.remove('hidden');
      appRoot.classList.add('hidden');
      log('모달 표시 완료 (auth-container 표시, app-root 숨김)');
      
      this.showAuthForm('login');
      
      // 모달이 열릴 때 이벤트 리스너를 다시 등록 (폼이 DOM에 있을 때)
      requestAnimationFrame(() => {
        console.log('🟡 [showLoginModal] 모달 열림 후 이벤트 리스너 재등록 시도');
        log('모달 열림 후 이벤트 리스너 재등록 시도');
        const loginForm = $('#login-form') as HTMLFormElement;
        log('재등록 시점 로그인 폼 확인', {
          hasLoginForm: !!loginForm,
          formVisible: !loginForm?.classList.contains('hidden'),
          formInDOM: loginForm?.isConnected,
          authContainerVisible: !authContainer.classList.contains('hidden')
        });
        
        // 이벤트 리스너 재등록
        this.setupEventListeners();
        
        // 추가 안전장치: 로그인 폼에 직접 이벤트 핸들러 추가 (전역 함수로)
        if (loginForm) {
          // 전역 함수로 로그인 폼 제출 처리
          (window as any).__handleLoginFormSubmit = (e: Event) => {
            console.log('🟢 [전역 함수] 로그인 폼 제출 처리!', { timestamp: new Date().toISOString() });
            e.preventDefault();
            e.stopPropagation();
            const emailInput = $('#login-email') as HTMLInputElement;
            const passwordInput = $('#login-password') as HTMLInputElement;
            if (emailInput && passwordInput) {
              const email = emailInput.value.trim();
              const password = passwordInput.value;
              if (email && password) {
                this.performLogin(email, password, emailInput, passwordInput).catch(err => {
                  console.error('❌ [전역 함수] 로그인 실패', err);
                });
              } else {
                this.showAuthError('이메일과 비밀번호를 입력해주세요.', 'login');
              }
            }
          };
          
          // 폼에 직접 이벤트 리스너 추가 (기존 리스너와 독립적으로)
          loginForm.addEventListener('submit', (window as any).__handleLoginFormSubmit, { once: false });
          
          // 로그인 제출 버튼에도 직접 이벤트 리스너 추가
          const loginSubmitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (loginSubmitBtn) {
            (window as any).__handleLoginButtonDirectClick = (e: Event) => {
              console.log('🟢 [전역 함수] 로그인 버튼 직접 클릭!', { timestamp: new Date().toISOString() });
              e.preventDefault();
              e.stopPropagation();
              const emailInput = $('#login-email') as HTMLInputElement;
              const passwordInput = $('#login-password') as HTMLInputElement;
              if (emailInput && passwordInput) {
                const email = emailInput.value.trim();
                const password = passwordInput.value;
                if (email && password) {
                  this.performLogin(email, password, emailInput, passwordInput).catch(err => {
                    console.error('❌ [전역 함수] 로그인 실패', err);
                  });
                } else {
                  this.showAuthError('이메일과 비밀번호를 입력해주세요.', 'login');
                }
              }
            };
            loginSubmitBtn.addEventListener('click', (window as any).__handleLoginButtonDirectClick, { once: false });
          }
        }
        
        // 추가 안전장치: 로그인 폼이 보이는지 확인하고 포커스 설정
        if (loginForm && !loginForm.classList.contains('hidden')) {
          const emailInput = $('#login-email') as HTMLInputElement;
          if (emailInput) {
            setTimeout(() => {
              emailInput.focus();
              log('로그인 모달 열림 후 이메일 입력 필드에 포커스 설정');
            }, 100);
          }
        }
      });
    } else {
      logErrorLocal('로그인 모달 요소를 찾을 수 없음', {
        hasAuthContainer: !!authContainer,
        hasAppRoot: !!appRoot
      });
    }
  }

  /**
   * 로그인 상태 UI를 업데이트합니다.
   */
  public updateLoginStatus(): void {
    log('=== updateLoginStatus 호출됨 ===', {
      hasCurrentUser: !!this.currentUser,
      userEmail: this.currentUser?.email || null
    });
    
    const loginStatus = $('#login-status');
    const guestStatus = $('#guest-status');

    if (!loginStatus || !guestStatus) {
      logErrorLocal('로그인 상태 UI 요소를 찾을 수 없음', {
        hasLoginStatus: !!loginStatus,
        hasGuestStatus: !!guestStatus
      });
      return;
    }

    if (this.currentUser) {
      log('로그인 상태: 로그인됨, login-status 표시, guest-status 숨김');
      loginStatus.classList.remove('hidden');
      guestStatus.classList.add('hidden');
      
      const userEmail = this.currentUser.displayName || this.currentUser.email || '사용자';
      const userEmailElement = $('#user-email');
      if (userEmailElement) {
        userEmailElement.textContent = userEmail;
      }
      
      // 로그아웃 버튼 이벤트 리스너 설정 (로그인 상태일 때)
      this.setupLogoutButton();
    } else {
      log('로그인 상태: 로그아웃됨, login-status 숨김, guest-status 표시');
      loginStatus.classList.add('hidden');
      guestStatus.classList.remove('hidden');
      
      // 로그아웃 상태일 때 Google 로그인 버튼 이벤트 리스너 재설정
      this.setupGoogleLoginButton();
      
      // 로그인 버튼 이벤트 리스너도 재설정 (guest-status가 표시될 때)
      requestAnimationFrame(() => {
        const loginBtn = $('#login-btn');
        if (loginBtn && !loginBtn.classList.contains('hidden')) {
          log('guest-status 표시됨, 로그인 버튼 이벤트 리스너 재등록');
          // 전역 함수가 이미 설정되어 있는지 확인하고, 없으면 설정
          if (!(window as any).__handleLoginButtonClick) {
            (window as any).__handleLoginButtonClick = () => {
              log('전역 함수를 통한 로그인 버튼 클릭 (재등록)');
              this.showLoginModal();
            };
          }
          // 이벤트 리스너도 재등록
          this.setupEventListeners();
        }
      });
    }
    
    log('updateLoginStatus 완료', {
      loginStatusHidden: loginStatus.classList.contains('hidden'),
      guestStatusHidden: guestStatus.classList.contains('hidden'),
      loginBtnVisible: !$('#login-btn')?.classList.contains('hidden')
    });
  }

  /**
   * Google 로그인 버튼 이벤트 리스너를 설정합니다.
   */
  private setupGoogleLoginButton(): void {
    const googleLoginBtn = $('#google-login-btn');
    if (!googleLoginBtn) {
      log('Google 로그인 버튼을 찾을 수 없음');
      return;
    }

    // 기존 AbortController가 있으면 취소하고 새로 생성 (중복 방지)
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // 기존 핸들러가 있으면 제거 (이미 AbortController로 정리되지만 안전을 위해)
    if (this.googleLoginHandler) {
      googleLoginBtn.removeEventListener('click', this.googleLoginHandler);
    }

    // 새 이벤트 리스너 등록 (AbortController signal로 관리)
    this.googleLoginHandler = async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      log('Google 로그인 버튼 클릭됨');
      try {
        await this.signInWithGoogle();
        log('Google 로그인 처리 완료');
      } catch (error: any) {
        logErrorLocal('Google 로그인 중 오류:', error);
      }
    };
    
    googleLoginBtn.addEventListener('click', this.googleLoginHandler, {
      signal: signal
    });
    
    log('Google 로그인 버튼 이벤트 리스너 등록 완료');
  }

  /**
   * 로그아웃 버튼 이벤트 리스너를 설정합니다.
   */
  private setupLogoutButton(): void {
    const logoutBtn = $('#logout-btn');
    if (!logoutBtn) {
      log('로그아웃 버튼을 찾을 수 없음');
      return;
    }

    // 기존 AbortController가 있으면 취소하고 새로 생성 (중복 방지)
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // 기존 핸들러가 있으면 제거 (이미 AbortController로 정리되지만 안전을 위해)
    if (this.logoutHandler) {
      logoutBtn.removeEventListener('click', this.logoutHandler);
    }

    // 새 이벤트 리스너 등록 (AbortController signal로 관리)
    this.logoutHandler = async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      log('로그아웃 버튼 클릭됨');
      try {
        await this.signOut();
        log('로그아웃 처리 완료');
      } catch (error: any) {
        logErrorLocal('로그아웃 중 오류:', error);
      }
    };
    
    logoutBtn.addEventListener('click', this.logoutHandler, {
      signal: signal
    });
    
    log('로그아웃 버튼 이벤트 리스너 등록 완료');
  }

  /**
   * 인증 오류를 처리합니다.
   * @param error 오류 객체
   * @param type 오류 타입
   */
  private handleAuthError(error: AuthError, type: AuthErrorType): void {
    const friendlyMessage = AUTH_ERROR_MESSAGES[error.code] || '오류가 발생했습니다. 다시 시도해주세요.';
    
    if (type === 'reset') {
      this.showResetMessage(friendlyMessage, 'error');
    } else {
      this.showAuthError(friendlyMessage, type);
    }
  }

  /**
   * 인증 오류 메시지를 표시합니다.
   * @param message 오류 메시지
   * @param type 오류 타입
   */
  private showAuthError(message: string, type: AuthErrorType): void {
    const messageElement = $(`#${type}-error`);
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.classList.remove('hidden');
    }
  }

  /**
   * 비밀번호 재설정 메시지를 표시합니다.
   * @param message 메시지
   * @param type 메시지 타입
   */
  private showResetMessage(message: string, type: 'success' | 'error'): void {
    const messageElement = $('#reset-message');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.classList.remove('hidden', 'success-message', 'error-message');
      messageElement.classList.add(`${type}-message`);
    }
  }

  /**
   * 모든 인증 오류 메시지를 숨깁니다.
   */
  private clearAuthErrors(): void {
    const errorElements = ['#login-error', '#signup-error', '#reset-message'];
    errorElements.forEach(selector => {
      const element = $(selector);
      if (element) {
        element.classList.add('hidden');
      }
    });
  }

  /**
   * 알림을 표시합니다.
   * @param message 알림 메시지
   */
  private showAlert(message: string): void {
    alert(message);
  }
}

// ========================================
// 전역 인스턴스 및 함수
// ========================================

/**
 * 전역 인증 관리자 인스턴스
 */
let authManagerInstance: AuthManager | null = null;

/**
 * 인증 관리자 인스턴스를 가져옵니다.
 * @param config 인증 설정
 * @returns 인증 관리자 인스턴스
 */
export const getAuthManager = (config?: Partial<AuthConfig>): AuthManager => {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager(config);
  }
  return authManagerInstance;
};

/**
 * 인증 관리자를 초기화합니다.
 * @param config 인증 설정
 * @returns 초기화된 인증 관리자
 */
export const initializeAuthManager = (config?: Partial<AuthConfig>): AuthManager => {
  const manager = getAuthManager(config);
  manager.setupFirebaseAuth();
  return manager;
};

/**
 * 전역 함수들을 노출합니다.
 */
export const setupGlobalAuthFunctions = (): void => {
  const manager = getAuthManager();
  
  // 전역 함수로 노출
  (window as any).showLoginModal = () => {
    log('=== window.showLoginModal 호출됨 ===');
    manager.showLoginModal();
  };
  (window as any).showAuthForm = (formName: AuthFormType) => {
    log('=== window.showAuthForm 호출됨 ===', { formName });
    manager.showAuthForm(formName);
  };
  (window as any).updateLoginStatus = () => manager.updateLoginStatus();
  
  // 로그인 버튼 클릭을 위한 전역 함수도 설정
  (window as any).__handleLoginButtonClick = () => {
    log('전역 함수를 통한 로그인 버튼 클릭 (setupGlobalAuthFunctions)');
    manager.showLoginModal();
  };
  
  log('전역 인증 함수 등록 완료', {
    hasShowLoginModal: typeof (window as any).showLoginModal === 'function',
    hasShowAuthForm: typeof (window as any).showAuthForm === 'function',
    hasUpdateLoginStatus: typeof (window as any).updateLoginStatus === 'function',
    hasHandleLoginButtonClick: typeof (window as any).__handleLoginButtonClick === 'function'
  });
};

// ========================================
// 기본 내보내기
// ========================================

export default AuthManager;
