/**
 * DataManager 모듈 테스트
 * 
 * 데이터 저장/로드 로직의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataManager, AppData } from './dataManager.js';

describe('DataManager 모듈', () => {
  let dataManager: DataManager;
  let mockFirebase: any;

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
    
    // localStorage Mock 초기화
    localStorage.clear();
    vi.clearAllMocks();
    
    // Firebase Mock
    mockFirebase = {
      db: {},
      auth: {
        currentUser: null
      },
      doc: vi.fn(),
      getDoc: vi.fn(),
      setDoc: vi.fn(),
      collection: vi.fn()
    };

    (window as any).firebase = mockFirebase;
    
    // DataManager 인스턴스 생성
    dataManager = new DataManager();
  });

  describe('getDefaultData', () => {
    it('기본 데이터 구조를 반환해야 함', () => {
      const defaultData = dataManager.getDefaultData();
      
      expect(defaultData).toBeDefined();
      expect(defaultData.leagues).toBeDefined();
      expect(defaultData.tournaments).toBeDefined();
      expect(defaultData.paps).toBeDefined();
      expect(defaultData.progress).toBeDefined();
      expect(defaultData.lastUpdated).toBeDefined();
    });

    it('기본 데이터에 올바른 구조가 있어야 함', () => {
      const defaultData = dataManager.getDefaultData();
      
      expect(defaultData.leagues.classes).toEqual([]);
      expect(defaultData.leagues.students).toEqual([]);
      expect(defaultData.leagues.games).toEqual([]);
      expect(defaultData.leagues.selectedClassId).toBeNull();
      
      expect(defaultData.tournaments.tournaments).toEqual([]);
      expect(defaultData.tournaments.activeTournamentId).toBeNull();
      
      expect(defaultData.paps.classes).toEqual([]);
      expect(defaultData.paps.activeClassId).toBeNull();
      
      expect(defaultData.progress.classes).toEqual([]);
      expect(defaultData.progress.selectedClassId).toBe('');
    });
  });

  describe('validateLoadedData', () => {
    it('유효한 데이터는 정상적으로 검증되어야 함', () => {
      const validData: AppData = {
        leagues: {
          classes: [],
          students: [],
          games: [],
          selectedClassId: null
        },
        tournaments: {
          tournaments: [],
          activeTournamentId: null
        },
        paps: {
          classes: [],
          activeClassId: null
        },
        progress: {
          classes: [],
          selectedClassId: ''
        },
        lastUpdated: Date.now()
      };

      const result = dataManager.validateLoadedData(validData);
      
      expect(result).toBe(true);
    });

    it('누락된 필드는 기본값으로 채워져야 함', () => {
      const incompleteData: any = {
        leagues: null
      };

      const result = dataManager.validateLoadedData(incompleteData);
      
      expect(result).toBe(true);
      expect(incompleteData.leagues).toBeDefined();
      expect(incompleteData.tournaments).toBeDefined();
      expect(incompleteData.paps).toBeDefined();
      expect(incompleteData.progress).toBeDefined();
    });

    it('배열이 아닌 필드는 빈 배열로 초기화되어야 함', () => {
      const invalidData: any = {
        leagues: {
          classes: 'invalid',
          students: [],
          games: [],
          selectedClassId: null
        },
        tournaments: {
          tournaments: null,
          activeTournamentId: null
        },
        paps: {
          classes: undefined,
          activeClassId: null
        },
        progress: {
          classes: {},
          selectedClassId: ''
        },
        lastUpdated: Date.now()
      };

      dataManager.validateLoadedData(invalidData);
      
      expect(Array.isArray(invalidData.leagues.classes)).toBe(true);
      expect(Array.isArray(invalidData.tournaments.tournaments)).toBe(true);
      expect(Array.isArray(invalidData.paps.classes)).toBe(true);
      expect(Array.isArray(invalidData.progress.classes)).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('초기 상태에서는 null을 반환해야 함', () => {
      expect(dataManager.getCurrentUser()).toBeNull();
    });

    it('사용자를 설정한 후 반환해야 함', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      };

      dataManager.setCurrentUser(mockUser);
      
      expect(dataManager.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('setCurrentUser', () => {
    it('사용자 정보를 설정할 수 있어야 함', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null
      };

      dataManager.setCurrentUser(mockUser);
      
      expect(dataManager.getCurrentUser()).toEqual(mockUser);
    });

    it('null을 설정하여 사용자를 초기화할 수 있어야 함', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: null,
        photoURL: null
      };

      dataManager.setCurrentUser(mockUser);
      expect(dataManager.getCurrentUser()).toEqual(mockUser);
      
      dataManager.setCurrentUser(null);
      expect(dataManager.getCurrentUser()).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('리소스가 정리되어야 함', () => {
      // 디바운스 타이머 설정 시뮬레이션
      dataManager.saveDataToFirestore(dataManager.getDefaultData());
      
      expect(() => {
        dataManager.cleanup();
      }).not.toThrow();
    });
  });

  describe('saveToLocalStorage', () => {
    it('데이터를 LocalStorage에 저장해야 함', async () => {
      const testData = dataManager.getDefaultData();
      
      // 사용자가 로그인하지 않은 상태에서 saveDataToFirestore를 호출하면
      // 즉시 LocalStorage에 저장됨 (디바운스 없이)
      // currentUser는 이미 null이므로 직접 저장됨
      await dataManager.saveDataToFirestore(testData);
      
      // LocalStorage에 저장 확인 (개별 키로 저장됨)
      const storedLeagues = localStorage.getItem('leagueData');
      const storedTournaments = localStorage.getItem('tournamentData');
      const storedPaps = localStorage.getItem('papsData');
      const storedProgress = localStorage.getItem('progressData');
      
      expect(storedLeagues).toBeTruthy();
      expect(storedTournaments).toBeTruthy();
      expect(storedPaps).toBeTruthy();
      expect(storedProgress).toBeTruthy();
      
      // 저장된 데이터가 올바른지 확인
      const parsedLeagues = JSON.parse(storedLeagues!);
      expect(parsedLeagues).toEqual(testData.leagues);
    });
  });
});

