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
import { logger, logWarn, logError } from './logger.js';
// ========================================
// DataManager 클래스
// ========================================
/**
 * 데이터 저장 및 로딩을 관리하는 클래스
 */
export class DataManager {
    /**
     * DataManager 인스턴스를 생성합니다.
     */
    constructor() {
        this.firebase = null;
        this.currentUser = null;
        this.dbDebounceTimer = null;
        this.lastSaveErrorTime = 0;
        this.firebaseReadyHandler = null;
        this.abortController = null;
        // 디바운싱 설정: 네트워크 상태에 따라 동적으로 조정
        this.DEBOUNCE_MS_NORMAL = 1000; // 정상 네트워크: 1000ms
        this.DEBOUNCE_MS_SLOW = 2000; // 느린 네트워크: 2000ms
        this.DEBOUNCE_MS_FAST = 500; // 빠른 네트워크: 500ms
        this.abortController = new AbortController();
        this.initializeFirebase();
    }
    /**
     * Firebase 초기화
     */
    initializeFirebase() {
        if (typeof window !== 'undefined' && window.firebase) {
            this.firebase = window.firebase;
            this.log('Firebase 인스턴스 초기화 완료');
        }
        else {
            this.log('Firebase가 아직 초기화되지 않음, firebaseReady 이벤트 대기');
            this.firebaseReadyHandler = () => {
                if (window.firebase) {
                    this.firebase = window.firebase;
                    this.log('Firebase 인스턴스 지연 초기화 완료');
                }
            };
            window.addEventListener('firebaseReady', this.firebaseReadyHandler, {
                signal: this.abortController?.signal
            });
        }
    }
    /**
     * 네트워크 상태에 따라 최적의 디바운스 시간을 반환합니다.
     * @returns 디바운스 시간 (밀리초)
     */
    getOptimalDebounceTime() {
        // 네트워크 상태 확인
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
            const connection = navigator.connection;
            if (connection) {
                // 느린 네트워크 (2G, 3G)
                if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                    return this.DEBOUNCE_MS_SLOW;
                }
                // 빠른 네트워크 (4G)
                if (connection.effectiveType === '4g') {
                    return this.DEBOUNCE_MS_FAST;
                }
            }
        }
        // 기본값 (정상 네트워크)
        return this.DEBOUNCE_MS_NORMAL;
    }
    /**
     * 디바운스 타이머 정리
     * 메모리 누수 방지를 위해 항상 호출해야 합니다.
     */
    clearDebounceTimer() {
        if (this.dbDebounceTimer !== null) {
            clearTimeout(this.dbDebounceTimer);
            this.dbDebounceTimer = null;
            this.log('[DataManager] 디바운스 타이머 정리 완료');
        }
    }
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 타이머와 이벤트 리스너를 정리합니다.
     */
    cleanup() {
        // 디바운스 타이머 정리
        this.clearDebounceTimer();
        // 이벤트 리스너 정리
        if (this.firebaseReadyHandler) {
            window.removeEventListener('firebaseReady', this.firebaseReadyHandler);
            this.firebaseReadyHandler = null;
        }
        // AbortController로 등록된 이벤트 리스너 정리
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.log('[DataManager] 리소스 정리 완료');
    }
    /**
     * 현재 사용자를 설정합니다.
     * @param user 사용자 정보
     */
    setCurrentUser(user) {
        this.currentUser = user;
        this.log('현재 사용자 설정:', user ? user.email : 'null');
    }
    /**
     * 현재 사용자 정보를 반환합니다.
     * @returns 현재 사용자 정보 또는 null
     */
    getCurrentUser() {
        return this.currentUser;
    }
    /**
     * 데이터를 Firestore에 저장합니다.
     * @param data 저장할 데이터
     * @param options 저장 옵션
     */
    async saveDataToFirestore(data, options = {}) {
        const { retryCount = 0, timeout = 15000, enableLocalBackup = true, skipValidation = false } = options;
        // 저장 전 데이터 검증 (옵션으로 비활성화 가능)
        if (!skipValidation) {
            const validationResult = await this.validateDataBeforeSave(data);
            if (!validationResult.success) {
                this.logWarnLocal('저장 전 데이터 검증 경고:', validationResult.errors);
                // 검증 실패해도 저장은 진행 (데이터 보정 후)
            }
        }
        if (!this.currentUser) {
            this.log('사용자가 로그인되지 않음, 로컬 스토리지에 저장');
            this.saveToLocalStorage(data);
            return;
        }
        if (!this.firebase || !this.firebase.db) {
            // window.firebase에서 Firebase 객체 가져오기 시도
            if (window.firebase) {
                this.firebase = window.firebase;
                this.log('window.firebase에서 Firebase 객체 복원됨');
            }
            else {
                this.logError('Firebase가 초기화되지 않음, 저장 건너뜀');
                return;
            }
        }
        // 디바운스 타이머 정리 (이전 타이머가 있으면 먼저 정리)
        this.clearDebounceTimer();
        // 네트워크 상태에 따라 디바운스 시간 조정
        const debounceMs = this.getOptimalDebounceTime();
        this.dbDebounceTimer = setTimeout(async () => {
            // 타이머가 실행되면 즉시 null로 설정하여 중복 실행 방지
            const timerId = this.dbDebounceTimer;
            this.dbDebounceTimer = null;
            try {
                this.log('Firestore에 데이터 저장 시작, retryCount:', retryCount);
                // 데이터 복사 및 전처리
                const dataToSave = this.prepareDataForSave(data);
                const userDocRef = this.firebase.doc(this.firebase.db, "users", this.currentUser.uid);
                // 타임아웃 설정
                const timeoutPromise = new Promise((_, reject) => {
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
            }
            catch (error) {
                // Firestore 저장 타임아웃은 사용자에게 노출하지 않음 (일시적 네트워크 문제일 수 있음)
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('Firestore 저장 시간 초과') || errorMessage.includes('timeout')) {
                    this.log('Firestore 저장 타임아웃 발생 (재시도 예정)');
                    // 로컬 백업은 수행
                    if (enableLocalBackup) {
                        this.saveToLocalStorage(data);
                    }
                    // 재시도 로직은 handleSaveError에서 처리
                    await this.handleSaveError(error, retryCount, data, options);
                }
                else {
                    await this.handleSaveError(error, retryCount, data, options);
                }
            }
            finally {
                // 타이머 완료 후 항상 null로 설정 (에러 발생 시에도)
                if (this.dbDebounceTimer === timerId) {
                    this.dbDebounceTimer = null;
                }
            }
        }, debounceMs);
    }
    /**
     * Firestore에서 데이터를 로드합니다.
     * @param userId 사용자 ID
     * @param options 로딩 옵션
     * @returns 로드된 데이터 또는 null
     */
    async loadDataFromFirestore(userId, options = {}) {
        const { retryCount = 0, timeout = 10000, enableValidation = true } = options;
        this.log('=== loadDataFromFirestore 호출됨 ===');
        this.log('userId:', userId);
        this.log('retryCount:', retryCount);
        this.showLoader(true);
        try {
            // Firebase 연결 상태 확인 및 초기화 시도
            if (!this.firebase || !this.firebase.db) {
                // window.firebase에서 Firebase 객체 가져오기 시도
                if (window.firebase) {
                    this.firebase = window.firebase;
                    this.log('window.firebase에서 Firebase 객체 복원됨');
                }
                else {
                    throw new Error('Firebase가 초기화되지 않았습니다.');
                }
            }
            this.log('Firebase 연결 상태 확인 완료');
            const userDocRef = this.firebase.doc(this.firebase.db, "users", userId);
            // 타임아웃 설정
            const timeoutPromise = new Promise((_, reject) => {
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
            }
            else {
                this.log('Firestore 문서가 존재하지 않음, 새 사용자로 처리');
                return this.getDefaultData();
            }
        }
        catch (error) {
            return await this.handleLoadError(error, userId, options);
        }
        finally {
            this.showLoader(false);
        }
    }
    /**
     * 로컬 스토리지에 데이터를 저장합니다.
     * @param data 저장할 데이터
     */
    saveToLocalStorage(data) {
        try {
            localStorage.setItem('leagueData', JSON.stringify(data.leagues));
            localStorage.setItem('tournamentData', JSON.stringify(data.tournaments));
            localStorage.setItem('papsData', JSON.stringify(data.paps));
            localStorage.setItem('progressData', JSON.stringify(data.progress));
            this.log('로컬 스토리지 저장 완료');
        }
        catch (error) {
            this.logError('로컬 스토리지 저장 실패:', error);
        }
    }
    /**
     * 로컬 스토리지에서 데이터를 로드합니다.
     * @returns 로드된 데이터 또는 null
     */
    loadFromLocalStorage() {
        try {
            const localLeagueData = localStorage.getItem('leagueData');
            const localTournamentData = localStorage.getItem('tournamentData');
            const localPapsData = localStorage.getItem('papsData');
            const localProgressData = localStorage.getItem('progressData');
            if (!localLeagueData && !localTournamentData && !localPapsData && !localProgressData) {
                this.log('로컬 스토리지에 데이터 없음');
                return null;
            }
            const data = {
                leagues: localLeagueData ? JSON.parse(localLeagueData) : this.getDefaultData().leagues,
                tournaments: localTournamentData ? JSON.parse(localTournamentData) : this.getDefaultData().tournaments,
                paps: localPapsData ? JSON.parse(localPapsData) : this.getDefaultData().paps,
                progress: localProgressData ? JSON.parse(localProgressData) : this.getDefaultData().progress,
                lastUpdated: Date.now()
            };
            this.log('로컬 스토리지에서 데이터 로드됨');
            return data;
        }
        catch (error) {
            this.logError('로컬 스토리지 로드 실패:', error);
            return null;
        }
    }
    /**
     * 폴백 데이터를 로드합니다.
     * @returns 폴백 데이터
     */
    loadFallbackData() {
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
    async loadSharedData(uid, id, mode, view) {
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
            }
            else {
                this.logError('공유 데이터를 찾을 수 없음');
                return null;
            }
        }
        catch (error) {
            this.logError('공유 데이터 로드 실패:', error);
            return null;
        }
    }
    /**
     * 데이터 유효성을 검사합니다.
     * @param data 검사할 데이터
     * @returns 검증 성공 여부
     */
    validateLoadedData(data) {
        this.log('=== 데이터 유효성 검사 시작 ===');
        try {
            // 기본 구조 보장
            const defaultData = this.getDefaultData();
            if (!data.leagues) {
                data.leagues = defaultData.leagues;
            }
            if (!data.tournaments) {
                data.tournaments = defaultData.tournaments;
            }
            if (!data.paps) {
                data.paps = defaultData.paps;
            }
            if (!data.progress) {
                data.progress = defaultData.progress;
            }
            // 배열 검사 및 보정
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
            // Zod 스키마 검증 (동적 import로 처리, 실패해도 기본값 사용)
            // 검증은 경고로만 처리하고 기본값으로 보정
            this.validateWithZod(data).catch(error => {
                this.logWarnLocal('Zod 검증 중 오류 (무시됨):', error);
            });
            this.log('=== 데이터 유효성 검사 완료 ===');
            return true;
        }
        catch (error) {
            this.logError('데이터 검증 중 오류:', error);
            // 검증 실패 시 기본값으로 보정
            const defaultData = this.getDefaultData();
            Object.assign(data, defaultData);
            return false;
        }
    }
    /**
     * Zod를 사용한 데이터 검증 (비동기)
     * @param data 검증할 데이터
     */
    async validateWithZod(data) {
        try {
            const { validatePartial, AppDataSchema } = await import('./validators.js');
            const result = validatePartial(AppDataSchema, data);
            if (!result.success && result.formattedErrors) {
                this.logWarnLocal('데이터 검증 경고:', result.formattedErrors);
            }
        }
        catch (error) {
            // Zod 검증 실패는 경고만 하고 계속 진행
            this.logWarnLocal('Zod 검증 실패 (무시됨):', error);
        }
    }
    /**
     * 저장 전 데이터 검증
     * @param data 검증할 데이터
     * @returns 검증 결과
     */
    async validateDataBeforeSave(data) {
        try {
            const { validateData, AppDataSchema } = await import('./validators.js');
            const result = validateData(AppDataSchema, data);
            return {
                success: result.success,
                errors: result.formattedErrors
            };
        }
        catch (error) {
            this.logWarnLocal('저장 전 검증 중 오류:', error);
            return { success: true }; // 검증 오류는 경고만 하고 저장 계속
        }
    }
    /**
     * 기본 데이터 구조를 반환합니다.
     * @returns 기본 데이터
     */
    getDefaultData() {
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
    prepareDataForSave(data) {
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
            dataToSave.tournaments.tournaments.forEach((t) => {
                if (Array.isArray(t.rounds)) {
                    t.rounds = JSON.stringify(t.rounds);
                }
            });
        }
        // League 학생 이름 길이 검증 및 자동 수정 (50자 초과 시 자동 잘라내기)
        if (dataToSave.leagues && dataToSave.leagues.students) {
            dataToSave.leagues.students.forEach((student) => {
                if (student.name && typeof student.name === 'string' && student.name.length > 50) {
                    this.logWarnLocal(`학생 이름이 50자를 초과하여 자동으로 잘라냄: "${student.name}" -> "${student.name.substring(0, 50)}"`);
                    student.name = student.name.substring(0, 50);
                }
                // ID를 정수로 변환
                if (typeof student.id === 'number' && !Number.isInteger(student.id)) {
                    student.id = Math.floor(student.id);
                }
                if (typeof student.classId === 'number' && !Number.isInteger(student.classId)) {
                    student.classId = Math.floor(student.classId);
                }
            });
        }
        // League 경기 ID 정수 변환
        if (dataToSave.leagues && dataToSave.leagues.games) {
            dataToSave.leagues.games.forEach((game) => {
                if (typeof game.id === 'number' && !Number.isInteger(game.id)) {
                    game.id = Math.floor(game.id);
                }
                if (typeof game.classId === 'number' && !Number.isInteger(game.classId)) {
                    game.classId = Math.floor(game.classId);
                }
                if (typeof game.player1Id === 'number' && !Number.isInteger(game.player1Id)) {
                    game.player1Id = Math.floor(game.player1Id);
                }
                if (typeof game.player2Id === 'number' && !Number.isInteger(game.player2Id)) {
                    game.player2Id = Math.floor(game.player2Id);
                }
            });
        }
        // League 클래스 ID 정수 변환
        if (dataToSave.leagues && dataToSave.leagues.classes) {
            dataToSave.leagues.classes.forEach((cls) => {
                if (typeof cls.id === 'number' && !Number.isInteger(cls.id)) {
                    cls.id = Math.floor(cls.id);
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
    processLoadedData(data) {
        const processedData = {
            leagues: data.leagues || this.getDefaultData().leagues,
            tournaments: data.tournaments || this.getDefaultData().tournaments,
            paps: data.paps || this.getDefaultData().paps,
            progress: data.progress || this.getDefaultData().progress,
            lastUpdated: data.lastUpdated || Date.now()
        };
        // 토너먼트 라운드 데이터를 JSON 객체로 변환
        if (processedData.tournaments.tournaments) {
            processedData.tournaments.tournaments.forEach((t) => {
                if (t.rounds && typeof t.rounds === 'string') {
                    try {
                        t.rounds = JSON.parse(t.rounds);
                    }
                    catch (e) {
                        this.logError("Rounds parsing error:", e);
                        t.rounds = [];
                    }
                }
                else if (t.rounds === undefined) {
                    t.rounds = [];
                }
            });
        }
        // League games 데이터 타입 변환 및 기본값 설정
        if (processedData.leagues && processedData.leagues.games) {
            processedData.leagues.games.forEach((game) => {
                // float를 integer로 변환
                if (typeof game.id === 'number' && !Number.isInteger(game.id)) {
                    game.id = Math.floor(game.id);
                }
                if (typeof game.classId === 'number' && !Number.isInteger(game.classId)) {
                    game.classId = Math.floor(game.classId);
                }
                if (typeof game.player1Id === 'number' && !Number.isInteger(game.player1Id)) {
                    game.player1Id = Math.floor(game.player1Id);
                }
                if (typeof game.player2Id === 'number' && !Number.isInteger(game.player2Id)) {
                    game.player2Id = Math.floor(game.player2Id);
                }
                // completedAt이 없으면 null로 설정 (필수 필드이지만 nullable)
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
                    // 학생 이름 길이 검증 및 자동 수정 (50자 초과 시 자동 잘라내기)
                    if (student.name && typeof student.name === 'string' && student.name.length > 50) {
                        this.logWarnLocal(`학생 이름이 50자를 초과하여 자동으로 잘라냄: "${student.name}" -> "${student.name.substring(0, 50)}"`);
                        student.name = student.name.substring(0, 50);
                    }
                });
            }
        }
        // PAPS 데이터 타입 변환
        if (processedData.paps && processedData.paps.classes) {
            processedData.paps.classes.forEach((cls) => {
                // class id를 integer로 변환
                if (typeof cls.id === 'number' && !Number.isInteger(cls.id)) {
                    cls.id = Math.floor(cls.id);
                }
                // students 처리
                if (cls.students && Array.isArray(cls.students)) {
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
    async handleSaveError(error, retryCount, data, options) {
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
    async handleLoadError(error, userId, options) {
        // 개발 환경 확인
        const isDevelopment = typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        // 권한 에러 확인
        const isPermissionError = error?.code === 'permission-denied' ||
            error?.message?.includes('Missing or insufficient permissions') ||
            error?.message?.includes('permission-denied');
        // 개발 환경에서 권한 에러는 조용히 처리 (로그인하지 않은 상태는 정상)
        if (isDevelopment && isPermissionError) {
            logger.debug('[DataManager] Firestore 권한 없음 (개발 환경, 로컬 스토리지 사용)');
            return this.loadFallbackData();
        }
        // 그 외 에러는 상세 로깅
        this.logError("Firestore 로드 실패:", error);
        if (!isPermissionError) {
            this.logError("오류 상세:", error.message);
            this.logError("오류 코드:", error.code);
        }
        // 재시도 로직 (최대 3회, 권한 에러는 재시도하지 않음)
        if (!isPermissionError && options.retryCount && options.retryCount < 3) {
            this.log(`데이터 로드 재시도 중... (${options.retryCount + 1}/3)`);
            setTimeout(() => {
                this.loadDataFromFirestore(userId, { ...options, retryCount: options.retryCount + 1 });
            }, 2000 * (options.retryCount + 1));
            return null;
        }
        // 최종 실패 시 폴백 데이터 사용
        if (!isPermissionError) {
            this.logError('데이터 로드 최종 실패, 폴백 데이터 사용');
        }
        else {
            logger.debug('[DataManager] 권한 없음, 폴백 데이터 사용');
        }
        return this.loadFallbackData();
    }
    /**
     * Firebase 오류 메시지를 가져옵니다.
     * @param error 오류 객체
     * @returns 사용자 친화적 오류 메시지
     */
    getFirebaseErrorMessage(error) {
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
    showLoader(show) {
        const loader = document.getElementById('loader');
        if (loader) {
            if (show) {
                loader.classList.remove('hidden');
            }
            else {
                loader.classList.add('hidden');
            }
        }
    }
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    log(message, ...args) {
        logger.debug(`[DataManager] ${message}`, ...args);
    }
    /**
     * 경고 로그를 출력합니다.
     * @param message 경고 메시지
     * @param args 추가 인수
     */
    logWarnLocal(message, ...args) {
        logWarn(`[DataManager] ${message}`, ...args);
    }
    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    logError(message, ...args) {
        // Firestore 타임아웃이나 일시적 네트워크 에러는 로그 레벨 낮춤
        const errorDetails = args.length > 0 ? (args[0] instanceof Error ? args[0].message : String(args[0] || '')) : '';
        if (errorDetails.includes('시간 초과') ||
            errorDetails.includes('timeout') ||
            errorDetails.includes('400') ||
            errorDetails.includes('Failed to load resource')) {
            // 개발 환경에서만 로그 출력 (프로덕션에서는 조용히 처리)
            // 하지만 브라우저 환경에서는 항상 조용히 처리
            return;
        }
        logError(`[DataManager] ${message}`, ...args);
    }
}
// ========================================
// 팩토리 함수
// ========================================
/**
 * DataManager 인스턴스를 생성합니다.
 * @returns DataManager 인스턴스
 */
export function initializeDataManager() {
    return new DataManager();
}
// ========================================
// 기본 내보내기
// ========================================
export default DataManager;
//# sourceMappingURL=dataManager.js.map