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
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
/**
 * 로깅 클래스
 */
declare class Logger {
    private config;
    private isDevelopment;
    constructor();
    /**
     * 로그 레벨 설정
     */
    setLevel(level: LogLevel): void;
    /**
     * 타임스탬프 활성화/비활성화
     */
    setTimestampEnabled(enabled: boolean): void;
    /**
     * 스택 트레이스 활성화/비활성화
     */
    setStackEnabled(enabled: boolean): void;
    /**
     * DEBUG 레벨 로그
     */
    debug(message: string, ...args: any[]): void;
    /**
     * INFO 레벨 로그
     */
    info(message: string, ...args: any[]): void;
    /**
     * WARN 레벨 로그
     */
    warn(message: string, ...args: any[]): void;
    /**
     * ERROR 레벨 로그 (항상 출력)
     */
    error(message: string, ...args: any[]): void;
    /**
     * 내부 로그 출력 함수
     */
    private log;
    /**
     * 그룹 로그 시작
     */
    group(label: string): void;
    /**
     * 그룹 로그 종료
     */
    groupEnd(): void;
    /**
     * 테이블 형식 로그
     */
    table(data: any): void;
}
export declare const logger: Logger;
export declare const log: (message: string, ...args: any[]) => void;
export declare const logInfo: (message: string, ...args: any[]) => void;
export declare const logWarn: (message: string, ...args: any[]) => void;
export declare const logError: (message: string, ...args: any[]) => void;
export declare const logGroup: (label: string) => void;
export declare const logGroupEnd: () => void;
export declare const logTable: (data: any) => void;
export {};
//# sourceMappingURL=logger.d.ts.map