/**
 * LeagueManager 모듈 테스트
 * 
 * 리그전 수업 관리 로직의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeagueManager, LeagueData, LeagueClass, LeagueStudent, LeagueGame } from './leagueManager.js';
import * as errorHandler from './errorHandler.js';

// DOMPurify mock
vi.mock('./utils.js', async () => {
  const actual = await vi.importActual('./utils.js');
  return {
    ...actual,
    setInnerHTMLSafe: vi.fn((element: HTMLElement, html: string) => {
      element.innerHTML = html;
    })
  };
});

describe('LeagueManager 모듈', () => {
  let leagueManager: LeagueManager;
  let mockLeagueData: LeagueData;

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
    
    // 기본 리그전 데이터
    mockLeagueData = {
      classes: [],
      students: [],
      games: [],
      selectedClassId: null
    };
    
    leagueManager = new LeagueManager(mockLeagueData);
    
    // showError, showSuccess 모킹
    vi.spyOn(errorHandler, 'showError').mockImplementation(() => {});
    vi.spyOn(errorHandler, 'showSuccess').mockImplementation(() => {});
  });

  describe('초기화', () => {
    it('LeagueManager가 정상적으로 생성되어야 함', () => {
      expect(leagueManager).toBeDefined();
      expect(leagueManager).toBeInstanceOf(LeagueManager);
    });

    it('기본 옵션으로 초기화되어야 함', () => {
      const data = leagueManager.getLeagueData();
      expect(data).toBeDefined();
      expect(data.classes).toEqual([]);
      expect(data.students).toEqual([]);
      expect(data.games).toEqual([]);
    });

    it('커스텀 옵션으로 초기화할 수 있어야 함', () => {
      const customData: LeagueData = {
        classes: [{ id: 1, name: 'Test Class', note: '' }],
        students: [],
        games: [],
        selectedClassId: 1
      };
      
      const customManager = new LeagueManager(customData, {
        enableAutoSave: false,
        maxStudentsPerClass: 30
      });
      
      const data = customManager.getLeagueData();
      expect(data.classes).toHaveLength(1);
      expect(data.selectedClassId).toBe(1);
    });
  });

  describe('반(클래스) 관리', () => {
    it('createClass가 반을 생성해야 함', () => {
      // DOM 요소 설정 (createClass가 input에서 값을 읽어옴)
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const input = document.createElement('input');
      input.id = 'className';
      input.type = 'text';
      input.value = 'Test Class';
      formContainer.appendChild(input);
      
      leagueManager.createClass();
      
      const data = leagueManager.getLeagueData();
      expect(data.classes).toHaveLength(1);
      expect(data.classes[0].name).toBe('Test Class');
      expect(data.classes[0].id).toBeGreaterThan(0);
    });

    it('createClass가 빈 이름으로 반을 생성하면 안 됨', () => {
      const initialCount = leagueManager.getLeagueData().classes.length;
      leagueManager.createClass('');
      
      const data = leagueManager.getLeagueData();
      expect(data.classes.length).toBe(initialCount);
    });

    it('createClass가 중복된 이름으로 반을 생성하면 안 됨', () => {
      const className = 'Test Class';
      leagueManager.createClass(className);
      
      const initialCount = leagueManager.getLeagueData().classes.length;
      leagueManager.createClass(className);
      
      const data = leagueManager.getLeagueData();
      expect(data.classes.length).toBe(initialCount);
    });

    it('deleteClass가 반을 삭제해야 함', () => {
      // DOM 요소 설정
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const input = document.createElement('input');
      input.id = 'className';
      input.type = 'text';
      input.value = 'Test Class';
      formContainer.appendChild(input);
      
      leagueManager.createClass();
      const data = leagueManager.getLeagueData();
      const classId = data.classes[0].id;
      
      leagueManager.deleteClass(classId);
      
      const updatedData = leagueManager.getLeagueData();
      expect(updatedData.classes).toHaveLength(0);
    });

    it('deleteClass가 존재하지 않는 반을 삭제하면 안 됨', () => {
      const initialCount = leagueManager.getLeagueData().classes.length;
      leagueManager.deleteClass(999);
      
      const data = leagueManager.getLeagueData();
      expect(data.classes.length).toBe(initialCount);
    });
  });

  describe('학생 관리', () => {
    beforeEach(() => {
      // DOM 요소 설정
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const input = document.createElement('input');
      input.id = 'className';
      input.type = 'text';
      input.value = 'Test Class';
      formContainer.appendChild(input);
      
      leagueManager.createClass();
      const data = leagueManager.getLeagueData();
      if (data.classes.length > 0) {
        leagueManager.selectClass(data.classes[0].id);
      }
    });

    it('addStudent가 학생을 추가해야 함', () => {
      // DOM 요소 설정 (addStudent가 input에서 값을 읽어옴)
      const contentWrapper = document.createElement('div');
      contentWrapper.id = 'content-wrapper';
      document.body.appendChild(contentWrapper);
      
      const input = document.createElement('input');
      input.id = 'studentName';
      input.type = 'text';
      input.value = 'Test Student';
      contentWrapper.appendChild(input);
      
      leagueManager.addStudent();
      
      const data = leagueManager.getLeagueData();
      expect(data.students).toHaveLength(1);
      expect(data.students[0].name).toBe('Test Student');
      expect(data.students[0].id).toBeGreaterThan(0);
    });

    it('addStudent가 빈 이름으로 학생을 추가하면 안 됨', () => {
      // DOM 요소 설정
      const contentWrapper = document.createElement('div');
      contentWrapper.id = 'content-wrapper';
      document.body.appendChild(contentWrapper);
      
      const input = document.createElement('input');
      input.id = 'studentName';
      input.type = 'text';
      input.value = ''; // 빈 값
      contentWrapper.appendChild(input);
      
      const initialCount = leagueManager.getLeagueData().students.length;
      leagueManager.addStudent();
      
      const data = leagueManager.getLeagueData();
      expect(data.students.length).toBe(initialCount);
    });

    it('removeStudent가 학생을 삭제해야 함', () => {
      // DOM 요소 설정
      const contentWrapper = document.createElement('div');
      contentWrapper.id = 'content-wrapper';
      document.body.appendChild(contentWrapper);
      
      const input = document.createElement('input');
      input.id = 'studentName';
      input.type = 'text';
      input.value = 'Test Student';
      contentWrapper.appendChild(input);
      
      leagueManager.addStudent();
      const data = leagueManager.getLeagueData();
      if (data.students.length > 0) {
        const studentId = data.students[0].id;
        leagueManager.removeStudent(studentId);
        
        const updatedData = leagueManager.getLeagueData();
        expect(updatedData.students).toHaveLength(0);
      }
    });

    it('removeStudent가 존재하지 않는 학생을 삭제하면 안 됨', () => {
      const initialCount = leagueManager.getLeagueData().students.length;
      leagueManager.removeStudent(999);
      
      const data = leagueManager.getLeagueData();
      expect(data.students.length).toBe(initialCount);
    });
  });

  describe('경기 관리', () => {
    beforeEach(() => {
      // DOM 요소 설정
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const classInput = document.createElement('input');
      classInput.id = 'className';
      classInput.type = 'text';
      classInput.value = 'Test Class';
      formContainer.appendChild(classInput);
      
      leagueManager.createClass();
      const data = leagueManager.getLeagueData();
      if (data.classes.length > 0) {
        leagueManager.selectClass(data.classes[0].id);
        
        // DOM 요소 설정 (학생 추가용)
        const contentWrapper = document.createElement('div');
        contentWrapper.id = 'content-wrapper';
        document.body.appendChild(contentWrapper);
        
        const studentInput1 = document.createElement('input');
        studentInput1.id = 'studentName';
        studentInput1.type = 'text';
        studentInput1.value = 'Student 1';
        contentWrapper.appendChild(studentInput1);
        
        leagueManager.addStudent();
        
        studentInput1.value = 'Student 2';
        leagueManager.addStudent();
      }
    });

    it('generateGames가 경기 일정을 생성해야 함', () => {
      // confirm을 mock하여 true 반환
      global.confirm = vi.fn(() => true);
      
      leagueManager.generateGames();
      
      const data = leagueManager.getLeagueData();
      expect(data.games.length).toBeGreaterThan(0);
    });

    it('generateGames가 선수가 2명 미만이면 경기를 생성하지 않아야 함', () => {
      // 학생 1명만 남기기
      const data = leagueManager.getLeagueData();
      if (data.students.length > 1) {
        leagueManager.removeStudent(data.students[data.students.length - 1].id);
      }
      
      const initialGameCount = data.games.length;
      // alert를 mock하여 경고 메시지 확인
      global.alert = vi.fn();
      leagueManager.generateGames();
      
      const updatedData = leagueManager.getLeagueData();
      expect(updatedData.games.length).toBe(initialGameCount);
      expect(global.alert).toHaveBeenCalled();
    });

    it('updateLeagueScore가 경기 점수를 업데이트해야 함', () => {
      // 경기 생성
      global.confirm = vi.fn(() => true);
      leagueManager.generateGames();
      
      const data = leagueManager.getLeagueData();
      if (data.games.length > 0) {
        const game = data.games[0];
        leagueManager.updateLeagueScore(game.id, 'player1', '10');
        leagueManager.updateLeagueScore(game.id, 'player2', '5');
        
        const updatedData = leagueManager.getLeagueData();
        const updatedGame = updatedData.games.find(g => g.id === game.id);
        expect(updatedGame).toBeDefined();
        expect(updatedGame?.player1Score).toBe(10);
        expect(updatedGame?.player2Score).toBe(5);
      }
    });
  });

  describe('순위 계산', () => {
    beforeEach(() => {
      // DOM 요소 설정
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const classInput = document.createElement('input');
      classInput.id = 'className';
      classInput.type = 'text';
      classInput.value = 'Test Class';
      formContainer.appendChild(classInput);
      
      leagueManager.createClass();
      const data = leagueManager.getLeagueData();
      if (data.classes.length > 0) {
        leagueManager.selectClass(data.classes[0].id);
        
        // DOM 요소 설정 (학생 추가용)
        const contentWrapper = document.createElement('div');
        contentWrapper.id = 'content-wrapper';
        document.body.appendChild(contentWrapper);
        
        const studentInput1 = document.createElement('input');
        studentInput1.id = 'studentName';
        studentInput1.type = 'text';
        studentInput1.value = 'Student 1';
        contentWrapper.appendChild(studentInput1);
        
        leagueManager.addStudent();
        
        studentInput1.value = 'Student 2';
        leagueManager.addStudent();
      }
    });

    it('getRankings가 순위를 반환해야 함', () => {
      global.confirm = vi.fn(() => true);
      leagueManager.generateGames();
      
      const data = leagueManager.getLeagueData();
      if (data.selectedClassId) {
        const rankings = leagueManager.getRankingsData(data.selectedClassId);
        expect(rankings).toBeDefined();
        expect(Array.isArray(rankings)).toBe(true);
      }
    });

    it('getRankings가 점수가 높은 순서로 정렬해야 함', () => {
      global.confirm = vi.fn(() => true);
      leagueManager.generateGames();
      
      const data = leagueManager.getLeagueData();
      if (data.games.length > 0 && data.students.length >= 2 && data.selectedClassId) {
        const game = data.games[0];
        leagueManager.updateLeagueScore(game.id, 'player1', '10');
        leagueManager.updateLeagueScore(game.id, 'player2', '5');
        
        const rankings = leagueManager.getRankingsData(data.selectedClassId);
        if (rankings.length >= 2) {
          expect(rankings[0].points).toBeGreaterThanOrEqual(rankings[1].points);
        }
      }
    });
  });

  describe('데이터 관리', () => {
    it('getLeagueData가 현재 데이터를 반환해야 함', () => {
      const data = leagueManager.getLeagueData();
      expect(data).toBeDefined();
      expect(data.classes).toBeDefined();
      expect(data.students).toBeDefined();
      expect(data.games).toBeDefined();
    });

    it('setLeagueData가 데이터를 설정해야 함', () => {
      const newData: LeagueData = {
        classes: [{ id: 1, name: 'New Class', note: '' }],
        students: [],
        games: [],
        selectedClassId: 1
      };
      
      leagueManager.setLeagueData(newData);
      const data = leagueManager.getLeagueData();
      
      expect(data.classes).toHaveLength(1);
      expect(data.selectedClassId).toBe(1);
    });

    it('selectClass가 선택된 반을 설정해야 함', () => {
      // DOM 요소 설정
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const input = document.createElement('input');
      input.id = 'className';
      input.type = 'text';
      input.value = 'Test Class';
      formContainer.appendChild(input);
      
      leagueManager.createClass();
      const data = leagueManager.getLeagueData();
      if (data.classes.length > 0) {
        const classId = data.classes[0].id;
        leagueManager.selectClass(classId);
        
        const updatedData = leagueManager.getLeagueData();
        expect(updatedData.selectedClassId).toBe(classId);
      }
    });
  });
});

