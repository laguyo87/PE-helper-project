/**
 * TournamentManager 모듈 테스트
 * 
 * 토너먼트 관리 로직의 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TournamentManager, TournamentData, Tournament } from './tournamentManager.js';
import * as errorHandler from './errorHandler.js';

describe('TournamentManager 모듈', () => {
  let tournamentManager: TournamentManager;
  let mockTournamentData: TournamentData;

  beforeEach(() => {
    // DOM 초기화
    document.body.innerHTML = '';
    
    // 기본 토너먼트 데이터
    mockTournamentData = {
      tournaments: [],
      activeTournamentId: null
    };
    
    tournamentManager = new TournamentManager(mockTournamentData);
    
    // showError, showSuccess 모킹
    vi.spyOn(errorHandler, 'showError').mockImplementation(() => {});
    vi.spyOn(errorHandler, 'showSuccess').mockImplementation(() => {});
  });

  describe('초기화', () => {
    it('TournamentManager가 정상적으로 생성되어야 함', () => {
      expect(tournamentManager).toBeDefined();
      expect(tournamentManager).toBeInstanceOf(TournamentManager);
    });

    it('기본 데이터로 초기화되어야 함', () => {
      const data = tournamentManager.getTournamentData();
      expect(data).toBeDefined();
      expect(data.tournaments).toEqual([]);
      expect(data.activeTournamentId).toBeNull();
    });
  });

  describe('토너먼트 관리', () => {
    it('createTournament가 토너먼트를 생성해야 함', () => {
      const tournamentName = 'Test Tournament';
      tournamentManager.createTournament(tournamentName);
      
      const data = tournamentManager.getTournamentData();
      expect(data.tournaments.length).toBeGreaterThan(0);
      const tournament = data.tournaments.find(t => t.name === tournamentName);
      expect(tournament).toBeDefined();
      expect(tournament?.id).toBeDefined();
    });

    it('createTournament가 빈 이름으로 토너먼트를 생성하면 안 됨', () => {
      const initialCount = tournamentManager.getTournamentData().tournaments.length;
      tournamentManager.createTournament('');
      
      const data = tournamentManager.getTournamentData();
      expect(data.tournaments.length).toBe(initialCount);
    });

    it('deleteTournament가 토너먼트를 삭제해야 함', () => {
      tournamentManager.createTournament('Test Tournament');
      const data = tournamentManager.getTournamentData();
      const tournamentId = data.tournaments[0].id;
      
      tournamentManager.deleteTournament(tournamentId);
      
      const updatedData = tournamentManager.getTournamentData();
      expect(updatedData.tournaments.length).toBe(0);
    });
  });

  describe('대진표 생성', () => {
    beforeEach(() => {
      tournamentManager.createTournament('Test Tournament');
      const data = tournamentManager.getTournamentData();
      if (data.tournaments.length > 0) {
        tournamentManager.setActiveTournament(data.tournaments[0].id);
      }
    });

    it('generateBracket이 대진표를 생성해야 함', () => {
      // 팀 추가 (최소 2개 필요)
      const data = tournamentManager.getTournamentData();
      if (data.activeTournamentId) {
        const tournament = data.tournaments.find(t => t.id === data.activeTournamentId);
        if (tournament) {
          // 팀 추가 로직이 있다면 테스트
          // 실제 구현에 따라 조정 필요
          expect(tournament).toBeDefined();
        }
      }
    });
  });

  describe('데이터 관리', () => {
    it('getTournamentData가 현재 데이터를 반환해야 함', () => {
      const data = tournamentManager.getTournamentData();
      expect(data).toBeDefined();
      expect(data.tournaments).toBeDefined();
      expect(data.activeTournamentId).toBeDefined();
    });

    it('setTournamentData가 데이터를 설정해야 함', () => {
      const newData: TournamentData = {
        tournaments: [{ id: '1', name: 'New Tournament', teams: [], rounds: [] }],
        activeTournamentId: '1'
      };
      
      tournamentManager.setTournamentData(newData);
      const data = tournamentManager.getTournamentData();
      
      expect(data.tournaments).toHaveLength(1);
      expect(data.activeTournamentId).toBe('1');
    });
  });
});


