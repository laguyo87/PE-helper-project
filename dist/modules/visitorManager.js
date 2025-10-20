/**
 * 방문자 통계 관리 모듈
 *
 * 이 모듈은 웹사이트의 방문자 통계를 관리합니다.
 * Firebase Firestore를 사용하여 방문자 수를 저장하고,
 * 세션 스토리지를 사용하여 중복 카운팅을 방지합니다.
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
// ========================================
// VisitorManager 클래스
// ========================================
/**
 * 방문자 통계를 관리하는 클래스
 */
export class VisitorManager {
    /**
     * VisitorManager 인스턴스를 생성합니다.
     * @param options 방문자 통계 옵션
     */
    constructor(options = {}) {
        this.firebase = null;
        this.options = {
            enableSessionTracking: true,
            enableUIUpdate: true,
            sessionKeyPrefix: 'visitor_counted_',
            ...options
        };
        this.initializeFirebase();
    }
    /**
     * Firebase 초기화
     */
    initializeFirebase() {
        if (typeof window !== 'undefined' && window.firebase) {
            this.firebase = window.firebase;
            this.log('Firebase 인스턴스 초기화 완료');
        }
        else {
            this.log('Firebase가 아직 초기화되지 않음, firebaseReady 이벤트 대기');
            window.addEventListener('firebaseReady', () => {
                if (window.firebase) {
                    this.firebase = window.firebase;
                    this.log('Firebase 인스턴스 지연 초기화 완료');
                }
            });
        }
    }
    /**
     * Firebase가 준비될 때까지 기다립니다.
     * @param maxWaitTime 최대 대기 시간 (밀리초)
     * @returns Promise<boolean> Firebase 준비 여부
     */
    async waitForFirebase(maxWaitTime = 10000) {
        if (this.firebase) {
            return true;
        }
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkFirebase = () => {
                if (this.firebase) {
                    resolve(true);
                    return;
                }
                if (Date.now() - startTime > maxWaitTime) {
                    this.log('Firebase 대기 시간 초과');
                    resolve(false);
                    return;
                }
                setTimeout(checkFirebase, 100);
            };
            checkFirebase();
        });
    }
    /**
     * 방문자 수를 업데이트합니다.
     * @returns 방문자 통계 결과
     */
    async updateVisitorCount() {
        try {
            this.log('=== 방문자 수 업데이트 시작 ===');
            // Firebase가 준비될 때까지 기다림
            const firebaseReady = await this.waitForFirebase();
            if (!firebaseReady || !this.firebase || !this.firebase.db) {
                this.log('Firebase가 아직 초기화되지 않음, 방문자 수 업데이트 건너뜀');
                return {
                    success: false,
                    count: 0,
                    startDate: null,
                    isNewVisitor: false,
                    error: 'Firebase가 초기화되지 않음'
                };
            }
            // 세션 기반 방문자 카운트 (같은 세션에서는 중복 카운트 방지)
            const sessionKey = this.getSessionKey();
            this.log('세션 키:', sessionKey);
            this.log('세션 스토리지 값:', sessionStorage.getItem(sessionKey));
            if (this.options.enableSessionTracking && sessionStorage.getItem(sessionKey)) {
                this.log('이미 오늘 방문자 수가 카운트됨, 기존 카운트만 로드');
                // 기존 카운트만 로드
                const result = await this.loadVisitorCount();
                return {
                    ...result,
                    isNewVisitor: false
                };
            }
            this.log('새로운 방문자로 카운트 시작');
            const visitorRef = this.firebase.doc(this.firebase.db, "stats", "visitors");
            const visitorSnap = await this.firebase.getDoc(visitorRef);
            let currentCount = 0;
            let startDate = null;
            if (visitorSnap.exists()) {
                const data = visitorSnap.data();
                currentCount = data.count || 0;
                startDate = data.startDate || null;
                this.log('기존 방문자 수:', currentCount, '시작 날짜:', startDate);
            }
            else {
                this.log('첫 방문자입니다');
            }
            // 첫 방문자라면 시작 날짜 설정
            if (!startDate) {
                startDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
                this.log('시작 날짜 설정:', startDate);
            }
            // 방문자 수 증가
            currentCount += 1;
            this.log('증가된 방문자 수:', currentCount);
            // Firebase에 저장
            this.log('Firebase에 저장 중...');
            await this.firebase.setDoc(visitorRef, {
                count: currentCount,
                startDate: startDate,
                lastUpdated: Date.now()
            });
            this.log('Firebase 저장 완료');
            // 세션에 카운트 완료 표시
            if (this.options.enableSessionTracking) {
                sessionStorage.setItem(sessionKey, 'true');
                this.log('세션 스토리지에 카운트 완료 표시');
            }
            // 화면에 표시 (시작 날짜 포함)
            if (this.options.enableUIUpdate) {
                this.displayVisitorCount(currentCount, startDate);
            }
            this.log('방문자 수 업데이트 완료:', currentCount);
            return {
                success: true,
                count: currentCount,
                startDate: startDate,
                isNewVisitor: true
            };
        }
        catch (error) {
            this.logError('방문자 수 업데이트 오류:', error);
            if (this.options.enableUIUpdate) {
                this.displayVisitorCountError();
            }
            return {
                success: false,
                count: 0,
                startDate: null,
                isNewVisitor: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    }
    /**
     * 방문자 수를 로드합니다.
     * @returns 방문자 통계 결과
     */
    async loadVisitorCount() {
        try {
            // Firebase가 준비될 때까지 기다림
            const firebaseReady = await this.waitForFirebase();
            if (!firebaseReady || !this.firebase || !this.firebase.db) {
                this.log('Firebase가 아직 초기화되지 않음, 방문자 수 로드 건너뜀');
                return {
                    success: false,
                    count: 0,
                    startDate: null,
                    isNewVisitor: false,
                    error: 'Firebase가 초기화되지 않음'
                };
            }
            const visitorRef = this.firebase.doc(this.firebase.db, "stats", "visitors");
            const visitorSnap = await this.firebase.getDoc(visitorRef);
            if (visitorSnap.exists()) {
                const data = visitorSnap.data();
                const count = data.count || 0;
                const startDate = data.startDate || null;
                if (this.options.enableUIUpdate) {
                    this.displayVisitorCount(count, startDate);
                }
                return {
                    success: true,
                    count: count,
                    startDate: startDate,
                    isNewVisitor: false
                };
            }
            else {
                if (this.options.enableUIUpdate) {
                    this.displayVisitorCount(0, null);
                }
                return {
                    success: true,
                    count: 0,
                    startDate: null,
                    isNewVisitor: false
                };
            }
        }
        catch (error) {
            this.logError('방문자 수 로드 오류:', error);
            if (this.options.enableUIUpdate) {
                this.displayVisitorCountError();
            }
            return {
                success: false,
                count: 0,
                startDate: null,
                isNewVisitor: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    }
    /**
     * 방문자 수를 화면에 표시합니다.
     * @param count 방문자 수
     * @param startDate 시작 날짜
     */
    displayVisitorCount(count, startDate) {
        const countElement = this.getElement('#visitor-count');
        if (countElement) {
            countElement.textContent = count.toLocaleString();
        }
        // 수업 진도 관리 모드의 방문자 수도 업데이트
        const progressCountElement = this.getElement('#progress-visitor-count');
        if (progressCountElement) {
            progressCountElement.textContent = count.toLocaleString();
        }
        this.log('방문자 수 표시 완료:', count);
    }
    /**
     * 방문자 수 표시 오류를 처리합니다.
     */
    displayVisitorCountError() {
        const countElement = this.getElement('#visitor-count');
        if (countElement) {
            countElement.textContent = '-';
        }
        const progressCountElement = this.getElement('#progress-visitor-count');
        if (progressCountElement) {
            progressCountElement.textContent = '-';
        }
    }
    /**
     * 진도 관리 모드의 방문자 수를 업데이트합니다.
     * @returns 방문자 통계 결과
     */
    async updateProgressVisitorCount() {
        try {
            // Firebase가 준비될 때까지 기다림
            const firebaseReady = await this.waitForFirebase();
            if (!firebaseReady || !this.firebase || !this.firebase.db) {
                this.log('Firebase를 사용할 수 없음, 방문자 수 업데이트 건너뜀');
                return {
                    success: false,
                    count: 0,
                    startDate: null,
                    isNewVisitor: false,
                    error: 'Firebase를 사용할 수 없음'
                };
            }
            const visitorRef = this.firebase.doc(this.firebase.db, "stats", "visitors");
            const visitorSnap = await this.firebase.getDoc(visitorRef);
            if (visitorSnap.exists()) {
                const data = visitorSnap.data();
                const count = data.count || 0;
                const progressCountElement = this.getElement('#progress-visitor-count');
                if (progressCountElement) {
                    progressCountElement.textContent = count.toLocaleString();
                }
                return {
                    success: true,
                    count: count,
                    startDate: data.startDate || null,
                    isNewVisitor: false
                };
            }
            else {
                const progressCountElement = this.getElement('#progress-visitor-count');
                if (progressCountElement) {
                    progressCountElement.textContent = '0';
                }
                return {
                    success: true,
                    count: 0,
                    startDate: null,
                    isNewVisitor: false
                };
            }
        }
        catch (error) {
            this.logError('진도 관리 모드 방문자 수 로드 오류:', error);
            const progressCountElement = this.getElement('#progress-visitor-count');
            if (progressCountElement) {
                progressCountElement.textContent = '-';
            }
            return {
                success: false,
                count: 0,
                startDate: null,
                isNewVisitor: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    }
    /**
     * 방문자 수 카운트 세션을 초기화합니다.
     * (개발자 콘솔에서 사용)
     */
    resetVisitorCount() {
        const sessionKey = this.getSessionKey();
        sessionStorage.removeItem(sessionKey);
        this.log('방문자 수 카운트 세션 초기화됨. 페이지를 새로고침하면 방문자 수가 증가합니다.');
    }
    /**
     * 방문자 통계를 초기화합니다.
     * (관리자용 - 위험한 작업)
     * @returns 초기화 결과
     */
    async resetVisitorStats() {
        try {
            if (!this.firebase || !this.firebase.db) {
                return {
                    success: false,
                    error: 'Firebase가 초기화되지 않음'
                };
            }
            const visitorRef = this.firebase.doc(this.firebase.db, "stats", "visitors");
            await this.firebase.setDoc(visitorRef, {
                count: 0,
                startDate: null,
                lastUpdated: Date.now()
            });
            // 세션 스토리지도 초기화
            this.resetVisitorCount();
            // UI 업데이트
            if (this.options.enableUIUpdate) {
                this.displayVisitorCount(0, null);
            }
            this.log('방문자 통계 초기화 완료');
            return { success: true };
        }
        catch (error) {
            this.logError('방문자 통계 초기화 오류:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : '알 수 없는 오류'
            };
        }
    }
    /**
     * 현재 방문자 통계를 가져옵니다.
     * @returns 방문자 통계 데이터
     */
    async getCurrentStats() {
        try {
            if (!this.firebase || !this.firebase.db) {
                return null;
            }
            const visitorRef = this.firebase.doc(this.firebase.db, "stats", "visitors");
            const visitorSnap = await this.firebase.getDoc(visitorRef);
            if (visitorSnap.exists()) {
                const data = visitorSnap.data();
                return {
                    count: data.count || 0,
                    startDate: data.startDate || null,
                    lastUpdated: data.lastUpdated || Date.now()
                };
            }
            return null;
        }
        catch (error) {
            this.logError('방문자 통계 조회 오류:', error);
            return null;
        }
    }
    /**
     * 세션 키를 생성합니다.
     * @returns 세션 키
     */
    getSessionKey() {
        return this.options.sessionKeyPrefix + new Date().toDateString();
    }
    /**
     * DOM 요소를 가져옵니다.
     * @param selector CSS 선택자
     * @returns DOM 요소 또는 null
     */
    getElement(selector) {
        try {
            return document.querySelector(selector);
        }
        catch (error) {
            this.logError('DOM 요소 조회 오류:', error);
            return null;
        }
    }
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    log(message, ...args) {
        console.log(`[VisitorManager] ${message}`, ...args);
    }
    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    logError(message, ...args) {
        console.error(`[VisitorManager] ${message}`, ...args);
    }
}
// ========================================
// 팩토리 함수
// ========================================
/**
 * VisitorManager 인스턴스를 생성합니다.
 * @param options 방문자 통계 옵션
 * @returns VisitorManager 인스턴스
 */
export function initializeVisitorManager(options) {
    return new VisitorManager(options);
}
// ========================================
// 유틸리티 함수
// ========================================
/**
 * 방문자 수 카운트 세션을 초기화합니다.
 * (개발자 콘솔에서 사용)
 */
export function resetVisitorCount() {
    const sessionKey = 'visitor_counted_' + new Date().toDateString();
    sessionStorage.removeItem(sessionKey);
    console.log('방문자 수 카운트 세션 초기화됨. 페이지를 새로고침하면 방문자 수가 증가합니다.');
}
// ========================================
// 기본 내보내기
// ========================================
export default VisitorManager;
//# sourceMappingURL=visitorManager.js.map