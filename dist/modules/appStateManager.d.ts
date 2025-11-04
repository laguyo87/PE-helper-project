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
import { TournamentData } from './tournamentManager.js';
export type { TournamentData };
import type { ProgressClass } from './progressManager.js';
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
export type StateChangeCallback<T = any> = (newState: T, oldState: T) => void;
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
/**
 * 앱 상태를 중앙에서 관리하는 클래스
 */
export declare class AppStateManager {
    private state;
    private options;
    private onChangeCallbacks;
    private saveTimeout;
    private readonly SAVE_DEBOUNCE_MS;
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 타이머를 정리합니다.
     */
    cleanup(): void;
    constructor(initialState?: Partial<AppState>, options?: AppStateManagerOptions);
    /**
     * 전체 상태 반환
     */
    getState(): AppState;
    /**
     * 리그 데이터 반환
     */
    getLeagues(): LeagueData;
    /**
     * 토너먼트 데이터 반환
     */
    getTournaments(): TournamentData;
    /**
     * PAPS 데이터 반환
     */
    getPaps(): PapsData;
    /**
     * Progress 데이터 반환
     */
    getProgress(): ProgressData;
    /**
     * 리그 데이터 설정
     */
    setLeagues(leagues: LeagueData): void;
    /**
     * 토너먼트 데이터 설정
     */
    setTournaments(tournaments: TournamentData): void;
    /**
     * PAPS 데이터 설정
     */
    setPaps(paps: PapsData): void;
    /**
     * Progress 데이터 설정
     */
    setProgress(progress: ProgressData): void;
    /**
     * 전체 상태 일괄 설정
     */
    setState(newState: Partial<AppState>): void;
    /**
     * 상태 변경 구독
     */
    subscribe<T extends keyof AppState>(stateKey: T, callback: StateChangeCallback<AppState[T]>): () => void;
    /**
     * 상태 변경 알림
     */
    private notify;
    /**
     * 저장 스케줄링 (디바운스)
     */
    private scheduleSave;
    /**
     * 즉시 저장 (디바운스 없이)
     */
    saveImmediate(): Promise<void>;
    /**
     * 저장 콜백 설정
     */
    setSaveCallback(callback: SaveCallback): void;
    /**
     * 자동 저장 활성화/비활성화
     */
    setAutoSave(enabled: boolean): void;
    /**
     * 상태 초기화
     */
    reset(newState?: Partial<AppState>): void;
}
/**
 * AppStateManager 인스턴스 생성 함수
 */
export declare function createAppStateManager(initialState?: Partial<AppState>, options?: AppStateManagerOptions): AppStateManager;
//# sourceMappingURL=appStateManager.d.ts.map