/**
 * 앱 상태 관리 모듈
 * 
 * 이 모듈은 앱의 모든 전역 상태를 중앙에서 관리하고,
 * 상태 변경 시 자동으로 동기화 및 저장을 수행합니다.
 * TypeScript로 작성되어 타입 안정성을 보장합니다.
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

import { LeagueData } from './leagueManager.js';
import { PapsData } from './papsManager.js';
import { logger, logError } from './logger.js';

// ========================================
// 타입 정의
// ========================================

// TournamentData는 tournamentManager에서 import
// TournamentManager의 Tournament.id가 string이므로, activeTournamentId도 string 사용
import { TournamentData } from './tournamentManager.js';

// 재export (다른 모듈에서 사용)
export type { TournamentData };

// ProgressData는 progressManager에서 import
import type { ProgressClass } from './progressManager.js';

// ProgressData 타입 정의
export interface ProgressData {
  classes: ProgressClass[];
  selectedClassId: string | null;
}

/**
 * 앱 전체 상태 구조
 */
export interface AppState {
  leagues: LeagueData;
  tournaments: TournamentData;
  paps: PapsData;
  progress: ProgressData;
}

/**
 * 상태 변경 콜백 함수 타입
 */
export type StateChangeCallback<T = unknown> = (newState: T, oldState: T) => void;

/**
 * 저장 콜백 함수 타입
 */
export type SaveCallback = () => Promise<void>;

/**
 * AppStateManager 설정 옵션
 */
export interface AppStateManagerOptions {
  /** 상태 변경 시 자동 저장 여부 */
  autoSave?: boolean;
  /** 저장 콜백 함수 */
  saveCallback?: SaveCallback;
  /** 상태 변경 시 호출될 콜백들 */
  onChangeCallbacks?: {
    leagues?: StateChangeCallback<LeagueData>;
    tournaments?: StateChangeCallback<TournamentData>;
    paps?: StateChangeCallback<PapsData>;
    progress?: StateChangeCallback<ProgressData>;
  };
}

// ========================================
// AppStateManager 클래스
// ========================================

/**
 * 앱 상태를 중앙에서 관리하는 클래스
 */
export class AppStateManager {
  private state: AppState;
  private options: AppStateManagerOptions;
  private onChangeCallbacks: Map<string, StateChangeCallback[]> = new Map();
  private saveTimeout: number | null = null;
  private readonly SAVE_DEBOUNCE_MS = 500; // 500ms 디바운스
  private historyStack: AppState[] = []; // 실행 취소를 위한 히스토리 스택
  private readonly MAX_HISTORY_SIZE = 50; // 최대 히스토리 크기
  private isUndoing = false; // 실행 취소 중인지 여부 (무한 루프 방지)

  /**
   * 현재 상태를 히스토리에 저장
   */
  private saveToHistory(): void {
    // 현재 상태를 깊은 복사하여 히스토리에 저장
    const stateCopy = JSON.parse(JSON.stringify(this.state));
    this.historyStack.push(stateCopy);
    
    // 히스토리 크기 제한
    if (this.historyStack.length > this.MAX_HISTORY_SIZE) {
      this.historyStack.shift(); // 가장 오래된 항목 제거
    }
  }

  /**
   * 실행 취소 (이전 상태로 복원)
   * @returns 성공 여부
   */
  public undo(): boolean {
    if (this.historyStack.length === 0) {
      return false; // 히스토리가 없음
    }

    // 실행 취소 플래그 설정 (무한 루프 방지)
    this.isUndoing = true;

    try {
      // 히스토리에서 이전 상태 가져오기
      const previousState = this.historyStack.pop()!;
      
      // 현재 상태를 이전 상태로 복원
      const oldState = { ...this.state };
      this.state = previousState;
      
      // 모든 변경사항 notify
      this.notify('leagues', this.state.leagues, oldState.leagues);
      this.notify('tournaments', this.state.tournaments, oldState.tournaments);
      this.notify('paps', this.state.paps, oldState.paps);
      this.notify('progress', this.state.progress, oldState.progress);
      
      // 저장
      this.scheduleSave();
      
      return true;
    } finally {
      // 실행 취소 플래그 해제
      this.isUndoing = false;
    }
  }

  /**
   * 실행 취소 가능 여부 확인
   */
  public canUndo(): boolean {
    return this.historyStack.length > 0;
  }

