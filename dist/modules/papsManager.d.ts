/**
 * PAPS 수업 관리 모듈
 *
 * 이 모듈은 PAPS(Physical Activity Promotion System) 수업의 모든 기능을 관리합니다.
 * PAPS 반 생성/삭제, 학생 관리, 체력 측정 기록, 평가 기준 적용 등을 담당합니다.
 *
 * 현재 지원하는 기능:
 * - PAPS 반 관리 (생성, 수정, 삭제)
 * - 학생 명단 관리 (추가, 삭제, 엑셀 업로드)
 * - 체력 측정 기록 입력 및 등급 계산
 * - PAPS 평가 기준 적용 (2024년 기준)
 * - 엑셀 내보내기/가져오기
 * - 차트 및 통계 분석
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
    records: Record<string, any>;
}
export interface PapsClass {
    id: number;
    name: string;
    gradeLevel?: string;
    eventSettings?: Record<string, string>;
    students: PapsStudent[];
}
export interface PapsData {
    classes: PapsClass[];
    activeClassId: number | null;
}
export interface PapsCriteria {
    [gender: string]: {
        [grade: string]: {
            [test: string]: number[][];
        };
    };
}
export interface PapsItems {
    [category: string]: {
        id: string;
        options: string[];
    };
}
/**
 * PAPS 관리자 클래스
 */
export declare class PapsManager {
    private papsData;
    private $;
    private saveDataCallback;
    static readonly PAPS_ITEMS: PapsItems;
    static readonly PAPS_CRITERIA: PapsCriteria;
    constructor(papsData: PapsData, $: (selector: string) => HTMLElement, saveDataCallback: () => void);
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
     * PAPS 반을 선택합니다.
     */
    selectPapsClass(id: number): void;
    /**
     * PAPS 반을 삭제합니다.
     */
    deletePapsClass(id: number): void;
    /**
     * PAPS 대시보드를 렌더링합니다.
     */
    renderPapsDashboard(cls: PapsClass): void;
    /**
     * PAPS 테이블을 구성합니다.
     */
    buildPapsTable(cls: PapsClass): void;
    /**
     * PAPS 입력 이벤트를 처리합니다.
     */
    onPapsInput(e: Event, classId: number): void;
    /**
     * PAPS 행의 등급을 업데이트합니다.
     */
    updatePapsRowGrades(tr: HTMLTableRowElement, cls: PapsClass): void;
    /**
     * PAPS 등급을 계산합니다.
     */
    calcPapsGrade(categoryId: string, value: number, gender: string, gradeLevel: string, cls: PapsClass): string;
    /**
     * PAPS 학생을 추가합니다.
     */
    addPapsStudent(cls: PapsClass): void;
    /**
     * 선택된 PAPS 학생들을 삭제합니다.
     */
    deleteSelectedPapsStudents(cls: PapsClass): void;
    /**
     * PAPS 설정을 표시합니다.
     */
    showPapsSettings(): void;
    /**
     * PAPS 설정을 저장합니다.
     */
    savePapsSettings(): void;
    /**
     * PAPS 이벤트 리스너를 설정합니다.
     */
    private setupPapsEventListeners;
    /**
     * PAPS 대시보드 이벤트를 설정합니다.
     */
    private setupPapsDashboardEvents;
    /**
     * 사이드바를 정리합니다.
     */
    private cleanupSidebar;
    /**
     * 모든 PAPS 데이터를 엑셀로 내보냅니다.
     */
    exportAllPapsToExcel(): void;
    /**
     * PAPS 엑셀 파일을 업로드합니다.
     */
    handleAllPapsExcelUpload(event: Event): void;
    /**
     * PAPS 데이터를 가져옵니다.
     */
    getPapsData(): PapsData;
    /**
     * PAPS 데이터를 설정합니다.
     */
    setPapsData(data: PapsData): void;
}
declare global {
    interface Window {
        papsManager: PapsManager;
        papsItems: PapsItems;
        showModal: (options: any) => void;
        closeModal: () => void;
    }
}
//# sourceMappingURL=papsManager.d.ts.map