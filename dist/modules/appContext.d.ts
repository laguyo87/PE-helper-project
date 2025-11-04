/**
 * 앱 컨텍스트 모듈
 *
 * 이 모듈은 앱의 전역 컨텍스트(모든 Manager 인스턴스)를 중앙에서 관리합니다.
 * 싱글톤 패턴을 사용하여 앱 전역에서 접근 가능한 컨텍스트를 제공합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { AppInitializer } from './appInitializer.js';
import { AppStateManager } from './appStateManager.js';
import { DataSyncService } from './dataSyncService.js';
import { UIRenderer } from './uiRenderer.js';
import { ShareManager } from './shareManager.js';
import { VersionManagerType, AuthManager, DataManager, VisitorManager, LeagueManager, TournamentManager, PapsManager, ProgressManager } from './managerTypes.js';
/**
 * 앱 컨텍스트 - 모든 Manager 인스턴스를 포함
 */
export interface AppContext {
    appInitializer: AppInitializer | null;
    appStateManager: AppStateManager | null;
    dataSyncService: DataSyncService | null;
    uiRenderer: UIRenderer | null;
    shareManager: ShareManager | null;
    versionManager: VersionManagerType;
    authManager: AuthManager | null;
    dataManager: DataManager | null;
    visitorManager: VisitorManager | null;
    leagueManager: LeagueManager | null;
    tournamentManager: TournamentManager | null;
    papsManager: PapsManager | null;
    progressManager: ProgressManager | null;
}
/**
 * AppContext 초기 옵션
 */
export interface AppContextOptions {
    initialContext?: Partial<AppContext>;
}
/**
 * 앱 컨텍스트를 관리하는 클래스 (싱글톤)
 */
export declare class AppContext {
    private static instance;
    appInitializer: AppInitializer | null;
    appStateManager: AppStateManager | null;
    dataSyncService: DataSyncService | null;
    uiRenderer: UIRenderer | null;
    shareManager: ShareManager | null;
    versionManager: VersionManagerType;
    authManager: AuthManager | null;
    dataManager: DataManager | null;
    visitorManager: VisitorManager | null;
    leagueManager: LeagueManager | null;
    tournamentManager: TournamentManager | null;
    papsManager: PapsManager | null;
    progressManager: ProgressManager | null;
    /**
     * AppContext 인스턴스를 생성합니다.
     * @param options 초기 옵션
     */
    private constructor();
    /**
     * AppContext 싱글톤 인스턴스를 가져옵니다.
     * @param options 초기 옵션 (첫 생성 시에만 사용)
     * @returns AppContext 인스턴스
     */
    static getInstance(options?: AppContextOptions): AppContext;
    /**
     * AppContext 인스턴스를 리셋합니다. (테스트 용도)
     */
    static resetInstance(): void;
    /**
     * 컨텍스트를 업데이트합니다.
     * @param updates 업데이트할 속성들
     */
    update(updates: Partial<AppContext>): void;
    /**
     * 특정 Manager를 가져옵니다.
     * @param key Manager 키
     * @returns Manager 인스턴스 또는 null
     */
    getManager<K extends keyof AppContext>(key: K): AppContext[K];
    /**
     * 컨텍스트를 전체 가져옵니다.
     * @returns 현재 컨텍스트
     */
    getContext(): AppContext;
    /**
     * 모든 Manager가 초기화되었는지 확인합니다.
     * @returns 초기화 완료 여부
     */
    isInitialized(): boolean;
}
/**
 * AppContext 인스턴스를 가져오거나 생성합니다.
 * @param options 초기 옵션
 * @returns AppContext 인스턴스
 */
export declare function getAppContext(options?: AppContextOptions): AppContext;
/**
 * AppContext를 초기화합니다.
 * @param context 초기 컨텍스트 값
 * @returns AppContext 인스턴스
 */
export declare function initializeAppContext(context: Partial<AppContext>): AppContext;
export default AppContext;
//# sourceMappingURL=appContext.d.ts.map