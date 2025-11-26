/**
 * UI 렌더링 모듈
 *
 * 이 모듈은 앱의 UI 렌더링 로직을 중앙에서 관리합니다.
 * 모드별 렌더링, 모드 전환, UI 초기화 등의 기능을 제공합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { AppStateManager } from './appStateManager.js';
import { UIRendererManagers } from './managerTypes.js';
/**
 * Manager 인스턴스들
 * @deprecated UIRendererManagers를 사용하세요
 */
export interface ManagerInstances extends UIRendererManagers {
}
/**
 * UIRenderer 옵션
 */
export interface UIRendererOptions {
    /** AppStateManager 인스턴스 */
    stateManager: AppStateManager;
    /** Manager 인스턴스들 */
    managers: UIRendererManagers;
    /** DOM 쿼리 선택자 함수 */
    $: (selector: string) => HTMLElement | null;
    /** DOM 쿼리 전체 선택 함수 */
    $$: (selector: string) => NodeListOf<HTMLElement>;
}
/**
 * UI 렌더링을 담당하는 클래스
 */
export declare class UIRenderer {
    private stateManager;
    private managers;
    private $;
    private $$;
    private currentMode;
    private abortController;
    private domContentLoadedHandler;
    private renderRetryTimers;
    private __leagueRetryWarned;
    private __tournamentRetryWarned;
    private __papsRetryWarned;
    private __progressRetryWarned;
    private retryCounts;
    private __leagueMaxRetriesWarned;
    private __tournamentMaxRetriesWarned;
    private __papsMaxRetriesWarned;
    private __progressMaxRetriesWarned;
    /**
     * UIRenderer 인스턴스를 생성합니다.
     * @param options UIRenderer 옵션
     */
    constructor(options: UIRendererOptions);
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 이벤트 리스너를 정리합니다.
     */
    cleanup(): void;
    /**
     * Managers 참조를 업데이트합니다.
     */
    updateManagers(managers: Partial<UIRendererManagers>): void;
    /**
     * 현재 모드를 반환합니다.
     */
    getMode(): string;
    /**
     * 모드를 설정합니다.
     * @param mode 모드 ('league' | 'tournament' | 'paps' | 'progress')
     */
    setMode(mode: string): void;
    /**
     * UI를 초기화합니다.
     */
    initializeUI(): void;
    /**
     * 모드 버튼 이벤트 리스너를 설정합니다.
     */
    setupModeButtons(): void;
    /**
     * 앱 화면을 표시합니다 (로그인 화면 숨김)
     */
    private showAppScreen;
    /**
     * 모드를 전환합니다.
     * @param mode 모드 ('league' | 'tournament' | 'paps' | 'progress')
     */
    switchMode(mode: string): void;
    /**
     * 현재 모드에 따라 앱을 렌더링합니다.
     */
    renderApp(): void;
    /**
     * 리그전 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    private renderLeagueMode;
    /**
     * 토너먼트 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    private renderTournamentMode;
    /**
     * PAPS 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    private renderPapsMode;
    /**
     * 진도표 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    private renderProgressMode;
    /**
     * 재시도 스케줄링 (Manager 초기화 대기)
     */
    private scheduleRetry;
    /**
     * 재시도 타이머 취소
     */
    private clearRetry;
}
/**
 * UIRenderer 인스턴스를 생성하는 팩토리 함수
 * @param options UIRenderer 옵션
 * @returns UIRenderer 인스턴스
 */
export declare function createUIRenderer(options: UIRendererOptions): UIRenderer;
export default UIRenderer;
//# sourceMappingURL=uiRenderer.d.ts.map