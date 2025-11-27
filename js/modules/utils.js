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
// ========================================
// DOM 헬퍼 함수
// ========================================
/**
 * DOM 요소를 선택하는 헬퍼 함수
 * @param selector CSS 선택자
 * @returns HTMLElement 또는 null
 */
export function $(selector) {
    return document.querySelector(selector);
}
/**
 * DOM 요소들을 모두 선택하는 헬퍼 함수
 * @param selector CSS 선택자
 * @returns NodeListOf<HTMLElement>
 */
export function $$(selector) {
    return document.querySelectorAll(selector);
}
// ========================================
// XSS 방지 유틸리티
// ========================================
/**
 * HTML 문자열을 안전하게 정제합니다 (XSS 방지)
 * @param html 정제할 HTML 문자열
 * @returns 정제된 안전한 HTML 문자열
 */
export function sanitizeHTML(html) {
    if (typeof window === 'undefined') {
        // 서버 사이드에서는 DOMPurify를 사용할 수 없음
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    const windowWithDOMPurify = window;
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
export function setInnerHTMLSafe(element, html) {
    element.innerHTML = sanitizeHTML(html);
}
// ========================================
// 사이드바 유틸리티
// ========================================
/**
 * 사이드바 리스트 컨테이너를 정리합니다.
 * @param selectorFn DOM 선택자 함수 (선택적)
 */
export function cleanupSidebar(selectorFn) {
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
export function waitForDOMUpdate(frames = 2) {
    return new Promise((resolve) => {
        let frameCount = 0;
        const tick = () => {
            frameCount++;
            if (frameCount >= frames) {
                resolve();
            }
            else {
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
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
        // 즉시 확인
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        const startTime = Date.now();
        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
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
            const el = document.querySelector(selector);
            resolve(el);
        }, timeout);
    });
}
export function checkVersion() {
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
export function getDefaultData() {
    return {
        leagues: {
            classes: [],
            students: [],
            games: [],
            selectedClassId: null
        },
        tournaments: {
            tournaments: [],
            activeTournamentId: null
        },
        paps: {
            classes: [],
            activeClassId: null
        },
        progress: {
            classes: [],
            selectedClassId: null
        }
    };
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
    setInnerHTMLSafe
};
//# sourceMappingURL=utils.js.map