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
export declare enum ErrorType {
    VALIDATION = "VALIDATION",
    NETWORK = "NETWORK",
    PERMISSION = "PERMISSION",
    NOT_FOUND = "NOT_FOUND",
    UNKNOWN = "UNKNOWN"
}
export interface AppError {
    type: ErrorType;
    message: string;
    originalError?: Error | z.ZodError;
    details?: string[];
}
export declare class ErrorHandler {
    /**
     * 에러를 분석하여 AppError로 변환합니다.
     */
    static parseError(error: unknown): AppError;
    /**
     * 에러를 사용자 친화적인 메시지로 변환합니다.
     */
    static formatError(error: unknown): string;
    /**
     * 에러를 상세 정보와 함께 포맷팅합니다.
     */
    static formatErrorDetailed(error: unknown): AppError;
}
/**
 * 사용자에게 에러 메시지를 표시합니다.
 */
export declare function showError(error: unknown, elementId?: string): void;
/**
 * 사용자에게 성공 메시지를 표시합니다.
 */
export declare function showSuccess(message: string, elementId?: string): void;
/**
 * 사용자에게 경고 메시지를 표시합니다.
 */
export declare function showWarning(message: string, elementId?: string): void;
/**
 * 동기 함수를 안전하게 실행하고 에러를 처리합니다.
 * @param fn 실행할 함수
 * @param errorMessage 에러 발생 시 표시할 커스텀 메시지 (선택적)
 * @param elementId 에러 메시지를 표시할 요소 ID (선택적)
 * @returns 함수 실행 결과 또는 undefined (에러 발생 시)
 */
export declare function safeExecute<T>(fn: () => T, errorMessage?: string, elementId?: string): T | undefined;
/**
 * 비동기 함수를 안전하게 실행하고 에러를 처리합니다.
 * @param fn 실행할 비동기 함수
 * @param errorMessage 에러 발생 시 표시할 커스텀 메시지 (선택적)
 * @param elementId 에러 메시지를 표시할 요소 ID (선택적)
 * @returns 함수 실행 결과 또는 undefined (에러 발생 시)
 */
export declare function safeAsyncExecute<T>(fn: () => Promise<T>, errorMessage?: string, elementId?: string): Promise<T | undefined>;
/**
 * 에러를 무시하고 함수를 실행합니다 (에러 발생 시 기본값 반환).
 * @param fn 실행할 함수
 * @param defaultValue 에러 발생 시 반환할 기본값
 * @returns 함수 실행 결과 또는 기본값
 */
export declare function safeExecuteWithDefault<T>(fn: () => T, defaultValue: T): T;
/**
 * 비동기 함수를 에러를 무시하고 실행합니다 (에러 발생 시 기본값 반환).
 * @param fn 실행할 비동기 함수
 * @param defaultValue 에러 발생 시 반환할 기본값
 * @returns 함수 실행 결과 또는 기본값
 */
export declare function safeAsyncExecuteWithDefault<T>(fn: () => Promise<T>, defaultValue: T): Promise<T>;
//# sourceMappingURL=errorHandler.d.ts.map