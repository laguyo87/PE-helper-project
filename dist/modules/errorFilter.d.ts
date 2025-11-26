/**
 * 에러 필터 모듈
 *
 * 이 모듈은 특정 에러(예: COOP 에러, Chrome 확장 프로그램 오류)를 필터링하여 콘솔에 표시되지 않도록 합니다.
 * - Firebase 팝업 로그인 시 발생하는 Cross-Origin-Opener-Policy 경고
 * - Chrome 확장 프로그램의 content script 관련 오류
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
/**
 * 에러 필터 옵션
 */
export interface ErrorFilterOptions {
    /** 필터링할 에러 패턴 목록 */
    patterns?: string[];
    /** MutationObserver 사용 여부 (기본값: true) */
    useMutationObserver?: boolean;
    /** 콘솔 필터링 활성화 여부 (기본값: true) */
    filterConsole?: boolean;
    /** 이벤트 필터링 활성화 여부 (기본값: true) */
    filterEvents?: boolean;
}
/**
 * 에러 필터링을 담당하는 클래스
 */
export declare class ErrorFilter {
    private patterns;
    private useMutationObserver;
    private filterConsole;
    private filterEvents;
    private originalConsoleMethods;
    private mutationObserver;
    private abortController;
    private errorEventHandler;
    private rejectionEventHandler;
    /**
     * ErrorFilter 인스턴스를 생성합니다.
     * @param options 에러 필터 옵션
     */
    constructor(options?: ErrorFilterOptions);
    /**
     * 에러 필터링을 초기화합니다.
     */
    private initialize;
    /**
     * 필터링할 에러인지 확인합니다.
     * @param text 검사할 텍스트
     * @returns 필터링할 에러인지 여부
     */
    private isCOOPError;
    /**
     * 순환 참조를 안전하게 처리하는 함수
     * @param obj 직렬화할 객체
     * @returns JSON 문자열
     */
    private safeStringify;
    /**
     * 콘솔 필터링을 설정합니다.
     */
    private setupConsoleFiltering;
    /**
     * 이벤트 필터링을 설정합니다.
     */
    private setupEventFiltering;
    /**
     * 콘솔 에러를 더 강력하게 필터링합니다.
     * Error 이벤트 자체를 가로채서 처리합니다.
     */
    private setupConsoleErrorInterceptor;
    /**
     * MutationObserver를 설정합니다.
     */
    private setupMutationObserver;
    /**
     * 에러 필터링을 비활성화합니다.
     */
    disable(): void;
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 이벤트 리스너를 정리합니다.
     */
    cleanup(): void;
    /**
     * 에러 필터링을 활성화합니다.
     */
    enable(): void;
    /**
     * 필터 패턴을 추가합니다.
     * @param pattern 추가할 패턴
     */
    addPattern(pattern: string): void;
    /**
     * 필터 패턴을 제거합니다.
     * @param pattern 제거할 패턴
     */
    removePattern(pattern: string): void;
}
/**
 * ErrorFilter 인스턴스를 생성하는 팩토리 함수
 * @param options ErrorFilter 옵션
 * @returns ErrorFilter 인스턴스
 */
export declare function createErrorFilter(options?: ErrorFilterOptions): ErrorFilter;
/**
 * COOP 에러 필터링을 즉시 초기화합니다.
 * 이 함수는 스크립트가 로드되자마자 실행되어야 합니다.
 * @param options ErrorFilter 옵션
 * @returns ErrorFilter 인스턴스
 */
export declare function initializeCOOPFilter(options?: ErrorFilterOptions): ErrorFilter;
export default ErrorFilter;
//# sourceMappingURL=errorFilter.d.ts.map