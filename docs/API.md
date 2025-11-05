# API 문서

이 문서는 PE Helper Online 프로젝트의 모듈별 API를 설명합니다.

## 목차

- [핵심 모듈](#핵심-모듈)
  - [AppContext](#appcontext)
  - [AppStateManager](#appstatemanager)
  - [DataSyncService](#datasyncservice)
  - [UIRenderer](#uirenderer)
  - [AppInitializer](#appinitializer)
- [유틸리티 모듈](#유틸리티-모듈)
  - [Utils](#utils)
  - [GlobalBridge](#globalbridge)
  - [ErrorFilter](#errorfilter)
- [비즈니스 모듈](#비즈니스-모듈)
  - [LeagueManager](#leaguemanager)
  - [TournamentManager](#tournamentmanager)
  - [PapsManager](#papsmanager)
  - [ProgressManager](#progressmanager)
- [인프라 모듈](#인프라-모듈)
  - [AuthManager](#authmanager)
  - [DataManager](#datamanager)
  - [VersionManager](#versionmanager)
  - [VisitorManager](#visitormanager)
  - [ShareManager](#sharemanager)

---

## 핵심 모듈

### AppContext

앱의 전역 컨텍스트를 중앙에서 관리하는 싱글톤 클래스입니다.

#### 클래스

```typescript
class AppContext
```

#### 메서드

##### `getInstance(options?: AppContextOptions): AppContext`

싱글톤 인스턴스를 가져옵니다.

**매개변수:**
- `options`: 초기 옵션 (선택적)

**반환값:** AppContext 인스턴스

**예제:**
```typescript
const context = AppContext.getInstance();
```

##### `resetInstance(): void`

인스턴스를 리셋합니다. (테스트 용도)

##### `update(updates: Partial<AppContext>): void`

컨텍스트를 업데이트합니다.

**매개변수:**
- `updates`: 업데이트할 속성들

##### `getManager<K extends keyof AppContext>(key: K): AppContext[K]`

특정 Manager를 가져옵니다.

**매개변수:**
- `key`: Manager 키

**반환값:** Manager 인스턴스 또는 null

##### `getContext(): AppContext`

전체 컨텍스트를 가져옵니다.

**반환값:** 현재 컨텍스트의 복사본

##### `isInitialized(): boolean`

모든 Manager가 초기화되었는지 확인합니다.

**반환값:** 초기화 완료 여부

#### 팩토리 함수

##### `getAppContext(options?: AppContextOptions): AppContext`

AppContext 인스턴스를 가져오거나 생성합니다.

##### `initializeAppContext(context: Partial<AppContext>): AppContext`

AppContext를 초기화합니다.

---

### AppStateManager

앱의 모든 전역 상태를 중앙에서 관리하고, 상태 변경 시 자동으로 동기화 및 저장을 수행합니다.

#### 클래스

```typescript
class AppStateManager
```

#### 인터페이스

##### `AppState`

```typescript
interface AppState {
  leagues: LeagueData;
  tournaments: TournamentData;
  paps: PapsData;
  progress: ProgressData;
}
```

##### `AppStateManagerOptions`

```typescript
interface AppStateManagerOptions {
  autoSave?: boolean;
  saveCallback?: SaveCallback;
  onChangeCallbacks?: {
    leagues?: StateChangeCallback<LeagueData>;
    tournaments?: StateChangeCallback<TournamentData>;
    paps?: StateChangeCallback<PapsData>;
    progress?: StateChangeCallback<ProgressData>;
  };
}
```

#### 메서드

##### `getState(): AppState`

전체 상태를 반환합니다.

**반환값:** 현재 상태의 복사본

##### `getLeagues(): LeagueData`

리그 데이터를 반환합니다.

##### `getTournaments(): TournamentData`

토너먼트 데이터를 반환합니다.

##### `getPaps(): PapsData`

PAPS 데이터를 반환합니다.

##### `getProgress(): ProgressData`

진도표 데이터를 반환합니다.

##### `setLeagues(leagues: LeagueData): void`

리그 데이터를 설정합니다.

**매개변수:**
- `leagues`: 리그 데이터

##### `setTournaments(tournaments: TournamentData): void`

토너먼트 데이터를 설정합니다.

##### `setPaps(paps: PapsData): void`

PAPS 데이터를 설정합니다.

##### `setProgress(progress: ProgressData): void`

진도표 데이터를 설정합니다.

##### `setState(newState: Partial<AppState>): void`

전체 상태를 일괄 설정합니다.

**매개변수:**
- `newState`: 새로운 상태 (부분 업데이트 가능)

##### `subscribe<T extends keyof AppState>(stateKey: T, callback: StateChangeCallback<AppState[T]>): () => void`

상태 변경을 구독합니다.

**매개변수:**
- `stateKey`: 상태 키
- `callback`: 변경 시 호출될 콜백

**반환값:** 구독 해제 함수

**예제:**
```typescript
const unsubscribe = stateManager.subscribe('leagues', (newState, oldState) => {
  console.log('Leagues updated:', newState);
});
```

##### `saveImmediate(): Promise<void>`

즉시 저장합니다. (디바운스 없이)

#### 팩토리 함수

##### `createAppStateManager(initialState?: Partial<AppState>, options?: AppStateManagerOptions): AppStateManager`

AppStateManager 인스턴스를 생성합니다.

---

### DataSyncService

Firestore와 LocalStorage 간의 데이터 동기화를 담당합니다.

#### 클래스

```typescript
class DataSyncService
```

#### 인터페이스

##### `DataSyncServiceOptions`

```typescript
interface DataSyncServiceOptions {
  dataManager: DataManager;
  authManager: AuthManager;
  stateManager: AppStateManager;
  storageKey?: string;
  getDefaultData?: () => Partial<AppState>;
}
```

##### `SyncResult`

```typescript
interface SyncResult {
  success: boolean;
  source: 'firestore' | 'local' | 'default';
  error?: Error;
  data?: Partial<AppState>;
}
```

#### 메서드

##### `sync(): Promise<SyncResult>`

데이터를 동기화합니다. (Firestore 우선, 실패 시 LocalStorage, 최종적으로 기본값)

**반환값:** 동기화 결과

##### `loadFromFirestore(): Promise<SyncResult>`

Firestore에서 데이터를 로드합니다.

##### `loadFromLocal(): SyncResult`

LocalStorage에서 데이터를 로드합니다.

##### `loadDefault(): SyncResult`

기본 데이터를 로드합니다.

##### `saveToFirestore(): Promise<SyncResult>`

Firestore에 데이터를 저장합니다.

##### `saveToLocal(data?: Partial<AppState>): SyncResult`

LocalStorage에 데이터를 저장합니다.

#### 팩토리 함수

##### `createDataSyncService(options: DataSyncServiceOptions): DataSyncService`

DataSyncService 인스턴스를 생성합니다.

---

### UIRenderer

UI 렌더링 및 모드 전환을 담당합니다.

#### 클래스

```typescript
class UIRenderer
```

#### 인터페이스

##### `UIRendererOptions`

```typescript
interface UIRendererOptions {
  stateManager: AppStateManager;
  managers: {
    leagueManager?: LeagueManager;
    tournamentManager?: TournamentManager;
    papsManager?: PapsManager;
    progressManager?: ProgressManager;
    authManager?: AuthManager;
  };
  $: (selector: string) => HTMLElement | null;
  $$: (selector: string) => NodeListOf<HTMLElement>;
}
```

#### 메서드

##### `initializeUI(): void`

UI를 초기화합니다.

##### `setupModeButtons(): void`

모드 버튼 이벤트를 설정합니다.

##### `switchMode(mode: string): void`

모드를 전환합니다.

**매개변수:**
- `mode`: 모드 ('league' | 'tournament' | 'paps' | 'progress')

##### `renderApp(): void`

앱을 렌더링합니다. (현재 모드에 따라)

##### `getMode(): string`

현재 모드를 반환합니다.

**반환값:** 현재 모드

#### 팩토리 함수

##### `createUIRenderer(options: UIRendererOptions): UIRenderer`

UIRenderer 인스턴스를 생성합니다.

---

### AppInitializer

모든 Manager를 초기화하고 의존성을 해결합니다.

#### 클래스

```typescript
class AppInitializer
```

#### 인터페이스

##### `AppInitializerOptions`

```typescript
interface AppInitializerOptions {
  $: (selector: string) => HTMLElement | null;
  $$: (selector: string) => NodeListOf<Element>;
  checkVersion: () => void;
  loadDataFromFirestore: () => Promise<void>;
  saveDataToFirestore: () => Promise<void>;
  saveProgressData: () => Promise<void>;
  cleanupSidebar: () => void;
  initializeUI: () => void;
}
```

##### `InitializedManagers`

```typescript
interface InitializedManagers {
  versionManager: boolean | null;
  authManager: AuthManager | null;
  dataManager: DataManager | null;
  visitorManager: VisitorManager | null;
  leagueManager: LeagueManager | null;
  tournamentManager: TournamentManager | null;
  papsManager: PapsManager | null;
  progressManager: ProgressManager | null;
}
```

#### 메서드

##### `initialize(initialData: AppState): Promise<InitializedManagers>`

모든 Manager를 초기화합니다.

**매개변수:**
- `initialData`: 초기 상태 데이터

**반환값:** 초기화된 Manager들

#### 팩토리 함수

##### `createAppInitializer(options: AppInitializerOptions): AppInitializer`

AppInitializer 인스턴스를 생성합니다.

---

## 유틸리티 모듈

### Utils

공통 유틸리티 함수를 제공합니다.

#### 함수

##### `$(selector: string): HTMLElement | null`

DOM 요소를 선택합니다.

##### `$$(selector: string): NodeListOf<HTMLElement>`

DOM 요소들을 모두 선택합니다.

##### `cleanupSidebar(selectorFn?: DOMSelector): void`

사이드바 리스트 컨테이너를 정리합니다.

##### `checkVersion(): void`

앱 버전을 체크하고 필요시 새로고침합니다.

##### `getDefaultData(): DefaultAppData`

기본 앱 데이터를 반환합니다.

---

### GlobalBridge

HTML의 onclick 핸들러와 모듈화된 코드를 연결하는 브릿지 역할을 합니다.

#### 클래스

```typescript
class GlobalBridge
```

#### 메서드

##### `registerAll(): void`

모든 전역 함수를 등록합니다.

##### `register(name: string, func: (...args: any[]) => any): void`

특정 전역 함수를 등록합니다.

##### `unregister(name: string): void`

전역 함수를 제거합니다.

##### `unregisterAll(): void`

모든 전역 함수를 제거합니다.

##### `updateAppMode(): void`

appMode를 업데이트합니다.

---

### ErrorFilter

에러 필터링, 특히 COOP 관련 콘솔 메시지와 이벤트를 처리합니다.

#### 함수

##### `initializeCOOPFilter(options?: ErrorFilterOptions): void`

COOP 에러 필터를 초기화합니다.

---

## 비즈니스 모듈

### LeagueManager

리그전 수업을 관리합니다.

#### 주요 기능

- 반 관리 (생성, 수정, 삭제)
- 학생 관리
- 리그 일정 생성
- 게임 결과 입력
- 순위 관리
- Excel 내보내기

#### 메서드

##### `selectClass(classId: number): void`

반을 선택합니다.

##### `editClassNote(classId: number): void`

반 메모를 편집합니다.

##### `editClassName(classId: number): void`

반 이름을 편집합니다.

##### `deleteClass(classId: number): void`

반을 삭제합니다.

---

### TournamentManager

토너먼트를 관리합니다.

#### 주요 기능

- 토너먼트 생성 (단일/이중)
- 대진표 생성
- 경기 결과 입력
- 토너먼트 진행 상황 추적

---

### PapsManager

PAPS(체력평가) 기록을 관리합니다.

#### 주요 기능

- 체력평가 기록 입력
- 학년별/성별 통계
- 기록 분포 그래프
- 랭킹 시스템
- 순위표 공유

---

### ProgressManager

수업 진도표를 관리합니다.

#### 주요 기능

- 진도표 클래스 관리
- 진도 입력
- 학습 목표 달성률 추적

---

## 인프라 모듈

### AuthManager

사용자 인증을 관리합니다.

#### 주요 기능

- Google Sign-in
- 로그아웃
- 인증 상태 관리
- 로그인 UI 업데이트

---

### DataManager

Firestore 데이터 접근을 관리합니다.

#### 주요 기능

- 데이터 저장 (Firestore)
- 데이터 로드 (Firestore)
- 로컬 스토리지 백업
- 에러 처리 및 재시도

---

### VersionManager

앱 버전을 관리합니다.

#### 주요 기능

- 버전 체크
- 캐시 무효화
- 자동 새로고침

---

### VisitorManager

방문자 수를 관리합니다.

#### 주요 기능

- 방문자 수 추적
- Firestore에 방문자 수 저장
- 중복 방문 방지 (세션 기반)

---

### ShareManager

순위표 공유 기능을 관리합니다.

#### 주요 기능

- 공유 ID 생성
- 공유 링크 생성
- 공유 데이터 저장 (Firestore)
- 공유 데이터 로드 및 표시

---

## 타입 정의

### 공통 타입

```typescript
// DOM 선택자
type DOMSelector = (selector: string) => HTMLElement | null;
type DOMSelectorAll = (selector: string) => NodeListOf<HTMLElement>;

// 콜백
type StateChangeCallback<T = any> = (newState: T, oldState: T) => void;
type SaveCallback = () => Promise<void>;
```

---

**문서 버전**: 2.2.1  
**최종 업데이트**: 2024년 11월

