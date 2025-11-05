# 보안 체크리스트 및 가이드

**작성일**: 2024년 12월  
**목적**: 보안 취약점 점검 및 보안 강화 가이드

## ✅ 완료된 보안 강화 사항

### 1. XSS (Cross-Site Scripting) 방지
- ✅ **DOMPurify 사용**: 모든 `innerHTML` 사용 시 DOMPurify로 HTML 정제
- ✅ **setInnerHTMLSafe 통합**: Utils 모듈에 통합하여 일관된 XSS 방지
- ✅ **사용자 입력 검증**: Zod 스키마를 통한 입력 데이터 검증

### 2. 데이터 검증
- ✅ **Zod 스키마 적용**: 모든 주요 데이터 구조에 Zod 스키마 정의
- ✅ **런타임 검증**: 데이터 저장/로드 시 검증 수행

### 3. Firebase 보안 규칙
- ✅ **firestore.rules 생성**: 사용자별 데이터 접근 제어
- ✅ **인증 기반 접근**: 인증된 사용자만 자신의 데이터에 접근
- ✅ **공유 데이터 규칙**: 공유 링크를 통한 읽기 전용 접근 허용

### 4. HTTP 보안 헤더
- ✅ **X-Content-Type-Options**: nosniff 설정
- ✅ **X-Frame-Options**: DENY 설정 (클릭재킹 방지)
- ✅ **X-XSS-Protection**: 활성화
- ✅ **Referrer-Policy**: strict-origin-when-cross-origin
- ✅ **Permissions-Policy**: 불필요한 권한 제한

### 5. Content Security Policy (CSP)
- ✅ **CSP 메타 태그 추가**: `index.html`에 CSP 설정
- ✅ **스크립트 소스 제한**: 허용된 CDN만 사용
- ✅ **인라인 스크립트 제어**: 필요한 경우에만 'unsafe-inline' 허용

---

## 📋 Firebase 보안 규칙 상세

### 사용자 데이터 접근 규칙

```javascript
match /users/{userId} {
  // 인증된 사용자만 자신의 데이터에 접근 가능
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**보안 포인트**:
- 사용자는 오직 자신의 `userId`와 일치하는 문서만 접근 가능
- 인증되지 않은 사용자는 접근 불가
- 다른 사용자의 데이터 접근 차단

### 공유 데이터 접근 규칙

```javascript
match /shared/{shareId} {
  // 인증 없이 읽기 가능 (공유 링크를 통한 접근)
  allow read: if true;
  
  // 인증된 사용자만 작성 가능
  allow create: if request.auth != null;
  
  // 작성자만 수정/삭제 가능
  allow update, delete: if request.auth != null && 
                          request.auth.uid == resource.data.authorId;
}
```

**보안 포인트**:
- 공유 링크를 통한 읽기는 허용
- 작성은 인증된 사용자만 가능
- 수정/삭제는 작성자만 가능

### 방문자 수 데이터 규칙

```javascript
match /visitors/{document=**} {
  // 모든 사용자가 읽기 가능
  allow read: if true;
  
  // 인증된 사용자만 증가 가능
  allow create, update: if request.auth != null;
}
```

**보안 포인트**:
- 읽기는 공개 (방문자 수 표시)
- 증가는 인증된 사용자만 가능 (중복 방지는 애플리케이션 로직에서 처리)

---

## 🔒 Content Security Policy (CSP)

### 허용된 리소스

1. **Scripts**:
   - `'self'`: 같은 출처
   - CDN: `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`
   - Firebase: `*.firebase.com`, `*.firebaseapp.com`
   - Google APIs: `*.googleapis.com`

2. **Styles**:
   - `'self'`
   - Google Fonts: `fonts.googleapis.com`

3. **Fonts**:
   - Google Fonts: `fonts.gstatic.com`

4. **Connections**:
   - Firebase 서비스
   - Sentry (에러 리포팅)

### 제한 사항

- `object-src 'none'`: 플러그인 차단
- `form-action 'self'`: 폼 제출은 같은 출처만 허용
- `base-uri 'self'`: Base URL은 같은 출처만 허용

---

## ⚠️ CSRF (Cross-Site Request Forgery) 보호

### Firebase 자동 CSRF 보호

Firebase는 자동으로 CSRF 보호를 제공합니다:
- 모든 Firestore 요청은 Firebase SDK를 통해서만 가능
- 사용자 인증 토큰이 자동으로 포함됨
- 브라우저에서 직접 Firestore API 호출 불가

### 추가 보호 방법

1. **SameSite 쿠키** (Firebase가 자동 처리)
2. **인증 토큰 검증** (Firebase가 자동 처리)
3. **Origin 검증** (Firebase 보안 규칙에서 처리)

---

## 🔍 보안 검증 체크리스트

### 정기적으로 확인할 사항

- [ ] Firebase 보안 규칙 배포 확인
- [ ] CSP 헤더 동작 확인
- [ ] XSS 공격 테스트
- [ ] 인증되지 않은 데이터 접근 테스트
- [ ] 다른 사용자의 데이터 접근 테스트

### 배포 전 확인

- [ ] Firebase 보안 규칙 테스트
- [ ] CSP 위반 확인 (브라우저 콘솔)
- [ ] 보안 헤더 확인 (브라우저 개발자 도구)
- [ ] 인증 플로우 테스트

---

## 🚀 Firebase 보안 규칙 배포

### 배포 명령어

```bash
# Firebase CLI 로그인 (필요시)
firebase login

# 보안 규칙 배포
firebase deploy --only firestore:rules
```

### 테스트 모드

Firebase 콘솔에서 보안 규칙을 테스트할 수 있습니다:
1. Firebase Console → Firestore Database → Rules 탭
2. "Rules Playground" 사용
3. 다양한 시나리오 테스트

---

## 📝 보안 모범 사례

### 1. 최소 권한 원칙
- 사용자에게 필요한 최소한의 권한만 부여
- 공개 데이터는 읽기 전용으로 제한

### 2. 데이터 검증
- 클라이언트와 서버 모두에서 검증
- Zod 스키마를 통한 타입 안전성 확보

### 3. 인증 확인
- 모든 민감한 작업에 인증 필수
- 세션 타임아웃 관리 (Firebase가 자동 처리)

### 4. 로깅 및 모니터링
- Sentry를 통한 에러 모니터링
- 의심스러운 활동 추적

### 5. 정기 업데이트
- Firebase SDK 정기 업데이트
- 보안 패치 즉시 적용

---

## 🐛 보안 취약점 보고

보안 취약점을 발견한 경우:
1. 즉시 프로젝트 관리자에게 보고
2. 공개 전까지 정보 보안 유지
3. 수정 후 재배포

---

## 📚 참고 자료

- [Firebase 보안 규칙 문서](https://firebase.google.com/docs/firestore/security/get-started)
- [Content Security Policy 가이드](https://developer.mozilla.org/ko/docs/Web/HTTP/CSP)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**작업 완료**: 보안 강화 체크리스트 작성 완료 ✅

