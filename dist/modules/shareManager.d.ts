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
 * ShareManager 옵션
 */
export interface ShareManagerOptions {
    /** Firebase DB 인스턴스 (window.firebase.db) */
    firebaseDb?: any;
    /** DOM 쿼리 선택자 함수 */
    $?: (selector: string) => HTMLElement | null;
}
/**
 * 공유 기능을 관리하는 클래스
 */
export declare class ShareManager {
    private firebaseDb;
    private $;
    /**
     * ShareManager 인스턴스를 생성합니다.
     * @param options ShareManager 옵션
     */
    constructor(options?: ShareManagerOptions);
    /**
     * 공유 ID를 생성합니다.
     * @param length ID 길이 (기본값: 12)
     * @returns 공유 ID
     */
    generateShareId(length?: number): string;
    /**
     * 공유 순위표 링크를 처리합니다.
     * @param shareId 공유 ID
     * @returns Promise<void>
     */
    handleSharedRanking(shareId: string): Promise<void>;
    /**
     * 공유된 순위표를 모달로 표시합니다.
     * @param shareData 공유 순위표 데이터
     */
    showSharedRankingModal(shareData: SharedRankingData): void;
    /**
     * 공유 링크를 생성합니다.
     * @param shareId 공유 ID
     * @returns 공유 링크 URL
     */
    generateShareUrl(shareId: string): string;
    /**
     * 공유 링크를 클립보드에 복사합니다.
     * @param shareUrl 공유 링크 URL
     * @returns Promise<void>
     */
    copyShareUrlToClipboard(shareUrl: string): Promise<void>;
    /**
     * 공유 데이터를 Firebase에 저장합니다.
     * @param shareId 공유 ID
     * @param shareData 공유 데이터
     * @returns Promise<void>
     */
    saveSharedRanking(shareId: string, shareData: Partial<SharedRankingData>): Promise<void>;
}
/**
 * ShareManager 인스턴스를 생성하는 팩토리 함수
 * @param options ShareManager 옵션
 * @returns ShareManager 인스턴스
 */
export declare function createShareManager(options?: ShareManagerOptions): ShareManager;
export default ShareManager;
//# sourceMappingURL=shareManager.d.ts.map