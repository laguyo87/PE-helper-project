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
        console.warn(`로컬 스토리지 저장 실패 (${key}):`, error);
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
        console.warn(`로컬 스토리지 읽기 실패 (${key}):`, error);
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
 * 새 버전이 감지되면 캐시를 무효화하고 사용자에게 알림을 표시합니다.
 *
 * @example
 * ```typescript
 * checkVersion(); // 자동으로 버전 체크 및 캐시 무효화
 * ```
 */
export const checkVersion = () => {
    const storedVersion = getLocalStorage(VERSION_KEY);
    if (storedVersion !== APP_VERSION) {
        console.log(`새 버전 감지: ${APP_VERSION} (이전: ${storedVersion})`);
        // 새 버전 저장
        setLocalStorage(VERSION_KEY, APP_VERSION);
        // 캐시 무효화를 위한 타임스탬프 추가
        const timestamp = Date.now().toString();
        setLocalStorage(CACHE_BUSTER_KEY, timestamp);
        // 버전이 변경되었으면 자동으로 새로고침하여 최신 버전 사용
        // 알림 없이 바로 새로고침하여 항상 최신 버전을 사용하도록 함
        if (storedVersion) {
            console.log('버전이 변경되었습니다. 최신 버전으로 자동 새로고침합니다.');
            // 약간의 지연 후 새로고침 (데이터 저장 완료 대기)
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    }
};
/**
 * 새 버전 알림을 표시합니다.
 *
 * 사용자에게 새 버전이 출시되었음을 알리고,
 * 새로고침을 유도하는 알림창을 표시합니다.
 *
 * @param options 알림 옵션
 * @example
 * ```typescript
 * showVersionNotification({
 *   newVersion: '2.2.1',
 *   oldVersion: '2.2.0',
 *   autoHideDelay: 15000
 * });
 * ```
 */
export const showVersionNotification = (options) => {
    const { newVersion, autoHideDelay = DEFAULT_AUTO_HIDE_DELAY, position = 'top-right' } = options;
    // 기존 알림이 있다면 제거
    const existingNotification = document.querySelector('.version-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    // 알림 요소 생성
    const notification = document.createElement('div');
    notification.className = 'version-notification';
    // 위치별 스타일 설정
    const positionStyles = {
        'top-right': 'top: 20px; right: 20px;',
        'top-left': 'top: 20px; left: 20px;',
        'bottom-right': 'bottom: 20px; right: 20px;',
        'bottom-left': 'bottom: 20px; left: 20px;'
    };
    notification.style.cssText = `
    position: fixed;
    ${positionStyles[position]}
    background: #1565c0;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: 'Noto Sans KR', sans-serif;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;
    // 알림 내용 HTML 생성
    notification.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 8px;">🔄 새 버전 사용 가능</div>
    <div style="font-size: 14px; margin-bottom: 12px;">
      v${newVersion}이 출시되었습니다.<br>
      최신 기능을 사용하려면 새로고침해주세요.
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="notification-btn-later" 
              style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
        나중에
      </button>
      <button class="notification-btn-refresh" 
              style="background: white; border: none; color: #1565c0; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
        새로고침
      </button>
    </div>
  `;
    // CSS 애니메이션 추가 (한 번만)
    if (!document.querySelector('#version-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'version-notification-styles';
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
        document.head.appendChild(style);
    }
    // 이벤트 리스너 추가
    const laterBtn = notification.querySelector('.notification-btn-later');
    const refreshBtn = notification.querySelector('.notification-btn-refresh');
    laterBtn?.addEventListener('click', () => {
        notification.remove();
    });
    refreshBtn?.addEventListener('click', () => {
        window.location.reload();
    });
    // DOM에 추가
    document.body.appendChild(notification);
    // 자동 사라짐 설정
    if (autoHideDelay > 0) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, autoHideDelay);
    }
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
        versionElement.textContent = `v${APP_VERSION}`;
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
        console.log('Windows 환경 감지됨');
        console.log('User Agent:', userAgent);
        console.log('Screen resolution:', `${screen.width}x${screen.height}`);
        console.log('Viewport size:', `${window.innerWidth}x${window.innerHeight}`);
    }
    // 경고 메시지 출력
    warnings.forEach(warning => console.warn(warning));
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
        console.log('=== 버전 관리 시스템 초기화 시작 ===');
        // 브라우저 호환성 체크
        const compatibility = checkBrowserCompatibility();
        if (!compatibility.isCompatible) {
            console.error('브라우저 호환성 문제로 초기화 실패');
            return false;
        }
        // 버전 체크
        checkVersion();
        // 버전 표시 업데이트
        updateVersionDisplay();
        console.log('=== 버전 관리 시스템 초기화 완료 ===');
        return true;
    }
    catch (error) {
        console.error('버전 관리 시스템 초기화 중 오류 발생:', error);
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
    console.log('캐시 무효화 완료:', timestamp);
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