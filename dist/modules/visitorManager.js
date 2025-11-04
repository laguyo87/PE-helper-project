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
    async waitForFirebase(maxWaitTime = 15000) {
        // 이미 Firebase가 있고 db도 있으면 바로 반환
        if (this.firebase && this.firebase.db) {
            this.log('Firebase 이미 준비됨');
            return true;
        }
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkFirebase = () => {
                // window.firebase에서 다시 확인
                if (typeof window !== 'undefined' && window.firebase) {
                    this.firebase = window.firebase;
                }
                if (this.firebase && this.firebase.db && this.firebase.doc && this.firebase.getDoc && this.firebase.setDoc) {
                    this.log('Firebase 준비 완료 (대기 시간:', Date.now() - startTime, 'ms)');
                    resolve(true);
                    return;
                }
                if (Date.now() - startTime > maxWaitTime) {
                    this.logError('Firebase 대기 시간 초과 (', maxWaitTime, 'ms)');
                    this.log('현재 Firebase 상태:', {
                        firebase: !!this.firebase,
                        db: !!(this.firebase && this.firebase.db),
                        doc: !!(this.firebase && this.firebase.doc),
                        getDoc: !!(this.firebase && this.firebase.getDoc),
                        setDoc: !!(this.firebase && this.firebase.setDoc)
                    });
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
            // 세션 스토리지에 오래된 키가 있는지 확인하고 정리
            if (this.options.enableSessionTracking) {
                const allKeys = Object.keys(sessionStorage);
                const oldVisitorKeys = allKeys.filter(key => key.startsWith(this.options.sessionKeyPrefix || 'visitor_counted_') &&
                    key !== sessionKey);
                if (oldVisitorKeys.length > 0) {
                    this.log('오래된 세션 키 정리:', oldVisitorKeys);
                    oldVisitorKeys.forEach(key => sessionStorage.removeItem(key));
                }
            }
            const isAlreadyCounted = this.options.enableSessionTracking && sessionStorage.getItem(sessionKey);
            if (isAlreadyCounted) {
                this.log('이미 오늘 방문자 수가 카운트됨, 기존 카운트만 로드');
                // 기존 카운트만 로드
                const result = await this.loadVisitorCount();
                this.log('기존 카운트 로드 결과:', result);
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
            this.log('저장할 데이터:', {
                count: currentCount,
                startDate: startDate,
                lastUpdated: Date.now()
            });
            try {
                // Firestore의 increment를 사용하여 원자적으로 증가시킴
                // 하지만 setDoc이 이미 존재하는 문서를 덮어쓰므로, 
                // 동시성 문제가 있을 수 있으니 주의 필요
                this.log('Firebase에 저장 시도, count:', currentCount);
                await this.firebase.setDoc(visitorRef, {
                    count: currentCount,
                    startDate: startDate,
                    lastUpdated: Date.now()
                }, { merge: false });
                this.log('setDoc 호출 완료, 검증 시작...');
                // 저장 확인을 위해 다시 읽기 (약간의 지연 후)
                await new Promise(resolve => setTimeout(resolve, 100));
                const verifySnap = await this.firebase.getDoc(visitorRef);
                if (verifySnap.exists()) {
                    const verifyData = verifySnap.data();
                    this.log('Firebase 저장 확인:', {
                        저장된_count: verifyData.count,
                        저장된_startDate: verifyData.startDate,
                        예상_count: currentCount
                    });
                    if (verifyData.count !== currentCount) {
                        this.logError('⚠️ 저장된 값이 예상과 다름!', {
                            예상: currentCount,
                            실제: verifyData.count,
                            차이: verifyData.count - currentCount
                        });
                        // 저장된 값이 더 크면 (다른 곳에서 카운트가 증가했을 수 있음)
                        // 그 값을 사용하되, 현재 세션은 카운트된 것으로 표시
                        if (verifyData.count > currentCount) {
                            this.log('다른 곳에서 카운트가 증가했을 수 있음, 저장된 값 사용:', verifyData.count);
                            currentCount = verifyData.count;
                        }
                    }
                    else {
                        this.log('✅ 저장 확인 완료, 값이 일치함');
                    }
                }
                else {
                    this.logError('⚠️ 저장 후 문서가 존재하지 않음! 다시 저장 시도...');
                    // 다시 저장 시도
                    await this.firebase.setDoc(visitorRef, {
                        count: currentCount,
                        startDate: startDate,
                        lastUpdated: Date.now()
                    }, { merge: false });
                }
                this.log('Firebase 저장 완료, 최종 count:', currentCount);
            }
            catch (saveError) {
                this.logError('Firebase 저장 오류:', saveError);
                this.logError('저장 오류 상세:', {
                    error: saveError,
                    message: saveError instanceof Error ? saveError.message : String(saveError),
                    stack: saveError instanceof Error ? saveError.stack : undefined
                });
                throw saveError; // 에러를 다시 던져서 상위에서 처리하도록
            }
            // 세션에 카운트 완료 표시 (저장 성공 후에만)
            if (this.options.enableSessionTracking) {
                sessionStorage.setItem(sessionKey, 'true');
                this.log('세션 스토리지에 카운트 완료 표시');
            }
            // 화면에 표시 (시작 날짜 포함)
            if (this.options.enableUIUpdate) {
                // 즉시 표시 시도
                this.displayVisitorCount(currentCount, startDate);
                // DOM이 준비될 때까지 약간 기다린 후에도 표시 (DOM이 아직 준비되지 않았을 수 있음)
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        this.displayVisitorCount(currentCount, startDate);
                    });
                }
                // 추가로 약간의 지연 후에도 한 번 더 시도 (동적 요소일 수 있음)
                setTimeout(() => {
                    this.displayVisitorCount(currentCount, startDate);
                }, 500);
                setTimeout(() => {
                    this.displayVisitorCount(currentCount, startDate);
                }, 2000);
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
                this.log('방문자 수 로드 완료:', count);
                if (this.options.enableUIUpdate) {
                    // DOM이 준비될 때까지 약간 기다린 후 표시
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                            this.displayVisitorCount(count, startDate);
                        });
                    }
                    else {
                        this.displayVisitorCount(count, startDate);
                        // 추가로 약간의 지연 후에도 한 번 더 시도
                        setTimeout(() => {
                            this.displayVisitorCount(count, startDate);
                        }, 1000);
                    }
                }
                return {
                    success: true,
                    count: count,
                    startDate: startDate,
                    isNewVisitor: false
                };
            }
            else {
                this.log('방문자 통계 문서가 없음, 0으로 표시');
                if (this.options.enableUIUpdate) {
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                            this.displayVisitorCount(0, null);
                        });
                    }
                    else {
                        this.displayVisitorCount(0, null);
                        setTimeout(() => {
                            this.displayVisitorCount(0, null);
                        }, 1000);
                    }
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
        this.log('displayVisitorCount 호출, count:', count);
        const formattedCount = count.toLocaleString();
        let foundAny = false;
        // 여러 ID로 요소 찾기 (원본 HTML의 visitor-count와 ProgressManager의 progress-visitor-count)
        const selectors = ['#visitor-count', '#progress-visitor-count'];
        for (const selector of selectors) {
            let countElement = this.getElement(selector);
            if (!countElement) {
                // document에서 직접 찾기
                countElement = document.querySelector(selector);
                this.log(`${selector} 요소 찾기 시도 (document.querySelector):`, !!countElement);
            }
            if (countElement) {
                countElement.textContent = formattedCount;
                foundAny = true;
                this.log(`방문자 수 표시 완료 (${selector}):`, count);
            }
        }
        if (!foundAny) {
            // 요소를 찾지 못한 경우, MutationObserver로 요소가 나타날 때까지 기다림
            this.log('요소를 찾지 못함, MutationObserver로 대기 시작');
            let observerFound = false;
            const observer = new MutationObserver((mutations, obs) => {
                if (observerFound)
                    return; // 이미 찾았으면 중단
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.textContent = formattedCount;
                        this.log(`MutationObserver로 요소 발견 (${selector}), 방문자 수 표시 완료:`, count);
                        obs.disconnect();
                        observerFound = true;
                        return;
                    }
                }
            });
            // body와 모든 하위 요소를 관찰
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
            // 추가로 주기적으로 재시도 (MutationObserver만으로는 모든 경우를 커버하지 못할 수 있음)
            let retryCount = 0;
            const maxRetries = 20; // 10초 (20회 * 500ms)
            const retryInterval = 500;
            const retry = setInterval(() => {
                if (observerFound) {
                    clearInterval(retry);
                    return;
                }
                retryCount++;
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.textContent = formattedCount;
                        this.log(`재시도로 요소 발견 (${selector}), 방문자 수 표시 완료:`, count);
                        observer.disconnect();
                        clearInterval(retry);
                        observerFound = true;
                        return;
                    }
                }
                if (retryCount >= maxRetries) {
                    observer.disconnect();
                    clearInterval(retry);
                    this.logError(`❌ ${selectors.join(', ')} 요소를 찾을 수 없음 (${maxRetries}회 재시도 후에도)`);
                    this.log('현재 DOM 상태 확인:', {
                        body: !!document.body,
                        sidebar: !!document.querySelector('.sidebar-footer'),
                        visitorInfo: !!document.querySelector('.visitor-info'),
                        visitorCount: !!document.querySelector('#visitor-count'),
                        progressVisitorCount: !!document.querySelector('#progress-visitor-count')
                    });
                }
            }, retryInterval);
        }
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