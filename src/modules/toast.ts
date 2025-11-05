/**
 * 토스트 알림 모듈
 * 
 * 사용자에게 비차단적인 알림 메시지를 표시합니다.
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface ToastOptions {
  duration?: number; // 표시 시간 (ms), 0이면 수동으로 닫아야 함
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  closable?: boolean; // 닫기 버튼 표시 여부
}

/**
 * 토스트 컨테이너 생성
 */
function ensureToastContainer(position: ToastOptions['position'] = 'top-right'): HTMLElement {
  const containerId = `toast-container-${position}`;
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = `toast-container toast-${position}`;
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * 토스트 메시지를 표시합니다.
 */
export function showToast(
  message: string,
  type: ToastType = ToastType.INFO,
  options: ToastOptions = {}
): void {
  const {
    duration = 3000,
    position = 'top-right',
    closable = true
  } = options;

  const container = ensureToastContainer(position);
  
  // 토스트 요소 생성
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', type === ToastType.ERROR ? 'assertive' : 'polite');
  
  // 아이콘 (SVG)
  const iconMap: Record<ToastType, string> = {
    [ToastType.SUCCESS]: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    [ToastType.ERROR]: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    [ToastType.WARNING]: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    [ToastType.INFO]: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };
  
  // 메시지 내용 구성
  const messageDiv = document.createElement('div');
  messageDiv.className = 'toast-message';
  messageDiv.innerHTML = `
    <div class="toast-icon">${iconMap[type]}</div>
    <div class="toast-content">${escapeHtml(message)}</div>
    ${closable ? '<button class="toast-close" aria-label="닫기" onclick="this.closest(\'.toast\').remove()">×</button>' : ''}
  `;
  
  toast.appendChild(messageDiv);
  container.appendChild(toast);
  
  // 애니메이션: 나타남
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });
  
  // 자동 닫기
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
}

/**
 * 토스트 제거 (애니메이션 포함)
 */
function removeToast(toast: HTMLElement): void {
  toast.classList.remove('toast-show');
  toast.classList.add('toast-hide');
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300); // 애니메이션 시간과 맞춤
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 모든 토스트 제거
 */
export function clearAllToasts(): void {
  const containers = document.querySelectorAll('.toast-container');
  containers.forEach(container => {
    container.innerHTML = '';
  });
}

/**
 * 성공 토스트
 */
export function showSuccessToast(message: string, options?: ToastOptions): void {
  showToast(message, ToastType.SUCCESS, options);
}

/**
 * 에러 토스트
 */
export function showErrorToast(message: string, options?: ToastOptions): void {
  showToast(message, ToastType.ERROR, { ...options, duration: options?.duration ?? 5000 });
}

/**
 * 경고 토스트
 */
export function showWarningToast(message: string, options?: ToastOptions): void {
  showToast(message, ToastType.WARNING, { ...options, duration: options?.duration ?? 4000 });
}

/**
 * 정보 토스트
 */
export function showInfoToast(message: string, options?: ToastOptions): void {
  showToast(message, ToastType.INFO, options);
}

