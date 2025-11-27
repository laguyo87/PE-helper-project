/**
 * 유틸리티 함수 모듈
 * 
 * 이 모듈은 앱 전반에서 사용되는 공통 유틸리티 함수들을 제공합니다.
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

import { APP_VERSION } from './versionManager.js';
import DOMPurify from 'dompurify';
import { logWarn } from './logger.js';

// ========================================
// 타입 정의
// ========================================

/**
 * DOM 쿼리 선택자 함수 타입
 */
export type DOMSelector = (selector: string) => HTMLElement | null;

/**
 * DOM 쿼리 전체 선택 함수 타입
 */
export type DOMSelectorAll = (selector: string) => NodeListOf<HTMLElement>;

// 타입 임포트 (순환 참조 방지를 위해 타입만)
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
    selectedClassId: number | null;  // LeagueData는 number 사용
  };
  tournaments: {
    tournaments: Tournament[];
    activeTournamentId: string | null;  // TournamentData는 string 사용 (Tournament.id가 string)
  };
  paps: {
    classes: PapsClass[];
    activeClassId: number | null;  // PapsData는 number 사용
  };
  progress: {
    classes: ProgressClass[];
    selectedClassId: string | null;  // ProgressData는 string 사용
  };
}

// ========================================
// DOM 헬퍼 함수
// ========================================

/**
 * DOM 요소를 선택하는 헬퍼 함수
 * @param selector CSS 선택자
 * @returns HTMLElement 또는 null
 */
export function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

/**
 * DOM 요소들을 모두 선택하는 헬퍼 함수
 * @param selector CSS 선택자
 * @returns NodeListOf<HTMLElement>
 */
export function $$(selector: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(selector);
}

/**
 * ID로 DOM 요소를 안전하게 가져옵니다.
 * @param id 요소 ID
 * @param throwIfNotFound 요소를 찾지 못했을 때 에러를 던질지 여부 (기본값: false)
 * @returns HTMLElement 또는 null
 * @throws 요소를 찾지 못하고 throwIfNotFound가 true인 경우
 */
export function getElement(id: string, throwIfNotFound: boolean = false): HTMLElement | null {
  const element = document.getElementById(id);
  if (!element && throwIfNotFound) {
    throw new Error(`요소를 찾을 수 없습니다: #${id}`);
  }
  return element;
}

/**
 * CSS 선택자로 DOM 요소를 안전하게 가져옵니다.
 * @param selector CSS 선택자
 * @param throwIfNotFound 요소를 찾지 못했을 때 에러를 던질지 여부 (기본값: false)
 * @returns HTMLElement 또는 null
 * @throws 요소를 찾지 못하고 throwIfNotFound가 true인 경우
 */
export function getElementBySelector(selector: string, throwIfNotFound: boolean = false): HTMLElement | null {
  const element = document.querySelector(selector) as HTMLElement | null;
  if (!element && throwIfNotFound) {
    throw new Error(`요소를 찾을 수 없습니다: ${selector}`);
  }
  return element;
}

/**
 * CSS 선택자로 여러 DOM 요소를 안전하게 가져옵니다.
 * @param selector CSS 선택자
 * @returns HTMLElement 배열
 */
export function getElements(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
}

/**
 * 부모 요소 내에서 CSS 선택자로 DOM 요소를 안전하게 가져옵니다.
 * @param parent 부모 요소
 * @param selector CSS 선택자
 * @param throwIfNotFound 요소를 찾지 못했을 때 에러를 던질지 여부 (기본값: false)
 * @returns HTMLElement 또는 null
 * @throws 요소를 찾지 못하고 throwIfNotFound가 true인 경우
 */
export function getElementInParent(
  parent: HTMLElement,
  selector: string,
  throwIfNotFound: boolean = false
): HTMLElement | null {
  const element = parent.querySelector(selector) as HTMLElement | null;
  if (!element && throwIfNotFound) {
    throw new Error(`부모 요소 내에서 요소를 찾을 수 없습니다: ${selector}`);
  }
  return element;
}

