/**
 * Utils 모듈 테스트
 * 
 * 유틸리티 함수들의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { $, $$, cleanupSidebar, checkVersion, getDefaultData } from './utils.js';

describe('Utils 모듈', () => {
  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
  });

  describe('$ 함수', () => {
    it('요소를 정상적으로 선택해야 함', () => {
      document.body.innerHTML = '<div id="test">Test</div>';
      const element = $('#test');
      expect(element).toBeTruthy();
      expect(element?.id).toBe('test');
    });

    it('존재하지 않는 요소는 null을 반환해야 함', () => {
      const element = $('#non-existent');
      expect(element).toBeNull();
    });
  });

  describe('$$ 함수', () => {
    it('여러 요소를 정상적으로 선택해야 함', () => {
      document.body.innerHTML = '<div class="item">1</div><div class="item">2</div>';
      const elements = $$('.item');
      expect(elements.length).toBe(2);
    });

    it('존재하지 않는 요소는 빈 NodeList를 반환해야 함', () => {
      const elements = $$('.non-existent');
      expect(elements.length).toBe(0);
    });
  });

  describe('cleanupSidebar 함수', () => {
    it('사이드바 리스트 컨테이너를 비워야 함', () => {
      document.body.innerHTML = '<div id="sidebar-list-container"><div>Item 1</div><div>Item 2</div></div>';
      
      expect($('#sidebar-list-container')?.innerHTML).not.toBe('');
      
      cleanupSidebar();
      
      expect($('#sidebar-list-container')?.innerHTML).toBe('');
    });

    it('사이드바 컨테이너가 없어도 에러가 발생하지 않아야 함', () => {
      document.body.innerHTML = '';
      expect(() => cleanupSidebar()).not.toThrow();
    });
  });

  describe('checkVersion 함수', () => {
    beforeEach(() => {
      localStorage.clear();
      vi.clearAllMocks();
    });

    it('저장된 버전이 없으면 새 버전을 저장해야 함', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null);
      localStorage.setItem = vi.fn();
      
      checkVersion();
      
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('버전이 다르면 새로고침을 시도해야 함', () => {
      const reloadSpy = vi.fn();
      // window.location.reload Mock 설정
      Object.defineProperty(window, 'location', {
        value: {
          reload: reloadSpy,
        },
        writable: true,
      });
      
      localStorage.getItem = vi.fn().mockReturnValue('1.0.0');
      localStorage.setItem = vi.fn();
      
      // setTimeout을 즉시 실행하도록 Mock
      vi.useFakeTimers();
      checkVersion();
      vi.advanceTimersByTime(100);
      
      expect(localStorage.setItem).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('getDefaultData 함수', () => {
    it('기본 데이터 구조를 올바르게 반환해야 함', () => {
      const data = getDefaultData();
      
      expect(data).toHaveProperty('leagues');
      expect(data).toHaveProperty('tournaments');
      expect(data).toHaveProperty('paps');
      expect(data).toHaveProperty('progress');
    });

    it('leagues 속성이 올바른 구조를 가져야 함', () => {
      const data = getDefaultData();
      
      expect(data.leagues).toHaveProperty('classes');
      expect(data.leagues).toHaveProperty('students');
      expect(data.leagues).toHaveProperty('games');
      expect(data.leagues).toHaveProperty('selectedClassId');
      expect(data.leagues.classes).toEqual([]);
      expect(data.leagues.selectedClassId).toBeNull();
    });

    it('tournaments 속성이 올바른 구조를 가져야 함', () => {
      const data = getDefaultData();
      
      expect(data.tournaments).toHaveProperty('tournaments');
      expect(data.tournaments).toHaveProperty('activeTournamentId');
      expect(data.tournaments.tournaments).toEqual([]);
      expect(data.tournaments.activeTournamentId).toBeNull();
    });

    it('paps 속성이 올바른 구조를 가져야 함', () => {
      const data = getDefaultData();
      
      expect(data.paps).toHaveProperty('classes');
      expect(data.paps).toHaveProperty('activeClassId');
      expect(data.paps.classes).toEqual([]);
      expect(data.paps.activeClassId).toBeNull();
    });

    it('progress 속성이 올바른 구조를 가져야 함', () => {
      const data = getDefaultData();
      
      expect(data.progress).toHaveProperty('classes');
      expect(data.progress).toHaveProperty('selectedClassId');
      expect(data.progress.classes).toEqual([]);
      expect(data.progress.selectedClassId).toBeNull();
    });

    it('타입이 올바르게 설정되어야 함', () => {
      const data = getDefaultData();
      
      // selectedClassId 타입 검증
      expect(typeof data.leagues.selectedClassId === 'object' && data.leagues.selectedClassId === null || typeof data.leagues.selectedClassId === 'number').toBe(true);
      expect(typeof data.tournaments.activeTournamentId === 'object' && data.tournaments.activeTournamentId === null || typeof data.tournaments.activeTournamentId === 'number').toBe(true);
      expect(typeof data.paps.activeClassId === 'object' && data.paps.activeClassId === null || typeof data.paps.activeClassId === 'number').toBe(true);
      expect(typeof data.progress.selectedClassId === 'object' && data.progress.selectedClassId === null || typeof data.progress.selectedClassId === 'string').toBe(true);
    });
  });
});

