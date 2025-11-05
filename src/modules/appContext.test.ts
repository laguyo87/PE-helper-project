/**
 * AppContext 모듈 테스트
 * 
 * 앱 컨텍스트 관리자의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAppContext, initializeAppContext, AppContext } from './appContext.js';

describe('AppContext', () => {
  beforeEach(() => {
    // 각 테스트 전에 인스턴스 리셋
    AppContext.resetInstance();
  });

  describe('싱글톤 패턴', () => {
    it('getAppContext()가 항상 같은 인스턴스를 반환해야 함', () => {
      const context1 = getAppContext();
      const context2 = getAppContext();
      
      expect(context1).toBe(context2);
    });

    it('resetInstance() 후 새로운 인스턴스가 생성되어야 함', () => {
      const context1 = getAppContext();
      AppContext.resetInstance();
      const context2 = getAppContext();
      
      expect(context1).not.toBe(context2);
    });
  });

  describe('초기화', () => {
    it('기본값으로 초기화되어야 함', () => {
      const context = getAppContext();
      
      expect(context.appInitializer).toBeNull();
      expect(context.appStateManager).toBeNull();
      expect(context.dataSyncService).toBeNull();
      expect(context.uiRenderer).toBeNull();
      expect(context.shareManager).toBeNull();
      expect(context.versionManager).toBeNull();
      expect(context.authManager).toBeNull();
      expect(context.dataManager).toBeNull();
      expect(context.visitorManager).toBeNull();
      expect(context.leagueManager).toBeNull();
      expect(context.tournamentManager).toBeNull();
      expect(context.papsManager).toBeNull();
      expect(context.progressManager).toBeNull();
    });

    it('initialContext로 초기화할 수 있어야 함', () => {
      const mockManager = { test: 'value' };
      
      const context = initializeAppContext({
        appStateManager: mockManager as any,
      });
      
      expect(context.appStateManager).toBe(mockManager);
    });
  });

  describe('업데이트', () => {
    it('update()가 컨텍스트를 업데이트해야 함', () => {
      const context = getAppContext();
      const mockManager = { test: 'value' };
      
      context.update({
        appStateManager: mockManager as any,
      });
      
      expect(context.appStateManager).toBe(mockManager);
    });
  });

  describe('Manager 조회', () => {
    it('getManager()가 특정 Manager를 반환해야 함', () => {
      const context = getAppContext();
      const mockManager = { test: 'value' };
      
      context.update({
        appStateManager: mockManager as any,
      });
      
      const manager = context.getManager('appStateManager');
      expect(manager).toBe(mockManager);
    });

    it('getContext()가 전체 컨텍스트를 반환해야 함', () => {
      const context = getAppContext();
      const mockManager = { test: 'value' };
      
      context.update({
        appStateManager: mockManager as any,
      });
      
      const fullContext = context.getContext();
      expect(fullContext.appStateManager).toBe(mockManager);
      expect(fullContext).not.toBe(context); // 새로운 객체여야 함
    });
  });

  describe('초기화 확인', () => {
    it('isInitialized()가 초기화 상태를 올바르게 반환해야 함', () => {
      const context = getAppContext();
      
      expect(context.isInitialized()).toBe(false);
      
      context.update({
        appStateManager: {} as any,
        appInitializer: {} as any,
        dataSyncService: {} as any,
        uiRenderer: {} as any,
        shareManager: {} as any,
      });
      
      expect(context.isInitialized()).toBe(true);
    });

    it('일부 Manager만 초기화된 경우 false를 반환해야 함', () => {
      const context = getAppContext();
      
      context.update({
        appStateManager: {} as any,
      });
      
      expect(context.isInitialized()).toBe(false);
    });
  });
});

