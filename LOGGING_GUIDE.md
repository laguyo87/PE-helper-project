# 로깅 시스템 가이드

## 개요

이 프로젝트는 구조화된 로깅 시스템을 사용하여 개발 및 프로덕션 환경에서 적절한 로그 레벨을 관리합니다.

## 로그 레벨

- **DEBUG**: 상세한 디버깅 정보 (개발 환경 전용)
- **INFO**: 일반 정보 (중요한 상태 변경 등)
- **WARN**: 경고 (문제가 될 수 있는 상황)
- **ERROR**: 에러 (프로덕션에서도 출력)
- **NONE**: 모든 로그 비활성화

## 환경 변수 설정

### `window.NODE_ENV`

환경을 지정합니다:
- `'development'`: 개발 환경 (기본: DEBUG 레벨)
- `'production'`: 프로덕션 환경 (기본: ERROR 레벨)
- `'staging'`: 스테이징 환경 (기본: INFO 레벨)

### `window.LOG_LEVEL` (선택적)

로그 레벨을 직접 지정합니다 (환경별 기본값보다 우선순위가 높음):
- `'DEBUG'`
- `'INFO'`
- `'WARN'`
- `'ERROR'`
- `'NONE'`

## 설정 방법

### 1. `index.html`에서 설정 (권장)

프로덕션 배포 시 `index.html`의 환경 변수 설정 스크립트를 수정:

```html
<script>
  // 프로덕션 환경
  window.NODE_ENV = 'production';
  // window.LOG_LEVEL = 'ERROR'; // 선택적, 기본값이 ERROR이므로 생략 가능
</script>
```

```html
<script>
  // 스테이징 환경
  window.NODE_ENV = 'staging';
  window.LOG_LEVEL = 'INFO'; // 선택적, 기본값이 INFO이므로 생략 가능
</script>
```

### 2. 자동 환경 감지

로컬호스트나 내부 네트워크(192.168.x.x, 10.x.x.x, 172.x.x.x)에서는 자동으로 개발 환경으로 감지되어 DEBUG 레벨이 활성화됩니다.

## 빌드 스크립트

```bash
# 개발 빌드 (기본)
npm run build

# 프로덕션 빌드
npm run build:prod

# 스테이징 빌드
npm run build:staging
```

## 사용 예시

### 코드에서 로깅

```typescript
import { logger, logInfo, logWarn, logError } from './logger.js';

// DEBUG 레벨 (개발 환경에서만 출력)
logger.debug('상세 디버깅 정보:', data);

// INFO 레벨
logInfo('앱이 시작되었습니다.');

// WARN 레벨
logWarn('경고: 메모리 사용량이 높습니다.');

// ERROR 레벨 (프로덕션에서도 출력)
logError('에러 발생:', error);
```

## 프로덕션 배포 시 주의사항

1. **환경 변수 설정**: `index.html`에서 `window.NODE_ENV = 'production'` 설정 필수
2. **로그 레벨**: 프로덕션에서는 ERROR 레벨만 출력되도록 설정 (기본값)
3. **성능**: DEBUG 로그는 프로덕션에서 자동으로 비활성화되어 성능에 영향 없음
4. **보안**: 민감한 정보는 절대 로그에 포함하지 않도록 주의

## 환경별 기본 로그 레벨

| 환경 | 기본 로그 레벨 | 타임스탬프 | 스택 트레이스 |
|------|--------------|-----------|--------------|
| Development | DEBUG | ✅ | ✅ |
| Staging | INFO | ✅ | ❌ |
| Production | ERROR | ❌ | ❌ |

## 동적 로그 레벨 변경

런타임에 로그 레벨을 변경할 수 있습니다:

```typescript
import { logger, LogLevel } from './logger.js';

// 로그 레벨을 INFO로 변경
logger.setLevel(LogLevel.INFO);

// 타임스탬프 활성화
logger.setTimestampEnabled(true);

// 스택 트레이스 활성화
logger.setStackEnabled(true);
```

## 디버깅 팁

개발 중에 모든 로그를 보고 싶다면:

```html
<script>
  window.NODE_ENV = 'development';
  window.LOG_LEVEL = 'DEBUG'; // 모든 로그 출력
</script>
```

프로덕션에서도 일시적으로 DEBUG 레벨을 활성화하려면:

```html
<script>
  window.NODE_ENV = 'production';
  window.LOG_LEVEL = 'DEBUG'; // 프로덕션에서도 모든 로그 출력 (디버깅용)
</script>
```

## 로그 필터링

브라우저 개발자 도구에서 로그를 필터링할 수 있습니다:

- Chrome DevTools: Console 패널에서 레벨별 필터 사용
- Firefox DevTools: Console 패널에서 필터 옵션 사용

---

**참고**: 로깅 시스템은 성능에 최소한의 영향을 주도록 설계되었습니다. 프로덕션 환경에서는 DEBUG 레벨 로그가 코드에서 제거되지 않더라도 출력되지 않으므로 성능에 영향이 없습니다.

