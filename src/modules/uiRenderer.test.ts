/**
 * UIRenderer 모듈 테스트
 * 
 * UI 렌더러의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createUIRenderer, UIRenderer } from './uiRenderer.js';
import { createAppStateManager, AppStateManager } from './appStateManager.js';
import { getDefaultData } from './utils.js';

// Mock Manager 클래스들
class MockLeagueManager {
  renderLeagueUI = vi.fn();
  setLeagueData = vi.fn();
}

class MockTournamentManager {
  renderTournamentUI = vi.fn();
  setTournamentData = vi.fn();
}

class MockPapsManager {
  renderPapsUI = vi.fn();
  setPapsData = vi.fn();
}

class MockProgressManager {
  renderProgressUI = vi.fn();
  initialize = vi.fn();
}

class MockAuthManager {
  updateLoginStatus = vi.fn();
}

describe('UIRenderer', () => {
  let uiRenderer: UIRenderer;
  let stateManager: AppStateManager;
  let mockLeagueManager: MockLeagueManager;
  let mockTournamentManager: MockTournamentManager;
  let mockPapsManager: MockPapsManager;
  let mockProgressManager: MockProgressManager;
  let mockAuthManager: MockAuthManager;
  let $: (selector: string) => HTMLElement | null;
  let $$: (selector: string) => NodeListOf<HTMLElement>;

  beforeEach(() => {
    // DOM 헬퍼 함수
    $ = vi.fn((selector: string) => {
      if (selector === '#app-root') {
        const el = document.createElement('div');
        el.id = 'app-root';
        document.body.appendChild(el);
        return el;
      }
      if (selector === '#auth-container') {
        const el = document.createElement('div');
        el.id = 'auth-container';
        el.className = 'hidden';
        document.body.appendChild(el);
        return el;
      }
      if (selector === '.mode-switch-btn') {
        const el = document.createElement('button');
        el.className = 'mode-switch-btn';
        el.dataset.mode = 'progress';
        document.body.appendChild(el);
        return el;
      }
      return null;
    });

    $$ = vi.fn((selector: string) => {
      if (selector === '.mode-switch-btn') {
        const buttons = [
          document.createElement('button'),
          document.createElement('button'),
          document.createElement('button'),
          document.createElement('button')
        ];
        buttons[0].className = 'mode-switch-btn';
        buttons[0].dataset.mode = 'progress';
        buttons[0].classList.add('active');
        buttons[1].className = 'mode-switch-btn';
        buttons[1].dataset.mode = 'league';
        buttons[2].className = 'mode-switch-btn';
        buttons[2].dataset.mode = 'tournament';
        buttons[3].className = 'mode-switch-btn';
        buttons[3].dataset.mode = 'paps';
        
        buttons.forEach(btn => document.body.appendChild(btn));
        
        return buttons as any as NodeListOf<HTMLElement>;
      }
      return document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
    });

    // StateManager 생성
    stateManager = createAppStateManager(getDefaultData(), {
      autoSave: false
    });

    // Mock Manager 인스턴스 생성
    mockLeagueManager = new MockLeagueManager() as any;
    mockTournamentManager = new MockTournamentManager() as any;
    mockPapsManager = new MockPapsManager() as any;
    mockProgressManager = new MockProgressManager() as any;
    mockAuthManager = new MockAuthManager() as any;

    // UIRenderer 생성
    uiRenderer = createUIRenderer({
      stateManager,
      managers: {
        leagueManager: mockLeagueManager as any,
        tournamentManager: mockTournamentManager as any,
        papsManager: mockPapsManager as any,
        progressManager: mockProgressManager as any,
        authManager: mockAuthManager as any
      },
      $,
      $$
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('초기화', () => {
    it('기본 옵션으로 초기화되어야 함', () => {
      expect(uiRenderer).toBeInstanceOf(UIRenderer);
    });

    it('기본 모드는 progress여야 함', () => {
      expect(uiRenderer.getMode()).toBe('progress');
    });
  });

  describe('모드 관리', () => {
    it('getMode가 현재 모드를 반환해야 함', () => {
      expect(uiRenderer.getMode()).toBe('progress');
    });

    it('setMode가 모드를 변경해야 함', () => {
      uiRenderer.setMode('league');
      expect(uiRenderer.getMode()).toBe('league');
    });

    it('switchMode가 모드를 변경하고 렌더링해야 함', () => {
      uiRenderer.switchMode('league');
      
      expect(uiRenderer.getMode()).toBe('league');
      expect(mockLeagueManager.renderLeagueUI).toHaveBeenCalled();
    });

    it('switchMode가 유효하지 않은 모드를 무시해야 함', () => {
      const initialMode = uiRenderer.getMode();
      uiRenderer.switchMode('invalid-mode');
      
      expect(uiRenderer.getMode()).toBe(initialMode);
    });
  });

  describe('initializeUI', () => {
    it('AuthManager가 있으면 updateLoginStatus를 호출해야 함', () => {
      uiRenderer.initializeUI();
      
      expect(mockAuthManager.updateLoginStatus).toHaveBeenCalled();
    });

    it('AuthManager가 없으면 로그인 화면을 표시해야 함', () => {
      // DOM 요소를 먼저 생성
      const authContainer = document.createElement('div');
      authContainer.id = 'auth-container';
      authContainer.className = 'hidden';
      document.body.appendChild(authContainer);
      
      const appRoot = document.createElement('div');
      appRoot.id = 'app-root';
      document.body.appendChild(appRoot);
      
      const $withElements = (selector: string) => {
        if (selector === '#auth-container') return authContainer;
        if (selector === '#app-root') return appRoot;
        return $(selector);
      };
      
      const rendererWithoutAuth = createUIRenderer({
        stateManager,
        managers: {
          leagueManager: mockLeagueManager as any,
          tournamentManager: mockTournamentManager as any,
          papsManager: mockPapsManager as any,
          progressManager: mockProgressManager as any
        },
        $: $withElements,
        $$
      });
      
      rendererWithoutAuth.initializeUI();
      
      expect(authContainer.classList.contains('hidden')).toBe(false);
      expect(appRoot.classList.contains('hidden')).toBe(true);
    });
  });

  describe('renderApp', () => {
    it('현재 모드에 따라 적절한 렌더링 메서드를 호출해야 함', () => {
      uiRenderer.setMode('progress');
      uiRenderer.renderApp();
      
      expect(mockProgressManager.renderProgressUI).toHaveBeenCalled();
    });

    it('league 모드일 때 renderLeagueUI를 호출해야 함', () => {
      uiRenderer.setMode('league');
      uiRenderer.renderApp();
      
      expect(mockLeagueManager.renderLeagueUI).toHaveBeenCalled();
    });

    it('tournament 모드일 때 renderTournamentUI를 호출해야 함', () => {
      uiRenderer.setMode('tournament');
      uiRenderer.renderApp();
      
      expect(mockTournamentManager.renderTournamentUI).toHaveBeenCalled();
    });

    it('paps 모드일 때 renderPapsUI를 호출해야 함', () => {
      uiRenderer.setMode('paps');
      uiRenderer.renderApp();
      
      expect(mockPapsManager.renderPapsUI).toHaveBeenCalled();
    });
  });

  describe('setupModeButtons', () => {
    it('모드 버튼에 이벤트 리스너를 등록해야 함', () => {
      // DOM에 버튼 추가
      const buttons = [
        document.createElement('button'),
        document.createElement('button')
      ];
      buttons[0].className = 'mode-switch-btn';
      buttons[0].dataset.mode = 'league';
      buttons[1].className = 'mode-switch-btn';
      buttons[1].dataset.mode = 'progress';
      buttons.forEach(btn => document.body.appendChild(btn));

      uiRenderer.setupModeButtons();

      // 클릭 이벤트 시뮬레이션
      const clickEvent = new MouseEvent('click', { bubbles: true });
      buttons[0].dispatchEvent(clickEvent);

      // switchMode가 호출되었는지 확인 (간접적으로 모드 변경 확인)
      expect(uiRenderer.getMode()).toBe('league');
    });

    it('버튼이 없어도 에러가 발생하지 않아야 함', () => {
      document.body.innerHTML = '';
      
      expect(() => {
        uiRenderer.setupModeButtons();
      }).not.toThrow();
    });
  });

  describe('데이터 동기화', () => {
    it('renderLeagueMode가 Manager에 데이터를 전달해야 함', () => {
      const state = stateManager.getState();
      uiRenderer.setMode('league');
      uiRenderer.renderApp();
      
      expect(mockLeagueManager.setLeagueData).toHaveBeenCalledWith(state.leagues);
      expect(mockLeagueManager.renderLeagueUI).toHaveBeenCalled();
    });

    it('renderTournamentMode가 Manager에 데이터를 전달해야 함', () => {
      const state = stateManager.getState();
      uiRenderer.setMode('tournament');
      uiRenderer.renderApp();
      
      expect(mockTournamentManager.setTournamentData).toHaveBeenCalledWith(state.tournaments);
      expect(mockTournamentManager.renderTournamentUI).toHaveBeenCalled();
    });

    it('renderPapsMode가 Manager에 데이터를 전달해야 함', () => {
      const state = stateManager.getState();
      uiRenderer.setMode('paps');
      uiRenderer.renderApp();
      
      expect(mockPapsManager.setPapsData).toHaveBeenCalledWith(state.paps);
      expect(mockPapsManager.renderPapsUI).toHaveBeenCalled();
    });

    it('Manager가 없어도 에러가 발생하지 않아야 함', () => {
      const rendererWithoutManager = createUIRenderer({
        stateManager,
        managers: {},
        $,
        $$
      });
      
      rendererWithoutManager.setMode('league');
      
      expect(() => {
        rendererWithoutManager.renderApp();
      }).not.toThrow();
    });
  });

  describe('에러 처리', () => {
    it('렌더링 중 에러가 발생해도 앱이 중단되지 않아야 함', () => {
      mockProgressManager.renderProgressUI.mockImplementation(() => {
        throw new Error('Render error');
      });
      
      uiRenderer.setMode('progress');
      
      expect(() => {
        uiRenderer.renderApp();
      }).not.toThrow();
    });
  });
});

