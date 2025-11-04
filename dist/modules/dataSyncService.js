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
// ========================================
// DataSyncService 클래스
// ========================================
/**
 * 데이터 동기화 서비스 클래스
 */
export class DataSyncService {
    constructor(options) {
        this.dataManager = options.dataManager;
        this.authManager = options.authManager;
        this.stateManager = options.stateManager;
        this.storageKey = options.storageKey || 'pe_helper_data';
        this.getDefaultData = options.getDefaultData || (() => ({
            leagues: { classes: [], students: [], games: [], selectedClassId: null },
            tournaments: { tournaments: [], activeTournamentId: null },
            paps: { classes: [], activeClassId: null },
            progress: { classes: [], selectedClassId: null }
        }));
    }
    /**
     * Firebase 초기화 대기
     */
    async waitForFirebase(timeout = 10000) {
        return new Promise((resolve) => {
            if (window.firebase && window.firebase.db) {
                resolve(true);
                return;
            }
            const timeoutId = setTimeout(() => {
                window.removeEventListener('firebaseReady', handler);
                console.warn('Firebase 초기화 대기 시간 초과');
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
     * Firestore에서 데이터 로드
     */
    async loadFromFirestore() {
        console.log('=== DataSyncService: Firestore에서 데이터 로드 시작 ===');
        if (!this.dataManager) {
            console.warn('DataManager가 초기화되지 않음, 로컬 스토리지에서 로드');
            console.log('DataManager 초기화 대기 중...');
            // DataManager가 초기화될 때까지 최대 5초 대기
            let retryCount = 0;
            const maxRetries = 50; // 50 * 100ms = 5초
            while (!this.dataManager && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retryCount++;
            }
            if (!this.dataManager) {
                console.warn('DataManager 초기화 대기 시간 초과, 로컬 스토리지에서 로드');
                return this.loadFromLocal();
            }
            console.log('DataManager 초기화 완료, Firestore에서 로드 진행');
        }
        try {
            // Firebase 초기화 대기 (최대 10초)
            const firebaseReady = await this.waitForFirebase(10000);
            if (!firebaseReady || !window.firebase || !window.firebase.db) {
                console.log('Firebase가 초기화되지 않음, 로컬 스토리지에서 로드');
                return this.loadFromLocal();
            }
            // AuthManager의 현재 사용자 가져오기
            const currentUser = this.authManager?.getCurrentUser() || null;
            const userId = currentUser?.uid || 'anonymous';
            console.log('사용자 ID:', userId);
            // Firestore에서 데이터 로드
            const appData = await this.dataManager.loadDataFromFirestore(userId);
            console.log('Firestore에서 데이터 로드 완료:', appData);
            if (appData && typeof appData === 'object' && Object.keys(appData).length > 0) {
                // 데이터 처리 및 검증
                const processedData = this.processLoadedData(appData);
                // AppStateManager에 상태 업데이트
                if (this.stateManager) {
                    this.stateManager.setAutoSave(false);
                    this.stateManager.setState(processedData);
                    this.stateManager.setAutoSave(true);
                }
                // 로컬 스토리지에도 백업 저장
                this.saveToLocal(processedData);
                return {
                    success: true,
                    source: 'firestore'
                };
            }
            else {
                console.log('Firestore에 데이터 없음, 로컬 스토리지에서 로드');
                return this.loadFromLocal();
            }
        }
        catch (error) {
            console.error('Firestore 데이터 로드 실패:', error);
            console.log('로컬 스토리지에서 로드 재시도');
            return this.loadFromLocal();
        }
    }
    /**
     * 로컬 스토리지에서 데이터 로드
     */
    loadFromLocal() {
        console.log('=== DataSyncService: 로컬 스토리지에서 데이터 로드 시작 ===');
        console.log('Storage Key:', this.storageKey);
        try {
            const storedData = localStorage.getItem(this.storageKey);
            console.log('로컬 스토리지 데이터 존재 여부:', !!storedData);
            if (!storedData) {
                console.log('로컬 스토리지에 데이터 없음, 기본 데이터 사용');
                return this.loadDefault();
            }
            const appData = JSON.parse(storedData);
            console.log('로컬 스토리지 데이터 로드 완료:', appData);
            if (appData && Object.keys(appData).length > 0) {
                // 데이터 처리 및 검증
                const processedData = this.processLoadedData(appData);
                // AppStateManager에 상태 업데이트
                if (this.stateManager) {
                    this.stateManager.setAutoSave(false);
                    this.stateManager.setState(processedData);
                    this.stateManager.setAutoSave(true);
                }
                return {
                    success: true,
                    source: 'local'
                };
            }
            else {
                console.log('로컬 스토리지 데이터가 비어있음, 기본 데이터 사용');
                return this.loadDefault();
            }
        }
        catch (error) {
            console.error('로컬 스토리지 데이터 로드 실패:', error);
            return this.loadDefault();
        }
    }
    /**
     * 기본 데이터 로드
     */
    loadDefault() {
        console.log('=== DataSyncService: 기본 데이터 로드 ===');
        try {
            const defaultData = this.getDefaultData();
            // AppStateManager에 상태 업데이트
            if (this.stateManager) {
                this.stateManager.setAutoSave(false);
                this.stateManager.setState(defaultData);
                this.stateManager.setAutoSave(true);
            }
            return {
                success: true,
                source: 'default'
            };
        }
        catch (error) {
            console.error('기본 데이터 로드 실패:', error);
            return {
                success: false,
                source: 'default',
                error
            };
        }
    }
    /**
     * Firestore에 데이터 저장
     */
    async saveToFirestore() {
        console.log('=== DataSyncService: Firestore에 데이터 저장 시작 ===');
        if (!this.dataManager) {
            console.warn('DataManager가 초기화되지 않음, 로컬 스토리지에만 저장');
            return this.saveToLocal();
        }
        try {
            // AppStateManager에서 상태 가져오기
            const state = this.stateManager ? this.stateManager.getState() : null;
            if (!state) {
                console.warn('상태 데이터가 없음, 저장할 데이터 없음');
                return {
                    success: false,
                    source: 'firestore',
                    error: new Error('No state data available')
                };
            }
            // 저장할 데이터 구조 생성 (DataManager의 AppData 형식에 맞춤)
            const data = {
                leagues: state.leagues,
                tournaments: state.tournaments,
                paps: state.paps,
                progress: state.progress,
                lastUpdated: Date.now()
            };
            // Firestore에 저장
            await this.dataManager.saveDataToFirestore(data);
            console.log('Firestore 데이터 저장 완료');
            // 로컬 스토리지에도 백업 저장
            this.saveToLocal(data);
            return {
                success: true,
                source: 'firestore'
            };
        }
        catch (error) {
            console.error('Firestore 데이터 저장 실패:', error);
            // 실패 시 로컬 스토리지에 저장
            this.saveToLocal();
            return {
                success: false,
                source: 'firestore',
                error
            };
        }
    }
    /**
     * 로컬 스토리지에 데이터 저장
     */
    saveToLocal(data) {
        console.log('=== DataSyncService: 로컬 스토리지에 데이터 저장 시작 ===');
        try {
            // 데이터 가져오기 (매개변수 또는 AppStateManager에서)
            const stateData = data || (this.stateManager ? this.stateManager.getState() : null);
            if (!stateData) {
                console.warn('저장할 데이터가 없음');
                return {
                    success: false,
                    source: 'local',
                    error: new Error('No data to save')
                };
            }
            const dataToSave = {
                leagues: stateData.leagues,
                tournaments: stateData.tournaments,
                paps: stateData.paps,
                progress: stateData.progress,
                lastUpdated: Date.now()
            };
            // 통합 키로 저장 (DataSyncService 방식)
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            // 개별 키로도 저장 (DataManager.saveToLocalStorage와 호환성 유지)
            try {
                localStorage.setItem('leagueData', JSON.stringify(dataToSave.leagues || {}));
                localStorage.setItem('tournamentData', JSON.stringify(dataToSave.tournaments || {}));
                localStorage.setItem('papsData', JSON.stringify(dataToSave.paps || {}));
                localStorage.setItem('progressData', JSON.stringify(dataToSave.progress || {}));
            }
            catch (e) {
                console.warn('개별 키 저장 실패 (용량 초과 가능):', e);
            }
            console.log('로컬 스토리지 저장 완료');
            return {
                success: true,
                source: 'local'
            };
        }
        catch (error) {
            console.error('로컬 스토리지 저장 실패:', error);
            return {
                success: false,
                source: 'local',
                error
            };
        }
    }
    /**
     * 로드된 데이터 처리 및 검증
     */
    processLoadedData(appData) {
        // 기본 구조로 데이터 처리
        const processedData = {
            leagues: appData.leagues || { classes: [], students: [], games: [], selectedClassId: null },
            tournaments: appData.tournaments || { tournaments: [], activeTournamentId: null },
            paps: appData.paps || { classes: [], activeClassId: null },
            progress: {
                classes: appData.progress?.classes || [],
                selectedClassId: appData.progress?.selectedClassId || null
            }
        };
        // League games 데이터 타입 변환 및 기본값 설정
        if (processedData.leagues && processedData.leagues.games) {
            processedData.leagues.games.forEach((game) => {
                // float를 integer로 변환
                if (typeof game.id === 'number' && !Number.isInteger(game.id)) {
                    game.id = Math.floor(game.id);
                }
                // completedAt이 없으면 null로 설정
                if (game.completedAt === undefined) {
                    game.completedAt = null;
                }
            });
        }
        // League classes, students의 id를 integer로 변환
        if (processedData.leagues) {
            if (processedData.leagues.classes) {
                processedData.leagues.classes.forEach((cls) => {
                    if (typeof cls.id === 'number' && !Number.isInteger(cls.id)) {
                        cls.id = Math.floor(cls.id);
                    }
                });
            }
            if (processedData.leagues.students) {
                processedData.leagues.students.forEach((student) => {
                    if (typeof student.id === 'number' && !Number.isInteger(student.id)) {
                        student.id = Math.floor(student.id);
                    }
                    if (typeof student.classId === 'number' && !Number.isInteger(student.classId)) {
                        student.classId = Math.floor(student.classId);
                    }
                });
            }
        }
        // PAPS 데이터 구조 검증 및 수정
        if (processedData.paps && processedData.paps.classes) {
            processedData.paps.classes.forEach((cls) => {
                if (!cls.students) {
                    cls.students = [];
                }
                if (!cls.eventSettings) {
                    cls.eventSettings = {};
                }
                if (!cls.gradeLevel) {
                    cls.gradeLevel = '중1';
                }
                // class id를 integer로 변환
                if (typeof cls.id === 'number' && !Number.isInteger(cls.id)) {
                    cls.id = Math.floor(cls.id);
                }
                // students 처리
                cls.students.forEach((student) => {
                    // student id를 integer로 변환
                    if (typeof student.id === 'number' && !Number.isInteger(student.id)) {
                        student.id = Math.floor(student.id);
                    }
                    if (typeof student.number === 'number' && !Number.isInteger(student.number)) {
                        student.number = Math.floor(student.number);
                    }
                    // records의 string 값을 number로 변환
                    if (student.records && typeof student.records === 'object') {
                        const records = {};
                        for (const [key, value] of Object.entries(student.records)) {
                            if (typeof value === 'string') {
                                const numValue = parseFloat(value);
                                records[key] = isNaN(numValue) ? 0 : numValue;
                            }
                            else if (typeof value === 'number') {
                                records[key] = value;
                            }
                            else {
                                records[key] = 0;
                            }
                        }
                        student.records = records;
                    }
                });
            });
        }
        else if (processedData.paps && !processedData.paps.classes) {
            processedData.paps.classes = [];
        }
        return processedData;
    }
    /**
     * DataManager 설정
     */
    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }
    /**
     * AuthManager 설정
     */
    setAuthManager(authManager) {
        this.authManager = authManager;
    }
    /**
     * AppStateManager 설정
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
    }
    /**
     * 모든 저장소에서 데이터 동기화 (Firestore 우선)
     */
    async sync() {
        console.log('=== DataSyncService: 데이터 동기화 시작 ===');
        // Firestore에서 먼저 시도, 실패하면 로컬, 그것도 없으면 기본 데이터
        const result = await this.loadFromFirestore();
        if (result.success) {
            console.log('데이터 동기화 완료:', result.source);
        }
        else {
            console.warn('데이터 동기화 실패, 기본 데이터 사용');
        }
        return result;
    }
}
/**
 * DataSyncService 인스턴스 생성 함수
 */
export function createDataSyncService(options) {
    return new DataSyncService(options);
}
//# sourceMappingURL=dataSyncService.js.map