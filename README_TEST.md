# 테스트 가이드

이 문서는 PE Helper Online 프로젝트의 테스트 인프라 사용법을 설명합니다.

## 테스트 환경

- **테스트 프레임워크**: Vitest (v4.0+)
- **테스트 환경**: happy-dom (DOM API 시뮬레이션)
- **언어**: TypeScript

## 설치

테스트 관련 패키지는 이미 설치되어 있습니다:

```bash
npm install
```

## 테스트 실행

### 모든 테스트 실행

```bash
npm test
```

또는 Watch 모드로 실행:

```bash
npm test  # Watch 모드 (기본)
```

### 테스트 한 번만 실행

```bash
npm run test:run
```

### 테스트 UI 실행

```bash
npm run test:ui
```

브라우저에서 테스트 결과를 시각적으로 확인할 수 있습니다.

### 커버리지 확인

```bash
npm run test:coverage
```

커버리지 보고서가 `coverage/` 디렉토리에 생성됩니다.

## 테스트 구조

### 테스트 파일 위치

```
src/
  ├── modules/
  │   ├── utils.ts
  │   ├── utils.test.ts          # Utils 모듈 테스트
  │   ├── appStateManager.ts
  │   ├── appStateManager.test.ts # AppStateManager 테스트
  │   ├── appContext.ts
  │   └── appContext.test.ts      # AppContext 테스트
  └── test/
      └── setup.ts                # 테스트 공통 설정
```

### 테스트 파일 명명 규칙

- `*.test.ts`: 테스트 파일
- `*.spec.ts`: 테스트 파일 (대안)

## 작성된 테스트

### 1. Utils 모듈 테스트 (`utils.test.ts`)

- **$ 함수**: DOM 요소 선택
- **$$ 함수**: 여러 DOM 요소 선택
- **cleanupSidebar 함수**: 사이드바 정리
- **checkVersion 함수**: 버전 체크
- **getDefaultData 함수**: 기본 데이터 생성

**테스트 수**: 13개

### 2. AppStateManager 모듈 테스트 (`appStateManager.test.ts`)

- **초기화**: 기본/커스텀 데이터로 초기화
- **상태 조회**: getState() 동작
- **상태 변경**: setLeagues, setTournaments, setPaps, setProgress
- **자동 저장**: autoSave 옵션 및 디바운스 동작
- **즉시 저장**: saveImmediate() 동작
- **변경 콜백**: onChangeCallbacks 동작

**테스트 수**: 14개

### 3. AppContext 모듈 테스트 (`appContext.test.ts`)

- **싱글톤 패턴**: 인스턴스 재사용 및 리셋
- **초기화**: 기본값 및 커스텀 초기화
- **업데이트**: update() 메서드
- **Manager 조회**: getManager(), getContext()
- **초기화 확인**: isInitialized()

**테스트 수**: 9개

**총 테스트 수**: 35개

## 테스트 작성 가이드

### 기본 테스트 구조

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionToTest } from './module.ts';

describe('ModuleName', () => {
  beforeEach(() => {
    // 각 테스트 전 초기화
  });

  describe('FunctionName', () => {
    it('should do something', () => {
      // Given
      const input = 'test';
      
      // When
      const result = functionToTest(input);
      
      // Then
      expect(result).toBe('expected');
    });
  });
});
```

### Mock 사용

```typescript
import { vi } from 'vitest';

// 함수 Mock
const mockFn = vi.fn().mockReturnValue('value');

// localStorage Mock
localStorage.getItem = vi.fn().mockReturnValue('stored');
```

### 비동기 테스트

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### DOM 테스트

```typescript
beforeEach(() => {
  document.body.innerHTML = '<div id="test">Content</div>';
});

it('should manipulate DOM', () => {
  const element = document.getElementById('test');
  expect(element?.textContent).toBe('Content');
});
```

## 테스트 설정

### Vitest 설정 (`vitest.config.ts`)

- **환경**: happy-dom (DOM API 제공)
- **타임아웃**: 10초
- **커버리지**: v8 provider
- **설정 파일**: `src/test/setup.ts`

### 공통 설정 (`src/test/setup.ts`)

- localStorage/sessionStorage Mock
- Firebase Mock
- Console Mock
- 각 테스트 전 초기화

## CI/CD 통합

GitHub Actions 등에서 테스트 실행:

```yaml
- name: Run tests
  run: npm run test:run
```

## 문제 해결

### 테스트가 실패하는 경우

1. **타임아웃 에러**: `vitest.config.ts`에서 `testTimeout` 증가
2. **DOM 관련 에러**: `src/test/setup.ts`에서 Mock 설정 확인
3. **비동기 에러**: `await` 키워드 및 Promise 처리 확인

### 디버깅

```bash
# 특정 테스트만 실행
npm test -- utils.test.ts

# Verbose 출력
npm test -- --reporter=verbose
```

## 다음 단계

추가로 작성 가능한 테스트:

1. **DataSyncService 테스트**: 데이터 동기화 로직
2. **UIRenderer 테스트**: UI 렌더링 로직
3. **ShareManager 테스트**: 공유 기능
4. **GlobalBridge 테스트**: 전역 함수 등록
5. **통합 테스트**: 여러 모듈 간 상호작용

## 참고 자료

- [Vitest 문서](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [TypeScript Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

