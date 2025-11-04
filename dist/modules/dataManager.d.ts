/**
 * 데이터 저장 및 로딩 관리 모듈
 *
 * 이 모듈은 애플리케이션의 모든 데이터 저장 및 로딩 기능을 담당합니다.
 * Firebase Firestore와 로컬 스토리지 간의 동기화를 관리하며,
 * 데이터 유효성 검사와 오류 처리를 포함합니다.
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
/**
 * 애플리케이션 데이터 구조
 */
export interface AppData {
    leagues: LeagueData;
    tournaments: TournamentData;
    paps: PapsData;
    progress: ProgressData;
    lastUpdated: number;
}
/**
 * 리그 데이터 구조
 */
export interface LeagueData {
    classes: LeagueClass[];
    students: Student[];
    games: Game[];
    selectedClassId: string | null;
}
/**
 * 토너먼트 데이터 구조
 */
export interface TournamentData {
    tournaments: Tournament[];
    activeTournamentId: string | null;
}
/**
 * PAPS 데이터 구조
 */
export interface PapsData {
    classes: PapsClass[];
    activeClassId: string | null;
}
/**
 * 진도표 데이터 구조
 */
export interface ProgressData {
    classes: ProgressClass[];
    selectedClassId: string;
}
/**
 * 리그 클래스 구조
 */
export interface LeagueClass {
    id: string;
    name: string;
    students: Student[];
    games: Game[];
}
/**
 * 토너먼트 구조
 */
export interface Tournament {
    id: string;
    name: string;
    rounds: any[];
    [key: string]: any;
}
/**
 * PAPS 클래스 구조
 */
export interface PapsClass {
    id: string;
    name: string;
    students: PapsStudent[];
}
/**
 * 진도표 클래스 구조
 */
export interface ProgressClass {
    id: string;
    name: string;
    [key: string]: any;
}
/**
 * 학생 구조
 */
export interface Student {
    id: number;
    number: number;
    name: string;
    gender: string;
    [key: string]: any;
}
/**
 * PAPS 학생 구조
 */
export interface PapsStudent {
    id: number;
    number: number;
    name: string;
    gender: string;
    records: Record<string, any>;
}
/**
 * 게임 구조
 */
export interface Game {
    id: string;
    [key: string]: any;
}
/**
 * 사용자 정보 구조
 */
export interface User {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
}
/**
 * 데이터 저장 옵션
 */
export interface SaveOptions {
    retryCount?: number;
    timeout?: number;
    enableLocalBackup?: boolean;
    skipValidation?: boolean;
}
/**
 * 데이터 로딩 옵션
 */
export interface LoadOptions {
    retryCount?: number;
    timeout?: number;
    enableValidation?: boolean;
}
/**
 * 데이터 저장 및 로딩을 관리하는 클래스
 */
export declare class DataManager {
    private firebase;
    private currentUser;
    private dbDebounceTimer;
    private lastSaveErrorTime;
    private firebaseReadyHandler;
    private abortController;
    /**
     * DataManager 인스턴스를 생성합니다.
     */
    constructor();
    /**
     * Firebase 초기화
     */
    private initializeFirebase;
    /**
     * 디바운스 타이머 정리
     */
    private clearDebounceTimer;
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 타이머와 이벤트 리스너를 정리합니다.
     */
    cleanup(): void;
    /**
     * 현재 사용자를 설정합니다.
     * @param user 사용자 정보
     */
    setCurrentUser(user: User | null): void;
    /**
     * 현재 사용자 정보를 반환합니다.
     * @returns 현재 사용자 정보 또는 null
     */
    getCurrentUser(): User | null;
    /**
     * 데이터를 Firestore에 저장합니다.
     * @param data 저장할 데이터
     * @param options 저장 옵션
     */
    saveDataToFirestore(data: AppData, options?: SaveOptions): Promise<void>;
    /**
     * Firestore에서 데이터를 로드합니다.
     * @param userId 사용자 ID
     * @param options 로딩 옵션
     * @returns 로드된 데이터 또는 null
     */
    loadDataFromFirestore(userId: string, options?: LoadOptions): Promise<AppData | null>;
    /**
     * 로컬 스토리지에 데이터를 저장합니다.
     * @param data 저장할 데이터
     */
    saveToLocalStorage(data: AppData): void;
    /**
     * 로컬 스토리지에서 데이터를 로드합니다.
     * @returns 로드된 데이터 또는 null
     */
    loadFromLocalStorage(): AppData | null;
    /**
     * 폴백 데이터를 로드합니다.
     * @returns 폴백 데이터
     */
    loadFallbackData(): AppData;
    /**
     * 공유 데이터를 로드합니다.
     * @param uid 사용자 ID
     * @param id 공유 ID
     * @param mode 모드
     * @param view 뷰 타입
     * @returns 공유 데이터 또는 null
     */
    loadSharedData(uid: string, id: string, mode: string, view: string): Promise<AppData | null>;
    /**
     * 데이터 유효성을 검사합니다.
     * @param data 검사할 데이터
     * @returns 검증 성공 여부
     */
    validateLoadedData(data: AppData): boolean;
    /**
     * Zod를 사용한 데이터 검증 (비동기)
     * @param data 검증할 데이터
     */
    private validateWithZod;
    /**
     * 저장 전 데이터 검증
     * @param data 검증할 데이터
     * @returns 검증 결과
     */
    private validateDataBeforeSave;
    /**
     * 기본 데이터 구조를 반환합니다.
     * @returns 기본 데이터
     */
    getDefaultData(): AppData;
    /**
     * 저장을 위한 데이터를 준비합니다.
     * @param data 원본 데이터
     * @returns 저장용 데이터
     */
    private prepareDataForSave;
    /**
     * 로드된 데이터를 처리합니다.
     * @param data 원본 데이터
     * @returns 처리된 데이터
     */
    private processLoadedData;
    /**
     * 저장 오류를 처리합니다.
     * @param error 오류 객체
     * @param retryCount 재시도 횟수
     * @param data 저장할 데이터
     * @param options 저장 옵션
     */
    private handleSaveError;
    /**
     * 로딩 오류를 처리합니다.
     * @param error 오류 객체
     * @param userId 사용자 ID
     * @param options 로딩 옵션
     * @returns 폴백 데이터 또는 null
     */
    private handleLoadError;
    /**
     * Firebase 오류 메시지를 가져옵니다.
     * @param error 오류 객체
     * @returns 사용자 친화적 오류 메시지
     */
    private getFirebaseErrorMessage;
    /**
     * 로더 표시 상태를 설정합니다.
     * @param show 표시 여부
     */
    private showLoader;
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    private log;
    /**
     * 경고 로그를 출력합니다.
     * @param message 경고 메시지
     * @param args 추가 인수
     */
    private logWarnLocal;
    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    private logError;
}
/**
 * DataManager 인스턴스를 생성합니다.
 * @returns DataManager 인스턴스
 */
export declare function initializeDataManager(): DataManager;
export default DataManager;
//# sourceMappingURL=dataManager.d.ts.map