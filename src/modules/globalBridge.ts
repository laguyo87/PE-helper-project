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

import { AppContext } from './appContext.js';
import { DOMSelector } from './utils.js';

// ========================================
// 타입 정의
// ========================================

/**
 * GlobalBridge 옵션
 */
export interface GlobalBridgeOptions {
  /** AppContext 인스턴스 */
  context: AppContext;
  /** DOM 선택자 함수 */
  $: DOMSelector;
  /** DOM 전체 선택 함수 */
  $$: (selector: string) => NodeListOf<HTMLElement>;
  /** 모드 전환 함수 */
  switchMode?: (mode: string) => void;
  /** 데이터 저장 함수 */
  saveDataToFirestore?: () => Promise<void>;
}

// ========================================
// GlobalBridge 클래스
// ========================================

/**
 * 전역 함수 등록을 담당하는 클래스
 */
export class GlobalBridge {
  private context: AppContext;
  private $: DOMSelector;
  private $$: (selector: string) => NodeListOf<HTMLElement>;
  private switchMode?: (mode: string) => void;
  private saveDataToFirestore?: () => Promise<void>;

  /**
   * GlobalBridge 인스턴스를 생성합니다.
   * @param options GlobalBridge 옵션
   */
  constructor(options: GlobalBridgeOptions) {
    this.context = options.context;
    this.$ = options.$;
    this.$$ = options.$$;
    this.switchMode = options.switchMode;
    this.saveDataToFirestore = options.saveDataToFirestore;
  }