/**
 * 부모 요소 내에서 CSS 선택자로 여러 DOM 요소를 안전하게 가져옵니다.
 * @param parent 부모 요소
 * @param selector CSS 선택자
 * @returns HTMLElement 배열
 */
export function getElementsInParent(parent: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(parent.querySelectorAll(selector)) as HTMLElement[];
}

// ========================================
// XSS 방지 유틸리티
// ========================================

/**
 * HTML 문자열을 안전하게 정제합니다 (XSS 방지)
 * @param html 정제할 HTML 문자열
 * @returns 정제된 안전한 HTML 문자열
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 DOMPurify를 사용할 수 없음
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  // 전역 DOMPurify 사용 (CDN에서 로드)
  interface WindowWithDOMPurify {
    DOMPurify?: typeof DOMPurify;
  }
  const windowWithDOMPurify = window as unknown as WindowWithDOMPurify;
  const purify = windowWithDOMPurify.DOMPurify || (typeof DOMPurify !== 'undefined' ? DOMPurify : null);
  
  if (!purify) {
    // DOMPurify가 없으면 기본 정제만 수행
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'br', 'strong', 'em', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'ul', 'ol', 'li',
      'a', 'button', 'input', 'select', 'option', 'textarea',
      'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
      'form', 'label',
      'img', 'canvas',
      'style'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'data-*',
      'href', 'target', 'rel',
      'type', 'value', 'placeholder', 'required', 'disabled', 'checked', 'selected',
      'onclick', 'onchange', 'oninput', 'onsubmit', 'onfocus', 'onblur',
      'width', 'height', 'viewBox', 'stroke', 'fill', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'd', 'x', 'y', 'cx', 'cy', 'r', 'points', 'x1', 'y1', 'x2', 'y2',
      'xmlns'
    ],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true
  });
}

/**
 * 안전하게 innerHTML을 설정합니다
 * @param element HTML 요소
 * @param html 설정할 HTML 문자열
 */
export function setInnerHTMLSafe(element: HTMLElement, html: string): void {
  element.innerHTML = sanitizeHTML(html);
}

// ========================================
// 사이드바 유틸리티
// ========================================

/**
 * 사이드바 리스트 컨테이너를 정리합니다.
 * @param selectorFn DOM 선택자 함수 (선택적)
 */
export function cleanupSidebar(selectorFn?: DOMSelector): void {
  const $fn = selectorFn || $;
  const el = $fn('#sidebar-list-container');
  if (el) {
    el.innerHTML = '';
  }
}

