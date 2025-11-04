/**
 * Manager 타입 정의 모듈
 *
 * 이 모듈은 모든 Manager 클래스의 타입을 중앙에서 관리합니다.
 * 타입 안정성을 보장하기 위해 모든 Manager 인터페이스를 정의합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
import { AuthManager } from './authManager.js';
import { DataManager } from './dataManager.js';
import { VisitorManager } from './visitorManager.js';
import { LeagueManager } from './leagueManager.js';
import { TournamentManager } from './tournamentManager.js';
import { PapsManager } from './papsManager.js';
import { ProgressManager } from './progressManager.js';
export type VersionManagerType = boolean | null;
/**
 * 모든 Manager 타입을 포함하는 통합 타입
 */
export interface AllManagers {
    versionManager: VersionManagerType;
    authManager: AuthManager | null;
    dataManager: DataManager | null;
    visitorManager: VisitorManager | null;
    leagueManager: LeagueManager | null;
    tournamentManager: TournamentManager | null;
    papsManager: PapsManager | null;
    progressManager: ProgressManager | null;
}
/**
 * UI 렌더링에 필요한 Manager 인스턴스들
 */
export interface UIRendererManagers {
    leagueManager?: LeagueManager;
    tournamentManager?: TournamentManager;
    papsManager?: PapsManager;
    progressManager?: ProgressManager;
    authManager?: AuthManager;
}
export type { AuthManager, DataManager, VisitorManager, LeagueManager, TournamentManager, PapsManager, ProgressManager };
//# sourceMappingURL=managerTypes.d.ts.map