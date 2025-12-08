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
    eventNames?: Record<string, string>;
    overallGrade: string;
    expiresAt?: Date | string;
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
     * Firebase DB 인스턴스를 가져옵니다.
     */
    private getFirebaseDb;
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
    /**
     * 기존 PAPS 학생 공유 데이터를 찾습니다.
     * @param classId 반 ID
     * @param studentId 학생 ID
     * @returns Promise<SharedPapsStudentData | null> 기존 공유 데이터 또는 null
     */
    findExistingPapsStudentShare(classId: number, studentId: number): Promise<SharedPapsStudentData | null>;
    /**
     * PAPS 개별 학생 공유 데이터를 Firebase에 저장합니다.
     * @param shareData PAPS 개별 학생 공유 데이터
     * @returns Promise<string> 공유 ID
     */
    saveSharedPapsStudent(shareData: Partial<SharedPapsStudentData>): Promise<string>;
    /**
     * PAPS 개별 학생 공유 링크를 생성합니다.
     * @param shareId 공유 ID
     * @returns 공유 링크 URL
     */
    generatePapsShareUrl(shareId: string): string;
    /**
     * PAPS 개별 학생 공유 링크를 처리합니다.
     * @param shareId 공유 ID
     * @returns Promise<void>
     */
    handleSharedPapsStudent(shareId: string): Promise<void>;
    /**
     * shareId로 최신 데이터를 가져옵니다.
     * @param shareId 공유 ID
     * @returns Promise<SharedPapsStudentData | null>
     */
    private fetchLatestShareData;
    /**
     * PAPS 개별 학생 기록을 표시합니다.
     * @param shareData 공유 데이터
     * @param shareId 공유 ID (업데이트용)
     */
    private showPapsStudentRecord;
    /**
     * 학년 랭킹을 계산합니다.
     * @param shareData 공유 데이터
     * @returns 종목별 랭킹 정보
     */
    private calculateGradeRankings;
    /**
     * AI 운동 처방을 생성합니다.
     * @param shareData 공유 데이터
     * @returns 운동 처방 HTML 텍스트
     */
    private generateExercisePrescription;
    /**
     * 등급에 따른 색상을 반환합니다.
     * @param grade 등급
     * @returns 색상 코드
     */
    private getGradeColor;
    /**
     * 에러 모달을 표시합니다.
     * @param message 에러 메시지
     */
    /**
     * 모바일 디버깅용: 화면에 랭킹 계산 로그를 표시합니다.
     * @param gradeRankings 랭킹 데이터
     * @param shareData 공유 데이터
     */
    private showDebugLogs;
    /**
     * 에러 모달을 표시합니다.
     * @param message 에러 메시지
     */
    private showErrorModal;
}
/**
 * ShareManager 인스턴스를 생성하는 팩토리 함수
 * @param options ShareManager 옵션
 * @returns ShareManager 인스턴스
 */
export declare function createShareManager(options?: ShareManagerOptions): ShareManager;
export default ShareManager;
//# sourceMappingURL=shareManager.d.ts.map