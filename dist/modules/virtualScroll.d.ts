/**
 * 가상 스크롤링 유틸리티 모듈
 *
 * 대량 데이터 렌더링 시 성능을 향상시키기 위한 가상 스크롤링 기능을 제공합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
/**
 * 가상 스크롤 옵션
 */
export interface VirtualScrollOptions {
    /** 컨테이너 요소 */
    container: HTMLElement;
    /** 각 항목의 높이 (픽셀) */
    itemHeight: number;
    /** 렌더링할 항목 데이터 */
    items: any[];
    /** 항목 렌더링 함수 */
    renderItem: (item: any, index: number) => HTMLElement;
    /** 오버스캔 (화면 밖 항목 수, 기본값: 5) */
    overscan?: number;
    /** 스크롤 이벤트 디바운스 시간 (밀리초, 기본값: 16) */
    scrollDebounce?: number;
}
/**
 * 가상 스크롤 클래스
 */
export declare class VirtualScroll {
    private container;
    private itemHeight;
    private items;
    private renderItem;
    private overscan;
    private scrollDebounce;
    private visibleStartIndex;
    private visibleEndIndex;
    private scrollTop;
    private containerHeight;
    private scrollTimeout;
    private resizeObserver;
    constructor(options: VirtualScrollOptions);
    /**
     * 가상 스크롤 초기화
     */
    private init;
    /**
     * 컨테이너 높이 업데이트
     */
    private updateContainerHeight;
    /**
     * 스크롤 이벤트 처리
     */
    private handleScroll;
    /**
     * 화면에 보이는 항목 범위 계산
     */
    private calculateVisibleRange;
    /**
     * 가상 스크롤 렌더링
     */
    private render;
    /**
     * 항목 업데이트
     */
    updateItems(items: any[]): void;
    /**
     * 특정 인덱스로 스크롤
     */
    scrollToIndex(index: number): void;
    /**
     * 리소스 정리
     */
    cleanup(): void;
}
/**
 * 가상 스크롤 인스턴스 생성 헬퍼 함수
 */
export declare function createVirtualScroll(options: VirtualScrollOptions): VirtualScroll;
//# sourceMappingURL=virtualScroll.d.ts.map