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
import { AllManagers, VersionManagerType, AuthManager, DataManager, VisitorManager, LeagueManager, TournamentManager, PapsManager, ProgressManager } from './managerTypes.js';

// ========================================
// 타입 정의
// ========================================

/**
 * 앱 컨텍스트 - 모든 Manager 인스턴스를 포함
 */
export interface AppContext {
  // 핵심 인프라
  appInitializer: AppInitializer | null;
  appStateManager: AppStateManager | null;
  dataSyncService: DataSyncService | null;
  uiRenderer: UIRenderer | null;
  shareManager: ShareManager | null;
  
  // 비즈니스 로직 Manager
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

// ========================================
// AppContext 클래스
// ========================================

/**
 * 앱 컨텍스트를 관리하는 클래스 (싱글톤)
 */
export class AppContext {
  private static instance: AppContext | null = null;

  // 핵심 인프라
  public appInitializer: AppInitializer | null = null;
  public appStateManager: AppStateManager | null = null;
  public dataSyncService: DataSyncService | null = null;
  public uiRenderer: UIRenderer | null = null;
  public shareManager: ShareManager | null = null;

  // 비즈니스 로직 Manager
  public versionManager: VersionManagerType = null;
  public authManager: AuthManager | null = null;
  public dataManager: DataManager | null = null;
  public visitorManager: VisitorManager | null = null;
  public leagueManager: LeagueManager | null = null;
  public tournamentManager: TournamentManager | null = null;
  public papsManager: PapsManager | null = null;
  public progressManager: ProgressManager | null = null;

  /**
   * AppContext 인스턴스를 생성합니다.
   * @param options 초기 옵션
   */
  private constructor(options: AppContextOptions = {}) {
    if (options.initialContext) {
      Object.assign(this, options.initialContext);
    }
  }

  /**
   * AppContext 싱글톤 인스턴스를 가져옵니다.
   * @param options 초기 옵션 (첫 생성 시에만 사용)
   * @returns AppContext 인스턴스
   */
  public static getInstance(options: AppContextOptions = {}): AppContext {
    if (!AppContext.instance) {
      AppContext.instance = new AppContext(options);
    }
    return AppContext.instance;
  }

  /**
   * AppContext 인스턴스를 리셋합니다. (테스트 용도)
   */
  public static resetInstance(): void {
    AppContext.instance = null;
  }

  /**
   * 컨텍스트를 업데이트합니다.
   * @param updates 업데이트할 속성들
   */
  public update(updates: Partial<AppContext>): void {
    Object.assign(this, updates);
  }

  /**
   * 특정 Manager를 가져옵니다.
   * @param key Manager 키
   * @returns Manager 인스턴스 또는 null
   */
  public getManager<K extends keyof AppContext>(key: K): AppContext[K] {
    return this[key];
  }

  /**
   * 컨텍스트를 전체 가져옵니다.
   * @returns 현재 컨텍스트
   */
  public getContext(): AppContext {
    return { ...this };
  }

  /**
   * 모든 Manager가 초기화되었는지 확인합니다.
   * @returns 초기화 완료 여부
   */
  public isInitialized(): boolean {
    return !!(
      this.appStateManager &&
      this.appInitializer &&
      this.dataSyncService &&
      this.uiRenderer &&
      this.shareManager
    );
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * AppContext 인스턴스를 가져오거나 생성합니다.
 * @param options 초기 옵션
 * @returns AppContext 인스턴스
 */
export function getAppContext(options: AppContextOptions = {}): AppContext {
  return AppContext.getInstance(options);
}

/**
 * AppContext를 초기화합니다.
 * @param context 초기 컨텍스트 값
 * @returns AppContext 인스턴스
 */
export function initializeAppContext(context: Partial<AppContext>): AppContext {
  const ctx = getAppContext({ initialContext: context });
  ctx.update(context);
  return ctx;
}

// ========================================
// 기본 내보내기
// ========================================

export default AppContext;

