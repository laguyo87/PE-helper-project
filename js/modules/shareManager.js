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
// ShareManager 클래스
// ========================================
/**
 * 공유 기능을 관리하는 클래스
 */
export class ShareManager {
    /**
     * Firebase DB 인스턴스를 가져옵니다.
     */
    getFirebaseDb() {
        return this.firebaseDb || window.firebase?.db || window.firebase;
    }
    /**
     * ShareManager 인스턴스를 생성합니다.
     * @param options ShareManager 옵션
     */
    constructor(options = {}) {
        // Firebase DB 접근 (window.firebase 사용)
        this.firebaseDb = options.firebaseDb || (typeof window !== 'undefined' && window.firebase?.db);
        this.$ = options.$ || ((selector) => document.querySelector(selector));
    }
    /**
     * 공유 ID를 생성합니다.
     * @param length ID 길이 (기본값: 12)
     * @returns 공유 ID
     */
    generateShareId(length = 12) {
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
    async handleSharedRanking(shareId) {
        try {
            logger.debug('공유된 순위표 로딩:', shareId);
            // Firebase에서 공유 데이터 가져오기 (window.firebase 사용)
            const { doc, getDoc, db } = window.firebase || {};
            if (!db || !doc || !getDoc) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }
            const shareDoc = await getDoc(doc(db, 'sharedRankings', shareId));
            if (!shareDoc.exists()) {
                alert('공유된 순위표를 찾을 수 없습니다.');
                return;
            }
            const shareData = shareDoc.data();
            this.showSharedRankingModal(shareData);
        }
        catch (error) {
            logError('공유된 순위표 로딩 실패:', error);
            alert('공유된 순위표를 불러오는데 실패했습니다.');
        }
    }
    /**
     * 공유된 순위표를 모달로 표시합니다.
     * @param shareData 공유 순위표 데이터
     */
    showSharedRankingModal(shareData) {
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
        modal.addEventListener('click', (e) => {
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
    generateShareUrl(shareId) {
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
    async copyShareUrlToClipboard(shareUrl) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            logger.debug('공유 링크가 클립보드에 복사되었습니다:', shareUrl);
        }
        catch (error) {
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
    async saveSharedRanking(shareId, shareData) {
        try {
            // window.firebase 사용
            const { doc, setDoc, db } = window.firebase || {};
            if (!db || !doc || !setDoc) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }
            await setDoc(doc(db, 'sharedRankings', shareId), {
                ...shareData,
                createdAt: new Date(),
                lastUpdated: new Date()
            });
            logger.debug('공유 순위표가 저장되었습니다:', shareId);
        }
        catch (error) {
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
    async findExistingPapsStudentShare(classId, studentId) {
        try {
            // Firebase 초기화 확인 - 없으면 null 반환 (기존 QR 코드가 없으면 새로 생성하면 되므로)
            let firebaseSource = this.firebaseDb || window.firebase;
            if (!firebaseSource) {
                logger.debug('[ShareManager] Firebase가 아직 초기화되지 않았습니다. 기존 QR 코드 검색을 건너뜁니다.');
                return null;
            }
            const { collection, query, where, getDocs, db } = firebaseSource || {};
            if (!db || !collection || !query || !where || !getDocs) {
                logger.debug('[ShareManager] Firebase 객체가 완전하지 않습니다. 기존 QR 코드 검색을 건너뜁니다.');
                return null;
            }
            // classId와 studentId로 기존 공유 데이터 검색
            const q = query(collection(db, 'sharedPapsStudents'), where('classId', '==', classId), where('studentId', '==', studentId));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return null;
            }
            // 가장 최근에 업데이트된 것을 반환
            let latestDoc = null;
            let latestDate = new Date(0);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const updatedAt = data.lastUpdated ? new Date(data.lastUpdated) : new Date(0);
                if (updatedAt > latestDate) {
                    latestDate = updatedAt;
                    latestDoc = data;
                }
            });
            return latestDoc;
        }
        catch (error) {
            logError('기존 PAPS 학생 공유 데이터 검색 실패:', error);
            return null;
        }
    }
    /**
     * PAPS 개별 학생 공유 데이터를 Firebase에 저장합니다.
     * @param shareData PAPS 개별 학생 공유 데이터
     * @returns Promise<string> 공유 ID
     */
    async saveSharedPapsStudent(shareData) {
        try {
            const { doc, setDoc, getDoc, db } = window.firebase || {};
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
            const dataToSave = {
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
        }
        catch (error) {
            logError('PAPS 개별 학생 공유 데이터 저장 실패:', error);
            throw error;
        }
    }
    /**
     * PAPS 개별 학생 공유 링크를 생성합니다.
     * @param shareId 공유 ID
     * @returns 공유 링크 URL
     */
    generatePapsShareUrl(shareId) {
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
    async handleSharedPapsStudent(shareId) {
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
            const firebase = window.firebase;
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
            let shareData;
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
                shareData = shareDoc.data();
                console.log('[ShareManager] 공유 데이터 로드 완료:', shareData.studentName);
                console.log('[ShareManager] 공유 데이터 내용:', {
                    shareId: shareData.shareId,
                    studentName: shareData.studentName,
                    className: shareData.className,
                    recordsCount: Object.keys(shareData.records || {}).length
                });
            }
            catch (firestoreError) {
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
        }
        catch (error) {
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
            }
            else if (error?.code === 'not-found') {
                errorMessage = '공유된 PAPS 기록을 찾을 수 없습니다. QR 코드를 확인해주세요.';
            }
            else if (error?.message) {
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
    async fetchLatestShareData(shareId) {
        try {
            const { doc, getDoc, db } = window.firebase || {};
            if (!db || !doc || !getDoc) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }
            const shareDoc = await getDoc(doc(db, 'sharedPapsStudents', shareId));
            if (!shareDoc.exists()) {
                return null;
            }
            return shareDoc.data();
        }
        catch (error) {
            logError('최신 데이터 가져오기 실패:', error);
            return null;
        }
    }
    /**
     * PAPS 개별 학생 기록을 표시합니다.
     * @param shareData 공유 데이터
     * @param shareId 공유 ID (업데이트용)
     */
    async showPapsStudentRecord(shareData, shareId) {
        // 학년 랭킹 계산을 위해 동일 학년/성별 학생들의 데이터 가져오기
        const gradeRankings = await this.calculateGradeRankings(shareData);
        console.log('[학년 랭킹] 표시용 랭킹 데이터:', gradeRankings);
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
      padding: 0;
    `;
        // PAPS 항목 정의 (체지방 제외 - 신장/체중 행에서만 표시)
        const PAPS_ITEMS = {
            "심폐지구력": { id: "endurance", label: "심폐지구력" },
            "유연성": { id: "flexibility", label: "유연성" },
            "근력/근지구력": { id: "strength", label: "근력/근지구력" },
            "순발력": { id: "power", label: "순발력" }
        };
        // 기록 테이블 생성 - 모든 종목 표시
        let recordsTable = '';
        Object.keys(PAPS_ITEMS).forEach(category => {
            const item = PAPS_ITEMS[category];
            const eventName = shareData.eventNames?.[item.id] || category;
            // 악력 종목 처리 (왼손/오른손)
            if (eventName === '악력') {
                const leftRecord = shareData.records[`${item.id}_left`];
                const rightRecord = shareData.records[`${item.id}_right`];
                const leftGrade = shareData.grades[`${item.id}_left`] || '-';
                const rightGrade = shareData.grades[`${item.id}_right`] || '-';
                const leftRanking = gradeRankings[`${item.id}_left`] || '-';
                const rightRanking = gradeRankings[`${item.id}_right`] || '-';
                // 왼손/오른손 기록이 있으면 표시
                if (leftRecord !== undefined && leftRecord !== null && leftRecord !== 0) {
                    recordsTable += `
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">${eventName} (왼손)</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${leftRecord}</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: ${this.getGradeColor(leftGrade)};">${leftGrade}</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${leftRanking}</td>
            </tr>
          `;
                }
                if (rightRecord !== undefined && rightRecord !== null && rightRecord !== 0) {
                    recordsTable += `
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">${eventName} (오른손)</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${rightRecord}</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: ${this.getGradeColor(rightGrade)};">${rightGrade}</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${rightRanking}</td>
            </tr>
          `;
                }
                // 왼손/오른손 모두 없으면 하나의 행으로 표시
                if ((leftRecord === undefined || leftRecord === null || leftRecord === 0) &&
                    (rightRecord === undefined || rightRecord === null || rightRecord === 0)) {
                    recordsTable += `
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">${eventName}</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">-</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: bold;">-</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">-</td>
            </tr>
          `;
                }
            }
            else {
                // 일반 종목 처리
                const record = shareData.records[item.id];
                const grade = shareData.grades[item.id] || '-';
                const ranking = gradeRankings[item.id] || '-';
                recordsTable += `
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">${eventName}</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${record !== undefined && record !== null && record !== 0 ? record : '-'}</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: ${this.getGradeColor(grade)};">${grade}</td>
            <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${ranking}</td>
          </tr>
        `;
            }
        });
        // 신장, 체중 추가
        const height = shareData.records.height;
        const weight = shareData.records.weight;
        const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : '-';
        const bmiGrade = shareData.grades.bodyfat || '-';
        const bmiRanking = gradeRankings.bodyfat || '-';
        if (height || weight) {
            recordsTable += `
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">신장/체중</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${height ? height + 'cm' : '-'} / ${weight ? weight + 'kg' : '-'}</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: ${this.getGradeColor(bmiGrade)};">BMI: ${bmi}</td>
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${bmiRanking}</td>
        </tr>
      `;
        }
        const lastUpdated = new Date(shareData.lastUpdated);
        modal.innerHTML = `
      <div style="background: white; padding: 16px; border-radius: 0; max-width: 100%; width: 100%; min-height: 100vh; box-shadow: none; margin: 0;">
        <!-- 상단: 학년, 반, 이름 및 업데이트 버튼 -->
        <div style="text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e0e0e0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="flex: 0 0 auto; width: 80px;"></div>
            <div style="flex: 1; text-align: center;">
              <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${shareData.gradeLevel}</div>
              <div style="font-size: 16px; color: #333; margin-bottom: 4px; font-weight: 600;">${shareData.className}</div>
              <div style="font-size: 20px; color: #007bff; font-weight: bold;">${shareData.studentName}</div>
            </div>
            <div style="flex: 0 0 auto; width: 80px; text-align: right;">
              ${shareId ? `
                <button 
                  id="refresh-paps-record-btn" 
                  style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
                >
                  <span>🔄</span>
                  <span>업데이트</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- 기록 테이블 -->
        <div style="overflow-x: auto; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #007bff; color: white;">
                <th style="padding: 8px 4px; border: 1px solid #dee2e6; text-align: left; font-size: 12px;">종목</th>
                <th style="padding: 8px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px;">기록</th>
                <th style="padding: 8px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px;">등급</th>
                <th style="padding: 8px 4px; border: 1px solid #dee2e6; text-align: center; font-size: 12px;">학년 랭킹</th>
              </tr>
            </thead>
            <tbody>
              ${recordsTable || '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #666;">입력된 기록이 없습니다.</td></tr>'}
            </tbody>
          </table>
        </div>

        ${shareData.overallGrade ? `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 16px;">
            <div style="font-size: 12px; margin-bottom: 6px; opacity: 0.9;">종합 등급</div>
            <div style="font-size: 28px; font-weight: bold;">${shareData.overallGrade}</div>
          </div>
        ` : ''}

        <!-- 운동 처방 박스 -->
        <div style="background: #f8f9fa; border: 2px solid #007bff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="font-size: 16px; font-weight: bold; color: #007bff; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <span>💡</span>
            <span>운동 처방</span>
          </div>
          <div style="line-height: 1.6; color: #333; white-space: pre-line; font-size: 14px;">${exercisePrescription}</div>
        </div>

        <div style="background: #e3f2fd; padding: 10px; border-radius: 4px; margin-bottom: 16px; text-align: center;">
          <small style="color: #666; font-size: 11px;">
            마지막 업데이트: ${lastUpdated.toLocaleString()}
          </small>
        </div>

        <div style="text-align: center; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
          <button 
            id="install-pwa-btn" 
            style="padding: 14px 20px; background: #28a745; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;"
          >
            <span>📱</span>
            <span>홈화면에 추가</span>
          </button>
          <button 
            id="close-paps-record-modal" 
            style="padding: 14px 20px; background: #007bff; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%;"
          >
            닫기
          </button>
        </div>
      </div>
    `;
        document.body.appendChild(modal);
        // 홈 화면에 추가 기능 (현재 학생 기록 URL을 바로가기로 추가)
        const installBtn = modal.querySelector('#install-pwa-btn');
        // 현재 URL 가져오기 (학생 기록 조회 URL)
        const currentUrl = window.location.href;
        // 설치 버튼 클릭 이벤트
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                showHomeScreenAddGuide(currentUrl, shareData.studentName);
            });
        }
        // 홈 화면에 추가 안내 함수
        function showHomeScreenAddGuide(url, studentName) {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
            const isSamsung = /SamsungBrowser/.test(navigator.userAgent);
            let message = '';
            let title = '홈 화면에 추가하기';
            if (isIOS) {
                if (isSafari) {
                    message = `📱 ${studentName}님의 기록을 홈 화면에 추가하는 방법:\n\n1. 화면 하단의 공유 버튼(□↑)을 누르세요\n2. 스크롤하여 "홈 화면에 추가"를 찾아 누르세요\n3. "추가" 버튼을 눌러 완료하세요\n\n홈 화면에 추가하면 언제든지 이 기록 화면을 바로 열 수 있습니다.`;
                }
                else {
                    message = `📱 iOS에서 홈 화면에 추가하려면 Safari 브라우저를 사용해주세요.\n\n현재 페이지를 Safari로 열어주세요.`;
                }
            }
            else if (isAndroid) {
                if (isChrome) {
                    message = `📱 ${studentName}님의 기록을 홈 화면에 추가하는 방법:\n\n1. 브라우저 상단의 메뉴(⋮)를 누르세요\n2. "홈 화면에 추가"를 선택하세요\n3. "추가"를 눌러 완료하세요\n\n홈 화면에 추가하면 언제든지 이 기록 화면을 바로 열 수 있습니다.`;
                }
                else if (isSamsung) {
                    message = `📱 ${studentName}님의 기록을 홈 화면에 추가하는 방법:\n\n1. 메뉴 버튼을 누르세요\n2. "홈 화면에 추가"를 선택하세요\n3. "추가"를 눌러 완료하세요\n\n홈 화면에 추가하면 언제든지 이 기록 화면을 바로 열 수 있습니다.`;
                }
                else {
                    message = `📱 ${studentName}님의 기록을 홈 화면에 추가하는 방법:\n\n1. 브라우저 메뉴(⋮)를 누르세요\n2. "홈 화면에 추가"를 선택하세요\n\n홈 화면에 추가하면 언제든지 이 기록 화면을 바로 열 수 있습니다.`;
                }
            }
            else {
                message = `📱 데스크톱에서 홈 화면에 추가:\n\nChrome/Edge: 주소창 오른쪽의 별표(⭐) 아이콘을 클릭하여 북마크에 추가하세요.\n\n또는 이 페이지를 북마크에 추가하여 빠르게 접근할 수 있습니다.`;
            }
            // 모달로 표시
            const guideModal = document.createElement('div');
            guideModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
      `;
            guideModal.innerHTML = `
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 20px;">${title}</h3>
          <div style="line-height: 1.8; color: #666; white-space: pre-line; margin-bottom: 24px; font-size: 14px;">${message}</div>
          <button 
            id="close-guide-modal" 
            style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;"
          >
            확인
          </button>
        </div>
      `;
            document.body.appendChild(guideModal);
            const closeGuideBtn = guideModal.querySelector('#close-guide-modal');
            closeGuideBtn.addEventListener('click', () => {
                document.body.removeChild(guideModal);
            });
            // 배경 클릭 시 닫기
            guideModal.addEventListener('click', (e) => {
                if (e.target === guideModal) {
                    document.body.removeChild(guideModal);
                }
            });
        }
        // 모달 닫기 함수
        const removeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        const closeBtn = modal.querySelector('#close-paps-record-modal');
        closeBtn.addEventListener('click', removeModal);
        // 업데이트 버튼 이벤트 리스너
        if (shareId) {
            const refreshBtn = modal.querySelector('#refresh-paps-record-btn');
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
                    }
                    catch (error) {
                        logError('데이터 업데이트 실패:', error);
                        this.showErrorModal('데이터 업데이트에 실패했습니다.');
                        refreshBtn.disabled = false;
                        refreshBtn.innerHTML = '<span>🔄</span><span>업데이트</span>';
                    }
                });
            }
        }
        modal.addEventListener('click', (e) => {
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
    async calculateGradeRankings(shareData) {
        try {
            const { collection, query, where, getDocs, db } = window.firebase || {};
            if (!db || !collection || !query || !where || !getDocs) {
                logger.debug('[학년 랭킹] Firebase가 초기화되지 않았습니다.');
                return {};
            }
            console.log('[학년 랭킹] 계산 시작:', {
                gradeLevel: shareData.gradeLevel,
                studentGender: shareData.studentGender,
                studentId: shareData.studentId
            });
            // 동일 학년, 동일 성별의 모든 학생 데이터 가져오기
            const q = query(collection(db, 'sharedPapsStudents'), where('gradeLevel', '==', shareData.gradeLevel), where('studentGender', '==', shareData.studentGender));
            const querySnapshot = await getDocs(q);
            const allStudents = [];
            querySnapshot.forEach((doc) => {
                allStudents.push(doc.data());
            });
            console.log('[학년 랭킹] 조회된 학생 수:', allStudents.length);
            const rankings = {};
            // 각 종목별로 랭킹 계산
            const categories = ['endurance', 'flexibility', 'strength', 'power', 'bodyfat'];
            categories.forEach(categoryId => {
                // 악력의 경우 왼손/오른손을 별도로 처리
                if (categoryId === 'strength') {
                    // 왼손 악력 랭킹 계산
                    const leftRecord = shareData.records[`${categoryId}_left`];
                    if (leftRecord !== undefined && leftRecord !== null && leftRecord !== 0) {
                        const studentsWithLeftRecord = allStudents.filter(s => s.records[`${categoryId}_left`] !== undefined &&
                            s.records[`${categoryId}_left`] !== null &&
                            s.records[`${categoryId}_left`] !== 0);
                        if (studentsWithLeftRecord.length > 0) {
                            studentsWithLeftRecord.sort((a, b) => {
                                const recordA = a.records[`${categoryId}_left`] || 0;
                                const recordB = b.records[`${categoryId}_left`] || 0;
                                return recordB - recordA; // 악력은 높을수록 좋음
                            });
                            const rank = studentsWithLeftRecord.findIndex(s => s.studentId === shareData.studentId) + 1;
                            const total = studentsWithLeftRecord.length;
                            rankings[`${categoryId}_left`] = rank > 0 ? `${rank}위 / ${total}명` : '-';
                        }
                        else {
                            rankings[`${categoryId}_left`] = '-';
                        }
                    }
                    else {
                        rankings[`${categoryId}_left`] = '-';
                    }
                    // 오른손 악력 랭킹 계산
                    const rightRecord = shareData.records[`${categoryId}_right`];
                    if (rightRecord !== undefined && rightRecord !== null && rightRecord !== 0) {
                        const studentsWithRightRecord = allStudents.filter(s => s.records[`${categoryId}_right`] !== undefined &&
                            s.records[`${categoryId}_right`] !== null &&
                            s.records[`${categoryId}_right`] !== 0);
                        if (studentsWithRightRecord.length > 0) {
                            studentsWithRightRecord.sort((a, b) => {
                                const recordA = a.records[`${categoryId}_right`] || 0;
                                const recordB = b.records[`${categoryId}_right`] || 0;
                                return recordB - recordA; // 악력은 높을수록 좋음
                            });
                            const rank = studentsWithRightRecord.findIndex(s => s.studentId === shareData.studentId) + 1;
                            const total = studentsWithRightRecord.length;
                            rankings[`${categoryId}_right`] = rank > 0 ? `${rank}위 / ${total}명` : '-';
                        }
                        else {
                            rankings[`${categoryId}_right`] = '-';
                        }
                    }
                    else {
                        rankings[`${categoryId}_right`] = '-';
                    }
                }
                else if (categoryId === 'bodyfat') {
                    // BMI 랭킹 계산 (신장과 체중으로 계산)
                    const height = shareData.records.height;
                    const weight = shareData.records.weight;
                    if (!height || !weight || height <= 0 || weight <= 0) {
                        rankings[categoryId] = '-';
                        return;
                    }
                    const currentBMI = weight / ((height / 100) ** 2);
                    // BMI가 있는 학생들만 필터링
                    const studentsWithBMI = allStudents.filter(s => {
                        const h = s.records.height;
                        const w = s.records.weight;
                        return h && w && h > 0 && w > 0;
                    });
                    if (studentsWithBMI.length === 0) {
                        rankings[categoryId] = '-';
                        return;
                    }
                    // BMI 기준으로 정렬 (BMI는 정상 범위에 가까울수록 좋음, 하지만 일단 높은 순으로 정렬)
                    // 실제로는 BMI 등급 기준으로 정렬하는 것이 더 정확하지만, 일단 BMI 값으로 정렬
                    studentsWithBMI.sort((a, b) => {
                        const bmiA = (a.records.weight || 0) / (((a.records.height || 0) / 100) ** 2);
                        const bmiB = (b.records.weight || 0) / (((b.records.height || 0) / 100) ** 2);
                        // BMI는 정상 범위(약 18.5-25)에 가까울수록 좋으므로, 절대값 차이로 정렬
                        const normalBMI = 22; // 정상 BMI 기준값
                        const diffA = Math.abs(bmiA - normalBMI);
                        const diffB = Math.abs(bmiB - normalBMI);
                        return diffA - diffB; // 정상 범위에 가까운 순으로 정렬
                    });
                    // 현재 학생의 순위 찾기
                    const rank = studentsWithBMI.findIndex(s => s.studentId === shareData.studentId) + 1;
                    const total = studentsWithBMI.length;
                    rankings[categoryId] = rank > 0 ? `${rank}위 / ${total}명` : '-';
                }
                else {
                    // 일반 종목 랭킹 계산
                    const studentRecord = shareData.records[categoryId];
                    if (studentRecord === undefined || studentRecord === null || studentRecord === 0) {
                        rankings[categoryId] = '-';
                        return;
                    }
                    // 해당 종목에 기록이 있는 학생들만 필터링
                    const studentsWithRecord = allStudents.filter(s => s.records[categoryId] !== undefined &&
                        s.records[categoryId] !== null &&
                        s.records[categoryId] !== 0);
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
                }
            });
            console.log('[학년 랭킹] 계산 완료:', rankings);
            return rankings;
        }
        catch (error) {
            console.error('[학년 랭킹] 계산 실패:', error);
            logError('학년 랭킹 계산 실패:', error);
            return {};
        }
    }
    /**
     * AI 운동 처방을 생성합니다.
     * @param shareData 공유 데이터
     * @returns 운동 처방 텍스트
     */
    generateExercisePrescription(shareData) {
        const studentName = shareData.studentName;
        const prescriptions = [];
        // 각 종목별 평가 및 처방
        Object.keys(shareData.grades).forEach(categoryId => {
            const grade = shareData.grades[categoryId];
            const record = shareData.records[categoryId];
            if (!grade || (record === undefined && categoryId !== 'bodyfat'))
                return;
            const gradeNum = parseInt(grade.replace('등급', '').replace('정상', '2').replace('과체중', '3').replace('비만', '5').replace('마름', '4')) || 3;
            let categoryName = '';
            let prescription = '';
            let emoji = '';
            switch (categoryId) {
                case 'endurance':
                    categoryName = '심폐지구력';
                    emoji = '🏃';
                    const enduranceEvent = shareData.eventNames?.endurance || '심폐지구력';
                    const enduranceRecord = record !== undefined && record !== null && record !== 0 ? record : '-';
                    if (gradeNum >= 4) {
                        prescription = `${emoji} ${studentName}님의 ${enduranceEvent} 기록은 ${enduranceRecord}이며 ${grade}입니다. 현재 수준을 유지하기 위해 주 2-3회 유산소 운동을 지속하세요.\n\n💪 추천 운동:\n• 조깅: 주 2회, 20-30분, 중간 강도\n• 자전거 타기: 주 1회, 30-40분`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${studentName}님의 ${enduranceEvent} 기록은 ${enduranceRecord}이며 ${grade}입니다. 주 3-4회 30분 이상의 유산소 운동을 권장합니다.\n\n💪 추천 운동:\n• 조깅: 주 3회, 20-30분, 점진적 강도 증가\n• 왕복오래달리기 연습: 주 2회, 5-10분씩`;
                    }
                    else {
                        prescription = `${emoji} ${studentName}님의 ${enduranceEvent} 기록은 ${enduranceRecord}이며 ${grade}입니다. 주 4-5회 20-30분 유산소 운동을 시작하고, 점진적으로 강도와 시간을 늘려가세요.\n\n💪 추천 운동:\n• 걷기: 매일 20-30분, 빠른 걸음으로 시작\n• 조깅: 주 3-4회, 10-20분씩, 천천히 시작`;
                    }
                    break;
                case 'flexibility':
                    categoryName = '유연성';
                    emoji = '🤸';
                    const flexibilityEvent = shareData.eventNames?.flexibility || '유연성';
                    const flexibilityRecord = record !== undefined && record !== null && record !== 0 ? record : '-';
                    if (gradeNum >= 4) {
                        prescription = `${emoji} ${studentName}님의 ${flexibilityEvent} 기록은 ${flexibilityRecord}이며 ${grade}입니다. 현재 수준 유지를 위해 매일 10-15분 스트레칭을 실시하세요.\n\n💪 추천 운동:\n• 아침 기상 후 스트레칭: 5-10분\n• 운동 후 정적 스트레칭: 10-15분`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${studentName}님의 ${flexibilityEvent} 기록은 ${flexibilityRecord}이며 ${grade}입니다. 매일 15-20분 스트레칭을 통해 유연성을 향상시키세요.\n\n💪 추천 운동:\n• 앉아윗몸앞으로굽히기 연습: 매일 10회, 각 15-20초 유지\n• 다리 스트레칭: 매일 2세트, 각 30초씩`;
                    }
                    else {
                        prescription = `${emoji} ${studentName}님의 ${flexibilityEvent} 기록은 ${flexibilityRecord}이며 ${grade}입니다. 매일 20-30분 정적 스트레칭을 실시하고, 운동 전후 반드시 준비운동과 정리운동을 하세요.\n\n💪 추천 운동:\n• 앉아윗몸앞으로굽히기 연습: 매일 3세트, 각 20-30초 유지\n• 다리 뒤쪽 스트레칭: 매일 3세트, 각 30초씩`;
                    }
                    break;
                case 'strength':
                case 'strength_left':
                case 'strength_right':
                    categoryName = '근력/근지구력';
                    emoji = '💪';
                    const strengthEvent = shareData.eventNames?.strength || '근력';
                    const isLeft = categoryId === 'strength_left';
                    const isRight = categoryId === 'strength_right';
                    const handText = isLeft ? ' (왼손)' : isRight ? ' (오른손)' : '';
                    const strengthRecord = (isLeft ? shareData.records[`${categoryId}_left`] : isRight ? shareData.records[`${categoryId}_right`] : record) !== undefined &&
                        (isLeft ? shareData.records[`${categoryId}_left`] : isRight ? shareData.records[`${categoryId}_right`] : record) !== null &&
                        (isLeft ? shareData.records[`${categoryId}_left`] : isRight ? shareData.records[`${categoryId}_right`] : record) !== 0
                        ? (isLeft ? shareData.records[`${categoryId}_left`] : isRight ? shareData.records[`${categoryId}_right`] : record) : '-';
                    if (gradeNum >= 4) {
                        prescription = `${emoji} ${studentName}님의 ${strengthEvent}${handText} 기록은 ${strengthRecord}이며 ${grade}입니다. 근지구력 향상을 위해 반복 횟수를 늘린 운동을 추가하세요.\n\n💪 추천 운동:\n• 악력 연습: 주 3-4회, 3세트, 각 10-15회\n• 팔굽혀펴기: 주 3회, 3세트, 각 15-20회`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${studentName}님의 ${strengthEvent}${handText} 기록은 ${strengthRecord}이며 ${grade}입니다. 주 3-4회 근력 운동을 실시하세요.\n\n💪 추천 운동:\n• 악력 연습: 주 3-4회, 3세트, 각 8-12회\n• 팔굽혀펴기: 주 3회, 3세트, 각 10-15회`;
                    }
                    else {
                        prescription = `${emoji} ${studentName}님의 ${strengthEvent}${handText} 기록은 ${strengthRecord}이며 ${grade}입니다. 주 4-5회 근력 운동을 시작하고, 점진적으로 횟수와 세트를 늘려가세요.\n\n💪 추천 운동:\n• 악력 연습: 주 4-5회, 2-3세트, 각 5-10회 (점진적 증가)\n• 팔굽혀펴기: 주 4회, 2-3세트, 각 5-10회 (무릎 대고 시작 가능)`;
                    }
                    break;
                case 'power':
                    categoryName = '순발력';
                    emoji = '⚡';
                    const powerEvent = shareData.eventNames?.power || '순발력';
                    const powerRecord = record !== undefined && record !== null && record !== 0 ? record : '-';
                    if (gradeNum >= 4) {
                        prescription = `${emoji} ${studentName}님의 ${powerEvent} 기록은 ${powerRecord}이며 ${grade}입니다. 폭발적인 움직임을 유지하기 위해 플라이오메트릭 운동을 지속하세요.\n\n💪 추천 운동:\n• 제자리멀리뛰기 연습: 주 2-3회, 3세트, 각 5-10회\n• 박스 점프: 주 2회, 3세트, 각 5-8회`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${studentName}님의 ${powerEvent} 기록은 ${powerRecord}이며 ${grade}입니다. 폭발적인 움직임 연습을 주 2-3회 실시하세요.\n\n💪 추천 운동:\n• 제자리멀리뛰기 연습: 주 3회, 3세트, 각 5-8회\n• 제자리 높이뛰기: 주 2-3회, 3세트, 각 10-15회`;
                    }
                    else {
                        prescription = `${emoji} ${studentName}님의 ${powerEvent} 기록은 ${powerRecord}이며 ${grade}입니다. 폭발적인 움직임 연습을 주 3-4회 실시하세요.\n\n💪 추천 운동:\n• 제자리멀리뛰기 연습: 주 3-4회, 3세트, 각 5-8회\n• 제자리 높이뛰기: 주 3회, 3세트, 각 10-15회`;
                    }
                    break;
                case 'bodyfat':
                    categoryName = '체지방';
                    emoji = '📊';
                    const height = shareData.records.height;
                    const weight = shareData.records.weight;
                    const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : '-';
                    if (grade === '정상') {
                        prescription = `${emoji} ${studentName}님의 BMI는 ${bmi}이며 ${grade}입니다. 균형 잡힌 식단과 규칙적인 운동을 유지하세요.\n\n💪 추천 관리:\n• 식단: 하루 3끼 규칙적으로, 과식 금지\n• 유산소 운동: 주 2-3회, 30분 이상`;
                    }
                    else if (grade === '과체중') {
                        prescription = `${emoji} ${studentName}님의 BMI는 ${bmi}이며 ${grade}입니다. 주 4-5회 유산소 운동과 식단 조절을 통해 체중 관리를 하세요.\n\n💪 추천 관리:\n• 식단 조절: 하루 3끼 규칙적으로, 저칼로리 식단\n• 유산소 운동: 주 4-5회, 40-50분 (조깅, 자전거, 수영)`;
                    }
                    else {
                        prescription = `${emoji} ${studentName}님의 BMI는 ${bmi}이며 ${grade}입니다. 전문가 상담 후 식단 조절과 규칙적인 유산소 운동을 병행하세요.\n\n💪 추천 관리:\n• 전문가 상담: 영양사 또는 의사 상담 권장\n• 유산소 운동: 주 5회 이상, 50분 이상 (조깅, 자전거, 수영, 걷기)`;
                    }
                    break;
            }
            if (prescription) {
                prescriptions.push(prescription);
            }
        });
        // 종합 등급에 따른 전체 평가
        if (shareData.overallGrade) {
            const overallGradeNum = parseInt(shareData.overallGrade.replace('등급', '')) || 3;
            let overallAssessment = '';
            if (overallGradeNum <= 2) {
                overallAssessment = `\n\n⭐ ${studentName}님, 전반적으로 체력이 우수합니다! 현재 운동 습관을 유지하면서 다양한 종목에 도전해보세요. 꾸준한 운동으로 더욱 발전할 수 있습니다.`;
            }
            else if (overallGradeNum === 3) {
                overallAssessment = `\n\n⭐ ${studentName}님, 전반적인 체력이 보통 수준입니다. 약한 종목에 집중하여 균형 잡힌 체력을 기르세요. 위에 제시한 운동 처방을 꾸준히 실천하면 체력 향상에 도움이 됩니다.`;
            }
            else {
                overallAssessment = `\n\n⭐ ${studentName}님, 체력 향상이 필요합니다. 전문가 상담을 받고 단계적으로 운동 강도를 높여가세요. 위에 제시한 운동 처방을 주 4-5회 이상 꾸준히 실천하시면 체력이 향상될 것입니다. 꾸준함이 가장 중요합니다!`;
            }
            prescriptions.push(overallAssessment);
        }
        return prescriptions.length > 0 ? prescriptions.join('\n\n') : `📝 ${studentName}님, 기록이 부족하여 운동 처방을 제공할 수 없습니다. PAPS 기록을 입력해주세요.`;
    }
    /**
     * 등급에 따른 색상을 반환합니다.
     * @param grade 등급
     * @returns 색상 코드
     */
    getGradeColor(grade) {
        if (grade.includes('1등급'))
            return '#28a745';
        if (grade.includes('2등급'))
            return '#17a2b8';
        if (grade.includes('3등급'))
            return '#ffc107';
        if (grade.includes('4등급'))
            return '#fd7e14';
        if (grade.includes('5등급'))
            return '#dc3545';
        return '#333';
    }
    /**
     * 에러 모달을 표시합니다.
     * @param message 에러 메시지
     */
    showErrorModal(message) {
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
        const closeBtn = modal.querySelector('#close-error-modal');
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
export function createShareManager(options = {}) {
    return new ShareManager(options);
}
// ========================================
// 기본 내보내기
// ========================================
export default ShareManager;
//# sourceMappingURL=shareManager.js.map