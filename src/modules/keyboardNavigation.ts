/**
 * 키보드 내비게이션 모듈
 * 
 * 키보드 접근성 향상을 위한 기능들을 제공합니다:
 * - Escape 키로 모달 닫기
 * - Tab 키 포커스 관리
 * - Enter/Space 키로 버튼 활성화
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

import { logger } from './logger.js';

/**
 * 모달 요소 목록 (열려있는 모달들)
 */
const openModals: HTMLElement[] = [];

/**
 * 키보드 내비게이션 초기화
 */
export function initializeKeyboardNavigation(): void {
  // Escape 키 이벤트 리스너 등록
  document.addEventListener('keydown', handleKeyDown);
  
  // 모달 열기/닫기 감지 (MutationObserver 사용)
  observeModalChanges();
  
  logger.debug('키보드 내비게이션 초기화 완료');
}

/**
 * 키보드 이벤트 처리
 */
function handleKeyDown(event: KeyboardEvent): void {
  // Escape 키: 열려있는 모달 닫기
  if (event.key === 'Escape') {
    handleEscapeKey();
    return;
  }
  
  // Ctrl+Z 또는 Cmd+Z: 실행 취소
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault();
    handleUndoKey();
    return;
  }
  
  // Ctrl+Y 또는 Ctrl+Shift+Z (Mac: Cmd+Shift+Z): 다시 실행하기
  if ((event.ctrlKey || event.metaKey) && 
      (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault();
    handleRedoKey();
    return;
  }
  
  // Tab 키: 모달 내부에서만 포커스 유지 (필요시)
  if (event.key === 'Tab') {
    handleTabKey(event);
    return;
  }
  
  // Enter/Space 키: 버튼 활성화 (기본 브라우저 동작 사용)
  // 추가 처리 필요시 여기에 구현
}

/**
 * Escape 키 처리
 */
function handleEscapeKey(): void {
  // 가장 최근에 열린 모달부터 닫기
  if (openModals.length > 0) {
    const lastModal = openModals[openModals.length - 1];
    closeModal(lastModal);
  }
}

/**
 * 실행 취소 키 처리 (Ctrl+Z 또는 Cmd+Z)
 */
function handleUndoKey(): void {
  // 전역 undo 함수 호출
  const undoFunction = (window as any).handleUndo;
  if (undoFunction && typeof undoFunction === 'function') {
    undoFunction();
  } else {
    logger.debug('실행 취소 함수를 찾을 수 없습니다.');
  }
}

/**
 * 다시 실행하기 키 처리 (Ctrl+Y 또는 Ctrl+Shift+Z / Cmd+Shift+Z)
 */
function handleRedoKey(): void {
  // 전역 redo 함수 호출
  const redoFunction = (window as any).handleRedo;
  if (redoFunction && typeof redoFunction === 'function') {
    redoFunction();
  } else {
    logger.debug('다시 실행하기 함수를 찾을 수 없습니다.');
  }
}

/**
 * Tab 키 처리 (모달 내부에서 포커스 트랩)
 */
function handleTabKey(event: KeyboardEvent): void {
  // 모달이 열려있지 않으면 기본 동작
  if (openModals.length === 0) {
    return;
  }
  
  const currentModal = openModals[openModals.length - 1];
  if (!currentModal) {
    return;
  }
  
  // 모달 내부의 포커스 가능한 요소들
  const focusableElements = getFocusableElements(currentModal);
  if (focusableElements.length === 0) {
    return;
  }
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Shift+Tab: 마지막 요소에서 첫 번째 요소로
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab: 마지막 요소에서 첫 번째 요소로
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

/**
 * 모달 내부의 포커스 가능한 요소들을 반환
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  
  // 화면에 보이는 요소만 필터링
  return elements.filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * 모달 열기
 */
export function openModal(modalElement: HTMLElement): void {
  if (!modalElement || openModals.includes(modalElement)) {
    return;
  }
  
  openModals.push(modalElement);
  
  // 모달이 열리면 첫 번째 포커스 가능한 요소에 포커스
  const focusableElements = getFocusableElements(modalElement);
  if (focusableElements.length > 0) {
    // requestAnimationFrame으로 포커스 (애니메이션 고려)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
      focusableElements[0].focus();
      });
    });
  }
  
  // 모달 외부 콘텐츠 숨기기 (body 대신 main, header, aside 등에 aria-hidden 적용)
  // body에 aria-hidden을 설정하면 전체 페이지가 숨겨져 접근성 문제 발생
  const mainContent = document.querySelector('main');
  const header = document.querySelector('header');
  const aside = document.querySelector('aside');
  
  if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
  if (header) header.setAttribute('aria-hidden', 'true');
  if (aside) aside.setAttribute('aria-hidden', 'true');
  
  // 모달은 접근 가능하게 설정
  modalElement.setAttribute('aria-hidden', 'false');
}

/**
 * 모달 닫기
 */
export function closeModal(modalElement: HTMLElement): void {
  const index = openModals.indexOf(modalElement);
  if (index === -1) {
    return;
  }
  
  openModals.splice(index, 1);
  
  // aria-hidden 설정
  modalElement.setAttribute('aria-hidden', 'true');
  
  if (openModals.length === 0) {
    // 모든 모달이 닫히면 콘텐츠 영역의 aria-hidden 제거
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    const aside = document.querySelector('aside');
    
    if (mainContent) mainContent.removeAttribute('aria-hidden');
    if (header) header.removeAttribute('aria-hidden');
    if (aside) aside.removeAttribute('aria-hidden');
  }
  
  // 모달을 닫는 함수 호출 (글로벌 함수 확인)
  const closeFunction = (window as any).closeHelpPopup || 
                       (window as any).closeModal;
  
  if (closeFunction && typeof closeFunction === 'function') {
    closeFunction();
  } else {
    // 직접 닫기 (hidden 클래스 추가)
    modalElement.classList.add('hidden');
  }
}

/**
 * 모달 변경 감지 (MutationObserver)
 */
function observeModalChanges(): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          
          // 모달이 열렸는지 확인 (aria-modal="true" 또는 특정 클래스)
          if (element.hasAttribute('aria-modal') || 
              element.classList.contains('modal-box') ||
              element.querySelector('[aria-modal="true"]')) {
            const modal = element.hasAttribute('aria-modal') 
              ? element 
              : element.querySelector('[aria-modal="true"]') as HTMLElement;
            
            if (modal && !modal.classList.contains('hidden')) {
              openModal(modal);
            }
          }
        }
      });
      
      mutation.removedNodes.forEach((node) => {
        // 노드 제거 시 처리 (필요시)
      });
      
      // 클래스 변경 감지
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement;
        
        if (target.hasAttribute('aria-modal')) {
          if (target.classList.contains('hidden')) {
            closeModal(target);
          } else {
            openModal(target);
          }
        }
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'aria-modal']
  });
}

/**
 * 정리 함수
 */
export function cleanupKeyboardNavigation(): void {
  document.removeEventListener('keydown', handleKeyDown);
  openModals.length = 0;
  logger.debug('키보드 내비게이션 정리 완료');
}

