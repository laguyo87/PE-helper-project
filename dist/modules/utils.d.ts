/**
 * 유틸리티 함수 모듈
 *
 * 이 모듈은 앱 전반에서 사용되는 공통 유틸리티 함수들을 제공합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
/**
 * DOM 쿼리 선택자 함수 타입
 */
export type DOMSelector = (selector: string) => HTMLElement | null;
/**
 * DOM 쿼리 전체 선택 함수 타입
 */
export type DOMSelectorAll = (selector: string) => NodeListOf<HTMLElement>;
import type { LeagueClass, LeagueStudent, LeagueGame } from './leagueManager.js';
import type { Tournament } from './tournamentManager.js';
import type { PapsClass } from './papsManager.js';
import type { ProgressClass } from './progressManager.js';
/**
 * 기본 앱 데이터 구조
 */
export interface DefaultAppData {
    leagues: {
        classes: LeagueClass[];
        students: LeagueStudent[];
        games: LeagueGame[];
        selectedClassId: number | null;
    };
    tournaments: {
        tournaments: Tournament[];
        activeTournamentId: string | null;
    };
    paps: {
        classes: PapsClass[];
        activeClassId: number | null;
    };
    progress: {
        classes: ProgressClass[];
        selectedClassId: string | null;
    };
}
/**
 * DOM 요소를 선택하는 헬퍼 함수
 * @param selector CSS 선택자
 * @returns HTMLElement 또는 null
 */
export declare function $(selector: string): HTMLElement | null;
/**
 * DOM 요소들을 모두 선택하는 헬퍼 함수
 * @param selector CSS 선택자
 * @returns NodeListOf<HTMLElement>
 */
export declare function $$(selector: string): NodeListOf<HTMLElement>;
/**
 * HTML 문자열을 안전하게 정제합니다 (XSS 방지)
 * @param html 정제할 HTML 문자열
 * @returns 정제된 안전한 HTML 문자열
 */
export declare function sanitizeHTML(html: string): string;
/**
 * 안전하게 innerHTML을 설정합니다
 * @param element HTML 요소
 * @param html 설정할 HTML 문자열
 */
export declare function setInnerHTMLSafe(element: HTMLElement, html: string): void;
/**
 * 사이드바 리스트 컨테이너를 정리합니다.
 * @param selectorFn DOM 선택자 함수 (선택적)
 */
export declare function cleanupSidebar(selectorFn?: DOMSelector): void;
/**
 * 앱 버전을 체크하고 필요시 새로고침합니다.
 */
export declare function checkVersion(): void;
/**
 * 기본 앱 데이터를 반환합니다.
 * @returns 기본 앱 데이터
 */
export declare function getDefaultData(): DefaultAppData;
declare const _default: {
    $: typeof $;
    $$: typeof $$;
    cleanupSidebar: typeof cleanupSidebar;
    checkVersion: typeof checkVersion;
    getDefaultData: typeof getDefaultData;
    sanitizeHTML: typeof sanitizeHTML;
    setInnerHTMLSafe: typeof setInnerHTMLSafe;
};
export default _default;
//# sourceMappingURL=utils.d.ts.map