/**
 * 토스트 알림 모듈
 *
 * 사용자에게 비차단적인 알림 메시지를 표시합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
export declare enum ToastType {
    SUCCESS = "success",
    ERROR = "error",
    WARNING = "warning",
    INFO = "info"
}
export interface ToastOptions {
    duration?: number;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    closable?: boolean;
}
/**
 * 토스트 메시지를 표시합니다.
 */
export declare function showToast(message: string, type?: ToastType, options?: ToastOptions): void;
/**
 * 모든 토스트 제거
 */
export declare function clearAllToasts(): void;
/**
 * 성공 토스트
 */
export declare function showSuccessToast(message: string, options?: ToastOptions): void;
/**
 * 에러 토스트
 */
export declare function showErrorToast(message: string, options?: ToastOptions): void;
/**
 * 경고 토스트
 */
export declare function showWarningToast(message: string, options?: ToastOptions): void;
/**
 * 정보 토스트
 */
export declare function showInfoToast(message: string, options?: ToastOptions): void;
//# sourceMappingURL=toast.d.ts.map