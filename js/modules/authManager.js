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
// ========================================
// 상수 정의
// ========================================
/** 기본 인증 설정 */
const DEFAULT_AUTH_CONFIG = {
    enableGoogleAuth: true,
    enablePasswordReset: true,
    enableEmailVerification: false
};
/** 인증 오류 메시지 매핑 */
const AUTH_ERROR_MESSAGES = {
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
const $ = (selector) => {
    try {
        return document.querySelector(selector);
    }
    catch (error) {
        console.warn(`querySelector error (${selector}):`, error);
        return null;
    }
};
/**
 * 로그를 출력합니다.
 * @param message 로그 메시지
 * @param data 추가 데이터
 */
const log = (message, data) => {
    console.log(`[AuthManager] ${message}`, data || '');
};
/**
 * 오류를 로그로 출력합니다.
 * @param message 오류 메시지
 * @param error 오류 객체
 */
const logError = (message, error) => {
    console.error(`[AuthManager] ${message}`, error || '');
};
// ========================================
// 인증 관리 클래스
// ========================================
/**
 * 사용자 인증 및 관리 클래스
 */
export class AuthManager {
    constructor(config = {}) {
        this.currentUser = null;
        this.authStateCallbacks = [];
        this.firebase = null;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.config = { ...DEFAULT_AUTH_CONFIG, ...config };
        this.initializeFirebase();
    }
    /**
     * Firebase 초기화
     */
    initializeFirebase() {
        if (typeof window !== 'undefined' && window.firebase) {
            this.firebase = window.firebase;
            log('Firebase 인스턴스 초기화 완료');
        }
        else {
            log('Firebase가 사용할 수 없음, 로컬 모드로 작동');
        }
    }
    /**
     * 현재 사용자 정보를 반환합니다.
     * @returns 현재 사용자 정보 또는 null
     */
    getCurrentUser() {
        return this.currentUser;
    }
    /**
     * 사용자가 로그인되어 있는지 확인합니다.
     * @returns 로그인 상태
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }
    /**
     * 인증 상태 변경 콜백을 등록합니다.
     * @param callback 콜백 함수
     */
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
    }
    /**
     * 인증 상태 변경을 알립니다.
     * @param user 사용자 정보
     */
    notifyAuthStateChange(user) {
        this.currentUser = user;
        this.authStateCallbacks.forEach(callback => {
            try {
                callback(user);
            }
            catch (error) {
                logError('인증 상태 변경 콜백 실행 중 오류:', error);
            }
        });
    }
    /**
     * Firebase 인증을 설정합니다.
     */
    setupFirebaseAuth() {
        if (!this.firebase) {
            log('Firebase가 사용할 수 없음, 로컬 모드로 작동');
            this.setupLocalMode();
            return;
        }
        const { auth, onAuthStateChanged } = this.firebase;
        // 인증 상태 변경 리스너 설정
        onAuthStateChanged(auth, (user) => {
            log('=== Firebase 인증 상태 변경 ===');
            log('상태:', user ? '로그인됨' : '로그아웃됨');
            log('사용자 정보:', user);
            log('사용자 UID:', user ? user.uid : '없음');
            log('사용자 이메일:', user ? user.email : '없음');
            const firebaseUser = user ? {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            } : null;
            this.notifyAuthStateChange(firebaseUser);
        });
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }
    /**
     * 로컬 모드를 설정합니다.
     */
    setupLocalMode() {
        log('로컬 모드로 설정');
        this.notifyAuthStateChange(null);
        this.setupEventListeners();
    }
    /**
     * 이벤트 리스너를 설정합니다.
     */
    setupEventListeners() {
        // 회원가입 폼
        const signupForm = $('#signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        // 로그인 폼
        const loginForm = $('#login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        // 비밀번호 재설정 폼
        const resetForm = $('#reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
        }
        // 링크 클릭 이벤트
        const forgotPasswordLink = $('#forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthForm('reset');
            });
        }
        const backToLoginLink = $('#back-to-login-link');
        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthForm('login');
            });
        }
        // Google 로그인 버튼
        const googleLoginBtn = $('#google-login-btn');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        // 로그아웃 버튼
        const logoutBtn = $('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.signOut());
        }
    }
    /**
     * 회원가입을 처리합니다.
     * @param event 폼 제출 이벤트
     */
    async handleSignup(event) {
        event.preventDefault();
        if (!this.firebase) {
            this.showAlert('Firebase가 초기화되지 않아 회원가입을 할 수 없습니다. 로컬 모드로 사용해주세요.');
            return;
        }
        const emailInput = $('#signup-email');
        const passwordInput = $('#signup-password');
        if (!emailInput || !passwordInput) {
            logError('회원가입 폼 요소를 찾을 수 없음');
            return;
        }
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            this.showAuthError('이메일과 비밀번호를 입력해주세요.', 'signup');
            return;
        }
        try {
            const { auth, createUserWithEmailAndPassword } = this.firebase;
            await createUserWithEmailAndPassword(auth, email, password);
            log('회원가입 성공:', email);
        }
        catch (error) {
            logError('회원가입 실패:', error);
            this.handleAuthError(error, 'signup');
        }
    }
    /**
     * 로그인을 처리합니다.
     * @param event 폼 제출 이벤트
     */
    async handleLogin(event) {
        event.preventDefault();
        if (!this.firebase) {
            // Firebase가 아직 초기화되지 않았으면 잠시 대기 후 재시도
            console.log('Firebase 초기화 대기 중, 1초 후 재시도...');
            setTimeout(() => {
                if (window.firebase) {
                    this.firebase = window.firebase;
                    this.handleLogin(event);
                }
                else {
                    this.showAlert('Firebase 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
                }
            }, 1000);
            return;
        }
        const emailInput = $('#login-email');
        const passwordInput = $('#login-password');
        if (!emailInput || !passwordInput) {
            logError('로그인 폼 요소를 찾을 수 없음');
            return;
        }
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
            this.showAuthError('이메일과 비밀번호를 입력해주세요.', 'login');
            return;
        }
        try {
            const { auth, signInWithEmailAndPassword } = this.firebase;
            await signInWithEmailAndPassword(auth, email, password);
            log('로그인 성공:', email);
        }
        catch (error) {
            logError('로그인 실패:', error);
            this.handleAuthError(error, 'login');
        }
    }
    /**
     * Google 로그인을 처리합니다.
     */
    async signInWithGoogle() {
        if (!this.firebase) {
            // Firebase가 아직 초기화되지 않았으면 잠시 대기 후 재시도
            console.log('Firebase 초기화 대기 중, 1초 후 재시도...');
            setTimeout(() => {
                if (window.firebase) {
                    this.firebase = window.firebase;
                    this.signInWithGoogle();
                }
                else {
                    this.showAlert('Firebase 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
                }
            }, 1000);
            return;
        }
        try {
            const { auth, GoogleAuthProvider, signInWithPopup } = this.firebase;
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            log('Google 로그인 성공');
        }
        catch (error) {
            logError('Google 로그인 실패:', error);
            this.handleAuthError(error, 'login');
        }
    }
    /**
     * 로그아웃을 처리합니다.
     */
    async signOut() {
        if (!this.firebase) {
            log('Firebase가 사용할 수 없음, 로컬 로그아웃 처리');
            this.notifyAuthStateChange(null);
            return;
        }
        try {
            const { auth, signOut } = this.firebase;
            await signOut(auth);
            log('로그아웃 성공');
        }
        catch (error) {
            logError('로그아웃 실패:', error);
        }
    }
    /**
     * 비밀번호 재설정을 처리합니다.
     * @param event 폼 제출 이벤트
     */
    async handlePasswordReset(event) {
        event.preventDefault();
        if (!this.firebase) {
            this.showAlert('Firebase가 초기화되지 않아 비밀번호 재설정을 할 수 없습니다.');
            return;
        }
        const emailInput = $('#reset-email');
        const messageElement = $('#reset-message');
        if (!emailInput) {
            logError('비밀번호 재설정 폼 요소를 찾을 수 없음');
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
        }
        catch (error) {
            logError('비밀번호 재설정 실패:', error);
            this.handleAuthError(error, 'reset');
        }
    }
    /**
     * 인증 폼을 표시합니다.
     * @param formName 폼 타입
     */
    showAuthForm(formName) {
        const loginForm = $('#login-form');
        const signupForm = $('#signup-form');
        const resetForm = $('#reset-form');
        const authTabs = $('.auth-tabs');
        const divider = $('.divider');
        const socialButtons = $('.social-buttons');
        const authTitle = $('#auth-title');
        if (!loginForm || !signupForm || !resetForm) {
            logError('인증 폼 요소를 찾을 수 없음');
            return;
        }
        // 폼 표시/숨김 처리
        loginForm.classList.toggle('hidden', formName !== 'login');
        signupForm.classList.toggle('hidden', formName !== 'signup');
        resetForm.classList.toggle('hidden', formName !== 'reset');
        const isReset = formName === 'reset';
        // UI 요소 표시/숨김 처리
        if (authTabs)
            authTabs.classList.toggle('hidden', isReset);
        if (divider)
            divider.classList.toggle('hidden', isReset);
        if (socialButtons)
            socialButtons.classList.toggle('hidden', isReset);
        // 제목 변경
        if (authTitle) {
            authTitle.textContent = isReset ? '비밀번호 재설정' : '체육 수업 도우미';
        }
        // 탭 활성화 상태 변경
        const loginTabBtn = $('#login-tab-btn');
        const signupTabBtn = $('#signup-tab-btn');
        if (loginTabBtn)
            loginTabBtn.classList.toggle('active', formName === 'login');
        if (signupTabBtn)
            signupTabBtn.classList.toggle('active', formName === 'signup');
        // 오류 메시지 숨김
        this.clearAuthErrors();
    }
    /**
     * 로그인 모달을 표시합니다.
     */
    showLoginModal() {
        const authContainer = $('#auth-container');
        const appRoot = $('#app-root');
        if (authContainer && appRoot) {
            authContainer.classList.remove('hidden');
            appRoot.classList.add('hidden');
            this.showAuthForm('login');
        }
    }
    /**
     * 로그인 상태 UI를 업데이트합니다.
     */
    updateLoginStatus() {
        const loginStatus = $('#login-status');
        const guestStatus = $('#guest-status');
        if (!loginStatus || !guestStatus) {
            logError('로그인 상태 UI 요소를 찾을 수 없음');
            return;
        }
        if (this.currentUser) {
            loginStatus.classList.remove('hidden');
            guestStatus.classList.add('hidden');
            const userEmail = this.currentUser.displayName || this.currentUser.email || '사용자';
            const userEmailElement = $('#user-email');
            if (userEmailElement) {
                userEmailElement.textContent = userEmail;
            }
        }
        else {
            loginStatus.classList.add('hidden');
            guestStatus.classList.remove('hidden');
        }
    }
    /**
     * 인증 오류를 처리합니다.
     * @param error 오류 객체
     * @param type 오류 타입
     */
    handleAuthError(error, type) {
        const friendlyMessage = AUTH_ERROR_MESSAGES[error.code] || '오류가 발생했습니다. 다시 시도해주세요.';
        if (type === 'reset') {
            this.showResetMessage(friendlyMessage, 'error');
        }
        else {
            this.showAuthError(friendlyMessage, type);
        }
    }
    /**
     * 인증 오류 메시지를 표시합니다.
     * @param message 오류 메시지
     * @param type 오류 타입
     */
    showAuthError(message, type) {
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
    showResetMessage(message, type) {
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
    clearAuthErrors() {
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
    showAlert(message) {
        alert(message);
    }
}
// ========================================
// 전역 인스턴스 및 함수
// ========================================
/**
 * 전역 인증 관리자 인스턴스
 */
let authManagerInstance = null;
/**
 * 인증 관리자 인스턴스를 가져옵니다.
 * @param config 인증 설정
 * @returns 인증 관리자 인스턴스
 */
export const getAuthManager = (config) => {
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
export const initializeAuthManager = (config) => {
    const manager = getAuthManager(config);
    manager.setupFirebaseAuth();
    return manager;
};
/**
 * 전역 함수들을 노출합니다.
 */
export const setupGlobalAuthFunctions = () => {
    const manager = getAuthManager();
    // 전역 함수로 노출
    window.showLoginModal = () => manager.showLoginModal();
    window.showAuthForm = (formName) => manager.showAuthForm(formName);
    window.updateLoginStatus = () => manager.updateLoginStatus();
};
// ========================================
// 기본 내보내기
// ========================================
export default AuthManager;
//# sourceMappingURL=authManager.js.map