/**
 * 토너먼트 수업 관리 모듈
 *
 * 이 모듈은 토너먼트 수업의 모든 기능을 관리합니다.
 * 토너먼트 생성/삭제, 팀 관리, 대진표 구성, 경기 관리 등을 담당합니다.
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
export interface TournamentMatch {
    id: string;
    roundIdx: number;
    slotIdx: number;
    teamA: string | null;
    teamB: string | null;
    scoreA: number | null;
    scoreB: number | null;
    winner: string | null;
    parentId: string | null;
    isBye: boolean;
    matchNumber: number | null;
}
export interface Tournament {
    id: string;
    name: string;
    teams: string[];
    rounds: TournamentMatch[][];
    sport: string;
    format: 'single' | 'double';
    seeding: 'input' | 'random';
}
export interface TournamentData {
    tournaments: Tournament[];
    activeTournamentId: string | null;
}
/**
 * 토너먼트 관리자 클래스
 */
export declare class TournamentManager {
    private tournamentData;
    private saveCallback;
    private dataUpdateCallback;
    constructor(tournamentData: TournamentData, saveCallback?: (() => void) | null);
    /**
     * 토너먼트 데이터를 설정합니다.
     * @param data 토너먼트 데이터
     */
    setTournamentData(data: TournamentData): void;
    /**
     * 데이터 업데이트 콜백을 설정합니다.
     * @param callback 콜백 함수
     */
    setDataUpdateCallback(callback: (newData: TournamentData) => void): void;
    /**
     * 저장 콜백을 설정합니다.
     * @param callback 콜백 함수
     */
    setSaveCallback(callback: () => void): void;
    /**
     * 데이터를 저장합니다.
     */
    private saveData;
    /**
     * DOM 요소를 가져옵니다.
     * @param selector CSS 선택자
     * @returns DOM 요소 또는 null
     */
    private getElement;
    /**
     * jQuery 스타일 선택자 함수
     * @param selector CSS 선택자
     * @returns jQuery 스타일 객체
     */
    private $;
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    private log;
    /**
     * 에러 로그를 출력합니다.
     * @param message 에러 메시지
     */
    private logError;
    /**
     * 사이드바를 정리합니다.
     */
    private cleanupSidebar;
    /**
     * 토너먼트 UI를 렌더링합니다.
     */
    renderTournamentUI(): void;
    /**
     * 토너먼트 목록을 렌더링합니다.
     */
    renderTournamentList(): void;
    /**
     * 토너먼트 대시보드를 렌더링합니다.
     * @param tourney 토너먼트 객체
     */
    renderTournamentDashboard(tourney: Tournament): void;
    /**
     * 토너먼트를 생성합니다.
     */
    createTournament(): void;
    /**
     * 토너먼트를 선택합니다.
     * @param id 토너먼트 ID
     */
    selectTournament(id: string): void;
    /**
     * 토너먼트를 삭제합니다.
     * @param id 토너먼트 ID
     */
    deleteTournament(id: string): void;
    /**
     * 토너먼트 설정을 표시합니다.
     * @param tournamentId 토너먼트 ID
     */
    showTournamentSettings(tournamentId: string): void;
    /**
     * 토너먼트 설정을 업데이트합니다.
     */
    updateTournamentSettings(): void;
    /**
     * 토너먼트에 팀을 추가합니다.
     */
    addTeamToTournament(): void;
    /**
     * 토너먼트에서 팀을 제거합니다.
     * @param teamNameToRemove 제거할 팀 이름
     */
    removeTeamFromTournament(teamNameToRemove: string): void;
    /**
     * 팀 이름을 편집합니다.
     * @param oldName 기존 팀 이름
     * @param newName 새로운 팀 이름
     */
    editTeamName(oldName: string, newName: string): void;
    /**
     * 대진표를 구성합니다.
     * @param tourney 토너먼트 객체
     */
    buildBracket(tourney?: Tournament): void;
    /**
     * 토너먼트 점수를 입력합니다.
     * @param matchId 경기 ID
     * @param side 팀 (A 또는 B)
     * @param value 점수
     */
    onScoreInputTournament(matchId: string, side: 'A' | 'B', value: string): void;
    /**
     * 승자를 전파합니다.
     * @param tourney 토너먼트 객체
     */
    propagateWinners(tourney: Tournament): void;
    /**
     * 대진표를 렌더링합니다.
     * @param tourney 토너먼트 객체
     * @param isReadOnly 읽기 전용 여부
     */
    renderBracket(tourney: Tournament, isReadOnly?: boolean): void;
    /**
     * 경기 카드를 렌더링합니다.
     * @param match 경기 객체
     * @param rIdx 라운드 인덱스
     * @param tourney 토너먼트 객체
     * @param isReadOnly 읽기 전용 여부
     * @returns HTML 문자열
     */
    renderMatchCard(match: TournamentMatch, rIdx: number, tourney: Tournament, isReadOnly?: boolean): string;
    /**
     * 라운드 라벨을 생성합니다.
     * @param count 라운드 수
     * @returns 라운드 라벨 배열
     */
    private makeRoundLabels;
    /**
     * 메달 아이콘을 생성합니다.
     * @param type 메달 타입
     * @returns 메달 HTML
     */
    private getMedal;
    /**
     * SVG 연결선을 그립니다.
     * @param tourney 토너먼트 객체
     */
    private drawSvgLines;
    /**
     * 요소의 오른쪽 하단 좌표를 가져옵니다.
     * @param el 요소
     * @param container 컨테이너
     * @returns 좌표 객체
     */
    private getBottomRight;
    /**
     * 요소의 왼쪽 하단 좌표를 가져옵니다.
     * @param el 요소
     * @param container 컨테이너
     * @returns 좌표 객체
     */
    private getBottomLeft;
}
/**
 * 토너먼트 관리자를 초기화합니다.
 * @param tournamentData 토너먼트 데이터
 * @param saveCallback 저장 콜백
 * @returns TournamentManager 인스턴스
 */
export declare function initializeTournamentManager(tournamentData: TournamentData, saveCallback?: (() => void) | null): TournamentManager;
//# sourceMappingURL=tournamentManager.d.ts.map