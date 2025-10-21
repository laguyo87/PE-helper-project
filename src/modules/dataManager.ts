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

// ========================================
// 타입 정의
// ========================================

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
    rounds: any[]; // JSON 문자열로 저장됨
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
}

/**
 * 데이터 로딩 옵션
 */
export interface LoadOptions {
    retryCount?: number;
    timeout?: number;
    enableValidation?: boolean;
}

// ========================================
// DataManager 클래스
// ========================================

/**
 * 데이터 저장 및 로딩을 관리하는 클래스
 */
export class DataManager {
    private firebase: any = null;
    private currentUser: User | null = null;
    private dbDebounceTimer: NodeJS.Timeout | null = null;
    private lastSaveErrorTime: number = 0;

    /**
     * DataManager 인스턴스를 생성합니다.
     */
    constructor() {
        this.initializeFirebase();
    }

    /**
     * Firebase 초기화
     */
    private initializeFirebase(): void {
        if (typeof window !== 'undefined' && (window as any).firebase) {
            this.firebase = (window as any).firebase;
            this.log('Firebase 인스턴스 초기화 완료');
        } else {
            this.log('Firebase가 아직 초기화되지 않음, firebaseReady 이벤트 대기');
            window.addEventListener('firebaseReady', () => {
                if ((window as any).firebase) {
                    this.firebase = (window as any).firebase;
                    this.log('Firebase 인스턴스 지연 초기화 완료');
                }
            });
        }
    }

    /**
     * 현재 사용자를 설정합니다.
     * @param user 사용자 정보
     */
    setCurrentUser(user: User | null): void {
        this.currentUser = user;
        this.log('현재 사용자 설정:', user ? user.email : 'null');
    }

