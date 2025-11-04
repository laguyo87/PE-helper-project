/**
 * 수업 진도 관리 모듈
 * 원본 main.js의 진도표 기능을 모듈화
 */
export interface ProgressClass {
    id: string;
    name: string;
    teacherName?: string;
    unitContent?: string;
    weeklyHours?: number;
    schedule?: ProgressSession[];
    createdAt: number;
    updatedAt: number;
}
export interface ProgressSession {
    weekNumber: number;
    sessionNumber: number;
    date?: string;
    content: string;
    completed: boolean;
    notes: string;
}
export declare class ProgressManager {
    private $;
    private $$;
    private saveCallback;
    private classes;
    private selectedClassId;
    private saveDebounceTimer;
    constructor($: (selector: string) => HTMLElement | null, $$: (selector: string) => NodeListOf<HTMLElement>, saveCallback: () => void | Promise<void>);
    /**
     * 초기화
     */
    initialize(classes: ProgressClass[], selectedClassId?: string | null): void;
    /**
     * Progress 데이터를 업데이트합니다 (재초기화 없이)
     * onChangeCallbacks에서 호출될 때 사용
     */
    updateProgressData(classes: ProgressClass[], selectedClassId?: string | null): void;
    /**
     * 진도표 UI 렌더링 (원본 renderProgressUI 함수 기반)
     */
    renderProgressUI(): void;
    /**
     * 사이드바 정리
     */
    private cleanupSidebar;
    /**
     * 클래스 목록 렌더링 (원본 renderProgressClassList 함수 기반)
     */
    private renderProgressClassList;
    /**
     * 이벤트 리스너 설정 (원본 setupProgressEventListeners 함수 기반)
     */
    private setupProgressEventListeners;
    /**
     * 반 추가 (원본 addProgressClass 함수 기반)
     */
    private addProgressClass;
    /**
     * 반 편집 설정
     */
    private editProgressClassSettings;
    /**
     * 반 삭제 (원본 deleteProgressClass 함수 기반)
     */
    private deleteProgressClass;
    /**
     * 우측 영역 로드 (원본 loadProgressToRight 함수 기반)
     */
    private loadProgressToRight;
    /**
     * 진도표 렌더링 (원본 renderProgressSheet 함수 기반)
     */
    private renderProgressSheet;
    /**
     * 주차 행 렌더링
     */
    private renderWeekRow;
    /**
     * 진도표 이벤트 리스너 설정
     */
    private setupProgressSheetEventListeners;
    /**
     * 주차 제어 이벤트 리스너 설정
     */
    private setupWeekControlListeners;
    /**
     * 주차 추가
     */
    private addWeek;
    /**
     * 주차 삭제
     */
    private removeWeek;
    /**
     * 날짜 변경 이벤트 리스너 설정
     */
    private setupDateChangeListeners;
    /**
     * 요일 업데이트
     */
    private updateDayOfWeek;
    /**
     * 진도표 세션 업데이트
     */
    private updateProgressSession;
    /**
     * 설정 저장 (원본 saveProgressSettings 함수 기반)
     */
    private saveProgressSettings;
    /**
     * 선택된 반 가져오기
     */
    private getProgressSelected;
    /**
     * 선택된 반 저장
     */
    private saveProgressSelected;
    /**
     * 클래스 목록 저장 (디바운싱 적용)
     */
    private saveProgressClasses;
    /**
     * 진도표 제목 업데이트
     */
    private updateProgressSheetTitle;
    /**
     * 방문자 수 업데이트
     */
    private updateProgressVisitorCount;
    /**
     * UUID 생성
     */
    private uuid;
    /**
     * 클래스 목록 가져오기
     */
    getClasses(): ProgressClass[];
    /**
     * 선택된 클래스 ID 가져오기
     */
    getSelectedClassId(): string | null;
}
/**
 * ProgressManager 초기화 함수
 */
export declare function initializeProgressManager($: (selector: string) => HTMLElement | null, $$: (selector: string) => NodeListOf<HTMLElement>, saveCallback: () => void | Promise<void>): ProgressManager;
//# sourceMappingURL=progressManager.d.ts.map