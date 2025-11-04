/**
 * 전역 브릿지 모듈
 *
 * 이 모듈은 HTML의 onclick 핸들러와 모듈화된 코드를 연결하는 브릿지 역할을 합니다.
 * window 객체에 전역 함수를 등록하여 하위 호환성을 유지합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
// ========================================
// GlobalBridge 클래스
// ========================================
/**
 * 전역 함수 등록을 담당하는 클래스
 */
export class GlobalBridge {
    /**
     * GlobalBridge 인스턴스를 생성합니다.
     * @param options GlobalBridge 옵션
     */
    constructor(options) {
        this.context = options.context;
        this.$ = options.$;
        this.$$ = options.$$;
        this.switchMode = options.switchMode;
        this.saveDataToFirestore = options.saveDataToFirestore;
    }
    /**
     * 모든 전역 함수를 등록합니다.
     */
    registerAll() {
        // 모드 전환
        if (this.switchMode) {
            window.switchMode = this.switchMode.bind(this);
        }
        else if (this.context.uiRenderer) {
            window.switchMode = (mode) => {
                this.context.uiRenderer?.switchMode(mode);
            };
        }
        // 현재 모드
        window.appMode = this.context.uiRenderer?.getMode() || 'progress';
        // DOM 헬퍼
        window.$ = this.$;
        window.$$ = this.$$;
        // LeagueManager 전역 함수
        if (this.context.leagueManager) {
            window.selectClass = (id) => {
                this.context.leagueManager?.selectClass(id);
            };
            window.editClassNote = (id) => {
                this.context.leagueManager?.editClassNote(id);
            };
            window.editClassName = (id) => {
                this.context.leagueManager?.editClassName(id);
            };
            window.deleteClass = (id) => {
                this.context.leagueManager?.deleteClass(id);
            };
        }
        // LeagueManager 전역 등록 (리그전 모드에서 window.leagueManager 사용)
        if (this.context.leagueManager) {
            window.leagueManager = this.context.leagueManager;
        }
        // TournamentManager 전역 함수
        if (this.context.tournamentManager) {
            window.createTournament = () => {
                this.context.tournamentManager?.createTournament();
            };
            window.deleteTournament = (id) => {
                this.context.tournamentManager?.deleteTournament(id);
            };
            window.showTournamentSettings = (tournamentId) => {
                this.context.tournamentManager?.showTournamentSettings(tournamentId);
            };
            window.updateTournamentSettings = () => {
                this.context.tournamentManager?.updateTournamentSettings();
            };
            window.addTeamToTournament = () => {
                this.context.tournamentManager?.addTeamToTournament();
            };
            window.onScoreInputTournament = (matchId, side, value) => {
                this.context.tournamentManager?.onScoreInputTournament(matchId, side, value);
            };
        }
        // 모달 닫기
        window.closeModal = () => {
            const modal = document.querySelector('.modal-overlay, .modal, [class*="modal"]');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
        };
        // 데이터 저장 (레거시 호환)
        if (this.saveDataToFirestore) {
            window.saveDataToFirestore = this.saveDataToFirestore;
        }
        else if (this.context.dataSyncService) {
            window.saveDataToFirestore = async () => {
                await this.context.dataSyncService?.saveToFirestore();
            };
        }
        console.log('전역 함수 등록 완료');
    }
    /**
     * 특정 전역 함수를 등록합니다.
     * @param name 함수 이름
     * @param func 함수
     */
    register(name, func) {
        window[name] = func;
    }
    /**
     * 전역 함수를 제거합니다.
     * @param name 함수 이름
     */
    unregister(name) {
        delete window[name];
    }
    /**
     * 모든 전역 함수를 제거합니다.
     */
    unregisterAll() {
        const globalFunctions = [
            'switchMode',
            'appMode',
            '$',
            '$$',
            'selectClass',
            'editClassNote',
            'editClassName',
            'deleteClass',
            'leagueManager',
            'createTournament',
            'deleteTournament',
            'showTournamentSettings',
            'updateTournamentSettings',
            'addTeamToTournament',
            'onScoreInputTournament',
            'closeModal',
            'saveDataToFirestore'
        ];
        globalFunctions.forEach(name => {
            delete window[name];
        });
        console.log('전역 함수 제거 완료');
    }
    /**
     * appMode를 업데이트합니다.
     */
    updateAppMode() {
        if (this.context.uiRenderer) {
            window.appMode = this.context.uiRenderer.getMode();
        }
    }
}
// ========================================
// 팩토리 함수
// ========================================
/**
 * GlobalBridge 인스턴스를 생성하는 팩토리 함수
 * @param options GlobalBridge 옵션
 * @returns GlobalBridge 인스턴스
 */
export function createGlobalBridge(options) {
    return new GlobalBridge(options);
}
// ========================================
// 기본 내보내기
// ========================================
export default GlobalBridge;
//# sourceMappingURL=globalBridge.js.map