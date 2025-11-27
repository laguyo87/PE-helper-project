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
import { logger, logWarn, logError } from './logger.js';

// ========================================
// 타입 정의
// ========================================

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

// ========================================
// Sentry 초기화
// ========================================

let isInitialized = false;

/**
 * Sentry를 초기화합니다.
 * 
 * @param config Sentry 설정
 */
export function initSentry(config: SentryConfig = {}): void {
  // 이미 초기화된 경우 스킵
  if (isInitialized) {
    logWarn('[Sentry] 이미 초기화되었습니다.');
    return;
  }

  // DSN이 없거나 비활성화된 경우 초기화하지 않음
  if (!config.dsn || !config.enabled) {
    logger.debug('[Sentry] DSN이 없거나 비활성화되어 초기화를 건너뜁니다.');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment || 'development',
      tracesSampleRate: config.tracesSampleRate ?? (config.environment === 'production' ? 0.1 : 1.0),
      beforeSend: (event, hint) => {
        // COOP 에러 필터링 (이미 ErrorFilter에서 처리)
        if (hint.originalException) {
          const errorMessage = hint.originalException.toString();
          if (
            errorMessage.includes('Cross-Origin-Opener-Policy') ||
            errorMessage.includes('COOP') ||
            errorMessage.includes('message port closed')
          ) {
            return null; // 이벤트 전송하지 않음
          }
        }

        // 사용자 정의 beforeSend 함수가 있으면 실행
        if (config.beforeSend) {
          const result = config.beforeSend(event, hint);
          return result;
        }

        return event;
      },
      ignoreErrors: [
        // 브라우저 확장 프로그램 에러
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        'fb_xd_fragment',
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        'conduitPage',
        // 네트워크 에러 (일시적)
        'NetworkError',
        'Network request failed',
        // COOP 에러 (이미 필터링)
        'Cross-Origin-Opener-Policy',
        'message port closed'
      ]
    });

    isInitialized = true;
    logger.debug('[Sentry] 초기화 완료:', config.environment || 'development');
  } catch (error) {
    logError('[Sentry] 초기화 실패:', error);
  }
}

/**
 * 사용자 컨텍스트를 설정합니다.
 * 
 * @param user 사용자 정보
 */
export function setUser(user: UserContext | null): void {
  if (!isInitialized) return;

  try {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username || user.email
      });
      logger.debug('[Sentry] 사용자 컨텍스트 설정:', user.email || user.id);
    } else {
      Sentry.setUser(null);
      logger.debug('[Sentry] 사용자 컨텍스트 초기화');
    }
  } catch (error) {
    logError('[Sentry] 사용자 컨텍스트 설정 실패:', error);
  }
}

/**
 * 에러를 Sentry에 보고합니다.
 * 
 * @param error 에러 객체
 * @param context 추가 컨텍스트 정보
 */
export function captureException(error: Error | unknown, context?: Record<string, any>): void {
  if (!isInitialized) return;

  try {
    if (context) {
      Sentry.withScope((scope) => {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  } catch (err) {
    logError('[Sentry] 에러 리포팅 실패:', err);
  }
}

/**
 * 메시지를 Sentry에 보고합니다.
 * 
 * @param message 메시지
 * @param level 로그 레벨
 * @param context 추가 컨텍스트 정보
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): void {
  if (!isInitialized) return;

  try {
    if (context) {
      Sentry.withScope((scope) => {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key]);
        });
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  } catch (error) {
    logError('[Sentry] 메시지 리포팅 실패:', error);
  }
}

/**
 * 추가 컨텍스트 정보를 설정합니다.
 * 
 * @param key 컨텍스트 키
 * @param data 컨텍스트 데이터
 */
export function setContext(key: string, data: Record<string, any>): void {
  if (!isInitialized) return;

  try {
    Sentry.setContext(key, data);
  } catch (error) {
    logError('[Sentry] 컨텍스트 설정 실패:', error);
  }
}

/**
 * 태그를 설정합니다.
 * 
 * @param key 태그 키
 * @param value 태그 값
 */
export function setTag(key: string, value: string): void {
  if (!isInitialized) return;

  try {
    Sentry.setTag(key, value);
  } catch (error) {
    logError('[Sentry] 태그 설정 실패:', error);
  }
}

/**
 * Sentry가 초기화되었는지 확인합니다.
 */
export function isSentryInitialized(): boolean {
  return isInitialized;
}

