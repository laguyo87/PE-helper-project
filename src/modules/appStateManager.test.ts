/**
 * AppStateManager 모듈 테스트
 * 
 * 앱 상태 관리자의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAppStateManager, AppStateManager } from './appStateManager.js';
import { getDefaultData } from './utils.js';

describe('AppStateManager', () => {
  let stateManager: AppStateManager;
  let saveCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    saveCallback = vi.fn().mockResolvedValue(undefined);
    stateManager = createAppStateManager(getDefaultData(), {
      autoSave: true,
      saveCallback,
    });
  });

  describe('초기화', () => {
    it('기본 데이터로 초기화되어야 함', () => {
      const state = stateManager.getState();
      
      expect(state.leagues).toBeDefined();
      expect(state.tournaments).toBeDefined();
      expect(state.paps).toBeDefined();
      expect(state.progress).toBeDefined();
    });

    it('커스텀 초기 데이터로 초기화할 수 있어야 함', () => {
      const customData = {
        leagues: {
          classes: [{ id: 1, name: 'Test Class' }],
          students: [],
          games: [],
          selectedClassId: 1,
        },
        tournaments: {
          tournaments: [],
          activeTournamentId: null,
        },
        paps: {
          classes: [],
          activeClassId: null,
        },
        progress: {
          classes: [],
          selectedClassId: null,
        },
      };

      const customManager = createAppStateManager(customData);
      const state = customManager.getState();
      
      expect(state.leagues.classes).toHaveLength(1);
      expect(state.leagues.selectedClassId).toBe(1);
    });
  });

  describe('상태 조회', () => {
    it('getState()가 현재 상태를 반환해야 함', () => {
      const state = stateManager.getState();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('상태 변경 후 getState()가 새로운 상태를 반환해야 함', () => {
      const newLeagues = {
        classes: [{ id: 1 }],
        students: [],
        games: [],
        selectedClassId: 1,
      };

      stateManager.setLeagues(newLeagues);
      const state = stateManager.getState();
      
      expect(state.leagues.classes).toHaveLength(1);
      expect(state.leagues.selectedClassId).toBe(1);
    });
  });

  describe('상태 변경', () => {
    it('setLeagues()가 leagues 상태를 변경해야 함', () => {
      const newLeagues = {
        classes: [{ id: 1, name: 'New Class' }],
        students: [],
        games: [],
        selectedClassId: 1,
      };

      stateManager.setLeagues(newLeagues);
      const state = stateManager.getState();
      
      expect(state.leagues.classes).toHaveLength(1);
      expect(state.leagues.classes[0].name).toBe('New Class');
    });

    it('setTournaments()가 tournaments 상태를 변경해야 함', () => {
      const newTournaments = {
        tournaments: [{ id: 1, name: 'New Tournament' }],
        activeTournamentId: 1,
      };

      stateManager.setTournaments(newTournaments);
      const state = stateManager.getState();
      
      expect(state.tournaments.tournaments).toHaveLength(1);
      expect(state.tournaments.activeTournamentId).toBe(1);
    });

    it('setPaps()가 paps 상태를 변경해야 함', () => {
      const newPaps = {
        classes: [{ id: 1, name: 'New Paps Class' }],
        activeClassId: 1,
      };

      stateManager.setPaps(newPaps);
      const state = stateManager.getState();
      
      expect(state.paps.classes).toHaveLength(1);
      expect(state.paps.activeClassId).toBe(1);
    });

    it('setProgress()가 progress 상태를 변경해야 함', () => {
      const newProgress = {
        classes: [{ id: '1', name: 'New Progress Class' }],
        selectedClassId: '1',
      };

      stateManager.setProgress(newProgress);
      const state = stateManager.getState();
      
      expect(state.progress.classes).toHaveLength(1);
      expect(state.progress.selectedClassId).toBe('1');
    });
  });

  describe('자동 저장', () => {
    it('autoSave가 true일 때 상태 변경 시 saveCallback이 호출되어야 함', async () => {
      const newLeagues = {
        classes: [],
        students: [],
        games: [],
        selectedClassId: null,
      };

      stateManager.setLeagues(newLeagues);
      
      // debounce 대기 (500ms + 여유)
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(saveCallback).toHaveBeenCalled();
    });

    it('autoSave가 false일 때 상태 변경 시 saveCallback이 호출되지 않아야 함', async () => {
      const noAutoSaveManager = createAppStateManager(getDefaultData(), {
        autoSave: false,
        saveCallback,
      });

      const newLeagues = {
        classes: [],
        students: [],
        games: [],
        selectedClassId: null,
      };

      noAutoSaveManager.setLeagues(newLeagues);
      
      // 충분한 시간 대기
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(saveCallback).not.toHaveBeenCalled();
    });
  });

  describe('즉시 저장', () => {
    it('saveImmediate()가 saveCallback을 즉시 호출해야 함', async () => {
      await stateManager.saveImmediate();
      
      expect(saveCallback).toHaveBeenCalled();
    });
  });

  describe('변경 콜백', () => {
    it('onChangeCallbacks가 상태 변경 시 호출되어야 함', () => {
      const leaguesCallback = vi.fn();
      const tournamentsCallback = vi.fn();
      const papsCallback = vi.fn();
      const progressCallback = vi.fn();

      const callbackManager = createAppStateManager(getDefaultData(), {
        onChangeCallbacks: {
          leagues: leaguesCallback,
          tournaments: tournamentsCallback,
          paps: papsCallback,
          progress: progressCallback,
        },
      });

      callbackManager.setLeagues({
        classes: [],
        students: [],
        games: [],
        selectedClassId: null,
      });

      callbackManager.setTournaments({
        tournaments: [],
        activeTournamentId: null,
      });

      callbackManager.setPaps({
        classes: [],
        activeClassId: null,
      });

      callbackManager.setProgress({
        classes: [],
        selectedClassId: null,
      });

      expect(leaguesCallback).toHaveBeenCalled();
      expect(tournamentsCallback).toHaveBeenCalled();
      expect(papsCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalled();
    });
  });
});

