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
            console.log('[ShareManager] showPapsStudentRecord 호출 시작');
            console.log('[ShareManager] shareData:', {
                studentName: shareData.studentName,
                gradeLevel: shareData.gradeLevel,
                studentGender: shareData.studentGender,
                studentId: shareData.studentId
            });
            await this.showPapsStudentRecord(shareData, shareId);
            console.log('[ShareManager] showPapsStudentRecord 호출 완료');
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
        console.log('[학년 랭킹] 랭킹 계산 시작 - shareData:', {
            gradeLevel: shareData.gradeLevel,
            studentGender: shareData.studentGender,
            studentId: shareData.studentId,
            records: shareData.records
        });
        const gradeRankings = await this.calculateGradeRankings(shareData);
        console.log('[학년 랭킹] 표시용 랭킹 데이터:', gradeRankings);
        console.log('[학년 랭킹] 랭킹 데이터 키 목록:', Object.keys(gradeRankings));
        console.log('[학년 랭킹] shareData.records 키 목록:', Object.keys(shareData.records || {}));
        // PAPS 항목 정의 (체지방 제외 - 신장/체중 행에서만 표시)
        const PAPS_ITEMS = {
            "심폐지구력": { id: "endurance", label: "심폐지구력" },
            "유연성": { id: "flexibility", label: "유연성" },
            "근력/근지구력": { id: "strength", label: "근력/근지구력" },
            "순발력": { id: "power", label: "순발력" }
        };
        // 랭킹이 비어있으면 경고
        if (Object.keys(gradeRankings).length === 0) {
            console.warn('[학년 랭킹] ⚠️ 랭킹 데이터가 비어있습니다!');
        }
        else {
            // 각 종목별 랭킹 데이터 확인
            Object.keys(PAPS_ITEMS).forEach(category => {
                const item = PAPS_ITEMS[category];
                const eventName = shareData.eventNames?.[item.id] || category;
                if (eventName === '악력') {
                    const leftRanking = gradeRankings[`${item.id}_left`] || '-';
                    const rightRanking = gradeRankings[`${item.id}_right`] || '-';
                    console.log(`[학년 랭킹] ${eventName} - 왼손: ${leftRanking}, 오른손: ${rightRanking}`);
                }
                else {
                    const ranking = gradeRankings[item.id] || '-';
                    console.log(`[학년 랭킹] ${eventName} (${item.id}): ${ranking}`);
                }
            });
        }
        // 모바일 디버깅용: 화면에 로그 표시 (개발 모드에서만)
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1') || window.location.search.includes('debug=true')) {
            this.showDebugLogs(gradeRankings, shareData);
        }
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
        // 랭킹 데이터 확인 및 디버깅
        console.log('[학년 랭킹] 화면 표시 전 랭킹 데이터 확인:', gradeRankings);
        Object.keys(PAPS_ITEMS).forEach(category => {
            const item = PAPS_ITEMS[category];
            const eventName = shareData.eventNames?.[item.id] || category;
            if (eventName === '악력') {
                const leftRanking = gradeRankings[`${item.id}_left`] || '-';
                const rightRanking = gradeRankings[`${item.id}_right`] || '-';
                console.log(`[학년 랭킹] ${eventName} - 왼손: ${leftRanking}, 오른손: ${rightRanking}`);
            }
            else {
                const ranking = gradeRankings[item.id] || '-';
                console.log(`[학년 랭킹] ${eventName} (${item.id}): ${ranking}`);
            }
        });
        // 기록 테이블 생성 - 모든 종목 표시
        let recordsTable = '';
        Object.keys(PAPS_ITEMS).forEach(category => {
            const item = PAPS_ITEMS[category];
            const eventName = shareData.eventNames?.[item.id] || category;
            // 악력 종목 처리 (왼손/오른손을 따로 표시)
            if (eventName === '악력') {
                const leftRecord = shareData.records[`${item.id}_left`];
                const rightRecord = shareData.records[`${item.id}_right`];
                const leftGrade = shareData.grades[`${item.id}_left`] || '-';
                const rightGrade = shareData.grades[`${item.id}_right`] || '-';
                const leftRanking = gradeRankings[`${item.id}_left`] || '-';
                const rightRanking = gradeRankings[`${item.id}_right`] || '-';
                // 왼손 악력 행
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
                // 오른손 악력 행
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
        // 신장, 체중 추가 (랭킹 없음)
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
          <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">-</td>
        </tr>
      `;
        }
        const lastUpdated = new Date(shareData.lastUpdated);
        modal.innerHTML = `
      <style>
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 8px;
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }
        .ai-badge .sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
      </style>
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
          <div style="font-size: 16px; font-weight: bold; color: #007bff; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span>💡</span>
            <span>운동 처방</span>
            <span class="ai-badge">
              <span class="sparkle">✨</span>
              <span>AI 조언</span>
            </span>
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
            <span>🔗</span>
            <span>내 기록 보기 URL(주소)</span>
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
        // 학생 기록 조회 URL 생성 (paps 파라미터 포함)
        const studentRecordUrl = shareId
            ? `${window.location.origin}${window.location.pathname}?paps=${shareId}`
            : window.location.href;
        // PWA 설치 이벤트 완전 차단 (체육 수업 도우미 앱 설치 방지)
        const preventPWAInstall = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (window.deferredPrompt) {
                window.deferredPrompt = null;
            }
            return false;
        };
        window.addEventListener('beforeinstallprompt', preventPWAInstall, { capture: true });
        // 내 기록 보기 URL 표시 기능
        const installBtn = modal.querySelector('#install-pwa-btn');
        // 버튼 클릭 이벤트 - 링크 주소와 복사 버튼만 표시
        if (installBtn) {
            installBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // 링크 주소 모달 표시
                const urlModal = document.createElement('div');
                urlModal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10002;
        `;
                urlModal.innerHTML = `
          <div style="background: white; padding: 24px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h3 style="margin: 0 0 16px 0; color: #333; font-size: 20px;">내 기록 보기 URL</h3>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #dee2e6;">
              <div style="font-size: 12px; color: #666; margin-bottom: 6px;">링크 주소:</div>
              <div style="font-size: 11px; color: #333; word-break: break-all; font-family: monospace;">${studentRecordUrl}</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button 
                id="copy-url-btn" 
                style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;"
              >
                📋 링크 복사
              </button>
              <button 
                id="close-url-modal" 
                style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;"
              >
                닫기
              </button>
            </div>
          </div>
        `;
                document.body.appendChild(urlModal);
                // 링크 복사 버튼
                const copyUrlBtn = urlModal.querySelector('#copy-url-btn');
                if (copyUrlBtn) {
                    copyUrlBtn.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(studentRecordUrl);
                            copyUrlBtn.textContent = '✅ 복사 완료';
                            copyUrlBtn.style.background = '#28a745';
                            setTimeout(() => {
                                copyUrlBtn.textContent = '📋 링크 복사';
                            }, 2000);
                        }
                        catch (error) {
                            console.error('링크 복사 실패:', error);
                            copyUrlBtn.textContent = '❌ 복사 실패';
                            setTimeout(() => {
                                copyUrlBtn.textContent = '📋 링크 복사';
                            }, 2000);
                        }
                    });
                }
                // 닫기 버튼
                const closeUrlBtn = urlModal.querySelector('#close-url-modal');
                if (closeUrlBtn) {
                    closeUrlBtn.addEventListener('click', () => {
                        document.body.removeChild(urlModal);
                    });
                }
                // 배경 클릭 시 닫기
                urlModal.addEventListener('click', (e) => {
                    if (e.target === urlModal) {
                        document.body.removeChild(urlModal);
                    }
                });
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
          <div style="line-height: 1.8; color: #666; white-space: pre-line; margin-bottom: 16px; font-size: 14px;">${message}</div>
          <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #dee2e6;">
            <div style="font-size: 12px; color: #666; margin-bottom: 6px;">링크 주소:</div>
            <div style="font-size: 11px; color: #333; word-break: break-all; font-family: monospace;">${url}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button 
              id="copy-url-btn" 
              style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;"
            >
              📋 링크 복사
            </button>
            <button 
              id="close-guide-modal" 
              style="flex: 1; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;"
            >
              확인
            </button>
          </div>
        </div>
      `;
            document.body.appendChild(guideModal);
            // 링크 복사 버튼
            const copyUrlBtn = guideModal.querySelector('#copy-url-btn');
            if (copyUrlBtn) {
                copyUrlBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(url);
                        copyUrlBtn.textContent = '✅ 복사 완료';
                        copyUrlBtn.style.background = '#28a745';
                        setTimeout(() => {
                            copyUrlBtn.textContent = '📋 링크 복사';
                        }, 2000);
                    }
                    catch (error) {
                        console.error('링크 복사 실패:', error);
                        copyUrlBtn.textContent = '❌ 복사 실패';
                        setTimeout(() => {
                            copyUrlBtn.textContent = '📋 링크 복사';
                        }, 2000);
                    }
                });
            }
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
                // beforeinstallprompt 이벤트 리스너는 전역으로 등록되어 있으므로 제거하지 않음
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
            const firebase = window.firebase;
            console.log('[학년 랭킹] Firebase 객체 확인:', {
                exists: !!firebase,
                hasDb: !!firebase?.db,
                hasCollection: !!firebase?.collection,
                hasGetDocs: !!firebase?.getDocs
            });
            const { collection, query, where, getDocs, db } = firebase || {};
            if (!db || !collection || !query || !where || !getDocs) {
                console.error('[학년 랭킹] ❌ Firebase가 초기화되지 않았습니다.', {
                    db: !!db,
                    collection: !!collection,
                    query: !!query,
                    where: !!where,
                    getDocs: !!getDocs
                });
                logger.debug('[학년 랭킹] Firebase가 초기화되지 않았습니다.');
                return {};
            }
            console.log('[학년 랭킹] ✅ Firebase 초기화 확인 완료');
            console.log('[학년 랭킹] 계산 시작:', {
                gradeLevel: shareData.gradeLevel,
                studentGender: shareData.studentGender,
                studentId: shareData.studentId
            });
            // studentId를 숫자로 변환하여 일관성 유지
            const currentStudentId = Number(shareData.studentId);
            const targetClassId = Number(shareData.classId);
            // papsManager.ts의 searchRanking과 동일하게 현재 학생이 속한 사용자의 클래스만 사용
            // shareData.classId를 통해 해당 클래스를 소유한 사용자를 찾음
            console.log('[학년 랭킹] users 컬렉션 조회 시작 (현재 학생이 속한 사용자의 클래스만 수집)...');
            console.log('[학년 랭킹] shareData.classId:', shareData.classId);
            console.log('[학년 랭킹] targetClassId:', targetClassId);
            console.log('[학년 랭킹] db 객체:', db);
            console.log('[학년 랭킹] collection 함수:', typeof collection);
            console.log('[학년 랭킹] getDocs 함수:', typeof getDocs);
            let usersSnapshot;
            try {
                const usersRef = collection(db, 'users');
                console.log('[학년 랭킹] users 컬렉션 참조 생성 완료:', usersRef);
                usersSnapshot = await getDocs(usersRef);
                console.log('[학년 랭킹] users 조회 완료, 문서 수:', usersSnapshot.size);
            }
            catch (error) {
                console.error('[학년 랭킹] ❌ users 조회 실패:', error);
                console.error('[학년 랭킹] 에러 상세:', {
                    message: error?.message,
                    code: error?.code,
                    stack: error?.stack
                });
                return {};
            }
            // 현재 학생이 속한 사용자 찾기 (classId로 매칭)
            let targetUserData = null;
            let targetUserId = null;
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                if (userData.paps && userData.paps.classes && Array.isArray(userData.paps.classes)) {
                    // classId가 일치하는 클래스를 찾음
                    const matchingClass = userData.paps.classes.find((classData) => {
                        return classData && typeof classData === 'object' &&
                            'id' in classData && Number(classData.id) === targetClassId;
                    });
                    if (matchingClass) {
                        targetUserData = userData;
                        targetUserId = userDoc.id;
                        console.log('[학년 랭킹] ✅ 현재 학생이 속한 사용자 찾음:', {
                            userId: targetUserId,
                            classId: targetClassId,
                            className: matchingClass.name
                        });
                    }
                }
            });
            if (!targetUserData) {
                console.error('[학년 랭킹] ❌ 현재 학생이 속한 사용자를 찾을 수 없습니다.', {
                    classId: targetClassId
                });
                return {};
            }
            const allStudents = [];
            // papsManager.ts의 searchRanking과 완전히 동일하게 구현
            // 현재 학생이 속한 사용자의 클래스만 사용 (papsManager.ts와 동일)
            // 중요: papsManager.ts의 searchRanking과 동일하게 중복 제거를 하지 않음
            // 같은 학생이 여러 클래스에 있으면 여러 번 추가됨 (papsManager.ts와 동일)
            // 중요: PAPS 수업 메뉴에서 생성된 클래스만 수집 (userData.paps.classes만 사용)
            // 다른 메뉴(수업 진도 관리, 리그전, 토너먼트)의 클래스는 제외
            let totalClassesChecked = 0;
            let matchingClassesCount = 0;
            // 현재 학생이 속한 사용자의 클래스만 순회 (papsManager.ts와 동일)
            if (targetUserData.paps && targetUserData.paps.classes && Array.isArray(targetUserData.paps.classes)) {
                targetUserData.paps.classes.forEach((classData) => {
                    // PAPS 클래스인지 확인 (id, name, gradeLevel, students 필드가 있어야 함)
                    if (!classData || typeof classData !== 'object') {
                        return;
                    }
                    // PAPS 클래스 구조 확인 (id와 students 필드가 있어야 함)
                    if (!('id' in classData) || !('students' in classData)) {
                        console.warn('[학년 랭킹] PAPS 클래스 구조가 아닌 데이터 발견, 건너뜀:', classData);
                        return;
                    }
                    totalClassesChecked++;
                    // papsManager.ts의 searchRanking과 동일하게 학년 필터링
                    if (classData.gradeLevel === shareData.gradeLevel && classData.students && Array.isArray(classData.students)) {
                        matchingClassesCount++;
                        const studentsInClass = classData.students.length || 0;
                        let matchingStudentsInClass = 0;
                        // papsManager.ts의 searchRanking과 동일하게 학생 순회 (중복 제거 없음)
                        classData.students.forEach((student) => {
                            // papsManager.ts와 동일하게 성별 필터링
                            if (student && student.gender === shareData.studentGender) {
                                matchingStudentsInClass++;
                                const studentId = Number(student.id || student.studentId);
                                if (isNaN(studentId) || studentId <= 0) {
                                    return;
                                }
                                // papsManager.ts와 동일하게 중복 제거 없이 추가
                                // 같은 학생이 여러 클래스에 있으면 여러 번 추가됨
                                allStudents.push({
                                    studentId: studentId,
                                    records: { ...(student.records || {}) },
                                    name: student.name || '',
                                    gender: student.gender || ''
                                });
                            }
                        });
                        console.log(`[학년 랭킹] 매칭된 PAPS 클래스 ${matchingClassesCount}: 총 학생 ${studentsInClass}명, 같은 성별 ${matchingStudentsInClass}명`);
                    }
                });
            }
            console.log(`[학년 랭킹] 조회 결과: 사용자 ${targetUserId}, ${totalClassesChecked}개 클래스, 같은 학년 ${matchingClassesCount}개 클래스, 수집된 학생 ${allStudents.length}명 (중복 제거 없음, papsManager.ts와 동일)`);
            console.log(`[학년 랭킹] 수집된 학생 ID 목록 (처음 10명):`, allStudents.slice(0, 10).map(s => ({ id: s.studentId, name: s.name })));
            // 전역 변수에 디버깅 정보 저장 (화면 표시용)
            window.__rankingDebugInfo = {
                classesCount: totalClassesChecked,
                matchingClasses: matchingClassesCount,
                studentsCount: allStudents.length,
                gradeLevel: shareData.gradeLevel,
                studentGender: shareData.studentGender,
                userId: targetUserId
            };
            // 디버깅: 수집된 학생이 없으면 경고
            if (allStudents.length === 0) {
                console.warn('[학년 랭킹] ⚠️ 같은 학년/성별 학생을 찾을 수 없습니다!', {
                    gradeLevel: shareData.gradeLevel,
                    studentGender: shareData.studentGender,
                    totalClasses: totalClassesChecked,
                    matchingClasses: matchingClassesCount,
                    userId: targetUserId
                });
                // 현재 사용자의 데이터 구조 확인
                if (targetUserData && targetUserData.paps && targetUserData.paps.classes && Array.isArray(targetUserData.paps.classes) && targetUserData.paps.classes.length > 0) {
                    const firstClass = targetUserData.paps.classes[0];
                    console.log('[학년 랭킹] 첫 번째 클래스 샘플:', {
                        gradeLevel: firstClass.gradeLevel,
                        studentsCount: firstClass.students?.length || 0,
                        firstStudent: firstClass.students?.[0] || null
                    });
                }
            }
            // papsManager.ts와 동일하게 현재 학생은 이미 allStudents에 포함되어 있음
            // (현재 학생이 속한 사용자의 클래스를 순회하므로)
            // 모든 studentId를 숫자로 통일
            allStudents.forEach(s => {
                s.studentId = Number(s.studentId);
            });
            console.log('[학년 랭킹] 조회된 학생 수:', allStudents.length);
            console.log('[학년 랭킹] 현재 학생 정보:', {
                studentId: shareData.studentId,
                studentName: shareData.studentName,
                gradeLevel: shareData.gradeLevel,
                studentGender: shareData.studentGender
            });
            console.log('[학년 랭킹] 학생 ID 목록:', allStudents.map(s => ({ id: s.studentId, name: s.name })));
            const rankings = {};
            // papsManager.ts의 calculateRanks와 findRankForRecord 함수와 동일한 로직
            const calculateRanks = (sortedRecords) => {
                const ranks = [];
                for (let i = 0; i < sortedRecords.length; i++) {
                    // 첫 번째 항목이거나 이전 기록과 다른 경우 새로운 순위 시작
                    if (i === 0 || sortedRecords[i].record !== sortedRecords[i - 1].record) {
                        // 현재 위치가 순위 (1부터 시작)
                        ranks.push(i + 1);
                    }
                    else {
                        // 이전 기록과 같은 경우 이전 순위와 동일
                        ranks.push(ranks[i - 1]);
                    }
                }
                return ranks;
            };
            const findRankForRecord = (sortedRecords, targetRecord) => {
                const ranks = calculateRanks(sortedRecords);
                const index = sortedRecords.findIndex(item => item.record === targetRecord);
                return index >= 0 ? ranks[index] : 0;
            };
            // papsManager.ts의 searchRanking과 완전히 동일하게 종목별로 기록이 있는 학생만 수집
            // 각 종목별로 랭킹 계산 ('우리 학교 PAPS 종목별 랭킹' 로직과 동일)
            // bodyfat(신장/체중)은 랭킹 계산 제외
            const categories = ['endurance', 'flexibility', 'strength', 'power'];
            categories.forEach(categoryId => {
                // 악력의 경우 왼손/오른손을 별도로 처리
                if (categoryId === 'strength') {
                    // 먼저 악력(왼손/오른손)이 있는지 확인
                    const leftRecord = shareData.records[`${categoryId}_left`];
                    const rightRecord = shareData.records[`${categoryId}_right`];
                    const hasGripStrength = (leftRecord !== undefined && leftRecord !== null && leftRecord !== 0) ||
                        (rightRecord !== undefined && rightRecord !== null && rightRecord !== 0);
                    if (hasGripStrength) {
                        // 왼손 악력 랭킹 계산
                        if (leftRecord !== undefined && leftRecord !== null && leftRecord !== 0) {
                            // papsManager.ts의 searchRanking과 동일하게 종목별로 기록이 있는 학생만 수집
                            // studentId도 함께 저장하여 현재 학생을 정확히 식별
                            const recordsWithNames = [];
                            // 현재 학생이 속한 사용자의 클래스만 순회 (papsManager.ts와 동일)
                            if (targetUserData.paps && targetUserData.paps.classes && Array.isArray(targetUserData.paps.classes)) {
                                targetUserData.paps.classes.forEach((classData) => {
                                    if (!classData || typeof classData !== 'object' || !('id' in classData) || !('students' in classData)) {
                                        return;
                                    }
                                    if (classData.gradeLevel === shareData.gradeLevel && classData.students && Array.isArray(classData.students)) {
                                        classData.students.forEach((student) => {
                                            if (student && student.gender === shareData.studentGender) {
                                                const record = student.records?.[`${categoryId}_left`];
                                                if (record !== undefined && record !== null &&
                                                    typeof record === 'number' && !isNaN(record) &&
                                                    isFinite(record) && record !== 0) {
                                                    const studentId = Number(student.id || student.studentId);
                                                    recordsWithNames.push({
                                                        record,
                                                        name: student.name || '',
                                                        studentId: isNaN(studentId) || studentId <= 0 ? undefined : studentId
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            // 현재 학생이 목록에 있는지 확인 (studentId로 정확히 매칭)
                            const currentStudentIndex = recordsWithNames.findIndex(r => {
                                if (r.studentId !== undefined) {
                                    return r.studentId === currentStudentId;
                                }
                                // studentId가 없는 경우 이름으로 매칭 (하위 호환성)
                                return r.name === shareData.studentName;
                            });
                            // shareData의 기록이 최신이므로 이를 우선적으로 사용
                            // 클래스 데이터의 기록과 다를 수 있으므로 shareData의 기록으로 교체
                            let actualLeftRecord = leftRecord;
                            if (currentStudentIndex >= 0) {
                                // 현재 학생이 목록에 있으면, shareData의 기록으로 교체
                                const oldRecord = recordsWithNames[currentStudentIndex].record;
                                recordsWithNames[currentStudentIndex].record = leftRecord;
                                console.log(`[학년 랭킹] ${categoryId}_left: 현재 학생이 목록에 있음, shareData 기록으로 교체 - ${leftRecord} (클래스 데이터: ${oldRecord})`);
                                actualLeftRecord = leftRecord;
                            }
                            else if (leftRecord > 0) {
                                // 현재 학생이 목록에 없고, 기록이 있으면 추가
                                recordsWithNames.push({
                                    record: leftRecord,
                                    name: shareData.studentName || '',
                                    studentId: currentStudentId
                                });
                                console.log(`[학년 랭킹] ${categoryId}_left: 현재 학생 기록을 목록에 추가 - ${leftRecord}`);
                                actualLeftRecord = leftRecord;
                            }
                            if (recordsWithNames.length > 0) {
                                // findRankForRecord를 위해 {record, name} 형태로 변환
                                const recordsForRanking = recordsWithNames.map(r => ({ record: r.record, name: r.name }));
                                recordsForRanking.sort((a, b) => b.record - a.record);
                                const rank = actualLeftRecord > 0 ? findRankForRecord(recordsForRanking, actualLeftRecord) : 0;
                                const total = recordsForRanking.length;
                                if (rank === 0) {
                                    console.warn(`[학년 랭킹] ${categoryId}_left: 현재 학생을 찾을 수 없음. studentId: ${shareData.studentId}, 총 학생 수: ${total}`);
                                }
                                else {
                                    console.log(`[학년 랭킹] ${categoryId}_left: 순위 계산 성공 - ${rank}위 / ${total}명`);
                                }
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
                            // papsManager.ts의 searchRanking과 동일하게 종목별로 기록이 있는 학생만 수집
                            // studentId도 함께 저장하여 현재 학생을 정확히 식별
                            const recordsWithNames = [];
                            // 현재 학생이 속한 사용자의 클래스만 순회 (papsManager.ts와 동일)
                            if (targetUserData.paps && targetUserData.paps.classes && Array.isArray(targetUserData.paps.classes)) {
                                targetUserData.paps.classes.forEach((classData) => {
                                    if (!classData || typeof classData !== 'object' || !('id' in classData) || !('students' in classData)) {
                                        return;
                                    }
                                    if (classData.gradeLevel === shareData.gradeLevel && classData.students && Array.isArray(classData.students)) {
                                        classData.students.forEach((student) => {
                                            if (student && student.gender === shareData.studentGender) {
                                                const record = student.records?.[`${categoryId}_right`];
                                                if (record !== undefined && record !== null &&
                                                    typeof record === 'number' && !isNaN(record) &&
                                                    isFinite(record) && record !== 0) {
                                                    const studentId = Number(student.id || student.studentId);
                                                    recordsWithNames.push({
                                                        record,
                                                        name: student.name || '',
                                                        studentId: isNaN(studentId) || studentId <= 0 ? undefined : studentId
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            // 현재 학생이 목록에 있는지 확인 (studentId로 정확히 매칭)
                            const currentStudentIndex = recordsWithNames.findIndex(r => {
                                if (r.studentId !== undefined) {
                                    return r.studentId === currentStudentId;
                                }
                                // studentId가 없는 경우 이름으로 매칭 (하위 호환성)
                                return r.name === shareData.studentName;
                            });
                            // shareData의 기록이 최신이므로 이를 우선적으로 사용
                            // 클래스 데이터의 기록과 다를 수 있으므로 shareData의 기록으로 교체
                            let actualRightRecord = rightRecord;
                            if (currentStudentIndex >= 0) {
                                // 현재 학생이 목록에 있으면, shareData의 기록으로 교체
                                const oldRecord = recordsWithNames[currentStudentIndex].record;
                                recordsWithNames[currentStudentIndex].record = rightRecord;
                                console.log(`[학년 랭킹] ${categoryId}_right: 현재 학생이 목록에 있음, shareData 기록으로 교체 - ${rightRecord} (클래스 데이터: ${oldRecord})`);
                                actualRightRecord = rightRecord;
                            }
                            else if (rightRecord > 0) {
                                // 현재 학생이 목록에 없고, 기록이 있으면 추가
                                recordsWithNames.push({
                                    record: rightRecord,
                                    name: shareData.studentName || '',
                                    studentId: currentStudentId
                                });
                                console.log(`[학년 랭킹] ${categoryId}_right: 현재 학생 기록을 목록에 추가 - ${rightRecord}`);
                                actualRightRecord = rightRecord;
                            }
                            if (recordsWithNames.length > 0) {
                                // findRankForRecord를 위해 {record, name} 형태로 변환
                                const recordsForRanking = recordsWithNames.map(r => ({ record: r.record, name: r.name }));
                                recordsForRanking.sort((a, b) => b.record - a.record);
                                const rank = actualRightRecord > 0 ? findRankForRecord(recordsForRanking, actualRightRecord) : 0;
                                const total = recordsForRanking.length;
                                if (rank === 0) {
                                    console.warn(`[학년 랭킹] ${categoryId}_right: 현재 학생을 찾을 수 없음. studentId: ${shareData.studentId}, 총 학생 수: ${total}`);
                                }
                                else {
                                    console.log(`[학년 랭킹] ${categoryId}_right: 순위 계산 성공 - ${rank}위 / ${total}명`);
                                }
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
                    // 악력이 없고 strength 자체가 있으면 일반 종목처럼 처리 (팔굽혀펴기, 윗몸말아올리기)
                    if (!hasGripStrength) {
                        const studentRecord = shareData.records[categoryId];
                        if (studentRecord !== undefined && studentRecord !== null && studentRecord !== 0) {
                            // papsManager.ts의 searchRanking과 동일하게 종목별로 기록이 있는 학생만 수집
                            const recordsWithNames = [];
                            // 현재 학생이 속한 사용자의 클래스만 순회 (papsManager.ts와 동일)
                            if (targetUserData.paps && targetUserData.paps.classes && Array.isArray(targetUserData.paps.classes)) {
                                targetUserData.paps.classes.forEach((classData) => {
                                    if (!classData || typeof classData !== 'object' || !('id' in classData) || !('students' in classData)) {
                                        return;
                                    }
                                    if (classData.gradeLevel === shareData.gradeLevel && classData.students && Array.isArray(classData.students)) {
                                        classData.students.forEach((student) => {
                                            if (student && student.gender === shareData.studentGender) {
                                                const record = student.records?.[categoryId];
                                                if (record !== undefined && record !== null &&
                                                    typeof record === 'number' && !isNaN(record) &&
                                                    isFinite(record) && record !== 0) {
                                                    const studentId = Number(student.id || student.studentId);
                                                    recordsWithNames.push({
                                                        record,
                                                        name: student.name || '',
                                                        studentId: isNaN(studentId) || studentId <= 0 ? undefined : studentId
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            console.log(`[학년 랭킹] ${categoryId} - 기록이 있는 학생 수: ${recordsWithNames.length}명`);
                            if (recordsWithNames.length > 0) {
                                // 현재 학생이 목록에 있는지 확인 (studentId로 정확히 매칭)
                                const currentStudentIndex = recordsWithNames.findIndex(r => {
                                    if (r.studentId !== undefined) {
                                        return r.studentId === currentStudentId;
                                    }
                                    return r.name === shareData.studentName;
                                });
                                // shareData의 기록이 최신이므로 이를 우선적으로 사용
                                let actualStudentRecord = studentRecord;
                                if (currentStudentIndex >= 0) {
                                    const oldRecord = recordsWithNames[currentStudentIndex].record;
                                    recordsWithNames[currentStudentIndex].record = studentRecord;
                                    console.log(`[학년 랭킹] ${categoryId}: 현재 학생이 목록에 있음, shareData 기록으로 교체 - ${studentRecord} (클래스 데이터: ${oldRecord})`);
                                    actualStudentRecord = studentRecord;
                                }
                                else if (studentRecord > 0) {
                                    recordsWithNames.push({
                                        record: studentRecord,
                                        name: shareData.studentName || '',
                                        studentId: currentStudentId
                                    });
                                    console.log(`[학년 랭킹] ${categoryId}: 현재 학생 기록을 목록에 추가 - ${studentRecord}`);
                                    actualStudentRecord = studentRecord;
                                }
                                const recordsForRanking = recordsWithNames.map(r => ({ record: r.record, name: r.name }));
                                recordsForRanking.sort((a, b) => b.record - a.record);
                                console.log(`[학년 랭킹] ${categoryId} - 현재 학생 기록 (shareData):`, studentRecord);
                                console.log(`[학년 랭킹] ${categoryId} - 실제 사용할 기록:`, actualStudentRecord);
                                console.log(`[학년 랭킹] ${categoryId} - 수집된 기록 목록 (처음 10개):`, recordsForRanking.slice(0, 10).map(r => r.record));
                                console.log(`[학년 랭킹] ${categoryId} - 실제 기록이 목록에 있는지:`, recordsForRanking.some(r => r.record === actualStudentRecord));
                                const rank = actualStudentRecord > 0 ? findRankForRecord(recordsForRanking, actualStudentRecord) : 0;
                                const total = recordsForRanking.length;
                                if (rank === 0) {
                                    console.warn(`[학년 랭킹] ${categoryId}: 현재 학생을 찾을 수 없음.`, {
                                        studentId: shareData.studentId,
                                        currentStudentId: currentStudentId,
                                        total: total,
                                        studentRecord: studentRecord,
                                        actualStudentRecord: actualStudentRecord
                                    });
                                    rankings[categoryId] = '-';
                                }
                                else {
                                    console.log(`[학년 랭킹] ${categoryId}: 순위 계산 성공 - ${rank}위 / ${total}명`);
                                    console.log(`[학년 랭킹] ${categoryId} - 상위 5명:`, recordsForRanking.slice(0, 5));
                                    rankings[categoryId] = `${rank}위 / ${total}명`;
                                }
                            }
                            else {
                                rankings[categoryId] = '-';
                            }
                        }
                        else {
                            rankings[categoryId] = '-';
                        }
                    }
                }
                else {
                    // papsManager.ts의 searchRanking과 완전히 동일하게 종목별로 기록이 있는 학생만 수집
                    // 일반 종목 랭킹 계산 ('우리 학교 PAPS 종목별 랭킹' 로직과 동일)
                    const studentRecord = shareData.records[categoryId];
                    if (studentRecord === undefined || studentRecord === null || studentRecord === 0) {
                        rankings[categoryId] = '-';
                        return;
                    }
                    // papsManager.ts의 searchRanking과 동일하게 종목별로 기록이 있는 학생만 수집
                    // studentId도 함께 저장하여 현재 학생을 정확히 식별
                    const recordsWithNames = [];
                    // 현재 학생이 속한 사용자의 클래스만 순회 (papsManager.ts와 동일)
                    if (targetUserData.paps && targetUserData.paps.classes && Array.isArray(targetUserData.paps.classes)) {
                        targetUserData.paps.classes.forEach((classData) => {
                            // PAPS 클래스 구조 확인
                            if (!classData || typeof classData !== 'object' || !('id' in classData) || !('students' in classData)) {
                                return;
                            }
                            // papsManager.ts의 searchRanking과 동일하게 학년 필터링
                            if (classData.gradeLevel === shareData.gradeLevel && classData.students && Array.isArray(classData.students)) {
                                classData.students.forEach((student) => {
                                    // papsManager.ts와 동일하게 성별 필터링
                                    if (student && student.gender === shareData.studentGender) {
                                        const record = student.records?.[categoryId];
                                        // papsManager.ts와 동일하게 유효한 숫자인지 더 엄격하게 검증
                                        // 음수도 유효한 기록일 수 있음 (예: 앉아윗몸앞으로굽히기)
                                        if (record !== undefined && record !== null &&
                                            typeof record === 'number' && !isNaN(record) &&
                                            isFinite(record)) {
                                            // 0보다 큰 값만 필터링 (음수는 허용, 0은 제외)
                                            if (record !== 0) {
                                                const studentId = Number(student.id || student.studentId);
                                                recordsWithNames.push({
                                                    record,
                                                    name: student.name || '',
                                                    studentId: isNaN(studentId) || studentId <= 0 ? undefined : studentId
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                    console.log(`[학년 랭킹] ${categoryId} - 기록이 있는 학생 수: ${recordsWithNames.length}명`);
                    console.log(`[학년 랭킹] ${categoryId} - 수집된 학생 목록:`, recordsWithNames.map(r => ({ name: r.name, record: r.record })));
                    if (recordsWithNames.length === 0) {
                        rankings[categoryId] = '-';
                        return;
                    }
                    // 현재 학생이 목록에 있는지 확인 (studentId로 정확히 매칭)
                    const currentStudentIndex = recordsWithNames.findIndex(r => {
                        if (r.studentId !== undefined) {
                            return r.studentId === currentStudentId;
                        }
                        // studentId가 없는 경우 이름으로 매칭 (하위 호환성)
                        return r.name === shareData.studentName;
                    });
                    // shareData의 기록이 최신이므로 이를 우선적으로 사용
                    // 클래스 데이터의 기록과 다를 수 있으므로 shareData의 기록으로 교체
                    let actualStudentRecord = studentRecord;
                    if (currentStudentIndex >= 0) {
                        // 현재 학생이 목록에 있으면, shareData의 기록으로 교체
                        const oldRecord = recordsWithNames[currentStudentIndex].record;
                        recordsWithNames[currentStudentIndex].record = studentRecord;
                        console.log(`[학년 랭킹] ${categoryId}: 현재 학생이 목록에 있음, shareData 기록으로 교체 - ${studentRecord} (클래스 데이터: ${oldRecord})`);
                        actualStudentRecord = studentRecord;
                    }
                    else if (studentRecord > 0) {
                        // 현재 학생이 목록에 없고, 기록이 있으면 추가
                        recordsWithNames.push({
                            record: studentRecord,
                            name: shareData.studentName || '',
                            studentId: currentStudentId
                        });
                        console.log(`[학년 랭킹] ${categoryId}: 현재 학생 기록을 목록에 추가 - ${studentRecord}`);
                        actualStudentRecord = studentRecord;
                    }
                    // papsManager.ts의 searchRanking과 동일하게 내림차순 정렬 (높은 기록이 좋은 경우)
                    // findRankForRecord를 위해 {record, name} 형태로 변환
                    const recordsForRanking = recordsWithNames.map(r => ({ record: r.record, name: r.name }));
                    recordsForRanking.sort((a, b) => b.record - a.record);
                    // 디버깅: 현재 학생의 기록과 수집된 기록 확인
                    console.log(`[학년 랭킹] ${categoryId} - 현재 학생 기록 (shareData):`, studentRecord);
                    console.log(`[학년 랭킹] ${categoryId} - 실제 사용할 기록:`, actualStudentRecord);
                    console.log(`[학년 랭킹] ${categoryId} - 수집된 기록 목록 (처음 10개):`, recordsForRanking.slice(0, 10).map(r => r.record));
                    console.log(`[학년 랭킹] ${categoryId} - 실제 기록이 목록에 있는지:`, recordsForRanking.some(r => r.record === actualStudentRecord));
                    // papsManager.ts와 동일하게 findRankForRecord 사용
                    const rank = actualStudentRecord > 0 ? findRankForRecord(recordsForRanking, actualStudentRecord) : 0;
                    const total = recordsForRanking.length;
                    if (rank === 0) {
                        console.warn(`[학년 랭킹] ${categoryId}: 현재 학생을 찾을 수 없음.`, {
                            studentId: shareData.studentId,
                            currentStudentId: currentStudentId,
                            total: total,
                            studentRecord: studentRecord,
                            actualStudentRecord: actualStudentRecord,
                            studentRecordType: typeof studentRecord,
                            records: recordsForRanking.slice(0, 10),
                            recordTypes: recordsForRanking.slice(0, 10).map(r => typeof r.record),
                            exactMatch: recordsForRanking.find(r => r.record === actualStudentRecord),
                            allRecords: recordsForRanking.map(r => r.record)
                        });
                        rankings[categoryId] = '-';
                    }
                    else {
                        console.log(`[학년 랭킹] ${categoryId}: 순위 계산 성공 - ${rank}위 / ${total}명`);
                        console.log(`[학년 랭킹] ${categoryId} - 상위 5명:`, recordsForRanking.slice(0, 5));
                        rankings[categoryId] = `${rank}위 / ${total}명`;
                    }
                }
            });
            console.log('[학년 랭킹] 계산 완료:', rankings);
            console.log('[학년 랭킹] 랭킹 항목 수:', Object.keys(rankings).length);
            Object.keys(rankings).forEach(key => {
                console.log(`[학년 랭킹] ${key}: ${rankings[key]}`);
            });
            // 랭킹이 비어있으면 경고
            if (Object.keys(rankings).length === 0) {
                console.warn('[학년 랭킹] 랭킹이 비어있습니다. 데이터를 확인해주세요.');
                console.warn('[학년 랭킹] shareData:', {
                    gradeLevel: shareData.gradeLevel,
                    studentGender: shareData.studentGender,
                    studentId: shareData.studentId,
                    records: shareData.records
                });
            }
            return rankings;
        }
        catch (error) {
            console.error('[학년 랭킹] 계산 실패:', error);
            console.error('[학년 랭킹] 에러 상세:', {
                message: error?.message,
                stack: error?.stack,
                shareData: {
                    gradeLevel: shareData.gradeLevel,
                    studentGender: shareData.studentGender,
                    studentId: shareData.studentId
                }
            });
            logError('학년 랭킹 계산 실패:', error);
            return {};
        }
    }
    /**
     * AI 운동 처방을 생성합니다.
     * @param shareData 공유 데이터
     * @returns 운동 처방 HTML 텍스트
     */
    generateExercisePrescription(shareData) {
        const studentName = shareData.studentName;
        const nameStyle = `<strong style="color: #0066cc;">${studentName}</strong>`;
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
                    if (gradeNum === 1) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${enduranceEvent}</strong> 기록은 <strong>${enduranceRecord}</strong>이며 <strong>${grade}</strong>입니다! 🎉 정말 훌륭한 기록이에요. 계속 이렇게 노력하시면 더욱 발전할 거예요. 현재 수준 유지를 위해 <strong>주 2-3회</strong> 유산소 운동을 하세요.\n\n💪 추천: 조깅(주 2회, 20-30분)`;
                    }
                    else if (gradeNum >= 4) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${enduranceEvent}</strong> 기록은 <strong>${enduranceRecord}</strong>이며 <strong>${grade}</strong>입니다. 걱정 마세요! 💪 꾸준히 운동하면 충분히 향상될 수 있어요. 조금씩이라도 매일 실천하는 것이 중요합니다. <strong>주 2-3회</strong> 유산소 운동을 시작하세요.\n\n💪 추천: 조깅(주 2회, 20-30분)`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${enduranceEvent}</strong> 기록은 <strong>${enduranceRecord}</strong>이며 <strong>${grade}</strong>입니다. <strong>주 3-4회</strong> 유산소 운동을 권장합니다.\n\n💪 추천: 조깅(주 3회, 20-30분), 왕복오래달리기 연습(주 2회)`;
                    }
                    else {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${enduranceEvent}</strong> 기록은 <strong>${enduranceRecord}</strong>이며 <strong>${grade}</strong>입니다. 조금만 더 노력하면 충분히 좋아질 수 있어요! 💪 포기하지 말고 <strong>주 4-5회</strong> 유산소 운동을 시작하세요.\n\n💪 추천: 걷기(매일 20-30분), 조깅(주 3-4회, 10-20분)`;
                    }
                    break;
                case 'flexibility':
                    categoryName = '유연성';
                    emoji = '🤸';
                    const flexibilityEvent = shareData.eventNames?.flexibility || '유연성';
                    const flexibilityRecord = record !== undefined && record !== null && record !== 0 ? record : '-';
                    if (gradeNum === 1) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${flexibilityEvent}</strong> 기록은 <strong>${flexibilityRecord}</strong>이며 <strong>${grade}</strong>입니다! 🎉 정말 뛰어난 유연성이에요. 계속 이렇게 유지하시면 더욱 좋아질 거예요. 현재 수준 유지를 위해 <strong>매일 10-15분</strong> 스트레칭을 하세요.\n\n💪 추천: 아침 스트레칭(5-10분), 운동 후 스트레칭(10-15분)`;
                    }
                    else if (gradeNum >= 4) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${flexibilityEvent}</strong> 기록은 <strong>${flexibilityRecord}</strong>이며 <strong>${grade}</strong>입니다. 걱정 마세요! 💪 유연성은 꾸준한 스트레칭으로 충분히 향상될 수 있어요. 조금씩 매일 실천하는 것이 중요합니다. <strong>매일 10-15분</strong> 스트레칭을 시작하세요.\n\n💪 추천: 아침 스트레칭(5-10분), 운동 후 스트레칭(10-15분)`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${flexibilityEvent}</strong> 기록은 <strong>${flexibilityRecord}</strong>이며 <strong>${grade}</strong>입니다. <strong>매일 15-20분</strong> 스트레칭을 하세요.\n\n💪 추천: 앉아윗몸앞으로굽히기 연습(매일 10회, 15-20초 유지), 다리 스트레칭(매일 2세트)`;
                    }
                    else {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${flexibilityEvent}</strong> 기록은 <strong>${flexibilityRecord}</strong>이며 <strong>${grade}</strong>입니다. 조금만 더 노력하면 충분히 좋아질 수 있어요! 💪 포기하지 말고 <strong>매일 20-30분</strong> 스트레칭을 하세요.\n\n💪 추천: 앉아윗몸앞으로굽히기 연습(매일 3세트, 20-30초), 다리 뒤쪽 스트레칭(매일 3세트)`;
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
                    if (gradeNum === 1) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${strengthEvent}${handText}</strong> 기록은 <strong>${strengthRecord}</strong>이며 <strong>${grade}</strong>입니다! 🎉 정말 강한 근력을 가지고 계시네요. 계속 이렇게 노력하시면 더욱 발전할 거예요. 근지구력 향상을 위해 <strong>주 3-4회</strong> 근력 운동을 하세요.\n\n💪 추천: 악력 연습(주 3-4회, 3세트), 팔굽혀펴기(주 3회, 3세트)`;
                    }
                    else if (gradeNum >= 4) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${strengthEvent}${handText}</strong> 기록은 <strong>${strengthRecord}</strong>이며 <strong>${grade}</strong>입니다. 걱정 마세요! 💪 근력은 꾸준한 운동으로 충분히 향상될 수 있어요. 조금씩 매일 실천하는 것이 중요합니다. <strong>주 3-4회</strong> 근력 운동을 시작하세요.\n\n💪 추천: 악력 연습(주 3-4회, 3세트), 팔굽혀펴기(주 3회, 3세트)`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${strengthEvent}${handText}</strong> 기록은 <strong>${strengthRecord}</strong>이며 <strong>${grade}</strong>입니다. <strong>주 3-4회</strong> 근력 운동을 하세요.\n\n💪 추천: 악력 연습(주 3-4회, 3세트), 팔굽혀펴기(주 3회, 3세트)`;
                    }
                    else {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${strengthEvent}${handText}</strong> 기록은 <strong>${strengthRecord}</strong>이며 <strong>${grade}</strong>입니다. 조금만 더 노력하면 충분히 좋아질 수 있어요! 💪 포기하지 말고 <strong>주 4-5회</strong> 근력 운동을 시작하세요.\n\n💪 추천: 악력 연습(주 4-5회, 2-3세트), 팔굽혀펴기(주 4회, 2-3세트, 무릎 대고 시작 가능)`;
                    }
                    break;
                case 'power':
                    categoryName = '순발력';
                    emoji = '⚡';
                    const powerEvent = shareData.eventNames?.power || '순발력';
                    const powerRecord = record !== undefined && record !== null && record !== 0 ? record : '-';
                    if (gradeNum === 1) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${powerEvent}</strong> 기록은 <strong>${powerRecord}</strong>이며 <strong>${grade}</strong>입니다! 🎉 정말 뛰어난 순발력이에요. 계속 이렇게 노력하시면 더욱 발전할 거예요. 폭발적인 움직임 유지를 위해 <strong>주 2-3회</strong> 순발력 운동을 하세요.\n\n💪 추천: 제자리멀리뛰기 연습(주 2-3회, 3세트), 박스 점프(주 2회, 3세트)`;
                    }
                    else if (gradeNum >= 4) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${powerEvent}</strong> 기록은 <strong>${powerRecord}</strong>이며 <strong>${grade}</strong>입니다. 걱정 마세요! 💪 순발력은 꾸준한 연습으로 충분히 향상될 수 있어요. 조금씩 매일 실천하는 것이 중요합니다. <strong>주 2-3회</strong> 순발력 운동을 시작하세요.\n\n💪 추천: 제자리멀리뛰기 연습(주 2-3회, 3세트), 박스 점프(주 2회, 3세트)`;
                    }
                    else if (gradeNum === 3) {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${powerEvent}</strong> 기록은 <strong>${powerRecord}</strong>이며 <strong>${grade}</strong>입니다. <strong>주 2-3회</strong> 순발력 운동을 하세요.\n\n💪 추천: 제자리멀리뛰기 연습(주 3회, 3세트), 제자리 높이뛰기(주 2-3회, 3세트)`;
                    }
                    else {
                        prescription = `${emoji} ${nameStyle}님의 <strong>${powerEvent}</strong> 기록은 <strong>${powerRecord}</strong>이며 <strong>${grade}</strong>입니다. 조금만 더 노력하면 충분히 좋아질 수 있어요! 💪 포기하지 말고 <strong>주 3-4회</strong> 순발력 운동을 하세요.\n\n💪 추천: 제자리멀리뛰기 연습(주 3-4회, 3세트), 제자리 높이뛰기(주 3회, 3세트)`;
                    }
                    break;
                case 'bodyfat':
                    categoryName = '체지방';
                    emoji = '📊';
                    const height = shareData.records.height;
                    const weight = shareData.records.weight;
                    const bmi = height && weight ? (weight / ((height / 100) ** 2)).toFixed(1) : '-';
                    if (grade === '정상') {
                        prescription = `${emoji} ${nameStyle}님의 <strong>BMI</strong>는 <strong>${bmi}</strong>이며 <strong>${grade}</strong>입니다! 🎉 정말 건강한 체형이에요. 계속 이렇게 유지하시면 더욱 좋아질 거예요. 균형 잡힌 식단과 <strong>주 2-3회</strong> 운동을 유지하세요.\n\n💪 추천: 하루 3끼 규칙적으로, 유산소 운동(주 2-3회, 30분)`;
                    }
                    else if (grade === '과체중') {
                        prescription = `${emoji} ${nameStyle}님의 <strong>BMI</strong>는 <strong>${bmi}</strong>이며 <strong>${grade}</strong>입니다. 걱정 마세요! 💪 꾸준한 운동과 식단 조절로 충분히 개선될 수 있어요. 조금씩 매일 실천하는 것이 중요합니다. <strong>주 4-5회</strong> 유산소 운동과 식단 조절을 하세요.\n\n💪 추천: 저칼로리 식단, 유산소 운동(주 4-5회, 40-50분)`;
                    }
                    else {
                        prescription = `${emoji} ${nameStyle}님의 <strong>BMI</strong>는 <strong>${bmi}</strong>이며 <strong>${grade}</strong>입니다. 걱정 마세요! 💪 전문가의 도움을 받고 꾸준히 노력하면 충분히 개선될 수 있어요. 포기하지 말고 <strong>주 5회 이상</strong> 운동을 하세요.\n\n💪 추천: 영양사/의사 상담, 유산소 운동(주 5회 이상, 50분 이상)`;
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
                overallAssessment = `\n\n⭐ ${nameStyle}님, 전반적으로 체력이 <strong>우수</strong>합니다! 현재 운동 습관을 유지하세요.`;
            }
            else if (overallGradeNum === 3) {
                overallAssessment = `\n\n⭐ ${nameStyle}님, 전반적인 체력이 <strong>보통</strong> 수준입니다. 약한 종목에 집중하여 <strong>꾸준히</strong> 운동하세요.`;
            }
            else {
                overallAssessment = `\n\n⭐ ${nameStyle}님, 체력 향상이 필요합니다. 위에 제시한 운동 처방을 <strong>주 4-5회 이상</strong> <strong>꾸준히</strong> 실천하세요.`;
            }
            prescriptions.push(overallAssessment);
        }
        return prescriptions.length > 0 ? prescriptions.join('\n\n') : `📝 ${nameStyle}님, 기록이 부족하여 운동 처방을 제공할 수 없습니다. PAPS 기록을 입력해주세요.`;
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
    /**
     * 모바일 디버깅용: 화면에 랭킹 계산 로그를 표시합니다.
     * @param gradeRankings 랭킹 데이터
     * @param shareData 공유 데이터
     */
    showDebugLogs(gradeRankings, shareData) {
        // 기존 디버그 로그 제거
        const existingDebug = document.getElementById('debug-ranking-logs');
        if (existingDebug) {
            existingDebug.remove();
        }
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-ranking-logs';
        debugDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 11px;
      z-index: 99999;
      max-height: 300px;
      overflow-y: auto;
      font-family: monospace;
    `;
        const rankingKeys = Object.keys(gradeRankings);
        const rankingCount = rankingKeys.length;
        // 디버깅 정보 수집
        const firebase = window.firebase;
        const firebaseStatus = firebase ? {
            hasDb: !!firebase.db,
            hasCollection: !!firebase.collection,
            hasGetDocs: !!firebase.getDocs
        } : { error: 'Firebase 객체 없음' };
        // 콘솔에서 추가 정보 가져오기 (전역 변수에 저장)
        const debugInfo = window.__rankingDebugInfo || {};
        debugDiv.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #ffd700;">🔍 학년 랭킹 디버그</div>
      <div style="margin-bottom: 4px;">학년: ${shareData.gradeLevel} | 성별: ${shareData.studentGender} | ID: ${shareData.studentId}</div>
      <div style="margin-bottom: 4px;">Firebase: ${JSON.stringify(firebaseStatus)}</div>
      ${debugInfo.classesCount !== undefined ? `<div style="margin-bottom: 4px;">조회된 클래스 수: ${debugInfo.classesCount}</div>` : ''}
      ${debugInfo.matchingClasses !== undefined ? `<div style="margin-bottom: 4px;">같은 학년 클래스: ${debugInfo.matchingClasses}</div>` : ''}
      ${debugInfo.studentsCount !== undefined ? `<div style="margin-bottom: 4px;">수집된 학생 수: ${debugInfo.studentsCount}</div>` : ''}
      <div style="margin-bottom: 4px;">랭킹 항목 수: ${rankingCount}</div>
      <div style="margin-bottom: 4px;">기록 키: ${Object.keys(shareData.records || {}).join(', ')}</div>
      ${rankingCount > 0 ? `
        <div style="margin-top: 8px; border-top: 1px solid #555; padding-top: 8px;">
          ${rankingKeys.slice(0, 10).map(key => `<div style="margin: 2px 0;">${key}: ${gradeRankings[key]}</div>`).join('')}
          ${rankingKeys.length > 10 ? `<div>... 외 ${rankingKeys.length - 10}개</div>` : ''}
        </div>
      ` : '<div style="color: #ff6b6b; margin-top: 8px; border-top: 1px solid #555; padding-top: 8px;">⚠️ 랭킹 데이터가 비어있습니다!<br/>콘솔 로그를 확인해주세요.</div>'}
      <button id="close-debug-logs" style="margin-top: 8px; padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10px;">닫기</button>
    `;
        document.body.appendChild(debugDiv);
        // 닫기 버튼 이벤트
        const closeBtn = debugDiv.querySelector('#close-debug-logs');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                debugDiv.remove();
            });
        }
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