/**
 * 에러 처리 모듈
 *
 * 에러를 사용자 친화적인 메시지로 변환하고 표시합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { z } from 'zod';
import { formatValidationErrors } from './validators.js';
import { showSuccessToast, showErrorToast, showWarningToast } from './toast.js';
import { captureException } from './sentry.js';
// ========================================
// 에러 타입 정의
// ========================================
export var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "VALIDATION";
    ErrorType["NETWORK"] = "NETWORK";
    ErrorType["PERMISSION"] = "PERMISSION";
    ErrorType["NOT_FOUND"] = "NOT_FOUND";
    ErrorType["UNKNOWN"] = "UNKNOWN";
})(ErrorType || (ErrorType = {}));
// ========================================
// 에러 메시지 매핑
// ========================================
const ERROR_MESSAGES = {
    // 네트워크 에러
    'network-error': '네트워크 연결을 확인해주세요.',
    'timeout': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    'offline': '인터넷 연결이 끊어졌습니다.',
    // 권한 에러
    'permission-denied': '권한이 없습니다. 로그인을 확인해주세요.',
    'unauthenticated': '인증이 필요합니다. 다시 로그인해주세요.',
    // 데이터 에러
    'not-found': '요청한 데이터를 찾을 수 없습니다.',
    'invalid-data': '데이터 형식이 올바르지 않습니다.',
    'save-failed': '저장에 실패했습니다. 다시 시도해주세요.',
    'load-failed': '데이터를 불러오는데 실패했습니다.',
    // 일반 에러
    'unknown-error': '예상치 못한 오류가 발생했습니다.',
    'operation-failed': '작업을 완료할 수 없습니다.'
};
// ========================================
// 에러 처리 클래스
// ========================================
export class ErrorHandler {
    /**
     * 에러를 분석하여 AppError로 변환합니다.
     */
    static parseError(error) {
        // Zod 검증 에러
        if (error instanceof z.ZodError) {
            const formattedErrors = formatValidationErrors(error);
            return {
                type: ErrorType.VALIDATION,
                message: '입력한 데이터 형식이 올바르지 않습니다.',
                originalError: error,
                details: formattedErrors
            };
        }
        // 일반 Error 객체
        if (error instanceof Error) {
            // Firebase 에러 코드 확인
            const firebaseError = error;
            if (firebaseError.code) {
                const errorCode = firebaseError.code.replace('auth/', '').replace('firestore/', '');
                if (errorCode === 'permission-denied' || errorCode === 'unauthenticated') {
                    return {
                        type: ErrorType.PERMISSION,
                        message: ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['permission-denied'],
                        originalError: error
                    };
                }
                if (errorCode === 'not-found') {
                    return {
                        type: ErrorType.NOT_FOUND,
                        message: ERROR_MESSAGES['not-found'],
                        originalError: error
                    };
                }
            }
            // 네트워크 에러 확인
            if (error.message.includes('network') || error.message.includes('Network')) {
                return {
                    type: ErrorType.NETWORK,
                    message: ERROR_MESSAGES['network-error'],
                    originalError: error
                };
            }
            if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                return {
                    type: ErrorType.NETWORK,
                    message: ERROR_MESSAGES['timeout'],
                    originalError: error
                };
            }
        }
        // 알 수 없는 에러
        return {
            type: ErrorType.UNKNOWN,
            message: ERROR_MESSAGES['unknown-error'],
            originalError: error instanceof Error ? error : new Error(String(error))
        };
    }
    /**
     * 에러를 사용자 친화적인 메시지로 변환합니다.
     */
    static formatError(error) {
        const appError = this.parseError(error);
        return appError.message;
    }
    /**
     * 에러를 상세 정보와 함께 포맷팅합니다.
     */
    static formatErrorDetailed(error) {
        return this.parseError(error);
    }
}
// ========================================
// 알림 표시 유틸리티
// ========================================
/**
 * 사용자에게 에러 메시지를 표시합니다.
 */
