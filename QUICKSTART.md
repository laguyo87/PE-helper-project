# 빠른 시작 가이드

## 🚀 로컬 개발 서버로 실행하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 시작
```bash
npm start
```

또는

```bash
npm run dev  # 빌드 + 서버 시작
```

### 3. 브라우저에서 접속
```
http://localhost:8080
```

---

## ❌ 피해야 할 것

### 절대 하지 말아야 할 것
- ❌ `index.html` 파일을 브라우저에서 직접 열기 (`file://` 프로토콜)
- ❌ 파일 탐색기에서 `index.html` 더블클릭

### 왜 안 되는가?
ES6 모듈(`import/export`)과 동적 임포트는 보안상의 이유로 `file://` 프로토콜에서 차단됩니다. 
CORS 정책으로 인해 다음 에러들이 발생합니다:
- `Failed to fetch dynamically imported module`
- `Cross origin requests are only supported for protocol schemes: http, https`
- `net::ERR_FAILED`

### 올바른 방법
반드시 HTTP 서버(`http://` 또는 `https://`)를 통해 접근해야 합니다.

---

## 🔧 문제 해결

### 서버가 시작되지 않는 경우
1. **포트 8080이 이미 사용 중인 경우**
   ```bash
   # server.js 파일에서 PORT 번호 변경 (예: 8081)
   ```

2. **Node.js가 설치되지 않은 경우**
   ```bash
   # Node.js 16 이상 설치 필요
   node --version  # 버전 확인
   ```

### 여전히 CORS 에러가 발생하는 경우
1. 브라우저 주소창을 확인하세요
   - ✅ 올바름: `http://localhost:8080`
   - ❌ 잘못됨: `file:///Users/...`

2. 브라우저 캐시를 삭제하고 하드 새로고침 (`Ctrl+Shift+R` 또는 `Cmd+Shift+R`)

---

## 📝 추가 정보

더 자세한 내용은 [README.md](README.md)를 참고하세요.

