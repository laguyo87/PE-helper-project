/**
 * Sentry 에러 리포팅 모듈
 *
 * 프로덕션 환경에서 발생하는 에러를 추적하고 리포팅합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import * as Sentry from '@sentry/browser';
export interface SentryConfig {
    dsn?: string;
    environment?: 'development' | 'production' | 'staging';
    enabled?: boolean;
    tracesSampleRate?: number;
    beforeSend?: (event: Sentry.ErrorEvent, hint: Sentry.EventHint) => Sentry.ErrorEvent | null;
}
export interface UserContext {
    id?: string;
    email?: string;
    username?: string;
}
/**
 * Sentry를 초기화합니다.
 *
 * @param config Sentry 설정
 */
export declare function initSentry(config?: SentryConfig): void;
/**
 * 사용자 컨텍스트를 설정합니다.
 *
 * @param user 사용자 정보
 */
export declare function setUser(user: UserContext | null): void;
/**
 * 에러를 Sentry에 보고합니다.
 *
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export declare function captureException(error: Error | unknown, context?: Record<string, any>): void;
/**
 * 메시지를 Sentry에 보고합니다.
 *
 * @param message 메시지
 * @param level 로그 레벨
 * @param context 추가 컨텍스트 정보
 */
export declare function captureMessage(message: string, level?: Sentry.SeverityLevel, context?: Record<string, any>): void;
/**
 * 추가 컨텍스트 정보를 설정합니다.
 *
 * @param key 컨텍스트 키
 * @param data 컨텍스트 데이터
 */
export declare function setContext(key: string, data: Record<string, any>): void;
/**
 * 태그를 설정합니다.
 *
 * @param key 태그 키
 * @param value 태그 값
 */
export declare function setTag(key: string, value: string): void;
/**
 * Sentry가 초기화되었는지 확인합니다.
 */
export declare function isSentryInitialized(): boolean;
//# sourceMappingURL=sentry.d.ts.map