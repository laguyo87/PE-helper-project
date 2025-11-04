/**
 * 초기화 체인 모듈
 *
 * 앱 초기화를 Promise 기반 체인으로 관리합니다.
 * 각 단계가 명확히 분리되어 있고, 에러 처리 및 진행 상황 추적이 가능합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { AppContext } from './appContext.js';
import { AppStateManager } from './appStateManager.js';
import { DataSyncService } from './dataSyncService.js';
import { UIRenderer } from './uiRenderer.js';
import { ShareManager } from './shareManager.js';
import { GlobalBridge } from './globalBridge.js';
/**
 * 초기화 단계 타입
 */
export type InitializationStep = 'context' | 'state-manager' | 'app-initializer' | 'managers' | 'data-sync-service' | 'data-load' | 'data-sync' | 'ui-renderer' | 'share-manager' | 'global-bridge' | 'ui-rendering' | 'complete';
/**
 * 초기화 단계 결과
 */
export interface InitializationStepResult {
    step: InitializationStep;
    success: boolean;
    error?: Error;
    data?: any;
}
/**
 * 초기화 옵션
 */
export interface InitializationOptions {
    /** AppContext 인스턴스 */
    context: AppContext;
    /** AppStateManager 인스턴스 */
    stateManager: AppStateManager;
    /** DataSyncService 인스턴스 */
    dataSyncService: DataSyncService;
    /** UIRenderer 인스턴스 */
    uiRenderer: UIRenderer;
    /** ShareManager 인스턴스 */
    shareManager: ShareManager;
    /** GlobalBridge 인스턴스 */
    globalBridge: GlobalBridge;
    /** DOM 쿼리 선택자 함수 */
    $: (selector: string) => HTMLElement | null;
    /** DOM 쿼리 전체 선택 함수 */
    $$: (selector: string) => NodeListOf<HTMLElement>;
    /** 진행 상황 콜백 */
    onProgress?: (result: InitializationStepResult) => void;
    /** 에러 처리 콜백 */
    onError?: (error: Error, step: InitializationStep) => void;
}
/**
 * 초기화 체인 클래스
 */
export declare class InitializationChain {
    private options;
    private currentStep;
    constructor(options: InitializationOptions);
    /**
     * 초기화 체인을 실행합니다.
     * @returns 초기화 완료 Promise
     */
    execute(): Promise<InitializationStepResult[]>;
    /**
     * Context 초기화 단계
     */
    private initializeContext;
    /**
     * State Manager 초기화 단계
     */
    private initializeStateManager;
    /**
     * Manager들 초기화 단계
     */
    private initializeManagers;
    /**
     * DataSyncService 초기화 단계
     */
    private initializeDataSyncService;
    /**
     * Firebase 초기화 대기 헬퍼
     */
    private waitForFirebase;
    /**
     * 데이터 로드 단계
     */
    private loadData;
    /**
     * Manager 데이터 동기화 단계
     */
    private syncManagerData;
    /**
     * UIRenderer 초기화 단계
     */
    private initializeUIRenderer;
    /**
     * ShareManager 초기화 단계
     */
    private initializeShareManager;
    /**
     * GlobalBridge 초기화 단계
     */
    private initializeGlobalBridge;
    /**
     * UI 렌더링 단계
     */
    private renderUI;
    /**
     * 진행 상황 알림
     */
    private notifyProgress;
}
/**
 * InitializationChain 인스턴스 생성 함수
 */
export declare function createInitializationChain(options: InitializationOptions): InitializationChain;
//# sourceMappingURL=initializationChain.d.ts.map