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
import { logger, logWarn, logError } from './logger.js';
import { initializeVersionManager } from './versionManager.js';
import { initializeAuthManager, setupGlobalAuthFunctions } from './authManager.js';
import { initializeDataManager } from './dataManager.js';
import { initializeVisitorManager } from './visitorManager.js';
import { LeagueManager } from './leagueManager.js';
import { TournamentManager } from './tournamentManager.js';
import { PapsManager } from './papsManager.js';
import { initializeProgressManager } from './progressManager.js';
import { initSentry, setUser } from './sentry.js';
import { initializeKeyboardNavigation } from './keyboardNavigation.js';
/**
 * 앱 초기화 클래스
 */
export class AppInitializer {
    constructor(options) {
        this.options = options;
        this.managers = {
            versionManager: false,
            authManager: null,
            dataManager: null,
            visitorManager: null,
            leagueManager: null,
            tournamentManager: null,
            papsManager: null,
            progressManager: null
        };
        this.initialized = false;
    }
    /**
     * 앱 초기화 실행
     */
    async initialize(initialData) {
        if (this.initialized) {
            logWarn('앱이 이미 초기화되었습니다.');
            return this.managers;
        }
        logger.debug('=== 앱 초기화 시작 ===');
        try {
            // 0. Sentry 초기화 (가장 먼저 실행)
            this.initializeSentry();
            // 0.5. 키보드 내비게이션 초기화
            initializeKeyboardNavigation();
            // 1. 버전 체크
            this.options.checkVersion();
            // 2. DOM 헬퍼 함수들을 전역으로 설정
            window.$ = this.options.$;
            window.$$ = this.options.$$;
            // 3. 버전 관리자 초기화
            await this.initializeVersionManager();
            // 4. 인증 관리자 초기화
            await this.initializeAuthManager();
            // 5. 데이터 관리자 초기화
            await this.initializeDataManager();
            // 6. AuthManager와 DataManager 연결
            await this.connectAuthAndData();
            // 7. 방문자 관리자 초기화
            await this.initializeVisitorManager();
            // 8. 리그 관리자 초기화
            await this.initializeLeagueManager(initialData.leagues);
            // 9. 토너먼트 관리자 초기화
            await this.initializeTournamentManager(initialData.tournaments);
            // 10. PAPS 관리자 초기화
            await this.initializePapsManager(initialData.paps);
            // 11. ProgressManager 초기화
            await this.initializeProgressManager(initialData.progress.classes, initialData.progress.selectedClassId);
            // 12. 데이터 로드는 DataSyncService 생성 후 main.ts에서 수행
            // (여기서는 건너뜀 - DataSyncService가 아직 생성되지 않았음)
            // 13. UI 초기화
            this.options.initializeUI();
            this.initialized = true;
            logger.debug('=== 앱 초기화 완료 ===');
            return this.managers;
        }
        catch (error) {
            logError('앱 초기화 중 오류:', error);
            throw error;
        }
    }
    /**
     * Sentry 초기화
     */
    initializeSentry() {
        // 환경 변수에서 DSN 가져오기 (window.SENTRY_DSN)
        const dsn = window.SENTRY_DSN;
        const environment = window.NODE_ENV === 'production' ? 'production' : 'development';
        const enabled = dsn && (environment === 'production' || window.ENABLE_SENTRY_DEV === 'true');
        initSentry({
            dsn,
            environment: environment,
            enabled,
            tracesSampleRate: environment === 'production' ? 0.1 : 1.0
        });
    }
    /**
     * 버전 관리자 초기화
     */
    async initializeVersionManager() {
        logger.debug('VersionManager 초기화 시작...');
        try {
            this.managers.versionManager = initializeVersionManager();
            logger.debug('VersionManager 초기화 완료');
        }
        catch (error) {
            logError('VersionManager 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * 인증 관리자 초기화
     */
    async initializeAuthManager() {
        logger.debug('AuthManager 초기화 시작...');
        try {
            this.managers.authManager = initializeAuthManager();
            setupGlobalAuthFunctions();
            logger.debug('AuthManager 초기화 완료');
        }
        catch (error) {
            logError('AuthManager 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * 데이터 관리자 초기화
     */
    async initializeDataManager() {
        logger.debug('DataManager 초기화 시작...');
        try {
            this.managers.dataManager = initializeDataManager();
            logger.debug('DataManager 초기화 완료');
        }
        catch (error) {
            logError('DataManager 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * AuthManager와 DataManager 연결
     */
    async connectAuthAndData() {
        logger.debug('AuthManager와 DataManager 연결 시작...');
        if (!this.managers.authManager || !this.managers.dataManager) {
            logWarn('AuthManager 또는 DataManager가 초기화되지 않아 연결할 수 없습니다.');
            return;
        }
        // 초기 호출인지 확인하는 플래그
        let isInitialCall = true;
        try {
            this.managers.authManager.onAuthStateChange(async (user) => {
                logger.debug('인증 상태 변경됨, DataManager에 사용자 정보 설정:', user);
                this.managers.dataManager?.setCurrentUser(user);
                // Sentry 사용자 컨텍스트 설정
                if (user) {
                    setUser({
                        id: user.uid,
                        email: user.email || undefined,
                        username: user.displayName || user.email || undefined
                    });
                }
                else {
                    setUser(null);
                }
                // 로그인 상태 UI 업데이트 (로그아웃 버튼 이벤트 리스너 포함)
                if (this.managers.authManager) {
                    this.managers.authManager.updateLoginStatus();
                }
                // 인증 상태와 관계없이 항상 앱 화면 표시 (로컬 모드 지원)
                // UIRenderer가 있으면 앱 화면 표시
                const appRoot = document.getElementById('app-root');
                const authContainer = document.getElementById('auth-container');
                if (appRoot && authContainer) {
                    authContainer.classList.add('hidden');
                    appRoot.classList.remove('hidden');
                    logger.debug('앱 화면 표시됨 (인증 상태:', user ? '로그인' : '게스트', ')');
                }
                // 초기 호출인 경우 데이터 로드 건너뛰기 (DataSyncService 초기화가 아직 완료되지 않았을 수 있음)
                if (isInitialCall) {
                    logger.debug('초기 인증 상태 확인 완료, 데이터 로드는 DataSyncService 초기화 후에 수행됩니다.');
                    isInitialCall = false;
                    return;
                }
                // 로그인 성공 시 데이터 다시 로드 (초기 호출 이후의 인증 상태 변경만)
                if (user) {
                    logger.debug('로그인 성공, 데이터 다시 로드 시작');
                    try {
                        if (typeof this.options.loadDataFromFirestore === 'function') {
                            await this.options.loadDataFromFirestore();
                            logger.debug('데이터 재로드 완료');
                        }
                        else {
                            logError('loadDataFromFirestore 함수가 정의되지 않음');
                        }
                    }
                    catch (error) {
                        logError('데이터 재로드 중 오류 발생:', error);
                    }
                }
            });
            logger.debug('AuthManager와 DataManager 연결 완료');
        }
        catch (error) {
            logError('AuthManager와 DataManager 연결 실패:', error);
            throw error;
        }
    }
    /**
     * 방문자 관리자 초기화
     */
    async initializeVisitorManager() {
        logger.debug('=== VisitorManager 초기화 시작 ===');
        try {
            this.managers.visitorManager = initializeVisitorManager();
            logger.debug('VisitorManager 초기화 완료:', this.managers.visitorManager);
            // 방문자 수 업데이트
            if (this.managers.visitorManager) {
                logger.debug('방문자 수 업데이트 시작');
                try {
                    const result = await this.managers.visitorManager.updateVisitorCount();
                    logger.debug('방문자 수 업데이트 결과:', result);
                    // 방문자 수 표시 확인
                    const visitorCountElement = document.querySelector('#visitor-count');
                    logger.debug('방문자 수 요소 찾기:', visitorCountElement);
                    if (visitorCountElement) {
                        logger.debug('현재 방문자 수 요소 값:', visitorCountElement.textContent);
                    }
                }
                catch (error) {
                    logError('방문자 수 업데이트 오류:', error);
                }
            }
            else {
                logError('VisitorManager가 초기화되지 않음');
            }
        }
        catch (error) {
            logError('VisitorManager 초기화 오류:', error);
            throw error;
        }
    }
    /**
     * 리그 관리자 초기화
     */
    async initializeLeagueManager(leagueData) {
        logger.debug('LeagueManager 초기화 시작...');
        try {
            this.managers.leagueManager = new LeagueManager(leagueData);
            // 저장 콜백 설정
            this.managers.leagueManager.setSaveCallback(this.options.saveDataToFirestore);
            window.leagueManager = this.managers.leagueManager; // 전역 변수로 등록
            logger.debug('LeagueManager 초기화 완료:', this.managers.leagueManager);
        }
        catch (error) {
            logError('LeagueManager 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * 토너먼트 관리자 초기화
     */
    async initializeTournamentManager(tournamentData) {
        logger.debug('TournamentManager 초기화 시작...');
        try {
            this.managers.tournamentManager = new TournamentManager(tournamentData, this.options.saveDataToFirestore);
            window.tournamentManager = this.managers.tournamentManager; // 전역 변수로 등록
            logger.debug('TournamentManager 초기화 완료:', this.managers.tournamentManager);
        }
        catch (error) {
            logError('TournamentManager 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * PAPS 관리자 초기화
     */
    async initializePapsManager(papsData) {
        logger.debug('PapsManager 초기화 시작...');
        try {
            // $ 함수를 HTMLElement 반환으로 래핑 (null이 아닌 것을 보장)
            const $safe = (selector) => {
                const el = this.options.$(selector);
                if (!el) {
                    throw new Error(`Element not found: ${selector}`);
                }
                return el;
            };
            this.managers.papsManager = new PapsManager(papsData, $safe, this.options.saveDataToFirestore, this.options.cleanupSidebar);
            window.papsManager = this.managers.papsManager; // 전역 변수로 등록
            logger.debug('PapsManager 초기화 완료:', this.managers.papsManager);
            logger.debug('window.papsManager 등록됨:', window.papsManager);
            logger.debug('window.papsManager.selectPapsClass:', typeof window.papsManager?.selectPapsClass);
        }
        catch (error) {
            logError('PapsManager 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * ProgressManager 초기화
     */
    async initializeProgressManager(progressClasses, selectedClassId) {
        logger.debug('ProgressManager 초기화 시작...');
        try {
            // $ 함수를 HTMLElement 반환으로 래핑
            const $safe = (selector) => {
                const el = this.options.$(selector);
                return el;
            };
            // $$ 함수를 NodeListOf<HTMLElement>로 래핑
            const $$safe = (selector) => {
                const nodes = this.options.$$(selector);
                return nodes;
            };
            this.managers.progressManager = initializeProgressManager($safe, $$safe, this.options.saveProgressData);
            window.progressManager = this.managers.progressManager; // 전역 변수로 등록
            logger.debug('ProgressManager 초기화 완료');
            // 데이터가 있는 경우에만 초기화
            if (progressClasses && progressClasses.length > 0) {
                this.managers.progressManager.initialize(progressClasses, selectedClassId || null);
                logger.debug('ProgressManager 데이터와 함께 초기화 완료');
            }
            else {
                this.managers.progressManager.initialize([], null);
                logger.debug('ProgressManager 빈 데이터로 초기화 완료');
            }
        }
        catch (error) {
            logError('ProgressManager 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * 초기화된 Manager들 반환
     */
    getManagers() {
        return this.managers;
    }
    /**
     * 초기화 상태 확인
     */
    isInitialized() {
        return this.initialized;
    }
}
/**
 * AppInitializer 인스턴스 생성 함수
 */
export function createAppInitializer(options) {
    return new AppInitializer(options);
}
//# sourceMappingURL=appInitializer.js.map