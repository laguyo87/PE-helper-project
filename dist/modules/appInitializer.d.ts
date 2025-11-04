/**
 * 앱 초기화 모듈
 *
 * 이 모듈은 앱의 모든 Manager들을 초기화하고 초기화 순서와 의존성을 관리합니다.
 * TypeScript로 작성되어 타입 안정성을 보장합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { AuthManager } from './authManager.js';
import { DataManager } from './dataManager.js';
import { VisitorManager } from './visitorManager.js';
import { LeagueManager } from './leagueManager.js';
import { TournamentManager } from './tournamentManager.js';
import { PapsManager } from './papsManager.js';
import { ProgressManager } from './progressManager.js';
import { DefaultAppData } from './utils.js';
/**
 * 앱 데이터 구조
 */
export type AppData = DefaultAppData;
/**
 * AppInitializer 설정 옵션
 */
export interface AppInitializerOptions {
    /** DOM 헬퍼 함수 */
    $: (selector: string) => HTMLElement | null;
    /** DOM 헬퍼 함수 (여러 요소) */
    $$: (selector: string) => NodeListOf<Element>;
    /** 버전 체크 함수 */
    checkVersion: () => void;
    /** 데이터 로드 함수 */
    loadDataFromFirestore: () => Promise<void>;
    /** 데이터 저장 함수 */
    saveDataToFirestore: () => Promise<void>;
    /** Progress 데이터 저장 함수 */
    saveProgressData: () => Promise<void>;
    /** 사이드바 정리 함수 */
    cleanupSidebar: () => void;
    /** UI 초기화 함수 */
    initializeUI: () => void;
}
/**
 * 초기화된 Manager들
 */
export interface InitializedManagers {
    versionManager: boolean | null;
    authManager: AuthManager | null;
    dataManager: DataManager | null;
    visitorManager: VisitorManager | null;
    leagueManager: LeagueManager | null;
    tournamentManager: TournamentManager | null;
    papsManager: PapsManager | null;
    progressManager: ProgressManager | null;
}
/**
 * 앱 초기화 클래스
 */
export declare class AppInitializer {
    private options;
    private managers;
    private initialized;
    constructor(options: AppInitializerOptions);
    /**
     * 앱 초기화 실행
     */
    initialize(initialData: AppData): Promise<InitializedManagers>;
    /**
     * Sentry 초기화
     */
    private initializeSentry;
    /**
     * 버전 관리자 초기화
     */
    private initializeVersionManager;
    /**
     * 인증 관리자 초기화
     */
    private initializeAuthManager;
    /**
     * 데이터 관리자 초기화
     */
    private initializeDataManager;
    /**
     * AuthManager와 DataManager 연결
     */
    private connectAuthAndData;
    /**
     * 방문자 관리자 초기화
     */
    private initializeVisitorManager;
    /**
     * 리그 관리자 초기화
     */
    private initializeLeagueManager;
    /**
     * 토너먼트 관리자 초기화
     */
    private initializeTournamentManager;
    /**
     * PAPS 관리자 초기화
     */
    private initializePapsManager;
    /**
     * ProgressManager 초기화
     */
    private initializeProgressManager;
    /**
     * 초기화된 Manager들 반환
     */
    getManagers(): InitializedManagers;
    /**
     * 초기화 상태 확인
     */
    isInitialized(): boolean;
}
/**
 * AppInitializer 인스턴스 생성 함수
 */
export declare function createAppInitializer(options: AppInitializerOptions): AppInitializer;
//# sourceMappingURL=appInitializer.d.ts.map