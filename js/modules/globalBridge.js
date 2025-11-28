/**
 * 전역 브릿지 모듈
 *
 * 이 모듈은 HTML의 onclick 핸들러와 모듈화된 코드를 연결하는 브릿지 역할을 합니다.
 * window 객체에 전역 함수를 등록하여 하위 호환성을 유지합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { logger, logWarn, logError } from './logger.js';
// ========================================
// GlobalBridge 클래스
// ========================================
/**
 * 전역 함수 등록을 담당하는 클래스
 */
export class GlobalBridge {
    /**
     * GlobalBridge 인스턴스를 생성합니다.
     * @param options GlobalBridge 옵션
     */
    constructor(options) {
        this.context = options.context;
        this.$ = options.$;
        this.$$ = options.$$;
        this.switchMode = options.switchMode;
        this.saveDataToFirestore = options.saveDataToFirestore;
    }
    /**
     * 모든 전역 함수를 등록합니다.
     */
    registerAll() {
        // 모드 전환
        if (this.switchMode) {
            window.switchMode = this.switchMode.bind(this);
        }
        else if (this.context.uiRenderer) {
            window.switchMode = (mode) => {
                this.context.uiRenderer?.switchMode(mode);
            };
        }
        // 현재 모드
        window.appMode = this.context.uiRenderer?.getMode() || 'progress';
        // DOM 헬퍼
        window.$ = this.$;
        window.$$ = this.$$;
        // LeagueManager 전역 함수
        if (this.context.leagueManager) {
            window.selectClass = (id) => {
                this.context.leagueManager?.selectClass(id);
            };
            window.editClassNote = (id) => {
                this.context.leagueManager?.editClassNote(id);
            };
            window.editClassName = (id) => {
                this.context.leagueManager?.editClassName(id);
            };
            window.deleteClass = (id) => {
                this.context.leagueManager?.deleteClass(id);
            };
        }
        // LeagueManager 전역 등록 (리그전 모드에서 window.leagueManager 사용)
        if (this.context.leagueManager) {
            window.leagueManager = this.context.leagueManager;
            // 학생 관련 전역 함수 등록
            window.removeStudent = (id) => {
                this.context.leagueManager?.removeStudent(typeof id === 'string' ? parseFloat(id) : id);
            };
            window.editStudentName = (id) => {
                this.context.leagueManager?.editStudentName(typeof id === 'string' ? parseFloat(id) : id);
            };
            window.editStudentNote = (id) => {
                this.context.leagueManager?.editStudentNote(typeof id === 'string' ? parseFloat(id) : id);
            };
            // 경기 강조 표시 함수 등록
            window.toggleGameHighlight = (gameId) => {
                this.context.leagueManager?.toggleGameHighlight(typeof gameId === 'string' ? parseFloat(gameId) : gameId);
            };
            // 모든 강조 해제 함수 등록
            window.clearAllHighlights = () => {
                this.context.leagueManager?.clearAllHighlights();
            };
        }
        // TournamentManager 전역 함수
        if (this.context.tournamentManager) {
            window.createTournament = () => {
                this.context.tournamentManager?.createTournament();
            };
            window.deleteTournament = (id) => {
                this.context.tournamentManager?.deleteTournament(id);
            };
            window.showTournamentSettings = (tournamentId) => {
                this.context.tournamentManager?.showTournamentSettings(tournamentId);
            };
            window.updateTournamentSettings = () => {
                this.context.tournamentManager?.updateTournamentSettings();
            };
            window.addTeamToTournament = () => {
                this.context.tournamentManager?.addTeamToTournament();
            };
            window.onScoreInputTournament = (matchId, side, value) => {
                this.context.tournamentManager?.onScoreInputTournament(matchId, side, value);
            };
        }
        // 모달 닫기
        window.closeModal = () => {
            const modal = document.querySelector('.modal-overlay, .modal, [class*="modal"]');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
        };
        // 데이터 저장 (레거시 호환)
        if (this.saveDataToFirestore) {
            window.saveDataToFirestore = this.saveDataToFirestore;
        }
        else if (this.context.dataSyncService) {
            window.saveDataToFirestore = async () => {
                await this.context.dataSyncService?.saveToFirestore();
            };
        }
        // 실행 취소 함수 등록
        window.handleUndo = () => {
            const undoBtn = document.getElementById('undo-btn');
            // AppStateManager가 있는지 확인
            if (!this.context.appStateManager) {
                logWarn('실행 취소: AppStateManager가 초기화되지 않았습니다.');
                if (undoBtn) {
                    undoBtn.disabled = true;
                    undoBtn.style.opacity = '0.5';
                    requestAnimationFrame(() => {
                        undoBtn.disabled = false;
                        undoBtn.style.opacity = '1';
                    });
                }
                return;
            }
            // 실행 취소 가능 여부 확인
            if (!this.context.appStateManager.canUndo()) {
                // 실행 취소 불가능한 경우 시각적 피드백
                if (undoBtn) {
                    const originalOpacity = undoBtn.style.opacity;
                    undoBtn.style.opacity = '0.5';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            undoBtn.style.opacity = originalOpacity || '1';
                        });
                    });
                }
                logger.debug('실행 취소할 수 있는 이전 상태가 없습니다.');
                return;
            }
            // 실행 취소 수행
            try {
                const success = this.context.appStateManager.undo();
                if (success) {
                    // 버튼 시각적 피드백
                    if (undoBtn) {
                        undoBtn.disabled = true;
                        undoBtn.style.opacity = '0.5';
                        requestAnimationFrame(() => {
                            undoBtn.disabled = false;
                            undoBtn.style.opacity = '1';
                            // 실행 취소 가능 여부에 따라 버튼 상태 업데이트
                            this.updateUndoButtonState();
                            // redo 버튼 상태도 업데이트 (undo 후 redo 가능하므로)
                            this.updateRedoButtonState();
                        });
                    }
                    logger.debug('실행 취소 완료');
                }
                else {
                    logWarn('실행 취소 실패');
                }
            }
            catch (error) {
                logError('실행 취소 중 오류 발생:', error);
                if (undoBtn) {
                    undoBtn.disabled = false;
                    undoBtn.style.opacity = '1';
                }
            }
        };
        // 다시 실행하기 함수 등록
        window.handleRedo = () => {
            const redoBtn = document.getElementById('redo-btn');
            // AppStateManager가 있는지 확인
            if (!this.context.appStateManager) {
                logWarn('다시 실행하기: AppStateManager가 초기화되지 않았습니다.');
                if (redoBtn) {
                    redoBtn.disabled = true;
                    redoBtn.style.opacity = '0.5';
                    requestAnimationFrame(() => {
                        redoBtn.disabled = false;
                        redoBtn.style.opacity = '1';
                    });
                }
                return;
            }
            // 다시 실행하기 가능 여부 확인
            if (!this.context.appStateManager.canRedo()) {
                // 다시 실행하기 불가능한 경우 시각적 피드백
                if (redoBtn) {
                    const originalOpacity = redoBtn.style.opacity;
                    redoBtn.style.opacity = '0.5';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            redoBtn.style.opacity = originalOpacity || '1';
                        });
                    });
                }
                logger.debug('다시 실행할 수 있는 상태가 없습니다.');
                return;
            }
            // 다시 실행하기 수행
            try {
                const success = this.context.appStateManager.redo();
                if (success) {
                    // 버튼 시각적 피드백
                    if (redoBtn) {
                        redoBtn.disabled = true;
                        redoBtn.style.opacity = '0.5';
                        requestAnimationFrame(() => {
                            redoBtn.disabled = false;
                            redoBtn.style.opacity = '1';
                            // 다시 실행하기 가능 여부에 따라 버튼 상태 업데이트
                            this.updateRedoButtonState();
                            // undo 버튼 상태도 업데이트 (undo 후 redo 가능하므로)
                            this.updateUndoButtonState();
                        });
                    }
                    logger.debug('다시 실행하기 완료');
                }
                else {
                    logWarn('다시 실행하기 실패');
                }
            }
            catch (error) {
                logError('다시 실행하기 중 오류 발생:', error);
                if (redoBtn) {
                    redoBtn.disabled = false;
                    redoBtn.style.opacity = '1';
                }
            }
        };
        // 실행 취소 버튼의 tooltip에 플랫폼별 단축키 표시
        this.updateUndoTooltip();
        // 실행 취소 버튼 상태 초기화
        this.updateUndoButtonState();
        // 다시 실행하기 버튼의 tooltip에 플랫폼별 단축키 표시
        this.updateRedoTooltip();
        // 다시 실행하기 버튼 상태 초기화
        this.updateRedoButtonState();
        // 사이드바 토글 함수 등록 (HTML에서 이미 정의되어 있을 수 있지만, 확실히 하기 위해 재정의)
        // HTML에서 이미 정의되어 있으면 그대로 사용
        if (!window.toggleSidebar || typeof window.toggleSidebar !== 'function') {
            window.toggleSidebar = () => {
                const sidebar = document.getElementById('sidebar');
                const sidebarToggle = document.getElementById('sidebar-toggle');
                if (!sidebar || !sidebarToggle) {
                    logWarn('사이드바 또는 사이드바 토글 버튼을 찾을 수 없습니다.');
                    return;
                }
                const isCollapsed = sidebar.classList.contains('collapsed');
                if (isCollapsed) {
                    // 사이드바 열기
                    sidebar.classList.remove('collapsed');
                    sidebar.style.setProperty('width', '340px', 'important');
                    sidebar.style.setProperty('min-width', '340px', 'important');
                    sidebar.style.setProperty('padding', '24px', 'important');
                    sidebar.style.setProperty('border-right', '1px solid var(--line)', 'important');
                    sidebar.style.setProperty('overflow', 'visible', 'important');
                    if (sidebarToggle) {
                        sidebarToggle.style.setProperty('left', '340px', 'important');
                    }
                    sidebarToggle.setAttribute('aria-expanded', 'true');
                    logger.debug('사이드바 열기 (GlobalBridge)');
                }
                else {
                    // 사이드바 닫기
                    sidebar.classList.add('collapsed');
                    sidebar.style.setProperty('width', '0', 'important');
                    sidebar.style.setProperty('min-width', '0', 'important');
                    sidebar.style.setProperty('padding', '0', 'important');
                    sidebar.style.setProperty('border-right', 'none', 'important');
                    sidebar.style.setProperty('overflow', 'hidden', 'important');
                    if (sidebarToggle) {
                        sidebarToggle.style.setProperty('left', '0', 'important');
                    }
                    sidebarToggle.setAttribute('aria-expanded', 'false');
                    logger.debug('사이드바 닫기 (GlobalBridge)');
                }
            };
        }
        // 사이드바 토글 버튼 이벤트 등록 (HTML onclick이 작동하지 않을 경우를 대비)
        this.initializeSidebarToggle();
        logger.debug('전역 함수 등록 완료');
    }
    /**
     * 실행 취소 버튼의 tooltip을 플랫폼에 맞게 업데이트합니다.
     */
    updateUndoTooltip() {
        const undoBtn = document.getElementById('undo-btn');
        if (!undoBtn)
            return;
        // Mac/iOS 체크
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
            navigator.platform.toUpperCase().indexOf('IPHONE') >= 0 ||
            navigator.platform.toUpperCase().indexOf('IPAD') >= 0 ||
            navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
        const shortcut = isMac ? 'Cmd+Z' : 'Ctrl+Z';
        undoBtn.setAttribute('data-tooltip', `실행 취소 (${shortcut})`);
        undoBtn.setAttribute('aria-label', `실행 취소 (${shortcut})`);
    }
    /**
     * 실행 취소 버튼의 활성화 상태를 업데이트합니다.
     */
    updateUndoButtonState() {
        const undoBtn = document.getElementById('undo-btn');
        if (!undoBtn || !this.context.appStateManager)
            return;
        const canUndo = this.context.appStateManager.canUndo();
        undoBtn.disabled = !canUndo;
        undoBtn.style.opacity = canUndo ? '1' : '0.5';
    }
    /**
     * 다시 실행하기 버튼의 tooltip을 플랫폼에 맞게 업데이트합니다.
     */
    updateRedoTooltip() {
        const redoBtn = document.getElementById('redo-btn');
        if (!redoBtn)
            return;
        // Mac/iOS 체크
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
            navigator.platform.toUpperCase().indexOf('IPHONE') >= 0 ||
            navigator.platform.toUpperCase().indexOf('IPAD') >= 0 ||
            navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
        const shortcut = isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y';
        redoBtn.setAttribute('data-tooltip', `다시 실행하기 (${shortcut})`);
        redoBtn.setAttribute('aria-label', `다시 실행하기 (${shortcut})`);
    }
    /**
     * 다시 실행하기 버튼의 활성화 상태를 업데이트합니다.
     */
    updateRedoButtonState() {
        const redoBtn = document.getElementById('redo-btn');
        if (!redoBtn || !this.context.appStateManager)
            return;
        const canRedo = this.context.appStateManager.canRedo();
        redoBtn.disabled = !canRedo;
        redoBtn.style.opacity = canRedo ? '1' : '0.5';
    }
    /**
     * 사이드바 토글 버튼 이벤트를 초기화합니다.
     * HTML onclick이 작동하지 않을 경우를 대비한 백업입니다.
     */
    initializeSidebarToggle() {
        // DOM이 완전히 로드될 때까지 대기
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupSidebarToggle();
            });
        }
        else {
            // DOM이 이미 로드된 경우
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.setupSidebarToggle();
                });
            });
        }
    }
    /**
     * 사이드바 토글 버튼 이벤트 리스너를 설정합니다.
     */
    setupSidebarToggle() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (!sidebarToggle || !sidebar) {
            logWarn('사이드바 토글 버튼 또는 사이드바 요소를 찾을 수 없습니다.');
            return;
        }
        // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
        const newToggle = sidebarToggle.cloneNode(true);
        sidebarToggle.parentNode?.replaceChild(newToggle, sidebarToggle);
        newToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const toggleFunction = window.toggleSidebar;
            if (toggleFunction && typeof toggleFunction === 'function') {
                toggleFunction();
            }
            else {
                // 전역 함수가 없으면 직접 토글
                const isCollapsed = sidebar.classList.contains('collapsed');
                if (isCollapsed) {
                    sidebar.classList.remove('collapsed');
                    newToggle.setAttribute('aria-expanded', 'true');
                }
                else {
                    sidebar.classList.add('collapsed');
                    newToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
        logger.debug('사이드바 토글 버튼 이벤트 등록 완료');
    }
    /**
     * 특정 전역 함수를 등록합니다.
     * @param name 함수 이름
     * @param func 함수
     */
    register(name, func) {
        window[name] = func;
    }
    /**
     * 전역 함수를 제거합니다.
     * @param name 함수 이름
     */
    unregister(name) {
        delete window[name];
    }
    /**
     * 모든 전역 함수를 제거합니다.
     */
    unregisterAll() {
        const globalFunctions = [
            'switchMode',
            'appMode',
            '$',
            '$$',
            'selectClass',
            'editClassNote',
            'editClassName',
            'deleteClass',
            'leagueManager',
            'createTournament',
            'deleteTournament',
            'showTournamentSettings',
            'updateTournamentSettings',
            'addTeamToTournament',
            'onScoreInputTournament',
            'closeModal',
            'saveDataToFirestore'
        ];
        globalFunctions.forEach(name => {
            delete window[name];
        });
        logger.debug('전역 함수 제거 완료');
    }
    /**
     * appMode를 업데이트합니다.
     */
    updateAppMode() {
        if (this.context.uiRenderer) {
            window.appMode = this.context.uiRenderer.getMode();
        }
    }
}
// ========================================
// 팩토리 함수
// ========================================
/**
 * GlobalBridge 인스턴스를 생성하는 팩토리 함수
 * @param options GlobalBridge 옵션
 * @returns GlobalBridge 인스턴스
 */
export function createGlobalBridge(options) {
    return new GlobalBridge(options);
}
// ========================================
// 기본 내보내기
// ========================================
export default GlobalBridge;
//# sourceMappingURL=globalBridge.js.map