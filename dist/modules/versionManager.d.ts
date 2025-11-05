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
/**
 * 브라우저 호환성 검사 결과
 */
interface BrowserCompatibility {
    /** 호환성 여부 */
    isCompatible: boolean;
    /** 브라우저 종류 */
    browserType: 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie' | 'unknown';
    /** 브라우저 버전 */
    version: string;
    /** 경고 메시지 목록 */
    warnings: string[];
}
/**
 * 버전 비교 결과
 */
type VersionComparison = -1 | 0 | 1;
/**
 * 버전 알림 옵션
 */
interface VersionNotificationOptions {
    /** 새 버전 */
    newVersion: string;
    /** 이전 버전 */
    oldVersion: string;
    /** 자동 사라짐 시간 (밀리초) */
    autoHideDelay?: number;
    /** 알림 위치 */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
/** 현재 앱 버전 */
export declare const APP_VERSION: "2.2.1";
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
export declare const checkVersion: () => void;
/**
 * 새 버전 알림을 표시합니다.
 *
 * @deprecated 이 함수는 더 이상 사용되지 않습니다.
 * 버전이 변경되면 자동으로 새로고침되므로 알림이 필요 없습니다.
 */
export declare const showVersionNotification: (options: VersionNotificationOptions) => void;
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
export declare const updateVersionDisplay: () => void;
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
export declare const checkBrowserCompatibility: () => BrowserCompatibility;
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
export declare const initializeVersionManager: () => boolean;
/**
 * 현재 앱 버전을 반환합니다.
 * @returns 현재 앱 버전
 * @example
 * ```typescript
 * const currentVersion = getCurrentVersion(); // "2.2.1"
 * ```
 */
export declare const getCurrentVersion: () => string;
/**
 * 로컬 스토리지에 저장된 버전을 반환합니다.
 * @returns 저장된 버전 또는 null
 * @example
 * ```typescript
 * const storedVersion = getStoredVersion(); // "2.2.0" 또는 null
 * ```
 */
export declare const getStoredVersion: () => string | null;
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
export declare const compareVersions: (version1: string, version2: string) => VersionComparison;
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
export declare const invalidateCache: () => void;
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
export declare const getVersionManagerStatus: () => {
    currentVersion: string;
    storedVersion: string | null;
    hasVersionChanged: boolean;
    isFirstTime: boolean;
    cacheBuster: string | null;
};
export {};
//# sourceMappingURL=versionManager.d.ts.map