// ========================================
// 버전 관리 유틸리티
// ========================================

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
export function waitForDOMUpdate(frames: number = 2): Promise<void> {
  return new Promise<void>((resolve) => {
    let frameCount = 0;
    const tick = () => {
      frameCount++;
      if (frameCount >= frames) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

/**
 * 특정 요소가 DOM에 나타날 때까지 대기하는 Promise를 반환합니다.
 * MutationObserver와 requestAnimationFrame을 조합하여 사용합니다.
 * 
 * @param selector CSS 선택자
 * @param timeout 최대 대기 시간 (밀리초, 기본값: 5000)
 * @returns Promise<HTMLElement | null>
 */
export function waitForElement(selector: string, timeout: number = 5000): Promise<HTMLElement | null> {
  return new Promise<HTMLElement | null>((resolve) => {
    // 즉시 확인
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) {
      resolve(element);
      return;
    }

    const startTime = Date.now();
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        observer.disconnect();
        resolve(el);
        return;
      }

      if (Date.now() - startTime > timeout) {
        observer.disconnect();
        resolve(null);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 타임아웃 처리
    setTimeout(() => {
      observer.disconnect();
      const el = document.querySelector(selector) as HTMLElement | null;
      resolve(el);
    }, timeout);
  });
}

export function checkVersion(): void {
  const stored = localStorage.getItem('pe_helper_version');
  
  // 항상 캐시 무효화를 위한 타임스탬프 업데이트 (최신 버전 보장)
  localStorage.setItem('cache_buster', Date.now().toString());
  
  if (stored !== APP_VERSION) {
    localStorage.setItem('pe_helper_version', APP_VERSION);
    
    // 버전이 변경되었으면 자동으로 새로고침하여 최신 버전 사용
    // 알림 없이 바로 새로고침하여 항상 최신 버전을 사용하도록 함
    if (stored) {
      setTimeout(() => {
        // 캐시를 완전히 무시하고 새로고침 (쿼리 파라미터 추가)
        const timestamp = Date.now().toString();
        const url = new URL(window.location.href);
        url.searchParams.set('_t', timestamp);
        window.location.href = url.toString();
      }, 100);
    }
  }
}

// ========================================
// 데이터 유틸리티
// ========================================

/**
 * 기본 앱 데이터를 반환합니다.
 * @returns 기본 앱 데이터
 */
export function getDefaultData(): DefaultAppData {
  return {
    leagues: {
      classes: [],
      students: [],
      games: [],
      selectedClassId: null as number | null
    },
    tournaments: {
      tournaments: [],
      activeTournamentId: null as string | null
    },
    paps: {
      classes: [],
      activeClassId: null as number | null
    },
    progress: {
      classes: [],
      selectedClassId: null as string | null
    }
  };
}

// ========================================
// 데이터 검증 및 저장 헬퍼 함수
// ========================================

/**
 * 데이터를 검증하고 저장하는 공통 패턴을 처리합니다.
 * @param data 검증할 데이터
 * @param schema Zod 스키마
 * @param saveCallback 저장 콜백 함수
 * @param onSuccess 성공 시 콜백 함수 (선택적)
 * @param onError 에러 시 콜백 함수 (선택적)
 * @returns 검증 및 저장 성공 여부
 */
export async function validateAndSave<T>(
  data: unknown,
  schema: any, // Zod 스키마 타입 (순환 참조 방지)
  saveCallback: (validatedData: T) => Promise<void> | void,
  onSuccess?: () => void,
  onError?: (errors: string[]) => void
): Promise<boolean> {
  try {
    const { validateData } = await import('./validators.js');
    const result = validateData<T>(schema, data);
    
    if (!result.success) {
      const errors = result.formattedErrors || ['데이터 검증에 실패했습니다.'];
      if (onError) {
        onError(errors);
      }
      return false;
    }
    
    if (result.success && result.data !== undefined) {
      const validatedData: T = result.data;
      await saveCallback(validatedData);
      if (onSuccess) {
        onSuccess();
      }
      return true;
    }
    
    return false;
  } catch (error) {
    if (onError) {
      onError([error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.']);
    }
    return false;
  }
}

/**
 * 로컬 스토리지에 안전하게 데이터를 저장합니다.
 * @param key 저장할 키
 * @param data 저장할 데이터
 * @returns 저장 성공 여부
 */
export function saveToLocalStorage(key: string, data: unknown): boolean {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
    return true;
  } catch (error) {
    logWarn(`로컬 스토리지 저장 실패 (${key}):`, error);
    return false;
  }
}

/**
 * 로컬 스토리지에서 안전하게 데이터를 로드합니다.
 * @param key 로드할 키
 * @param defaultValue 데이터가 없거나 파싱 실패 시 반환할 기본값
 * @returns 로드된 데이터 또는 기본값
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const json = localStorage.getItem(key);
    if (json === null) {
      return defaultValue;
    }
    const parsed = JSON.parse(json);
    // 파싱된 데이터가 기본값과 호환되는지 확인
    return (parsed as T) ?? defaultValue;
  } catch (error) {
    logWarn(`로컬 스토리지 읽기 실패 (${key}):`, error);
    return defaultValue;
  }
}

// ========================================
// 기본 내보내기
// ========================================

export default {
  $,
  $$,
  cleanupSidebar,
  checkVersion,
  getDefaultData,
  sanitizeHTML,
  setInnerHTMLSafe,
  getElement,
  getElementBySelector,
  getElements,
  getElementInParent,
  getElementsInParent,
  validateAndSave,
  saveToLocalStorage,
  loadFromLocalStorage
};