  /**
   * 모든 전역 함수를 등록합니다.
   */
  public registerAll(): void {
    // 모드 전환
    if (this.switchMode) {
      (window as any).switchMode = this.switchMode.bind(this);
    } else if (this.context.uiRenderer) {
      (window as any).switchMode = (mode: string) => {
        this.context.uiRenderer?.switchMode(mode);
      };
    }

    // 현재 모드
    (window as any).appMode = this.context.uiRenderer?.getMode() || 'progress';

    // DOM 헬퍼
    (window as any).$ = this.$;
    (window as any).$$ = this.$$;

    // LeagueManager 전역 함수
    if (this.context.leagueManager) {
      (window as any).selectClass = (id: any) => {
        this.context.leagueManager?.selectClass(id);
      };
      (window as any).editClassNote = (id: any) => {
        this.context.leagueManager?.editClassNote(id);
      };
      (window as any).editClassName = (id: any) => {
        this.context.leagueManager?.editClassName(id);
      };
      (window as any).deleteClass = (id: any) => {
        this.context.leagueManager?.deleteClass(id);
      };
    }

    // LeagueManager 전역 등록 (리그전 모드에서 window.leagueManager 사용)
    if (this.context.leagueManager) {
      (window as any).leagueManager = this.context.leagueManager;
      // 학생 관련 전역 함수 등록
      (window as any).removeStudent = (id: number | string) => {
        this.context.leagueManager?.removeStudent(typeof id === 'string' ? parseFloat(id) : id);
      };
      (window as any).editStudentName = (id: number | string) => {
        this.context.leagueManager?.editStudentName(typeof id === 'string' ? parseFloat(id) : id);
      };
      (window as any).editStudentNote = (id: number | string) => {
        this.context.leagueManager?.editStudentNote(typeof id === 'string' ? parseFloat(id) : id);
      };
      // 경기 강조 표시 함수 등록
      (window as any).toggleGameHighlight = (gameId: number | string) => {
        this.context.leagueManager?.toggleGameHighlight(typeof gameId === 'string' ? parseFloat(gameId) : gameId);
      };
      // 모든 강조 해제 함수 등록
      (window as any).clearAllHighlights = () => {
        this.context.leagueManager?.clearAllHighlights();
      };
    }

    // TournamentManager 전역 함수
    if (this.context.tournamentManager) {
      (window as any).createTournament = () => {
        this.context.tournamentManager?.createTournament();
      };
      (window as any).deleteTournament = (id: string) => {
        this.context.tournamentManager?.deleteTournament(id);
      };
      (window as any).showTournamentSettings = (tournamentId: string) => {
        this.context.tournamentManager?.showTournamentSettings(tournamentId);
      };
      (window as any).updateTournamentSettings = () => {
        this.context.tournamentManager?.updateTournamentSettings();
      };
      (window as any).addTeamToTournament = () => {
        this.context.tournamentManager?.addTeamToTournament();
      };
      (window as any).onScoreInputTournament = (matchId: string, side: 'A' | 'B', value: string) => {
        this.context.tournamentManager?.onScoreInputTournament(matchId, side, value);
      };
    }

    // 모달 닫기
    (window as any).closeModal = () => {
      const modal = document.querySelector('.modal-overlay, .modal, [class*="modal"]');
      if (modal) {
        (modal as HTMLElement).style.display = 'none';
        modal.remove();
      }
    };

    // 데이터 저장 (레거시 호환)
    if (this.saveDataToFirestore) {
      (window as any).saveDataToFirestore = this.saveDataToFirestore;
    } else if (this.context.dataSyncService) {
      (window as any).saveDataToFirestore = async () => {
        await this.context.dataSyncService?.saveToFirestore();
      };
    }

    // 실행 취소 함수 등록
    (window as any).handleUndo = () => {
      const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
      
      // AppStateManager가 있는지 확인
      if (!this.context.appStateManager) {
        console.warn('실행 취소: AppStateManager가 초기화되지 않았습니다.');
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
        console.log('실행 취소할 수 있는 이전 상태가 없습니다.');
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
            });
          }
          console.log('실행 취소 완료');
        } else {
          console.warn('실행 취소 실패');
        }
      } catch (error) {
        console.error('실행 취소 중 오류 발생:', error);
        if (undoBtn) {
          undoBtn.disabled = false;
          undoBtn.style.opacity = '1';
        }
      }
    };

    // 실행 취소 버튼의 tooltip에 플랫폼별 단축키 표시
    this.updateUndoTooltip();
    
    // 실행 취소 버튼 상태 초기화
    this.updateUndoButtonState();

    // 사이드바 토글 함수 등록 (HTML에서 이미 정의되어 있을 수 있지만, 확실히 하기 위해 재정의)
    // HTML에서 이미 정의되어 있으면 그대로 사용
    if (!(window as any).toggleSidebar || typeof (window as any).toggleSidebar !== 'function') {
      (window as any).toggleSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (!sidebar || !sidebarToggle) {
          console.warn('사이드바 또는 사이드바 토글 버튼을 찾을 수 없습니다.');
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
          console.log('사이드바 열기 (GlobalBridge)');
        } else {
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
          console.log('사이드바 닫기 (GlobalBridge)');
        }
      };
    }

    // 사이드바 토글 버튼 이벤트 등록 (HTML onclick이 작동하지 않을 경우를 대비)
    this.initializeSidebarToggle();

    console.log('전역 함수 등록 완료');
  }

  /**
   * 실행 취소 버튼의 tooltip을 플랫폼에 맞게 업데이트합니다.
   */
  private updateUndoTooltip(): void {
    const undoBtn = document.getElementById('undo-btn');
    if (!undoBtn) return;

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
  private updateUndoButtonState(): void {
    const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
    if (!undoBtn || !this.context.appStateManager) return;

    const canUndo = this.context.appStateManager.canUndo();
    undoBtn.disabled = !canUndo;
    undoBtn.style.opacity = canUndo ? '1' : '0.5';
  }

  /**
   * 사이드바 토글 버튼 이벤트를 초기화합니다.
   * HTML onclick이 작동하지 않을 경우를 대비한 백업입니다.
   */
  private initializeSidebarToggle(): void {
    // DOM이 완전히 로드될 때까지 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupSidebarToggle();
      });
    } else {
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
  private setupSidebarToggle(): void {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebarToggle || !sidebar) {
      console.warn('사이드바 토글 버튼 또는 사이드바 요소를 찾을 수 없습니다.');
      return;
    }

    // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
    const newToggle = sidebarToggle.cloneNode(true) as HTMLElement;
    sidebarToggle.parentNode?.replaceChild(newToggle, sidebarToggle);
    
    newToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const toggleFunction = (window as any).toggleSidebar;
      if (toggleFunction && typeof toggleFunction === 'function') {
        toggleFunction();
      } else {
        // 전역 함수가 없으면 직접 토글
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
          sidebar.classList.remove('collapsed');
          newToggle.setAttribute('aria-expanded', 'true');
        } else {
          sidebar.classList.add('collapsed');
          newToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });

    console.log('사이드바 토글 버튼 이벤트 등록 완료');
  }

  /**
   * 특정 전역 함수를 등록합니다.
   * @param name 함수 이름
   * @param func 함수
   */
  public register(name: string, func: (...args: any[]) => any): void {
    (window as any)[name] = func;
  }

  /**
   * 전역 함수를 제거합니다.
   * @param name 함수 이름
   */
  public unregister(name: string): void {
    delete (window as any)[name];
  }

  /**
   * 모든 전역 함수를 제거합니다.
   */
  public unregisterAll(): void {
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
      delete (window as any)[name];
    });

    console.log('전역 함수 제거 완료');
  }

  /**
   * appMode를 업데이트합니다.
   */
  public updateAppMode(): void {
    if (this.context.uiRenderer) {
      (window as any).appMode = this.context.uiRenderer.getMode();
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
export function createGlobalBridge(options: GlobalBridgeOptions): GlobalBridge {
  return new GlobalBridge(options);
}

// ========================================
// 기본 내보내기
// ========================================

export default GlobalBridge;