export function showError(error, elementId) {
    const appError = ErrorHandler.parseError(error);
    const message = appError.message;
    // 상세 정보가 있으면 함께 표시
    const fullMessage = appError.details
        ? `${message}\n\n상세:\n${appError.details.join('\n')}`
        : message;
    // 특정 요소에 표시할 경우
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
            element.classList.add('error-message');
            return;
        }
    }
    // 토스트 알림으로 표시
    showErrorToast(fullMessage);
    // 콘솔에도 로깅 (개발 환경)
    console.error('에러 발생:', appError);
    if (appError.originalError) {
        console.error('원본 에러:', appError.originalError);
    }
    // Sentry에 에러 리포팅 (검증 에러는 제외)
    if (appError.type !== ErrorType.VALIDATION && appError.originalError) {
        captureException(appError.originalError, {
            errorInfo: {
                type: appError.type,
                message: appError.message,
                details: appError.details
            }
        });
    }
}
/**
 * 사용자에게 성공 메시지를 표시합니다.
 */
export function showSuccess(message, elementId) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden', 'error-message');
            element.classList.add('success-message');
            // 3초 후 자동 숨김
            setTimeout(() => {
                element.classList.add('hidden');
            }, 3000);
            return;
        }
    }
    // 토스트 알림으로 표시
    showSuccessToast(message);
}
/**
 * 사용자에게 경고 메시지를 표시합니다.
 */
export function showWarning(message, elementId) {
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden', 'error-message', 'success-message');
            element.classList.add('warning-message');
            // 5초 후 자동 숨김
            setTimeout(() => {
                element.classList.add('hidden');
            }, 5000);
            return;
        }
    }
    // 토스트 알림으로 표시
    showWarningToast(message);
}
// ========================================
// 공통 에러 처리 래퍼 함수
// ========================================
/**
 * 동기 함수를 안전하게 실행하고 에러를 처리합니다.
 * @param fn 실행할 함수
 * @param errorMessage 에러 발생 시 표시할 커스텀 메시지 (선택적)
 * @param elementId 에러 메시지를 표시할 요소 ID (선택적)
 * @returns 함수 실행 결과 또는 undefined (에러 발생 시)
 */
export function safeExecute(fn, errorMessage, elementId) {
    try {
        return fn();
    }
    catch (error) {
        if (errorMessage) {
            showError(new Error(errorMessage), elementId);
        }
        else {
            showError(error, elementId);
        }
        return undefined;
    }
}
/**
 * 비동기 함수를 안전하게 실행하고 에러를 처리합니다.
 * @param fn 실행할 비동기 함수
 * @param errorMessage 에러 발생 시 표시할 커스텀 메시지 (선택적)
 * @param elementId 에러 메시지를 표시할 요소 ID (선택적)
 * @returns 함수 실행 결과 또는 undefined (에러 발생 시)
 */
export async function safeAsyncExecute(fn, errorMessage, elementId) {
    try {
        return await fn();
    }
    catch (error) {
        if (errorMessage) {
            showError(new Error(errorMessage), elementId);
        }
        else {
            showError(error, elementId);
        }
        return undefined;
    }
}
/**
 * 에러를 무시하고 함수를 실행합니다 (에러 발생 시 기본값 반환).
 * @param fn 실행할 함수
 * @param defaultValue 에러 발생 시 반환할 기본값
 * @returns 함수 실행 결과 또는 기본값
 */
export function safeExecuteWithDefault(fn, defaultValue) {
    try {
        return fn();
    }
    catch (error) {
        // 에러는 로깅만 하고 사용자에게 표시하지 않음
        if (error instanceof Error) {
            console.warn('함수 실행 중 에러 발생 (무시됨):', error.message);
        }
        return defaultValue;
    }
}
/**
 * 비동기 함수를 에러를 무시하고 실행합니다 (에러 발생 시 기본값 반환).
 * @param fn 실행할 비동기 함수
 * @param defaultValue 에러 발생 시 반환할 기본값
 * @returns 함수 실행 결과 또는 기본값
 */
export async function safeAsyncExecuteWithDefault(fn, defaultValue) {
    try {
        return await fn();
    }
    catch (error) {
        // 에러는 로깅만 하고 사용자에게 표시하지 않음
        if (error instanceof Error) {
            console.warn('비동기 함수 실행 중 에러 발생 (무시됨):', error.message);
        }
        return defaultValue;
    }
}
//# sourceMappingURL=errorHandler.js.map