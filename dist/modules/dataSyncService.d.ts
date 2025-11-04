/**
 * 데이터 동기화 서비스 모듈
 *
 * 이 모듈은 Firestore와 로컬 스토리지 간의 데이터 동기화를 담당합니다.
 * 데이터 로드, 저장, 동기화 로직을 통합하여 관리합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { DataManager } from './dataManager.js';
import { AuthManager } from './authManager.js';
import { AppState, AppStateManager } from './appStateManager.js';
/**
 * 앱 데이터 구조
 */
export interface AppData {
    leagues?: any;
    tournaments?: any;
    paps?: any;
    progress?: {
        classes?: any[];
        selectedClassId?: string | null;
    };
    lastUpdated?: number;
}
/**
 * DataSyncService 설정 옵션
 */
export interface DataSyncServiceOptions {
    /** DataManager 인스턴스 */
    dataManager: DataManager | null;
    /** AuthManager 인스턴스 */
    authManager: AuthManager | null;
    /** AppStateManager 인스턴스 */
    stateManager: AppStateManager | null;
    /** 로컬 스토리지 키 */
    storageKey?: string;
    /** 데이터 로드 시 기본 데이터 제공 함수 */
    getDefaultData?: () => Partial<AppState>;
}
/**
 * 데이터 동기화 결과
 */
export interface SyncResult {
    success: boolean;
    source: 'firestore' | 'local' | 'default';
    error?: Error;
}
/**
 * 데이터 동기화 서비스 클래스
 */
export declare class DataSyncService {
    private dataManager;
    private authManager;
    private stateManager;
    private storageKey;
    private getDefaultData;
    constructor(options: DataSyncServiceOptions);
    /**
     * Firebase 초기화 대기
     */
    private waitForFirebase;
    /**
     * Firestore에서 데이터 로드
     */
    loadFromFirestore(): Promise<SyncResult>;
    /**
     * 로컬 스토리지에서 데이터 로드
     */
    loadFromLocal(): SyncResult;
    /**
     * 기본 데이터 로드
     */
    loadDefault(): SyncResult;
    /**
     * Firestore에 데이터 저장
     */
    saveToFirestore(): Promise<SyncResult>;
    /**
     * 로컬 스토리지에 데이터 저장
     */
    saveToLocal(data?: Partial<AppState>): SyncResult;
    /**
     * 로드된 데이터 처리 및 검증
     */
    private processLoadedData;
    /**
     * DataManager 설정
     */
    setDataManager(dataManager: DataManager | null): void;
    /**
     * AuthManager 설정
     */
    setAuthManager(authManager: AuthManager | null): void;
    /**
     * AppStateManager 설정
     */
    setStateManager(stateManager: AppStateManager | null): void;
    /**
     * 모든 저장소에서 데이터 동기화 (Firestore 우선)
     */
    sync(): Promise<SyncResult>;
}
/**
 * DataSyncService 인스턴스 생성 함수
 */
export declare function createDataSyncService(options: DataSyncServiceOptions): DataSyncService;
//# sourceMappingURL=dataSyncService.d.ts.map