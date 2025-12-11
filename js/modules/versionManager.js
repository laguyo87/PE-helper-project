/**
 * 버전 관리 및 초기화 모듈
 *
 * 이 모듈은 앱의 버전 관리, 브라우저 호환성 검사, 버전 알림 등의 기능을 담당합니다.
 * TypeScript로 작성되어 타입 안정성을 보장합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { logger, logWarn, logError } from './logger.js';
// ========================================
// 상수 정의
// ========================================
/** 현재 앱 버전 */
export const APP_VERSION = '2.2.1';
/** 로컬 스토리지 버전 키 */
const VERSION_KEY = 'pe_helper_version';
/** 캐시 무효화 키 */
const CACHE_BUSTER_KEY = 'cache_buster';
/** 기본 자동 사라짐 시간 (10초) */
const DEFAULT_AUTO_HIDE_DELAY = 10000;
// Firebase 초기화 타임아웃은 현재 사용하지 않음
// const FIREBASE_INIT_TIMEOUT = 5000;
// ========================================
// 유틸리티 함수
// ========================================
/**
 * DOM 요소를 안전하게 선택합니다.
 * @param selector CSS 선택자
 * @returns 선택된 요소 또는 null
 */
const $ = (selector) => document.querySelector(selector);
/**
 * 로컬 스토리지에 안전하게 값을 저장합니다.
 * @param key 저장할 키
 * @param value 저장할 값
 */
const setLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, value);
    }
    catch (error) {
        logWarn(`로컬 스토리지 저장 실패 (${key}):`, error);
    }
};
/**
 * 로컬 스토리지에서 안전하게 값을 가져옵니다.
 * @param key 가져올 키
 * @returns 저장된 값 또는 null
 */
const getLocalStorage = (key) => {
    try {
        return localStorage.getItem(key);
    }
    catch (error) {
        logWarn(`로컬 스토리지 읽기 실패 (${key}):`, error);
        return null;
    }
};
// ========================================
// 버전 관리 함수
// ========================================
/**
 * 버전 체크 및 캐시 무효화를 수행합니다.
 *
 * 이 함수는 현재 앱 버전과 저장된 버전을 비교하여
 * 새 버전이 감지되면 캐시를 무효화하고 자동으로 새로고침합니다.
 * 알림 없이 항상 최신 버전이 로드되도록 보장합니다.
 *
 * @example
 * ```typescript
 * checkVersion(); // 자동으로 버전 체크 및 캐시 무효화
 * ```
 */
export const checkVersion = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fb2a3b-b7b1-4fcb-8de1-91535b111b83', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'versionManager.ts:125', message: 'checkVersion 시작', data: { currentUrl: window.location.href, scriptTags: Array.from(document.querySelectorAll('script[src]')).map(s => s.src) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
    const storedVersion = getLocalStorage(VERSION_KEY);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fb2a3b-b7b1-4fcb-8de1-91535b111b83', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'versionManager.ts:129', message: '버전 정보 확인', data: { storedVersion, appVersion: APP_VERSION, versionMatch: storedVersion === APP_VERSION }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
    // #endregion
    // 항상 캐시 무효화를 위한 타임스탬프 업데이트 (최신 버전 보장)
    const timestamp = Date.now().toString();
    setLocalStorage(CACHE_BUSTER_KEY, timestamp);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/42fb2a3b-b7b1-4fcb-8de1-91535b111b83', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'versionManager.ts:133', message: '캐시 버스터 설정', data: { timestamp, cacheBusterKey: CACHE_BUSTER_KEY }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
    // #endregion
    if (storedVersion !== APP_VERSION) {
        logger.debug(`새 버전 감지: ${APP_VERSION} (이전: ${storedVersion})`);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/42fb2a3b-b7b1-4fcb-8de1-91535b111b83', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'versionManager.ts:137', message: '새 버전 감지됨', data: { storedVersion, appVersion: APP_VERSION }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });
        // #endregion
        // 새 버전 저장
        setLocalStorage(VERSION_KEY, APP_VERSION);
        // 버전이 변경되었으면 자동으로 새로고침하여 최신 버전 사용
        // 알림 없이 바로 새로고침하여 항상 최신 버전을 사용하도록 함
        if (storedVersion) {
            logger.debug('버전이 변경되었습니다. 최신 버전으로 자동 새로고침합니다.');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/42fb2a3b-b7b1-4fcb-8de1-91535b111b83', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'versionManager.ts:145', message: '자동 새로고침 예약', data: { timestamp, currentUrl: window.location.href }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
            // #endregion
            // 약간의 지연 후 새로고침 (데이터 저장 완료 대기)
            setTimeout(() => {
                // 캐시를 완전히 무시하고 새로고침 (쿼리 파라미터 추가)
                const url = new URL(window.location.href);
                url.searchParams.set('_t', timestamp);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/42fb2a3b-b7b1-4fcb-8de1-91535b111b83', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'versionManager.ts:148', message: '새로고침 실행', data: { newUrl: url.toString(), timestamp }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
                // #endregion
                window.location.href = url.toString();
            }, 100);
        }
    }
    else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/42fb2a3b-b7b1-4fcb-8de1-91535b111b83', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'versionManager.ts:151', message: '버전 변경 없음', data: { storedVersion, appVersion: APP_VERSION }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
    }
};
/**
 * 새 버전 알림을 표시합니다.
 *
 * @deprecated 이 함수는 더 이상 사용되지 않습니다.
 * 버전이 변경되면 자동으로 새로고침되므로 알림이 필요 없습니다.
 */
