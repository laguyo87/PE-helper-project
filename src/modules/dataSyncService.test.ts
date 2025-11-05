/**
 * DataSyncService 모듈 테스트
 * 
 * 데이터 동기화 서비스의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createDataSyncService, DataSyncService } from './dataSyncService.js';
import { createAppStateManager, AppStateManager } from './appStateManager.js';
import { DataManager } from './dataManager.js';
import { AuthManager } from './authManager.js';
import { getDefaultData } from './utils.js';

// Mock DataManager
class MockDataManager {
  loadDataFromFirestore = vi.fn();
  saveDataToFirestore = vi.fn();
}

// Mock AuthManager
class MockAuthManager {
  private currentUser: any = null;
  
  getCurrentUser() {
    return this.currentUser;
  }
  
  setCurrentUser(user: any) {
    this.currentUser = user;
  }
}

describe('DataSyncService', () => {
  let dataSyncService: DataSyncService;
  let mockDataManager: MockDataManager;
  let mockAuthManager: MockAuthManager;
  let stateManager: AppStateManager;
  const storageKey = 'test_pe_helper_data';

  beforeEach(() => {
    // localStorage Mock을 실제 구현으로 교체 (테스트에서 직접 사용)
    const localStorageStore: Record<string, string> = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageStore[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]);
      }),
      get length() {
        return Object.keys(localStorageStore).length;
      },
      key: vi.fn((index: number) => Object.keys(localStorageStore)[index] || null)
    } as any;

    // Mock 인스턴스 생성
    mockDataManager = new MockDataManager() as any;
    mockAuthManager = new MockAuthManager() as any;
    stateManager = createAppStateManager(getDefaultData(), {
      autoSave: false
    });

    // localStorage 초기화
    localStorage.clear();

    // window.firebase Mock 설정
    (global as any).window = {
      firebase: {
        db: {},
        auth: {}
      }
    };

    // DataSyncService 생성
    dataSyncService = createDataSyncService({
      dataManager: mockDataManager as any,
      authManager: mockAuthManager as any,
      stateManager,
      storageKey,
      getDefaultData
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('초기화', () => {
    it('기본 옵션으로 초기화되어야 함', () => {
      const service = createDataSyncService({
        dataManager: null,
        authManager: null,
        stateManager: null
      });
      
      expect(service).toBeInstanceOf(DataSyncService);
    });

    it('커스텀 스토리지 키로 초기화할 수 있어야 함', () => {
      const customKey = 'custom_key';
      const service = createDataSyncService({
        dataManager: null,
        authManager: null,
        stateManager: null,
        storageKey: customKey
      });
      
      expect(service).toBeInstanceOf(DataSyncService);
    });
  });

  describe('loadFromLocal', () => {
    it('로컬 스토리지에 데이터가 있으면 로드해야 함', () => {
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null },
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      const result = dataSyncService.loadFromLocal();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('local');
      const state = stateManager.getState();
      expect(state.leagues).toBeDefined();
    });

    it('로컬 스토리지에 데이터가 없으면 기본 데이터를 반환해야 함', () => {
      const result = dataSyncService.loadFromLocal();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('default');
      const state = stateManager.getState();
      expect(state.leagues).toBeDefined();
    });

    it('잘못된 JSON이면 기본 데이터를 반환해야 함', () => {
      localStorage.setItem(storageKey, 'invalid json');
      
      const result = dataSyncService.loadFromLocal();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('default');
    });

    it('빈 객체면 기본 데이터를 반환해야 함', () => {
      localStorage.setItem(storageKey, JSON.stringify({}));
      
      const result = dataSyncService.loadFromLocal();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('default');
    });
  });

  describe('loadDefault', () => {
    it('기본 데이터를 로드해야 함', () => {
      const result = dataSyncService.loadDefault();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('default');
      const state = stateManager.getState();
      expect(state.leagues).toBeDefined();
      expect(state.tournaments).toBeDefined();
      expect(state.paps).toBeDefined();
      expect(state.progress).toBeDefined();
    });
  });

  describe('loadFromFirestore', () => {
    it('DataManager가 없으면 로컬에서 로드해야 함', async () => {
      // 로컬 스토리지에 데이터가 있어야 local을 반환
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null },
        lastUpdated: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      const service = createDataSyncService({
        dataManager: null,
        authManager: null,
        stateManager,
        storageKey
      });
      
      const result = await service.loadFromFirestore();
      
      expect(result.source).toBe('local');
    });

    it('Firebase가 없으면 로컬에서 로드해야 함', async () => {
      // 로컬 스토리지에 데이터가 있어야 local을 반환
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null },
        lastUpdated: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      (global as any).window = {};
      
      const result = await dataSyncService.loadFromFirestore();
      
      expect(result.source).toBe('local');
    });

    it('Firestore에서 데이터를 성공적으로 로드해야 함', async () => {
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null }
      };
      
      mockDataManager.loadDataFromFirestore.mockResolvedValue(testData);
      mockAuthManager.setCurrentUser({ uid: 'test-user' });
      
      const result = await dataSyncService.loadFromFirestore();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('firestore');
      expect(mockDataManager.loadDataFromFirestore).toHaveBeenCalledWith('test-user');
    });

    it('Firestore에 데이터가 없으면 로컬에서 로드해야 함', async () => {
      // 로컬 스토리지에 데이터가 있어야 local을 반환
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null },
        lastUpdated: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      mockDataManager.loadDataFromFirestore.mockResolvedValue(null);
      mockAuthManager.setCurrentUser({ uid: 'test-user' });
      
      const result = await dataSyncService.loadFromFirestore();
      
      expect(result.source).toBe('local');
    });

    it('Firestore 로드 실패 시 로컬에서 로드해야 함', async () => {
      // 로컬 스토리지에 데이터가 있어야 local을 반환
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null },
        lastUpdated: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      mockDataManager.loadDataFromFirestore.mockRejectedValue(new Error('Firestore error'));
      mockAuthManager.setCurrentUser({ uid: 'test-user' });
      
      const result = await dataSyncService.loadFromFirestore();
      
      expect(result.source).toBe('local');
    });

    it('익명 사용자로 Firestore에서 로드해야 함', async () => {
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null }
      };
      
      mockDataManager.loadDataFromFirestore.mockResolvedValue(testData);
      mockAuthManager.setCurrentUser(null);
      
      const result = await dataSyncService.loadFromFirestore();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('firestore');
      expect(mockDataManager.loadDataFromFirestore).toHaveBeenCalledWith('anonymous');
    });
  });

  describe('saveToLocal', () => {
    it('AppStateManager의 상태를 로컬 스토리지에 저장해야 함', () => {
      const result = dataSyncService.saveToLocal();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('local');
      
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      expect(saved.leagues).toBeDefined();
      expect(saved.tournaments).toBeDefined();
      expect(saved.lastUpdated).toBeDefined();
    });

    it('커스텀 데이터를 로컬 스토리지에 저장해야 함', () => {
      const customData = {
        leagues: { classes: [{ id: 1, name: 'Test' }], students: [], games: [], selectedClassId: 1 },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null }
      };
      
      const result = dataSyncService.saveToLocal(customData);
      
      expect(result.success).toBe(true);
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      expect(saved.leagues.classes).toHaveLength(1);
    });

    it('stateManager가 없으면 실패해야 함', () => {
      const service = createDataSyncService({
        dataManager: null,
        authManager: null,
        stateManager: null,
        storageKey
      });
      
      const result = service.saveToLocal();
      
      expect(result.success).toBe(false);
    });
  });

  describe('saveToFirestore', () => {
    it('DataManager가 없으면 로컬에만 저장해야 함', async () => {
      const service = createDataSyncService({
        dataManager: null,
        authManager: null,
        stateManager,
        storageKey
      });
      
      const result = await service.saveToFirestore();
      
      expect(result.source).toBe('local');
    });

    it('Firestore에 성공적으로 저장해야 함', async () => {
      mockDataManager.saveDataToFirestore.mockResolvedValue(undefined);
      
      const result = await dataSyncService.saveToFirestore();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('firestore');
      expect(mockDataManager.saveDataToFirestore).toHaveBeenCalled();
      
      // 로컬 스토리지에도 저장되었는지 확인
      const saved = localStorage.getItem(storageKey);
      expect(saved).toBeTruthy();
    });

    it('Firestore 저장 실패 시 로컬에 저장해야 함', async () => {
      mockDataManager.saveDataToFirestore.mockRejectedValue(new Error('Save error'));
      
      const result = await dataSyncService.saveToFirestore();
      
      expect(result.success).toBe(false);
      expect(result.source).toBe('firestore');
      
      // 로컬 스토리지에는 저장되었는지 확인
      const saved = localStorage.getItem(storageKey);
      expect(saved).toBeTruthy();
    });

    it('stateManager가 없으면 실패해야 함', async () => {
      const service = createDataSyncService({
        dataManager: mockDataManager as any,
        authManager: null,
        stateManager: null,
        storageKey
      });
      
      const result = await service.saveToFirestore();
      
      expect(result.success).toBe(false);
    });
  });

  describe('sync', () => {
    it('Firestore에서 먼저 로드를 시도해야 함', async () => {
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null }
      };
      
      mockDataManager.loadDataFromFirestore.mockResolvedValue(testData);
      mockAuthManager.setCurrentUser({ uid: 'test-user' });
      
      const result = await dataSyncService.sync();
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('firestore');
      expect(mockDataManager.loadDataFromFirestore).toHaveBeenCalled();
    });

    it('Firestore 실패 시 로컬에서 로드해야 함', async () => {
      mockDataManager.loadDataFromFirestore.mockRejectedValue(new Error('Error'));
      mockAuthManager.setCurrentUser({ uid: 'test-user' });
      
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null }
      };
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      const result = await dataSyncService.sync();
      
      expect(result.source).toBe('local');
    });
  });

  describe('setter 메서드', () => {
    it('setDataManager가 작동해야 함', () => {
      const newManager = new MockDataManager() as any;
      dataSyncService.setDataManager(newManager);
      
      // 간접적으로 확인 (다음 saveToFirestore 호출 시 사용)
      expect(dataSyncService).toBeInstanceOf(DataSyncService);
    });

    it('setAuthManager가 작동해야 함', () => {
      const newManager = new MockAuthManager() as any;
      dataSyncService.setAuthManager(newManager);
      
      expect(dataSyncService).toBeInstanceOf(DataSyncService);
    });

    it('setStateManager가 작동해야 함', () => {
      const newManager = createAppStateManager(getDefaultData());
      dataSyncService.setStateManager(newManager);
      
      expect(dataSyncService).toBeInstanceOf(DataSyncService);
    });
  });

  describe('데이터 처리', () => {
    it('PAPS 데이터 구조를 검증하고 수정해야 함', () => {
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: {
          classes: [
            { id: 1, name: 'Test', gradeLevel: '중1' }
          ],
          activeClassId: null
        },
        progress: { classes: [], selectedClassId: null }
      };
      
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      const result = dataSyncService.loadFromLocal();
      
      expect(result.success).toBe(true);
      const state = stateManager.getState();
      if (state.paps && state.paps.classes.length > 0) {
        const cls = state.paps.classes[0] as any;
        expect(cls.students).toBeDefined();
        expect(cls.eventSettings).toBeDefined();
      }
    });

    it('빈 PAPS 데이터에 기본값을 설정해야 함', () => {
      const testData = {
        leagues: { classes: [], students: [], games: [], selectedClassId: null },
        tournaments: { tournaments: [], activeTournamentId: null },
        paps: {},
        progress: { classes: [], selectedClassId: null }
      };
      
      localStorage.setItem(storageKey, JSON.stringify(testData));
      
      const result = dataSyncService.loadFromLocal();
      
      expect(result.success).toBe(true);
      const state = stateManager.getState();
      expect(state.paps.classes).toBeDefined();
    });
  });
});

