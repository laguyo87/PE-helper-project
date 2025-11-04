/**
 * 앱 상태 관리 모듈
 *
 * 이 모듈은 앱의 모든 전역 상태를 중앙에서 관리하고,
 * 상태 변경 시 자동으로 동기화 및 저장을 수행합니다.
 * TypeScript로 작성되어 타입 안정성을 보장합니다.
 *
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */
// ========================================
// AppStateManager 클래스
// ========================================
/**
 * 앱 상태를 중앙에서 관리하는 클래스
 */
export class AppStateManager {
    /**
     * 리소스 정리 (메모리 누수 방지)
     * 타이머를 정리합니다.
     */
    cleanup() {
        // 저장 타이머 정리
        if (this.saveTimeout !== null) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        // 콜백 목록 정리
        this.onChangeCallbacks.clear();
        console.log('AppStateManager 리소스 정리 완료');
    }
    constructor(initialState, options = {}) {
        this.onChangeCallbacks = new Map();
        this.saveTimeout = null;
        this.SAVE_DEBOUNCE_MS = 500; // 500ms 디바운스
        // 기본 상태 초기화
        this.state = {
            leagues: initialState?.leagues || {
                classes: [],
                students: [],
                games: [],
                selectedClassId: null
            },
            tournaments: initialState?.tournaments || {
                tournaments: [],
                activeTournamentId: null
            },
            paps: initialState?.paps || {
                classes: [],
                activeClassId: null
            },
            progress: initialState?.progress || {
                classes: [],
                selectedClassId: null
            }
        };
        this.options = {
            autoSave: true,
            ...options
        };
        // 옵션에서 제공된 콜백들을 등록
        if (this.options.onChangeCallbacks) {
            if (this.options.onChangeCallbacks.leagues) {
                this.subscribe('leagues', this.options.onChangeCallbacks.leagues);
            }
            if (this.options.onChangeCallbacks.tournaments) {
                this.subscribe('tournaments', this.options.onChangeCallbacks.tournaments);
            }
            if (this.options.onChangeCallbacks.paps) {
                this.subscribe('paps', this.options.onChangeCallbacks.paps);
            }
            if (this.options.onChangeCallbacks.progress) {
                this.subscribe('progress', this.options.onChangeCallbacks.progress);
            }
        }
    }
    /**
     * 전체 상태 반환
     */
    getState() {
        return { ...this.state };
    }
    /**
     * 리그 데이터 반환
     */
    getLeagues() {
        return { ...this.state.leagues };
    }
    /**
     * 토너먼트 데이터 반환
     */
    getTournaments() {
        return { ...this.state.tournaments };
    }
    /**
     * PAPS 데이터 반환
     */
    getPaps() {
        return { ...this.state.paps };
    }
    /**
     * Progress 데이터 반환
     */
    getProgress() {
        return { ...this.state.progress };
    }
    /**
     * 리그 데이터 설정
     */
    setLeagues(leagues) {
        const oldState = { ...this.state.leagues };
        this.state.leagues = { ...leagues };
        this.notify('leagues', this.state.leagues, oldState);
        this.scheduleSave();
    }
    /**
     * 토너먼트 데이터 설정
     */
    setTournaments(tournaments) {
        const oldState = { ...this.state.tournaments };
        this.state.tournaments = { ...tournaments };
        this.notify('tournaments', this.state.tournaments, oldState);
        this.scheduleSave();
    }
    /**
     * PAPS 데이터 설정
     */
    setPaps(paps) {
        const oldState = { ...this.state.paps };
        this.state.paps = { ...paps };
        this.notify('paps', this.state.paps, oldState);
        this.scheduleSave();
    }
    /**
     * Progress 데이터 설정
     */
    setProgress(progress) {
        const oldState = { ...this.state.progress };
        this.state.progress = { ...progress };
        this.notify('progress', this.state.progress, oldState);
        this.scheduleSave();
    }
    /**
     * 전체 상태 일괄 설정
     */
    setState(newState) {
        const oldLeagues = { ...this.state.leagues };
        const oldTournaments = { ...this.state.tournaments };
        const oldPaps = { ...this.state.paps };
        const oldProgress = { ...this.state.progress };
        if (newState.leagues !== undefined) {
            this.state.leagues = { ...newState.leagues };
        }
        if (newState.tournaments !== undefined) {
            this.state.tournaments = { ...newState.tournaments };
        }
        if (newState.paps !== undefined) {
            this.state.paps = { ...newState.paps };
        }
        if (newState.progress !== undefined) {
            this.state.progress = { ...newState.progress };
        }
        // 각 상태 변경 알림
        if (newState.leagues !== undefined) {
            this.notify('leagues', this.state.leagues, oldLeagues);
        }
        if (newState.tournaments !== undefined) {
            this.notify('tournaments', this.state.tournaments, oldTournaments);
        }
        if (newState.paps !== undefined) {
            this.notify('paps', this.state.paps, oldPaps);
        }
        if (newState.progress !== undefined) {
            this.notify('progress', this.state.progress, oldProgress);
        }
        this.scheduleSave();
    }
    /**
     * 상태 변경 구독
     */
    subscribe(stateKey, callback) {
        const key = String(stateKey);
        if (!this.onChangeCallbacks.has(key)) {
            this.onChangeCallbacks.set(key, []);
        }
        this.onChangeCallbacks.get(key).push(callback);
        // 구독 해제 함수 반환
        return () => {
            const callbacks = this.onChangeCallbacks.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }
    /**
     * 상태 변경 알림
     */
    notify(stateKey, newState, oldState) {
        const key = String(stateKey);
        const callbacks = this.onChangeCallbacks.get(key);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(newState, oldState);
                }
                catch (error) {
                    console.error(`State change callback error for ${key}:`, error);
                }
            });
        }
    }
    /**
     * 저장 스케줄링 (디바운스)
     */
    scheduleSave() {
        if (!this.options.autoSave || !this.options.saveCallback) {
            return;
        }
        // 기존 타이머 취소
        if (this.saveTimeout !== null) {
            clearTimeout(this.saveTimeout);
        }
        // 새 타이머 설정
        this.saveTimeout = window.setTimeout(() => {
            if (this.options.saveCallback) {
                this.options.saveCallback().catch(error => {
                    console.error('Auto-save failed:', error);
                });
            }
            this.saveTimeout = null;
        }, this.SAVE_DEBOUNCE_MS);
    }
    /**
     * 즉시 저장 (디바운스 없이)
     */
    async saveImmediate() {
        if (this.saveTimeout !== null) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        if (this.options.saveCallback) {
            await this.options.saveCallback();
        }
    }
    /**
     * 저장 콜백 설정
     */
    setSaveCallback(callback) {
        this.options.saveCallback = callback;
    }
    /**
     * 자동 저장 활성화/비활성화
     */
    setAutoSave(enabled) {
        this.options.autoSave = enabled;
    }
    /**
     * 상태 초기화
     */
    reset(newState) {
        const oldState = { ...this.state };
        this.state = {
            leagues: newState?.leagues || {
                classes: [],
                students: [],
                games: [],
                selectedClassId: null
            },
            tournaments: newState?.tournaments || {
                tournaments: [],
                activeTournamentId: null
            },
            paps: newState?.paps || {
                classes: [],
                activeClassId: null
            },
            progress: newState?.progress || {
                classes: [],
                selectedClassId: null
            }
        };
        // 모든 상태 변경 알림
        this.notify('leagues', this.state.leagues, oldState.leagues);
        this.notify('tournaments', this.state.tournaments, oldState.tournaments);
        this.notify('paps', this.state.paps, oldState.paps);
        this.notify('progress', this.state.progress, oldState.progress);
        this.scheduleSave();
    }
}
/**
 * AppStateManager 인스턴스 생성 함수
 */
export function createAppStateManager(initialState, options) {
    return new AppStateManager(initialState, options);
}
//# sourceMappingURL=appStateManager.js.map