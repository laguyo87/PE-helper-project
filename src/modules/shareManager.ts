/**
 * 공유 관리 모듈
 * 
 * 이 모듈은 순위표 및 기타 데이터의 공유 기능을 관리합니다.
 * 공유 링크 생성, 조회, 모달 표시 등의 기능을 제공합니다.
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

import { logger, logError } from './logger.js';

// ========================================
// 타입 정의
// ========================================

/**
 * 공유 순위표 데이터 구조
 */
export interface SharedRankingData {
  id: string;
  title: string;
  avgRecord: string;
  records: Array<{
    record: number;
    name: string;
  }>;
  personalName?: string;
  createdAt: Date | string;
  lastUpdated: Date | string;
}

/**
 * PAPS 개별 학생 공유 데이터 구조
 */
export interface SharedPapsStudentData {
  shareId: string;
  classId: number;
  className: string;
  studentId: number;
  studentName: string;
  studentNumber: number;
  studentGender: '남자' | '여자';
  gradeLevel: string;
  records: Record<string, number>;
  grades: Record<string, string>;
  eventNames?: Record<string, string>; // 종목명 (예: {endurance: "왕복오래달리기", flexibility: "앉아윗몸앞으로굽히기"})
  overallGrade: string;
  expiresAt?: Date | string; // 유효 기간 (선택사항)
  createdAt: Date | string;
  lastUpdated: Date | string;
}

/**
 * ShareManager 옵션
 */
export interface ShareManagerOptions {
  /** Firebase DB 인스턴스 (window.firebase.db) */
  firebaseDb?: any;
  /** DOM 쿼리 선택자 함수 */
  $?: (selector: string) => HTMLElement | null;
}

// ========================================
// ShareManager 클래스
// ========================================

/**
 * 공유 기능을 관리하는 클래스
 */
export class ShareManager {
  private firebaseDb: any;
  private $: (selector: string) => HTMLElement | null;
  
  /**
   * Firebase DB 인스턴스를 가져옵니다.
   */
  private getFirebaseDb(): any {
    return this.firebaseDb || (window as any).firebase?.db || (window as any).firebase;
  }

  /**
   * ShareManager 인스턴스를 생성합니다.
   * @param options ShareManager 옵션
   */
  constructor(options: ShareManagerOptions = {}) {
    // Firebase DB 접근 (window.firebase 사용)
    this.firebaseDb = options.firebaseDb || (typeof window !== 'undefined' && (window as any).firebase?.db);
    this.$ = options.$ || ((selector: string) => document.querySelector(selector));
  }

