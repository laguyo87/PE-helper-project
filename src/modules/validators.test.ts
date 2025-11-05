/**
 * Validators 모듈 테스트
 * 
 * 데이터 검증 함수들의 동작을 검증합니다.
 */

import { describe, it, expect } from 'vitest';
import {
  validateData,
  validateWithDefaults,
  formatValidationErrors,
  LeagueClassSchema,
  LeagueStudentSchema,
  TournamentSchema,
  PapsClassSchema,
  ProgressClassSchema
} from './validators.js';
import { z } from 'zod';

describe('Validators 모듈', () => {
  describe('validateData', () => {
    it('유효한 데이터는 성공해야 함', () => {
      const validData = {
        id: 1,
        name: '1반',
        note: ''
      };
      
      const result = validateData(LeagueClassSchema, validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('유효하지 않은 데이터는 실패해야 함', () => {
      const invalidData = {
        id: -1, // 음수는 유효하지 않음
        name: '', // 빈 문자열은 유효하지 않음
        note: ''
      };
      
      const result = validateData(LeagueClassSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.formattedErrors).toBeDefined();
      expect(result.formattedErrors!.length).toBeGreaterThan(0);
    });
  });

  describe('validateWithDefaults', () => {
    it('유효한 데이터는 그대로 반환해야 함', () => {
      const validData = {
        id: 1,
        name: '1반',
        note: ''
      };
      
      const defaultValue = { id: 0, name: '기본값', note: '' };
      const result = validateWithDefaults(LeagueClassSchema, validData, defaultValue);
      expect(result).toEqual(validData);
    });

    it('유효하지 않은 데이터는 기본값을 반환해야 함', () => {
      const invalidData = {
        id: -1,
        name: '',
        note: ''
      };
      
      const defaultValue = { id: 0, name: '기본값', note: '' };
      const result = validateWithDefaults(LeagueClassSchema, invalidData, defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('formatValidationErrors', () => {
    it('ZodError를 사용자 친화적인 메시지로 변환해야 함', () => {
      try {
        LeagueClassSchema.parse({ id: -1, name: '', note: '' });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationErrors(error);
          expect(formatted).toBeDefined();
          expect(Array.isArray(formatted)).toBe(true);
          expect(formatted.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('스키마별 검증', () => {
    describe('LeagueClassSchema', () => {
      it('유효한 반 데이터 검증', () => {
        const validClass = {
          id: 1,
          name: '1반',
          note: '메모'
        };
        
        const result = validateData(LeagueClassSchema, validClass);
        expect(result.success).toBe(true);
      });

      it('이름이 너무 긴 경우 실패', () => {
        const invalidClass = {
          id: 1,
          name: 'a'.repeat(51), // 50자 초과
          note: ''
        };
        
        const result = validateData(LeagueClassSchema, invalidClass);
        expect(result.success).toBe(false);
      });
    });

    describe('LeagueStudentSchema', () => {
      it('유효한 학생 데이터 검증', () => {
        const validStudent = {
          id: 1,
          name: '홍길동',
          classId: 1,
          note: ''
        };
        
        const result = validateData(LeagueStudentSchema, validStudent);
        expect(result.success).toBe(true);
      });
    });

    describe('TournamentSchema', () => {
      it('유효한 토너먼트 데이터 검증', () => {
        const validTournament = {
          id: 't_123',
          name: '토너먼트',
          teams: ['팀1', '팀2', '팀3'],
          rounds: [],
          sport: '',
          format: 'single' as const,
          seeding: 'input' as const
        };
        
        const result = validateData(TournamentSchema, validTournament);
        expect(result.success).toBe(true);
      });

      it('팀 수가 부족한 경우 실패', () => {
        const invalidTournament = {
          id: 't_123',
          name: '토너먼트',
          teams: ['팀1', '팀2'], // 최소 3개 필요
          rounds: [],
          sport: '',
          format: 'single' as const,
          seeding: 'input' as const
        };
        
        const result = validateData(TournamentSchema, invalidTournament);
        expect(result.success).toBe(false);
      });
    });

    describe('PapsClassSchema', () => {
      it('유효한 PAPS 반 데이터 검증', () => {
        const validPapsClass = {
          id: 1,
          name: '1학년 1반',
          gradeLevel: '1학년',
          students: []
        };
        
        const result = validateData(PapsClassSchema, validPapsClass);
        expect(result.success).toBe(true);
      });
    });

    describe('ProgressClassSchema', () => {
      it('유효한 진도표 반 데이터 검증', () => {
        const validProgressClass = {
          id: 'class1',
          name: '1반',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          schedule: []
        };
        
        const result = validateData(ProgressClassSchema, validProgressClass);
        expect(result.success).toBe(true);
      });
    });
  });
});

