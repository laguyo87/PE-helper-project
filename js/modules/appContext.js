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
// ========================================
// AppContext 클래스
// ========================================
/**
 * 앱 컨텍스트를 관리하는 클래스 (싱글톤)
 */
export class AppContext {
    /**
     * AppContext 인스턴스를 생성합니다.
     * @param options 초기 옵션
     */
    constructor(options = {}) {
        // 핵심 인프라
        this.appInitializer = null;
        this.appStateManager = null;
        this.dataSyncService = null;
        this.uiRenderer = null;
        this.shareManager = null;
        // 비즈니스 로직 Manager
        this.versionManager = null;
        this.authManager = null;
        this.dataManager = null;
        this.visitorManager = null;
        this.leagueManager = null;
        this.tournamentManager = null;
        this.papsManager = null;
        this.progressManager = null;
        if (options.initialContext) {
            Object.assign(this, options.initialContext);
        }
    }
    /**
     * AppContext 싱글톤 인스턴스를 가져옵니다.
     * @param options 초기 옵션 (첫 생성 시에만 사용)
     * @returns AppContext 인스턴스
     */
    static getInstance(options = {}) {
        if (!AppContext.instance) {
            AppContext.instance = new AppContext(options);
        }
        return AppContext.instance;
    }
    /**
     * AppContext 인스턴스를 리셋합니다. (테스트 용도)
     */
    static resetInstance() {
        AppContext.instance = null;
    }
    /**
     * 컨텍스트를 업데이트합니다.
     * @param updates 업데이트할 속성들
     */
    update(updates) {
        Object.assign(this, updates);
    }
    /**
     * 특정 Manager를 가져옵니다.
     * @param key Manager 키
     * @returns Manager 인스턴스 또는 null
     */
    getManager(key) {
        return this[key];
    }
    /**
     * 컨텍스트를 전체 가져옵니다.
     * @returns 현재 컨텍스트
     */
    getContext() {
        return { ...this };
    }
    /**
     * 모든 Manager가 초기화되었는지 확인합니다.
     * @returns 초기화 완료 여부
     */
    isInitialized() {
        return !!(this.appStateManager &&
            this.appInitializer &&
            this.dataSyncService &&
            this.uiRenderer &&
            this.shareManager);
    }
}
AppContext.instance = null;
// ========================================
// 팩토리 함수
// ========================================
/**
 * AppContext 인스턴스를 가져오거나 생성합니다.
 * @param options 초기 옵션
 * @returns AppContext 인스턴스
 */
export function getAppContext(options = {}) {
    return AppContext.getInstance(options);
}
/**
 * AppContext를 초기화합니다.
 * @param context 초기 컨텍스트 값
 * @returns AppContext 인스턴스
 */
export function initializeAppContext(context) {
    const ctx = getAppContext({ initialContext: context });
    ctx.update(context);
    return ctx;
}
// ========================================
// 기본 내보내기
// ========================================
export default AppContext;
//# sourceMappingURL=appContext.js.map