    /**
     * 현재 사용자 정보를 반환합니다.
     * @returns 현재 사용자 정보 또는 null
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * 데이터를 Firestore에 저장합니다.
     * @param data 저장할 데이터
     * @param options 저장 옵션
     */
    async saveDataToFirestore(
        data: AppData, 
        options: SaveOptions = {}
    ): Promise<void> {
        const { retryCount = 0, timeout = 15000, enableLocalBackup = true } = options;

        if (!this.currentUser) {
            this.log('사용자가 로그인되지 않음, 로컬 스토리지에 저장');
            this.saveToLocalStorage(data);
            return;
        }

        if (!this.firebase || !this.firebase.db) {
            // window.firebase에서 Firebase 객체 가져오기 시도
            if ((window as any).firebase) {
                this.firebase = (window as any).firebase;
                this.log('window.firebase에서 Firebase 객체 복원됨');
            } else {
                this.logError('Firebase가 초기화되지 않음, 저장 건너뜀');
                return;
            }
        }

        // 디바운스 타이머 정리
        if (this.dbDebounceTimer) {
            clearTimeout(this.dbDebounceTimer);
        }

        this.dbDebounceTimer = setTimeout(async () => {
            try {
                this.log('Firestore에 데이터 저장 시작, retryCount:', retryCount);

                // 데이터 복사 및 전처리
                const dataToSave = this.prepareDataForSave(data);

                const userDocRef = this.firebase.doc(this.firebase.db, "users", this.currentUser!.uid);

                // 타임아웃 설정
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Firestore 저장 시간 초과')), timeout);
                });

                await Promise.race([
                    this.firebase.setDoc(userDocRef, dataToSave, { merge: true }),
                    timeoutPromise
                ]);

                this.log('Firestore 데이터 저장 성공');

                // 로컬 스토리지 백업
                if (enableLocalBackup) {
                    this.saveToLocalStorage(data);
                }

            } catch (error) {
                await this.handleSaveError(error, retryCount, data, options);
            }
        }, 1000);
    }

    /**
     * Firestore에서 데이터를 로드합니다.
     * @param userId 사용자 ID
     * @param options 로딩 옵션
     * @returns 로드된 데이터 또는 null
     */
    async loadDataFromFirestore(
        userId: string, 
        options: LoadOptions = {}
    ): Promise<AppData | null> {
        const { retryCount = 0, timeout = 10000, enableValidation = true } = options;

        this.log('=== loadDataFromFirestore 호출됨 ===');
        this.log('userId:', userId);
        this.log('retryCount:', retryCount);

        this.showLoader(true);

        try {
            // Firebase 연결 상태 확인 및 초기화 시도
            if (!this.firebase || !this.firebase.db) {
                // window.firebase에서 Firebase 객체 가져오기 시도
                if ((window as any).firebase) {
                    this.firebase = (window as any).firebase;
                    this.log('window.firebase에서 Firebase 객체 복원됨');
                } else {
                    throw new Error('Firebase가 초기화되지 않았습니다.');
                }
            }

            this.log('Firebase 연결 상태 확인 완료');
            const userDocRef = this.firebase.doc(this.firebase.db, "users", userId);

            // 타임아웃 설정
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Firestore 요청 시간 초과')), timeout);
            });

            this.log('Firestore getDoc 요청 시작...');
            const docSnap = await Promise.race([
                this.firebase.getDoc(userDocRef),
                timeoutPromise
            ]);

            this.log('=== Firestore 응답 받음 ===');
            this.log('docSnap.exists():', docSnap.exists());

            if (docSnap.exists()) {
                const data = docSnap.data();
                const processedData = this.processLoadedData(data);

                if (enableValidation) {
                    this.validateLoadedData(processedData);
                }

                this.log('=== 데이터 로드 완료 ===');
                return processedData;
            } else {
                this.log('Firestore 문서가 존재하지 않음, 새 사용자로 처리');
                return this.getDefaultData();
            }

        } catch (error) {
            return await this.handleLoadError(error, userId, options);
        } finally {
            this.showLoader(false);
        }
    }

    /**
     * 로컬 스토리지에 데이터를 저장합니다.
     * @param data 저장할 데이터
     */
    saveToLocalStorage(data: AppData): void {
        try {
            localStorage.setItem('leagueData', JSON.stringify(data.leagues));
            localStorage.setItem('tournamentData', JSON.stringify(data.tournaments));
            localStorage.setItem('papsData', JSON.stringify(data.paps));
            localStorage.setItem('progressData', JSON.stringify(data.progress));
            this.log('로컬 스토리지 저장 완료');
        } catch (error) {
            this.logError('로컬 스토리지 저장 실패:', error);
        }
    }

    /**
     * 로컬 스토리지에서 데이터를 로드합니다.
     * @returns 로드된 데이터 또는 null
     */
    loadFromLocalStorage(): AppData | null {
        try {
            const localLeagueData = localStorage.getItem('leagueData');
            const localTournamentData = localStorage.getItem('tournamentData');
            const localPapsData = localStorage.getItem('papsData');
            const localProgressData = localStorage.getItem('progressData');

            if (!localLeagueData && !localTournamentData && !localPapsData && !localProgressData) {
                this.log('로컬 스토리지에 데이터 없음');
                return null;
            }

            const data: AppData = {
                leagues: localLeagueData ? JSON.parse(localLeagueData) : this.getDefaultData().leagues,
                tournaments: localTournamentData ? JSON.parse(localTournamentData) : this.getDefaultData().tournaments,
                paps: localPapsData ? JSON.parse(localPapsData) : this.getDefaultData().paps,
                progress: localProgressData ? JSON.parse(localProgressData) : this.getDefaultData().progress,
                lastUpdated: Date.now()
            };

            this.log('로컬 스토리지에서 데이터 로드됨');
            return data;
        } catch (error) {
            this.logError('로컬 스토리지 로드 실패:', error);
            return null;
        }
    }

    /**
     * 폴백 데이터를 로드합니다.
     * @returns 폴백 데이터
     */
    loadFallbackData(): AppData {
        this.log('=== 폴백 데이터 로딩 시작 ===');
        
        const data = this.loadFromLocalStorage();
        if (data) {
            this.log('=== 폴백 데이터 로딩 완료 ===');
            return data;
        }

        this.log('로컬 스토리지에 데이터 없음, 기본 데이터 사용');
        return this.getDefaultData();
    }

    /**
     * 공유 데이터를 로드합니다.
     * @param uid 사용자 ID
     * @param id 공유 ID
     * @param mode 모드
     * @param view 뷰 타입
     * @returns 공유 데이터 또는 null
     */
    async loadSharedData(
        uid: string, 
        id: string, 
        mode: string, 
        view: string
    ): Promise<AppData | null> {
        this.log('=== 공유 데이터 로딩 시작 ===');
        this.log('uid:', uid, 'id:', id, 'mode:', mode, 'view:', view);

        if (!this.firebase || !this.firebase.db) {
            this.logError('Firebase가 초기화되지 않음');
            return null;
        }

        try {
            const shareDocRef = this.firebase.doc(this.firebase.db, "shares", `${uid}_${id}_${mode}_${view}`);
            const docSnap = await this.firebase.getDoc(shareDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                this.log('공유 데이터 로드 성공');
                return this.processLoadedData(data);
            } else {
                this.logError('공유 데이터를 찾을 수 없음');
                return null;
            }
        } catch (error) {
            this.logError('공유 데이터 로드 실패:', error);
            return null;
        }
    }

    /**
     * 데이터 유효성을 검사합니다.
     * @param data 검사할 데이터
     */
    validateLoadedData(data: AppData): void {
        this.log('=== 데이터 유효성 검사 시작 ===');

        // 기본 구조 검사
        if (!data.leagues) {
            data.leagues = this.getDefaultData().leagues;
        }
        if (!data.tournaments) {
            data.tournaments = this.getDefaultData().tournaments;
        }
        if (!data.paps) {
            data.paps = this.getDefaultData().paps;
        }
        if (!data.progress) {
            data.progress = this.getDefaultData().progress;
        }

        // 배열 검사
        if (!Array.isArray(data.leagues.classes)) {
            data.leagues.classes = [];
        }
        if (!Array.isArray(data.tournaments.tournaments)) {
            data.tournaments.tournaments = [];
        }
        if (!Array.isArray(data.paps.classes)) {
            data.paps.classes = [];
        }
        if (!Array.isArray(data.progress.classes)) {
            data.progress.classes = [];
        }

        this.log('=== 데이터 유효성 검사 완료 ===');
    }

    /**
     * 기본 데이터 구조를 반환합니다.
     * @returns 기본 데이터
     */
    public getDefaultData(): AppData {
        return {
            leagues: { classes: [], students: [], games: [], selectedClassId: null },
            tournaments: { tournaments: [], activeTournamentId: null },
            paps: { classes: [], activeClassId: null },
            progress: { classes: [], selectedClassId: '' },
            lastUpdated: Date.now()
        };
    }

    /**
     * 저장을 위한 데이터를 준비합니다.
     * @param data 원본 데이터
     * @returns 저장용 데이터
     */
    private prepareDataForSave(data: AppData): any {
        const dataToSave = {
            leagues: JSON.parse(JSON.stringify(data.leagues)),
            tournaments: JSON.parse(JSON.stringify(data.tournaments)),
            paps: JSON.parse(JSON.stringify(data.paps)),
            progress: {
                classes: JSON.parse(JSON.stringify(data.progress.classes)),
                selectedClassId: data.progress.selectedClassId
            },
            lastUpdated: Date.now()
        };

        // 토너먼트 라운드 데이터를 JSON 문자열로 변환
        if (dataToSave.tournaments && dataToSave.tournaments.tournaments) {
            dataToSave.tournaments.tournaments.forEach((t: Tournament) => {
                if (Array.isArray(t.rounds)) {
                    (t as any).rounds = JSON.stringify(t.rounds);
                }
            });
        }

        return dataToSave;
    }

    /**
     * 로드된 데이터를 처리합니다.
     * @param data 원본 데이터
     * @returns 처리된 데이터
     */
    private processLoadedData(data: any): AppData {
        const processedData: AppData = {
            leagues: data.leagues || this.getDefaultData().leagues,
            tournaments: data.tournaments || this.getDefaultData().tournaments,
            paps: data.paps || this.getDefaultData().paps,
            progress: data.progress || this.getDefaultData().progress,
            lastUpdated: data.lastUpdated || Date.now()
        };

        // 토너먼트 라운드 데이터를 JSON 객체로 변환
        if (processedData.tournaments.tournaments) {
            processedData.tournaments.tournaments.forEach((t: Tournament) => {
                if (t.rounds && typeof t.rounds === 'string') {
                    try {
                        t.rounds = JSON.parse(t.rounds);
                    } catch (e) {
                        this.logError("Rounds parsing error:", e);
                        t.rounds = [];
                    }
                } else if (t.rounds === undefined) {
                    t.rounds = [];
                }
            });
        }

        return processedData;
    }

    /**
     * 저장 오류를 처리합니다.
     * @param error 오류 객체
     * @param retryCount 재시도 횟수
     * @param data 저장할 데이터
     * @param options 저장 옵션
     */
    private async handleSaveError(
        error: any, 
        retryCount: number, 
        data: AppData, 
        options: SaveOptions
    ): Promise<void> {
        this.logError("Firestore 저장 실패:", error);
        this.logError("오류 상세:", error.message);
        this.logError("오류 코드:", error.code);

        // 재시도 로직 (최대 3회)
        if (retryCount < 3) {
            this.log(`데이터 저장 재시도 중... (${retryCount + 1}/3)`);
            setTimeout(() => {
                this.saveDataToFirestore(data, { ...options, retryCount: retryCount + 1 });
            }, 2000 * (retryCount + 1)); // 2초, 4초, 6초 간격으로 재시도
            return;
        }

        // 최종 실패 시 사용자에게 알림
        const errorMessage = this.getFirebaseErrorMessage(error);
        this.logError('데이터 저장 최종 실패:', errorMessage);

        // 사용자에게 알림 (너무 자주 알림이 뜨지 않도록 제한)
        if (!this.lastSaveErrorTime || Date.now() - this.lastSaveErrorTime > 30000) {
            alert(`데이터 저장에 실패했습니다: ${errorMessage}\n오프라인 모드로 전환됩니다.`);
            this.lastSaveErrorTime = Date.now();
        }
    }

    /**
     * 로딩 오류를 처리합니다.
     * @param error 오류 객체
     * @param userId 사용자 ID
     * @param options 로딩 옵션
     * @returns 폴백 데이터 또는 null
     */
    private async handleLoadError(
        error: any, 
        userId: string, 
        options: LoadOptions
    ): Promise<AppData | null> {
        this.logError("Firestore 로드 실패:", error);
        this.logError("오류 상세:", error.message);
        this.logError("오류 코드:", error.code);

        // 재시도 로직 (최대 3회)
        if (options.retryCount && options.retryCount < 3) {
            this.log(`데이터 로드 재시도 중... (${options.retryCount + 1}/3)`);
            setTimeout(() => {
                this.loadDataFromFirestore(userId, { ...options, retryCount: options.retryCount! + 1 });
            }, 2000 * (options.retryCount + 1));
            return null;
        }

        // 최종 실패 시 폴백 데이터 사용
        this.logError('데이터 로드 최종 실패, 폴백 데이터 사용');
        return this.loadFallbackData();
    }

    /**
     * Firebase 오류 메시지를 가져옵니다.
     * @param error 오류 객체
     * @returns 사용자 친화적 오류 메시지
     */
    private getFirebaseErrorMessage(error: any): string {
        if (error.code) {
            switch (error.code) {
                case 'permission-denied':
                    return '권한이 없습니다. 로그인을 확인해주세요.';
                case 'unavailable':
                    return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
                case 'deadline-exceeded':
                    return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
                case 'resource-exhausted':
                    return '서버 리소스가 부족합니다. 잠시 후 다시 시도해주세요.';
                case 'unauthenticated':
                    return '인증이 필요합니다. 다시 로그인해주세요.';
                default:
                    return `오류가 발생했습니다: ${error.message}`;
            }
        }
        return error.message || '알 수 없는 오류가 발생했습니다.';
    }

    /**
     * 로더 표시 상태를 설정합니다.
     * @param show 표시 여부
     */
    private showLoader(show: boolean): void {
        const loader = document.getElementById('loader');
        if (loader) {
            if (show) {
                loader.classList.remove('hidden');
            } else {
                loader.classList.add('hidden');
            }
        }
    }

    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    private log(message: string, ...args: any[]): void {
        console.log(`[DataManager] ${message}`, ...args);
    }

    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    private logError(message: string, ...args: any[]): void {
        console.error(`[DataManager] ${message}`, ...args);
    }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * DataManager 인스턴스를 생성합니다.
 * @returns DataManager 인스턴스
 */
export function initializeDataManager(): DataManager {
    return new DataManager();
}

// ========================================
// 기본 내보내기
// ========================================

export default DataManager;
