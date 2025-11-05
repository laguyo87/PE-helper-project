/**
 * 로깅 시스템 모듈
 * 
 * 구조화된 로깅을 제공하며, 프로덕션 환경에서는 불필요한 로그를 제거합니다.
 * 
 * 환경 변수 설정:
 * - window.NODE_ENV: 'development' | 'production' | 'staging'
 * - window.LOG_LEVEL: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE' (선택적, 기본값: 환경에 따라 자동 설정)
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * 로깅 설정
 */
interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableStack: boolean;
}

/**
 * 문자열을 LogLevel로 변환
 */
function parseLogLevel(level: string | undefined): LogLevel | null {
  if (!level) return null;
  const upperLevel = level.toUpperCase();
  switch (upperLevel) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'NONE': return LogLevel.NONE;
    default: return null;
  }
}

/**
 * 로깅 클래스
 */
class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor() {
    // 환경 감지
    const nodeEnv = typeof window !== 'undefined' ? (window as any).NODE_ENV : undefined;
    const hostname = typeof window !== 'undefined' && window.location 
      ? window.location.hostname 
      : undefined;
    
    // 개발 환경 판단
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateNetwork = hostname 
      ? (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.'))
      : false;
    
    this.isDevelopment = 
      nodeEnv === 'development' ||
      (typeof window !== 'undefined' && (window as any).__DEV__ === true) ||
      isLocalhost ||
      isPrivateNetwork;

    // 로그 레벨 결정 (우선순위: window.LOG_LEVEL > 환경별 기본값)
    const explicitLogLevel = typeof window !== 'undefined' ? parseLogLevel((window as any).LOG_LEVEL) : null;
    let defaultLogLevel: LogLevel;
    
    if (this.isDevelopment) {
      defaultLogLevel = LogLevel.DEBUG;
    } else if (nodeEnv === 'staging') {
      defaultLogLevel = LogLevel.INFO;
    } else {
      // 프로덕션: ERROR만 출력
      defaultLogLevel = LogLevel.ERROR;
    }
    
    const logLevel = explicitLogLevel !== null ? explicitLogLevel : defaultLogLevel;

    this.config = {
      level: logLevel,
      enableTimestamp: this.isDevelopment || logLevel <= LogLevel.INFO,
      enableStack: this.isDevelopment
    };
  }

  /**
   * 로그 레벨 설정
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 타임스탬프 활성화/비활성화
   */
  public setTimestampEnabled(enabled: boolean): void {
    this.config.enableTimestamp = enabled;
  }

  /**
   * 스택 트레이스 활성화/비활성화
   */
  public setStackEnabled(enabled: boolean): void {
    this.config.enableStack = enabled;
  }

  /**
   * DEBUG 레벨 로그
   */
  public debug(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, args);
    }
  }

  /**
   * INFO 레벨 로그
   */
  public info(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log('INFO', message, args);
    }
  }

  /**
   * WARN 레벨 로그
   */
  public warn(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log('WARN', message, args);
    }
  }

  /**
   * ERROR 레벨 로그 (항상 출력)
   */
  public error(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      this.log('ERROR', message, args);
    }
    // 에러는 항상 console.error로도 출력 (프로덕션에서도)
    console.error(`[ERROR] ${message}`, ...args);
  }

  /**
   * 내부 로그 출력 함수
   */
  private log(level: string, message: string, args: any[]): void {
    const timestamp = this.config.enableTimestamp 
      ? `[${new Date().toISOString()}]` 
      : '';
    const prefix = timestamp 
      ? `${timestamp} [${level}]` 
      : `[${level}]`;
    
    const logMessage = `${prefix} ${message}`;
    
    // 스택 트레이스가 필요한 경우 (ERROR 레벨)
    if (level === 'ERROR' && this.config.enableStack && args.length > 0) {
      const error = args[0];
      if (error instanceof Error && error.stack) {
        console.error(logMessage, ...args, '\n', error.stack);
        return;
      }
    }

    // 일반 로그 출력
    switch (level) {
      case 'DEBUG':
        console.debug(logMessage, ...args);
        break;
      case 'INFO':
        console.info(logMessage, ...args);
        break;
      case 'WARN':
        console.warn(logMessage, ...args);
        break;
      case 'ERROR':
        console.error(logMessage, ...args);
        break;
      default:
        console.log(logMessage, ...args);
    }
  }

  /**
   * 그룹 로그 시작
   */
  public group(label: string): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.group(label);
    }
  }

  /**
   * 그룹 로그 종료
   */
  public groupEnd(): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  }

  /**
   * 테이블 형식 로그
   */
  public table(data: any): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.table(data);
    }
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 편의 함수 export
export const log = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logGroup = logger.group.bind(logger);
export const logGroupEnd = logger.groupEnd.bind(logger);
export const logTable = logger.table.bind(logger);

