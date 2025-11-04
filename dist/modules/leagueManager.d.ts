/**
 * 리그전 수업 관리 모듈
 *
 * 이 모듈은 리그전 수업의 모든 기능을 관리합니다.
 * 반(팀) 생성/삭제, 학생 관리, 경기 일정 생성, 점수 관리, 순위표 등을 담당합니다.
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
import { DataManager } from './dataManager.js';
/**
 * 리그전 클래스(반/팀) 데이터 구조
 */
export interface LeagueClass {
    id: number;
    name: string;
    note: string;
}
/**
 * 리그전 학생 데이터 구조
 */
export interface LeagueStudent {
    id: number;
    name: string;
    classId: number;
    note: string;
}
/**
 * 리그전 경기 데이터 구조
 */
export interface LeagueGame {
    id: number;
    classId: number;
    player1Id: number;
    player2Id: number;
    player1Score: number | null;
    player2Score: number | null;
    isCompleted: boolean;
    completedAt: number | null;
    note: string;
    isHighlighted: boolean;
}
/**
 * 리그전 데이터 구조
 */
export interface LeagueData {
    classes: LeagueClass[];
    students: LeagueStudent[];
    games: LeagueGame[];
    selectedClassId: number | null;
}
/**
 * 순위 데이터 구조
 */
export interface RankingData {
    name: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    gamesPlayed: number;
    rank?: number;
}
/**
 * 게임 통계 데이터 구조
 */
export interface GameStats {
    totalGames: number;
    completedGames: number;
    remainingGames: number;
    completionRate: number;
}
/**
 * 리그전 관리 옵션
 */
export interface LeagueManagerOptions {
    enableAutoSave?: boolean;
    enableGameStats?: boolean;
    enableRankings?: boolean;
    maxStudentsPerClass?: number;
}
/**
 * 리그전 수업을 관리하는 클래스
 */
export declare class LeagueManager {
    private leagueData;
    private options;
    private dataManager;
    private saveCallback;
    private dataUpdateCallback;
    /**
     * LeagueManager 인스턴스를 생성합니다.
     * @param leagueData 리그전 데이터
     * @param options 리그전 관리 옵션
     */
    constructor(leagueData: LeagueData, options?: LeagueManagerOptions);
    /**
     * DataManager 인스턴스를 설정합니다.
     * @param dataManager DataManager 인스턴스
     */
    setDataManager(dataManager: DataManager): void;
    /**
     * 저장 콜백을 설정합니다.
     * @param callback 저장 콜백 함수
     */
    setSaveCallback(callback: () => Promise<void>): void;
    /**
     * 데이터 업데이트 콜백을 설정합니다.
     * @param callback 데이터 업데이트 콜백 함수
     */
    setDataUpdateCallback(callback: (data: LeagueData) => void): void;
    /**
     * 데이터를 저장합니다.
     */
    private saveData;
    /**
     * 리그전 UI를 렌더링합니다.
     */
    renderLeagueUI(): void;
    /**
     * 반 목록을 렌더링합니다.
     */
    renderClassList(): void;
    /**
     * 리그전 대시보드를 렌더링합니다.
     * @param selectedClass 선택된 반
     */
    renderLeagueDashboard(selectedClass: LeagueClass): void;
    /**
     * 반을 생성합니다.
     */
    createClass(): void;
    /**
     * 반을 선택합니다.
     * @param id 반 ID (문자열 또는 숫자)
     */
    selectClass(id: number | string): void;
    /**
     * 반을 삭제합니다.
     * @param id 반 ID (숫자 또는 문자열)
     */
    deleteClass(id: number | string): void;
    /**
     * 학생을 추가합니다.
     */
    addStudent(): void;
    /**
     * 학생을 일괄 추가합니다.
     */
    bulkAddStudents(): void;
    /**
     * 학생 목록을 렌더링합니다.
     */
    renderStudentList(): void;
    /**
     * 학생을 제거합니다.
     * @param id 학생 ID
     */
    removeStudent(id: number): void;
    /**
     * 학생 이름을 수정합니다.
     * @param id 학생 ID
     */
    editStudentName(id: number): void;
    /**
     * 학생 메모를 수정합니다.
     * @param id 학생 ID
     */
    editStudentNote(id: number): void;
    /**
     * 반 메모를 수정합니다.
     * @param id 반 ID
     */
    editClassNote(id: number): void;
    /**
     * 반 이름을 수정합니다.
     * @param id 반 ID
     */
    editClassName(id: number): void;
    /**
     * 경기 일정을 생성합니다.
     */
    generateGames(): void;
    /**
     * 리그전 점수를 업데이트합니다.
     * @param gameId 경기 ID
     * @param player 플레이어 (1 또는 2)
     * @param score 점수
     */
    updateLeagueScore(gameId: number, player: 'player1' | 'player2', score: string): void;
    /**
     * 경기 메모를 업데이트합니다.
     * @param gameId 경기 ID
     * @param note 메모
     */
    updateGameNote(gameId: number, note: string): void;
    /**
     * 게임 강조를 토글합니다.
     * @param gameId 게임 ID
     */
    toggleGameHighlight(gameId: number): void;
    /**
     * 모든 강조를 해제합니다.
     */
    clearAllHighlights(): void;
    /**
     * 경기 생성 버튼 상태를 업데이트합니다.
     * @param hasGames 경기가 있는지 여부
     */
    updateGenerateGamesButtonState(hasGames: boolean): void;
    /**
     * 경기 테이블을 렌더링합니다.
     * @param isReadOnly 읽기 전용 여부
     */
    renderGamesTable(isReadOnly?: boolean): void;
    /**
     * 순위표를 렌더링합니다.
     * @param targetEl 대상 요소
     */
    renderRankingsTable(targetEl?: HTMLElement | null): void;
    /**
     * 순위 데이터를 가져옵니다.
     * @param classId 반 ID
     * @returns 순위 데이터 배열
     */
    getRankingsData(classId: number): RankingData[];
    /**
     * 게임 통계를 렌더링합니다.
     */
    renderGameStats(): void;
    /**
     * 모든 리그전을 엑셀로 내보냅니다.
     */
    exportAllLeaguesToExcel(): void;
    /**
     * 사이드바를 정리합니다.
     */
    private cleanupSidebar;
    /**
     * DOM 요소를 가져옵니다.
     * @param selector CSS 선택자
     * @returns DOM 요소 또는 null
     */
    private getElement;
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    private log;
    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    private logError;
    /**
     * 현재 리그전 데이터를 반환합니다.
     * @returns 리그전 데이터
     */
    getLeagueData(): LeagueData;
    /**
     * 리그전 데이터를 설정합니다.
     * @param data 리그전 데이터
     */
    setLeagueData(data: LeagueData): void;
}
/**
 * LeagueManager 인스턴스를 생성합니다.
 * @param leagueData 리그전 데이터
 * @param options 리그전 관리 옵션
 * @returns LeagueManager 인스턴스
 */
export declare function initializeLeagueManager(leagueData: LeagueData, options?: LeagueManagerOptions): LeagueManager;
export default LeagueManager;
//# sourceMappingURL=leagueManager.d.ts.map