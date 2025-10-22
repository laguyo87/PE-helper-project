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
 * - 차트 및 통계 생성
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
    private dataManager;
    private saveDataToFirestore;
    constructor(papsData: PapsData, dataManager: any, saveDataToFirestore: () => void);
    /**
     * PAPS UI를 렌더링합니다.
     */
    renderPapsUI(): void;
    /**
     * PAPS 반 목록을 렌더링합니다.
     */
    renderPapsClassList(): void;
    /**
     * PAPS 대시보드를 렌더링합니다.
     */
    renderPapsDashboard(): void;
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
     * PAPS 반을 생성합니다.
     */
    createPapsClass(): void;
    /**
     * PAPS 반을 편집합니다.
     */
    editPapsClass(classId: number): void;
    /**
     * PAPS 반을 삭제합니다.
     */
    deletePapsClass(classId: number): void;
    /**
     * PAPS 반을 선택합니다.
     */
    selectPapsClass(classId: number): void;
    /**
     * PAPS 학생을 추가합니다.
     */
    addPapsStudent(): void;
    /**
     * 선택된 PAPS 학생들을 삭제합니다.
     */
    deleteSelectedPapsStudents(): void;
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
     * PAPS 학생 업로드를 처리합니다.
     */
    handlePapsStudentUpload(): void;
    /**
     * PAPS를 엑셀로 내보냅니다.
     */
    exportPapsToExcel(): void;
    /**
     * 모든 PAPS를 엑셀로 내보냅니다.
     */
    exportAllPapsToExcel(): void;
    /**
     * PAPS 기록 업로드를 처리합니다.
     */
    handlePapsRecordUpload(): void;
    /**
     * 모든 PAPS 엑셀 업로드를 처리합니다.
     */
    handleAllPapsExcelUpload(): void;
    /**
     * PAPS 차트를 렌더링합니다.
     */
    renderPapsCharts(): void;
}
//# sourceMappingURL=papsManager_new.d.ts.map