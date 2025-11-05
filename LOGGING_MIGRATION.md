# 로깅 시스템 전환 가이드

**작성일**: 2024년 12월  
**목적**: console.log를 logger로 전환하여 프로덕션 환경에서 불필요한 로그 제거

## ✅ 완료된 전환

1. ✅ **authManager.ts** - logger로 전환 완료 (5개 console 사용 → logger 사용)
2. ✅ **dataManager.ts** - logger로 전환 완료 (3개 console 사용 → logger 사용)
3. ✅ **tournamentManager.ts** - logger로 전환 완료 (4개 console 사용 → logger 사용)
4. ✅ **progressManager.ts** - logger로 전환 완료 (20개 console 사용 → logger 사용)
5. ✅ **leagueManager.ts** - logger로 전환 완료 (24개 console 사용 → logger 사용)
6. ✅ **papsManager.ts** - logger로 전환 완료 (25개 console 사용 → logger 사용)
7. ✅ **uiRenderer.ts** - logger로 전환 완료 (90개 console 사용 → logger 사용)

**총 171개 console 사용 → logger로 전환 완료** ✅

## ✅ 완료된 추가 작업

1. ✅ **로그 레벨 관리 시스템** - 환경 변수 기반 로그 레벨 제어
2. ✅ **프로덕션 빌드 설정** - 환경별 빌드 스크립트 추가
3. ✅ **자동 환경 감지** - 로컬호스트/내부 네트워크 자동 감지
4. ✅ **문서화** - LOGGING_GUIDE.md 작성

## 📋 전환 가이드

### 1. Import 추가

```typescript
import { logger, logInfo, logWarn, logError } from './logger.js';
```

### 2. console.log → logger.debug 또는 logInfo

```typescript
// Before
console.log('메시지', data);

// After
logger.debug('메시지', data);
// 또는
logInfo('메시지', data);
```

### 3. console.warn → logWarn

```typescript
// Before
console.warn('경고 메시지', data);

// After
logWarn('경고 메시지', data);
```

### 4. console.error → logError

```typescript
// Before
console.error('에러 메시지', error);

// After
logError('에러 메시지', error);
```

## 📊 로그 레벨별 동작

| 레벨 | 개발 환경 | 프로덕션 환경 |
|------|----------|--------------|
| DEBUG | ✅ 출력 | ❌ 출력 안 함 |
| INFO | ✅ 출력 | ❌ 출력 안 함 |
| WARN | ✅ 출력 | ❌ 출력 안 함 |
| ERROR | ✅ 출력 | ✅ 출력 (항상) |

## 🔧 프로덕션 빌드 설정

프로덕션 빌드에서는 DEBUG, INFO, WARN 레벨 로그가 자동으로 출력되지 않습니다.

### 빌드 명령어

```bash
# 개발 빌드 (기본)
npm run build

# 프로덕션 빌드
npm run build:prod

# 스테이징 빌드
npm run build:staging
```

### 환경 변수 설정 (index.html)

```html
<script>
  // 프로덕션 환경
  window.NODE_ENV = 'production';
  // window.LOG_LEVEL = 'ERROR'; // 선택적
</script>
```

## 📝 참고 문서

- `LOGGING_GUIDE.md`: 로깅 시스템 사용 가이드
- `src/modules/logger.ts`: 로깅 시스템 구현

---

**진행 상황**: ✅ 100% 완료