  /**
   * 리소스 정리 (메모리 누수 방지)
   * 타이머를 정리합니다.
   */
  public cleanup(): void {
    // 저장 타이머 정리
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
      logger.debug('[AppStateManager] 저장 타이머 정리 완료');
    }
    
    // 콜백 목록 정리
    this.onChangeCallbacks.clear();
    
    // 히스토리 정리
    this.historyStack = [];
    
    logger.debug('[AppStateManager] 리소스 정리 완료');
  }

  constructor(initialState?: Partial<AppState>, options: AppStateManagerOptions = {}) {
    // 기본 상태 초기화
    this.state = {
      leagues: initialState?.leagues || {
        classes: [],
        students: [],
        games: [],
        selectedClassId: null
      },
      tournaments: initialState?.tournaments || {
        tournaments: [],
        activeTournamentId: null
      },
      paps: initialState?.paps || {
        classes: [],
        activeClassId: null
      },
      progress: initialState?.progress || {
        classes: [],
        selectedClassId: null
      }
    };

    this.options = {
      autoSave: true,
      ...options
    };

    // 옵션에서 제공된 콜백들을 등록
    if (this.options.onChangeCallbacks) {
      if (this.options.onChangeCallbacks.leagues) {
        this.subscribe('leagues', this.options.onChangeCallbacks.leagues);
      }
      if (this.options.onChangeCallbacks.tournaments) {
        this.subscribe('tournaments', this.options.onChangeCallbacks.tournaments);
      }
      if (this.options.onChangeCallbacks.paps) {
        this.subscribe('paps', this.options.onChangeCallbacks.paps);
      }
      if (this.options.onChangeCallbacks.progress) {
        this.subscribe('progress', this.options.onChangeCallbacks.progress);
      }
    }
  }

  /**
   * 전체 상태 반환
   */
  public getState(): AppState {
    return { ...this.state };
  }

  /**
   * 리그 데이터 반환
   */
  public getLeagues(): LeagueData {
    return { ...this.state.leagues };
  }

  /**
   * 토너먼트 데이터 반환
   */
  public getTournaments(): TournamentData {
    return { ...this.state.tournaments };
  }

  /**
   * PAPS 데이터 반환
   */
  public getPaps(): PapsData {
    return { ...this.state.paps };
  }

  /**
   * Progress 데이터 반환
   */
  public getProgress(): ProgressData {
    return { ...this.state.progress };
  }

  /**
   * 리그 데이터 설정
   */
  public setLeagues(leagues: LeagueData): void {
    const oldState = { ...this.state.leagues };
    // 실행 취소 중이 아니면 히스토리에 저장
    if (!this.isUndoing) {
      this.saveToHistory();
    }
    this.state.leagues = { ...leagues };
    this.notify('leagues', this.state.leagues, oldState);
    this.scheduleSave();
  }

  /**
   * 토너먼트 데이터 설정
   */
  public setTournaments(tournaments: TournamentData): void {
    const oldState = { ...this.state.tournaments };
    // 실행 취소 중이 아니면 히스토리에 저장
    if (!this.isUndoing) {
      this.saveToHistory();
    }
    this.state.tournaments = { ...tournaments };
    this.notify('tournaments', this.state.tournaments, oldState);
    this.scheduleSave();
  }

  /**
   * PAPS 데이터 설정
   */
  public setPaps(paps: PapsData): void {
    const oldState = { ...this.state.paps };
    // 실행 취소 중이 아니면 히스토리에 저장
    if (!this.isUndoing) {
      this.saveToHistory();
    }
    this.state.paps = { ...paps };
    this.notify('paps', this.state.paps, oldState);
    this.scheduleSave();
  }

  /**
   * Progress 데이터 설정
   */
  public setProgress(progress: ProgressData): void {
    const oldState = { ...this.state.progress };
    // 실행 취소 중이 아니면 히스토리에 저장
    if (!this.isUndoing) {
      this.saveToHistory();
    }
    this.state.progress = { ...progress };
    this.notify('progress', this.state.progress, oldState);
    this.scheduleSave();
  }

  /**
   * 전체 상태 일괄 설정
   */
  public setState(newState: Partial<AppState>): void {
    const oldLeagues = { ...this.state.leagues };
    const oldTournaments = { ...this.state.tournaments };
    const oldPaps = { ...this.state.paps };
    const oldProgress = { ...this.state.progress };

    // 실행 취소 중이 아니면 히스토리에 저장
    if (!this.isUndoing) {
      this.saveToHistory();
    }

    if (newState.leagues !== undefined) {
      this.state.leagues = { ...newState.leagues };
    }
    if (newState.tournaments !== undefined) {
      this.state.tournaments = { ...newState.tournaments };
    }
    if (newState.paps !== undefined) {
      this.state.paps = { ...newState.paps };
    }
    if (newState.progress !== undefined) {
      this.state.progress = { ...newState.progress };
    }

    // 각 상태 변경 알림
    if (newState.leagues !== undefined) {
      this.notify('leagues', this.state.leagues, oldLeagues);
    }
    if (newState.tournaments !== undefined) {
      this.notify('tournaments', this.state.tournaments, oldTournaments);
    }
    if (newState.paps !== undefined) {
      this.notify('paps', this.state.paps, oldPaps);
    }
    if (newState.progress !== undefined) {
      this.notify('progress', this.state.progress, oldProgress);
    }

    this.scheduleSave();
  }

  /**
   * 상태 변경 구독
   */
  public subscribe<T extends keyof AppState>(
    stateKey: T,
    callback: StateChangeCallback<AppState[T]>
  ): () => void {
    const key = String(stateKey);
    if (!this.onChangeCallbacks.has(key)) {
      this.onChangeCallbacks.set(key, []);
    }
    this.onChangeCallbacks.get(key)!.push(callback as StateChangeCallback);

    // 구독 해제 함수 반환
    return () => {
      const callbacks = this.onChangeCallbacks.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback as StateChangeCallback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * 상태 변경 알림
   */
  private notify<T extends keyof AppState>(
    stateKey: T,
    newState: AppState[T],
    oldState: AppState[T]
  ): void {
    const key = String(stateKey);
    const callbacks = this.onChangeCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newState, oldState);
        } catch (error) {
          logError(`State change callback error for ${key}:`, error);
        }
      });
    }
  }

  /**
   * 저장 스케줄링 (디바운스)
   */
  private scheduleSave(): void {
    if (!this.options.autoSave || !this.options.saveCallback) {
      return;
    }

    // 기존 타이머 취소 (중복 방지)
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    // 새 타이머 설정
    this.saveTimeout = window.setTimeout(() => {
      // 타이머가 실행되면 즉시 null로 설정하여 중복 실행 방지
      const timerId = this.saveTimeout;
      this.saveTimeout = null;
      
      if (this.options.saveCallback) {
        this.options.saveCallback().catch(error => {
          logError('[AppStateManager] Auto-save failed:', error);
        });
      }
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * 즉시 저장 (디바운스 없이)
   */
  public async saveImmediate(): Promise<void> {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    if (this.options.saveCallback) {
      await this.options.saveCallback();
    }
  }

  /**
   * 저장 콜백 설정
   */
  public setSaveCallback(callback: SaveCallback): void {
    this.options.saveCallback = callback;
  }

  /**
   * 자동 저장 활성화/비활성화
   */
  public setAutoSave(enabled: boolean): void {
    this.options.autoSave = enabled;
  }

  /**
   * 상태 초기화
   */
  public reset(newState?: Partial<AppState>): void {
    const oldState = { ...this.state };
    
    this.state = {
      leagues: newState?.leagues || {
        classes: [],
        students: [],
        games: [],
        selectedClassId: null
      },
      tournaments: newState?.tournaments || {
        tournaments: [],
        activeTournamentId: null
      },
      paps: newState?.paps || {
        classes: [],
        activeClassId: null
      },
      progress: newState?.progress || {
        classes: [],
        selectedClassId: null
      }
    };

    // 모든 상태 변경 알림
    this.notify('leagues', this.state.leagues, oldState.leagues);
    this.notify('tournaments', this.state.tournaments, oldState.tournaments);
    this.notify('paps', this.state.paps, oldState.paps);
    this.notify('progress', this.state.progress, oldState.progress);

    this.scheduleSave();
  }
}

/**
 * AppStateManager 인스턴스 생성 함수
 */
export function createAppStateManager(
  initialState?: Partial<AppState>,
  options?: AppStateManagerOptions
): AppStateManager {
  return new AppStateManager(initialState, options);
}

