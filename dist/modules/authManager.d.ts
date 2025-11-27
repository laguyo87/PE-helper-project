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
/**
 * 사용자 인증 및 관리 클래스
 */
export declare class AuthManager {
    private currentUser;
    private authStateCallbacks;
    private config;
    private firebase;
    private abortController;
    private googleLoginHandler;
    private logoutHandler;
    private eventListenerSetupRetryCount;
    private readonly MAX_EVENT_LISTENER_RETRY;
    private dataReloadCallback;
    private isLoggingIn;
    private isReloadingData;
    constructor(config?: Partial<AuthConfig>);
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 이벤트 리스너를 정리합니다.
     */
    cleanup(): void;
    /**
     * Firebase 초기화
     */
    private initializeFirebase;
    /**
     * 현재 사용자 정보를 반환합니다.
     * @returns 현재 사용자 정보 또는 null
     */
    getCurrentUser(): FirebaseUser | null;
    /**
     * 사용자가 로그인되어 있는지 확인합니다.
     * @returns 로그인 상태
     */
    isLoggedIn(): boolean;
    /**
     * 인증 상태 변경 콜백을 등록합니다.
     * @param callback 콜백 함수
     */
    onAuthStateChange(callback: AuthStateChangeCallback): void;
    /**
     * 데이터 재로드 콜백을 등록합니다.
     * 로그인 성공 후 Firebase에서 데이터를 다시 로드하기 위해 사용됩니다.
     * @param callback 데이터 재로드 콜백 함수
     */
    setDataReloadCallback(callback: (() => Promise<void>) | null): void;
    /**
     * 인증 상태 변경을 알립니다.
     * @param user 사용자 정보
     */
    private notifyAuthStateChange;
    /**
     * Firebase 인증을 설정합니다.
     */
    setupFirebaseAuth(): void;
    /**
     * 로컬 모드를 설정합니다.
     */
    setupLocalMode(): void;
    /**
     * 이벤트 리스너를 설정합니다.
     */
    private setupEventListeners;
    /**
     * 회원가입을 처리합니다.
     * @param event 폼 제출 이벤트
     */
    private handleSignup;
    /**
     * 로그인을 처리합니다.
     * @param event 폼 제출 이벤트
     */
    private handleLogin;
    /**
     * 실제 로그인을 수행합니다.
     * @param email 이메일
     * @param password 비밀번호
     * @param emailInput 이메일 입력 필드
     * @param passwordInput 비밀번호 입력 필드
     */
    private performLogin;
    /**
     * Google 로그인을 처리합니다.
     * 팝업 방식을 사용하며, COOP 에러는 필터링으로 처리됩니다.
     */
    signInWithGoogle(): Promise<void>;
    /**
     * 로그아웃을 처리합니다.
     */
    signOut(): Promise<void>;
    /**
     * 비밀번호 재설정을 처리합니다.
     * @param event 폼 제출 이벤트
     */
    private handlePasswordReset;
    /**
     * 인증 폼을 표시합니다.
     * @param formName 폼 타입
     */
    showAuthForm(formName: AuthFormType): void;
    /**
     * 로그인 모달을 표시합니다.
     */
    showLoginModal(): void;
    /**
     * 로그인 상태 UI를 업데이트합니다.
     */
    updateLoginStatus(): void;
    /**
     * Google 로그인 버튼 이벤트 리스너를 설정합니다.
     */
    private setupGoogleLoginButton;
    /**
     * 로그아웃 버튼 이벤트 리스너를 설정합니다.
     */
    private setupLogoutButton;
    /**
     * 인증 오류를 처리합니다.
     * @param error 오류 객체
     * @param type 오류 타입
     */
    private handleAuthError;
    /**
     * 인증 오류 메시지를 표시합니다.
     * @param message 오류 메시지
     * @param type 오류 타입
     */
    private showAuthError;
    /**
     * 비밀번호 재설정 메시지를 표시합니다.
     * @param message 메시지
     * @param type 메시지 타입
     */
    private showResetMessage;
    /**
     * 모든 인증 오류 메시지를 숨깁니다.
     */
    private clearAuthErrors;
    /**
     * 알림을 표시합니다.
     * @param message 알림 메시지
     */
    private showAlert;
}
/**
 * 인증 관리자 인스턴스를 가져옵니다.
 * @param config 인증 설정
 * @returns 인증 관리자 인스턴스
 */
export declare const getAuthManager: (config?: Partial<AuthConfig>) => AuthManager;
/**
 * 인증 관리자를 초기화합니다.
 * @param config 인증 설정
 * @returns 초기화된 인증 관리자
 */
export declare const initializeAuthManager: (config?: Partial<AuthConfig>) => AuthManager;
/**
 * 전역 함수들을 노출합니다.
 */
export declare const setupGlobalAuthFunctions: () => void;
export default AuthManager;
//# sourceMappingURL=authManager.d.ts.map