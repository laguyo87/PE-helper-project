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
import { getDefaultData } from './utils.js';
import { logger, logWarn } from './logger.js';

/**
 * 초기화 단계 타입
 */
export type InitializationStep = 
  | 'context'
  | 'state-manager'
  | 'app-initializer'
  | 'managers'
  | 'data-sync-service'
  | 'data-load'
  | 'data-sync'
  | 'ui-renderer'
  | 'share-manager'
  | 'global-bridge'
  | 'ui-rendering'
  | 'complete';

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
export class InitializationChain {
  private options: InitializationOptions;
  private currentStep: InitializationStep = 'context';

  constructor(options: InitializationOptions) {
    this.options = options;
  }

  /**
   * 초기화 체인을 실행합니다.
   * @returns 초기화 완료 Promise
   */
  public async execute(): Promise<InitializationStepResult[]> {
    const results: InitializationStepResult[] = [];

    try {
      // 1. Context 초기화
      results.push(await this.initializeContext());

      // 2. State Manager 초기화
      results.push(await this.initializeStateManager());

      // 3. App Initializer 생성 및 Manager 초기화
      results.push(await this.initializeManagers());

      // 4. DataSyncService 초기화
      results.push(await this.initializeDataSyncService());

      // 5. 데이터 로드
      results.push(await this.loadData());

      // 6. Manager 데이터 동기화
      results.push(await this.syncManagerData());

      // 7. UIRenderer 초기화
      results.push(await this.initializeUIRenderer());

      // 8. ShareManager 초기화
      results.push(await this.initializeShareManager());

      // 9. GlobalBridge 초기화
      results.push(await this.initializeGlobalBridge());

      // 10. UI 렌더링
      results.push(await this.renderUI());

      // 완료
      results.push({
        step: 'complete',
        success: true
      });

      return results;
    } catch (error) {
      const errorResult: InitializationStepResult = {
        step: this.currentStep,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      results.push(errorResult);

      if (this.options.onError && errorResult.error) {
        this.options.onError(errorResult.error, this.currentStep);
      }

      throw error;
    }
  }

  /**
   * Context 초기화 단계
   */
  private async initializeContext(): Promise<InitializationStepResult> {
    this.currentStep = 'context';
    try {
      // Context는 이미 초기화되어 있으므로 검증만 수행
      if (!this.options.context) {
        throw new Error('AppContext가 제공되지 않았습니다.');
      }

      const result: InitializationStepResult = {
        step: 'context',
        success: true,
        data: { context: this.options.context }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'context',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * State Manager 초기화 단계
   */
  private async initializeStateManager(): Promise<InitializationStepResult> {
    this.currentStep = 'state-manager';
    try {
      if (!this.options.stateManager) {
        throw new Error('AppStateManager가 제공되지 않았습니다.');
      }

      const result: InitializationStepResult = {
        step: 'state-manager',
        success: true,
        data: { stateManager: this.options.stateManager }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'state-manager',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * Manager들 초기화 단계
   */
  private async initializeManagers(): Promise<InitializationStepResult> {
    this.currentStep = 'app-initializer';
    try {
      if (!this.options.context.appInitializer) {
        throw new Error('AppInitializer가 초기화되지 않았습니다.');
      }

      if (!this.options.stateManager) {
        throw new Error('AppStateManager가 초기화되지 않았습니다.');
      }

      // Manager 초기화
      const initialData = this.options.stateManager.getState();
      const managers = await this.options.context.appInitializer.initialize(initialData);

      // Context에 Manager 할당
      this.options.context.versionManager = managers.versionManager;
      this.options.context.authManager = managers.authManager;
      this.options.context.dataManager = managers.dataManager;
      this.options.context.visitorManager = managers.visitorManager;
      this.options.context.leagueManager = managers.leagueManager;
      this.options.context.tournamentManager = managers.tournamentManager;
      this.options.context.papsManager = managers.papsManager;
      this.options.context.progressManager = managers.progressManager;

      const result: InitializationStepResult = {
        step: 'managers',
        success: true,
        data: { managers }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'managers',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * DataSyncService 초기화 단계
   */
  private async initializeDataSyncService(): Promise<InitializationStepResult> {
    this.currentStep = 'data-sync-service';
    try {
      if (!this.options.context.dataManager || 
          !this.options.context.authManager || 
          !this.options.stateManager) {
        throw new Error('DataManager, AuthManager 또는 AppStateManager가 초기화되지 않았습니다.');
      }

      // DataSyncService는 이미 초기화되어 있으므로 Manager 참조만 업데이트
      if (!this.options.dataSyncService) {
        throw new Error('DataSyncService가 제공되지 않았습니다.');
      }

      // Manager 참조 업데이트
      this.options.dataSyncService.setDataManager(this.options.context.dataManager);
      this.options.dataSyncService.setAuthManager(this.options.context.authManager);
      this.options.context.dataSyncService = this.options.dataSyncService;

      const result: InitializationStepResult = {
        step: 'data-sync-service',
        success: true,
        data: { dataSyncService: this.options.dataSyncService }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'data-sync-service',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * Firebase 초기화 대기 헬퍼
   */
  private async waitForFirebase(timeout: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).firebase && (window as any).firebase.db) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        window.removeEventListener('firebaseReady', handler);
        logWarn('[InitializationChain] Firebase 초기화 대기 시간 초과');
        resolve(false);
      }, timeout);

      const handler = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('firebaseReady', handler);
        resolve(true);
      };

      window.addEventListener('firebaseReady', handler, { once: true });
    });
  }

  /**
   * 데이터 로드 단계
   */
  private async loadData(): Promise<InitializationStepResult> {
    this.currentStep = 'data-load';
    try {
      if (!this.options.dataSyncService) {
        throw new Error('DataSyncService가 초기화되지 않았습니다.');
      }

      // Firebase 초기화 대기 (데이터 로드 전에 Firebase가 준비되어야 함)
      logger.debug('[InitializationChain] Firebase 초기화 대기 중...');
      await this.waitForFirebase(10000);
      logger.debug('[InitializationChain] Firebase 준비 완료, 데이터 로드 시작');

      const syncResult = await this.options.dataSyncService.sync();

      const result: InitializationStepResult = {
        step: 'data-load',
        success: syncResult.success,
        error: syncResult.error,
        data: { syncResult }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'data-load',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      // 데이터 로드 실패는 치명적이지 않을 수 있으므로 throw하지 않음
      return result;
    }
  }

  /**
   * Manager 데이터 동기화 단계
   */
  private async syncManagerData(): Promise<InitializationStepResult> {
    this.currentStep = 'data-sync';
    try {
      if (!this.options.stateManager) {
        throw new Error('AppStateManager가 초기화되지 않았습니다.');
      }

      const state = this.options.stateManager.getState();

      // 각 Manager에 최신 데이터 동기화
      if (this.options.context.progressManager) {
        // initialize 대신 updateProgressData 사용 (무한 루프 방지)
        this.options.context.progressManager.updateProgressData(
          state.progress.classes, 
          state.progress.selectedClassId
        );
      }
      if (this.options.context.leagueManager) {
        this.options.context.leagueManager.setLeagueData(state.leagues);
      }
      if (this.options.context.tournamentManager) {
        this.options.context.tournamentManager.setTournamentData(state.tournaments);
      }
      if (this.options.context.papsManager) {
        this.options.context.papsManager.setPapsData(state.paps);
      }

      const result: InitializationStepResult = {
        step: 'data-sync',
        success: true
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'data-sync',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * UIRenderer 초기화 단계
   */
  private async initializeUIRenderer(): Promise<InitializationStepResult> {
    this.currentStep = 'ui-renderer';
    try {
      if (!this.options.uiRenderer) {
        throw new Error('UIRenderer가 제공되지 않았습니다.');
      }

      // UIRenderer는 Manager 초기화 후에 Manager 참조가 필요하므로
      // 여기서는 기본 UI 초기화만 수행 (Manager는 이미 context에 설정됨)
      this.options.uiRenderer.initializeUI();

      const result: InitializationStepResult = {
        step: 'ui-renderer',
        success: true,
        data: { uiRenderer: this.options.uiRenderer }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'ui-renderer',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * ShareManager 초기화 단계
   */
  private async initializeShareManager(): Promise<InitializationStepResult> {
    this.currentStep = 'share-manager';
    try {
      if (!this.options.shareManager) {
        throw new Error('ShareManager가 제공되지 않았습니다.');
      }

      const result: InitializationStepResult = {
        step: 'share-manager',
        success: true,
        data: { shareManager: this.options.shareManager }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'share-manager',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * GlobalBridge 초기화 단계
   */
  private async initializeGlobalBridge(): Promise<InitializationStepResult> {
    this.currentStep = 'global-bridge';
    try {
      if (!this.options.globalBridge) {
        throw new Error('GlobalBridge가 제공되지 않았습니다.');
      }

      // 전역 함수 등록
      this.options.globalBridge.registerAll();

      const result: InitializationStepResult = {
        step: 'global-bridge',
        success: true,
        data: { globalBridge: this.options.globalBridge }
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'global-bridge',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * UI 렌더링 단계
   */
  private async renderUI(): Promise<InitializationStepResult> {
    this.currentStep = 'ui-rendering';
    try {
      if (!this.options.uiRenderer) {
        throw new Error('UIRenderer가 초기화되지 않았습니다.');
      }

      // UI 렌더링 (Promise로 감싸서 비동기 처리)
      await new Promise<void>((resolve) => {
        // 렌더링 실행
        this.options.uiRenderer.renderApp();

        // DOM 업데이트를 기다린 후 모드 버튼 재설정
        setTimeout(() => {
          this.options.uiRenderer.setupModeButtons();
          resolve();
        }, 100);
      });

      const result: InitializationStepResult = {
        step: 'ui-rendering',
        success: true
      };

      this.notifyProgress(result);
      return result;
    } catch (error) {
      const result: InitializationStepResult = {
        step: 'ui-rendering',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
      this.notifyProgress(result);
      throw error;
    }
  }

  /**
   * 진행 상황 알림
   */
  private notifyProgress(result: InitializationStepResult): void {
    if (this.options.onProgress) {
      this.options.onProgress(result);
    }
  }
}

/**
 * InitializationChain 인스턴스 생성 함수
 */
export function createInitializationChain(options: InitializationOptions): InitializationChain {
  return new InitializationChain(options);
}

