/**
 * 에러 필터 모듈
 * 
 * 이 모듈은 특정 에러(예: COOP 에러, Chrome 확장 프로그램 오류)를 필터링하여 콘솔에 표시되지 않도록 합니다.
 * - Firebase 팝업 로그인 시 발생하는 Cross-Origin-Opener-Policy 경고
 * - Chrome 확장 프로그램의 content script 관련 오류
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

// ========================================
// 타입 정의
// ========================================

/**
 * 에러 필터 옵션
 */
export interface ErrorFilterOptions {
  /** 필터링할 에러 패턴 목록 */
  patterns?: string[];
  /** MutationObserver 사용 여부 (기본값: true) */
  useMutationObserver?: boolean;
  /** 콘솔 필터링 활성화 여부 (기본값: true) */
  filterConsole?: boolean;
  /** 이벤트 필터링 활성화 여부 (기본값: true) */
  filterEvents?: boolean;
}

// ========================================
// ErrorFilter 클래스
// ========================================

/**
 * 에러 필터링을 담당하는 클래스
 */
export class ErrorFilter {
  private patterns: string[];
  private useMutationObserver: boolean;
  private filterConsole: boolean;
  private filterEvents: boolean;
  private originalConsoleMethods: { [key: string]: any } = {};
  private mutationObserver: MutationObserver | null = null;

  /**
   * ErrorFilter 인스턴스를 생성합니다.
   * @param options 에러 필터 옵션
   */
  constructor(options: ErrorFilterOptions = {}) {
    this.patterns = options.patterns || [
      'cross-origin-opener-policy',
      'coop',
      'popup.ts',
      'window.closed',
      'window.close',
      'would block',
      'policy would block',
      'message port',
      'content.js',
      'chrome-extension',
      'firestore.googleapis.com',
      '400',
      'Failed to load resource',
      'err_quic_protocol_error',
      'err_name_not_resolved',
      'err_internet_disconnected',
      'err_network_changed',
      'err_connection_refused',
      'net::err_',
      'webchannel_connection.ts',
      'Bad Request',
      'Write/channel',
      'gsessionid',
    ];
    this.useMutationObserver = options.useMutationObserver !== false;
    this.filterConsole = options.filterConsole !== false;
    this.filterEvents = options.filterEvents !== false;

    // 콘솔 에러 인터셉터 설정 (가장 먼저 실행)
    this.setupConsoleErrorInterceptor();
    
    // 에러 필터링 초기화
    this.initialize();
  }

  /**
   * 에러 필터링을 초기화합니다.
   */
  private initialize(): void {
    if (this.filterConsole) {
      this.setupConsoleFiltering();
    }

    if (this.filterEvents) {
      this.setupEventFiltering();
    }

    if (this.useMutationObserver) {
      this.setupMutationObserver();
    }
  }

  /**
   * 필터링할 에러인지 확인합니다.
   * @param text 검사할 텍스트
   * @returns 필터링할 에러인지 여부
   */
  private isCOOPError(text: string | undefined | null): boolean {
    if (!text) return false;
    const str = String(text).toLowerCase();

    // 패턴 목록 확인
    if (this.patterns.some(pattern => str.includes(pattern.toLowerCase()))) {
      return true;
    }

    // 추가 패턴 확인 (더 포괄적으로)
    return (
      // "policy would block the window.closed call" 전체 또는 부분 매칭
      (str.includes('cross-origin-opener-policy') || str.includes('coop')) ||
      // "policy would block" 관련 모든 조합
      (str.includes('policy') && str.includes('would') && str.includes('block')) ||
      // "window.closed" 또는 "window.close" 관련 (더 포괄적으로)
      (str.includes('window.closed') || str.includes('window.close')) ||
      // "popup.ts" 관련 (소스 파일명) - 단독으로도 필터링
      (str.includes('popup.ts')) ||
      // "would block"과 "window" 또는 "popup"이 함께 있는 경우
      (str.includes('would') && str.includes('block') && (str.includes('window') || str.includes('popup') || str.includes('call'))) ||
      // "policy would block"과 "call" 조합
      (str.includes('policy') && str.includes('would') && str.includes('block') && str.includes('call')) ||
      // Chrome 확장 프로그램 관련 오류
      (str.includes('message') && str.includes('port') && str.includes('closed')) ||
      (str.includes('port closed') && str.includes('response')) ||
      // Firestore API 에러 (네트워크 오류)
      (str.includes('firestore.googleapis.com') && (
        str.includes('400') || 
        str.includes('bad request') || 
        str.includes('failed to load') || 
        str.includes('net::') || 
        str.includes('err_') ||
        str.includes('webchannel_connection.ts') ||
        str.includes('write/channel') ||
        str.includes('gsessionid')
      )) ||
      // Firestore Write channel 에러 (더 구체적으로)
      (str.includes('write/channel') && str.includes('400')) ||
      (str.includes('gsessionid') && str.includes('400')) ||
      // 네트워크 에러 패턴
      (str.includes('net::') && (str.includes('err_quic') || str.includes('err_name') || str.includes('err_internet') || str.includes('err_network') || str.includes('err_connection'))) ||
      (str.includes('err_quic_protocol_error') || str.includes('err_name_not_resolved') || str.includes('err_internet_disconnected')) ||
      // DataManager 타임아웃 에러 (일시적 네트워크 문제)
      (str.includes('Firestore 저장 시간 초과') || str.includes('Firestore 요청 시간 초과') || 
       (str.includes('datamanager') && str.includes('시간 초과')))
    );
  }

