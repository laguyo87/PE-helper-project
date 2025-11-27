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
 * ID로 DOM 요소를 안전하게 가져옵니다.
 * @param id 요소 ID
 * @param throwIfNotFound 요소를 찾지 못했을 때 에러를 던질지 여부 (기본값: false)
 * @returns HTMLElement 또는 null
 * @throws 요소를 찾지 못하고 throwIfNotFound가 true인 경우
 */
export declare function getElement(id: string, throwIfNotFound?: boolean): HTMLElement | null;
/**
 * CSS 선택자로 DOM 요소를 안전하게 가져옵니다.
 * @param selector CSS 선택자
 * @param throwIfNotFound 요소를 찾지 못했을 때 에러를 던질지 여부 (기본값: false)
 * @returns HTMLElement 또는 null
 * @throws 요소를 찾지 못하고 throwIfNotFound가 true인 경우
 */
export declare function getElementBySelector(selector: string, throwIfNotFound?: boolean): HTMLElement | null;
/**
 * CSS 선택자로 여러 DOM 요소를 안전하게 가져옵니다.
 * @param selector CSS 선택자
 * @returns HTMLElement 배열
 */
export declare function getElements(selector: string): HTMLElement[];
/**
 * 부모 요소 내에서 CSS 선택자로 DOM 요소를 안전하게 가져옵니다.
 * @param parent 부모 요소
 * @param selector CSS 선택자
 * @param throwIfNotFound 요소를 찾지 못했을 때 에러를 던질지 여부 (기본값: false)
 * @returns HTMLElement 또는 null
 * @throws 요소를 찾지 못하고 throwIfNotFound가 true인 경우
 */
export declare function getElementInParent(parent: HTMLElement, selector: string, throwIfNotFound?: boolean): HTMLElement | null;
/**
 * 부모 요소 내에서 CSS 선택자로 여러 DOM 요소를 안전하게 가져옵니다.
 * @param parent 부모 요소
 * @param selector CSS 선택자
 * @returns HTMLElement 배열
 */
export declare function getElementsInParent(parent: HTMLElement, selector: string): HTMLElement[];
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
/**
 * DOM 업데이트가 완료될 때까지 대기하는 Promise를 반환합니다.
 * requestAnimationFrame을 사용하여 브라우저 렌더링 사이클과 동기화합니다.
 *
 * @param frames 대기할 프레임 수 (기본값: 2, DOM 업데이트 후 렌더링까지 대기)
 * @returns Promise<void>
 */
export declare function waitForDOMUpdate(frames?: number): Promise<void>;
/**
 * 특정 요소가 DOM에 나타날 때까지 대기하는 Promise를 반환합니다.
 * MutationObserver와 requestAnimationFrame을 조합하여 사용합니다.
 *
 * @param selector CSS 선택자
 * @param timeout 최대 대기 시간 (밀리초, 기본값: 5000)
 * @returns Promise<HTMLElement | null>
 */
export declare function waitForElement(selector: string, timeout?: number): Promise<HTMLElement | null>;
export declare function checkVersion(): void;
/**
 * 기본 앱 데이터를 반환합니다.
 * @returns 기본 앱 데이터
 */
export declare function getDefaultData(): DefaultAppData;
/**
 * 데이터를 검증하고 저장하는 공통 패턴을 처리합니다.
 * @param data 검증할 데이터
 * @param schema Zod 스키마
 * @param saveCallback 저장 콜백 함수
 * @param onSuccess 성공 시 콜백 함수 (선택적)
 * @param onError 에러 시 콜백 함수 (선택적)
 * @returns 검증 및 저장 성공 여부
 */
export declare function validateAndSave<T>(data: unknown, schema: any, // Zod 스키마 타입 (순환 참조 방지)
saveCallback: (validatedData: T) => Promise<void> | void, onSuccess?: () => void, onError?: (errors: string[]) => void): Promise<boolean>;
/**
 * 로컬 스토리지에 안전하게 데이터를 저장합니다.
 * @param key 저장할 키
 * @param data 저장할 데이터
 * @returns 저장 성공 여부
 */
export declare function saveToLocalStorage(key: string, data: unknown): boolean;
/**
 * 로컬 스토리지에서 안전하게 데이터를 로드합니다.
 * @param key 로드할 키
 * @param defaultValue 데이터가 없거나 파싱 실패 시 반환할 기본값
 * @returns 로드된 데이터 또는 기본값
 */
export declare function loadFromLocalStorage<T>(key: string, defaultValue: T): T;
declare const _default: {
    $: typeof $;
    $$: typeof $$;
    cleanupSidebar: typeof cleanupSidebar;
    checkVersion: typeof checkVersion;
    getDefaultData: typeof getDefaultData;
    sanitizeHTML: typeof sanitizeHTML;
    setInnerHTMLSafe: typeof setInnerHTMLSafe;
    getElement: typeof getElement;
    getElementBySelector: typeof getElementBySelector;
    getElements: typeof getElements;
    getElementInParent: typeof getElementInParent;
    getElementsInParent: typeof getElementsInParent;
    validateAndSave: typeof validateAndSave;
    saveToLocalStorage: typeof saveToLocalStorage;
    loadFromLocalStorage: typeof loadFromLocalStorage;
};
export default _default;
//# sourceMappingURL=utils.d.ts.map