/**
 * PAPS 수업 관리 모듈
 *
 * 이 모듈은 PAPS(Physical Activity Promotion System) 수업의 모든 기능을 관리합니다.
 * PAPS 반 생성/삭제, 학생 관리, 기록 입력, 등급 계산, 엑셀 내보내기 등을 담당합니다.
 *
 * 현재 지원하는 기능:
 * - PAPS 반 관리 (생성, 편집, 삭제, 선택)
 * - 학생 명단 관리 (추가, 삭제, 엑셀 업로드)
 * - PAPS 기록 입력 및 등급 계산
 * - 엑셀 내보내기/가져오기
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
export interface PapsStudent {
    id: number;
    number: number;
    name: string;
    gender: '남자' | '여자';
    records: Record<string, number>;
}
export interface PapsClass {
    id: number;
    name: string;
    gradeLevel: string;
    students: PapsStudent[];
    settings?: PapsSettings;
    eventSettings?: Record<string, string>;
}
export interface PapsSettings {
    gradeLevel: string;
    customCategories?: Record<string, any>;
}
export interface PapsData {
    classes: PapsClass[];
    activeClassId: number | null;
}
export declare class PapsManager {
    private papsData;
    private $;
    private saveDataToFirestore;
    private currentRankingData;
    private updateInterval;
    private currentRankingPage;
    private selectedStudentForChart;
    private currentRankingRecords;
    constructor(papsData: PapsData, $: (id: string) => HTMLElement, saveDataToFirestore: () => void, cleanupSidebar?: () => void);
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 타이머와 이벤트 리스너를 정리합니다.
     */
    cleanup(): void;
    /**
     * PAPS 데이터를 설정합니다.
     * @param data PAPS 데이터
     */
    setPapsData(data: PapsData): void;
    /**
     * PAPS 데이터를 가져옵니다.
     * @returns PAPS 데이터
     */
    getPapsData(): PapsData;
    /**
     * PAPS UI를 렌더링합니다.
     */
    renderPapsUI(): void;
    /**
     * PAPS 반 목록을 렌더링합니다.
     */
    renderPapsClassList(): void;
    /**
     * PAPS 반을 생성합니다.
     */
    createPapsClass(): void;
    /**
     * PAPS 반을 편집합니다.
     */
    editPapsClass(id: number): void;
    /**
     * PAPS 반을 삭제합니다.
     */
    deletePapsClass(id: number): void;
    /**
     * PAPS 반을 선택합니다.
     */
    selectPapsClass(id: number): void;
    /**
     * PAPS 대시보드를 렌더링합니다.
     */
    renderPapsDashboard(cls: PapsClass): void;
    /**
     * PAPS 테이블을 구성합니다.
     */
    buildPapsTable(cls: PapsClass): void;
    /**
     * PAPS 입력을 처리합니다.
     */
    onPapsInput(e: Event, cls: PapsClass): void;
    /**
     * PAPS 행 등급을 업데이트합니다.
     */
    updatePapsRowGrades(tr: HTMLTableRowElement, cls: PapsClass): void;
    /**
     * PAPS 등급을 계산합니다.
     */
    calcPapsGrade(categoryId: string, value: number, gender: string, gradeLevel: string, cls: PapsClass): string;
    /**
     * 전체 등급을 계산합니다.
     */
    calcOverallGrade(tr: HTMLTableRowElement): string;
    /**
     * PAPS 학생을 추가합니다.
     */
    addPapsStudent(cls: PapsClass): void;
    /**
     * 선택된 PAPS 학생을 삭제합니다.
     */
    deleteSelectedPapsStudents(cls: PapsClass): void;
    /**
     * PAPS 템플릿을 다운로드합니다.
     */
    papsDownloadTemplate(): void;
    /**
     * PAPS 설정을 저장합니다.
     */
    savePapsSettings(): void;
    /**
     * PAPS 설정을 표시합니다.
     */
    showPapsSettings(): void;
    /**
     * 랭킹 조회 컨트롤을 설정합니다.
     */
    private setupRankingControls;
    /**
     * 랭킹을 조회합니다.
     */
    private searchRanking;
    /**
     * 같은 기록을 가진 경우 동일한 순위를 부여합니다.
     * @param sortedRecords 정렬된 기록 배열 (내림차순)
     * @returns 각 항목의 순위를 포함한 배열
     */
    private calculateRanks;
    /**
     * 특정 기록의 순위를 찾습니다.
     * @param sortedRecords 정렬된 기록 배열 (내림차순)
     * @param targetRecord 찾을 기록
     * @returns 순위 (1부터 시작)
     */
    private findRankForRecord;
    /**
     * 순위 테이블을 렌더링합니다.
     * @param recordsWithNames 기록과 이름 배열
     * @param studentName 학생 이름 (선택사항)
     * @param resetPage 페이지를 1로 초기화할지 여부 (기본값: true)
     */
    private renderRankingTable;
    /**
     * 공유 기능 컨트롤을 설정합니다.
     */
    private setupShareControls;
    /**
     * 실시간 공유를 생성합니다.
     */
    private createRealtimeShare;
    /**
     * 공유 ID를 생성합니다.
     */
    private generateShareId;
    /**
     * 공유 성공 모달을 표시합니다.
     */
    private showShareSuccessModal;
    /**
     * 순위표를 인쇄합니다.
     */
    private printRankingTable;
    /**
     * 순위표를 텍스트로 복사합니다.
     */
    private copyRankingAsText;
    /**
     * 순위표를 이미지로 저장합니다.
     */
    private saveRankingAsImage;
    /**
     * PAPS 학생 업로드를 처리합니다.
     */
    handlePapsStudentUpload(event: Event, cls: PapsClass): void;
    /**
     * PAPS를 엑셀로 내보냅니다.
     */
    exportPapsToExcel(cls: PapsClass): void;
    /**
     * 모든 PAPS를 엑셀로 내보냅니다.
     */
    exportAllPapsToExcel(): void;
    /**
     * PAPS 기록 업로드를 처리합니다.
     */
    handlePapsRecordUpload(event: Event, cls: PapsClass): void;
    /**
     * 모든 PAPS 엑셀 업로드를 처리합니다.
     */
    handleAllPapsExcelUpload(event: Event): void;
    /**
     * PAPS 차트를 렌더링합니다.
     */
    renderPapsCharts(cls: PapsClass): void;
    /**
     * 정규 분포 곡선과 표준편차를 표시하는 그래프를 그립니다.
     */
    private drawStandardDeviationChart;
    /**
     * 실시간 업데이트를 시작합니다.
     */
    private startRealtimeUpdate;
    /**
     * 실시간 업데이트를 중지합니다.
     */
    private stopRealtimeUpdate;
    /**
     * 랭킹 데이터를 업데이트합니다.
     */
    private updateRankingData;
    /**
     * 랭킹을 닫습니다.
     */
    private closeRanking;
    /**
     * 사이드바를 정리합니다.
     * sidebar-list-container는 renderPapsClassList()에서 관리하므로 여기서 비우지 않습니다.
     */
    private cleanupSidebar;
    /**
     * 유효 기간 입력 모달을 표시합니다.
     * @returns Promise<number | null> 입력된 일수 또는 null (취소 시)
     */
    private showExpiresDaysModal;
    /**
     * QR 코드를 로컬 스토리지에서 불러옵니다.
     * @param shareId 공유 ID
     * @returns QR 코드 URL 또는 null
     */
    private loadQRCodeFromStorage;
    /**
     * QR 코드를 Firebase Storage에서 불러옵니다.
     * @deprecated Firebase Storage 사용 중단 - CORS 문제로 인해 비활성화됨
     * @param shareId 공유 ID
     * @returns 항상 null (Firebase Storage 미사용)
     */
    private loadQRCodeFromFirebaseStorage;
    /**
     * QR 코드를 로컬 스토리지에 저장합니다.
     * @param shareId 공유 ID
     * @param qrCodeUrl QR 코드 URL
     * @param shareUrl 공유 URL (검증용)
     * @param expiresAt 만료 시간 (선택사항, 기본값: 1년)
     */
    private saveQRCodeToStorage;
    /**
     * QR 코드를 Firebase Storage에 저장합니다.
     * @deprecated Firebase Storage 사용 중단 - CORS 문제로 인해 비활성화됨
     * @param shareId 공유 ID
     * @param qrCodeUrl QR 코드 URL
     * @param expiresAt 만료 시간 (선택사항)
     */
    private saveQRCodeToFirebaseStorage;
    /**
     * 학생의 공유 데이터를 Firestore에 자동 업데이트합니다.
     * 기록이 변경될 때마다 호출됩니다.
     * @param student 학생 객체
     * @param cls 반 객체
     * @param tr 테이블 행 요소
     */
    private updateStudentShareData;
    /**
     * 반별 모든 학생의 QR 코드를 생성합니다.
     * @param expiresInDays 유효 기간 (일 단위, 기본값: 365일)
     */
    generateClassQRCodes(expiresInDays?: number): Promise<void>;
    /**
     * QR 코드 출력 모달을 표시합니다.
     * @param className 반 이름
     * @param studentQRCodes 학생 QR 코드 목록
     * @param expiresAt 만료일
     */
    private showQRPrintModal;
    /**
     * QR 코드를 인쇄합니다.
     * @param studentQRCodes 학생 QR 코드 목록
     * @param className 반 이름
     * @param perPage 페이지당 학생 수
     */
    private printQRCodes;
    /**
     * 저장된 반 목록을 셀렉트 메뉴에 채웁니다.
     * @param selectElement 셀렉트 요소
     */
    private populateSavedQRSelect;
    /**
     * 저장된 반의 QR 코드를 불러와서 화면에 표시합니다.
     * @param classId 반 ID
     */
    private loadSavedQRClass;
}
//# sourceMappingURL=papsManager.d.ts.map