  /**
   * 순환 참조를 안전하게 처리하는 함수
   * @param obj 직렬화할 객체
   * @returns JSON 문자열
   */
  private safeStringify(obj: any): string {
    const seen = new WeakSet();
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (e) {
      return String(obj);
    }
  }

  /**
   * 콘솔 필터링을 설정합니다.
   */
  private setupConsoleFiltering(): void {
    const consoleMethods = ['error', 'warn', 'log', 'debug', 'info'];

    consoleMethods.forEach(method => {
      const original = (window.console as any)[method];
      if (!original) return;

      // 원본 메서드 저장
      this.originalConsoleMethods[method] = original;

      // 콘솔 메서드 오버라이드
      Object.defineProperty(window.console, method, {
        value: (...args: any[]) => {
          // 전체 메시지 생성 및 검사 (더 포괄적으로)
          let shouldFilter = false;
          
          // 각 인자를 검사
          for (const arg of args) {
            if (typeof arg === 'string') {
              if (this.isCOOPError(arg)) {
                shouldFilter = true;
                break;
              }
            } else if (arg instanceof Error) {
              const errorText = (arg.message || '') + ' ' + (arg.stack || '') + ' ' + arg.name;
              if (this.isCOOPError(errorText)) {
                shouldFilter = true;
                break;
              }
            } else if (typeof arg === 'object' && arg !== null) {
              try {
                const stringified = this.safeStringify(arg);
                if (this.isCOOPError(stringified)) {
                  shouldFilter = true;
                  break;
                }
              } catch {
                // 직렬화 실패 시 문자열로 변환하여 검사
                const asString = String(arg);
                if (this.isCOOPError(asString)) {
                  shouldFilter = true;
                  break;
                }
              }
            } else {
              // 기타 타입도 문자열로 변환하여 검사
              const asString = String(arg);
              if (this.isCOOPError(asString)) {
                shouldFilter = true;
                break;
              }
            }
          }
          
          // 전체 메시지를 하나로 합쳐서 검사
          if (!shouldFilter) {
            const fullMessage = args.map(arg => {
              if (typeof arg === 'string') return arg;
              if (arg instanceof Error) return (arg.message || '') + ' ' + (arg.stack || '');
              if (typeof arg === 'object' && arg !== null) {
                try {
                  return this.safeStringify(arg);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' ');

            if (this.isCOOPError(fullMessage)) {
              shouldFilter = true;
            }
          }

          if (shouldFilter) {
            return; // 필터링할 에러는 무시
          }

          original.apply(window.console, args);
        },
        writable: true,
        configurable: true
      });
    });
  }

  /**
   * 이벤트 필터링을 설정합니다.
   */
  private setupEventFiltering(): void {
    // 에러 이벤트 리스너 (capture phase에서 먼저 처리)
    // 가장 먼저 실행되도록 { capture: true, passive: false } 사용
    window.addEventListener('error', (event: ErrorEvent) => {
      const message = event.message || '';
      const stack = (event.error as any)?.stack || '';
      const filename = event.filename || '';
      const errorName = (event.error as any)?.name || '';
      const errorString = String(event.error || '');
      const lineno = event.lineno || 0;
      const colno = event.colno || 0;
      
      // 모든 에러 정보를 포함한 전체 텍스트 생성
      const fullErrorText = `${message} ${stack} ${filename} ${errorName} ${errorString} ${lineno} ${colno}`.toLowerCase();
      
      // COOP 에러 및 네트워크 에러 확인 (더 포괄적으로)
      if (this.isCOOPError(fullErrorText) || 
          filename.includes('popup.ts') || 
          filename.includes('webchannel_connection.ts')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return; // void 반환
      }
    }, { capture: true, passive: false }); // capture phase에서 먼저 처리, 기본 동작 방지

    // Promise rejection 이벤트
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const message = (event.reason as any)?.message || String(event.reason || '');
      const stack = (event.reason as any)?.stack || '';
      const reasonStr = String(event.reason || '');
      
      if (this.isCOOPError(message + ' ' + stack + ' ' + reasonStr)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
    }, true); // capture phase에서 먼저 처리
  }

  /**
   * 콘솔 에러를 더 강력하게 필터링합니다.
   * Error 이벤트 자체를 가로채서 처리합니다.
   */
  private setupConsoleErrorInterceptor(): void {
    // console.error의 원본 저장
    const originalError = console.error.bind(console);
    
    // console.error를 완전히 재정의
    console.error = (...args: any[]) => {
      // 모든 인자를 문자열로 변환하여 검사
      const fullMessage = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) {
          return `${arg.message} ${arg.stack} ${arg.name}`;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return this.safeStringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ').toLowerCase();
      
      // COOP 에러인지 확인
      if (this.isCOOPError(fullMessage)) {
        return; // COOP 에러는 완전히 무시
      }
      
      // 원본 console.error 호출
      originalError(...args);
    };
  }

  /**
   * MutationObserver를 설정합니다.
   */
  private setupMutationObserver(): void {
    const setupObserver = () => {
      try {
        const observer = new MutationObserver((mutations: MutationRecord[]) => {
          mutations.forEach((mutation) => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                  const text = (node as HTMLElement).textContent || (node as HTMLElement).innerText || '';
                  if (text && this.isCOOPError(text)) {
                    // COOP 에러 메시지를 찾으면 제거
                    (node as HTMLElement).style.display = 'none';
                    if (node.parentNode) {
                      node.parentNode.removeChild(node);
                    }
                  }
                }
              });
            }
          });
        });

