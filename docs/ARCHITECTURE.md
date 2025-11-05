# 아키텍처 문서

이 문서는 PE Helper Online 프로젝트의 전체 아키텍처를 설명합니다.

## 목차

- [아키텍처 개요](#아키텍처-개요)
- [모듈 구조](#모듈-구조)
- [데이터 흐름](#데이터-흐름)
- [의존성 그래프](#의존성-그래프)
- [초기화 순서](#초기화-순서)
- [상태 관리](#상태-관리)
- [에러 처리](#에러-처리)

---

## 아키텍처 개요

PE Helper Online은 **계층화된 모듈 아키텍처**를 사용합니다. 각 계층은 명확한 책임을 가지며, 상위 계층만 하위 계층에 의존합니다.

### 아키텍처 원칙

1. **단일 책임 원칙**: 각 모듈은 하나의 책임만 가집니다.
2. **의존성 역전**: 추상화에 의존하며, 구체 구현에는 의존하지 않습니다.
3. **중앙 집중식 상태 관리**: AppStateManager를 통한 단일 진실 공급원
4. **명확한 모듈 경계**: 모듈 간 인터페이스를 통한 느슨한 결합

---

## 모듈 구조

### 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    프레젠테이션 계층                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  UIRenderer  │  │ GlobalBridge │  │  ErrorFilter │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    비즈니스 로직 계층                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   League     │  │ Tournament   │  │    PAPS      │    │
│  │   Manager    │  │   Manager    │  │   Manager    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐                                           │
│  │  Progress    │                                           │
│  │   Manager    │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     인프라 계층                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ AppContext   │  │ AppStateMgr  │  │ DataSyncSvc  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Auth      │  │    Data      │  │   Version    │    │
│  │   Manager    │  │   Manager    │  │   Manager    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    외부 서비스 계층                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Firestore   │  │ Firebase     │  │ LocalStorage │    │
│  │              │  │   Auth       │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 모듈별 역할

#### 프레젠테이션 계층

- **UIRenderer**: UI 렌더링 및 모드 전환
- **GlobalBridge**: HTML과 모듈 간 브릿지
- **ErrorFilter**: 에러 필터링 및 처리

#### 비즈니스 로직 계층

- **LeagueManager**: 리그전 수업 관리
- **TournamentManager**: 토너먼트 관리
- **PapsManager**: PAPS 기록 관리
- **ProgressManager**: 진도표 관리

#### 인프라 계층

- **AppContext**: 전역 컨텍스트 (싱글톤)
- **AppStateManager**: 상태 관리 및 자동 저장
- **DataSyncService**: 데이터 동기화
- **AuthManager**: 인증 관리
- **DataManager**: Firestore 접근
- **VersionManager**: 버전 관리

---

## 데이터 흐름

### 사용자 액션 → 상태 업데이트

```
1. User Action (클릭, 입력 등)
   │
   ▼
2. UIRenderer / Manager Event Handler
   │
   ▼
3. Manager Business Logic
   │
   ▼
4. AppStateManager.setXxx()
   │
   ▼
5. AppStateManager 내부:
   - 상태 업데이트
   - onChangeCallbacks 호출
   - scheduleSave() (디바운스 500ms)
   │
   ▼
6. DataSyncService.saveToFirestore()
   │
   ▼
7. DataManager.saveDataToFirestore()
   │
   ▼
8. Firebase Firestore
```

### 데이터 로드 → UI 업데이트

```
1. 앱 시작 / 데이터 새로고침
   │
   ▼
2. DataSyncService.sync()
   │
   ├─▶ Firestore 로드 시도
   │   │
   │   ├─▶ 성공 → AppStateManager.setState()
   │   │
   │   └─▶ 실패 → LocalStorage 로드
   │       │
   │       ├─▶ 성공 → AppStateManager.setState()
   │       │
   │       └─▶ 실패 → 기본값 사용
   │
   ▼
3. AppStateManager 상태 업데이트
   │
   ├─▶ onChangeCallbacks 호출
   │   │
   │   └─▶ 각 Manager 상태 동기화
   │       (예: leagueManager.leagueData = ...)
   │
   ▼
4. UIRenderer.renderApp()
   │
   ▼
5. 각 Manager.renderXxxUI()
   │
   ▼
6. DOM 업데이트
```

---

## 의존성 그래프

### 모듈 의존성

```
main.ts
  │
  ├─▶ AppInitializer
  │     │
  │     ├─▶ VersionManager
  │     ├─▶ AuthManager
  │     ├─▶ DataManager
  │     ├─▶ VisitorManager
  │     ├─▶ LeagueManager
  │     │     └─▶ AppStateManager
  │     ├─▶ TournamentManager
  │     │     └─▶ AppStateManager
  │     ├─▶ PapsManager
  │     │     └─▶ AppStateManager
  │     └─▶ ProgressManager
  │           └─▶ AppStateManager
  │
  ├─▶ AppContext (Singleton)
  │
  ├─▶ AppStateManager
  │     └─▶ DataSyncService (콜백)
  │
  ├─▶ DataSyncService
  │     ├─▶ DataManager
  │     ├─▶ AuthManager
  │     └─▶ AppStateManager
  │
  ├─▶ UIRenderer
  │     ├─▶ AppStateManager
  │     └─▶ Managers (League, Tournament, PAPS, Progress)
  │
  ├─▶ ShareManager
  │     └─▶ Firebase (window.firebase)
  │
  ├─▶ GlobalBridge
  │     └─▶ AppContext
  │
  └─▶ Utils (독립 모듈)
```

### 순환 의존성 방지

- **AppStateManager ↔ DataSyncService**: 콜백을 통한 역방향 통신
- **Manager ↔ AppStateManager**: 상태 동기화를 위한 단방향 의존성
- **UIRenderer ↔ Managers**: 렌더링을 위한 단방향 의존성

---

## 초기화 순서

### 앱 시작 시 초기화 흐름

```
1. DOMContentLoaded 이벤트
   │
   ▼
2. main.ts: initialize_app()
   │
   ├─▶ 1. AppContext 초기화
   │
   ├─▶ 2. AppStateManager 생성
   │     └─▶ 기본 데이터로 초기화
   │
   ├─▶ 3. AppInitializer 생성
   │     └─▶ checkVersion() 호출
   │
   ├─▶ 4. AppInitializer.initialize()
   │     │
   │     ├─▶ VersionManager 초기화
   │     │
   │     ├─▶ AuthManager 초기화
   │     │     └─▶ Firebase Auth 리스너 설정
   │     │
   │     ├─▶ DataManager 초기화
   │     │
   │     ├─▶ VisitorManager 초기화
   │     │
   │     ├─▶ LeagueManager 초기화
   │     │
   │     ├─▶ TournamentManager 초기화
   │     │
   │     ├─▶ PapsManager 초기화
   │     │
   │     └─▶ ProgressManager 초기화
   │
   ├─▶ 5. DataSyncService 생성
   │     └─▶ loadDataFromFirestore() 호출
   │           └─▶ sync() → Firestore/LocalStorage/기본값
   │
   ├─▶ 6. UIRenderer 생성
   │     └─▶ initializeUI()
   │           └─▶ setupModeButtons()
   │
   ├─▶ 7. ShareManager 생성
   │
   ├─▶ 8. GlobalBridge 생성
   │     └─▶ registerAll()
   │           └─▶ window.switchMode, window.selectClass 등 등록
   │
   └─▶ 9. renderApp()
        └─▶ 현재 모드에 따라 UI 렌더링
```

---

## 상태 관리

### 상태 구조

```typescript
AppState {
  leagues: {
    classes: LeagueClass[],
    students: LeagueStudent[],
    games: LeagueGame[],
    selectedClassId: number | null
  },
  tournaments: {
    tournaments: Tournament[],
    activeTournamentId: number | null
  },
  paps: {
    classes: PapsClass[],
    activeClassId: number | null
  },
  progress: {
    classes: ProgressClass[],
    selectedClassId: string | null
  }
}
```

### 상태 업데이트 프로세스

1. **상태 변경 요청**
   ```typescript
   stateManager.setLeagues(newLeagues);
   ```

2. **상태 업데이트**
   ```typescript
   this.state.leagues = { ...newLeagues };
   ```

3. **변경 알림**
   ```typescript
   this.notify('leagues', newState, oldState);
   // → onChangeCallbacks 호출
   ```

4. **자동 저장 스케줄링**
   ```typescript
   this.scheduleSave();
   // → 500ms 디바운스 후 saveCallback 호출
   ```

5. **저장 실행**
   ```typescript
   dataSyncService.saveToFirestore();
   // → Firestore + LocalStorage 백업
   ```

---

## 에러 처리

### 에러 처리 계층

```
1. 비즈니스 로직 레벨
   - Manager 내부 try-catch
   - 사용자 친화적 에러 메시지

2. 데이터 레벨
   - DataManager 재시도 로직
   - Firestore 에러 핸들링
   - LocalStorage 폴백

3. 전역 레벨
   - ErrorFilter (COOP 에러 필터링)
   - window.onerror 핸들러
   - console 에러 필터링
```

### 에러 복구 전략

1. **Firestore 저장 실패**
   - LocalStorage에 백업
   - 재시도 로직 (최대 3회)
   - 사용자에게 알림

2. **인증 실패**
   - 로그인 페이지로 리다이렉트
   - 에러 메시지 표시

3. **데이터 로드 실패**
   - LocalStorage 폴백
   - 기본값 사용
   - 사용자에게 알림

---

## 성능 최적화

### 디바운싱

- **상태 저장**: 500ms 디바운스
- **Firestore 저장**: 1000ms 디바운스 (DataManager 내부)

### 지연 로딩

- Firebase 모듈: 동적 import
- Manager 초기화: 순차적 초기화

### 메모리 관리

- 이벤트 리스너 정리
- 타이머 정리 (clearTimeout)
- 구독 해제 함수 제공

---

## 보안 고려사항

### 인증

- Firebase Authentication 사용
- 로그인 상태 확인
- 보호된 리소스 접근 제어

### 데이터 검증

- 입력 데이터 검증
- 타입 체크 (TypeScript)
- Firestore 보안 규칙

### XSS 방지

- DOM 조작 시 주의
- 사용자 입력 이스케이프
- Content Security Policy

---

## 확장성

### 새 모듈 추가

1. `src/modules/`에 새 모듈 생성
2. `AppInitializer`에 초기화 로직 추가
3. `AppContext`에 타입 추가
4. `UIRenderer`에 UI 렌더링 로직 추가

### 새 기능 추가

1. 비즈니스 로직을 Manager에 추가
2. 상태 구조에 새 필드 추가 (필요 시)
3. UI 렌더링 로직 추가
4. 테스트 작성

---

**문서 버전**: 2.2.1  
**최종 업데이트**: 2024년 11월