export const showVersionNotification = (options) => {
    // 알림 기능 제거됨 - 버전이 변경되면 자동으로 새로고침됨
    // 이 함수는 호환성을 위해 남겨두지만 실제로는 아무 작업도 하지 않습니다.
    logger.debug('showVersionNotification 호출됨 (비활성화됨)', options);
};
/**
 * 상단바의 버전 표시를 업데이트합니다.
 *
 * 앱의 상단바에 표시되는 버전 정보를 현재 버전으로 업데이트합니다.
 *
 * @example
 * ```typescript
 * updateVersionDisplay(); // 상단바 버전 표시 업데이트
 * ```
 */
export const updateVersionDisplay = () => {
    const versionElement = $('.version');
    if (versionElement) {
        versionElement.textContent = 'online';
    }
};
// ========================================
// 브라우저 호환성 검사
// ========================================
/**
 * 브라우저 호환성을 검사합니다.
 *
 * 현재 브라우저가 앱을 실행하기에 적합한지 검사하고,
 * 문제가 있는 경우 경고를 표시합니다.
 *
 * @returns 브라우저 호환성 정보
 * @example
 * ```typescript
 * const compatibility = checkBrowserCompatibility();
 * if (!compatibility.isCompatible) {
 *   console.error('브라우저 호환성 문제:', compatibility.warnings);
 * }
 * ```
 */
export const checkBrowserCompatibility = () => {
    const userAgent = navigator.userAgent;
    const warnings = [];
    // 브라우저 종류 및 버전 감지
    const browserInfo = detectBrowser(userAgent);
    // Internet Explorer 체크
    if (browserInfo.type === 'ie') {
        alert('Internet Explorer는 지원되지 않습니다. Chrome, Firefox, Edge를 사용해주세요.');
        return {
            isCompatible: false,
            browserType: 'ie',
            version: browserInfo.version,
            warnings: ['Internet Explorer는 지원되지 않습니다.']
        };
    }
    // 구형 브라우저 체크
    if (browserInfo.type === 'chrome' && isOldVersion(browserInfo.version, 60)) {
        warnings.push('구형 Chrome 브라우저입니다. 일부 기능이 제한될 수 있습니다.');
    }
    if (browserInfo.type === 'firefox' && isOldVersion(browserInfo.version, 60)) {
        warnings.push('구형 Firefox 브라우저입니다. 일부 기능이 제한될 수 있습니다.');
    }
    // CSS Grid 지원 체크
    if (!CSS.supports('display', 'grid')) {
        warnings.push('CSS Grid가 지원되지 않습니다. 레이아웃이 깨질 수 있습니다.');
    }
    // Windows 환경 디버깅 정보
    if (navigator.platform.toLowerCase().includes('win')) {
        logger.debug('Windows 환경 감지됨');
        logger.debug('User Agent:', userAgent);
        logger.debug('Screen resolution:', `${screen.width}x${screen.height}`);
        logger.debug('Viewport size:', `${window.innerWidth}x${window.innerHeight}`);
    }
    // 경고 메시지 출력
    warnings.forEach(warning => logWarn(warning));
    return {
        isCompatible: true,
        browserType: browserInfo.type,
        version: browserInfo.version,
        warnings
    };
};
/**
 * 브라우저 정보를 감지합니다.
 * @param userAgent User Agent 문자열
 * @returns 브라우저 정보
 */
const detectBrowser = (userAgent) => {
    // Internet Explorer
    if (/MSIE|Trident/.test(userAgent)) {
        return { type: 'ie', version: extractVersion(userAgent, /MSIE (\d+\.\d+)/) };
    }
    // Chrome
    const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (chromeMatch && chromeMatch[1]) {
        return { type: 'chrome', version: chromeMatch[1] };
    }
    // Firefox
    const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (firefoxMatch && firefoxMatch[1]) {
        return { type: 'firefox', version: firefoxMatch[1] };
    }
    // Safari
    const safariMatch = userAgent.match(/Version\/(\d+\.\d+).*Safari/);
    if (safariMatch && safariMatch[1]) {
        return { type: 'safari', version: safariMatch[1] };
    }
    // Edge
    const edgeMatch = userAgent.match(/Edg\/(\d+\.\d+)/);
    if (edgeMatch && edgeMatch[1]) {
        return { type: 'edge', version: edgeMatch[1] };
    }
    return { type: 'unknown', version: '0.0' };
};
/**
 * User Agent에서 버전을 추출합니다.
 * @param userAgent User Agent 문자열
 * @param regex 버전 추출 정규식
 * @returns 추출된 버전
 */
