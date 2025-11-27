/**
 * ProgressManager 모듈 테스트
 * 
 * 진도표 관리 로직의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressManager, ProgressData, ProgressClass } from './progressManager.js';
import * as errorHandler from './errorHandler.js';

describe('ProgressManager 모듈', () => {
  let progressManager: ProgressManager;
  let mockProgressData: ProgressData;
  let mock$: (id: string) => HTMLElement | null;
  let mockSaveCallback: () => void;

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
    
    // Mock 함수들
    mock$ = vi.fn((id: string) => {
      let element = document.getElementById(id);
      if (!element) {
        element = document.createElement('div');
        element.id = id;
        document.body.appendChild(element);
      }
      return element as HTMLElement;
    });
    
    mockSaveCallback = vi.fn();

    // 기본 진도표 데이터
    mockProgressData = {
      classes: [],
      selectedClassId: null
    };

    progressManager = new ProgressManager(mockProgressData, mock$, mockSaveCallback);
    
    // showError, showSuccess 모킹
    vi.spyOn(errorHandler, 'showError').mockImplementation(() => {});
    vi.spyOn(errorHandler, 'showSuccess').mockImplementation(() => {});
  });

  describe('초기화', () => {
    it('ProgressManager가 정상적으로 생성되어야 함', () => {
      expect(progressManager).toBeDefined();
      expect(progressManager).toBeInstanceOf(ProgressManager);
    });

    it('기본 데이터로 초기화되어야 함', () => {
      const data = progressManager.getProgressData();
      expect(data).toBeDefined();
      expect(data.classes).toEqual([]);
      expect(data.selectedClassId).toBeNull();
    });
  });

  describe('반(클래스) 관리', () => {
    it('createClass가 반을 생성해야 함', () => {
      // DOM 요소 설정
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const input = document.createElement('input');
      input.id = 'progressClassName';
      input.type = 'text';
      input.value = 'Test Class';
      formContainer.appendChild(input);
      
      progressManager.createClass();
      
      const data = progressManager.getProgressData();
      expect(data.classes.length).toBeGreaterThan(0);
      const progressClass = data.classes.find(c => c.name === 'Test Class');
      expect(progressClass).toBeDefined();
    });

    it('createClass가 빈 이름으로 반을 생성하면 안 됨', () => {
      // DOM 요소 설정
      const formContainer = document.createElement('div');
      formContainer.id = 'sidebar-form-container';
      document.body.appendChild(formContainer);
      
      const input = document.createElement('input');
      input.id = 'progressClassName';
      input.type = 'text';
      input.value = '';
      formContainer.appendChild(input);
      
      const initialCount = progressManager.getProgressData().classes.length;
      progressManager.createClass();
      
      const data = progressManager.getProgressData();
      expect(data.classes.length).toBe(initialCount);
    });
  });

  describe('데이터 관리', () => {
    it('getProgressData가 현재 데이터를 반환해야 함', () => {
      const data = progressManager.getProgressData();
      expect(data).toBeDefined();
      expect(data.classes).toBeDefined();
      expect(data.selectedClassId).toBeDefined();
    });

    it('setProgressData가 데이터를 설정해야 함', () => {
      const newData: ProgressData = {
        classes: [{ id: '1', name: 'New Class', students: [] }],
        selectedClassId: '1'
      };
      
      progressManager.setProgressData(newData);
      const data = progressManager.getProgressData();
      
      expect(data.classes).toHaveLength(1);
      expect(data.selectedClassId).toBe('1');
    });
  });
});



