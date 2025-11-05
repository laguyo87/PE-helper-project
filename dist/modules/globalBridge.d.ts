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
import { AppContext } from './appContext.js';
import { DOMSelector } from './utils.js';
/**
 * GlobalBridge 옵션
 */
export interface GlobalBridgeOptions {
    /** AppContext 인스턴스 */
    context: AppContext;
    /** DOM 선택자 함수 */
    $: DOMSelector;
    /** DOM 전체 선택 함수 */
    $$: (selector: string) => NodeListOf<HTMLElement>;
    /** 모드 전환 함수 */
    switchMode?: (mode: string) => void;
    /** 데이터 저장 함수 */
    saveDataToFirestore?: () => Promise<void>;
}
/**
 * 전역 함수 등록을 담당하는 클래스
 */
export declare class GlobalBridge {
    private context;
    private $;
    private $$;
    private switchMode?;
    private saveDataToFirestore?;
    /**
     * GlobalBridge 인스턴스를 생성합니다.
     * @param options GlobalBridge 옵션
     */
    constructor(options: GlobalBridgeOptions);
    /**
     * 모든 전역 함수를 등록합니다.
     */
    registerAll(): void;
    /**
     * 실행 취소 버튼의 tooltip을 플랫폼에 맞게 업데이트합니다.
     */
    private updateUndoTooltip;
    /**
     * 실행 취소 버튼의 활성화 상태를 업데이트합니다.
     */
    private updateUndoButtonState;
    /**
     * 사이드바 토글 버튼 이벤트를 초기화합니다.
     * HTML onclick이 작동하지 않을 경우를 대비한 백업입니다.
     */
    private initializeSidebarToggle;
    /**
     * 사이드바 토글 버튼 이벤트 리스너를 설정합니다.
     */
    private setupSidebarToggle;
    /**
     * 특정 전역 함수를 등록합니다.
     * @param name 함수 이름
     * @param func 함수
     */
    register(name: string, func: (...args: any[]) => any): void;
    /**
     * 전역 함수를 제거합니다.
     * @param name 함수 이름
     */
    unregister(name: string): void;
    /**
     * 모든 전역 함수를 제거합니다.
     */
    unregisterAll(): void;
    /**
     * appMode를 업데이트합니다.
     */
    updateAppMode(): void;
}
/**
 * GlobalBridge 인스턴스를 생성하는 팩토리 함수
 * @param options GlobalBridge 옵션
 * @returns GlobalBridge 인스턴스
 */
export declare function createGlobalBridge(options: GlobalBridgeOptions): GlobalBridge;
export default GlobalBridge;
//# sourceMappingURL=globalBridge.d.ts.map