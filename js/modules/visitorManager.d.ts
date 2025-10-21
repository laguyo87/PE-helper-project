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
/**
 * 방문자 통계 데이터 구조
 */
export interface VisitorStats {
    count: number;
    startDate: string | null;
    lastUpdated: number;
}
/**
 * 방문자 통계 옵션
 */
export interface VisitorStatsOptions {
    enableSessionTracking?: boolean;
    enableUIUpdate?: boolean;
    sessionKeyPrefix?: string;
}
/**
 * 방문자 통계 결과
 */
export interface VisitorStatsResult {
    success: boolean;
    count: number;
    startDate: string | null;
    isNewVisitor: boolean;
    error?: string;
}
/**
 * 방문자 통계를 관리하는 클래스
 */
export declare class VisitorManager {
    private firebase;
    private options;
    /**
     * VisitorManager 인스턴스를 생성합니다.
     * @param options 방문자 통계 옵션
     */
    constructor(options?: VisitorStatsOptions);
    /**
     * Firebase 초기화
     */
    private initializeFirebase;
    /**
     * Firebase가 준비될 때까지 기다립니다.
     * @param maxWaitTime 최대 대기 시간 (밀리초)
     * @returns Promise<boolean> Firebase 준비 여부
     */
    private waitForFirebase;
    /**
     * 방문자 수를 업데이트합니다.
     * @returns 방문자 통계 결과
     */
    updateVisitorCount(): Promise<VisitorStatsResult>;
    /**
     * 방문자 수를 로드합니다.
     * @returns 방문자 통계 결과
     */
    loadVisitorCount(): Promise<VisitorStatsResult>;
    /**
     * 방문자 수를 화면에 표시합니다.
     * @param count 방문자 수
     * @param startDate 시작 날짜
     */
    displayVisitorCount(count: number, startDate: string | null): void;
    /**
     * 방문자 수 표시 오류를 처리합니다.
     */
    displayVisitorCountError(): void;
    /**
     * 진도 관리 모드의 방문자 수를 업데이트합니다.
     * @returns 방문자 통계 결과
     */
    updateProgressVisitorCount(): Promise<VisitorStatsResult>;
    /**
     * 방문자 수 카운트 세션을 초기화합니다.
     * (개발자 콘솔에서 사용)
     */
    resetVisitorCount(): void;
    /**
     * 방문자 통계를 초기화합니다.
     * (관리자용 - 위험한 작업)
     * @returns 초기화 결과
     */
    resetVisitorStats(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * 현재 방문자 통계를 가져옵니다.
     * @returns 방문자 통계 데이터
     */
    getCurrentStats(): Promise<VisitorStats | null>;
    /**
     * 세션 키를 생성합니다.
     * @returns 세션 키
     */
    private getSessionKey;
    /**
     * DOM 요소를 가져옵니다.
     * @param selector CSS 선택자
     * @returns DOM 요소 또는 null
     */
    private getElement;
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    private log;
    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    private logError;
}
/**
 * VisitorManager 인스턴스를 생성합니다.
 * @param options 방문자 통계 옵션
 * @returns VisitorManager 인스턴스
 */
export declare function initializeVisitorManager(options?: VisitorStatsOptions): VisitorManager;
/**
 * 방문자 수 카운트 세션을 초기화합니다.
 * (개발자 콘솔에서 사용)
 */
export declare function resetVisitorCount(): void;
export default VisitorManager;
//# sourceMappingURL=visitorManager.d.ts.map