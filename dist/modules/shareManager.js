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
// ========================================
// ShareManager 클래스
// ========================================
/**
 * 공유 기능을 관리하는 클래스
 */
export class ShareManager {
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
            console.log('공유된 순위표 로딩:', shareId);
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
            console.error('공유된 순위표 로딩 실패:', error);
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
            console.log('공유 링크가 클립보드에 복사되었습니다:', shareUrl);
        }
        catch (error) {
            console.error('클립보드 복사 실패:', error);
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
            console.log('공유 순위표가 저장되었습니다:', shareId);
        }
        catch (error) {
            console.error('공유 순위표 저장 실패:', error);
            throw error;
        }
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