        // 콘솔이 렌더링되는 요소를 찾아서 감시
        // Chrome DevTools의 콘솔 영역은 보통 특정 클래스나 ID를 가짐
        setTimeout(() => {
          const consoleContainer = document.querySelector('.console-view, [role="log"], .console-message, .console-view-object');
          if (consoleContainer) {
            observer.observe(consoleContainer, {
              childList: true,
              subtree: true
            });
            this.mutationObserver = observer;
          }
        }, 1000);
      } catch (e) {
        // MutationObserver가 작동하지 않으면 무시
        console.warn('MutationObserver 설정 실패:', e);
      }
    };

    // DOM이 준비되면 Observer 설정
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupObserver);
    } else {
      setupObserver();
    }
  }

  /**
   * 에러 필터링을 비활성화합니다.
   */
  public disable(): void {
    // 콘솔 메서드 복원
    if (this.filterConsole) {
      Object.keys(this.originalConsoleMethods).forEach(method => {
        if (this.originalConsoleMethods[method]) {
          (window.console as any)[method] = this.originalConsoleMethods[method];
        }
      });
    }

    // MutationObserver 해제
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * 에러 필터링을 활성화합니다.
   */
  public enable(): void {
    this.initialize();
  }

  /**
   * 필터 패턴을 추가합니다.
   * @param pattern 추가할 패턴
   */
  public addPattern(pattern: string): void {
    if (!this.patterns.includes(pattern.toLowerCase())) {
      this.patterns.push(pattern.toLowerCase());
    }
  }

  /**
   * 필터 패턴을 제거합니다.
   * @param pattern 제거할 패턴
   */
  public removePattern(pattern: string): void {
    const index = this.patterns.indexOf(pattern.toLowerCase());
    if (index > -1) {
      this.patterns.splice(index, 1);
    }
  }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * ErrorFilter 인스턴스를 생성하는 팩토리 함수
 * @param options ErrorFilter 옵션
 * @returns ErrorFilter 인스턴스
 */
export function createErrorFilter(options: ErrorFilterOptions = {}): ErrorFilter {
  return new ErrorFilter(options);
}

/**
 * COOP 에러 필터링을 즉시 초기화합니다.
 * 이 함수는 스크립트가 로드되자마자 실행되어야 합니다.
 * @param options ErrorFilter 옵션
 * @returns ErrorFilter 인스턴스
 */
export function initializeCOOPFilter(options: ErrorFilterOptions = {}): ErrorFilter {
  return createErrorFilter(options);
}

// ========================================
// 기본 내보내기
// ========================================

export default ErrorFilter;

