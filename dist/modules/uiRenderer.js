/**
 * UI 렌더링 모듈
 *
 * 이 모듈은 앱의 UI 렌더링 로직을 중앙에서 관리합니다.
 * 모드별 렌더링, 모드 전환, UI 초기화 등의 기능을 제공합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { logger, logWarn, logError } from './logger.js';
// ========================================
// UIRenderer 클래스
// ========================================
/**
 * UI 렌더링을 담당하는 클래스
 */
export class UIRenderer {
    /**
     * UIRenderer 인스턴스를 생성합니다.
     * @param options UIRenderer 옵션
     */
    constructor(options) {
        this.currentMode = 'progress';
        this.abortController = null;
        this.domContentLoadedHandler = null;
        this.renderRetryTimers = new Map();
        this.stateManager = options.stateManager;
        this.managers = options.managers;
        this.$ = options.$;
        this.$$ = options.$$;
        this.abortController = new AbortController();
    }
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 이벤트 리스너를 정리합니다.
     */
    cleanup() {
        // 이벤트 리스너 정리
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        // DOMContentLoaded 리스너 정리
        if (this.domContentLoadedHandler) {
            document.removeEventListener('DOMContentLoaded', this.domContentLoadedHandler);
            this.domContentLoadedHandler = null;
        }
        logger.debug('UIRenderer 리소스 정리 완료');
    }
    /**
     * Managers 참조를 업데이트합니다.
     */
    updateManagers(managers) {
        this.managers = {
            ...this.managers,
            ...managers
        };
        logger.debug('UIRenderer Managers 업데이트 완료', {
            league: !!this.managers.leagueManager,
            tournament: !!this.managers.tournamentManager,
            paps: !!this.managers.papsManager,
            progress: !!this.managers.progressManager
        });
    }
    /**
     * 현재 모드를 반환합니다.
     */
    getMode() {
        return this.currentMode;
    }
    /**
     * 모드를 설정합니다.
     * @param mode 모드 ('league' | 'tournament' | 'paps' | 'progress')
     */
    setMode(mode) {
        this.currentMode = mode;
    }
    /**
     * UI를 초기화합니다.
     */
    initializeUI() {
        logger.debug('=== UI 초기화 시작 ===');
        // 인증 상태 UI 업데이트
        if (this.managers.authManager) {
            this.managers.authManager.updateLoginStatus();
            // AuthManager가 있으면 항상 앱 화면 표시 (로컬 모드 지원)
            this.showAppScreen();
        }
        else {
            // AuthManager가 초기화되지 않은 경우에도 앱 화면 표시
            // (초기화 체인에서 나중에 AuthManager가 설정될 수 있음)
            logger.debug('AuthManager 미초기화, 앱 화면 표시 (나중에 업데이트될 예정)');
            this.showAppScreen();
        }
        // 모드 버튼 이벤트 리스너 설정
        // 즉시 한 번 시도
        logger.debug('모드 버튼 설정 즉시 시도...');
        this.setupModeButtons();
        // DOM이 완전히 준비되기 전일 수 있으므로 약간의 지연 후에도 설정
        setTimeout(() => {
            logger.debug('모드 버튼 설정 재시도 (100ms 후)...');
            this.setupModeButtons();
        }, 100);
        // 추가 안전장치: DOM이 완전히 준비되면 다시 시도
        if (document.readyState === 'loading') {
            this.domContentLoadedHandler = () => {
                logger.debug('DOMContentLoaded 이벤트 발생, 모드 버튼 재설정...');
                this.setupModeButtons();
            };
            document.addEventListener('DOMContentLoaded', this.domContentLoadedHandler, {
                signal: this.abortController?.signal
            });
        }
        else {
            // 이미 로드되었으면 추가로 시도
            setTimeout(() => {
                logger.debug('DOM 이미 로드됨, 모드 버튼 추가 확인 (300ms 후)...');
                this.setupModeButtons();
            }, 300);
        }
        // 초기 렌더링은 데이터 로드 후 main.ts에서 수행
        // (데이터 로드 전에 렌더링하면 빈 화면이 표시됨)
        logger.debug('UI 초기화 완료 (렌더링은 데이터 로드 후 수행)');
    }
    /**
     * 모드 버튼 이벤트 리스너를 설정합니다.
     */
    setupModeButtons() {
        logger.debug('=== 모드 버튼 설정 시작 ===');
        logger.debug('document.readyState:', document.readyState);
        // 이전 AbortController가 있으면 취소하고 새로 생성 (중복 방지)
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        // document.querySelectorAll로 직접 찾기 ($$ 함수가 작동하지 않을 수 있음)
        const modeButtons = document.querySelectorAll('.mode-switch-btn');
        logger.debug('모드 버튼 수 (querySelectorAll):', modeButtons.length);
        // $$ 함수로도 시도
        const modeButtonsAlt = this.$$('.mode-switch-btn');
        logger.debug('모드 버튼 수 ($$ 함수):', modeButtonsAlt.length);
        // 사용할 버튼 리스트 결정
        const buttons = modeButtons.length > 0 ? modeButtons : modeButtonsAlt;
        if (buttons.length === 0) {
            logError('❌ 모드 버튼을 찾을 수 없습니다!');
            logError('DOM 검색 시도:');
            logError('- .mode-switch-btn:', document.querySelectorAll('.mode-switch-btn').length);
            logError('- [data-mode]:', document.querySelectorAll('[data-mode]').length);
            logError('- button.mode-switch-btn:', document.querySelectorAll('button.mode-switch-btn').length);
            // DOM이 준비되지 않았을 수 있으므로 다시 시도
            setTimeout(() => {
                logger.debug('모드 버튼 재검색 (500ms 후)...');
                this.setupModeButtons();
            }, 500);
            return;
        }
        buttons.forEach((btn, index) => {
            const mode = btn.dataset.mode;
            logger.debug(`모드 버튼 ${index + 1}:`, mode, btn);
            // mode가 없으면 건너뛰기
            if (!mode) {
                logWarn(`⚠️ 모드 버튼 ${index + 1}에 data-mode 속성이 없음`, btn);
                return;
            }
            // 클릭 이벤트 리스너 추가 (명시적으로 처리)
            // this 컨텍스트를 보존하기 위해 화살표 함수 사용
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.debug('=== 모드 버튼 클릭 이벤트 발생 ===');
                logger.debug('클릭 이벤트 타겟:', e.target);
                logger.debug('현재 버튼:', btn);
                logger.debug('버튼 dataset.mode:', btn.dataset.mode);
                // 클릭된 요소가 버튼 자체가 아닐 수 있으므로 (SVG, 텍스트 등) 부모 요소까지 확인
                let target = e.target;
                let depth = 0;
                while (target && !target.classList.contains('mode-switch-btn') && depth < 5) {
                    target = target.parentElement;
                    depth++;
                    if (!target || target === document.body) {
                        target = btn;
                        break;
                    }
                }
                const clickedMode = target?.dataset?.mode || btn.dataset.mode;
                logger.debug('클릭된 모드:', clickedMode);
                logger.debug('최종 타겟 요소:', target);
                logger.debug('버튼 dataset:', btn.dataset);
                logger.debug('UIRenderer 인스턴스:', this);
                logger.debug('switchMode 메서드 존재:', typeof this.switchMode);
                if (clickedMode) {
                    logger.debug('✅ switchMode 호출 예정:', clickedMode);
                    try {
                        this.switchMode(clickedMode);
                        logger.debug('✅ switchMode 호출 완료');
                    }
                    catch (error) {
                        logError('❌ switchMode 호출 중 오류:', error);
                        logError('오류 스택:', error.stack);
                    }
                }
                else {
                    logError('❌ 모드를 찾을 수 없음');
                    logError('target.dataset:', target?.dataset);
                    logError('btn.dataset:', btn.dataset);
                    logError('클릭 이벤트:', e);
                }
            };
            // 버튼에 직접 이벤트 리스너 추가 (AbortController signal로 관리)
            btn.addEventListener('click', clickHandler, {
                once: false,
                passive: false,
                signal: signal
            });
            logger.debug(`✅ 모드 버튼 "${mode}" (인덱스 ${index + 1}) 클릭 리스너 등록 완료`);
            logger.debug(`   버튼 요소:`, btn);
            logger.debug(`   버튼 onclick 속성:`, btn.onclick);
            // 디버깅: 전역으로 버튼 접근 가능하도록 설정
            if (!window.debugModeButtons) {
                window.debugModeButtons = {};
            }
            window.debugModeButtons[mode] = btn;
            // 추가 테스트: 버튼이 클릭 가능한지 확인
            logger.debug(`   버튼 disabled 상태:`, btn.hasAttribute('disabled'));
            logger.debug(`   버튼 display 스타일:`, window.getComputedStyle(btn).display);
            logger.debug(`   버튼 pointer-events:`, window.getComputedStyle(btn).pointerEvents);
        });
        logger.debug('=== 모드 버튼 설정 완료 ===');
    }
    /**
     * 앱 화면을 표시합니다 (로그인 화면 숨김)
     */
    showAppScreen() {
        const authContainer = this.$('#auth-container');
        const appRoot = this.$('#app-root');
        if (authContainer && appRoot) {
            authContainer.classList.add('hidden');
            appRoot.classList.remove('hidden');
            logger.debug('앱 화면 표시됨 (로그인 화면 숨김)');
        }
        else {
            logger.warn('앱 화면 요소를 찾을 수 없음', { authContainer: !!authContainer, appRoot: !!appRoot });
        }
    }
    /**
     * 모드를 전환합니다.
     * @param mode 모드 ('league' | 'tournament' | 'paps' | 'progress')
     */
    switchMode(mode) {
        logger.debug('=== switchMode 호출됨 ===');
        logger.debug('요청된 모드:', mode);
        logger.debug('현재 모드:', this.currentMode);
        logger.debug('UIRenderer 인스턴스:', this);
        if (!mode) {
            logError('❌ 모드가 지정되지 않았습니다!');
            return;
        }
        // 유효한 모드인지 확인
        const validModes = ['league', 'tournament', 'paps', 'progress'];
        if (!validModes.includes(mode)) {
            logError('❌ 유효하지 않은 모드:', mode);
            return;
        }
        this.currentMode = mode;
        // 전역 변수에 모드 저장 (하위 호환성)
        if (typeof window !== 'undefined') {
            window.appMode = mode;
        }
        // body 클래스 업데이트 (CSS 스타일링을 위해)
        document.body.className = document.body.className.replace(/-\w+-mode/g, '');
        document.body.classList.add(`${mode}-mode`);
        // 버튼 활성화 상태 업데이트
        this.$$('.mode-switch-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        // Progress 모드에서 다른 모드로 전환 시 sidebar-list-container 다시 표시
        // CSS의 !important 규칙을 override하기 위해 inline style 사용
        // 즉시 처리하고, 약간의 지연 후에도 다시 확인 (타이밍 이슈 방지)
        const sidebarListContainer = document.querySelector('#sidebar-list-container');
        if (sidebarListContainer) {
            if (mode === 'progress') {
                // Progress 모드에서는 숨김 (CSS로 처리되지만 확실히 하기 위해)
                sidebarListContainer.style.display = 'none';
            }
            else {
                // 다른 모드에서는 표시 (CSS의 !important를 override)
                sidebarListContainer.style.setProperty('display', 'flex', 'important');
                // 약간의 지연 후에도 다시 확인 (모드 전환 후 CSS가 재적용될 수 있음)
                setTimeout(() => {
                    if (sidebarListContainer && !document.body.classList.contains('progress-mode')) {
                        sidebarListContainer.style.setProperty('display', 'flex', 'important');
                    }
                }, 10);
            }
        }
        // Progress 모드가 아닐 때 엑셀 버튼 제거
        if (mode !== 'progress') {
            const progressExcelActions = document.querySelector('.progress-excel-actions');
            if (progressExcelActions) {
                progressExcelActions.remove();
            }
        }
        // League 모드가 아닐 때 엑셀 버튼 제거
        if (mode !== 'league') {
            const leagueExcelActions = document.querySelector('.league-excel-actions');
            if (leagueExcelActions) {
                leagueExcelActions.remove();
            }
        }
        // PAPS 모드가 아닐 때 엑셀 버튼 제거
        if (mode !== 'paps') {
            const papsExcelActions = document.querySelector('.paps-excel-actions');
            if (papsExcelActions) {
                papsExcelActions.remove();
            }
        }
        // 앱 렌더링
        logger.debug('switchMode에서 renderApp 호출 직전');
        this.renderApp();
        logger.debug('switchMode에서 renderApp 호출 완료');
    }
    /**
     * 현재 모드에 따라 앱을 렌더링합니다.
     */
    renderApp() {
        logger.debug('=== 앱 렌더링 시작 ===');
        logger.debug('현재 모드:', this.currentMode);
        logger.debug('StateManager 존재 여부:', !!this.stateManager);
        logger.debug('Manager 존재 여부:', {
            league: !!this.managers.leagueManager,
            tournament: !!this.managers.tournamentManager,
            paps: !!this.managers.papsManager,
            progress: !!this.managers.progressManager
        });
        if (!this.stateManager) {
            logError('❌ AppStateManager가 초기화되지 않음');
            return;
        }
        const state = this.stateManager.getState();
        logger.debug('현재 상태:', state);
        // 모드별 렌더링
        switch (this.currentMode) {
            case 'league':
                logger.debug('리그전 모드 렌더링 시작...');
                this.renderLeagueMode(state);
                break;
            case 'tournament':
                logger.debug('토너먼트 모드 렌더링 시작...');
                this.renderTournamentMode(state);
                break;
            case 'paps':
                logger.debug('PAPS 모드 렌더링 시작...');
                this.renderPapsMode(state);
                break;
            case 'progress':
                logger.debug('진도표 모드 렌더링 시작...');
                this.renderProgressMode(state);
                break;
            default:
                logError('❌ 알 수 없는 모드:', this.currentMode);
        }
        logger.debug('=== 앱 렌더링 완료 ===');
    }
    /**
     * 리그전 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    renderLeagueMode(state) {
        logger.debug('리그전 UI 렌더링 시작');
        logger.debug('LeagueManager 존재 여부:', !!this.managers.leagueManager);
        logger.debug('state.leagues:', state.leagues);
        if (!this.managers.leagueManager) {
            // LeagueManager가 아직 초기화되지 않은 경우 짧은 지연 후 재시도
            // 재시도가 이미 진행 중인지 확인
            const retryTimer = this.renderRetryTimers.get('league');
            if (!retryTimer) {
                // 재시도가 진행 중이 아니면 첫 경고만 출력
                if (!this.__leagueRetryWarned) {
                    logger.debug('LeagueManager가 아직 초기화되지 않음 - 재시도 예정');
                    this.__leagueRetryWarned = true;
                }
                this.scheduleRetry('league', () => this.renderLeagueMode(state), 200);
            }
            return;
        }
        // LeagueManager가 준비되었으면 경고 플래그 리셋
        if (this.__leagueRetryWarned) {
            this.__leagueRetryWarned = false;
        }
        // 재시도 타이머가 있으면 취소
        this.clearRetry('league');
        try {
            // window.leagueManager 등록 확인 및 재등록 (리그전 모드에서 사용)
            if (this.managers.leagueManager) {
                window.leagueManager = this.managers.leagueManager;
                logger.debug('window.leagueManager 등록 완료:', {
                    hasCreateClass: typeof window.leagueManager?.createClass === 'function'
                });
            }
            // LeagueManager에 최신 데이터 전달
            this.managers.leagueManager.setLeagueData(state.leagues);
            logger.debug('LeagueManager에 최신 데이터 전달 완료');
            // LeagueManager의 렌더링 메서드 호출
            this.managers.leagueManager.renderLeagueUI();
            logger.debug('LeagueManager.renderLeagueUI() 호출 완료');
        }
        catch (error) {
            logError('리그전 모드 렌더링 중 오류:', error);
        }
    }
    /**
     * 토너먼트 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    renderTournamentMode(state) {
        logger.debug('토너먼트 UI 렌더링 시작');
        logger.debug('TournamentManager 존재 여부:', !!this.managers.tournamentManager);
        logger.debug('state.tournaments:', state.tournaments);
        if (!this.managers.tournamentManager) {
            // TournamentManager가 아직 초기화되지 않은 경우 짧은 지연 후 재시도
            // 재시도가 이미 진행 중인지 확인
            const retryTimer = this.renderRetryTimers.get('tournament');
            if (!retryTimer) {
                // 재시도가 진행 중이 아니면 첫 경고만 출력
                if (!this.__tournamentRetryWarned) {
                    logger.debug('TournamentManager가 아직 초기화되지 않음 - 재시도 예정');
                    this.__tournamentRetryWarned = true;
                }
                this.scheduleRetry('tournament', () => this.renderTournamentMode(state), 200);
            }
            return;
        }
        // TournamentManager가 준비되었으면 경고 플래그 리셋
        if (this.__tournamentRetryWarned) {
            this.__tournamentRetryWarned = false;
        }
        // 재시도 타이머가 있으면 취소
        this.clearRetry('tournament');
        try {
            // TournamentManager에 최신 데이터 전달
            this.managers.tournamentManager.setTournamentData(state.tournaments);
            logger.debug('TournamentManager에 최신 데이터 전달 완료');
            // TournamentManager의 렌더링 메서드 호출
            this.managers.tournamentManager.renderTournamentUI();
            logger.debug('TournamentManager.renderTournamentUI() 호출 완료');
        }
        catch (error) {
            logError('토너먼트 모드 렌더링 중 오류:', error);
        }
    }
    /**
     * PAPS 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    renderPapsMode(state) {
        logger.debug('PAPS UI 렌더링 시작');
        logger.debug('PapsManager 존재 여부:', !!this.managers.papsManager);
        logger.debug('state.paps:', state.paps);
        if (!this.managers.papsManager) {
            // PapsManager가 아직 초기화되지 않은 경우 짧은 지연 후 재시도
            // 재시도가 이미 진행 중인지 확인
            const retryTimer = this.renderRetryTimers.get('paps');
            if (!retryTimer) {
                // 재시도가 진행 중이 아니면 첫 경고만 출력
                if (!this.__papsRetryWarned) {
                    logger.debug('PapsManager가 아직 초기화되지 않음 - 재시도 예정');
                    this.__papsRetryWarned = true;
                }
                this.scheduleRetry('paps', () => this.renderPapsMode(state), 200);
            }
            return;
        }
        // PapsManager가 준비되었으면 경고 플래그 리셋
        if (this.__papsRetryWarned) {
            this.__papsRetryWarned = false;
        }
        // 재시도 타이머가 있으면 취소
        this.clearRetry('paps');
        try {
            // PapsManager에 최신 데이터 전달
            this.managers.papsManager.setPapsData(state.paps);
            logger.debug('PapsManager에 최신 데이터 전달 완료');
            logger.debug('PapsManager 데이터 구조 검증:', {
                classes: state.paps?.classes?.length || 0,
                activeClassId: state.paps?.activeClassId,
                hasData: !!state.paps
            });
            // PapsManager의 렌더링 메서드 호출
            this.managers.papsManager.renderPapsUI();
            logger.debug('PapsManager.renderPapsUI() 호출 완료');
        }
        catch (error) {
            logError('PAPS 모드 렌더링 중 오류:', error);
        }
    }
    /**
     * 진도표 모드를 렌더링합니다.
     * @param state 앱 상태
     */
    renderProgressMode(state) {
        logger.debug('진도표 UI 렌더링 시작');
        if (!this.managers.progressManager) {
            // ProgressManager가 아직 초기화되지 않은 경우 짧은 지연 후 재시도
            // 재시도가 이미 진행 중인지 확인
            const retryTimer = this.renderRetryTimers.get('progress');
            if (!retryTimer) {
                // 재시도가 진행 중이 아니면 첫 경고만 출력
                if (!this.__progressRetryWarned) {
                    logger.debug('ProgressManager가 아직 초기화되지 않음 - 재시도 예정');
                    this.__progressRetryWarned = true;
                }
                this.scheduleRetry('progress', () => this.renderProgressMode(state), 200);
            }
            return;
        }
        // ProgressManager가 준비되었으면 경고 플래그 리셋
        if (this.__progressRetryWarned) {
            this.__progressRetryWarned = false;
        }
        // 재시도 타이머가 있으면 취소
        this.clearRetry('progress');
        try {
            // ProgressManager의 렌더링 메서드 호출
            // ProgressManager는 내부적으로 자신의 데이터를 사용하므로 별도로 데이터 전달 불필요
            this.managers.progressManager.renderProgressUI();
            logger.debug('ProgressManager.renderProgressUI() 호출 완료');
        }
        catch (error) {
            logError('진도표 모드 렌더링 중 오류:', error);
        }
    }
    /**
     * 재시도 스케줄링 (Manager 초기화 대기)
     */
    scheduleRetry(mode, retryFn, delay = 200, maxRetries = 15) {
        // 재시도 횟수 추적을 위한 Map 생성 (없으면)
        if (!this.retryCounts) {
            this.retryCounts = new Map();
        }
        const retryCounts = this.retryCounts;
        const currentRetry = retryCounts.get(mode) || 0;
        if (currentRetry >= maxRetries) {
            // 최대 횟수 초과 시 한 번만 경고 출력
            if (!this[`__${mode}MaxRetriesWarned`]) {
                logWarn(`${mode} 모드 렌더링 재시도 최대 횟수 초과 (${maxRetries}회). ProgressManager 초기화를 기다리는 중입니다.`);
                this[`__${mode}MaxRetriesWarned`] = true;
            }
            // 카운트는 유지하여 계속 체크하지 않도록 함
            return;
        }
        // 기존 타이머가 있으면 취소 (새로운 재시도 시작 전에)
        const existingTimer = this.renderRetryTimers.get(mode);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        retryCounts.set(mode, currentRetry + 1);
        logger.debug(`${mode} 모드 렌더링 재시도 예정 (${currentRetry + 1}/${maxRetries})`);
        const timer = setTimeout(() => {
            const currentCount = retryCounts.get(mode) || 0;
            logger.debug(`${mode} 모드 렌더링 재시도 실행 (${currentCount}/${maxRetries})`);
            try {
                retryFn();
                // 성공하면 카운트 리셋하고 타이머 제거
                retryCounts.set(mode, 0);
                this.renderRetryTimers.set(mode, null);
                // 최대 횟수 경고 플래그도 리셋
                this[`__${mode}MaxRetriesWarned`] = false;
            }
            catch (error) {
                logError(`${mode} 모드 렌더링 재시도 중 오류:`, error);
                this.renderRetryTimers.set(mode, null);
            }
        }, delay);
        this.renderRetryTimers.set(mode, timer);
    }
    /**
     * 재시도 타이머 취소
     */
    clearRetry(mode) {
        const timer = this.renderRetryTimers.get(mode);
        if (timer) {
            clearTimeout(timer);
            this.renderRetryTimers.set(mode, null);
        }
        // 재시도 횟수와 경고 플래그 리셋 (성공적으로 렌더링된 경우)
        if (this.retryCounts) {
            this.retryCounts.set(mode, 0);
        }
        // 최대 횟수 경고 플래그도 리셋
        this[`__${mode}MaxRetriesWarned`] = false;
    }
}
// ========================================
// 팩토리 함수
// ========================================
/**
 * UIRenderer 인스턴스를 생성하는 팩토리 함수
 * @param options UIRenderer 옵션
 * @returns UIRenderer 인스턴스
 */
export function createUIRenderer(options) {
    return new UIRenderer(options);
}
// ========================================
// 기본 내보내기
// ========================================
export default UIRenderer;
//# sourceMappingURL=uiRenderer.js.map