# Sentry 에러 리포팅 설정 가이드

**작업 완료일**: 2024년 12월  
**목적**: 프로덕션 환경에서 발생하는 에러 추적 및 모니터링

## ✅ 완료된 작업

1. ✅ **Sentry SDK 설치** - `@sentry/browser` 패키지 설치
2. ✅ **Sentry 모듈 생성** - `src/modules/sentry.ts` 생성
3. ✅ **errorHandler 통합** - 에러 발생 시 자동 리포팅
4. ✅ **사용자 컨텍스트 설정** - 로그인 시 사용자 정보 자동 수집
5. ✅ **AppInitializer 통합** - 앱 초기화 시 Sentry 자동 초기화

---

## 📋 설정 방법

### 1. Sentry 계정 생성 및 DSN 발급

1. [Sentry.io](https://sentry.io)에 회원가입
2. 새 프로젝트 생성 (Browser JavaScript 선택)
3. DSN(Data Source Name) 복사

### 2. 프로덕션 환경 설정

프로덕션 환경에서 Sentry를 활성화하려면 `index.html`에 다음 스크립트를 추가하세요:

```html
<script>
  // Sentry DSN 설정 (프로덕션 환경)
  window.SENTRY_DSN = 'https://YOUR_DSN@sentry.io/PROJECT_ID';
  window.NODE_ENV = 'production';
</script>
```

### 3. 개발 환경 설정 (선택사항)

개발 환경에서도 Sentry를 테스트하려면:

```html
<script>
  // 개발 환경에서 Sentry 활성화
  window.SENTRY_DSN = 'https://YOUR_DSN@sentry.io/PROJECT_ID';
  window.ENABLE_SENTRY_DEV = 'true';
  window.NODE_ENV = 'development';
</script>
```

---

## 🔧 기능 상세

### 자동 에러 리포팅

`errorHandler.ts`의 `showError` 함수가 호출될 때:
- 검증 에러는 제외 (validation error)
- 네트워크 에러, 권한 에러, 알 수 없는 에러는 자동 리포팅

### 사용자 컨텍스트

로그인 시 자동으로 다음 정보가 Sentry에 전송됩니다:
- 사용자 ID (uid)
- 이메일
- 사용자 이름 (displayName)

### 에러 필터링

다음 에러는 자동으로 필터링되어 리포팅되지 않습니다:
- COOP (Cross-Origin-Opener-Policy) 에러
- 브라우저 확장 프로그램 에러
- 네트워크 타임아웃 (일시적 에러)

---

## 📊 Sentry 대시보드

Sentry 대시보드에서 다음 정보를 확인할 수 있습니다:
- 에러 발생 빈도
- 에러 발생 위치 (파일, 라인 번호)
- 사용자 영향도
- 브라우저/디바이스 정보
- 사용자 컨텍스트 정보

---

## 🔒 보안 고려사항

1. **DSN 보안**: DSN은 클라이언트에 노출되어도 괜찮지만, 프로젝트 설정에서 읽기 전용 권한을 확인하세요.

2. **민감 정보 필터링**: 
   - Sentry는 자동으로 비밀번호, 토큰 등 민감 정보를 필터링합니다.
   - 필요 시 추가 필터링 규칙 설정 가능

3. **환경 분리**: 
   - 프로덕션과 개발 환경을 분리하여 테스트 데이터와 실제 데이터를 구분

---

## 📝 사용 예제

### 수동 에러 리포팅

```typescript
import { captureException, captureMessage } from './modules/sentry.js';

try {
  // 위험한 작업
} catch (error) {
  captureException(error, {
    additionalInfo: {
      userId: '123',
      action: 'saveData'
    }
  });
}

// 메시지 리포팅
captureMessage('중요한 이벤트 발생', 'warning', {
  eventInfo: {
    type: 'userAction',
    timestamp: Date.now()
  }
});
```

### 사용자 컨텍스트 수동 설정

```typescript
import { setUser } from './modules/sentry.js';

setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: '사용자명'
});
```

---

## ⚙️ 고급 설정

### 에러 샘플링 (Production)

프로덕션 환경에서는 자동으로 10% 샘플링이 적용됩니다:
- `tracesSampleRate: 0.1` (10%)

### 에러 알림 설정

Sentry 대시보드에서:
1. Settings → Projects → [프로젝트명]
2. Alerts → Create Alert Rule
3. 조건 설정 (예: 같은 에러가 10분 안에 10번 발생)
4. 알림 채널 선택 (이메일, Slack 등)

---

## 🐛 트러블슈팅

### Sentry가 작동하지 않는 경우

1. **DSN 확인**: `window.SENTRY_DSN`이 올바르게 설정되었는지 확인
2. **콘솔 확인**: 브라우저 콘솔에서 "[Sentry] 초기화 완료" 메시지 확인
3. **네트워크 확인**: Sentry 서버와의 연결 확인 (네트워크 탭)

### 개발 환경에서 Sentry가 활성화되지 않는 경우

`window.ENABLE_SENTRY_DEV = 'true'` 설정 확인

---

## 📈 무료 티어 제한

Sentry 무료 티어:
- **5,000 에러/월**
- **10,000 트랜잭션/월**
- 프로젝트 수 제한 없음

제한을 초과하면:
- 이메일 알림 발송
- 추가 에러는 리포팅되지 않음
- 대시보드는 계속 접근 가능

---

**작업 완료**: Sentry 에러 리포팅 시스템 도입 완료 ✅

