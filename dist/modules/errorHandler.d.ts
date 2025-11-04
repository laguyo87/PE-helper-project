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
//# sourceMappingURL=errorHandler.d.ts.map