const extractVersion = (userAgent, regex) => {
    const match = userAgent.match(regex);
    return match && match[1] ? match[1] : '0.0';
};
/**
 * 버전이 구형인지 확인합니다.
 * @param version 현재 버전
 * @param minVersion 최소 요구 버전
 * @returns 구형 여부
 */
const isOldVersion = (version, minVersion) => {
    const versionNumber = parseFloat(version);
    return !isNaN(versionNumber) && versionNumber < minVersion;
};
// ========================================
// 초기화 함수
// ========================================
/**
 * 버전 관리 시스템을 초기화합니다.
 *
 * 페이지 로드 시 자동으로 실행되어야 하는 함수들로,
 * 브라우저 호환성 검사, 버전 체크, 버전 표시 업데이트를 수행합니다.
 *
 * @returns 초기화 성공 여부
 * @example
 * ```typescript
 * if (!initializeVersionManager()) {
 *   console.error('버전 관리 시스템 초기화 실패');
 * }
 * ```
 */
export const initializeVersionManager = () => {
    try {
        logger.debug('=== 버전 관리 시스템 초기화 시작 ===');
        // 브라우저 호환성 체크
        const compatibility = checkBrowserCompatibility();
        if (!compatibility.isCompatible) {
            logError('브라우저 호환성 문제로 초기화 실패');
            return false;
        }
        // 버전 체크
        checkVersion();
        // 버전 표시 업데이트
        updateVersionDisplay();
        logger.debug('=== 버전 관리 시스템 초기화 완료 ===');
        return true;
    }
    catch (error) {
        logError('버전 관리 시스템 초기화 중 오류 발생:', error);
        return false;
    }
};
// ========================================
// 유틸리티 함수들
// ========================================
/**
 * 현재 앱 버전을 반환합니다.
 * @returns 현재 앱 버전
 * @example
 * ```typescript
 * const currentVersion = getCurrentVersion(); // "2.2.1"
 * ```
 */
export const getCurrentVersion = () => APP_VERSION;
/**
 * 로컬 스토리지에 저장된 버전을 반환합니다.
 * @returns 저장된 버전 또는 null
 * @example
 * ```typescript
 * const storedVersion = getStoredVersion(); // "2.2.0" 또는 null
 * ```
 */
export const getStoredVersion = () => getLocalStorage(VERSION_KEY);
/**
 * 두 버전을 비교합니다.
 *
 * @param version1 첫 번째 버전
 * @param version2 두 번째 버전
 * @returns -1: version1 < version2, 0: 같음, 1: version1 > version2
 * @example
 * ```typescript
 * const result = compareVersions('2.2.1', '2.2.0'); // 1
 * const result2 = compareVersions('1.0.0', '2.0.0'); // -1
 * const result3 = compareVersions('1.0.0', '1.0.0'); // 0
 * ```
 */
export const compareVersions = (version1, version2) => {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    const maxLength = Math.max(v1parts.length, v2parts.length);
    for (let i = 0; i < maxLength; i++) {
        const v1part = v1parts[i] || 0;
        const v2part = v2parts[i] || 0;
        if (v1part < v2part)
            return -1;
        if (v1part > v2part)
            return 1;
    }
    return 0;
};
/**
 * 캐시 무효화를 수행합니다.
 *
 * 현재 시간을 타임스탬프로 저장하여 브라우저 캐시를 무효화합니다.
 *
 * @example
 * ```typescript
 * invalidateCache(); // 캐시 무효화
 * ```
 */
export const invalidateCache = () => {
    const timestamp = Date.now().toString();
    setLocalStorage(CACHE_BUSTER_KEY, timestamp);
    logger.debug('캐시 무효화 완료:', timestamp);
};
/**
 * 버전 관리 시스템의 상태를 반환합니다.
 *
 * @returns 버전 관리 시스템 상태 정보
 * @example
 * ```typescript
 * const status = getVersionManagerStatus();
 * console.log('현재 버전:', status.currentVersion);
 * console.log('저장된 버전:', status.storedVersion);
 * console.log('버전 변경 여부:', status.hasVersionChanged);
 * ```
 */
export const getVersionManagerStatus = () => {
    const currentVersion = getCurrentVersion();
    const storedVersion = getStoredVersion();
    return {
        currentVersion,
        storedVersion,
        hasVersionChanged: currentVersion !== storedVersion,
        isFirstTime: storedVersion === null,
        cacheBuster: getLocalStorage(CACHE_BUSTER_KEY)
    };
};
//# sourceMappingURL=versionManager.js.map