  /**
   * 공유 ID를 생성합니다.
   * @param length ID 길이 (기본값: 12)
   * @returns 공유 ID
   */
  public generateShareId(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 공유 순위표 링크를 처리합니다.
   * @param shareId 공유 ID
   * @returns Promise<void>
   */
  public async handleSharedRanking(shareId: string): Promise<void> {
    try {
      logger.debug('공유된 순위표 로딩:', shareId);

      // Firebase에서 공유 데이터 가져오기 (window.firebase 사용)
      const { doc, getDoc, db } = (window as any).firebase || {};
      
      if (!db || !doc || !getDoc) {
        throw new Error('Firebase가 초기화되지 않았습니다.');
      }

      const shareDoc = await getDoc(doc(db, 'sharedRankings', shareId));
      
      if (!shareDoc.exists()) {
        alert('공유된 순위표를 찾을 수 없습니다.');
        return;
      }

      const shareData = shareDoc.data() as SharedRankingData;
      this.showSharedRankingModal(shareData);
    } catch (error) {
      logError('공유된 순위표 로딩 실패:', error);
      alert('공유된 순위표를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 공유된 순위표를 모달로 표시합니다.
   * @param shareData 공유 순위표 데이터
   */
  public showSharedRankingModal(shareData: SharedRankingData): void {
    // 순위표 행 HTML 생성
    const rows = shareData.records.map((item, i) => {
      const rank = i + 1;
      const percentile = ((rank - 1) / shareData.records.length * 100).toFixed(1);
      const isPersonal = shareData.personalName && item.name === shareData.personalName;
      
      return `
        <tr style="${isPersonal ? 'background-color: #fff3cd;' : ''}">
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold;">${rank}</td>
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">${item.name}</td>
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold;">${item.record}</td>
          <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">${percentile}%</td>
        </tr>
      `;
    }).join('');

    // 모달 생성
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    // 날짜 포맷팅
    const createdAt = new Date(shareData.createdAt);
    const lastUpdated = new Date(shareData.lastUpdated);

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h2 style="margin: 0 0 16px 0;">🏆 ${shareData.title}</h2>
        <p style="margin: 0 0 16px 0;">${shareData.avgRecord}</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">순위</th>
              <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">이름</th>
              <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">기록</th>
              <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">%</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; margin: 16px 0;">
          <small style="color: #666;">
            공유 생성일: ${createdAt.toLocaleString()}<br>
            마지막 업데이트: ${lastUpdated.toLocaleString()}
          </small>
        </div>
        <div style="text-align: right; margin-top: 20px;">
          <button id="close-shared-modal" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">닫기</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 모달 닫기 이벤트 리스너
    const closeBtn = modal.querySelector('#close-shared-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    }

    // 배경 클릭 시 모달 닫기
    modal.addEventListener('click', (e: Event) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 공유 링크를 생성합니다.
   * @param shareId 공유 ID
   * @returns 공유 링크 URL
   */
  public generateShareUrl(shareId: string): string {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.origin}${window.location.pathname}?share=${shareId}`;
  }

  /**
   * 공유 링크를 클립보드에 복사합니다.
   * @param shareUrl 공유 링크 URL
   * @returns Promise<void>
   */
  public async copyShareUrlToClipboard(shareUrl: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(shareUrl);
      logger.debug('공유 링크가 클립보드에 복사되었습니다:', shareUrl);
    } catch (error) {
      logError('클립보드 복사 실패:', error);
      throw error;
    }
  }

  /**
   * 공유 데이터를 Firebase에 저장합니다.
   * @param shareId 공유 ID
   * @param shareData 공유 데이터
   * @returns Promise<void>
   */
  public async saveSharedRanking(shareId: string, shareData: Partial<SharedRankingData>): Promise<void> {
    try {
      // window.firebase 사용
      const { doc, setDoc, db } = (window as any).firebase || {};
      
      if (!db || !doc || !setDoc) {
        throw new Error('Firebase가 초기화되지 않았습니다.');
      }

      await setDoc(doc(db, 'sharedRankings', shareId), {
        ...shareData,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
      
      logger.debug('공유 순위표가 저장되었습니다:', shareId);
    } catch (error) {
      logError('공유 순위표 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 기존 PAPS 학생 공유 데이터를 찾습니다.
   * @param classId 반 ID
   * @param studentId 학생 ID
   * @returns Promise<SharedPapsStudentData | null> 기존 공유 데이터 또는 null
   */
  public async findExistingPapsStudentShare(classId: number, studentId: number): Promise<SharedPapsStudentData | null> {
    try {
      // Firebase 초기화 확인 - 없으면 null 반환 (기존 QR 코드가 없으면 새로 생성하면 되므로)
      let firebaseSource = this.firebaseDb || (window as any).firebase;
      
      if (!firebaseSource) {
        console.warn('[ShareManager] Firebase가 아직 초기화되지 않았습니다. 기존 QR 코드 검색을 건너뜁니다.');
        return null;
      }

      const { collection, query, where, getDocs, db } = firebaseSource || {};
      
      if (!db || !collection || !query || !where || !getDocs) {
        console.warn('[ShareManager] Firebase 객체가 완전하지 않습니다. 기존 QR 코드 검색을 건너뜁니다.');
        return null;
      }

      // classId와 studentId로 기존 공유 데이터 검색
      const q = query(
        collection(db, 'sharedPapsStudents'),
        where('classId', '==', classId),
        where('studentId', '==', studentId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      // 가장 최근에 업데이트된 것을 반환
      let latestDoc: any = null;
      let latestDate: Date = new Date(0);
      
      querySnapshot.forEach((doc: any) => {
        const data = doc.data() as SharedPapsStudentData;
        const updatedAt = data.lastUpdated ? new Date(data.lastUpdated) : new Date(0);
        if (updatedAt > latestDate) {
          latestDate = updatedAt;
          latestDoc = data;
        }
      });

      return latestDoc;
    } catch (error) {
      logError('기존 PAPS 학생 공유 데이터 검색 실패:', error);
      return null;
    }
  }

  /**
   * PAPS 개별 학생 공유 데이터를 Firebase에 저장합니다.
   * @param shareData PAPS 개별 학생 공유 데이터
   * @returns Promise<string> 공유 ID
   */
  public async saveSharedPapsStudent(shareData: Partial<SharedPapsStudentData>): Promise<string> {
    try {
      const { doc, setDoc, getDoc, db } = (window as any).firebase || {};
      
      if (!db || !doc || !setDoc) {
        throw new Error('Firebase가 초기화되지 않았습니다.');
      }

      let shareId = shareData.shareId;

      // shareId가 없으면 새로 생성
      if (!shareId) {
        shareId = this.generateShareId(16);
      }

      // 기존 문서가 있는지 확인
      const existingDoc = await getDoc(doc(db, 'sharedPapsStudents', shareId));
      const isNew = !existingDoc.exists();

      const now = new Date();
      const dataToSave: any = {
        ...shareData,
        shareId,
        lastUpdated: now
      };

      // 새 문서인 경우에만 createdAt 설정
      if (isNew) {
        dataToSave.createdAt = now;
      }

      // merge 옵션: 기존 문서가 있으면 merge (true), 없으면 전체 덮어쓰기 (false)
      await setDoc(doc(db, 'sharedPapsStudents', shareId), dataToSave, { merge: !isNew });
      
      logger.debug(`PAPS 개별 학생 공유 데이터가 ${isNew ? '생성' : '업데이트'}되었습니다:`, shareId);
      return shareId;
    } catch (error) {
      logError('PAPS 개별 학생 공유 데이터 저장 실패:', error);
      throw error;
    }
  }

  /**
   * PAPS 개별 학생 공유 링크를 생성합니다.
   * @param shareId 공유 ID
   * @returns 공유 링크 URL
   */
  public generatePapsShareUrl(shareId: string): string {
    if (typeof window === 'undefined') {
      return '';
    }
    return `${window.location.origin}${window.location.pathname}?paps=${shareId}`;
  }

  /**
   * PAPS 개별 학생 공유 링크를 처리합니다.
   * @param shareId 공유 ID
   * @returns Promise<void>
   */
  public async handleSharedPapsStudent(shareId: string): Promise<void> {
    try {
      console.log('[ShareManager] ===== PAPS 개별 학생 공유 데이터 로딩 시작 =====');
      console.log('[ShareManager] shareId:', shareId);
      console.log('[ShareManager] shareId 타입:', typeof shareId);
      console.log('[ShareManager] shareId 길이:', shareId?.length);

      if (!shareId || shareId.trim() === '') {
        console.error('[ShareManager] shareId가 비어있습니다.');
        this.showErrorModal('QR 코드 정보가 올바르지 않습니다. QR 코드를 다시 확인해주세요.');
        return;
      }

      // Firebase 초기화 확인
      const firebase = (window as any).firebase;
      console.log('[ShareManager] Firebase 객체 확인:', { 
        exists: !!firebase, 
        hasDb: !!firebase?.db,
        hasDoc: !!firebase?.doc,
        hasGetDoc: !!firebase?.getDoc
      });
      
      if (!firebase) {
        console.error('[ShareManager] Firebase가 초기화되지 않았습니다.');
        this.showErrorModal('Firebase가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
      }

      const { doc, getDoc, db } = firebase;
      
      if (!db || !doc || !getDoc) {
        console.error('[ShareManager] Firebase 객체가 완전하지 않습니다:', { 
          db: !!db, 
          doc: !!doc, 
          getDoc: !!getDoc,
          firebaseKeys: firebase ? Object.keys(firebase) : []
        });
        throw new Error('Firebase가 초기화되지 않았습니다.');
      }

      console.log('[ShareManager] Firebase 객체 확인 완료, 데이터 조회 시작');
      console.log('[ShareManager] shareId:', shareId);
      console.log('[ShareManager] db:', db);
      console.log('[ShareManager] doc 함수:', typeof doc);
      console.log('[ShareManager] getDoc 함수:', typeof getDoc);
      
      let shareData: SharedPapsStudentData;
      
      try {
        const shareDocRef = doc(db, 'sharedPapsStudents', shareId);
        console.log('[ShareManager] 문서 참조 생성 완료:', shareDocRef);
        
        const shareDoc = await getDoc(shareDocRef);
        console.log('[ShareManager] 문서 조회 완료, exists:', shareDoc.exists());
        
        if (!shareDoc.exists()) {
          console.error('[ShareManager] 공유 데이터를 찾을 수 없습니다:', shareId);
          this.showErrorModal('공유된 PAPS 기록을 찾을 수 없습니다.\nQR 코드를 다시 확인해주세요.');
          return;
        }

        shareData = shareDoc.data() as SharedPapsStudentData;
        console.log('[ShareManager] 공유 데이터 로드 완료:', shareData.studentName);
        console.log('[ShareManager] 공유 데이터 내용:', {
          shareId: shareData.shareId,
          studentName: shareData.studentName,
          className: shareData.className,
          recordsCount: Object.keys(shareData.records || {}).length
        });
      } catch (firestoreError: any) {
        console.error('[ShareManager] Firestore 조회 중 오류:', firestoreError);
        console.error('[ShareManager] 오류 코드:', firestoreError?.code);
        console.error('[ShareManager] 오류 메시지:', firestoreError?.message);
        throw firestoreError;
      }
      
      // 유효 기간 확인
      if (shareData.expiresAt) {
        const expiresAt = new Date(shareData.expiresAt);
        if (new Date() > expiresAt) {
          console.warn('[ShareManager] QR 코드가 만료되었습니다:', expiresAt);
          this.showErrorModal('이 QR 코드는 만료되었습니다.');
          return;
        }
      }

      console.log('[ShareManager] 학생 기록 표시 시작');
      // 바로 기록 표시 (인증 없이) - shareId 전달하여 업데이트 기능 활성화
      await this.showPapsStudentRecord(shareData, shareId);
      console.log('[ShareManager] 학생 기록 표시 완료');
    } catch (error: any) {
      console.error('[ShareManager] PAPS 개별 학생 공유 데이터 로딩 실패:', error);
      console.error('[ShareManager] 오류 상세:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      logError('PAPS 개별 학생 공유 데이터 로딩 실패:', error);
      
      let errorMessage = '공유된 PAPS 기록을 불러오는데 실패했습니다.';
      
      if (error?.code === 'permission-denied') {
        errorMessage = '데이터 접근 권한이 없습니다. QR 코드를 확인해주세요.';
      } else if (error?.code === 'not-found') {
        errorMessage = '공유된 PAPS 기록을 찾을 수 없습니다. QR 코드를 확인해주세요.';
      } else if (error?.message) {
        errorMessage = `오류: ${error.message}`;
      }
      
      this.showErrorModal(errorMessage);
    }
  }

  /**
   * shareId로 최신 데이터를 가져옵니다.
   * @param shareId 공유 ID
   * @returns Promise<SharedPapsStudentData | null>
   */
  private async fetchLatestShareData(shareId: string): Promise<SharedPapsStudentData | null> {
    try {
      const { doc, getDoc, db } = (window as any).firebase || {};
      
      if (!db || !doc || !getDoc) {
        throw new Error('Firebase가 초기화되지 않았습니다.');
      }

      const shareDoc = await getDoc(doc(db, 'sharedPapsStudents', shareId));
      
      if (!shareDoc.exists()) {
        return null;
      }

      return shareDoc.data() as SharedPapsStudentData;
    } catch (error) {
      logError('최신 데이터 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * PAPS 개별 학생 기록을 표시합니다.
   * @param shareData 공유 데이터
   * @param shareId 공유 ID (업데이트용)
   */
  private async showPapsStudentRecord(shareData: SharedPapsStudentData, shareId?: string): Promise<void> {
    // 학년 랭킹 계산을 위해 동일 학년/성별 학생들의 데이터 가져오기
    const gradeRankings = await this.calculateGradeRankings(shareData);
    
    // AI 운동 처방 생성
    const exercisePrescription = this.generateExercisePrescription(shareData);

    const modal = document.createElement('div');
    modal.id = 'paps-student-record-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      z-index: 10000;
      overflow-y: auto;
      padding: 20px;
    `;

    // PAPS 항목 정의
    const PAPS_ITEMS: Record<string, { id: string; label: string }> = {
      "심폐지구력": { id: "endurance", label: "심폐지구력" },
      "유연성": { id: "flexibility", label: "유연성" },
      "근력/근지구력": { id: "strength", label: "근력/근지구력" },
      "순발력": { id: "power", label: "순발력" },
      "체지방": { id: "bodyfat", label: "체지방" }
    };

    // 기록 테이블 생성 - 모든 종목 표시
    let recordsTable = '';
    Object.keys(PAPS_ITEMS).forEach(category => {
      const item = PAPS_ITEMS[category];
      const record = shareData.records[item.id];
      const grade = shareData.grades[item.id] || '-';
      const ranking = gradeRankings[item.id] || '-';
      const eventName = shareData.eventNames?.[item.id] || category;
      
      // 모든 종목 표시 (기록이 없어도 표시)
      recordsTable += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">${eventName}</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${record !== undefined && record !== null && record !== 0 ? record : '-'}</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: ${this.getGradeColor(grade)};">${grade}</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${ranking}</td>
        </tr>
      `;
    });

    // 신장, 체중 추가
    const height = shareData.records.height;
    const weight = shareData.records.weight;
    const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : '-';
    const bmiGrade = shareData.grades.bodyfat || '-';
    
    if (height || weight) {
      recordsTable += `
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">신장/체중</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${height ? height + 'cm' : '-'} / ${weight ? weight + 'kg' : '-'}</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: ${this.getGradeColor(bmiGrade)};">BMI: ${bmi}</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${bmiGrade}</td>
        </tr>
      `;
    }

    const lastUpdated = new Date(shareData.lastUpdated);

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; max-width: 900px; width: 100%; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin: 20px auto;">
        <!-- 상단: 학년, 반, 이름 및 업데이트 버튼 -->
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e0e0e0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="flex: 1;"></div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${shareData.gradeLevel}</div>
              <div style="font-size: 18px; color: #333; margin-bottom: 4px; font-weight: 600;">${shareData.className}</div>
              <div style="font-size: 24px; color: #007bff; font-weight: bold;">${shareData.studentName}</div>
            </div>
            <div style="flex: 1; text-align: right;">
              ${shareId ? `
                <button 
                  id="refresh-paps-record-btn" 
                  style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
                >
                  <span>🔄</span>
                  <span>업데이트</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 기록 테이블 -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #007bff; color: white;">
              <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">종목</th>
              <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">기록</th>
              <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">등급</th>
              <th style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">학년 랭킹</th>
            </tr>
          </thead>
          <tbody>
            ${recordsTable || '<tr><td colspan="4" style="padding: 24px; text-align: center; color: #666;">입력된 기록이 없습니다.</td></tr>'}
          </tbody>
        </table>

        ${shareData.overallGrade ? `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 14px; margin-bottom: 8px; opacity: 0.9;">종합 등급</div>
            <div style="font-size: 32px; font-weight: bold;">${shareData.overallGrade}</div>
          </div>
        ` : ''}

        <!-- 운동 처방 박스 -->
        <div style="background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="font-size: 18px; font-weight: bold; color: #007bff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span>💡</span>
            <span>운동 처방</span>
          </div>
          <div style="line-height: 1.8; color: #333; white-space: pre-line;">${exercisePrescription}</div>
        </div>

        <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; margin-bottom: 24px; text-align: center;">
          <small style="color: #666;">
            마지막 업데이트: ${lastUpdated.toLocaleString()}
          </small>
        </div>

        <div style="text-align: center; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button 
            id="install-pwa-btn" 
            style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;"
          >
            <span>📱</span>
            <span>앱으로 등록</span>
          </button>
          <button 
            id="close-paps-record-modal" 
            style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;"
          >
            닫기
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // PWA 설치 기능
    let deferredPrompt: any = null;
    const installBtn = modal.querySelector('#install-pwa-btn') as HTMLButtonElement;
    
    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // 이미 설치되어 있는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      if (installBtn) {
        installBtn.style.display = 'none';
      }
    } else {
      // 설치 가능 여부 확인
      if (installBtn) {
        installBtn.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA 설치 결과: ${outcome}`);
            deferredPrompt = null;
            if (installBtn) {
              installBtn.style.display = 'none';
            }
          } else {
            // 수동 설치 안내
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);
            
            let message = '';
            if (isIOS) {
              message = 'iOS에서 설치하려면:\n1. Safari에서 공유 버튼(□↑)을 누르세요\n2. "홈 화면에 추가"를 선택하세요';
            } else if (isAndroid) {
              message = 'Android에서 설치하려면:\n1. 브라우저 메뉴(⋮)를 누르세요\n2. "홈 화면에 추가" 또는 "설치"를 선택하세요';
            } else {
              message = '브라우저 메뉴에서 "앱 설치" 또는 "홈 화면에 추가"를 선택하세요';
            }
            
            alert(message);
          }
        });
      }
    }

    // 모달 닫기 함수
    const removeModal = () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };

    const closeBtn = modal.querySelector('#close-paps-record-modal') as HTMLElement;
    closeBtn.addEventListener('click', removeModal);

    // 업데이트 버튼 이벤트 리스너
    if (shareId) {
      const refreshBtn = modal.querySelector('#refresh-paps-record-btn') as HTMLButtonElement;
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          refreshBtn.disabled = true;
          refreshBtn.innerHTML = '<span>⏳</span><span>업데이트 중...</span>';
          
          try {
            // 최신 데이터 가져오기
            const latestData = await this.fetchLatestShareData(shareId);
            
            if (!latestData) {
              this.showErrorModal('최신 데이터를 가져올 수 없습니다.');
              refreshBtn.disabled = false;
              refreshBtn.innerHTML = '<span>🔄</span><span>업데이트</span>';
              return;
            }

            // 유효 기간 확인
            if (latestData.expiresAt) {
              const expiresAt = new Date(latestData.expiresAt);
              if (new Date() > expiresAt) {
                this.showErrorModal('이 QR 코드는 만료되었습니다.');
                removeModal();
                return;
              }
            }

            // 모달 닫고 새 데이터로 다시 표시
            removeModal();
            await this.showPapsStudentRecord(latestData, shareId);
          } catch (error) {
            logError('데이터 업데이트 실패:', error);
            this.showErrorModal('데이터 업데이트에 실패했습니다.');
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<span>🔄</span><span>업데이트</span>';
          }
        });
      }
    }

    modal.addEventListener('click', (e: Event) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  /**
   * 학년 랭킹을 계산합니다.
   * @param shareData 공유 데이터
   * @returns 종목별 랭킹 정보
   */
  private async calculateGradeRankings(shareData: SharedPapsStudentData): Promise<Record<string, string>> {
    try {
      const { collection, query, where, getDocs, db } = (window as any).firebase || {};
      
      if (!db || !collection || !query || !where || !getDocs) {
        return {};
      }

      // 동일 학년, 동일 성별의 모든 학생 데이터 가져오기
      const q = query(
        collection(db, 'sharedPapsStudents'),
        where('gradeLevel', '==', shareData.gradeLevel),
        where('studentGender', '==', shareData.studentGender)
      );

      const querySnapshot = await getDocs(q);
      const allStudents: SharedPapsStudentData[] = [];
      
      querySnapshot.forEach((doc: any) => {
        allStudents.push(doc.data() as SharedPapsStudentData);
      });

      const rankings: Record<string, string> = {};
      
      // 각 종목별로 랭킹 계산
      const categories = ['endurance', 'flexibility', 'strength', 'power', 'bodyfat'];
      
      categories.forEach(categoryId => {
        const studentRecord = shareData.records[categoryId];
        if (studentRecord === undefined || studentRecord === null || studentRecord === 0) {
          rankings[categoryId] = '-';
          return;
        }

        // 해당 종목에 기록이 있는 학생들만 필터링
        const studentsWithRecord = allStudents.filter(s => 
          s.records[categoryId] !== undefined && 
          s.records[categoryId] !== null && 
          s.records[categoryId] !== 0
        );

        if (studentsWithRecord.length === 0) {
          rankings[categoryId] = '-';
          return;
        }

        // 기록 기준으로 정렬 (종목에 따라 오름차순/내림차순)
        // 대부분의 종목은 높을수록 좋지만, 일부는 낮을수록 좋음 (50m 달리기 등)
        const isLowerBetter = categoryId === 'power' && shareData.records[categoryId] < 20; // 50m 달리기 등
        
        studentsWithRecord.sort((a, b) => {
          const recordA = a.records[categoryId] || 0;
          const recordB = b.records[categoryId] || 0;
          return isLowerBetter ? recordA - recordB : recordB - recordA;
        });

        // 현재 학생의 순위 찾기
        const rank = studentsWithRecord.findIndex(s => s.studentId === shareData.studentId) + 1;
        const total = studentsWithRecord.length;
        
        rankings[categoryId] = rank > 0 ? `${rank}위 / ${total}명` : '-';
      });

      return rankings;
    } catch (error) {
      logError('학년 랭킹 계산 실패:', error);
      return {};
    }
  }

  /**
   * AI 운동 처방을 생성합니다.
   * @param shareData 공유 데이터
   * @returns 운동 처방 텍스트
   */
  private generateExercisePrescription(shareData: SharedPapsStudentData): string {
    const prescriptions: string[] = [];
    
    // 각 종목별 평가 및 처방
    Object.keys(shareData.grades).forEach(categoryId => {
      const grade = shareData.grades[categoryId];
      const record = shareData.records[categoryId];
      
      if (!grade || !record) return;

      const gradeNum = parseInt(grade.replace('등급', '').replace('정상', '2').replace('과체중', '3').replace('비만', '5').replace('마름', '4')) || 3;
      
      let categoryName = '';
      let prescription = '';

      switch (categoryId) {
        case 'endurance':
          categoryName = '심폐지구력';
          if (gradeNum >= 4) {
            prescription = '심폐지구력이 우수합니다. 현재 수준을 유지하기 위해 주 2-3회 유산소 운동을 지속하세요.';
          } else if (gradeNum === 3) {
            prescription = '심폐지구력이 보통 수준입니다. 주 3-4회 30분 이상의 유산소 운동(조깅, 자전거, 수영 등)을 권장합니다.';
          } else {
            prescription = '심폐지구력 향상이 필요합니다. 주 4-5회 20-30분 유산소 운동을 시작하고, 점진적으로 강도와 시간을 늘려가세요.';
          }
          break;
        case 'flexibility':
          categoryName = '유연성';
          if (gradeNum >= 4) {
            prescription = '유연성이 우수합니다. 현재 수준 유지를 위해 매일 10-15분 스트레칭을 실시하세요.';
          } else if (gradeNum === 3) {
            prescription = '유연성이 보통 수준입니다. 매일 15-20분 스트레칭(요가, 필라테스 등)을 통해 유연성을 향상시키세요.';
          } else {
            prescription = '유연성 향상이 필요합니다. 매일 20-30분 정적 스트레칭을 실시하고, 운동 전후 반드시 준비운동과 정리운동을 하세요.';
          }
          break;
        case 'strength':
          categoryName = '근력/근지구력';
          if (gradeNum >= 4) {
            prescription = '근력이 우수합니다. 근지구력 향상을 위해 반복 횟수를 늘린 운동을 추가하세요.';
          } else if (gradeNum === 3) {
            prescription = '근력이 보통 수준입니다. 주 3-4회 팔굽혀펴기, 윗몸말아올리기, 스쿼트 등을 10-15회씩 실시하세요.';
          } else {
            prescription = '근력 향상이 필요합니다. 주 4-5회 근력 운동을 시작하고, 점진적으로 횟수와 세트를 늘려가세요.';
          }
          break;
        case 'power':
          categoryName = '순발력';
          if (gradeNum >= 4) {
            prescription = '순발력이 우수합니다. 폭발적인 움직임을 유지하기 위해 플라이오메트릭 운동을 지속하세요.';
          } else if (gradeNum === 3) {
            prescription = '순발력이 보통 수준입니다. 제자리멀리뛰기, 짧은 거리 전력 질주 등을 주 2-3회 실시하세요.';
          } else {
            prescription = '순발력 향상이 필요합니다. 폭발적인 움직임 연습(점프, 짧은 스프린트)을 주 3-4회 실시하세요.';
          }
          break;
        case 'bodyfat':
          categoryName = '체지방';
          if (grade === '정상') {
            prescription = '체지방률이 정상 범위입니다. 균형 잡힌 식단과 규칙적인 운동을 유지하세요.';
          } else if (grade === '과체중') {
            prescription = '체지방률이 약간 높습니다. 주 4-5회 유산소 운동과 식단 조절을 통해 체중 관리를 하세요.';
          } else {
            prescription = '체지방률 관리가 필요합니다. 전문가 상담 후 식단 조절과 규칙적인 유산소 운동을 병행하세요.';
          }
          break;
      }

      if (prescription) {
        prescriptions.push(`【${categoryName}】 ${prescription}`);
      }
    });

    // 종합 등급에 따른 전체 평가
    if (shareData.overallGrade) {
      const overallGradeNum = parseInt(shareData.overallGrade.replace('등급', '')) || 3;
      
      let overallAssessment = '';
      if (overallGradeNum <= 2) {
        overallAssessment = '\n\n전반적으로 체력이 우수합니다. 현재 운동 습관을 유지하면서 다양한 종목에 도전해보세요.';
      } else if (overallGradeNum === 3) {
        overallAssessment = '\n\n전반적인 체력이 보통 수준입니다. 약한 종목에 집중하여 균형 잡힌 체력을 기르세요.';
      } else {
        overallAssessment = '\n\n체력 향상이 필요합니다. 전문가 상담을 받고 단계적으로 운동 강도를 높여가세요. 꾸준함이 가장 중요합니다.';
      }
      
      prescriptions.push(overallAssessment);
    }

    return prescriptions.length > 0 ? prescriptions.join('\n\n') : '기록이 부족하여 운동 처방을 제공할 수 없습니다.';
  }

  /**
   * 등급에 따른 색상을 반환합니다.
   * @param grade 등급
   * @returns 색상 코드
   */
  private getGradeColor(grade: string): string {
    if (grade.includes('1등급')) return '#28a745';
    if (grade.includes('2등급')) return '#17a2b8';
    if (grade.includes('3등급')) return '#ffc107';
    if (grade.includes('4등급')) return '#fd7e14';
    if (grade.includes('5등급')) return '#dc3545';
    return '#333';
  }

  /**
   * 에러 모달을 표시합니다.
   * @param message 에러 메시지
   */
  private showErrorModal(message: string): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 8px; max-width: 400px; width: 90%;">
        <h3 style="margin: 0 0 16px 0; color: #dc3545;">오류</h3>
        <p style="margin: 0 0 24px 0; color: #333;">${message}</p>
        <button 
          id="close-error-modal" 
          style="width: 100%; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;"
        >
          확인
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-error-modal') as HTMLElement;
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * ShareManager 인스턴스를 생성하는 팩토리 함수
 * @param options ShareManager 옵션
 * @returns ShareManager 인스턴스
 */
export function createShareManager(options: ShareManagerOptions = {}): ShareManager {
  return new ShareManager(options);
}

// ========================================
// 기본 내보내기
// ========================================

export default ShareManager;

