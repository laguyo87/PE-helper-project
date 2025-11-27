/**
 * 가상 스크롤링 유틸리티 모듈
 * 
 * 대량 데이터 렌더링 시 성능을 향상시키기 위한 가상 스크롤링 기능을 제공합니다.
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

// ========================================
// 타입 정의
// ========================================

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
export class VirtualScroll {
  private container: HTMLElement;
  private itemHeight: number;
  private items: any[];
  private renderItem: (item: any, index: number) => HTMLElement;
  private overscan: number;
  private scrollDebounce: number;
  
  private visibleStartIndex: number = 0;
  private visibleEndIndex: number = 0;
  private scrollTop: number = 0;
  private containerHeight: number = 0;
  private scrollTimeout: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: VirtualScrollOptions) {
    this.container = options.container;
    this.itemHeight = options.itemHeight;
    this.items = options.items;
    this.renderItem = options.renderItem;
    this.overscan = options.overscan ?? 5;
    this.scrollDebounce = options.scrollDebounce ?? 16;

    this.init();
  }

  /**
   * 가상 스크롤 초기화
   */
  private init(): void {
    // 컨테이너 높이 설정
    this.updateContainerHeight();

    // 초기 렌더링
    this.render();

    // 스크롤 이벤트 리스너
    this.container.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // 리사이즈 옵저버 (컨테이너 크기 변경 감지)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerHeight();
        this.render();
      });
      this.resizeObserver.observe(this.container);
    }

    // 윈도우 리사이즈 이벤트 (ResizeObserver 미지원 브라우저용)
    window.addEventListener('resize', () => {
      this.updateContainerHeight();
      this.render();
    }, { passive: true });
  }

  /**
   * 컨테이너 높이 업데이트
   */
  private updateContainerHeight(): void {
    this.containerHeight = this.container.clientHeight;
  }

  /**
   * 스크롤 이벤트 처리
   */
  private handleScroll(): void {
    if (this.scrollTimeout !== null) {
      cancelAnimationFrame(this.scrollTimeout);
    }

    this.scrollTimeout = requestAnimationFrame(() => {
      this.scrollTop = this.container.scrollTop;
      this.calculateVisibleRange();
      this.render();
      this.scrollTimeout = null;
    });
  }

  /**
   * 화면에 보이는 항목 범위 계산
   */
  private calculateVisibleRange(): void {
    const itemsPerView = Math.ceil(this.containerHeight / this.itemHeight);
    
    this.visibleStartIndex = Math.max(
      0,
      Math.floor(this.scrollTop / this.itemHeight) - this.overscan
    );
    
    this.visibleEndIndex = Math.min(
      this.items.length - 1,
      this.visibleStartIndex + itemsPerView + this.overscan * 2
    );
  }

  /**
   * 가상 스크롤 렌더링
   */
  private render(): void {
    this.calculateVisibleRange();

    // 전체 높이 설정 (스크롤 가능하도록)
    const totalHeight = this.items.length * this.itemHeight;
    this.container.style.height = `${this.containerHeight}px`;
    
    // 가상 스크롤 컨테이너 생성 또는 업데이트
    let virtualContainer = this.container.querySelector('.virtual-scroll-container') as HTMLElement;
    
    if (!virtualContainer) {
      virtualContainer = document.createElement('div');
      virtualContainer.className = 'virtual-scroll-container';
      virtualContainer.style.position = 'relative';
      virtualContainer.style.height = `${totalHeight}px`;
      this.container.appendChild(virtualContainer);
    } else {
      virtualContainer.style.height = `${totalHeight}px`;
    }

    // 보이는 항목만 렌더링
    const visibleItems: HTMLElement[] = [];
    
    for (let i = this.visibleStartIndex; i <= this.visibleEndIndex; i++) {
      if (i >= 0 && i < this.items.length) {
        const item = this.items[i];
        const element = this.renderItem(item, i);
        element.style.position = 'absolute';
        element.style.top = `${i * this.itemHeight}px`;
        element.style.width = '100%';
        element.style.height = `${this.itemHeight}px`;
        visibleItems.push(element);
      }
    }

    // 기존 항목 제거 및 새 항목 추가
    virtualContainer.innerHTML = '';
    visibleItems.forEach(item => virtualContainer.appendChild(item));
  }

  /**
   * 항목 업데이트
   */
  public updateItems(items: any[]): void {
    this.items = items;
    this.render();
  }

  /**
   * 특정 인덱스로 스크롤
   */
  public scrollToIndex(index: number): void {
    const targetScrollTop = index * this.itemHeight;
    this.container.scrollTop = targetScrollTop;
    this.scrollTop = targetScrollTop;
    this.render();
  }

  /**
   * 리소스 정리
   */
  public cleanup(): void {
    if (this.scrollTimeout !== null) {
      cancelAnimationFrame(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.container.removeEventListener('scroll', this.handleScroll.bind(this));
    window.removeEventListener('resize', () => {
      this.updateContainerHeight();
      this.render();
    });
  }
}

/**
 * 가상 스크롤 인스턴스 생성 헬퍼 함수
 */
export function createVirtualScroll(options: VirtualScrollOptions): VirtualScroll {
  return new VirtualScroll(options);
}

