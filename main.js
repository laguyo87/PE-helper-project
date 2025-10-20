    // ========================================
    // 모듈 import
    // ========================================
    import { 
      initializeVersionManager, 
      APP_VERSION, 
      updateVersionDisplay 
    } from './js/modules/versionManager.js';
    
    import { 
      initializeAuthManager,
      setupGlobalAuthFunctions 
    } from './js/modules/authManager.js';
    
    import { 
      initializeDataManager,
      DataManager
    } from './js/modules/dataManager.js';
    
    import { 
      initializeVisitorManager,
      VisitorManager
    } from './js/modules/visitorManager.js';
    
    import { 
      initializeLeagueManager,
      LeagueManager
    } from './js/modules/leagueManager.js';
    
    import { 
      PapsManager
    } from './js/modules/papsManager.js';
    
    import { 
      initializeTournamentManager,
      TournamentManager
    } from './js/modules/tournamentManager.js';
    
    // ========================================
    // 앱 상태 및 전역 변수
    // ========================================
    let authManager = null;
    let authManagerInitialized = false;
    let dataManager = null;
    let dataManagerInitialized = false;
    let visitorManager = null;
    let visitorManagerInitialized = false;
    let leagueManager = null;
    let leagueManagerInitialized = false;
    let tournamentManager = null;
    let tournamentManagerInitialized = false;
    let appMode = 'progress';
    
    // 버전 관리 시스템 초기화
    console.log('main.js 로딩 시작');
    if (!initializeVersionManager()) {
      console.error('버전 관리 시스템 초기화 실패');
    }
    console.log('버전 관리 시스템 초기화 완료');
    
    // AuthManager 즉시 초기화 (DOM 로딩과 독립적으로)
    console.log('AuthManager 즉시 초기화 시작');
    authManager = initializeAuthManager();
    setupGlobalAuthFunctions();
    authManagerInitialized = true;
    console.log('AuthManager 즉시 초기화 완료');
    
    // DataManager 즉시 초기화 (DOM 로딩과 독립적으로)
    console.log('DataManager 즉시 초기화 시작');
    try {
        dataManager = initializeDataManager();
        dataManagerInitialized = true;
        console.log('DataManager 즉시 초기화 완료');
    } catch (error) {
        console.error('DataManager 초기화 실패:', error);
        dataManager = null;
        dataManagerInitialized = false;
    }
    
    // VisitorManager 즉시 초기화 (DOM 로딩과 독립적으로)
    console.log('VisitorManager 즉시 초기화 시작');
    try {
        visitorManager = initializeVisitorManager();
        visitorManagerInitialized = true;
        console.log('VisitorManager 즉시 초기화 완료');
    } catch (error) {
        console.error('VisitorManager 초기화 실패:', error);
        visitorManager = null;
        visitorManagerInitialized = false;
    }
    
    let leagueData = { classes: [], students: [], games: [], selectedClassId: null };
    
    // LeagueManager 즉시 초기화 (DOM 로딩과 독립적으로)
    console.log('LeagueManager 즉시 초기화 시작');
    try {
        leagueManager = initializeLeagueManager(leagueData);
        leagueManagerInitialized = true;
        console.log('LeagueManager 즉시 초기화 완료');
    } catch (error) {
        console.error('LeagueManager 초기화 실패:', error);
        leagueManager = null;
        leagueManagerInitialized = false;
    }
    let tournamentData = { tournaments: [], activeTournamentId: null };
    
    // TournamentManager 즉시 초기화 (DOM 로딩과 독립적으로)
    console.log('TournamentManager 즉시 초기화 시작');
    try {
        tournamentManager = initializeTournamentManager(tournamentData);
        tournamentManagerInitialized = true;
        console.log('TournamentManager 즉시 초기화 완료');
    } catch (error) {
        console.error('TournamentManager 초기화 실패:', error);
        tournamentManager = null;
        tournamentManagerInitialized = false;
    }
    let papsData = { classes: [], activeClassId: null };
    
    // PapsManager 즉시 초기화 (DOM 로딩과 독립적으로)
    console.log('PapsManager 즉시 초기화 시작');
    let papsManager;
    try {
        papsManager = new PapsManager(papsData, $, saveDataToFirestore, cleanupSidebar);
        console.log('PapsManager 즉시 초기화 완료');
    } catch (error) {
        console.error('PapsManager 초기화 실패:', error);
        papsManager = null;
    }
    
    let progressClasses = [];
    let progressSelectedClassId = '';
    let currentUser = null;
    let dbDebounceTimer;
    const adminUid = "4LRORiF8UcXB6BYMrs5bZi2UEyy2"; // 관리자 UID가 여기에 입력되었습니다.
    
    // 브라우저 호환성을 위한 헬퍼 함수들
    const $ = s => {
        try {
            return document.querySelector(s);
        } catch (e) {
            console.error('querySelector error:', e);
            return null;
        }
    };
    const $$ = s => {
        try {
            return document.querySelectorAll(s);
        } catch (e) {
            console.error('querySelectorAll error:', e);
            return [];
        }
    };
    
    // 브라우저 호환성 체크
    function checkBrowserCompatibility() {
        const userAgent = navigator.userAgent;
        const isIE = /MSIE|Trident/.test(userAgent);
        const isOldChrome = /Chrome\/([0-9]+)/.test(userAgent) && parseInt(RegExp.$1) < 60;
        const isOldFirefox = /Firefox\/([0-9]+)/.test(userAgent) && parseInt(RegExp.$1) < 60;
        const isWindows = /Windows/.test(userAgent);
        
        if (isWindows) {
            console.log('Windows 환경 감지됨');
            console.log('User Agent:', userAgent);
            console.log('Screen resolution:', screen.width + 'x' + screen.height);
            console.log('Viewport size:', window.innerWidth + 'x' + window.innerHeight);
        }
        
        if (isIE) {
            alert('Internet Explorer는 지원되지 않습니다. Chrome, Firefox, Edge를 사용해주세요.');
            return false;
        }
        
        if (isOldChrome || isOldFirefox) {
            console.warn('구형 브라우저 감지됨. 일부 기능이 제한될 수 있습니다.');
        }
        
        if (isWindows && !CSS.supports('display', 'grid')) {
            console.warn('CSS Grid가 지원되지 않습니다. 레이아웃이 깨질 수 있습니다.');
        }
        return true;
    }

    // ========================================
    // 방문자 통계 - VisitorManager 사용
    // ========================================
    async function updateVisitorCount() {
        if (!visitorManager) {
            console.error('VisitorManager가 초기화되지 않음');
                return;
            }
            
        // VisitorManager를 통해 방문자 수 업데이트
        const result = await visitorManager.updateVisitorCount();
        
        if (result.success) {
            console.log('방문자 수 업데이트 완료:', result.count);
            } else {
            console.error('방문자 수 업데이트 실패:', result.error);
        }
    }
    
    async function loadVisitorCount() {
        if (!visitorManager) {
            console.error('VisitorManager가 초기화되지 않음');
                return;
            }
        
        // VisitorManager를 통해 방문자 수 로드
        const result = await visitorManager.loadVisitorCount();
        
        if (result.success) {
            console.log('방문자 수 로드 완료:', result.count);
            } else {
            console.error('방문자 수 로드 실패:', result.error);
        }
    }
    
    function displayVisitorCount(count, startDate) {
        if (!visitorManager) {
            console.error('VisitorManager가 초기화되지 않음');
            return;
        }
        
        // VisitorManager를 통해 방문자 수 표시
        visitorManager.displayVisitorCount(count, startDate);
    }
    
    // 방문자 수 테스트용 함수 (개발자 콘솔에서 사용)
    function resetVisitorCountLocal() {
        if (!visitorManager) {
            console.error('VisitorManager가 초기화되지 않음');
            return;
        }
        
        // VisitorManager를 통해 방문자 수 카운트 세션 초기화
        visitorManager.resetVisitorCount();
    }
    
    // 전역 함수로 등록 (개발자 콘솔에서 사용)
    window.resetVisitorCount = resetVisitorCountLocal;

    // ========================================
    // 팝업 관련 함수들
    // ========================================
    function openRankingPopup() {
        const classId = leagueData.selectedClassId;
        if (!classId) return;
        const currentClass = leagueData.classes.find(c => c.id === classId);
        const popupTitle = document.getElementById('popupTitle');
        const rankingPopup = document.getElementById('rankingPopup');
        
        if (popupTitle && rankingPopup) {
            popupTitle.textContent = `${currentClass.name} - 실시간 순위표`;
            if (leagueManager) {
                leagueManager.renderRankingsTable(document.getElementById('popupRankingsTable'));
            }
            rankingPopup.classList.remove('hidden');
        }
    }
    
    function closeRankingPopup() {
        const rankingPopup = document.getElementById('rankingPopup');
        if (rankingPopup) {
            rankingPopup.classList.add('hidden');
        }
    }

    function openHelpPopup() {
        const helpPopup = document.getElementById('helpPopup');
        if (helpPopup) {
            helpPopup.classList.remove('hidden');
        }
    }
    
    function closeHelpPopup() {
        const helpPopup = document.getElementById('helpPopup');
        if (helpPopup) {
            helpPopup.classList.add('hidden');
        }
    }

    // 전역 함수로 등록 (기본 함수들)
    window.openRankingPopup = openRankingPopup;
    window.closeRankingPopup = closeRankingPopup;
    window.openHelpPopup = openHelpPopup;
    window.closeHelpPopup = closeHelpPopup;
    window.shareView = shareView;
    window.shareAllClassesSchedule = shareAllClassesSchedule;
    window.printRankings = printRankings;

    async function updateProgressVisitorCount() {
        if (!visitorManager) {
            console.error('VisitorManager가 초기화되지 않음');
            return;
        }
        
        // VisitorManager를 통해 진도 관리 모드 방문자 수 업데이트
        const result = await visitorManager.updateProgressVisitorCount();
        
        if (result.success) {
            console.log('진도 관리 모드 방문자 수 업데이트 완료:', result.count);
        } else {
            console.error('진도 관리 모드 방문자 수 업데이트 실패:', result.error);
        }
    }

    // ========================================
    // 인증 관리자 초기화 (Firebase 준비 후)
    // ========================================

    // updateLoginStatus 함수는 authManager에서 처리됨
    // showAuthForm 함수는 authManager에서 처리됨

    // signInWithGoogle 함수는 authManager에서 처리됨

    // handleAuthError 함수는 authManager에서 처리됨

    // handlePasswordReset 함수는 authManager에서 처리됨
    async function handlePasswordReset_OLD(e) {
        e.preventDefault();
        const { auth, sendPasswordResetEmail } = window.firebase;
        const email = $('#reset-email').value;
        const messageElement = $('#reset-message');

        messageElement.classList.remove('hidden', 'success-message', 'error-message');

        if (!email) {
            messageElement.textContent = '이메일을 입력해주세요.';
            messageElement.classList.add('error-message');
            messageElement.classList.remove('hidden');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            messageElement.textContent = "비밀번호 재설정 이메일이 발송되었습니다. 받은편지함을 확인해주세요.";
            messageElement.classList.add('success-message');
        } catch (error) {
            let friendlyMessage = "오류가 발생했습니다. 다시 시도해주세요.";
            if (error.code === 'auth/user-not-found') {
                friendlyMessage = "가입되지 않은 이메일입니다.";
            } else if (error.code === 'auth/invalid-email') {
                friendlyMessage = "유효하지 않은 이메일 형식입니다.";
            }
            messageElement.textContent = friendlyMessage;
            messageElement.classList.add('error-message');
        } finally {
            messageElement.classList.remove('hidden');
        }
    }

    // ========================================
    // 데이터 동기화 (Firebase <-> 로컬) - DataManager 사용
    // ========================================
    async function saveDataToFirestore(retryCount = 0) {
        if (!dataManager) {
            console.error('DataManager가 초기화되지 않음');
          return;
      }
      
        // 현재 사용자 설정
        dataManager.setCurrentUser(currentUser);
        
        // 데이터 구성
        const appData = {
            leagues: leagueData,
            tournaments: tournamentData,
            paps: papsData,
                  progress: {
                classes: progressClasses,
                      selectedClassId: progressSelectedClassId
                  },
                  lastUpdated: Date.now()
              };

        // DataManager를 통해 저장
        await dataManager.saveDataToFirestore(appData, { retryCount });
    }

    async function loadDataFromFirestore(userId, retryCount = 0) {
        if (!dataManager) {
            console.error('DataManager가 초기화되지 않음');
                  return;
              }
              
        console.log('=== loadDataFromFirestore 호출됨 ===');
        console.log('userId:', userId);
        console.log('retryCount:', retryCount);
        
        // DataManager를 통해 데이터 로드
        const appData = await dataManager.loadDataFromFirestore(userId, { retryCount });
        
        if (appData) {
            // 로드된 데이터를 전역 변수에 설정
            leagueData = appData.leagues;
            tournamentData = appData.tournaments;
            papsData = appData.paps;
            progressClasses = appData.progress.classes;
            progressSelectedClassId = appData.progress.selectedClassId;
                
                console.log('=== 데이터 로드 완료 ===');
                console.log('leagueData:', leagueData);
                console.log('tournamentData:', tournamentData);
                console.log('papsData:', papsData);
                console.log('progressClasses:', progressClasses);
                
                // 데이터 유효성 검사
                validateLoadedData();
            } else {
            console.log('데이터 로드 실패, 기본 데이터 사용');
            const defaultData = dataManager.getDefaultData();
            leagueData = defaultData.leagues;
            tournamentData = defaultData.tournaments;
            papsData = defaultData.paps;
            progressClasses = defaultData.progress.classes;
            progressSelectedClassId = defaultData.progress.selectedClassId;
            }
            
            // 데이터 로드 완료 후 렌더링
            console.log('데이터 로드 완료, 앱 렌더링 시작');
            setTimeout(() => {
                renderApp();
            }, 100); // 약간의 지연을 두어 DOM이 준비되도록 함
    }
    


    // ========================================
    // 데이터 새로고침
    // ========================================
    function refreshData() {
        console.log('=== 수동 데이터 새로고침 시작 ===');
        
        if (!currentUser) {
            console.log('사용자가 로그인되지 않음, 새로고침 불가');
            alert('로그인이 필요합니다.');
            return;
        }
        
        console.log('사용자 UID:', currentUser.uid);
        console.log('데이터 새로고침 시작...');
        
        // 로딩 표시
        $('#loader').classList.remove('hidden');
        
        // 데이터 새로고침
        loadDataFromFirestore(currentUser.uid, 0);
    }

    // ========================================
    // 로컬 스토리지 저장 (로그인하지 않은 사용자용)
    // ========================================

    // ========================================
    // 로컬 데이터 로딩 (로그인하지 않은 사용자용)
    // ========================================
    function loadLocalData() {
        if (!dataManager) {
            console.error('DataManager가 초기화되지 않음');
            return;
        }
        
        console.log('로컬 데이터 로딩 시작');
        
        // DataManager를 통해 로컬 데이터 로드
        const appData = dataManager.loadFromLocalStorage();
        
        if (appData) {
            // 로드된 데이터를 전역 변수에 설정
            leagueData = appData.leagues;
            tournamentData = appData.tournaments;
            papsData = appData.paps;
            progressClasses = appData.progress.classes;
            progressSelectedClassId = appData.progress.selectedClassId;
            
            console.log('로컬 데이터 로딩 완료');
            console.log('leagueData:', leagueData);
            console.log('tournamentData:', tournamentData);
            console.log('papsData:', papsData);
            console.log('progressClasses:', progressClasses);
        } else {
            console.log('로컬 스토리지에 데이터 없음, 기본 데이터 사용');
            const defaultData = dataManager.getDefaultData();
            leagueData = defaultData.leagues;
            tournamentData = defaultData.tournaments;
            papsData = defaultData.paps;
            progressClasses = defaultData.progress.classes;
            progressSelectedClassId = defaultData.progress.selectedClassId;
        }
    }

    // ========================================
    // 폴백 데이터 로딩
    // ========================================
    function loadFallbackData() {
        if (!dataManager) {
            console.error('DataManager가 초기화되지 않음');
            return;
        }
        
        console.log('=== 폴백 데이터 로딩 시작 ===');
        
        // DataManager를 통해 폴백 데이터 로드
        const appData = dataManager.loadFallbackData();
        
        // 로드된 데이터를 전역 변수에 설정
        leagueData = appData.leagues;
        tournamentData = appData.tournaments;
        papsData = appData.paps;
        progressClasses = appData.progress.classes;
        progressSelectedClassId = appData.progress.selectedClassId;
            
            console.log('=== 폴백 데이터 로딩 완료 ===');
            console.log('leagueData:', leagueData);
            console.log('tournamentData:', tournamentData);
            console.log('papsData:', papsData);
            console.log('progressClasses:', progressClasses);
    }


    // ========================================
    // 데이터 유효성 검사
    // ========================================
    function validateLoadedData() {
        if (!dataManager) {
            console.error('DataManager가 초기화되지 않음');
            return;
        }
        
        console.log('=== 데이터 유효성 검사 시작 ===');
        
        // 현재 데이터를 AppData 형태로 구성
        const appData = {
            leagues: leagueData,
            tournaments: tournamentData,
            paps: papsData,
            progress: {
                classes: progressClasses,
                selectedClassId: progressSelectedClassId
            },
            lastUpdated: Date.now()
        };
        
        // DataManager를 통해 데이터 유효성 검사
        dataManager.validateLoadedData(appData);
        
        // 검사된 데이터를 다시 전역 변수에 설정
        leagueData = appData.leagues;
        tournamentData = appData.tournaments;
        papsData = appData.paps;
        progressClasses = appData.progress.classes;
        progressSelectedClassId = appData.progress.selectedClassId;
        
        console.log('=== 데이터 유효성 검사 완료 ===');
    }

    // ========================================
    // 사이드바 정리 함수
    // ========================================
    function cleanupSidebar() {
        console.log('사이드바 정리 시작');
        
        // 기존 동적으로 추가된 요소들 제거
        const progressClassList = $('#progressClassList');
        if (progressClassList) {
            progressClassList.remove();
        }
        
        
        // 사이드바 폼 컨테이너 초기화
        const sidebarFormContainer = $('#sidebar-form-container');
        const sidebarListContainer = $('#sidebar-list-container');
        if (sidebarFormContainer) sidebarFormContainer.innerHTML = '';
        if (sidebarListContainer) sidebarListContainer.innerHTML = '';
        
        console.log('사이드바 정리 완료');
    }

    // ========================================
    // 모드 전환 및 메인 렌더링
    // ========================================
    function switchMode(mode) {
        console.log('모드 전환:', appMode, '->', mode);
        
        appMode = mode;
        $$('.mode-switch-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        $('#league-excel-actions').style.display = mode === 'league' ? 'flex' : 'none';
        $('#paps-excel-actions').style.display = mode === 'paps' ? 'flex' : 'none';
        $('#liveRankingBtn').classList.toggle('hidden', mode !== 'league' || !leagueData.selectedClassId);
        
        // 리그전 수업 모드일 때 body에 league-mode 클래스 추가
        document.body.classList.toggle('league-mode', mode === 'league');
        // PAPS 수업 모드일 때 body에 paps-mode 클래스 추가
        document.body.classList.toggle('paps-mode', mode === 'paps');
        
        // 수업 진도표 모드일 때 body에 클래스 추가
        if (mode === 'progress') {
            document.body.classList.add('progress-mode');
        } else {
            document.body.classList.remove('progress-mode');
        }
        
        // 모드 전환 시 사이드바 정리
        cleanupSidebar();
        
        renderApp();
    }

    function renderApp() {
        console.log('renderApp 호출됨');
        console.log('currentUser:', currentUser);
        console.log('appMode:', appMode);
        console.log('leagueData:', leagueData);
        console.log('tournamentData:', tournamentData);
        console.log('papsData:', papsData);
        console.log('progressClasses:', progressClasses);
        
        // 로그인하지 않은 사용자도 모든 기능 사용 가능
        if (!currentUser) {
            console.log('사용자가 로그인되지 않음, 로컬 모드로 모든 기능 제공');
            $('#auth-container').classList.add('hidden');
            $('#app-root').classList.remove('hidden');
            // 로컬 스토리지에서 데이터 로드
            loadLocalData();
        }
        
        // 로그인 상태 UI 업데이트
        if (!authManager) {
            console.log('AuthManager가 초기화되지 않음, 초기화 시도');
            authManager = initializeAuthManager();
            setupGlobalAuthFunctions();
            authManagerInitialized = true;
        }
        authManager.updateLoginStatus();
        
        // DataManager 초기화 확인
        if (!dataManager) {
            console.log('DataManager가 초기화되지 않음, 초기화 시도');
            dataManager = initializeDataManager();
            dataManagerInitialized = true;
        }
        
        // DataManager에 현재 사용자 설정
        dataManager.setCurrentUser(currentUser);
        
        // VisitorManager 초기화 확인
        if (!visitorManager) {
            console.log('VisitorManager가 초기화되지 않음, 초기화 시도');
            visitorManager = initializeVisitorManager();
            visitorManagerInitialized = true;
        }
        
        // LeagueManager 초기화 확인
        if (!leagueManager) {
            console.log('LeagueManager가 초기화되지 않음, 초기화 시도');
            leagueManager = initializeLeagueManager(leagueData);
            leagueManagerInitialized = true;
        }
        
        // TournamentManager 초기화 확인
        if (!tournamentManager) {
            console.log('TournamentManager가 초기화되지 않음, 초기화 시도');
            tournamentManager = initializeTournamentManager(tournamentData);
            tournamentManagerInitialized = true;
        }
        
        // LeagueManager에 저장 콜백 설정
        if (leagueManager) {
            leagueManager.setSaveCallback(saveDataToFirestore);
            // LeagueManager의 데이터를 최신 leagueData로 동기화
            leagueManager.setLeagueData(leagueData);
            // LeagueManager에서 데이터 변경 시 main.js의 leagueData도 업데이트
            leagueManager.setDataUpdateCallback((newLeagueData) => {
                leagueData = newLeagueData;
            });
            // 전역으로 등록하여 HTML에서 사용할 수 있도록 함
            window.leagueManager = leagueManager;
            
            // 리그전 관련 전역 함수들 등록
            window.editStudentNote = (id) => leagueManager.editStudentNote(parseInt(id));
            window.editStudentName = (id) => leagueManager.editStudentName(parseInt(id));
            window.removeStudent = (id) => leagueManager.removeStudent(parseInt(id));
            window.selectClass = (id) => leagueManager.selectClass(parseInt(id));
            window.editClassNote = (id) => leagueManager.editClassNote(parseInt(id));
            window.editClassName = (id) => leagueManager.editClassName(parseInt(id));
            window.deleteClass = (id) => leagueManager.deleteClass(parseInt(id));
            window.createClass = () => leagueManager.createClass();
            window.addStudent = () => leagueManager.addStudent();
            window.bulkAddStudents = () => leagueManager.bulkAddStudents();
            window.toggleGameHighlight = (gameId) => {
                console.log('전역 toggleGameHighlight 호출됨, gameId:', gameId, 'type:', typeof gameId);
                const numGameId = typeof gameId === 'string' ? parseInt(gameId) : gameId;
                console.log('변환된 gameId:', numGameId);
                if (leagueManager) {
                    leagueManager.toggleGameHighlight(numGameId);
                } else {
                    console.error('leagueManager가 없습니다');
                }
            };
            // clearAllHighlights 함수를 leagueManager 초기화 후에 다시 등록
            window.clearAllHighlights = () => {
                if (leagueManager) {
                    leagueManager.clearAllHighlights();
                } else {
                    console.error('leagueManager가 초기화되지 않아 clearAllHighlights를 호출할 수 없습니다.');
                }
            };
            window.generateGames = () => leagueManager.generateGames();
            window.updateLeagueScore = (gameId, player, score) => leagueManager.updateLeagueScore(parseInt(gameId), player, score);
            window.updateGameNote = (gameId, note) => leagueManager.updateGameNote(parseInt(gameId), note);
        }
        
        // TournamentManager에 저장 콜백 설정
        if (tournamentManager) {
            tournamentManager.setSaveCallback(saveDataToFirestore);
            // TournamentManager의 데이터를 최신 tournamentData로 동기화
            tournamentManager.setTournamentData(tournamentData);
            // TournamentManager에서 데이터 변경 시 main.js의 tournamentData도 업데이트
            tournamentManager.setDataUpdateCallback((newTournamentData) => {
                tournamentData = newTournamentData;
            });
            // 전역으로 등록하여 HTML에서 사용할 수 있도록 함
            window.tournamentManager = tournamentManager;
            
            // 토너먼트 관련 전역 함수들 등록
            window.renderTournamentUI = () => tournamentManager.renderTournamentUI();
            window.renderTournamentList = () => tournamentManager.renderTournamentList();
            window.renderTournamentDashboard = () => tournamentManager.renderTournamentDashboard();
            window.createTournament = () => tournamentManager.createTournament();
            window.selectTournament = (id) => tournamentManager.selectTournament(id);
            window.deleteTournament = (id) => tournamentManager.deleteTournament(id);
            window.showTournamentSettings = (id) => tournamentManager.showTournamentSettings(id);
            window.renderTournamentView = (tourney) => tournamentManager.renderTournamentView(tourney);
            window.updateTournamentSettings = () => tournamentManager.updateTournamentSettings();
            window.addTeamToTournament = () => tournamentManager.addTeamToTournament();
            window.removeTeamFromTournament = (teamName) => tournamentManager.removeTeamFromTournament(teamName);
            window.editTeamName = (oldName, newName) => tournamentManager.editTeamName(oldName, newName);
            window.buildBracket = (tourney) => tournamentManager.buildBracket(tourney);
            window.onScoreInputTournament = (matchId, side, value) => tournamentManager.onScoreInputTournament(matchId, side, value);
            window.propagateWinners = (tourney) => tournamentManager.propagateWinners(tourney);
            window.renderBracket = (tourney, isReadOnly) => tournamentManager.renderBracket(tourney, isReadOnly);
            window.renderMatchCard = (match, rIdx, tourney, isReadOnly) => tournamentManager.renderMatchCard(match, rIdx, tourney, isReadOnly);
        }
        
        // 데이터 로딩 상태 확인
        const hasData = leagueData.classes.length > 0 || 
                       tournamentData.tournaments.length > 0 || 
                       papsData.classes.length > 0 || 
                       progressClasses.length > 0;
        
        console.log('데이터 존재 여부:', hasData);
        console.log('리그 클래스 수:', leagueData.classes.length);
        console.log('토너먼트 수:', tournamentData.tournaments.length);
        console.log('PAPS 클래스 수:', papsData.classes.length);
        console.log('진도표 클래스 수:', progressClasses.length);
        
        if (appMode === 'league') {
            console.log('리그 UI 렌더링 시작');
            if (leagueManager) {
                leagueManager.renderLeagueUI();
            } else {
                console.error('LeagueManager가 초기화되지 않음');
            }
        } else         if (appMode === 'tournament') {
            console.log('토너먼트 UI 렌더링 시작');
            if (tournamentManager) {
                tournamentManager.renderTournamentUI();
            } else {
                console.error('TournamentManager가 초기화되지 않음');
            }
        } else if (appMode === 'paps') {
            console.log('PAPS UI 렌더링 시작');
            renderPapsUI();
        } else if (appMode === 'progress') {
            console.log('진도표 UI 렌더링 시작');
            renderProgressUI();
        } else {
            console.log('알 수 없는 모드:', appMode);
        }
    }

    // ========================================
    // 리그 UI 및 로직
    // ========================================
    // renderLeagueUI 함수는 leagueManager 모듈로 이동됨

    // renderClassList 함수는 leagueManager 모듈로 이동됨

    // renderLeagueDashboard 함수는 leagueManager 모듈로 이동됨

    function renderGameStats() {
        const container = $('#gameStatsContainer');
        if (!container) return;
        const classId = leagueData.selectedClassId;
        const allGames = leagueData.games.filter(g => g.classId === classId);
        const total = allGames.length;
        const completed = allGames.filter(g => g.isCompleted).length;
        const pending = total - completed;

        if (total === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="game-stats">
                <div class="stat-item">총경기수: <span class="stat-value stat-total">${total}</span></div>
                <div class="stat-item">완료: <span class="stat-value stat-completed">${completed}</span></div>
                <div class="stat-item">잔여: <span class="stat-value stat-pending">${pending}</span></div>
            </div>
        `;
    }
    
    function createClass() {
        const input = $('#className');
        const name = input.value.trim();
        if (name && !leagueData.classes.some(c => c.name === name)) {
            const newClass = { id: Date.now(), name, note: '' };
            leagueData.classes.push(newClass);
            input.value = '';
            selectClass(newClass.id);
            saveDataToFirestore();
        }
    }

    function selectClass(id) {
        leagueData.selectedClassId = id;
        $('#liveRankingBtn').classList.remove('hidden');
        renderApp();
        saveDataToFirestore();
    }

    function deleteClass(id) {
        showModal({
            title: '반 삭제', body: '반을 삭제하면 모든 학생과 경기 기록이 사라집니다. 정말 삭제하시겠습니까?',
            actions: [
                { text: '취소', callback: closeModal },
                { text: '삭제', type: 'danger', callback: () => {
                    leagueData.classes = leagueData.classes.filter(c => c.id !== id);
                    leagueData.students = leagueData.students.filter(s => s.classId !== id);
                    leagueData.games = leagueData.games.filter(g => g.classId !== id);
                    if (leagueData.selectedClassId === id) {
                        leagueData.selectedClassId = null;
                        $('#liveRankingBtn').classList.add('hidden');
                    }
                    saveDataToFirestore();
                    renderApp();
                    updateGenerateGamesButtonState(false);
                    closeModal();
                }}
            ]
        });
    }

    function addStudent() {
        const input = $('#studentName');
        if (!input) return;
        const name = input.value.trim();
        const classId = leagueData.selectedClassId;
        if (name && classId && !leagueData.students.some(s => s.name === name && s.classId === classId)) {
            leagueData.students.push({ id: Date.now(), name, classId, note: '' });
            input.value = '';
            saveDataToFirestore();
            renderStudentList();
        }
    }

    function bulkAddStudents() {
        showModal({
            title: '일괄 추가',
            body: `<p>참가자 이름을 쉼표(,)로 구분하여 입력하세요.</p><textarea id="modal-textarea" style="width:100%; height: 100px; margin-top: 8px;" class="field"></textarea>`,
            actions: [
                { text: '취소', callback: closeModal },
                { text: '추가', type: 'primary', callback: () => {
                    const namesStr = $('#modal-textarea').value;
                    const classId = leagueData.selectedClassId;
                    if (namesStr && classId) {
                        namesStr.split(',').map(n => n.trim()).filter(Boolean).forEach(name => {
                            if (!leagueData.students.some(s => s.name === name && s.classId === classId)) {
                                leagueData.students.push({ id: Date.now() + Math.random(), name, classId, note: '' });
                            }
                        });
                        saveDataToFirestore();
                        renderStudentList();
                    }
                    closeModal();
                }}
            ]
        });
    }
    
    function renderStudentList() {
        const grid = $('#studentListGrid');
        if (!grid) return;
        renderClassList(); // 학생 수 변경 반영
        const classStudents = leagueData.students.filter(s => s.classId === leagueData.selectedClassId);
        grid.innerHTML = classStudents.map(st => `
            <div class="student-item">
                <span>${st.name}</span>
                <div class="action-buttons row">
                    <button class="${(st.note || '').trim() ? 'has-note' : ''}" onclick="editStudentNote(${st.id})" data-tooltip="메모"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                    <button onclick="editStudentName(${st.id})" data-tooltip="수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button onclick="removeStudent(${st.id})" data-tooltip="삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            </div>
        `).join('');
    }
    
    function removeStudent(id) {
        leagueData.students = leagueData.students.filter(s => s.id !== id);
        leagueData.games = leagueData.games.filter(g => g.player1Id !== id && g.player2Id !== id);
        saveDataToFirestore();
        renderLeagueDashboard(leagueData.classes.find(c => c.id === leagueData.selectedClassId));
    }

    function generateGames() {
        const classId = leagueData.selectedClassId;
        const players = leagueData.students.filter(s => s.classId === classId);
        if (players.length < 2) return alert("선수가 2명 이상 필요합니다.");

        showModal({
            title: '일정 생성', body: '기존 경기 기록이 모두 사라집니다. 계속하시겠습니까?',
            actions: [
                { text: '취소', callback: closeModal },
                { text: '생성', type: 'danger', callback: () => {
                    leagueData.games = leagueData.games.filter(g => g.classId !== classId);
                    
                    let schedulePlayers = [...players];
                    if (schedulePlayers.length % 2 !== 0) {
                        schedulePlayers.push({ id: 'bye', name: 'BYE' });
                    }

                    const numPlayers = schedulePlayers.length;
                    const numRounds = numPlayers - 1;
                    const gamesPerRound = numPlayers / 2;
                    const newGames = [];

                    for (let r = 0; r < numRounds; r++) {
                        for (let i = 0; i < gamesPerRound; i++) {
                            const player1 = schedulePlayers[i];
                            const player2 = schedulePlayers[numPlayers - 1 - i];

                            if (player1.id !== 'bye' && player2.id !== 'bye') {
                                const p1_index = players.findIndex(p => p.id === player1.id);
                                const p2_index = players.findIndex(p => p.id === player2.id);

                                newGames.push({
                                    id: Date.now() + Math.random(),
                                    classId,
                                    player1Id: (p1_index < p2_index) ? player1.id : player2.id,
                                    player2Id: (p1_index < p2_index) ? player2.id : player1.id,
                                    player1Score: null, player2Score: null, isCompleted: false,
                                    completionDate: '', note: '', isHighlighted: false
                                });
                            }
                        }
                        const lastPlayer = schedulePlayers.pop();
                        schedulePlayers.splice(1, 0, lastPlayer);
                    }
                    
                    leagueData.games.push(...newGames);

                    saveDataToFirestore();
                    renderGamesTable();
                    updateGenerateGamesButtonState(true);
                    renderGameStats();
                    closeModal();
                }}
            ]
        });
    }

    function updateLeagueScore(gameId, player, score) {
        const game = leagueData.games.find(g => g.id === gameId);
        if (!game) return;
        
        const wasCompleted = game.isCompleted;
        game[player === 'player1' ? 'player1Score' : 'player2Score'] = score === '' ? null : Number(score);
        game.isCompleted = game.player1Score !== null && game.player2Score !== null;

        if (game.isCompleted && !wasCompleted) {
            game.completionDate = getFormattedDate();
        } else if (!game.isCompleted && wasCompleted) {
            game.completionDate = '';
        }

        saveDataToFirestore();
        renderGamesTable();
        renderRankingsTable();
        renderGameStats();
        if (!$('#rankingPopup').classList.contains('hidden')) {
             openRankingPopup(); // Refresh popup
        }
    }
    
    function updateGameNote(gameId, note) {
        const game = leagueData.games.find(g => g.id === gameId);
        if (game) {
            game.note = note.trim();
            saveDataToFirestore();
        }
    }
    

    function clearAllHighlights() {
        const classId = leagueData.selectedClassId;
        if (!classId) return;
        leagueData.games.forEach(g => {
            if (g.classId === classId) {
                g.isHighlighted = false;
            }
        });
        saveDataToFirestore();
        renderGamesTable();
    }

    function updateGenerateGamesButtonState(hasGames) {
        const button = $('#generateGamesBtn');
        if (!button) return;
        
        if (hasGames) {
            // 경기 일정이 있으면 버튼 비활성화
            button.disabled = true;
            button.style.background = 'var(--ink-muted)';
            button.style.cursor = 'not-allowed';
            button.setAttribute('data-tooltip', '이미 경기 일정이 생성되었습니다.');
        } else {
            // 경기 일정이 없으면 버튼 활성화
            button.disabled = false;
            button.style.background = 'var(--win)';
            button.style.cursor = 'pointer';
            button.setAttribute('data-tooltip', '현재 학생 명단으로 새 경기 일정을 생성합니다.');
        }
    }

    function renderGamesTable(isReadOnly = false) {
        const container = $('#gamesTableContent');
        if (!container) return;
        const classGames = leagueData.games.filter(g => g.classId === leagueData.selectedClassId);
        
        // 일정 생성 버튼 상태 업데이트
        updateGenerateGamesButtonState(classGames.length > 0);
        
        if (classGames.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--ink-muted);">생성된 경기가 없습니다.</div>`;
            return;
        }

        let html = `<table class="styled-table" style="min-width: 1000px;">
            <thead>
                <tr>
                    <th style="width: 60px; text-align: center;">#</th>
                    <th style="width: 120px;">선수 1</th>
                    <th style="width: 90px; text-align: center;">점수</th>
                    <th style="width: 60px; text-align: center;">vs</th>
                    <th style="width: 90px; text-align: center;">점수</th>
                    <th style="width: 120px;">선수 2</th>
                    <th style="width: 100px; text-align: center;">상태</th>
                    <th style="width: 150px; text-align: center;">입력 일시</th>
                    <th style="min-width: 200px;">메모</th>
                </tr>
            </thead>
            <tbody>`;
        
        html += classGames.map((game, i) => {
            const p1 = leagueData.students.find(s => s.id === game.player1Id);
            const p2 = leagueData.students.find(s => s.id === game.player2Id);
            if (!p1 || !p2) return '';
            
            const score1 = game.player1Score ?? '';
            const score2 = game.player2Score ?? '';
            const note = game.note || '';

            return `<tr class="${game.isHighlighted ? 'highlighted-row' : ''}" data-game-id="${game.id}">
                <td style="text-align: center;" ${!isReadOnly ? `onclick="window.toggleGameHighlight(${game.id})"` : ''} data-tooltip="경기 번호 강조" data-tooltip-align="left">
                    <span class="game-number ${game.isHighlighted ? 'highlighted-number' : ''}">${i+1}</span>
                </td>
                <td style="font-weight: 500;">${p1.name}</td>
                <td style="text-align: center;">
                    ${isReadOnly ? 
                        `<span style="font-weight: 500; color: var(--ink);">${score1}</span>` : 
                        `<input type="number" class="score" value="${score1}" onchange="updateLeagueScore(${game.id}, 'player1', this.value)">`
                    }
                </td>
                <td style="text-align: center; font-weight: bold; color: var(--ink-muted); font-size: 0.9rem;">vs</td>
                <td style="text-align: center;">
                    ${isReadOnly ? 
                        `<span style="font-weight: 500; color: var(--ink);">${score2}</span>` : 
                        `<input type="number" class="score" value="${score2}" onchange="updateLeagueScore(${game.id}, 'player2', this.value)">`
                    }
                </td>
                <td style="font-weight: 500;">${p2.name}</td>
                <td style="text-align: center;">
                    <span class="status-badge ${game.isCompleted ? 'completed' : 'pending'}" style="font-size: 0.75rem; padding: 4px 8px; border-radius: 12px; font-weight: 600;">
                        ${game.isCompleted ? '완료' : '대기'}
                    </span>
                </td>
                <td style="text-align: center; font-size: 0.8rem; color: var(--ink-muted);">${game.completionDate || ''}</td>
                <td>
                    ${isReadOnly ? 
                        `<span style="font-size: 0.8rem; color: var(--ink-muted);" title="${note}">${note}</span>` : 
                        `<input type="text" class="field" placeholder="메모..." value="${note}" onchange="updateGameNote(${game.id}, this.value)" style="width: 100%; padding: 6px 8px; font-size: 0.8rem; border: 1px solid var(--line); border-radius: 4px; background: var(--card-bg); transition: all 0.2s ease;">`
                    }
                </td>
            </tr>`;
        }).join('');
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    }
    
    function renderRankingsTable(targetEl = $('#rankingsTableContainer')) {
        if(!targetEl) return;
        
        const classId = leagueData.selectedClassId;
        if (!classId) {
            targetEl.innerHTML = `<div style="text-align:center; padding: 2rem;">반을 선택해주세요.</div>`;
            return;
        }

        const ranks = getRankingsData(classId);

        let currentRank = 0;
        let lastPoints = -1;
        let lastWins = -1;
        ranks.forEach((r, i) => {
            if (r.points !== lastPoints || r.wins !== lastWins) {
                currentRank = i + 1;
                lastPoints = r.points;
                lastWins = r.wins;
            }
            r.rank = currentRank;
        });

        let tableContent = `<thead><tr><th>순위</th><th>이름</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>승점</th></tr></thead><tbody>`;
        
        ranks.forEach(r => {
            tableContent += `<tr><td>${r.rank}</td><td>${r.name}</td><td>${r.gamesPlayed}</td><td class="rank-wins">${r.wins}</td><td>${r.draws}</td><td class="rank-losses">${r.losses}</td><td class="rank-points">${r.points}</td></tr>`;
        });
        tableContent += `</tbody>`;

        if (ranks.length === 0) {
             targetEl.innerHTML = `<div style="text-align:center; padding: 2rem;">참가자가 없습니다.</div>`;
        } else {
            if (targetEl.tagName.toLowerCase() === 'table') {
                 targetEl.innerHTML = tableContent;
            } else {
                 targetEl.innerHTML = `<table class="styled-table">${tableContent}</table>`;
            }
        }
    }

    function getRankingsData(classId) {
        if (!classId) return [];
        const players = leagueData.students.filter(s => s.classId === classId);
        const games = leagueData.games.filter(g => g.classId === classId && g.isCompleted);
        
        return players.map(p => {
            const stats = { wins: 0, losses: 0, draws: 0, points: 0, gamesPlayed: 0 };
            games.forEach(g => {
                let p1Score, p2Score;
                if (g.player1Id === p.id) { stats.gamesPlayed++; p1Score = g.player1Score; p2Score = g.player2Score; } 
                else if (g.player2Id === p.id) { stats.gamesPlayed++; p1Score = g.player2Score; p2Score = g.player1Score; } 
                else return;
                if (p1Score > p2Score) { stats.wins++; stats.points += 3; } 
                else if (p1Score < p2Score) { stats.losses++; } 
                else { stats.draws++; stats.points += 1; }
            });
            return { name: p.name, ...stats };
        }).sort((a,b) => b.points - a.points || b.wins - a.wins);
    }

    function exportAllLeaguesToExcel() {
        if (leagueData.classes.length === 0) return alert('내보낼 반이 없습니다.');
        const wb = XLSX.utils.book_new();

        leagueData.classes.forEach(cls => {
            const ranks = getRankingsData(cls.id);
            const rankingsData = ranks.map((r, i) => [i + 1, r.name, r.gamesPlayed, r.wins, r.draws, r.losses, r.points]);
            rankingsData.unshift(['순위', '이름', '경기', '승', '무', '패', '승점']);
            const wsRankings = XLSX.utils.aoa_to_sheet(rankingsData);
            const safeSheetNameRank = (cls.name.replace(/[\\/*?:"<>|]/g, "").substring(0, 25) + " 순위").trim();
            XLSX.utils.book_append_sheet(wb, wsRankings, safeSheetNameRank);

            const classGames = leagueData.games.filter(g => g.classId === cls.id);
            const gamesData = classGames.map((game, i) => {
                const p1 = leagueData.students.find(s => s.id === game.player1Id);
                const p2 = leagueData.students.find(s => s.id === game.player2Id);
                return [i + 1, p1?.name, game.player1Score, game.player2Score, p2?.name, game.isCompleted ? '완료' : '대기', game.completionDate, game.note];
            });
            gamesData.unshift(['#', '선수 1', '점수1', '점수2', '선수 2', '상태', '입력 일시', '메모']);
            const wsGames = XLSX.utils.aoa_to_sheet(gamesData);
            const safeSheetNameGames = (cls.name.replace(/[\\/*?:"<>|]/g, "").substring(0, 25) + " 일정").trim();
            XLSX.utils.book_append_sheet(wb, wsGames, safeSheetNameGames);
        });

        XLSX.writeFile(wb, `전체_반_리그전_결과_${getFormattedDate()}.xlsx`);
    }

    function editClassName(id) {
        const cls = leagueData.classes.find(c => c.id === id);
        if (!cls) return;
        showModal({
            title: '반 이름 수정',
            body: `<input id="modal-input" class="field" style="width:100%" value="${cls.name}">`,
            actions: [
                { text: '취소', callback: closeModal },
                { text: '저장', type: 'primary', callback: () => {
                    const newName = $('#modal-input').value.trim();
                    if (newName) {
                        cls.name = newName;
                        saveDataToFirestore();
                        renderLeagueUI();
                    }
                    closeModal();
                }}
            ]
        });
    }

    function editClassNote(id) {
        const cls = leagueData.classes.find(c => c.id === id);
        if (!cls) return;
        showModal({
            title: `${cls.name} - 메모`,
            body: `<textarea id="modal-textarea" style="width:100%; height: 100px;" class="field">${cls.note || ''}</textarea>`,
            actions: [
                { text: '취소', callback: closeModal },
                { text: '저장', type: 'primary', callback: () => {
                    cls.note = $('#modal-textarea').value.trim();
                    saveDataToFirestore();
                    renderClassList();
                    closeModal();
                }}
            ]
        });
    }

    function editStudentName(id) {
        const student = leagueData.students.find(s => s.id === id);
        if (!student) return;
        showModal({
            title: '학생 이름 수정',
            body: `<input id="modal-input" class="field" style="width:100%" value="${student.name}">`,
            actions: [
                { text: '취소', callback: closeModal },
                { text: '저장', type: 'primary', callback: () => {
                    const newName = $('#modal-input').value.trim();
                    if (newName) {
                        student.name = newName;
                        saveDataToFirestore();
                        renderLeagueDashboard(leagueData.classes.find(c => c.id === leagueData.selectedClassId));
                    }
                    closeModal();
                }}
            ]
        });
    }

    function editStudentNote(id) {
        const student = leagueData.students.find(s => s.id === id);
        if (!student) return;
        showModal({
            title: `${student.name} - 메모`,
            body: `<textarea id="modal-textarea" style="width:100%; height: 100px;" class="field">${student.note || ''}</textarea>`,
            actions: [
                { text: '취소', callback: closeModal },
                { text: '저장', type: 'primary', callback: () => {
                    student.note = $('#modal-textarea').value.trim();
                    saveDataToFirestore();
                    renderStudentList();
                    closeModal();
                }}
            ]
        });
    }

    // ========================================
    // 토너먼트 UI 및 로직
    // ========================================
    function renderTournamentUI() {
        // 기존 요소들 정리
        cleanupSidebar();
        
        $('#sidebarTitle').textContent = '토너먼트 목록';
        
        const isFirstTimeUser = leagueData.classes.length === 0 && tournamentData.tournaments.length === 0;

        let formHtml = `
            <div style="position: relative;" class="${isFirstTimeUser ? 'intro-container-active' : ''}">
                <div class="sidebar-form-group ${isFirstTimeUser ? 'intro-highlight' : ''}">
                    <input id="tournamentNameInput" type="text" placeholder="새로운 토너먼트 이름">
                    <button onclick="createTournament()" class="btn primary" data-tooltip="새로운 토너먼트를 목록에 추가합니다.">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
                <div class="intro-arrow">
                    <svg viewBox="0 0 24 24" fill="#F44336">
                       <path d="M2 12l8-8v5h12v6H10v5l-8-8z"/>
                    </svg>
                </div>
            </div>
        `;
        $('#sidebar-form-container').innerHTML = formHtml;
        
        renderTournamentList();
        const activeTournament = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if (activeTournament) {
            renderTournamentDashboard(activeTournament);
        } else {
            $('#content-wrapper').innerHTML = `
                <div class="placeholder-view">
                    <div class="placeholder-content">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <h3>토너먼트를 선택하여 시작하세요</h3>
                        <p>왼쪽에서 토너먼트를 선택하거나 새로 만들어주세요.</p>
                    </div>
                </div>`;
        }
    }
    
    function renderTournamentList() {
        const list = $('#sidebar-list-container');
        list.innerHTML = '';
        if (tournamentData.tournaments.length === 0) {
            list.innerHTML = `<p style="text-align:center; color: var(--ink-muted);">저장된 토너먼트가 없습니다.</p>`;
        }
        tournamentData.tournaments.forEach(t => {
            const card = document.createElement('div');
            card.className = `list-card ${t.id === tournamentData.activeTournamentId ? 'active' : ''}`;
            card.onclick = () => selectTournament(t.id);
            card.innerHTML =`
                <div>
                    <div class="name">${t.name}</div>
                    <div class="details">${t.sport || '종목 미지정'} · ${t.teams.length}팀</div>
                </div>
                 <div class="action-buttons row">
                    <button onclick="event.stopPropagation(); showTournamentSettings('${t.id}');" data-tooltip="설정 수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick="event.stopPropagation(); deleteTournament('${t.id}');" data-tooltip="토너먼트를 삭제합니다."><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>`;
            list.appendChild(card);
        });
    }

    function renderTournamentDashboard(tourney) {
        $('#content-wrapper').innerHTML = `
            <h2 style="display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                토너먼트 설정
            </h2>
            <section class="section-box">
                <div class="settings-grid">
                    <div class="field"><label for="tourneyName">토너먼트 이름*</label><input id="tourneyName" type="text" value="${tourney.name || ''}"></div>
                    <div class="field"><label for="tourneySport">경기 종목*</label><input id="tourneySport" type="text" value="${tourney.sport || ''}" placeholder="예) 족구, 피구"></div>
                    <div class="field"><label>토너먼트 형식*</label><div class="chip-group"><label><input type="radio" name="format" value="single" ${tourney.format === 'single' ? 'checked' : ''}> 싱글</label><label><input type="radio" name="format" value="double" disabled data-tooltip="준비 중인 기능입니다."> 더블(준비중)</label></div></div>
                    <div class="field"><label>시드 배정</label><div class="chip-group"><label><input type="radio" name="seeding" value="input" ${tourney.seeding !== 'random' ? 'checked' : ''}> 입력 순</label><label><input type="radio" name="seeding" value="random" ${tourney.seeding === 'random' ? 'checked' : ''}> 무작위</label></div></div>
                    <button onclick="updateTournamentSettings()" class="btn" style="background:var(--win); color:white;">설정 저장</button>
                </div>
            </section>

            <h2 style="margin-top: 1.5rem;">참가 팀 관리 (${tourney.teams.length}팀)</h2>
            <section class="section-box">
                 <div class="row" style="align-items: flex-end;">
                    <div class="field" style="flex-grow:1; margin-bottom: 0;">
                        <label for="teamNameInput">신규 팀 추가</label>
                        <div class="form-group">
                            <input id="teamNameInput" type="text" placeholder="팀(선수) 이름 입력 후 엔터" style="ime-mode: active;">
                            <button onclick="addTeamToTournament()" class="btn primary" data-tooltip="팀 추가">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="teamsList" class="student-list-grid" style="margin-top: 1rem;">
                    ${tourney.teams.map(team => `
                        <div class="student-item">
                            <span>${team}</span>
                            <div class="action-buttons">
                                <button onclick="removeTeamFromTournament('${team}')" data-tooltip="삭제">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                 <h2 style="margin-top: 1.5rem;">대진표</h2>
                 <div class="row">
                     <button class="btn" onclick="shareView('tournament', 'bracket')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        대진표 공유
                    </button>
                    <button class="btn" onclick="printBracket()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        인쇄
                    </button>
                 </div>
            </div>
            <div id="bracket-container" class="bracket-wrap">
                <div id="rounds" class="rounds"></div>
                <svg id="svgLayer" class="svg-layer"></svg>
            </div>
             <div style="font-size: 12px; color: var(--ink-muted); text-align: right; padding-top: 8px;">팀 추가/삭제 시 대진표는 자동 저장됩니다.</div>
        `;

        $('#teamNameInput').addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTeamToTournament();
            }
        });

        renderBracket(tourney, false);
    }
    
    function createTournament() {
        const input = $('#tournamentNameInput');
        const name = input.value.trim();
        if(name) {
            const newTourney = { id: 't_'+Date.now(), name, teams: [], rounds: [], sport: '', format: 'single', seeding: 'input' };
            tournamentData.tournaments.unshift(newTourney);
            input.value = '';
            selectTournament(newTourney.id);
            saveDataToFirestore();
        }
    }
    
    function selectTournament(id) {
        tournamentData.activeTournamentId = id;
        const tourney = tournamentData.tournaments.find(t => t.id === id);
        if (tourney) {
            renderTournamentView(tourney);
        }
        saveDataToFirestore();
    }

    function deleteTournament(id) {
        showModal({
            title: '토너먼트 삭제', body: '이 토너먼트의 모든 데이터가 삭제됩니다. 계속하시겠습니까?',
            actions: [
                { text: '취소', callback: closeModal },
                { text: '삭제', type: 'danger', callback: () => {
                    tournamentData.tournaments = tournamentData.tournaments.filter(t => t.id !== id);
                    if (tournamentData.activeTournamentId === id) {
                        tournamentData.activeTournamentId = null;
                    }
                    saveDataToFirestore();
                    renderApp();
                    closeModal();
                }}
            ]
        });
    }
    
    function showTournamentSettings(tournamentId) {
        tournamentData.activeTournamentId = tournamentId;
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentId);
        if (tourney) {
            renderTournamentDashboard(tourney);
        }
    }

    function renderTournamentView(tourney) {
        $('#content-wrapper').innerHTML = `
            <h2 style="display: flex; align-items: center; gap: 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                <span>${tourney.name}</span>
            </h2>

            <h2 style="margin-top: 1.5rem;">참가 팀 관리 (${tourney.teams.length}팀)</h2>
            <section class="section-box">
                 <div class="row" style="align-items: flex-end;">
                    <div class="field" style="flex-grow:1; margin-bottom: 0;">
                        <label for="teamNameInput">신규 팀 추가</label>
                        <div class="sidebar-form-group">
                            <input id="teamNameInput" type="text" placeholder="팀(선수) 이름 입력 후 엔터" style="ime-mode: active;">
                            <button onclick="addTeamToTournament()" class="btn primary" data-tooltip="팀을 추가합니다.">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="teamsList" class="student-list-grid" style="margin-top: 1rem;">
                    ${tourney.teams.map(team => `
                        <div class="student-item" id="team-item-${team.replace(/[^a-zA-Z0-9]/g, '_')}">
                            <span>${team}</span>
                            <div class="action-buttons">
                                <button onclick="editTeamName('${team}')" data-tooltip="수정">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button onclick="removeTeamFromTournament('${team}')" data-tooltip="삭제">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <div style="display: flex; justify-content: space-between; align-items: center;">
                 <h2 style="margin-top: 1.5rem;">대진표</h2>
                 <div class="row">
                     <button class="btn" onclick="shareView('tournament', 'bracket')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        대진표 공유
                    </button>
                    <button class="btn" onclick="printBracket()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        인쇄
                    </button>
                </div>
            </div>
            <div id="bracket-container" class="bracket-wrap">
                <div id="rounds" class="rounds"></div>
                <svg id="svgLayer" class="svg-layer"></svg>
            </div>
             <div style="font-size: 12px; color: var(--ink-muted); text-align: right; padding-top: 8px;">팀 추가/삭제 시 대진표는 자동 저장됩니다.</div>
        `;
        
        // 팀 추가 이벤트 리스너
        $('#teamNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTeamToTournament();
            }
        });
        
        // 대진표 렌더링
        renderBracket(tourney);
    }

    function updateTournamentSettings() {
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if (!tourney) return;

        const oldSeeding = tourney.seeding;
        
        tourney.name = $('#tourneyName').value.trim() || '이름 없는 토너먼트';
        tourney.sport = $('#tourneySport').value.trim();
        tourney.format = $$('input[name="format"]:checked')[0]?.value || 'single';
        tourney.seeding = $$('input[name="seeding"]:checked')[0]?.value || 'input';
        
        if (tourney.seeding !== oldSeeding && tourney.teams.length > 0) {
            buildBracket(tourney);
            renderBracket(tourney);
        }
        
        saveDataToFirestore();
        renderTournamentList();
        
        // 설정 저장 후 토너먼트 설정 카드만 숨기고 나머지는 유지
        renderTournamentView(tourney);
        
        showModal({ title: '저장 완료', body: '토너먼트 설정이 저장되었습니다.', actions: [{ text: '확인', type: 'primary', callback: closeModal }] });
    }

    function addTeamToTournament() {
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if (!tourney) return;
        
        const input = $('#teamNameInput');
        const teamName = input.value.trim();
        
        console.log('입력된 팀 이름:', teamName);
        console.log('현재 팀 목록:', tourney.teams);
        
        // 더 안전한 중복 체크 (대소문자 무시, 공백 제거)
        const isDuplicate = tourney.teams.some(team => 
            team.trim().toLowerCase() === teamName.toLowerCase()
        );
        
        console.log('중복 체크 결과:', isDuplicate);
        
        if (teamName && !isDuplicate) {
            tourney.teams.push(teamName);
            console.log('팀 추가 후 배열:', tourney.teams);
            
            buildBracket(tourney);
            saveDataToFirestore();
            renderTournamentView(tourney);
            renderTournamentList(); // Update team count in sidebar

            input.value = ''; // 입력 필드 초기화
            $('#teamNameInput').focus();

        } else if (teamName) {
            alert("이미 존재하는 팀 이름입니다.");
            input.select();
            input.focus();
        } else {
             input.focus();
        }
    }

    function removeTeamFromTournament(teamNameToRemove) {
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if (!tourney) return;
        
        tourney.teams = tourney.teams.filter(team => team !== teamNameToRemove);
        
        buildBracket(tourney);
        saveDataToFirestore();
        renderTournamentView(tourney);
        renderTournamentList();
    }

    function editTeamName(oldTeamName) {
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if (!tourney) return;
        
        const newTeamName = prompt(`팀 이름을 수정하세요:`, oldTeamName);
        
        if (newTeamName === null) return; // 취소된 경우
        
        const trimmedName = newTeamName.trim();
        
        if (!trimmedName) {
            alert('팀 이름을 입력해주세요.');
            return;
        }
        
        if (trimmedName === oldTeamName) {
            return; // 변경사항이 없는 경우
        }
        
        // 중복 체크
        const isDuplicate = tourney.teams.some(team => 
            team !== oldTeamName && team.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (isDuplicate) {
            alert('이미 존재하는 팀 이름입니다.');
            return;
        }
        
        // 팀 이름 업데이트
        const teamIndex = tourney.teams.indexOf(oldTeamName);
        if (teamIndex !== -1) {
            tourney.teams[teamIndex] = trimmedName;
            
            // 대진표에서도 팀 이름 업데이트
            if (tourney.roundsData) {
                tourney.roundsData.forEach(round => {
                    round.matches.forEach(match => {
                        if (match.team1 === oldTeamName) {
                            match.team1 = trimmedName;
                        }
                        if (match.team2 === oldTeamName) {
                            match.team2 = trimmedName;
                        }
                    });
                });
            }
            
            buildBracket(tourney);
            saveDataToFirestore();
            renderTournamentView(tourney);
            renderTournamentList();
        }
    }

    function buildBracket(tourney) {
        if (!tourney) return;

        const teams = tourney.teams;
        let roundsData = [];

        if (teams.length > 0) {
            let matchIdSeq = 1;
            const makeMatch = (roundIdx, slotIdx, teamA, teamB) => ({
                id: 'm_' + tourney.id + '_' + (Date.now() + matchIdSeq++), roundIdx, slotIdx,
                teamA: teamA || null, teamB: teamB || null,
                scoreA: null, scoreB: null, winner: null, parentId: null,
                isBye: false, // 부전승 매치 표시를 위한 플래그
                matchNumber: null // 매치 번호 추가
            });

            const numTeams = teams.length;
            let seededTeams = tourney.seeding === 'random' ? [...teams].sort(() => 0.5 - Math.random()) : [...teams];
            
            // 팀 수에 따른 특별한 대진표 생성
            if (numTeams === 3) {
                // 3팀: 1팀 부전승, 2팀 경기 → 결승
                roundsData.push([
                    makeMatch(0, 0, seededTeams[1], seededTeams[2])
                ]);
                roundsData[0][0].matchNumber = 1;
                
                roundsData.push([
                    makeMatch(1, 0, null, null) // A팀 vs ROUND1 승자
                ]);
                // 연결선을 위한 parentId 설정
                roundsData[0][0].parentId = roundsData[1][0].id;
                
            } else if (numTeams === 4) {
                // 4팀: 2경기 → 결승
                roundsData.push([
                    makeMatch(0, 0, seededTeams[0], seededTeams[3]),
                    makeMatch(0, 1, seededTeams[1], seededTeams[2])
                ]);
                roundsData[0][0].matchNumber = 1;
                roundsData[0][1].matchNumber = 2;
                
                roundsData.push([
                    makeMatch(1, 0, null, null)
                ]);
                // 연결선을 위한 parentId 설정
                roundsData[0][0].parentId = roundsData[1][0].id;
                roundsData[0][1].parentId = roundsData[1][0].id;
                
            } else if (numTeams === 5) {
                // 5팀: 1경기 → 2라운드(3팀 부전승) → 결승
                roundsData.push([
                    makeMatch(0, 0, seededTeams[3], seededTeams[4])
                ]);
                roundsData[0][0].matchNumber = 1;
                
                roundsData.push([
                    makeMatch(1, 0, null, null), // #1 vs ROUND1 승자
                    makeMatch(1, 1, seededTeams[1], seededTeams[2]) // #2 vs #3
                ]);
                roundsData[1][1].matchNumber = 2;
                
                roundsData.push([
                    makeMatch(2, 0, null, null)
                ]);
                // 연결선을 위한 parentId 설정
                roundsData[0][0].parentId = roundsData[1][0].id;
                roundsData[1][0].parentId = roundsData[2][0].id;
                roundsData[1][1].parentId = roundsData[2][0].id;
                
            } else if (numTeams === 6) {
                // 6팀: 2경기 → 2라운드(2팀 부전승) → 결승
                roundsData.push([
                    makeMatch(0, 0, seededTeams[3], seededTeams[4]),
                    makeMatch(0, 1, seededTeams[2], seededTeams[5])
                ]);
                roundsData[0][0].matchNumber = 1;
                roundsData[0][1].matchNumber = 2;
                
                roundsData.push([
                    makeMatch(1, 0, null, null), // #1 vs ROUND1-1승자
                    makeMatch(1, 1, null, null)  // #2 vs ROUND1-2승자
                ]);
                
                roundsData.push([
                    makeMatch(2, 0, null, null)
                ]);
                // 연결선을 위한 parentId 설정
                roundsData[0][0].parentId = roundsData[1][0].id;
                roundsData[0][1].parentId = roundsData[1][1].id;
                roundsData[1][0].parentId = roundsData[2][0].id;
                roundsData[1][1].parentId = roundsData[2][0].id;
                
            } else if (numTeams === 7) {
                // 7팀: 3경기 → 2라운드(1팀 부전승) → 결승
                roundsData.push([
                    makeMatch(0, 0, seededTeams[3], seededTeams[4]),
                    makeMatch(0, 1, seededTeams[1], seededTeams[6]),
                    makeMatch(0, 2, seededTeams[2], seededTeams[5])
                ]);
                roundsData[0][0].matchNumber = 1;
                roundsData[0][1].matchNumber = 2;
                roundsData[0][2].matchNumber = 3;
                
                roundsData.push([
                    makeMatch(1, 0, null, null), // #1 vs ROUND1-1승자
                    makeMatch(1, 1, null, null)  // ROUND1-2승자 vs ROUND1-3승자
                ]);
                
                roundsData.push([
                    makeMatch(2, 0, null, null)
                ]);
                // 연결선을 위한 parentId 설정
                roundsData[0][0].parentId = roundsData[1][0].id;
                roundsData[0][1].parentId = roundsData[1][1].id;
                roundsData[0][2].parentId = roundsData[1][1].id;
                roundsData[1][0].parentId = roundsData[2][0].id;
                roundsData[1][1].parentId = roundsData[2][0].id;
                
            } else if (numTeams === 8) {
                // 8팀: 4경기 → 2라운드 → 결승
                roundsData.push([
                    makeMatch(0, 0, seededTeams[0], seededTeams[7]),
                    makeMatch(0, 1, seededTeams[3], seededTeams[4]),
                    makeMatch(0, 2, seededTeams[1], seededTeams[6]),
                    makeMatch(0, 3, seededTeams[2], seededTeams[5])
                ]);
                roundsData[0][0].matchNumber = 1;
                roundsData[0][1].matchNumber = 2;
                roundsData[0][2].matchNumber = 3;
                roundsData[0][3].matchNumber = 4;
                
                roundsData.push([
                    makeMatch(1, 0, null, null),
                    makeMatch(1, 1, null, null)
                ]);
                
                roundsData.push([
                    makeMatch(2, 0, null, null)
                ]);
                // 연결선을 위한 parentId 설정
                roundsData[0][0].parentId = roundsData[1][0].id;
                roundsData[0][1].parentId = roundsData[1][0].id;
                roundsData[0][2].parentId = roundsData[1][1].id;
                roundsData[0][3].parentId = roundsData[1][1].id;
                roundsData[1][0].parentId = roundsData[2][0].id;
                roundsData[1][1].parentId = roundsData[2][0].id;
                
            } else if (numTeams === 16) {
                // 16팀: 표준 토너먼트 (모든 팀이 1라운드부터 시작)
                const firstRoundMatches = [];
                for (let i = 0; i < seededTeams.length; i += 2) {
                    const teamA = seededTeams[i];
                    const teamB = seededTeams[i + 1];
                    const match = makeMatch(0, i / 2, teamA, teamB);
                    match.matchNumber = Math.floor(i / 2) + 1;
                    firstRoundMatches.push(match);
                }
                roundsData.push(firstRoundMatches);
                
                // 나머지 라운드들 생성
                let currentRoundMatches = firstRoundMatches;
                let roundIdx = 1;
                while (currentRoundMatches.length > 1) {
                    const nextRoundMatches = [];
                    for (let i = 0; i < currentRoundMatches.length; i += 2) {
                        const parent = makeMatch(roundIdx, i / 2, null, null);
                        if(currentRoundMatches[i]) currentRoundMatches[i].parentId = parent.id;
                        if(currentRoundMatches[i+1]) currentRoundMatches[i+1].parentId = parent.id;
                        nextRoundMatches.push(parent);
                    }
                    roundsData.push(nextRoundMatches);
                    currentRoundMatches = nextRoundMatches;
                    roundIdx++;
                }
            } else {
                // 17팀 이상: 특별한 부전승 로직
                const totalSlots = 1 << (Math.ceil(Math.log2(numTeams)));
                const byeCount = totalSlots - numTeams;
                
                // 부전승 팀들 (상위 시드)과 1라운드 팀들 (하위 시드) 분리
                const byeTeams = seededTeams.slice(0, byeCount); // 부전승 팀들
                const firstRoundTeams = seededTeams.slice(byeCount); // 1라운드 팀들
                
                // 1라운드: 하위 시드 팀들끼리 경기
                const firstRoundMatches = [];
                for (let i = 0; i < firstRoundTeams.length; i += 2) {
                    const teamA = firstRoundTeams[i];
                    const teamB = firstRoundTeams[i + 1];
                    const match = makeMatch(0, i / 2, teamA, teamB);
                    match.matchNumber = Math.floor(i / 2) + 1;
                    firstRoundMatches.push(match);
                }
                roundsData.push(firstRoundMatches);
                
                // 2라운드: 부전승 팀들과 1라운드 승자들
                const secondRoundMatches = [];
                let matchIdx = 0;
                
                if (numTeams === 10) {
                    // 10팀 특별 배치: 1반 vs (8반vs9반 승자), 4반 vs 5반, 2반 vs (7반vs10반 승자), 3반 vs 6반
                    const match1 = makeMatch(1, matchIdx, byeTeams[0], null); // 1반 vs (8반vs9반 승자)
                    secondRoundMatches.push(match1);
                    matchIdx++;
                    
                    const match2 = makeMatch(1, matchIdx, byeTeams[3], byeTeams[4]); // 4반 vs 5반
                    secondRoundMatches.push(match2);
                    matchIdx++;
                    
                    const match3 = makeMatch(1, matchIdx, byeTeams[1], null); // 2반 vs (7반vs10반 승자)
                    secondRoundMatches.push(match3);
                    matchIdx++;
                    
                    const match4 = makeMatch(1, matchIdx, byeTeams[2], byeTeams[5]); // 3반 vs 6반
                    secondRoundMatches.push(match4);
                    matchIdx++;
                } else if (numTeams === 11) {
                    // 11팀 특별 배치: 1반 vs (8반vs9반 승자), 4반 vs 5반, 2반 vs (7반vs10반 승자), 3반 vs (6반vs11반 승자)
                    const match1 = makeMatch(1, matchIdx, byeTeams[0], null); // 1반 vs (8반vs9반 승자)
                    secondRoundMatches.push(match1);
                    matchIdx++;
                    
                    const match2 = makeMatch(1, matchIdx, byeTeams[3], byeTeams[4]); // 4반 vs 5반
                    secondRoundMatches.push(match2);
                    matchIdx++;
                    
                    const match3 = makeMatch(1, matchIdx, byeTeams[1], null); // 2반 vs (7반vs10반 승자)
                    secondRoundMatches.push(match3);
                    matchIdx++;
                    
                    const match4 = makeMatch(1, matchIdx, byeTeams[2], null); // 3반 vs (6반vs11반 승자)
                    secondRoundMatches.push(match4);
                    matchIdx++;
                } else if (numTeams === 12) {
                    // 12팀 특별 배치: 1반 vs (5반vs6반 승자), 4반 vs (11반vs12반 승자), 2반 vs (7반vs8반 승자), 3반 vs (9반vs10반 승자)
                    const match1 = makeMatch(1, matchIdx, byeTeams[0], null); // 1반 vs (5반vs6반 승자)
                    secondRoundMatches.push(match1);
                    matchIdx++;
                    
                    const match2 = makeMatch(1, matchIdx, byeTeams[3], null); // 4반 vs (11반vs12반 승자)
                    secondRoundMatches.push(match2);
                    matchIdx++;
                    
                    const match3 = makeMatch(1, matchIdx, byeTeams[1], null); // 2반 vs (7반vs8반 승자)
                    secondRoundMatches.push(match3);
                    matchIdx++;
                    
                    const match4 = makeMatch(1, matchIdx, byeTeams[2], null); // 3반 vs (9반vs10반 승자)
                    secondRoundMatches.push(match4);
                    matchIdx++;
                } else if (numTeams === 13) {
                    // 13팀 특별 배치: 1반 vs (8반vs9반 승자), (4반vs13반 승자) vs (5반vs12반 승자), 2반 vs (7반vs10반 승자), 3반 vs (6반vs11반 승자)
                    const match1 = makeMatch(1, matchIdx, byeTeams[0], null); // 1반 vs (8반vs9반 승자)
                    secondRoundMatches.push(match1);
                    matchIdx++;
                    
                    const match2 = makeMatch(1, matchIdx, null, null); // (4반vs13반 승자) vs (5반vs12반 승자)
                    secondRoundMatches.push(match2);
                    matchIdx++;
                    
                    const match3 = makeMatch(1, matchIdx, byeTeams[1], null); // 2반 vs (7반vs10반 승자)
                    secondRoundMatches.push(match3);
                    matchIdx++;
                    
                    const match4 = makeMatch(1, matchIdx, byeTeams[2], null); // 3반 vs (6반vs11반 승자)
                    secondRoundMatches.push(match4);
                    matchIdx++;
                } else if (numTeams === 14) {
                    // 14팀 특별 배치: 1반 vs (8반vs9반 승자), (4반vs13반 승자) vs (5반vs12반 승자), 2반 vs (7반vs10반 승자), (3반vs14반 승자) vs (6반vs11반 승자)
                    const match1 = makeMatch(1, matchIdx, byeTeams[0], null); // 1반 vs (8반vs9반 승자)
                    secondRoundMatches.push(match1);
                    matchIdx++;
                    
                    const match2 = makeMatch(1, matchIdx, null, null); // (4반vs13반 승자) vs (5반vs12반 승자)
                    secondRoundMatches.push(match2);
                    matchIdx++;
                    
                    const match3 = makeMatch(1, matchIdx, byeTeams[1], null); // 2반 vs (7반vs10반 승자)
                    secondRoundMatches.push(match3);
                    matchIdx++;
                    
                    const match4 = makeMatch(1, matchIdx, null, null); // (3반vs14반 승자) vs (6반vs11반 승자)
                    secondRoundMatches.push(match4);
                    matchIdx++;
                } else if (numTeams === 9) {
                    // 9팀 특별 배치: 1반 vs (8반vs9반 승자), 2반 vs 3반, 4반 vs 5반, 6반 vs 7반
                    const match1 = makeMatch(1, matchIdx, byeTeams[0], null); // 1반 vs (8반vs9반 승자)
                    secondRoundMatches.push(match1);
                    matchIdx++;
                    
                    const match2 = makeMatch(1, matchIdx, byeTeams[1], byeTeams[2]); // 2반 vs 3반
                    secondRoundMatches.push(match2);
                    matchIdx++;
                    
                    const match3 = makeMatch(1, matchIdx, byeTeams[3], byeTeams[4]); // 4반 vs 5반
                    secondRoundMatches.push(match3);
                    matchIdx++;
                    
                    const match4 = makeMatch(1, matchIdx, byeTeams[5], byeTeams[6]); // 6반 vs 7반
                    secondRoundMatches.push(match4);
                    matchIdx++;
                } else if (numTeams === 15) {
                    // 15팀 특별 배치: 1반 vs (8반vs9반 승자), (4반vs13반 승자) vs (5반vs12반 승자), (2반vs15반 승자) vs (7반vs10반 승자), (3반vs14반 승자) vs (6반vs11반 승자)
                    const match1 = makeMatch(1, matchIdx, byeTeams[0], null); // 1반 vs (8반vs9반 승자)
                    secondRoundMatches.push(match1);
                    matchIdx++;
                    
                    const match2 = makeMatch(1, matchIdx, null, null); // (4반vs13반 승자) vs (5반vs12반 승자)
                    secondRoundMatches.push(match2);
                    matchIdx++;
                    
                    const match3 = makeMatch(1, matchIdx, null, null); // (2반vs15반 승자) vs (7반vs10반 승자)
                    secondRoundMatches.push(match3);
                    matchIdx++;
                    
                    const match4 = makeMatch(1, matchIdx, null, null); // (3반vs14반 승자) vs (6반vs11반 승자)
                    secondRoundMatches.push(match4);
                    matchIdx++;
                } else {
                    // 9팀 또는 16팀 이상: 기존 로직
                    // 1라운드 승자와 첫 번째 부전승 팀 매치
                    const firstMatch = makeMatch(1, matchIdx, byeTeams[0], null);
                    secondRoundMatches.push(firstMatch);
                    matchIdx++;
                    
                    // 나머지 부전승 팀들을 2개씩 묶어서 배치
                    for (let i = 1; i < byeTeams.length; i += 2) {
                        const teamA = byeTeams[i];
                        const teamB = byeTeams[i + 1] || null; // 홀수개면 null
                        const match = makeMatch(1, matchIdx, teamA, teamB);
                        secondRoundMatches.push(match);
                        matchIdx++;
                    }
                }
                
                roundsData.push(secondRoundMatches);
                
                // 연결선 설정
                if (numTeams === 10) {
                    // 10팀: 7반vs10반 승자 -> 2라운드 3번째 매치, 8반vs9반 승자 -> 2라운드 1번째 매치
                    firstRoundMatches[0].parentId = secondRoundMatches[2].id; // 7반vs10반 -> 2반 vs (7반vs10반 승자)
                    firstRoundMatches[1].parentId = secondRoundMatches[0].id; // 8반vs9반 -> 1반 vs (8반vs9반 승자)
                } else if (numTeams === 11) {
                    // 11팀: 8반vs9반 승자 -> 2라운드 1번째 매치, 7반vs10반 승자 -> 2라운드 3번째 매치, 6반vs11반 승자 -> 2라운드 4번째 매치
                    firstRoundMatches[0].parentId = secondRoundMatches[0].id; // 8반vs9반 -> 1반 vs (8반vs9반 승자)
                    firstRoundMatches[1].parentId = secondRoundMatches[2].id; // 7반vs10반 -> 2반 vs (7반vs10반 승자)
                    firstRoundMatches[2].parentId = secondRoundMatches[3].id; // 6반vs11반 -> 3반 vs (6반vs11반 승자)
                } else if (numTeams === 12) {
                    // 12팀: 5반vs6반 승자 -> 2라운드 1번째 매치, 7반vs8반 승자 -> 2라운드 3번째 매치, 9반vs10반 승자 -> 2라운드 4번째 매치, 11반vs12반 승자 -> 2라운드 2번째 매치
                    firstRoundMatches[0].parentId = secondRoundMatches[0].id; // 5반vs6반 -> 1반 vs (5반vs6반 승자)
                    firstRoundMatches[1].parentId = secondRoundMatches[2].id; // 7반vs8반 -> 2반 vs (7반vs8반 승자)
                    firstRoundMatches[2].parentId = secondRoundMatches[3].id; // 9반vs10반 -> 3반 vs (9반vs10반 승자)
                    firstRoundMatches[3].parentId = secondRoundMatches[1].id; // 11반vs12반 -> 4반 vs (11반vs12반 승자)
                } else if (numTeams === 13) {
                    // 13팀: 8반vs9반 승자 -> 2라운드 1번째 매치, 4반vs13반 승자 -> 2라운드 2번째 매치, 5반vs12반 승자 -> 2라운드 2번째 매치, 7반vs10반 승자 -> 2라운드 3번째 매치, 6반vs11반 승자 -> 2라운드 4번째 매치
                    firstRoundMatches[0].parentId = secondRoundMatches[0].id; // 8반vs9반 -> 1반 vs (8반vs9반 승자)
                    firstRoundMatches[1].parentId = secondRoundMatches[1].id; // 4반vs13반 -> (4반vs13반 승자) vs (5반vs12반 승자)
                    firstRoundMatches[2].parentId = secondRoundMatches[1].id; // 5반vs12반 -> (4반vs13반 승자) vs (5반vs12반 승자)
                    firstRoundMatches[3].parentId = secondRoundMatches[2].id; // 7반vs10반 -> 2반 vs (7반vs10반 승자)
                    firstRoundMatches[4].parentId = secondRoundMatches[3].id; // 6반vs11반 -> 3반 vs (6반vs11반 승자)
                } else if (numTeams === 14) {
                    // 14팀: 8반vs9반 승자 -> 2라운드 1번째 매치, 4반vs13반 승자 -> 2라운드 2번째 매치, 5반vs12반 승자 -> 2라운드 2번째 매치, 7반vs10반 승자 -> 2라운드 3번째 매치, 3반vs14반 승자 -> 2라운드 4번째 매치, 6반vs11반 승자 -> 2라운드 4번째 매치
                    firstRoundMatches[0].parentId = secondRoundMatches[0].id; // 8반vs9반 -> 1반 vs (8반vs9반 승자)
                    firstRoundMatches[1].parentId = secondRoundMatches[1].id; // 4반vs13반 -> (4반vs13반 승자) vs (5반vs12반 승자)
                    firstRoundMatches[2].parentId = secondRoundMatches[1].id; // 5반vs12반 -> (4반vs13반 승자) vs (5반vs12반 승자)
                    firstRoundMatches[3].parentId = secondRoundMatches[2].id; // 7반vs10반 -> 2반 vs (7반vs10반 승자)
                    firstRoundMatches[4].parentId = secondRoundMatches[3].id; // 3반vs14반 -> (3반vs14반 승자) vs (6반vs11반 승자)
                    firstRoundMatches[5].parentId = secondRoundMatches[3].id; // 6반vs11반 -> (3반vs14반 승자) vs (6반vs11반 승자)
                } else if (numTeams === 9) {
                    // 9팀: 8반vs9반 승자 -> 2라운드 1번째 매치 (1반 vs (8반vs9반 승자))
                    firstRoundMatches[0].parentId = secondRoundMatches[0].id; // 8반vs9반 -> 1반 vs (8반vs9반 승자)
                } else if (numTeams === 15) {
                    // 15팀: 8반vs9반 승자 -> 2라운드 1번째 매치, 4반vs13반 승자 -> 2라운드 2번째 매치, 5반vs12반 승자 -> 2라운드 2번째 매치, 2반vs15반 승자 -> 2라운드 3번째 매치, 7반vs10반 승자 -> 2라운드 3번째 매치, 3반vs14반 승자 -> 2라운드 4번째 매치, 6반vs11반 승자 -> 2라운드 4번째 매치
                    firstRoundMatches[0].parentId = secondRoundMatches[0].id; // 8반vs9반 -> 1반 vs (8반vs9반 승자)
                    firstRoundMatches[1].parentId = secondRoundMatches[1].id; // 4반vs13반 -> (4반vs13반 승자) vs (5반vs12반 승자)
                    firstRoundMatches[2].parentId = secondRoundMatches[1].id; // 5반vs12반 -> (4반vs13반 승자) vs (5반vs12반 승자)
                    firstRoundMatches[3].parentId = secondRoundMatches[2].id; // 2반vs15반 -> (2반vs15반 승자) vs (7반vs10반 승자)
                    firstRoundMatches[4].parentId = secondRoundMatches[2].id; // 7반vs10반 -> (2반vs15반 승자) vs (7반vs10반 승자)
                    firstRoundMatches[5].parentId = secondRoundMatches[3].id; // 3반vs14반 -> (3반vs14반 승자) vs (6반vs11반 승자)
                    firstRoundMatches[6].parentId = secondRoundMatches[3].id; // 6반vs11반 -> (3반vs14반 승자) vs (6반vs11반 승자)
                } else {
                    // 9팀 또는 16팀 이상: 기존 로직
                    for (let i = 0; i < firstRoundMatches.length; i++) {
                        const parentIndex = Math.floor(byeTeams.length / 2) + Math.floor(i / 2);
                        if (parentIndex < secondRoundMatches.length) {
                            firstRoundMatches[i].parentId = secondRoundMatches[parentIndex].id;
                        }
                    }
                }

                // 나머지 라운드들 생성
                let currentRoundMatches = secondRoundMatches;
                let roundIdx = 2;
                while (currentRoundMatches.length > 1) {
                    const nextRoundMatches = [];
                    for (let i = 0; i < currentRoundMatches.length; i += 2) {
                        const parent = makeMatch(roundIdx, i / 2, null, null);
                        if(currentRoundMatches[i]) currentRoundMatches[i].parentId = parent.id;
                        if(currentRoundMatches[i+1]) currentRoundMatches[i+1].parentId = parent.id;
                        nextRoundMatches.push(parent);
                    }
                    roundsData.push(nextRoundMatches);
                    currentRoundMatches = nextRoundMatches;
                    roundIdx++;
                }
            }
        }
        
        tourney.rounds = roundsData;
        propagateWinners(tourney);
    }
    
    function onScoreInputTournament(matchId, side, value) {
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if (!tourney || !Array.isArray(tourney.rounds)) return;
        
        // 빈 값이거나 유효한 숫자인지 확인
        const numValue = value === '' ? null : Number(value);
        if (value !== '' && (isNaN(numValue) || numValue < 0)) {
            alert('올바른 점수를 입력해주세요. (0 이상의 숫자)');
            return;
        }
        
        for (const round of tourney.rounds) {
            const match = round.find(m => m.id === matchId);
            if (match) {
                match[side === 'A' ? 'scoreA' : 'scoreB'] = numValue;
                break;
            }
        }
        propagateWinners(tourney);
        saveDataToFirestore();
        renderBracket(tourney);
    }

    function propagateWinners(tourney) {
        if (!tourney || !Array.isArray(tourney.rounds)) return;

        const numTeams = tourney.teams.length;
        
        // 3팀, 4팀, 5팀, 6팀, 7팀, 8팀, 9팀 이상의 특별한 로직 처리
        if (numTeams === 3 || numTeams === 4 || numTeams === 5 || numTeams === 6 || numTeams === 7 || numTeams === 8 || numTeams === 16 || numTeams >= 9) {
            tourney.rounds.forEach((round, rIdx) => {
                round.forEach(match => {
                    if (rIdx === 0) {
                        // 첫 라운드는 이미 팀이 배정되어 있음
                        match.winner = null;
                        if (match.teamA && !match.teamB) { match.winner = match.teamA; }
                        else if (!match.teamA && match.teamB) { match.winner = match.teamB; }
                        else if (match.scoreA !== null && match.scoreB !== null && match.teamA && match.teamB) {
                            if (Number(match.scoreA) > Number(match.scoreB)) match.winner = match.teamA;
                            else if (Number(match.scoreB) > Number(match.scoreA)) match.winner = match.teamB;
                        }
                    } else if (rIdx === 1) {
                        // 두 번째 라운드: 부전승 팀과 이전 라운드 승자들 매칭
                        if (numTeams === 3) {
                            // 3팀: #1 vs ROUND1 승자
                            match.teamA = tourney.teams[0]; // #1
                            match.teamB = tourney.rounds[0][0].winner; // ROUND1 승자
                        } else if (numTeams === 4) {
                            // 4팀: ROUND1 승자들끼리
                            match.teamA = tourney.rounds[0][0].winner; // ROUND1-1승자
                            match.teamB = tourney.rounds[0][1].winner; // ROUND1-2승자
                        } else if (numTeams === 5) {
                            if (match.slotIdx === 0) {
                                // #1 vs ROUND1 승자
                                match.teamA = tourney.teams[0]; // #1
                                match.teamB = tourney.rounds[0][0].winner; // ROUND1 승자
                            } else {
                                // #2 vs #3
                                match.teamA = tourney.teams[1]; // #2
                                match.teamB = tourney.teams[2]; // #3
                            }
                        } else if (numTeams === 6) {
                            if (match.slotIdx === 0) {
                                // #1 vs ROUND1-1승자
                                match.teamA = tourney.teams[0]; // #1
                                match.teamB = tourney.rounds[0][0].winner; // ROUND1-1승자
                            } else {
                                // #2 vs ROUND1-2승자
                                match.teamA = tourney.teams[1]; // #2
                                match.teamB = tourney.rounds[0][1].winner; // ROUND1-2승자
                            }
                        } else if (numTeams === 7) {
                            if (match.slotIdx === 0) {
                                // #1 vs ROUND1-1승자
                                match.teamA = tourney.teams[0]; // #1
                                match.teamB = tourney.rounds[0][0].winner; // ROUND1-1승자
                            } else {
                                // ROUND1-2승자 vs ROUND1-3승자
                                match.teamA = tourney.rounds[0][1].winner; // ROUND1-2승자
                                match.teamB = tourney.rounds[0][2].winner; // ROUND1-3승자
                            }
                        } else if (numTeams === 8) {
                            if (match.slotIdx === 0) {
                                // ROUND1-1승자 vs ROUND1-2승자
                                match.teamA = tourney.rounds[0][0].winner; // ROUND1-1승자
                                match.teamB = tourney.rounds[0][1].winner; // ROUND1-2승자
                            } else {
                                // ROUND1-3승자 vs ROUND1-4승자
                                match.teamA = tourney.rounds[0][2].winner; // ROUND1-3승자
                                match.teamB = tourney.rounds[0][3].winner; // ROUND1-4승자
                            }
                        } else if (numTeams === 9) {
                            // 9팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                            }
                            // 나머지 매치들(2반vs3반, 4반vs5반, 6반vs7반)은 부전승 팀들이 이미 배정되어 있음
                        } else if (numTeams === 10) {
                            // 10팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                match.teamB = tourney.rounds[0][1].winner; // 8반vs9반 승자
                            } else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 7반vs10반 승자
                            }
                            // 나머지 매치들(4반vs5반, 3반vs6반)은 부전승 팀들이 이미 배정되어 있음
                        } else if (numTeams === 11) {
                            // 11팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                            } else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                match.teamB = tourney.rounds[0][1].winner; // 7반vs10반 승자
                            } else if (match.slotIdx === 3) {
                                // 3반 vs (6반vs11반 승자)
                                match.teamB = tourney.rounds[0][2].winner; // 6반vs11반 승자
                            }
                            // 나머지 매치들(4반vs5반)은 부전승 팀들이 이미 배정되어 있음
                        } else if (numTeams === 12) {
                            // 12팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (5반vs6반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 5반vs6반 승자
                            } else if (match.slotIdx === 1) {
                                // 4반 vs (11반vs12반 승자)
                                match.teamB = tourney.rounds[0][3].winner; // 11반vs12반 승자
                            } else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs8반 승자)
                                match.teamB = tourney.rounds[0][1].winner; // 7반vs8반 승자
                            } else if (match.slotIdx === 3) {
                                // 3반 vs (9반vs10반 승자)
                                match.teamB = tourney.rounds[0][2].winner; // 9반vs10반 승자
                            }
                        } else if (numTeams === 13) {
                            // 13팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                            } else if (match.slotIdx === 1) {
                                // (4반vs13반 승자) vs (5반vs12반 승자)
                                match.teamA = tourney.rounds[0][1].winner; // 4반vs13반 승자
                                match.teamB = tourney.rounds[0][2].winner; // 5반vs12반 승자
                            } else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                match.teamB = tourney.rounds[0][3].winner; // 7반vs10반 승자
                            } else if (match.slotIdx === 3) {
                                // 3반 vs (6반vs11반 승자)
                                match.teamB = tourney.rounds[0][4].winner; // 6반vs11반 승자
                            }
                        } else if (numTeams === 14) {
                            // 14팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                            } else if (match.slotIdx === 1) {
                                // (4반vs13반 승자) vs (5반vs12반 승자)
                                match.teamA = tourney.rounds[0][1].winner; // 4반vs13반 승자
                                match.teamB = tourney.rounds[0][2].winner; // 5반vs12반 승자
                            } else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                match.teamB = tourney.rounds[0][3].winner; // 7반vs10반 승자
                            } else if (match.slotIdx === 3) {
                                // (3반vs14반 승자) vs (6반vs11반 승자)
                                match.teamA = tourney.rounds[0][4].winner; // 3반vs14반 승자
                                match.teamB = tourney.rounds[0][5].winner; // 6반vs11반 승자
                            }
                        } else if (numTeams === 15) {
                            // 15팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                            } else if (match.slotIdx === 1) {
                                // (4반vs13반 승자) vs (5반vs12반 승자)
                                match.teamA = tourney.rounds[0][1].winner; // 4반vs13반 승자
                                match.teamB = tourney.rounds[0][2].winner; // 5반vs12반 승자
                            } else if (match.slotIdx === 2) {
                                // (2반vs15반 승자) vs (7반vs10반 승자)
                                match.teamA = tourney.rounds[0][3].winner; // 2반vs15반 승자
                                match.teamB = tourney.rounds[0][4].winner; // 7반vs10반 승자
                            } else if (match.slotIdx === 3) {
                                // (3반vs14반 승자) vs (6반vs11반 승자)
                                match.teamA = tourney.rounds[0][5].winner; // 3반vs14반 승자
                                match.teamB = tourney.rounds[0][6].winner; // 6반vs11반 승자
                            }
                        } else if (numTeams === 16) {
                            // 16팀: 표준 토너먼트 로직 (모든 라운드에서 이전 라운드 승자들 배정)
                            if (rIdx > 0) {
                                const prevRound = tourney.rounds[rIdx - 1];
                                const matchIndex = match.slotIdx;
                                const teamAIndex = matchIndex * 2;
                                const teamBIndex = matchIndex * 2 + 1;
                                
                                match.teamA = prevRound[teamAIndex] ? (prevRound[teamAIndex].winner || null) : null;
                                match.teamB = prevRound[teamBIndex] ? (prevRound[teamBIndex].winner || null) : null;
                            }
                        } else if (numTeams >= 9) {
                            // 9팀 또는 16팀 이상: 2라운드에서 1라운드 승자들을 배정
                            const totalSlots = 1 << (Math.ceil(Math.log2(numTeams)));
                            const byeCount = totalSlots - numTeams;
                            const firstRoundMatchCount = (numTeams - byeCount) / 2;
                            
                            // 첫 번째 매치: 1라운드 승자 vs 첫 번째 부전승 팀
                            if (match.slotIdx === 0) {
                                match.teamB = tourney.rounds[0][0].winner; // 1라운드 승자
                            }
                            // 나머지 매치들은 부전승 팀들이 이미 배정되어 있음
                        }
                        
                        match.winner = null;
                        // 6팀, 7팀, 8팀, 9팀 이상의 경우 부전승 팀이 자동으로 승자가 되지 않도록 함
                        if (numTeams === 6 || numTeams === 7 || numTeams === 8 || numTeams >= 9) {
                            // 부전승 팀이 있는 경우 실제 경기가 끝날 때까지 승자 결정하지 않음
                            if (match.teamA && match.teamB && match.scoreA !== null && match.scoreB !== null) {
                                if (Number(match.scoreA) > Number(match.scoreB)) match.winner = match.teamA;
                                else if (Number(match.scoreB) > Number(match.scoreA)) match.winner = match.teamB;
                            }
                        } else {
                            // 3팀, 4팀, 5팀의 경우 기존 로직 유지
                            if (match.teamA && !match.teamB) { match.winner = match.teamA; }
                            else if (!match.teamA && match.teamB) { match.winner = match.teamB; }
                            else if (match.scoreA !== null && match.scoreB !== null && match.teamA && match.teamB) {
                                if (Number(match.scoreA) > Number(match.scoreB)) match.winner = match.teamA;
                                else if (Number(match.scoreB) > Number(match.scoreA)) match.winner = match.teamB;
                            }
                        }
                    } else if (rIdx === 2) {
                        // Semi-Final: 이전 라운드(8강) 승자들
                        if (tourney.rounds[1] && tourney.rounds[1].length > 0) {
                            // 8강 라운드의 승자들을 2개씩 묶어서 Semi-Final에 배정
                            const prevRound = tourney.rounds[1];
                            const matchIndex = match.slotIdx;
                            const teamAIndex = matchIndex * 2;
                            const teamBIndex = matchIndex * 2 + 1;
                            
                            match.teamA = prevRound[teamAIndex] ? (prevRound[teamAIndex].winner || null) : null;
                            match.teamB = prevRound[teamBIndex] ? (prevRound[teamBIndex].winner || null) : null;
                        }
                        
                        match.winner = null;
                        if (match.teamA && !match.teamB) { match.winner = match.teamA; }
                        else if (!match.teamA && match.teamB) { match.winner = match.teamB; }
                        else if (match.scoreA !== null && match.scoreB !== null && match.teamA && match.teamB) {
                            if (Number(match.scoreA) > Number(match.scoreB)) match.winner = match.teamA;
                            else if (Number(match.scoreB) > Number(match.scoreA)) match.winner = match.teamB;
                        }
                    } else if (rIdx === 3) {
                        // Final: 이전 라운드(Semi-Final) 승자들
                        if (tourney.rounds[2] && tourney.rounds[2].length > 0) {
                            // Semi-Final 라운드의 승자들을 2개씩 묶어서 Final에 배정
                            const prevRound = tourney.rounds[2];
                            const matchIndex = match.slotIdx;
                            const teamAIndex = matchIndex * 2;
                            const teamBIndex = matchIndex * 2 + 1;
                            
                            match.teamA = prevRound[teamAIndex] ? (prevRound[teamAIndex].winner || null) : null;
                            match.teamB = prevRound[teamBIndex] ? (prevRound[teamBIndex].winner || null) : null;
                        }
                        
                        match.winner = null;
                        if (match.teamA && !match.teamB) { match.winner = match.teamA; }
                        else if (!match.teamA && match.teamB) { match.winner = match.teamB; }
                        else if (match.scoreA !== null && match.scoreB !== null && match.teamA && match.teamB) {
                            if (Number(match.scoreA) > Number(match.scoreB)) match.winner = match.teamA;
                            else if (Number(match.scoreB) > Number(match.scoreA)) match.winner = match.teamB;
                        }
                    }
                });
            });
        } else {
            // 표준 토너먼트 로직
            tourney.rounds.forEach((round, rIdx) => {
                round.forEach(match => {
                    if(rIdx > 0) {
                        const prevRound = tourney.rounds[rIdx-1];
                        const child1 = prevRound[match.slotIdx * 2];
                        const child2 = prevRound[match.slotIdx * 2 + 1];
                        match.teamA = child1 ? child1.winner : null;
                        match.teamB = child2 ? child2.winner : null;
                    }
                    
                    match.winner = null;
                    if (match.teamA && !match.teamB) { match.winner = match.teamA; }
                    else if (!match.teamA && match.teamB) { match.winner = match.teamB; }
                    else if (match.scoreA !== null && match.scoreB !== null && match.teamA && match.teamB) {
                        if (Number(match.scoreA) > Number(match.scoreB)) match.winner = match.teamA;
                        else if (Number(match.scoreB) > Number(match.scoreA)) match.winner = match.teamB;
                    }
                });
            });
        }
    }

    function renderBracket(tourney, isReadOnly = false) {
        const roundsEl = $('#rounds');
        const svgEl = $('#svgLayer');
        const roundsData = tourney.rounds;

        if (!roundsEl || !svgEl || !Array.isArray(roundsData) || roundsData.length === 0) {
            if(roundsEl) roundsEl.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--ink-muted);">팀을 추가하여 대진표 생성을 시작하세요.</div>';
            if(svgEl) svgEl.innerHTML = '';
            return;
        }
        
        const roundLabels = makeRoundLabels(roundsData.length);
        roundsEl.innerHTML = roundsData.map((round, rIdx) => `
            <div class="round">
                <div class="round-title">${roundLabels[rIdx]}</div>
                <div class="match-group">
                    ${round.map(m => renderMatchCard(m, rIdx, tourney, isReadOnly)).join('')}
                </div>
            </div>
        `).join('');
        
        requestAnimationFrame(() => drawSvgLines(tourney));
    }


    function renderMatchCard(m, rIdx, tourney, isReadOnly = false) {
        // 부전승 팀 처리
        const teamA = m.teamA || (m.isBye ? '부전승' : '(미정)');
        const teamB = m.teamB || (m.isBye ? '부전승' : '(미정)');
        const isNext = m.teamA && m.teamB && !m.winner;
        
        let rankBadgeA = '', rankBadgeB = '';
        const winBadge = '<span style="color: var(--win); font-weight: bold; font-size: 12px; margin-left: auto;">승</span>';
        const byeBadge = '<span style="color: var(--ink-muted); font-style: italic; font-size: 11px;">부전승</span>';
        const isScoredMatch = m.scoreA !== null && m.scoreB !== null;
        const roundsData = tourney.rounds;

        const finalRoundIdx = roundsData.length - 1;

        if (finalRoundIdx >= 0 && roundsData[finalRoundIdx][0].winner) {
            const winner = roundsData[finalRoundIdx][0].winner;
            const runnerUp = winner === roundsData[finalRoundIdx][0].teamA ? roundsData[finalRoundIdx][0].teamB : roundsData[finalRoundIdx][0].teamA;
            
            if (rIdx === finalRoundIdx) {
                if (m.teamA === winner) rankBadgeA = getMedal('gold');
                if (m.teamB === winner) rankBadgeB = getMedal('gold');
                if (m.teamA === runnerUp) rankBadgeA = getMedal('silver');
                if (m.teamB === runnerUp) rankBadgeB = getMedal('silver');
            }

            if (roundsData.length > 1 && rIdx === finalRoundIdx - 1) {
                const semiFinalLosers = [roundsData[rIdx][0].teamA, roundsData[rIdx][0].teamB, roundsData[rIdx][1]?.teamA, roundsData[rIdx][1]?.teamB].filter(t => t && t !== winner && t !== runnerUp);
                if (semiFinalLosers.includes(m.teamA)) rankBadgeA = getMedal('bronze');
                if (semiFinalLosers.includes(m.teamB)) rankBadgeB = getMedal('bronze');
            }
        }
        
        // 부전승 매치인 경우 스타일링
        const isByeMatch = m.isBye;
        const byeMatchClass = isByeMatch ? 'bye-match' : '';
        
        // 원래 팀 렌더링 함수
        const renderTeam = (team, teamType, rankBadge, isWinner, isLoser, isBye) => {
            const isEmpty = !team || team === '(미정)';
            const isByeTeam = isBye && isEmpty;
            
            return `
                <div class="team ${m.winner === team ? 'win' : ''} ${m.winner && m.winner !== team ? 'lose' : ''} ${!team && m.isBye ? 'bye-team' : ''}"
                     data-match-id="${m.id}" 
                     data-team-type="${teamType}"
                     data-team-name="${team || ''}"
                     draggable="${isReadOnly || isByeMatch ? 'false' : 'true'}"
                     ondragstart="handleDragStart(event)"
                     ondragover="handleDragOver(event)"
                     ondrop="handleDrop(event)"
                     ondragleave="handleDragLeave(event)">
                    <span class="team-name">
                        ${rankBadge}${team || (isByeTeam ? '부전승' : '(미정)')}
                    </span>
                    <input type="number" class="team-score" value="${teamType === 'A' ? (m.scoreA ?? '') : (m.scoreB ?? '')}" 
                           onchange="onScoreInputTournament('${m.id}', '${teamType}', this.value)" 
                           ${(!team || !m.teamA || !m.teamB || isReadOnly || isByeMatch) ? 'disabled' : ''} 
                           placeholder="점수" min="0"
                           title="${(!team || !m.teamA || !m.teamB || isReadOnly || isByeMatch) ? '점수를 입력할 수 없습니다' : '점수를 입력하세요. 승자는 자동으로 결정됩니다.'}">
                    <div class="team-actions">
                        ${isWinner && isScoredMatch ? winBadge : ''}
                        ${isByeTeam ? byeBadge : ''}
                    </div>
                </div>
            `;
        };
        
        return `
            <div class="match">
                ${renderTeam(teamA, 'A', rankBadgeA, m.winner === m.teamA, m.winner && m.winner !== m.teamA, !m.teamA && m.isBye)}
                ${renderTeam(teamB, 'B', rankBadgeB, m.winner === m.teamB, m.winner && m.winner !== m.teamB, !m.teamB && m.isBye)}
            </div>
        `;
    }

    // 현재 활성 토너먼트 가져오기
    function getCurrentTournament() {
        return tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
    }

    // 드래그 앤 드롭 관련 변수
    let draggedElement = null;
    let draggedData = null;

    // 드래그 시작 함수는 아래에 정의됨 (중복 제거)

    // 드래그 오버 함수는 아래에 정의됨 (중복 제거)

    // 드래그 리브 함수는 아래에 정의됨 (중복 제거)

    // 드롭
    function handleDrop(event) {
        event.preventDefault();
        
        const targetTeam = event.target.closest('.team-item');
        if (!targetTeam || !draggedElement || targetTeam === draggedElement) {
            return;
        }
        
        // 드래그된 팀과 타겟 팀의 정보
        const sourceMatchId = draggedData.matchId;
        const sourceTeamType = draggedData.teamType;
        const sourceTeamName = draggedData.teamName;
        
        const targetMatchId = targetTeam.dataset.matchId;
        const targetTeamType = targetTeam.dataset.teamType;
        const targetTeamName = targetTeam.dataset.teamName;
        
        // 같은 매치 내에서 팀 교체
        if (sourceMatchId === targetMatchId) {
            swapTeamsInSameMatch(sourceMatchId, sourceTeamType, targetTeamType);
        } else {
            // 다른 매치 간 팀 교체
            swapTeamsBetweenMatches(sourceMatchId, sourceTeamType, targetMatchId, targetTeamType);
        }
        
        // UI 업데이트
        const currentTourney = getCurrentTournament();
        if (currentTourney) {
            renderTournamentView(currentTourney);
        }
        
        // 클래스 정리
        targetTeam.classList.remove('drag-over');
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        draggedData = null;
    }

    // 같은 매치 내에서 팀 교체
    function swapTeamsInSameMatch(matchId, teamTypeA, teamTypeB) {
        const currentTourney = getCurrentTournament();
        if (!currentTourney) return;
        
        // 매치 찾기
        let targetMatch = null;
        for (let round of currentTourney.rounds) {
            for (let match of round) {
                if (match.id === matchId) {
                    targetMatch = match;
                    break;
                }
            }
            if (targetMatch) break;
        }
        
        if (!targetMatch) return;
        
        // 팀 교체
        const tempTeam = teamTypeA === 'A' ? targetMatch.teamA : targetMatch.teamB;
        const tempScore = teamTypeA === 'A' ? targetMatch.scoreA : targetMatch.scoreB;
        
        if (teamTypeA === 'A') {
            targetMatch.teamA = teamTypeB === 'A' ? targetMatch.teamA : targetMatch.teamB;
            targetMatch.scoreA = teamTypeB === 'A' ? targetMatch.scoreA : targetMatch.scoreB;
        } else {
            targetMatch.teamB = teamTypeB === 'A' ? targetMatch.teamA : targetMatch.teamB;
            targetMatch.scoreB = teamTypeB === 'A' ? targetMatch.scoreA : targetMatch.scoreB;
        }
        
        if (teamTypeB === 'A') {
            targetMatch.teamA = tempTeam;
            targetMatch.scoreA = tempScore;
        } else {
            targetMatch.teamB = tempTeam;
            targetMatch.scoreB = tempScore;
        }
        
        // 승자 초기화
        targetMatch.winner = null;
    }

    // 다른 매치 간 팀 교체
    function swapTeamsBetweenMatches(sourceMatchId, sourceTeamType, targetMatchId, targetTeamType) {
        const currentTourney = getCurrentTournament();
        if (!currentTourney) return;
        
        // 소스 매치와 타겟 매치 찾기
        let sourceMatch = null;
        let targetMatch = null;
        
        for (let round of currentTourney.rounds) {
            for (let match of round) {
                if (match.id === sourceMatchId) {
                    sourceMatch = match;
                }
                if (match.id === targetMatchId) {
                    targetMatch = match;
                }
            }
        }
        
        if (!sourceMatch || !targetMatch) return;
        
        // 팀과 점수 교체
        const sourceTeam = sourceTeamType === 'A' ? sourceMatch.teamA : sourceMatch.teamB;
        const sourceScore = sourceTeamType === 'A' ? sourceMatch.scoreA : sourceMatch.scoreB;
        
        const targetTeam = targetTeamType === 'A' ? targetMatch.teamA : targetMatch.teamB;
        const targetScore = targetTeamType === 'A' ? targetMatch.scoreA : targetMatch.scoreB;
        
        // 교체 실행
        if (sourceTeamType === 'A') {
            sourceMatch.teamA = targetTeam;
            sourceMatch.scoreA = targetScore;
        } else {
            sourceMatch.teamB = targetTeam;
            sourceMatch.scoreB = targetScore;
        }
        
        if (targetTeamType === 'A') {
            targetMatch.teamA = sourceTeam;
            targetMatch.scoreA = sourceScore;
        } else {
            targetMatch.teamB = sourceTeam;
            targetMatch.scoreB = sourceScore;
        }
        
        // 승자 초기화
        sourceMatch.winner = null;
        targetMatch.winner = null;
    }

    function makeRoundLabels(count) {
      if(count<=0) return []; 
      if(count===1) return ["Final"]; 
      if(count===2) return ["Semi-Final","Final"];
      if(count===3) return ["8강","Semi-Final","Final"]; 
      if(count===4) return ["16강","8강","Semi-Final","Final"];
      if(count===5) return ["32강","16강","8강","Semi-Final","Final"];
      if(count===6) return ["64강","32강","16강","8강","Semi-Final","Final"];
      return Array.from({length:count}, (_,i)=> {
        if(i === count - 1) return "Final";
        if(i === count - 2) return "Semi-Final";
        if(i === count - 3) return "8강";
        if(i === count - 4) return "16강";
        if(i === count - 5) return "32강";
        if(i === count - 6) return "64강";
        return `${Math.pow(2, count - 1 - i)}강`;
      });
    }

    function getMedal(type) {
        const colors = { gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' };
        const rank = { gold: '1위', silver: '2위', bronze: '공동 3위' };
        return `<span class="rank-badge" data-tooltip="${rank[type]}"><svg viewBox="0 0 24 24" fill="${colors[type]}"><path d="M12 2L9.5 7.5 4 8l4.5 4L7 18l5-3 5 3-1.5-6 4.5-4-5.5-.5z"/></svg></span>`;
    }
    
    function drawSvgLines() {
        const svg = $("#svgLayer");
        const roundsEl = $("#rounds");
        if(!svg || !roundsEl) return;
        svg.innerHTML = "";
        const scrollW = roundsEl.scrollWidth; const scrollH = roundsEl.scrollHeight;
        svg.setAttribute("viewBox", `0 0 ${scrollW} ${scrollH}`);
        svg.setAttribute("width", scrollW); svg.setAttribute("height", scrollH);
        
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if(!tourney || !Array.isArray(tourney.rounds)) return;

        for(let r=0; r < tourney.rounds.length-1; r++){
            const currentRound = tourney.rounds[r];
            currentRound.forEach(match => {
                if (!match || !match.parentId) return;

                const childCard = roundsEl.querySelector(`[data-match-id="${match.id}"]`);
                const parentCard = roundsEl.querySelector(`[data-match-id="${match.parentId}"]`);
                if (!childCard || !parentCard) return;

                const start = getBottomRight(childCard, roundsEl);
                const end = getBottomLeft(parentCard, roundsEl);
                
                // 곡선 연결선
                const path = document.createElementNS("http://www.w3.org/2000/svg","path");
                const gap = 40;
                const midX = start.x + gap;
                const d = `M ${start.x} ${start.y} 
                          C ${midX} ${start.y} ${midX} ${end.y} ${end.x} ${end.y}`;
                path.setAttribute("d", d);
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", match.winner ? "var(--accent)" : "var(--line)");
                path.setAttribute("stroke-width", match.winner ? "2.5" : "1.5");
                path.setAttribute("stroke-linecap", "round");
                path.setAttribute("stroke-linejoin", "round");
                svg.appendChild(path);
            });
        }
    }
    function getCenterRight(el, container){ const r1 = el.getBoundingClientRect(); const rC = container.getBoundingClientRect(); return { x: (r1.right - rC.left) + container.scrollLeft, y: (r1.top - rC.top) + r1.height/2 + container.scrollTop }; }
    function getCenterLeft(el, container){ const r1 = el.getBoundingClientRect(); const rC = container.getBoundingClientRect(); return { x: (r1.left - rC.left) + container.scrollLeft, y: (r1.top - rC.top) + r1.height/2 + container.scrollTop }; }
    function getBottomRight(el, container){ const r1 = el.getBoundingClientRect(); const rC = container.getBoundingClientRect(); return { x: (r1.right - rC.left) + 15 + container.scrollLeft, y: (r1.bottom - rC.top) + 18 + container.scrollTop }; }
    function getBottomLeft(el, container){ const r1 = el.getBoundingClientRect(); const rC = container.getBoundingClientRect(); return { x: (r1.left - rC.left) + 15 + container.scrollLeft, y: (r1.bottom - rC.top) + 18 + container.scrollTop }; }

    // 드래그&드롭 이벤트 핸들러
    function handleDragStart(event) {
        const team = event.target.closest('.team');
        if (!team) return;
        
        team.classList.add('dragging');
        event.dataTransfer.setData('text/plain', JSON.stringify({
            matchId: team.dataset.matchId,
            teamType: team.dataset.teamType,
            teamName: team.dataset.teamName
        }));
        event.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        const team = event.target.closest('.team');
        if (team) {
            team.classList.add('drag-over');
        }
    }

    function handleDragLeave(event) {
        const team = event.target.closest('.team');
        if (team) {
            team.classList.remove('drag-over');
        }
    }

    // handleDrop 함수는 위에 정의됨 (중복 제거)

    function swapTeams(sourceMatchId, sourceTeamType, targetMatchId, targetTeamType) {
        const tourney = getCurrentTournament();
        if (!tourney) return;
        
        const sourceMatch = findMatchById(tourney, sourceMatchId);
        const targetMatch = findMatchById(tourney, targetMatchId);
        
        if (!sourceMatch || !targetMatch) return;
        
        // 팀 데이터 교환
        const sourceTeam = sourceTeamType === 'A' ? sourceMatch.teamA : sourceMatch.teamB;
        const sourceScore = sourceTeamType === 'A' ? sourceMatch.scoreA : sourceMatch.scoreB;
        const targetTeam = targetTeamType === 'A' ? targetMatch.teamA : targetMatch.teamB;
        const targetScore = targetTeamType === 'A' ? targetMatch.scoreA : targetMatch.scoreB;
        
        // 팀과 점수 교환
        if (sourceTeamType === 'A') {
            sourceMatch.teamA = targetTeam;
            sourceMatch.scoreA = targetScore;
        } else {
            sourceMatch.teamB = targetTeam;
            sourceMatch.scoreB = targetScore;
        }
        
        if (targetTeamType === 'A') {
            targetMatch.teamA = sourceTeam;
            targetMatch.scoreA = sourceScore;
        } else {
            targetMatch.teamB = sourceTeam;
            targetMatch.scoreB = sourceScore;
        }
        
        // 승자 재계산
        propagateWinners(tourney);
        
        // 대진표 다시 그리기
        renderBracket(tourney);
        drawSvgLines();
        saveDataToFirestore();
    }

    function findMatchById(tourney, matchId) {
        for (let round of tourney.rounds) {
            for (let match of round) {
                if (match.id === matchId) {
                    return match;
                }
            }
        }
        return null;
    }



    // ========================================
    // 데이터 가져오기/내보내기 및 공용
    // ========================================
    function getFormattedDate() {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ========================================
    // PAPS UI 및 로직
    // ========================================
    window.window.papsItems = {
        "심폐지구력": { id: "endurance", options: ["왕복오래달리기", "오래달리기", "스텝검사"] },
        "유연성": { id: "flexibility", options: ["앉아윗몸앞으로굽히기", "종합유연성검사"] },
        "근력/근지구력": { id: "strength", options: ["악력", "팔굽혀펴기", "윗몸말아올리기"] },
        "순발력": { id: "power", options: ["제자리멀리뛰기", "50m 달리기"] },
        "체지방": { id: "bodyfat", options: ["BMI"] }
    };

    // PAPS 평가 기준 데이터 (2024년 기준으로 업데이트)
    const papsCriteriaData = {
      "남자":{
        "초4":{"왕복오래달리기":[[96,9999,1],[69,95,2],[45,68,3],[26,44,4],[0,25,5]],"앉아윗몸앞으로굽히기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"제자리멀리뛰기":[[170.1,9999,1],[149.1,170,2],[130.1,149,3],[100.1,130,4],[0,100,5]],"팔굽혀펴기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"윗몸말아올리기":[[80,9999,1],[40,79,2],[22,39,3],[7,21,4],[0,6,5]],"악력":[[31,9999,1],[18.5,30.9,2],[15,18.4,3],[11.5,14.9,4],[0,11.4,5]],"50m 달리기":[[0,8.8,1],[8.81,9.7,2],[9.71,10.5,3],[10.51,13.2,4],[13.21,9999,5]],"오래달리기걷기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[25,9999,1],[22,24.9,2],[19,21.9,3],[16,18.9,4],[0,15.9,5]]},
        "초5":{"왕복오래달리기":[[100,9999,1],[73,99,2],[50,72,3],[29,49,4],[0,28,5]],"앉아윗몸앞으로굽히기":[[8,9999,1],[5,7.9,2],[1,4.9,3],[-4,0.9,4],[-999,-4.1,5]],"제자리멀리뛰기":[[180.1,9999,1],[159.1,180,2],[141.1,159,3],[111.1,141,4],[0,111,5]],"팔굽혀펴기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"윗몸말아올리기":[[80,9999,1],[40,79,2],[22,39,3],[10,21,4],[0,9,5]],"악력":[[31,9999,1],[23,30.9,2],[17,22.9,3],[12.5,16.9,4],[0,12.4,5]],"50m 달리기":[[0,8.5,1],[8.51,9.4,2],[9.41,10.2,3],[10.21,13.2,4],[13.21,9999,5]],"오래달리기걷기":[[0,281,1],[282,324,2],[325,409,3],[410,479,4],[480,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[28,9999,1],[25,27.9,2],[22,24.9,3],[19,21.9,4],[0,18.9,5]]},
        "초6":{"왕복오래달리기":[[104,9999,1],[78,103,2],[54,77,3],[32,53,4],[0,31,5]],"앉아윗몸앞으로굽히기":[[8,9999,1],[5,7.9,2],[1,4.9,3],[-4,0.9,4],[-999,-4.1,5]],"제자리멀리뛰기":[[200.1,9999,1],[167.1,200,2],[148.1,167,3],[122.1,148,4],[0,122,5]],"팔굽혀펴기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"윗몸말아올리기":[[80,9999,1],[40,79,2],[22,39,3],[10,21,4],[0,9,5]],"악력":[[35,9999,1],[26.5,34.9,2],[19,26.4,3],[15,18.9,4],[0,14.9,5]],"50m 달리기":[[0,8.1,1],[8.11,9.1,2],[9.11,10,3],[10.01,12.5,4],[12.51,9999,5]],"오래달리기걷기":[[0,250,1],[251,314,2],[315,379,3],[380,449,4],[450,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[31,9999,1],[28,30.9,2],[25,27.9,3],[22,24.9,4],[0,21.9,5]]},
        "중1":{"왕복오래달리기":[[64,9999,1],[50,63,2],[36,49,3],[20,35,4],[0,19,5]],"앉아윗몸앞으로굽히기":[[10,9999,1],[6,9.9,2],[2,5.9,3],[-4,1.9,4],[-999,-4.1,5]],"제자리멀리뛰기":[[211.1,9999,1],[177.1,211,2],[159.1,177,3],[131.1,159,4],[0,131,5]],"팔굽혀펴기":[[34,9999,1],[25,33,2],[12,24,3],[4,11,4],[0,3,5]],"윗몸말아올리기":[[90,9999,1],[55,89,2],[33,54,3],[14,32,4],[0,13,5]],"악력":[[42,9999,1],[30,41.9,2],[22.5,29.9,3],[16.5,22.4,4],[0,16.4,5]],"50m 달리기":[[0,7.5,1],[7.51,8.4,2],[8.41,9.3,3],[9.31,11.5,4],[11.51,9999,5]],"오래달리기걷기":[[0,425,1],[426,502,2],[503,599,3],[600,699,4],[700,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[34,9999,1],[31,33.9,2],[28,30.9,3],[25,27.9,4],[0,24.9,5]]},
        "중2":{"왕복오래달리기":[[66,9999,1],[52,65,2],[38,51,3],[22,37,4],[0,21,5]],"앉아윗몸앞으로굽히기":[[10,9999,1],[7,9.9,2],[2,6.9,3],[-4,1.9,4],[-999,-4.1,5]],"제자리멀리뛰기":[[218.1,9999,1],[187.1,218,2],[169.1,187,3],[136.1,169,4],[0,136,5]],"팔굽혀펴기":[[34,9999,1],[25,33,2],[12,24,3],[4,11,4],[0,3,5]],"윗몸말아올리기":[[90,9999,1],[55,89,2],[33,54,3],[14,32,4],[0,13,5]],"악력":[[44.5,9999,1],[37,44.4,2],[28.5,36.9,3],[22,28.4,4],[0,21.9,5]],"50m 달리기":[[0,7.3,1],[7.31,8.2,2],[8.21,9,3],[9.01,11.5,4],[11.51,9999,5]],"오래달리기걷기":[[0,416,1],[417,487,2],[488,583,3],[584,679,4],[680,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[37,9999,1],[34,36.9,2],[31,33.9,3],[28,30.9,4],[0,27.9,5]]},
        "중3":{"왕복오래달리기":[[68,9999,1],[54,67,2],[40,53,3],[24,39,4],[0,23,5]],"앉아윗몸앞으로굽히기":[[10,9999,1],[7,9.9,2],[2.6,6.9,3],[-3,2.5,4],[-999,-3.1,5]],"제자리멀리뛰기":[[238.1,9999,1],[201.1,238,2],[180.1,201,3],[145.1,180,4],[0,145,5]],"팔굽혀펴기":[[34,9999,1],[25,33,2],[14,24,3],[4,13,4],[0,3,5]],"윗몸말아올리기":[[90,9999,1],[55,89,2],[33,54,3],[14,32,4],[0,13,5]],"악력":[[48.5,9999,1],[40.5,48.4,2],[33,40.4,3],[25,32.9,4],[0,24.9,5]],"50m 달리기":[[0,7,1],[7.01,7.8,2],[7.81,8.5,3],[8.51,11,4],[11.01,9999,5]],"오래달리기걷기":[[0,407,1],[408,472,2],[473,567,3],[568,659,4],[660,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[40,9999,1],[37,39.9,2],[34,36.9,3],[31,33.9,4],[0,30.9,5]]},
        "고1":{"왕복오래달리기":[[70,9999,1],[56,69,2],[42,55,3],[26,41,4],[0,25,5]],"앉아윗몸앞으로굽히기":[[13,9999,1],[9,12.9,2],[4,8.9,3],[-2,3.9,4],[-999,-2.1,5]],"제자리멀리뛰기":[[255.1,9999,1],[216.1,255,2],[195.1,216,3],[160.1,195,4],[0,160,5]],"팔굽혀펴기":[[46,9999,1],[30,45,2],[16,29,3],[7,15,4],[0,6,5]],"윗몸말아올리기":[[90,9999,1],[60,89,2],[35,59,3],[15,34,4],[0,14,5]],"악력":[[61,9999,1],[42.5,60.9,2],[35.5,42.4,3],[29,35.4,4],[0,28.9,5]],"50m 달리기":[[0,7,1],[7.01,7.6,2],[7.61,8.1,3],[8.11,10,4],[10.01,9999,5]],"오래달리기걷기":[[0,398,1],[399,457,2],[458,551,3],[552,639,4],[640,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[43,9999,1],[40,42.9,2],[37,39.9,3],[34,36.9,4],[0,33.9,5]]},
        "고2":{"왕복오래달리기":[[72,9999,1],[58,71,2],[44,57,3],[28,43,4],[0,27,5]],"앉아윗몸앞으로굽히기":[[16,9999,1],[11,15.9,2],[5,10.9,3],[0.1,4.9,4],[0,0,5]],"제자리멀리뛰기":[[258.1,9999,1],[228.1,258,2],[212.1,228,3],[177.1,212,4],[0,177,5]],"팔굽혀펴기":[[50,9999,1],[42,49,2],[25,41,3],[11,24,4],[0,10,5]],"윗몸말아올리기":[[90,9999,1],[60,89,2],[35,59,3],[17,34,4],[0,16,5]],"악력":[[61,9999,1],[46,60.9,2],[39,45.9,3],[31,38.9,4],[0,30.9,5]],"50m 달리기":[[0,6.7,1],[6.71,7.5,2],[7.51,7.9,3],[7.91,9.5,4],[9.51,9999,5]],"오래달리기걷기":[[0,389,1],[390,442,2],[443,535,3],[536,619,4],[620,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[46,9999,1],[43,45.9,2],[40,42.9,3],[37,39.9,4],[0,36.9,5]]},
        "고3":{"왕복오래달리기":[[74,9999,1],[60,73,2],[46,59,3],[30,45,4],[0,29,5]],"앉아윗몸앞으로굽히기":[[16,9999,1],[11,15.9,2],[6,10.9,3],[0.1,5.9,4],[0,0,5]],"제자리멀리뛰기":[[264.1,9999,1],[243.1,264,2],[221.1,243,3],[185.1,221,4],[0,185,5]],"팔굽혀펴기":[[56,9999,1],[46,55,2],[30,45,3],[17,29,4],[0,16,5]],"윗몸말아올리기":[[90,9999,1],[60,89,2],[35,59,3],[17,34,4],[0,16,5]],"악력":[[63.5,9999,1],[46,63.4,2],[39,45.9,3],[31,38.9,4],[0,30.9,5]],"50m 달리기":[[0,6.7,1],[6.71,7.5,2],[7.51,7.9,3],[7.91,8.7,4],[8.71,9999,5]],"오래달리기걷기":[[0,380,1],[381,427,2],[428,519,3],[520,599,4],[600,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[49,9999,1],[46,48.9,2],[43,45.9,3],[40,42.9,4],[0,39.9,5]]}
      },
      "여자":{
        "초4":{"왕복오래달리기":[[77,9999,1],[57,76,2],[40,56,3],[21,39,4],[0,20,5]],"앉아윗몸앞으로굽히기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"제자리멀리뛰기":[[161.1,9999,1],[135.1,161,2],[119.1,135,3],[97.1,119,4],[0,97,5]],"무릎대고팔굽혀펴기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"윗몸말아올리기":[[60,9999,1],[29,59,2],[18,28,3],[6,17,4],[0,5,5]],"악력":[[29,9999,1],[18,28.9,2],[13.5,17.9,3],[10.5,13.4,4],[0,10.4,5]],"50m 달리기":[[0,9.4,1],[9.41,10.4,2],[10.41,11,3],[11.01,13.3,4],[13.31,9999,5]],"오래달리기걷기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[20,9999,1],[17,19.9,2],[14,16.9,3],[11,13.9,4],[0,10.9,5]]},
        "초5":{"왕복오래달리기":[[85,9999,1],[63,84,2],[45,62,3],[23,44,4],[0,22,5]],"앉아윗몸앞으로굽히기":[[10,9999,1],[7,9.9,2],[5,6.9,3],[1,4.9,4],[0,0.9,5]],"제자리멀리뛰기":[[170.1,9999,1],[139.1,170,2],[123.1,139,3],[100.1,123,4],[0,100,5]],"무릎대고팔굽혀펴기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"윗몸말아올리기":[[60,9999,1],[36,59,2],[23,35,3],[7,22,4],[0,6,5]],"악력":[[29,9999,1],[19,28.9,2],[15.5,18.9,3],[12,15.4,4],[0,11.9,5]],"50m 달리기":[[0,8.9,1],[8.91,9.9,2],[9.91,10.7,3],[10.71,13.3,4],[13.31,9999,5]],"오래달리기걷기":[[0,299,1],[300,359,2],[360,441,3],[442,501,4],[502,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[23,9999,1],[20,22.9,2],[17,19.9,3],[14,16.9,4],[0,13.9,5]]},
        "초6":{"왕복오래달리기":[[93,9999,1],[69,92,2],[50,68,3],[25,49,4],[0,24,5]],"앉아윗몸앞으로굽히기":[[14,9999,1],[10,13.9,2],[5,9.9,3],[2,4.9,4],[0,1.9,5]],"제자리멀리뛰기":[[175.1,9999,1],[144.1,175,2],[127.1,144,3],[100.1,127,4],[0,100,5]],"무릎대고팔굽혀펴기":[[0,0,1],[0,0,2],[0,0,3],[0,0,4],[0,0,5]],"윗몸말아올리기":[[60,9999,1],[43,59,2],[23,42,3],[7,22,4],[0,6,5]],"악력":[[33,9999,1],[22,32.9,2],[19,21.9,3],[14,18.9,4],[0,13.9,5]],"50m 달리기":[[0,8.9,1],[8.91,9.8,2],[9.81,10.7,3],[10.71,12.9,4],[12.91,9999,5]],"오래달리기걷기":[[0,299,1],[300,353,2],[354,429,3],[430,479,4],[480,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[26,9999,1],[23,25.9,2],[20,22.9,3],[17,19.9,4],[0,16.9,5]]},
        "중1":{"왕복오래달리기":[[35,9999,1],[25,34,2],[19,24,3],[14,18,4],[0,13,5]],"앉아윗몸앞으로굽히기":[[15,9999,1],[11,14.9,2],[8,10.9,3],[2,7.9,4],[0,1.9,5]],"제자리멀리뛰기":[[175.1,9999,1],[144.1,175,2],[127.1,144,3],[100.1,127,4],[0,100,5]],"무릎대고팔굽혀펴기":[[45,9999,1],[24,44,2],[14,23,3],[6,13,4],[0,5,5]],"윗몸말아올리기":[[58,9999,1],[43,57,2],[22,42,3],[7,21,4],[0,6,5]],"악력":[[36,9999,1],[23,35.9,2],[19,22.9,3],[14,18.9,4],[0,13.9,5]],"50m 달리기":[[0,8.8,1],[8.81,9.8,2],[9.81,10.5,3],[10.51,12.2,4],[12.21,9999,5]],"오래달리기걷기":[[0,379,1],[380,442,2],[443,517,3],[518,608,4],[609,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[29,9999,1],[26,28.9,2],[23,25.9,3],[20,22.9,4],[0,19.9,5]]},
        "중2":{"왕복오래달리기":[[40,9999,1],[29,39,2],[21,28,3],[15,20,4],[0,14,5]],"앉아윗몸앞으로굽히기":[[15,9999,1],[11,14.9,2],[8,10.9,3],[2,7.9,4],[0,1.9,5]],"제자리멀리뛰기":[[183.1,9999,1],[145.1,183,2],[127.1,145,3],[100.1,127,4],[0,100,5]],"무릎대고팔굽혀펴기":[[40,9999,1],[24,39,2],[14,23,3],[6,13,4],[0,5,5]],"윗몸말아올리기":[[58,9999,1],[39,57,2],[19,38,3],[7,18,4],[0,6,5]],"악력":[[36,9999,1],[25.5,35.9,2],[19.5,25.4,3],[14,19.4,4],[0,13.9,5]],"50m 달리기":[[0,8.8,1],[8.81,9.8,2],[9.81,10.5,3],[10.51,12.2,4],[12.21,9999,5]],"오래달리기걷기":[[0,379,1],[380,442,2],[443,517,3],[518,608,4],[609,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[32,9999,1],[29,31.9,2],[26,28.9,3],[23,25.9,4],[0,22.9,5]]},
        "중3":{"왕복오래달리기":[[45,9999,1],[33,44,2],[23,32,3],[16,22,4],[0,15,5]],"앉아윗몸앞으로굽히기":[[16,9999,1],[11,15.9,2],[8,10.9,3],[2,7.9,4],[0,1.9,5]],"제자리멀리뛰기":[[183.1,9999,1],[145.1,183,2],[127.1,145,3],[100.1,127,4],[0,100,5]],"무릎대고팔굽혀펴기":[[40,9999,1],[24,39,2],[14,23,3],[6,13,4],[0,5,5]],"윗몸말아올리기":[[52,9999,1],[34,51,2],[17,33,3],[6,16,4],[0,5,5]],"악력":[[36,9999,1],[27.5,35.9,2],[19.5,27.4,3],[16,19.4,4],[0,15.9,5]],"50m 달리기":[[0,8.8,1],[8.81,9.8,2],[9.81,10.5,3],[10.51,12.2,4],[12.21,9999,5]],"오래달리기걷기":[[0,379,1],[380,442,2],[443,517,3],[518,608,4],[609,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[35,9999,1],[32,34.9,2],[29,31.9,3],[26,28.9,4],[0,25.9,5]]},
        "고1":{"왕복오래달리기":[[50,9999,1],[37,49,2],[25,36,3],[17,24,4],[0,16,5]],"앉아윗몸앞으로굽히기":[[16,9999,1],[11,15.9,2],[8,10.9,3],[2,7.9,4],[0,1.9,5]],"제자리멀리뛰기":[[186.1,9999,1],[159.1,186,2],[139.1,159,3],[100.1,139,4],[0,100,5]],"무릎대고팔굽혀펴기":[[40,9999,1],[24,39,2],[14,23,3],[6,13,4],[0,5,5]],"윗몸말아올리기":[[40,9999,1],[30,39,2],[13,29,3],[4,12,4],[0,3,5]],"악력":[[36,9999,1],[29,35.9,2],[23,28.9,3],[16.5,22.9,4],[0,16.4,5]],"50m 달리기":[[0,8.8,1],[8.81,9.8,2],[9.81,10.5,3],[10.51,12.2,4],[12.21,9999,5]],"오래달리기걷기":[[0,379,1],[380,442,2],[443,517,3],[518,608,4],[609,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[38,9999,1],[35,37.9,2],[32,34.9,3],[29,31.9,4],[0,28.9,5]]},
        "고2":{"왕복오래달리기":[[55,9999,1],[41,54,2],[27,40,3],[18,26,4],[0,17,5]],"앉아윗몸앞으로굽히기":[[17,9999,1],[12,16.9,2],[9,11.9,3],[5,8.9,4],[0,4.9,5]],"제자리멀리뛰기":[[186.1,9999,1],[159.1,186,2],[139.1,159,3],[100.1,139,4],[0,100,5]],"무릎대고팔굽혀펴기":[[40,9999,1],[30,39,2],[18,29,3],[9,17,4],[0,8,5]],"윗몸말아올리기":[[40,9999,1],[30,39,2],[13,29,3],[4,12,4],[0,3,5]],"악력":[[37.5,9999,1],[29.5,37.4,2],[25,29.4,3],[18,24.9,4],[0,17.9,5]],"50m 달리기":[[0,8.8,1],[8.81,9.5,2],[9.51,10.5,3],[10.51,12.2,4],[12.21,9999,5]],"오래달리기걷기":[[0,379,1],[380,442,2],[443,517,3],[518,608,4],[609,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[41,9999,1],[38,40.9,2],[35,37.9,3],[32,34.9,4],[0,31.9,5]]},
        "고3":{"왕복오래달리기":[[55,9999,1],[41,54,2],[27,40,3],[18,26,4],[0,17,5]],"앉아윗몸앞으로굽히기":[[17,9999,1],[12,16.9,2],[9,11.9,3],[5,8.9,4],[0,4.9,5]],"제자리멀리뛰기":[[186.1,9999,1],[159.1,186,2],[139.1,159,3],[100.1,139,4],[0,100,5]],"무릎대고팔굽혀펴기":[[40,9999,1],[30,39,2],[18,29,3],[9,17,4],[0,8,5]],"윗몸말아올리기":[[40,9999,1],[30,39,2],[13,29,3],[4,12,4],[0,3,5]],"악력":[[37.5,9999,1],[29.5,37.4,2],[25,29.4,3],[18,24.9,4],[0,17.9,5]],"50m 달리기":[[0,8.8,1],[8.81,9.5,2],[9.51,10.5,3],[10.51,12.2,4],[12.21,9999,5]],"오래달리기걷기":[[0,379,1],[380,442,2],[443,517,3],[518,608,4],[609,9999,5]],"스텝검사":[[76,9999,1],[62,75.9,2],[52,61.9,3],[47,51.9,4],[0,46.9,5]],"던지기":[[44,9999,1],[41,43.9,2],[38,40.9,3],[35,37.9,4],[0,34.9,5]]}
      },
      "BMI":{
        "남자":{
          "초4":[[14.1,20.1,"정상"],[20.2,22.3,"과체중"],[0,14,"마름"],[22.4,24.7,"경도비만"],[24.8,9999,"고도비만"]],
          "초5":[[14.4,20.9,"정상"],[21,23.2,"과체중"],[0,14.3,"마름"],[23.3,25.8,"경도비만"],[25.9,9999,"고도비만"]],
          "초6":[[15,21.7,"정상"],[21.8,24,"과체중"],[0,14.9,"마름"],[24.1,26.8,"경도비만"],[26.9,9999,"고도비만"]],
          "중1":[[15.4,23.2,"정상"],[23.3,24.9,"과체중"],[0,15.3,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "중2":[[15.8,23.8,"정상"],[23.9,24.9,"과체중"],[0,15.7,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "중3":[[16.3,24.3,"정상"],[24.4,24.9,"과체중"],[0,16.2,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "고1":[[16.8,24.6,"정상"],[24.7,24.9,"과체중"],[0,16.7,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "고2":[[17.3,24.9,"정상"],[25,29.9,"과체중"],[0,17.2,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "고3":[[17.8,24.9,"정상"],[25,29.9,"과체중"],[0,17.7,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]]
        },
        "여자":{
          "초4":[[13.9,19.9,"정상"],[20,22.1,"과체중"],[0,13.8,"마름"],[22.2,24.7,"경도비만"],[24.8,9999,"고도비만"]],
          "초5":[[14.2,20.8,"정상"],[20.9,23.2,"과체중"],[0,14.1,"마름"],[23.3,25.8,"경도비만"],[25.9,9999,"고도비만"]],
          "초6":[[14.8,21.8,"정상"],[21.9,24.2,"과체중"],[0,14.7,"마름"],[24.3,26.8,"경도비만"],[26.9,9999,"고도비만"]],
          "중1":[[15.2,22.1,"정상"],[22.2,24.7,"과체중"],[0,15.1,"마름"],[24.8,29.9,"경도비만"],[30,9999,"고도비만"]],
          "중2":[[15.7,22.7,"정상"],[22.8,24.9,"과체중"],[0,15.6,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "중3":[[16.3,23.2,"정상"],[23.3,24.9,"과체중"],[0,16.2,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "고1":[[16.8,23.6,"정상"],[23.7,24.9,"과체중"],[0,16.7,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "고2":[[17.3,23.8,"정상"],[23.9,24.9,"과체중"],[0,17.2,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]],
          "고3":[[17.7,23.9,"정상"],[24,24.9,"과체중"],[0,17.6,"마름"],[25,29.9,"경도비만"],[30,9999,"고도비만"]]
        }
      }
    };

    function renderPapsUI() {
        if (papsManager) {
            papsManager.renderPapsUI();
        } else {
            console.error('PapsManager가 초기화되지 않음');
        }
    }

    function renderPapsClassList() {
        $('#sidebar-list-container').innerHTML = papsData.classes.map(c => `
            <div class="list-card ${c.id === papsData.activeClassId ? 'active' : ''}" onclick="selectPapsClass(${c.id})">
                <div style="flex-grow:1;">
                    <div class="name">${c.name}</div>
                    <div class="details">${(c.students||[]).length}명 · ${c.gradeLevel||'학년 미설정'}</div>
                </div>
                <div class="action-buttons row">
                    <button onclick="event.stopPropagation(); showPapsSettings()" data-tooltip="설정 수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick="event.stopPropagation(); deletePapsClass(${c.id})" data-tooltip="삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </div>
        `).join('');
    }

    function createPapsClass() {
        if (papsManager) {
            papsManager.createPapsClass();
        } else {
            console.error('PapsManager가 초기화되지 않음');
        }
    }

    function editPapsClass(id) {
        const cls = papsData.classes.find(c => c.id === id);
        if (!cls) return;
        showModal({
            title: 'PAPS 반 정보',
            body: `<label>반 이름</label><input id="modal-input-name" class="field" style="width:100%" value="${cls.name}">\
                  <label style="margin-top:8px; display:block;">학년</label><select id="modal-input-grade" class="field" style="width:100%">
                    <option value="">학년 선택</option>
                    <option value="초4">초4</option><option value="초5">초5</option><option value="초6">초6</option>
                    <option value="중1">중1</option><option value="중2">중2</option><option value="중3">중3</option>
                    <option value="고1">고1</option><option value="고2">고2</option><option value="고3">고3</option>
                  </select>`,
            actions: [
                { text: '취소', callback: closeModal },
                { text: '저장', type: 'primary', callback: () => {
                    cls.name = $('#modal-input-name').value.trim() || cls.name;
                    cls.gradeLevel = $('#modal-input-grade').value;
                    saveDataToFirestore();
                    renderPapsUI();
                    // 좌측 사이드바의 반 카드도 실시간으로 업데이트
                    renderPapsClassList();
                    closeModal();
                }}
            ]
        });
        setTimeout(() => { $('#modal-input-grade').value = cls.gradeLevel || ''; }, 0);
    }

    function deletePapsClass(id) {
        showModal({ title: '반 삭제', body: '이 반의 모든 PAPS 데이터가 삭제됩니다. 진행하시겠습니까?', actions: [
            { text: '취소', callback: closeModal },
            { text: '삭제', type: 'danger', callback: () => {
                papsData.classes = papsData.classes.filter(c => c.id !== id);
                if (papsData.activeClassId === id) papsData.activeClassId = null;
                saveDataToFirestore(); renderPapsUI(); closeModal();
            }}
        ]});
    }

    function selectPapsClass(id) { 
        if (papsManager) {
            papsManager.selectPapsClass(id);
        } else {
            console.error('PapsManager가 초기화되지 않음');
        }
    }

    function renderPapsDashboard(cls) {
        if (papsManager) {
            papsManager.renderPapsDashboard(cls);
        } else {
            console.error('PapsManager가 초기화되지 않음');
        }
    }
        
        let settingsCardHtml = '';
        if (!hasSettings) {
            // 설정이 완료되지 않은 경우에만 설정 카드 표시
            settingsCardHtml = `
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <div class="paps-toolbar" style="justify-content: space-between;">
                        <h3 style="margin: 0;">PAPS 설정</h3>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn primary" id="paps-save-settings-btn">설정 저장</button>
                            <button class="btn" id="paps-download-template-btn">학생 명렬표 양식</button>
                            <input type="file" id="paps-student-upload" class="hidden" accept=".xlsx,.xls,.csv"/>
                            <button class="btn primary" id="paps-load-list-btn">명렬표 불러오기</button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="paps-grid">
                        <div class="paps-event-group"><label style="min-width:90px; color: var(--ink-muted);">학년 설정</label>
                            <select id="paps-grade-select">
                                <option value="">학년 선택</option>
                                <option value="초4">초4</option><option value="초5">초5</option><option value="초6">초6</option>
                                <option value="중1">중1</option><option value="중2">중2</option><option value="중3">중3</option>
                                <option value="고1">고1</option><option value="고2">고2</option><option value="고3">고3</option>
                            </select>
                        </div>
                        ${Object.keys(window.papsItems).filter(k=>k!=="체지방").map(category => {
                            const item = window.papsItems[category];
                            const current = cls.eventSettings[item.id] || item.options[0];
                            return `<div class="paps-event-group"><label style="min-width:90px; color: var(--ink-muted);">${category}</label><select data-paps-category="${item.id}">${item.options.map(o => `<option value="${o}" ${o===current?'selected':''}>${o}</option>`).join('')}</select></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
        }
        
        $('#content-wrapper').innerHTML = `
            <div class="paps-toolbar">
                <h2 style="margin:0;">${cls.name} PAPS 설정</h2>
                <div class="row">
                    <span class="paps-chip">학년: ${cls.gradeLevel || '미설정'}</span>
                </div>
            </div>
            ${settingsCardHtml}
            <section class="section-box">
                <div class="paps-toolbar">
                    <h2 style="margin:0;">기록 입력</h2>
                    <div class="row">
                        <button class="btn" id="paps-add-student-btn">학생 추가</button>
                        
                        <button class="btn danger" id="paps-delete-selected-btn">선택 삭제</button>
                    </div>
                </div>
                <div class="paps-table-wrap">
                    <table id="paps-record-table" class="styled-table">
                        <thead id="paps-record-head"></thead>
                        <tbody id="paps-record-body"></tbody>
                    </table>
                </div>
                <div class="paps-toolbar" style="margin-top: 16px; justify-content: center;">
                    <button class="btn primary" id="paps-show-charts-btn">그래프로 보기</button>
                </div>
            </section>
            <section class="section-box" id="paps-chart-section" style="display:none;">
                <div class="paps-toolbar" style="margin-bottom: 0;">
                    <h2 style="margin:0;">등급 빈도 그래프</h2>
                    <div class="row">
                        <div class="paps-legend">
                            <span class="paps-chip grade-1">1등급</span>
                            <span class="paps-chip grade-2">2등급</span>
                            <span class="paps-chip grade-3">3등급</span>
                            <span class="paps-chip grade-4">4등급</span>
                            <span class="paps-chip grade-5">5등급</span>
                            <span class="paps-chip grade-정상">BMI 정상</span>
                        </div>
                        <button class="btn" id="paps-hide-charts-btn">그래프 닫기</button>
                    </div>
                </div>
                <div id="paps-charts" class="paps-chart-grid"></div>
            </section>
        `;

        // Wire up selectors and actions
        if (!hasSettings) {
            // 설정 카드가 있을 때만 설정 관련 이벤트 리스너 추가
            $('#paps-grade-select').value = cls.gradeLevel || '';
            $$('#content-wrapper select[data-paps-category]').forEach(sel => sel.addEventListener('change', e => {
                cls.eventSettings[e.target.dataset.papsCategory] = e.target.value;
                saveDataToFirestore();
                buildPapsTable(cls);
            }));
            $('#paps-grade-select').addEventListener('change', e => { 
                cls.gradeLevel = e.target.value; 
                saveDataToFirestore(); 
                buildPapsTable(cls);
                // 좌측 사이드바의 반 카드도 실시간으로 업데이트
                renderPapsClassList();
            });
            $('#paps-download-template-btn').addEventListener('click', papsDownloadTemplate);
            $('#paps-load-list-btn').addEventListener('click', () => $('#paps-student-upload').click());
            $('#paps-student-upload').addEventListener('change', e => handlePapsStudentUpload(e, cls));
            // 설정 저장 버튼 이벤트 리스너
            const saveSettingsBtn = $('#paps-save-settings-btn');
            if (saveSettingsBtn) {
                saveSettingsBtn.addEventListener('click', savePapsSettings);
            }
        }
        
        $('#paps-add-student-btn').addEventListener('click', () => { addPapsStudent(cls); buildPapsTable(cls); saveDataToFirestore(); });
        $('#paps-delete-selected-btn').addEventListener('click', () => deleteSelectedPapsStudents(cls));
        $('#paps-show-charts-btn').addEventListener('click', () => { 
            console.log('그래프로 보기 버튼 클릭됨');
            console.log('현재 클래스:', cls);
            console.log('테이블 행 수:', $('#paps-record-body').querySelectorAll('tr').length);
            
            try {
                renderPapsCharts(cls); 
                $('#paps-chart-section').style.display = 'block';
                console.log('차트 섹션 표시됨');
            } catch (error) {
                console.error('차트 렌더링 중 오류 발생:', error);
                alert('차트를 표시하는 중 오류가 발생했습니다: ' + error.message);
            }
        });
        $('#paps-hide-charts-btn').addEventListener('click', () => { 
            $('#paps-chart-section').style.display = 'none'; 
        });

        buildPapsTable(cls);
    }

    function buildPapsTable(cls) {
        const head = $('#paps-record-head');
        const body = $('#paps-record-body');
        // Header build
        let header1 = '<tr><th rowspan="2"><input type="checkbox" id="paps-select-all"></th><th rowspan="2">번호</th><th rowspan="2">이름</th><th rowspan="2">성별</th>'; let header2 = '<tr>';
        Object.keys(window.papsItems).filter(k=>k!=="체지방").forEach(category => {
            const item = window.papsItems[category]; 
            let eventName = cls.eventSettings[item.id] || item.options[0];
            // 성별에 따라 팔굽혀펴기 종목명 변경
            if (eventName === '팔굽혀펴기') {
                eventName = '팔굽혀펴기/무릎대고 팔굽혀펴기';
            }
            // 악력 종목은 왼손/오른손으로 분리
            if (eventName === '악력') {
                header1 += `<th colspan="4">${eventName}</th>`; 
                header2 += '<th>왼손(kg)</th><th>왼손등급</th><th>오른손(kg)</th><th>오른손등급</th>';
            } else {
                header1 += `<th colspan="2">${eventName}</th>`; 
                header2 += '<th>기록</th><th>등급</th>';
            }
        });
        header1 += '<th colspan="4">체지방</th>'; header2 += '<th>신장(cm)</th><th>체중(kg)</th><th>BMI</th><th>등급</th>';
        header1 += '<th rowspan="2">종합 등급</th></tr>'; header2 += '</tr>';
        head.innerHTML = header1 + header2;
        $('#paps-select-all').addEventListener('change', function(){ body.querySelectorAll('.paps-row-checkbox').forEach(cb => cb.checked = this.checked); });

        // Body
        body.innerHTML = '';
        const students = (cls.students||[]).slice().sort((a,b)=> (a.number||0)-(b.number||0));
        students.forEach(st => {
            const tr = document.createElement('tr'); tr.dataset.sid = st.id;
            tr.innerHTML = `
                <td><input type="checkbox" class="paps-row-checkbox"></td>
                <td><input type="number" class="paps-input number" value="${st.number||''}"></td>
                <td><input type="text" class="paps-input name" value="${st.name||''}"></td>
                <td><select class="paps-input gender"><option value="남자" ${st.gender==='남자'?'selected':''}>남</option><option value="여자" ${st.gender==='여자'?'selected':''}>여</option></select></td>
                ${Object.keys(window.papsItems).filter(k=>k!=="체지방").map(k => {
                    const id = window.papsItems[k].id; 
                    const eventName = cls.eventSettings[id] || window.papsItems[k].options[0];
                    
                    // 악력 종목은 왼손/오른손으로 분리
                    if (eventName === '악력') {
                        const leftVal = (st.records||{})[`${id}_left`]||'';
                        const rightVal = (st.records||{})[`${id}_right`]||'';
                        return `<td><input type=\"number\" step=\"any\" class=\"paps-input rec\" data-id=\"${id}_left\" value=\"${leftVal}\"></td><td class=\"grade-cell\" data-id=\"${id}_left\"></td><td><input type=\"number\" step=\"any\" class=\"paps-input rec\" data-id=\"${id}_right\" value=\"${rightVal}\"></td><td class=\"grade-cell\" data-id=\"${id}_right\"></td>`;
                    } else {
                        const val = (st.records||{})[id]||''; 
                        return `<td><input type=\"number\" step=\"any\" class=\"paps-input rec\" data-id=\"${id}\" value=\"${val}\"></td><td class=\"grade-cell\" data-id=\"${id}\"></td>`;
                    }
                }).join('')}
                <td><input type="number" step="any" class="paps-input height" value="${(st.records||{}).height||''}"></td>
                <td><input type="number" step="any" class="paps-input weight" value="${(st.records||{}).weight||''}"></td>
                <td class="bmi-cell"></td>
                <td class="grade-cell" data-id="bodyfat"></td>
                <td class="overall-grade-cell"></td>
            `;
            body.appendChild(tr);
            updatePapsRowGrades(tr, cls);
        });

        body.addEventListener('input', e => onPapsInput(e, cls));
        body.addEventListener('keydown', e => {
            if (e.key !== 'Enter' || !e.target.matches('input')) return; e.preventDefault();
            const cell = e.target.closest('td'); const row = e.target.closest('tr'); if(!cell||!row) return; const idx = Array.from(row.children).indexOf(cell); const next = row.nextElementSibling; if(next){ const ncell = next.children[idx]; const ninp = ncell?.querySelector('input'); if(ninp){ ninp.focus(); ninp.select(); }}
        });
    }

    function onPapsInput(e, cls) {
        const tr = e.target.closest('tr'); if (!tr) return; const sid = Number(tr.dataset.sid); const st = cls.students.find(s=>s.id===sid); if(!st){ return; }
        st.records = st.records || {};
        if (e.target.classList.contains('rec')) { 
            st.records[e.target.dataset.id] = e.target.value; 
        }
        else if (e.target.classList.contains('height')) { st.records.height = e.target.value; }
        else if (e.target.classList.contains('weight')) { st.records.weight = e.target.value; }
        else if (e.target.classList.contains('name')) { st.name = e.target.value; }
        else if (e.target.classList.contains('number')) { st.number = e.target.value; }
        else if (e.target.classList.contains('gender')) { st.gender = e.target.value; }
        updatePapsRowGrades(tr, cls); saveDataToFirestore();
    }

    function updatePapsRowGrades(tr, cls) {
        // BMI
        const h = parseFloat(tr.querySelector('.height')?.value||''); const w = parseFloat(tr.querySelector('.weight')?.value||'');
        const bmiCell = tr.querySelector('.bmi-cell'); let bmi = null; if (h>0 && w>0){ const m = h/100; bmi = w/(m*m); bmiCell.textContent = bmi.toFixed(2); } else { bmiCell.textContent = ''; }
        // Each category
        const studentGender = tr.querySelector('.gender')?.value || '남자'; const gradeLevel = cls.gradeLevel || '';
        tr.querySelectorAll('.grade-cell').forEach(td => { td.textContent=''; td.className='grade-cell'; });
        Object.keys(window.papsItems).forEach(k => {
            const id = window.papsItems[k].id; 
            const eventName = cls.eventSettings[id] || window.papsItems[k].options[0];
            
            if (id === 'bodyfat') { 
                const value = bmi;
                const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                const gradeText = calcPapsGrade(id, value, studentGender, gradeLevel, cls);
                if (td) { td.textContent = gradeText||''; if(gradeText){ td.classList.add(`grade-${gradeText}`); } }
            } else if (eventName === '악력') {
                // 악력은 왼손과 오른손 각각 처리
                const leftValue = parseFloat(tr.querySelector(`.rec[data-id="${id}_left"]`)?.value||'');
                const rightValue = parseFloat(tr.querySelector(`.rec[data-id="${id}_right"]`)?.value||'');
                
                const leftTd = tr.querySelector(`.grade-cell[data-id="${id}_left"]`);
                const rightTd = tr.querySelector(`.grade-cell[data-id="${id}_right"]`);
                
                const leftGradeText = calcPapsGrade(id, leftValue, studentGender, gradeLevel, cls);
                const rightGradeText = calcPapsGrade(id, rightValue, studentGender, gradeLevel, cls);
                
                if (leftTd) { leftTd.textContent = leftGradeText||''; if(leftGradeText){ leftTd.classList.add(`grade-${leftGradeText}`); } }
                if (rightTd) { rightTd.textContent = rightGradeText||''; if(rightGradeText){ rightTd.classList.add(`grade-${rightGradeText}`); } }
            } else {
                const value = parseFloat(tr.querySelector(`.rec[data-id="${id}"]`)?.value||'');
                const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                const gradeText = calcPapsGrade(id, value, studentGender, gradeLevel, cls);
                if (td) { td.textContent = gradeText||''; if(gradeText){ td.classList.add(`grade-${gradeText}`); } }
            }
        });
        // Overall
        const overall = tr.querySelector('.overall-grade-cell'); overall.textContent = calcOverallGrade(tr) || '';
    }

    function calcPapsGrade(categoryId, value, gender, gradeLevel, cls){
        if (value==null || value==='' || isNaN(value) || !gender || !gradeLevel) return '';
        let selectedTest = null;
        if (categoryId === 'bodyfat') selectedTest = 'BMI';
        else {
            const catKey = Object.keys(window.papsItems).find(k => window.papsItems[k].id === categoryId);
            selectedTest = cls.eventSettings[categoryId] || window.papsItems[catKey].options[0];
            
            // 성별에 따라 팔굽혀펴기 종목명 변경
            if (selectedTest === '팔굽혀펴기' && gender === '여자') {
                selectedTest = '무릎대고팔굽혀펴기';
            }
        }
        let criteria;
        if (selectedTest === 'BMI') criteria = papsCriteriaData?.BMI?.[gender]?.[gradeLevel];
        else criteria = papsCriteriaData?.[gender]?.[gradeLevel]?.[selectedTest];
        if (!criteria) return '';
        for (const [a,b,g] of criteria){ const min = Math.min(a,b), max=Math.max(a,b); if (value>=min && value<=max) return typeof g==='number'? String(g): g; }
        return '';
    }

    function calcOverallGrade(tr){
        const grades = []; tr.querySelectorAll('.grade-cell').forEach(td => { const t = td.textContent.trim(); if(!t) return; const n = parseInt(t); if(!isNaN(n)) grades.push(n); else { if(t==='정상') grades.push(1); if(t==='과체중') grades.push(3); if(t==='마름') grades.push(4); if(t==='경도비만') grades.push(4); if(t==='고도비만') grades.push(5); } });
        if (grades.length===0) return '';
        const avg = grades.reduce((a,b)=>a+b,0)/grades.length; return Math.round(avg)+"등급";
    }

    function addPapsStudent(cls){ const id = Date.now(); cls.students.push({ id, number: (cls.students?.length||0)+1, name: '', gender: '남자', records: {} }); }
    function deleteSelectedPapsStudents(cls){ const rows = Array.from($('#paps-record-body').querySelectorAll('tr')); const keep = []; rows.forEach(r => { const checked = r.querySelector('.paps-row-checkbox')?.checked; const sid = Number(r.dataset.sid); if(!checked) keep.push(sid); }); cls.students = (cls.students||[]).filter(s=>keep.includes(s.id)); buildPapsTable(cls); saveDataToFirestore(); }

    function papsDownloadTemplate(){ const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet([["번호","이름","성별"],[1,'김체육','남자'],[2,'박건강','여자']]); ws['!cols']=[{wch:8},{wch:14},{wch:8}]; XLSX.utils.book_append_sheet(wb, ws, '학생 명렬표'); XLSX.writeFile(wb, 'PAPS_학생명렬표_양식.xlsx'); }

    // PAPS 설정 저장 및 수정 기능
    function savePapsSettings() {
        const selectedClass = papsData.classes.find(c => c.id === papsData.activeClassId);
        if (!selectedClass) return;
        
        // 학년 설정 저장
        const gradeSelect = $('#paps-grade-select');
        if (gradeSelect) {
            selectedClass.gradeLevel = gradeSelect.value;
        }
        
        // 이벤트 설정 저장
        const eventSelects = document.querySelectorAll('[data-paps-category]');
        eventSelects.forEach(select => {
            const category = select.dataset.papsCategory;
            selectedClass.eventSettings = selectedClass.eventSettings || {};
            selectedClass.eventSettings[category] = select.value;
        });
        
        // 데이터 저장
        saveDataToFirestore();
        
        // 설정 카드 완전히 제거
        const settingsCard = document.querySelector('.card');
        if (settingsCard) {
            settingsCard.remove();
        }
        
        // 좌측 사이드바 업데이트
        renderPapsClassList();
        
        alert('설정이 저장되었습니다.');
    }

    function showPapsSettings() {
        const selectedClass = papsData.classes.find(c => c.id === papsData.activeClassId);
        if (!selectedClass) return;
        
        // 설정 카드가 이미 있는지 확인하고 제거
        const existingCard = document.querySelector('.card');
        if (existingCard) {
            existingCard.remove();
        }
        
        // 설정 카드 강제 생성 (설정 완료 여부와 관계없이)
        const settingsCardHtml = `
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <div class="paps-toolbar" style="justify-content: space-between;">
                        <h3 style="margin: 0;">PAPS 설정</h3>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn primary" id="paps-save-settings-btn">설정 저장</button>
                            <button class="btn" id="paps-download-template-btn">학생 명렬표 양식</button>
                            <input type="file" id="paps-student-upload" class="hidden" accept=".xlsx,.xls,.csv"/>
                            <button class="btn primary" id="paps-load-list-btn">명렬표 불러오기</button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="paps-grid">
                        <div class="paps-event-group"><label style="min-width:90px; color: var(--ink-muted);">학년 설정</label>
                            <select id="paps-grade-select">
                                <option value="">학년 선택</option>
                                <option value="초4">초4</option><option value="초5">초5</option><option value="초6">초6</option>
                                <option value="중1">중1</option><option value="중2">중2</option><option value="중3">중3</option>
                                <option value="고1">고1</option><option value="고2">고2</option><option value="고3">고3</option>
                            </select>
                        </div>
                        ${Object.keys(window.papsItems).filter(k=>k!=="체지방").map(category => {
                            const item = window.papsItems[category];
                            const current = selectedClass.eventSettings[item.id] || item.options[0];
                            return `<div class="paps-event-group"><label style="min-width:90px; color: var(--ink-muted);">${category}</label><select data-paps-category="${item.id}">${item.options.map(o => `<option value="${o}" ${o===current?'selected':''}>${o}</option>`).join('')}</select></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
        
        // 설정 카드를 메인 컨텐츠 상단에 삽입
        const contentWrapper = $('#content-wrapper');
        const firstSection = contentWrapper.querySelector('section');
        if (firstSection) {
            firstSection.insertAdjacentHTML('beforebegin', settingsCardHtml);
        } else {
            contentWrapper.insertAdjacentHTML('beforeend', settingsCardHtml);
        }
        
        // 이벤트 리스너 추가
        $('#paps-grade-select').value = selectedClass.gradeLevel || '';
        $$('#content-wrapper select[data-paps-category]').forEach(sel => sel.addEventListener('change', e => {
            selectedClass.eventSettings[e.target.dataset.papsCategory] = e.target.value;
            saveDataToFirestore();
            buildPapsTable(selectedClass);
        }));
        $('#paps-grade-select').addEventListener('change', e => { 
            selectedClass.gradeLevel = e.target.value; 
            saveDataToFirestore(); 
            buildPapsTable(selectedClass);
            renderPapsClassList();
        });
        $('#paps-download-template-btn').addEventListener('click', papsDownloadTemplate);
        $('#paps-load-list-btn').addEventListener('click', () => $('#paps-student-upload').click());
        $('#paps-student-upload').addEventListener('change', e => handlePapsStudentUpload(e, selectedClass));
        $('#paps-save-settings-btn').addEventListener('click', savePapsSettings);
    }

    function handlePapsStudentUpload(event, cls){ const file = event.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = e => { try { const data = new Uint8Array(e.target.result); const wb = XLSX.read(data,{type:'array'}); const ws = wb.Sheets[wb.SheetNames[0]]; const json = XLSX.utils.sheet_to_json(ws,{header:1}); const newStudents=[]; for(let i=1;i<json.length;i++){ const row = json[i]; if(!row||row.length===0) continue; const num=row[0]; const name=row[1]; let gender=row[2]||'남자'; if(typeof gender==='string'){ if(gender.includes('여')) gender='여자'; else gender='남자'; } else gender='남자'; newStudents.push({ id: Date.now()+i, number: num, name, gender, records:{} }); } cls.students = newStudents; buildPapsTable(cls); saveDataToFirestore(); alert('학생 명렬표를 불러왔습니다.'); } catch(err){ alert('파일 처리 중 오류가 발생했습니다.'); } finally { event.target.value=''; } }; reader.readAsArrayBuffer(file); }

    // ========================================
    // 수업 진도표 UI 및 로직
    // ========================================
    
    // 수업 진도표 데이터 저장 키
    const LS_PROGRESS_KEY = 'progressClasses';
    const LS_PROGRESS_SELECTED = 'progressSelectedClassId';
    const LS_PROGRESS_SETTING_COLLAPSED = 'progressSettingCollapsed';

    function renderProgressUI() {
        console.log('renderProgressUI 시작');
        console.log('progressClasses.length:', progressClasses.length);
        console.log('progressClasses:', progressClasses);
        
        // 기존 요소들 정리
        cleanupSidebar();
        
        const sidebarTitle = $('#sidebarTitle');
        if (sidebarTitle) sidebarTitle.textContent = '수업 진도 관리';
        
        // 사이드바에 반 목록과 시간표 표시
        const formHtml = `
            <div class="sidebar-form-group">
                <input id="progressClassNameInput" type="text" placeholder="새로운 반 이름">
                <button id="progressAddClassBtn" class="btn primary" data-tooltip="새로운 반을 추가합니다.">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
            <div id="progressClassList" class="progress-class-list"></div>
        `;
        const sidebarFormContainer = $('#sidebar-form-container');
        if (sidebarFormContainer) sidebarFormContainer.innerHTML = formHtml;
        
        // 사이드바 푸터에 방문자 수와 저작권 추가
        const sidebarFooter = $('.sidebar-footer');
        if (sidebarFooter) {
            sidebarFooter.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <div class="visitor-info" style="justify-content: center; font-size: 0.8rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>총 방문자 수 : <span id="progress-visitor-count" style="font-weight: 600; color: var(--accent);">-</span></span>
                    </div>
                </div>
                <div>만든이: 김신회(laguyo87@gmail.com)</div>
            `;
            
            // 방문자 수 업데이트
            updateProgressVisitorCount();
        }
        
        // 클래스 목록 렌더링
        console.log('진도표 클래스 목록 렌더링 시작');
        renderProgressClassList();
        
        // 메인 콘텐츠 영역에 진도표만 표시
        console.log('진도표 메인 콘텐츠 렌더링');
        $('#content-wrapper').innerHTML = `
            <div class="progress-main-content">
                <div class="progress-right">
                    <div class="progress-right-header">
                        <div class="progress-setting-header" id="progressSettingHeader">
                            <div class="title">수업 설정</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                디버그: 진도표 클래스 수 ${progressClasses.length}, 선택된 ID: ${progressSelectedClassId}
                            </div>
                        </div>
                        <div class="progress-setting-bar">
                            <div class="progress-setting-controls" id="progressSettingControls">
                                <label for="progressTeacherName">담당교사</label>
                                <input id="progressTeacherName" type="text" placeholder="담당교사명 입력" />
                                <label for="progressUnitContent">단원 내용</label>
                                <input id="progressUnitContent" type="text" placeholder="단원 내용 입력" />
                                <label for="progressWeeklyHours">주당 시간</label>
                                <select id="progressWeeklyHours">
                                    <option value="1">1시간</option>
                                    <option value="2">2시간</option>
                                    <option value="3">3시간</option>
                                    <option value="4">4시간</option>
                                    <option value="5">5시간</option>
                                </select>
                                <button id="progressSaveSettingBtn" class="save">설정 저장</button>
                            </div>
                        </div>
                    </div>
                    <div class="progress-right-body">
                        <div class="progress-sheet-header">
                            <h2>수업 기록 관리</h2>
                        </div>
                        <div id="progressSheetArea" class="progress-sheet">
                            <div class="progress-empty">반을 선택하고 "설정 저장"을 누르면 진도표가 생성됩니다.</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 데이터 로드 및 초기화 (Firebase에서 이미 로드됨)
        // loadProgressClasses(); // Firebase에서 이미 로드했으므로 제거
        loadProgressSelected();
        renderProgressClassList();
        
        
        
        // 이벤트 리스너 등록 (DOM이 생성된 후)
        setTimeout(() => {
            setupProgressEventListeners();
        }, 0);
        
        if(progressSelectedClassId) {
            loadProgressToRight(progressSelectedClassId);
        } else {
            // 선택된 반이 없을 때도 제목 업데이트
            updateProgressSheetTitle();
        }
    }

    function setupProgressEventListeners() {
        // 반 추가
        $('#progressClassNameInput').addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                e.preventDefault();
                addProgressClass();
            }
        });
        $('#progressAddClassBtn').addEventListener('click', addProgressClass);

        // 설정 저장
        $('#progressSaveSettingBtn').addEventListener('click', () => {
            console.log('설정 저장 버튼 클릭됨');
            const c = getProgressSelected();
            if(!c) {
                console.log('선택된 반이 없음');
                return alert('반을 먼저 선택하세요.');
            }
            console.log('선택된 반:', c);
            const hours = parseInt($('#progressWeeklyHours').value, 10);
            const teacherName = $('#progressTeacherName').value.trim();
            const unitContent = $('#progressUnitContent').value.trim();
            console.log('설정값:', { hours, teacherName, unitContent });
            
            c.weeklyHours = hours;
            c.teacherName = teacherName;
            c.unitContent = unitContent;

            // 주차가 없다면 1주 생성
            if(!c.weeks || c.weeks.length === 0){
                c.weeks = [ makeProgressWeek(hours) ];
                console.log('새 주차 생성:', c.weeks);
            } else {
                // 기존 주차들의 차시 수를 현재 설정에 맞게 보정
                c.weeks = c.weeks.map(w => normalizeProgressWeek(w, hours));
                console.log('기존 주차 보정:', c.weeks);
            }
            saveProgressClasses();
            renderProgressClassList();
            renderProgressSheet(c);
            
            
            // 수업 설정 카드 전체 숨기기
            $('#progressSettingHeader').parentElement.style.display = 'none';
            
            console.log('진도표 렌더링 완료');
        });


    }


    function loadProgressClasses(){
        try {
            const raw = localStorage.getItem(LS_PROGRESS_KEY);
            progressClasses = raw ? JSON.parse(raw) : [];
        } catch(e){ 
            progressClasses = []; 
        }
    }

    function saveProgressClasses(){
        localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(progressClasses));
        renderProgressClassList();
        saveDataToFirestore();
    }

    function loadProgressSelected(){
        progressSelectedClassId = localStorage.getItem(LS_PROGRESS_SELECTED) || '';
    }

    function saveProgressSelected(id){
        progressSelectedClassId = id;
        localStorage.setItem(LS_PROGRESS_SELECTED, id || '');
        saveDataToFirestore();
    }






    function uuid(){
        return 'c-' + Math.random().toString(36).slice(2,9);
    }


    function renderProgressClassList(){
        console.log('=== renderProgressClassList 시작 ===');
        console.log('progressClasses.length:', progressClasses.length);
        console.log('progressClasses:', progressClasses);
        
        $('#progressClassList').innerHTML = '';
        if(progressClasses.length === 0){
            console.log('클래스가 없음, 빈 상태 메시지 표시');
            const empty = document.createElement('div');
            empty.className = 'empty';
            empty.textContent = '아직 생성된 반이 없습니다.';
            $('#progressClassList').appendChild(empty);
            return;
        }
        
        console.log('클래스 목록 렌더링 시작, 클래스 수:', progressClasses.length);
        progressClasses.forEach(c => {
            const card = document.createElement('div');
            card.className = 'btn' + (c.id === progressSelectedClassId ? ' active' : '');
            card.style.justifyContent = 'space-between';
            card.style.marginBottom = '8px';
            card.addEventListener('click', () => {
                saveProgressSelected(c.id);
                renderProgressClassList();
                loadProgressToRight(c.id);
            });

            const leftContent = document.createElement('div');
            leftContent.style.display = 'flex';
            leftContent.style.flexDirection = 'column';
            leftContent.style.flexGrow = '1';

            const title = document.createElement('span');
            title.textContent = c.name;

            const meta = document.createElement('span');
            meta.style.fontSize = '0.8rem';
            // 활성화된 카드의 메타 텍스트는 흰색으로, 비활성화된 카드는 회색으로
            meta.style.color = c.id === progressSelectedClassId ? 'white' : 'var(--ink-muted)';
            const parts = [];
            if(c.weeklyHours) parts.push(`주당 ${c.weeklyHours}시간`);
            if(c.teacherName) parts.push(`${c.teacherName} 선생님`);
            if(c.unitContent) parts.push(c.unitContent);
            
            if(parts.length > 0){
                meta.textContent = parts.join(' • ');
            } else {
                meta.textContent = '설정 미정';
            }

            leftContent.appendChild(title);
            leftContent.appendChild(meta);

            // 버튼 컨테이너
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '4px';

            // 수정 버튼
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
            editBtn.style.background = 'none';
            editBtn.style.border = 'none';
            editBtn.style.padding = '4px';
            editBtn.style.cursor = 'pointer';
            editBtn.style.borderRadius = '4px';
            editBtn.style.color = c.id === progressSelectedClassId ? 'white' : 'var(--ink-muted)';
            editBtn.style.transition = 'all 0.2s ease';
            editBtn.title = '수업 설정 수정';
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editProgressClassSettings(c.id);
            });

            editBtn.addEventListener('mouseenter', () => {
                editBtn.style.background = 'rgba(59, 130, 246, 0.1)';
                editBtn.style.color = '#3b82f6';
            });

            editBtn.addEventListener('mouseleave', () => {
                editBtn.style.background = 'none';
                editBtn.style.color = c.id === progressSelectedClassId ? 'white' : 'var(--ink-muted)';
            });

            // 삭제 버튼
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            deleteBtn.style.background = 'none';
            deleteBtn.style.border = 'none';
            deleteBtn.style.padding = '4px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.borderRadius = '4px';
            deleteBtn.style.color = c.id === progressSelectedClassId ? 'white' : 'var(--ink-muted)';
            deleteBtn.style.transition = 'all 0.2s ease';
            deleteBtn.title = '반 삭제';
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`"${c.name}" 반을 삭제하시겠습니까?`)) {
                    deleteProgressClass(c.id);
                }
            });

            deleteBtn.addEventListener('mouseenter', () => {
                deleteBtn.style.background = 'rgba(220, 38, 38, 0.1)';
                deleteBtn.style.color = '#dc2626';
            });

            deleteBtn.addEventListener('mouseleave', () => {
                deleteBtn.style.background = 'none';
                deleteBtn.style.color = c.id === progressSelectedClassId ? 'white' : 'var(--ink-muted)';
            });

            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(deleteBtn);
            
            card.appendChild(leftContent);
            card.appendChild(buttonContainer);
            $('#progressClassList').appendChild(card);
        });
        
        console.log('=== renderProgressClassList 완료 ===');
        console.log('렌더링된 클래스 수:', progressClasses.length);
    }

    function editProgressClassSettings(classId) {
        // 해당 반을 선택
        saveProgressSelected(classId);
        renderProgressClassList();
        loadProgressToRight(classId);
        
        // 수업 설정 카드 전체 다시 표시
        $('#progressSettingHeader').parentElement.style.display = 'block';
    }

    function updateProgressSheetTitle() {
        const selectedClass = getProgressSelected();
        const titleElement = document.querySelector('.progress-sheet-header h2');
        if (selectedClass) {
            titleElement.textContent = `${selectedClass.name} - 수업 기록 관리`;
        } else {
            titleElement.textContent = '수업 기록 관리';
        }
    }

    function getProgressSelected(){
        return progressClasses.find(c => c.id === progressSelectedClassId);
    }

    function loadProgressToRight(id){
        const c = progressClasses.find(c => c.id === id);
        if(!c){
            const progressSelectedClassInfo = $('#progressSelectedClassInfo');
            const progressTeacherName = $('#progressTeacherName');
            const progressUnitContent = $('#progressUnitContent');
            const progressWeeklyHours = $('#progressWeeklyHours');
            const progressSheetArea = $('#progressSheetArea');
            
            if (progressSelectedClassInfo) progressSelectedClassInfo.innerHTML = '선택된 반 없음';
            if (progressTeacherName) progressTeacherName.value = '';
            if (progressUnitContent) progressUnitContent.value = '';
            if (progressWeeklyHours) progressWeeklyHours.value = '1';
            if (progressSheetArea) progressSheetArea.innerHTML = '<div class="progress-empty">반을 선택하고 "설정 저장"을 누르면 진도표가 생성됩니다.</div>';
            // 제목 업데이트 (반이 선택되지 않았을 때)
            updateProgressSheetTitle();
            return;
        }
        
        
        // 제목 업데이트
        updateProgressSheetTitle();
        
        // 수업 설정 폼에 값 설정
        const progressTeacherName = $('#progressTeacherName');
        const progressUnitContent = $('#progressUnitContent');
        const progressWeeklyHours = $('#progressWeeklyHours');
        const progressSheetArea = $('#progressSheetArea');
        const progressSettingHeader = $('#progressSettingHeader');
        
        if (progressTeacherName) progressTeacherName.value = c.teacherName || '';
        if (progressUnitContent) progressUnitContent.value = c.unitContent || '';
        
        if(c.weeklyHours){
            if (progressWeeklyHours) progressWeeklyHours.value = String(c.weeklyHours);
            renderProgressSheet(c);
            // 설정이 저장된 반이면 수업 설정 카드 숨기기
            if (progressSettingHeader && progressSettingHeader.parentElement) {
                progressSettingHeader.parentElement.style.display = 'none';
            }
        } else {
            if (progressWeeklyHours) progressWeeklyHours.value = '1';
            if (progressSheetArea) progressSheetArea.innerHTML = '<div class="progress-empty">"수업 설정"에서 주당 시간을 저장하면 진도표가 생성됩니다.</div>';
            // 설정이 저장되지 않은 반이면 수업 설정 카드 표시
            if (progressSettingHeader && progressSettingHeader.parentElement) {
                progressSettingHeader.parentElement.style.display = 'block';
            }
        }
    }

    function addProgressClass(){
        const name = $('#progressClassNameInput').value.trim();
        if(!name) return;
        const newClass = { id: uuid(), name, teacherName: '', unitContent: '', weeklyHours: 0, weeks: [] };
        progressClasses.push(newClass);
        saveProgressClasses();
        $('#progressClassNameInput').value = '';
        saveProgressSelected(newClass.id);
        renderProgressClassList();
        loadProgressToRight(newClass.id);
        
        // 새로운 반 생성 시 수업 설정 카드 표시
        $('#progressSettingHeader').parentElement.style.display = 'block';
    }
    
    function deleteProgressClass(classId) {
        const classIndex = progressClasses.findIndex(c => c.id === classId);
        if (classIndex === -1) return;
        
        // 삭제할 반이 현재 선택된 반이면 선택 해제
        if (progressSelectedClassId === classId) {
            progressSelectedClassId = '';
            saveProgressSelected('');
        }
        
        // 반 삭제
        progressClasses.splice(classIndex, 1);
        saveProgressClasses();
        renderProgressClassList();
        
        // 선택된 반이 삭제되었으면 우측 영역 완전 초기화
        if (progressSelectedClassId === '') {
            // 수업 설정 폼 초기화
            $('#progressTeacherName').value = '';
            $('#progressUnitContent').value = '';
            $('#progressWeeklyHours').value = '1';
            
            // 수업 기록 테이블 초기화
            $('#progressSheetArea').innerHTML = '<div class="progress-empty">반을 선택하고 "설정 저장"을 누르면 진도표가 생성됩니다.</div>';
            
            // 제목 초기화
            updateProgressSheetTitle();
            
            // 수업 설정 카드 표시
            $('#progressSettingHeader').parentElement.style.display = 'block';
        }
    }
    
    // 전역 함수로 등록
    window.addProgressClass = addProgressClass;
    window.deleteProgressClass = deleteProgressClass;
    window.refreshData = refreshData;

    function makeProgressWeek(hours){
        return {
            sessions: Array.from({length: hours}, (_, i) => ({ date: '', note: '' }))
        };
    }

    function normalizeProgressWeek(week, hours){
        const cur = week.sessions || [];
        if(cur.length === hours) return week;
        if(cur.length > hours){
            week.sessions = cur.slice(0, hours);
        } else {
            const add = Array.from({length: hours - cur.length}, () => ({ date:'', note:'' }));
            week.sessions = cur.concat(add);
        }
        return week;
    }

    function renderProgressSheet(c){
        const hours = c.weeklyHours || 0;

        const wrapper = document.createElement('div');
        wrapper.className = 'progress-sheet-weeks';

        // 주차 컬럼들
        const weeksWrap = document.createElement('div');
        weeksWrap.className = 'progress-weeks';

        // 보정: 최소 1주는 있어야 "+"가 동작 의미가 분명
        if(!c.weeks || c.weeks.length === 0){
            c.weeks = [ makeProgressWeek(hours) ];
        }

        c.weeks.forEach((w, wi) => {
            w = normalizeProgressWeek(w, hours);
            const col = document.createElement('div');
            col.className = 'progress-week-col';

            const head = document.createElement('div');
            head.className = 'week-head';
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = `${wi+1}주`;
            head.appendChild(title);

            // 요구사항: "1주 제목 옆에 '+'" → 첫 컬럼 헤드에 배치
            if(wi === c.weeks.length - 1){
                // 버튼 컨테이너
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'buttons';
                
                // '+' 버튼
                const addNextBtn = document.createElement('button');
                addNextBtn.className = 'add-next';
                addNextBtn.textContent = '＋';
                addNextBtn.title = '다음 주 추가';
                addNextBtn.addEventListener('click', () => {
                    c.weeks.push(makeProgressWeek(c.weeklyHours));
                    saveProgressClasses();
                    renderProgressSheet(c);
                });
                buttonsContainer.appendChild(addNextBtn);
                
                // '-' 버튼 (주차가 2개 이상일 때만)
                if(c.weeks.length > 1){
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-week';
                    removeBtn.textContent = '－';
                    removeBtn.title = '이 주차 삭제';
                    removeBtn.addEventListener('click', () => {
                        if(confirm('이 주차를 삭제하시겠습니까?')){
                            c.weeks.splice(wi, 1);
                            saveProgressClasses();
                            renderProgressSheet(c);
                        }
                    });
                    buttonsContainer.appendChild(removeBtn);
                }
                
                head.appendChild(buttonsContainer);
            } else {
                const spacer = document.createElement('div');
                spacer.style.width = '24px';
                head.appendChild(spacer);
            }
            col.appendChild(head);

            // 세션 행들
            w.sessions.forEach((s, si) => {
                const ses = document.createElement('div');
                ses.className = 'progress-session';

                const titleRow = document.createElement('div');
                titleRow.className = 'session-title-row';
                
                const sesTitle = document.createElement('div');
                sesTitle.className = 'session-title';
                // 전체 차시 수 계산: 이전 주차들의 차시 수 + 현재 주차의 차시 순서
                const totalSessionNumber = (wi * hours) + si + 1;
                sesTitle.textContent = `${totalSessionNumber}차시`;

                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.className = 'session-date';
                if(s.date) dateInput.value = s.date;
                
                // 요일 표시 요소
                const dayOfWeek = document.createElement('span');
                dayOfWeek.className = 'day-of-week';
                if(s.date) {
                    const date = new Date(s.date);
                    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                    dayOfWeek.textContent = dayNames[date.getDay()];
                }
                
                dateInput.addEventListener('change', () => {
                    s.date = dateInput.value;
                    if(s.date) {
                        const date = new Date(s.date);
                        const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
                        dayOfWeek.textContent = dayNames[date.getDay()];
                    } else {
                        dayOfWeek.textContent = '';
                    }
                    saveProgressClasses();
                });

                titleRow.appendChild(sesTitle);
                titleRow.appendChild(dateInput);
                titleRow.appendChild(dayOfWeek);

                const ta = document.createElement('textarea');
                ta.maxLength = 300;
                ta.placeholder = '수업 기록';
                ta.value = s.note || '';

                ta.addEventListener('input', () => {
                    s.note = ta.value;
                    saveProgressClasses();
                });

                ses.appendChild(titleRow);
                ses.appendChild(ta);
                col.appendChild(ses);
            });

            weeksWrap.appendChild(col);
        });

        wrapper.appendChild(weeksWrap);

        // 최종 렌더
        $('#progressSheetArea').innerHTML = '';
        $('#progressSheetArea').appendChild(wrapper);
    }


    function exportPapsToExcel(cls){ 
        if(!cls || !cls.students || cls.students.length===0){ alert('내보낼 데이터가 없습니다.'); return; } 
        const header1=["번호","이름","성별"], header2=["","",""]; 
        const merges=[]; let col=3; 
        Object.keys(window.papsItems).filter(k=>k!=="체지방").forEach(k=>{ 
            const id=window.papsItems[k].id; 
            let name=cls.eventSettings[id]||window.papsItems[k].options[0]; 
            if (name === '팔굽혀펴기') { 
                name = '팔굽혀펴기/무릎대고 팔굽혀펴기'; 
            }
            // 악력 종목은 왼손/오른손으로 분리
            if (name === '악력') {
                header1.push(name,"","",""); 
                header2.push("왼손(kg)","왼손등급","오른손(kg)","오른손등급"); 
                merges.push({s:{r:0,c:col},e:{r:0,c:col+3}}); 
                col+=4; 
            } else {
                header1.push(name,""); 
                header2.push("기록","등급"); 
                merges.push({s:{r:0,c:col},e:{r:0,c:col+1}}); 
                col+=2; 
            }
        }); 
        header1.push("체지방","","",""); 
        header2.push("신장(cm)","체중(kg)","BMI","등급"); 
        merges.push({s:{r:0,c:col},e:{r:0,c:col+3}}); 
        col+=4; 
        header1.push("종합 등급"); 
        const data=[header1,header2]; 
        $('#paps-record-body').querySelectorAll('tr').forEach(tr=>{ 
            const row=[]; 
            row.push(tr.querySelector('.number')?.value||''); 
            row.push(tr.querySelector('.name')?.value||''); 
            const gsel = tr.querySelector('.gender'); 
            row.push(gsel?.options[gsel.selectedIndex].text||''); 
            
            // 종목별 데이터 처리
            Object.keys(window.papsItems).filter(k=>k!=="체지방").forEach(k => {
                const id = window.papsItems[k].id;
                const eventName = cls.eventSettings[id] || window.papsItems[k].options[0];
                
                if (eventName === '악력') {
                    // 악력은 왼손/오른손 각각 처리
                    const leftInput = tr.querySelector(`.rec[data-id="${id}_left"]`);
                    const rightInput = tr.querySelector(`.rec[data-id="${id}_right"]`);
                    const leftGrade = tr.querySelector(`.grade-cell[data-id="${id}_left"]`);
                    const rightGrade = tr.querySelector(`.grade-cell[data-id="${id}_right"]`);
                    
                    row.push(leftInput?.value || '');
                    row.push(leftGrade?.textContent || '');
                    row.push(rightInput?.value || '');
                    row.push(rightGrade?.textContent || '');
                } else {
                    const input = tr.querySelector(`.rec[data-id="${id}"]`);
                    const grade = input?.closest('td').nextElementSibling;
                    row.push(input?.value || '');
                    row.push(grade?.textContent || '');
                }
            });
            
            row.push(tr.querySelector('.height')?.value||''); 
            row.push(tr.querySelector('.weight')?.value||''); 
            row.push(tr.querySelector('.bmi-cell')?.textContent||''); 
            row.push(tr.querySelector('.grade-cell[data-id="bodyfat"]')?.textContent||''); 
            row.push(tr.querySelector('.overall-grade-cell')?.textContent||''); 
            data.push(row); 
        }); 
        const ws = XLSX.utils.aoa_to_sheet(data); 
        ws['!merges']=merges; 
        const wb=XLSX.utils.book_new(); 
        XLSX.utils.book_append_sheet(wb, ws, `${cls.name} PAPS 기록`); 
        XLSX.writeFile(wb, `${cls.name}_PAPS_기록.xlsx`); 
    }

    function exportAllPapsToExcel() {
        if (!papsData || !papsData.classes || papsData.classes.length === 0) {
            alert('내보낼 PAPS 데이터가 없습니다.');
            return;
        }

        const wb = XLSX.utils.book_new();
        
        papsData.classes.forEach(cls => {
            if (!cls.students || cls.students.length === 0) return;
            
            const header1 = ["번호", "이름", "성별", "학년"];
            const header2 = ["", "", "", ""];
            const merges = [];
            let col = 4;
            
            // 종목별 헤더 생성 (기록만)
            Object.keys(window.papsItems).filter(k => k !== "체지방").forEach(k => {
                const id = window.papsItems[k].id;
                let name = cls.eventSettings[id] || window.papsItems[k].options[0];
                if (name === '팔굽혀펴기') {
                    name = '팔굽혀펴기/무릎대고 팔굽혀펴기';
                }
                // 악력 종목은 왼손/오른손으로 분리
                if (name === '악력') {
                    header1.push(name, name);
                    header2.push("왼손(kg)", "오른손(kg)");
                    col += 2;
                } else {
                    header1.push(name);
                    header2.push("기록");
                    col += 1;
                }
            });
            
            // 체지방 헤더 추가 (기록만)
            header1.push("신장(cm)", "체중(kg)");
            header2.push("", "");
            
            const data = [header1, header2];
            
            // 학생 데이터 추가
            cls.students.forEach(student => {
                const row = [];
                row.push(student.number || '');
                row.push(student.name || '');
                row.push(student.gender || '');
                row.push(cls.gradeLevel || '');
                
                // 종목별 기록만
                Object.keys(window.papsItems).filter(k => k !== "체지방").forEach(k => {
                    const id = window.papsItems[k].id;
                    const eventName = cls.eventSettings[id] || window.papsItems[k].options[0];
                    
                    if (eventName === '악력') {
                        // 악력은 왼손/오른손 각각 처리
                        const leftRecord = student.records?.[`${id}_left`] || '';
                        const rightRecord = student.records?.[`${id}_right`] || '';
                        row.push(leftRecord);
                        row.push(rightRecord);
                    } else {
                        const record = student.records?.[id] || '';
                        row.push(record);
                    }
                });
                
                // 체지방 관련 데이터 (기록만)
                const height = student.records?.height || '';
                const weight = student.records?.weight || '';
                row.push(height);
                row.push(weight);
                
                data.push(row);
            });
            
            // 워크시트 생성
            const ws = XLSX.utils.aoa_to_sheet(data);
            ws['!merges'] = merges;
            ws['!cols'] = Array.from({length: data[0].length}, (_, i) => ({wch: i < 3 ? 8 : 12}));
            
            // 탭 이름을 반 이름으로 설정 (최대 31자)
            const sheetName = cls.name.length > 31 ? cls.name.substring(0, 31) : cls.name;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        
        // 파일명에 날짜 추가
        const now = new Date();
        const dateStr = now.getFullYear() + 
                       String(now.getMonth() + 1).padStart(2, '0') + 
                       String(now.getDate()).padStart(2, '0');
        
        XLSX.writeFile(wb, `PAPS_전체반_기록_${dateStr}.xlsx`);
    }

    function handlePapsRecordUpload(event, cls){ 
        const file = event.target.files[0]; 
        if(!file) return; 
        
        const reader = new FileReader(); 
        reader.onload = e => { 
            try { 
                const data = new Uint8Array(e.target.result); 
                const wb = XLSX.read(data,{type:'array'}); 
                
                // 첫 번째 시트를 읽어서 현재 반에 적용
                const ws = wb.Sheets[wb.SheetNames[0]]; 
                const arr = XLSX.utils.sheet_to_json(ws,{header:1}); 
                
                if(arr.length < 2){ 
                    alert('데이터가 부족합니다.'); 
                    return; 
                } 
                
                const header = arr[0]; // 첫 번째 행이 헤더
                const colMap = { 
                    number: header.indexOf('번호'), 
                    name: header.indexOf('이름'), 
                    gender: header.indexOf('성별'),
                    gradeLevel: header.indexOf('학년'),
                    records: {} 
                }; 
                
                // 종목별 컬럼 매핑 (엑셀 내보내기와 동일한 형식)
                Object.keys(window.papsItems).filter(k => k !== "체지방").forEach(k => {
                    const id = window.papsItems[k].id;
                    let eventName = cls.eventSettings[id] || window.papsItems[k].options[0];
                    if (eventName === '팔굽혀펴기') {
                        eventName = '팔굽혀펴기/무릎대고 팔굽혀펴기';
                    }
                    const colIndex = header.indexOf(eventName);
                    if (colIndex !== -1) {
                        colMap.records[id] = colIndex;
                    }
                });
                
                // 체지방 관련 컬럼 매핑 (BMI 제외)
                colMap.records.height = header.indexOf('신장(cm)');
                colMap.records.weight = header.indexOf('체중(kg)');
                
                // 학년 정보 업데이트 (첫 번째 행에서 학년 정보 읽기)
                if (colMap.gradeLevel !== -1 && arr.length > 1) {
                    const firstRow = arr[1];
                    const gradeFromFile = firstRow[colMap.gradeLevel];
                    if (gradeFromFile && gradeFromFile !== '') {
                        cls.gradeLevel = gradeFromFile;
                    }
                }
                
                // 기존 학생 목록을 완전히 교체
                cls.students = [];
                let added = 0;
                
                arr.slice(1).forEach((row, index) => { 
                    if(!row || row.length === 0) return; 
                    
                    const num = colMap.number !== -1 ? row[colMap.number] : null; 
                    const name = colMap.name !== -1 ? row[colMap.name] : null; 
                    const gender = colMap.gender !== -1 ? row[colMap.gender] : '남자';
                    
                    if (!num && !name) return; // 번호와 이름이 모두 없으면 스킵
                    
                    // 새 학생 추가
                    const student = {
                        id: Date.now() + index,
                        number: num || (index + 1),
                        name: name || `학생${index + 1}`,
                        gender: gender.includes('여') ? '여자' : '남자',
                        records: {}
                    };
                    
                    // 기록 데이터 추가
                    Object.keys(colMap.records).forEach(id => { 
                        const idx = colMap.records[id]; 
                        if (idx !== -1) {
                            const value = row[idx]; 
                            if(value !== undefined && value !== null && value !== '') {
                                // 숫자 데이터인 경우 숫자로 변환
                                if (id !== 'height' && id !== 'weight' && !isNaN(parseFloat(value))) {
                                    student.records[id] = parseFloat(value);
                                } else {
                                    student.records[id] = value; 
                                }
                            } 
                        }
                    }); 
                    
                    cls.students.push(student);
                    added++;
                }); 
                
                // 테이블 다시 그리기 (등급 자동 계산됨)
                buildPapsTable(cls); 
                saveDataToFirestore(); 
                
                // 학년 설정 UI 업데이트
                const gradeSelect = document.querySelector('#paps-grade-select');
                if (gradeSelect && cls.gradeLevel) {
                    gradeSelect.value = cls.gradeLevel;
                }
                
                // 좌측 창의 반 카드 업데이트
                renderPapsUI();
                
                let message = `${added}명의 학생 기록을 불러왔습니다.`;
                if (cls.gradeLevel) {
                    message += `\n학년이 ${cls.gradeLevel}로 설정되었습니다.`;
                }
                alert(message);
                
            } catch(err){ 
                alert('기록 파일 처리 중 오류가 발생했습니다: ' + err.message); 
            } finally { 
                event.target.value=''; 
            } 
        }; 
        reader.readAsArrayBuffer(file); 
    }

    function handleAllPapsExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('PAPS 엑셀 파일 업로드 시작:', file.name);
        
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, {type: 'array'});
                
                console.log('엑셀 파일 시트 목록:', wb.SheetNames);
                
                // 모든 시트를 순회하며 반 데이터 복원
                let totalClasses = 0;
                let totalStudents = 0;
                let processedSheets = [];
                
                wb.SheetNames.forEach(sheetName => {
                    console.log(`시트 처리 중: ${sheetName}`);
                    
                    const ws = wb.Sheets[sheetName];
                    const arr = XLSX.utils.sheet_to_json(ws, {header: 1});
                    
                    console.log(`${sheetName} 시트 데이터:`, arr);
                    
                    if (arr.length < 2) {
                        console.log(`${sheetName} 시트: 데이터 부족 (헤더만 있음)`);
                        return; // 헤더만 있으면 스킵
                    }
                    
                    const header = arr[0];
                    console.log(`${sheetName} 시트 헤더:`, header);
                    
                    const colMap = { 
                        number: header.indexOf('번호'), 
                        name: header.indexOf('이름'), 
                        gender: header.indexOf('성별'),
                        gradeLevel: header.indexOf('학년'),
                        records: {} 
                    };
                    
                    console.log(`${sheetName} 시트 컬럼 매핑:`, colMap);
                    
                    // 종목별 컬럼 매핑 (엑셀 내보내기 형식에 맞춤)
                    Object.keys(window.papsItems).filter(k => k !== "체지방").forEach(k => {
                        const id = window.papsItems[k].id;
                        let eventName = window.papsItems[k].options[0];
                        
                        // 엑셀 내보내기에서 사용하는 종목명으로 변경
                        if (eventName === '팔굽혀펴기') {
                            eventName = '팔굽혀펴기/무릎대고 팔굽혀펴기';
                        }
                        
                        const colIndex = header.indexOf(eventName);
                        if (colIndex !== -1) {
                            colMap.records[id] = colIndex;
                            console.log(`${sheetName} 시트: ${eventName} 컬럼 찾음 (인덱스: ${colIndex})`);
                        } else {
                            console.log(`${sheetName} 시트: ${eventName} 컬럼을 찾을 수 없음`);
                        }
                    });
                    
                    // 체지방 관련 컬럼 매핑
                    colMap.records.height = header.indexOf('신장(cm)');
                    colMap.records.weight = header.indexOf('체중(kg)');
                    
                    console.log(`${sheetName} 시트 최종 컬럼 매핑:`, colMap);
                    
                    // 기존 반 찾기 또는 새로 생성
                    let cls = papsData.classes.find(c => c.name === sheetName);
                    if (!cls) {
                        cls = {
                            id: Date.now() + Math.random(),
                            name: sheetName,
                            gradeLevel: '',
                            eventSettings: {},
                            students: []
                        };
                        papsData.classes.push(cls);
                        console.log(`새 반 생성: ${sheetName}`);
                    } else {
                        console.log(`기존 반 찾음: ${sheetName}`);
                    }
                    
                    // 학년 정보 업데이트
                    if (colMap.gradeLevel !== -1 && arr.length > 1) {
                        const firstRow = arr[1];
                        const gradeFromFile = firstRow[colMap.gradeLevel];
                        if (gradeFromFile && gradeFromFile !== '') {
                            cls.gradeLevel = gradeFromFile;
                            console.log(`${sheetName} 시트 학년 설정: ${gradeFromFile}`);
                        }
                    }
                    
                    // 학생 데이터 복원
                    cls.students = [];
                    let sheetStudents = 0;
                    
                    arr.slice(1).forEach((row, index) => { 
                        if(!row || row.length === 0) return; 
                        
                        const num = colMap.number !== -1 ? row[colMap.number] : null; 
                        const name = colMap.name !== -1 ? row[colMap.name] : null; 
                        const gender = colMap.gender !== -1 ? row[colMap.gender] : '남자';
                        
                        if (!num && !name) return;
                        
                        const student = {
                            id: Date.now() + index + Math.random(),
                            number: num || (index + 1),
                            name: name || `학생${index + 1}`,
                            gender: gender.includes('여') ? '여자' : '남자',
                            records: {}
                        };
                        
                        // 기록 데이터 복원
                        Object.keys(colMap.records).forEach(id => { 
                            const idx = colMap.records[id]; 
                            if (idx !== -1) {
                                const value = row[idx]; 
                                if(value !== undefined && value !== null && value !== '') {
                                    if (id !== 'height' && id !== 'weight' && !isNaN(parseFloat(value))) {
                                        student.records[id] = parseFloat(value);
                                    } else {
                                        student.records[id] = value; 
                                    }
                                    console.log(`${sheetName} 시트 학생 ${student.name}: ${id} = ${value}`);
                                } 
                            }
                        }); 
                        
                        cls.students.push(student);
                        sheetStudents++;
                        totalStudents++;
                    });
                    
                    console.log(`${sheetName} 시트 처리 완료: ${sheetStudents}명의 학생`);
                    processedSheets.push({name: sheetName, students: sheetStudents});
                    
                    if (cls.students.length > 0) {
                        totalClasses++;
                    }
                });
                
                console.log('전체 처리 결과:', {
                    totalClasses,
                    totalStudents,
                    processedSheets,
                    papsDataClasses: papsData.classes.length
                });
                
                // 데이터 저장 및 UI 업데이트
                saveDataToFirestore();
                renderPapsUI();
                
                let message = `${totalClasses}개 반, 총 ${totalStudents}명의 학생 데이터를 불러왔습니다.\n\n`;
                message += `처리된 시트:\n`;
                processedSheets.forEach(sheet => {
                    message += `- ${sheet.name}: ${sheet.students}명\n`;
                });
                
                alert(message);
                
            } catch(err) {
                console.error('PAPS 엑셀 파일 처리 오류:', err);
                alert('파일 처리 중 오류가 발생했습니다: ' + err.message);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }


    function renderPapsCharts(cls) {
        console.log('=== renderPapsCharts 시작 ===');
        console.log('클래스:', cls);
        
        const chartsWrap = $('#paps-charts');
        const card = $('#paps-chart-section');
        
        if (!chartsWrap) {
            console.error('paps-charts 요소를 찾을 수 없습니다');
            return;
        }
        
        if (!card) {
            console.error('paps-chart-section 요소를 찾을 수 없습니다');
            return;
        }
        
        console.log('차트 컨테이너 요소들 확인 완료');
        
        // 기존 차트 정리
        chartsWrap.innerHTML = '';
        
        // 테이블 행들 가져오기
        const rows = Array.from($('#paps-record-body').querySelectorAll('tr'));
        console.log('테이블 행 수:', rows.length);
        
        if (rows.length === 0) {
            console.log('데이터가 없어서 차트 섹션을 숨깁니다');
            card.style.display = 'none';
            return;
        }
        
        console.log('차트 섹션을 표시합니다');
        card.style.display = 'block';
        
        // 등급 데이터 수집
        const gradeData = {};
        console.log('등급 데이터 수집 시작');
        
        rows.forEach((tr, rowIndex) => {
            const gradeCells = tr.querySelectorAll('.grade-cell');
            console.log(`행 ${rowIndex + 1}의 등급 셀 수:`, gradeCells.length);
            
            gradeCells.forEach((td, cellIndex) => {
                const gradeText = td.textContent.trim();
                if (!gradeText) {
                    console.log(`행 ${rowIndex + 1}, 셀 ${cellIndex + 1}: 빈 값`);
                    return;
                }
                
                const id = td.dataset.id;
                console.log(`행 ${rowIndex + 1}, 셀 ${cellIndex + 1}: ${id} = ${gradeText}`);
                
                let eventName;
                if (id === 'bodyfat') {
                    eventName = 'BMI';
                } else {
                    const catKey = Object.keys(window.window.papsItems).find(k => window.window.papsItems[k].id === id);
                    if (catKey && window.window.papsItems[catKey]) {
                        eventName = cls.eventSettings[id] || window.window.papsItems[catKey].options[0];
                    } else {
                        console.warn(`window.papsItems에서 카테고리를 찾을 수 없습니다: ${id}`);
                        eventName = id; // 기본값으로 id 사용
                    }
                }
                
                const key = id === 'bodyfat' ? gradeText : `${gradeText}등급`;
                gradeData[eventName] = gradeData[eventName] || {};
                gradeData[eventName][key] = (gradeData[eventName][key] || 0) + 1;
                
                console.log(`이벤트: ${eventName}, 키: ${key}, 카운트: ${gradeData[eventName][key]}`);
            });
        });
        
        console.log('수집된 등급 데이터:', gradeData);
        
        // 데이터가 있는지 확인
        const hasData = Object.keys(gradeData).some(eventName => 
            Object.values(gradeData[eventName]).some(count => count > 0)
        );
        
        if (!hasData) {
            console.log('차트에 표시할 데이터가 없습니다');
            chartsWrap.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--ink-muted);">등급 데이터가 없습니다. 학생들의 기록을 먼저 입력해주세요.</div>';
            card.style.display = 'block';
            return;
        }
        
        // Chart.js가 로드되었는지 확인
        if (typeof Chart === 'undefined') {
            console.error('Chart.js가 로드되지 않았습니다');
            alert('차트 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        console.log('Chart.js 확인 완료, 차트 생성 시작');
        
        // 각 이벤트별로 차트 생성
        Object.keys(gradeData).forEach(eventName => {
            console.log(`차트 생성 중: ${eventName}`);
            
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            
            const box = document.createElement('div');
            box.style.marginBottom = '20px';
            box.appendChild(canvas);
            chartsWrap.appendChild(box);
            
            const isBmi = (eventName === 'BMI');
            let displayName = eventName;
            if (eventName === '팔굽혀펴기') {
                displayName = '팔굽혀펴기/무릎대고 팔굽혀펴기';
            }
            
            const labels = isBmi ? 
                ['마름', '정상', '과체중', '경도비만', '고도비만'] : 
                ['1등급', '2등급', '3등급', '4등급', '5등급'];
            
            const colors = isBmi ? 
                ['#6c757d', '#28a745', '#ffc107', '#fd7e14', '#dc3545'] : 
                ['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545'];
            
            const counts = labels.map(l => gradeData[eventName][l] || 0);
            console.log(`${eventName} 차트 데이터:`, { labels, counts });
            
            try {
                new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: '학생 수',
                            data: counts,
                            backgroundColor: colors
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: displayName,
                                font: {
                                    size: 16,
                                    weight: 'bold'
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            },
                            x: {
                                ticks: {
                                    maxRotation: 45
                                }
                            }
                        }
                    }
                });
                console.log(`${eventName} 차트 생성 완료`);
            } catch (error) {
                console.error(`${eventName} 차트 생성 실패:`, error);
            }
        });
        
        console.log('=== renderPapsCharts 완료 ===');
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                let importType = 'unknown';

                if (data.leagues && data.tournaments) importType = 'v2';
                else if (data.classes && data.students) importType = 'league_legacy';
                else if (Array.isArray(data) && data.length > 0 && data[0].hasOwnProperty('rounds')) importType = 'tournament_legacy';
                
                if(importType === 'unknown') throw new Error('알 수 없는 파일 형식');

                showModal({
                    title: '데이터 복원', body: `'${file.name}' 파일 데이터를 복원하시겠습니까? 현재 클라우드 데이터는 덮어씌워집니다.`,
                    actions: [
                        { text: '취소', callback: closeModal },
                        { text: '복원', type: 'danger', callback: () => {
                            if (importType === 'v2') {
                                leagueData = data.leagues;
                                tournamentData = data.tournaments;
                            } else if (importType === 'league_legacy') {
                                leagueData.classes = data.classes || [];
                                leagueData.students = data.students || [];
                                leagueData.games = data.games || [];
                                leagueData.games.forEach(g => { if (g.isHighlighted === undefined) g.isHighlighted = false; });
                                leagueData.selectedClassId = null;
                                tournamentData = { tournaments: [], activeTournamentId: null };
                                appMode = 'league';
                            } else if (importType === 'tournament_legacy') {
                                tournamentData.tournaments = data;
                                tournamentData.activeTournamentId = null;
                                leagueData = { classes: [], students: [], games: [], selectedClassId: null };
                                appMode = 'tournament';
                            }
                            if (tournamentData.tournaments) {
                                tournamentData.tournaments.forEach(t => {
                                    if (t.rounds && typeof t.rounds === 'string') {
                                        t.rounds = JSON.parse(t.rounds);
                                    }
                                });
                            }
                            saveDataToFirestore();
                            switchMode(appMode);
                            closeModal();
                        }}
                    ]
                });

            } catch (err) {
                alert('파일 형식이 잘못되었거나 손상되었습니다.');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }
    
    // ========================================
    // 사이드바 토글 기능
    // ========================================
    function initializeSidebarToggle() {
        const sidebar = $('#sidebar');
        const sidebarToggle = $('#sidebar-toggle');
        const appContainer = $('.app-container');
        
        if (!sidebar || !sidebarToggle) {
            console.log('사이드바 또는 토글 버튼을 찾을 수 없습니다.');
            return;
        }
        
        console.log('사이드바 토글 기능 초기화 중...');
        console.log('app-container:', appContainer);
        
        // 토글 버튼이 보이도록 강제로 스타일 설정
        sidebarToggle.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 0 !important;
            transform: translateY(-50%) !important;
            width: 12px !important;
            height: 30px !important;
            background: #2563eb !important;
            border: 1px solid #ffffff !important;
            border-radius: 0 4px 4px 0 !important;
            color: white !important;
            cursor: pointer !important;
            z-index: 1000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s ease !important;
            box-shadow: 1px 0 4px rgba(0,0,0,0.1) !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            font-size: 10px !important;
            font-weight: bold !important;
        `;
        
        console.log('토글 버튼 스타일 강제 설정 완료');
        
        // 토글 버튼이 실제로 보이는지 확인
        const toggleRect = sidebarToggle.getBoundingClientRect();
        console.log('토글 버튼 위치 정보:', {
            left: toggleRect.left,
            top: toggleRect.top,
            width: toggleRect.width,
            height: toggleRect.height,
            visible: toggleRect.width > 0 && toggleRect.height > 0
        });
        
        // 토글 버튼에 눈에 띄는 배경색 설정
        sidebarToggle.style.backgroundColor = '#2563eb';
        console.log('토글 버튼에 파란색 배경 설정');
        
        // 로컬 스토리지에서 사이드바 상태 로드 (기본값은 펼친 상태)
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        
        // 초기 상태 설정
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            if (appContainer) appContainer.classList.add('sidebar-collapsed');
            // 강제로 접힌 상태 스타일 적용
            sidebar.style.cssText = `
                width: 0 !important;
                min-width: 0 !important;
                max-width: 0 !important;
                padding: 0 !important;
                border-right: none !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                background: var(--sidebar-bg) !important;
                flex-shrink: 0 !important;
                position: relative !important;
                transition: width 0.3s ease !important;
            `;
            // 토글 버튼 위치 설정
            sidebarToggle.style.left = '0px';
            sidebarToggle.style.zIndex = '1000';
            // 화살표 방향 설정 (접힌 상태에서는 오른쪽 화살표)
            sidebarToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,4 18,12 6,20"/></svg>';
            console.log('사이드바 초기 상태: 접힘');
        } else {
            if (appContainer) appContainer.classList.remove('sidebar-collapsed');
            // 강제로 펼친 상태 스타일 적용
            sidebar.style.cssText = `
                width: 340px !important;
                min-width: 340px !important;
                max-width: 340px !important;
                padding: 24px !important;
                border-right: 1px solid var(--line) !important;
                overflow: visible !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 20px !important;
                background: var(--sidebar-bg) !important;
                flex-shrink: 0 !important;
                position: relative !important;
                transition: width 0.3s ease !important;
            `;
            // 토글 버튼 위치 설정
            sidebarToggle.style.left = '340px';
            sidebarToggle.style.zIndex = '1000';
            // 화살표 방향 설정 (펼친 상태에서는 왼쪽 화살표)
            sidebarToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="18,4 6,12 18,20"/></svg>';
            console.log('사이드바 초기 상태: 펼침');
        }
        
        // 토글 버튼 클릭 이벤트
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
            console.log('토글 버튼 클릭됨. 현재 상태:', isCurrentlyCollapsed ? '접힘' : '펼침');
            console.log('사이드바 요소:', sidebar);
            console.log('사이드바 클래스 목록:', sidebar.className);
            
            if (isCurrentlyCollapsed) {
                // 사이드바 열기
                console.log('사이드바 펼치기 시도...');
                sidebar.classList.remove('collapsed');
                if (appContainer) appContainer.classList.remove('sidebar-collapsed');
                
                // 강제로 스타일 적용 - 모든 CSS 규칙을 덮어쓰기
                sidebar.style.cssText = `
                    width: 340px !important;
                    min-width: 340px !important;
                    max-width: 340px !important;
                    padding: 24px !important;
                    border-right: 1px solid var(--line) !important;
                    overflow: visible !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 20px !important;
                    background: var(--sidebar-bg) !important;
                    flex-shrink: 0 !important;
                    position: relative !important;
                    transition: width 0.3s ease !important;
                `;
                
                // 토글 버튼 위치 조정
                sidebarToggle.style.left = '340px';
                sidebarToggle.style.zIndex = '1000';
                // 화살표 방향 변경 (펼친 상태에서는 왼쪽 화살표)
                sidebarToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="18,4 6,12 18,20"/></svg>';
                
                localStorage.setItem('sidebar-collapsed', 'false');
                console.log('사이드바 펼침 완료');
                console.log('사이드바 클래스 목록 (펼침 후):', sidebar.className);
                console.log('app-container 클래스 목록 (펼침 후):', appContainer ? appContainer.className : '없음');
            } else {
                // 사이드바 닫기
                console.log('사이드바 접기 시도...');
                sidebar.classList.add('collapsed');
                if (appContainer) appContainer.classList.add('sidebar-collapsed');
                
                // 강제로 스타일 적용 - 모든 CSS 규칙을 덮어쓰기
                sidebar.style.cssText = `
                    width: 0 !important;
                    min-width: 0 !important;
                    max-width: 0 !important;
                    padding: 0 !important;
                    border-right: none !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 0 !important;
                    background: var(--sidebar-bg) !important;
                    flex-shrink: 0 !important;
                    position: relative !important;
                    transition: width 0.3s ease !important;
                `;
                
                // 토글 버튼 위치 조정
                sidebarToggle.style.left = '0px';
                sidebarToggle.style.zIndex = '1000';
                // 화살표 방향 변경 (접힌 상태에서는 오른쪽 화살표)
                sidebarToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,4 18,12 6,20"/></svg>';
                
                localStorage.setItem('sidebar-collapsed', 'true');
                console.log('사이드바 접음 완료');
                console.log('사이드바 클래스 목록 (접음 후):', sidebar.className);
                console.log('app-container 클래스 목록 (접음 후):', appContainer ? appContainer.className : '없음');
            }
        });
        
        // 키보드 단축키 지원 (Ctrl + B)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                console.log('키보드 단축키로 토글 실행');
                sidebarToggle.click();
            }
        });
        
        console.log('사이드바 토글 기능 초기화 완료');
    }

    document.addEventListener('DOMContentLoaded', () => {
        // 브라우저 호환성 체크
        if (!checkBrowserCompatibility()) {
            return;
        }
        
        if (handleShareView()) {
            return;
        }
        
        // 방문자 수 로드 및 업데이트 (Firebase 초기화 완료 후)
        setTimeout(async () => {
            await loadVisitorCount();
            await updateVisitorCount();
        }, 100);
        
        // 사이드바 토글 기능 초기화
        initializeSidebarToggle();
        
        // 네트워크 상태 모니터링 초기화
        initializeNetworkMonitoring();
        
        // AuthManager는 이미 초기화됨
        
        // 앱 즉시 초기화 (Firebase 초기화와 독립적으로)
        console.log('앱 초기화 시작');
        try {
            initialize_app();
            console.log('앱 초기화 완료');
        } catch (error) {
            console.error('앱 초기화 중 오류 발생:', error);
        }
        
        // Firebase 초기화 대기 (백그라운드에서)
        let firebaseCheckCount = 0;
        const maxFirebaseChecks = 50; // 5초 대기 (100ms * 50)
        
        const checkFirebase = setInterval(() => {
            firebaseCheckCount++;
            
            if (window.firebase) {
                clearInterval(checkFirebase);
                console.log('Firebase 초기화 완료, 인증 설정');
                setupFirebaseAuth();
            } else if (firebaseCheckCount >= maxFirebaseChecks) {
                clearInterval(checkFirebase);
                console.log('Firebase 초기화 시간 초과, 로컬 모드로 계속');
                setupLocalMode();
            } else {
                console.log(`Firebase 초기화 대기 중... (${firebaseCheckCount}/${maxFirebaseChecks})`);
            }
        }, 100);
        
        // Firebase 이벤트 리스너 추가
        window.addEventListener('firebaseReady', async () => {
            console.log('Firebase Ready 이벤트 수신');
            if (checkFirebase) {
                clearInterval(checkFirebase);
            }
            
            // AuthManager 초기화 (Firebase 준비 후)
            if (!authManagerInitialized) {
                console.log('AuthManager 초기화 시작');
                authManager = initializeAuthManager();
                setupGlobalAuthFunctions();
                authManagerInitialized = true;
                console.log('AuthManager 초기화 완료');
            }
            
            setupFirebaseAuth();
            
            // Firebase 초기화 완료 후 방문자 수 업데이트
            setTimeout(async () => {
                await loadVisitorCount();
                await updateVisitorCount();
            }, 500);
        });
        
        window.addEventListener('firebaseError', (event) => {
            console.error('Firebase Error 이벤트 수신:', event.detail);
            if (checkFirebase) {
                clearInterval(checkFirebase);
            }
            console.log('Firebase 초기화 실패, 로컬 모드로 계속');
            setupLocalMode();
        });
    });
    
    // ========================================
    // 네트워크 상태 모니터링
    // ========================================
    function initializeNetworkMonitoring() {
        // 온라인/오프라인 상태 감지
        function updateOnlineStatus() {
            const isOnline = navigator.onLine;
            console.log('네트워크 상태:', isOnline ? '온라인' : '오프라인');
            
            // 오프라인 시 데이터 동기화 시도
            if (isOnline && currentUser) {
                console.log('온라인 상태 복구, 데이터 동기화 시도');
                loadDataFromFirestore(currentUser.uid);
            }
        }
        
        // 이벤트 리스너 등록
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // 초기 상태 설정
        updateOnlineStatus();
        
        // 주기적 연결 상태 확인 (30초마다)
        setInterval(() => {
            if (navigator.onLine && currentUser && window.firebase) {
                // 간단한 연결 테스트
                const testDoc = window.firebase.doc(window.firebase.db, 'test', 'connection');
                window.firebase.getDoc(testDoc).catch(error => {
                    console.warn('Firebase 연결 테스트 실패:', error);
                });
            }
        }, 30000);
    }
    
    // ========================================
    // 공유 기능 관련
    // ========================================
    function handleShareView() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('share') === 'true') {
            const uid = urlParams.get('uid');
            const id = urlParams.get('id');
            const mode = urlParams.get('mode');
            const view = urlParams.get('view');

            // 모든 반 일정 공유의 경우 id가 없을 수 있음
            if (!uid || !mode || !view) return false;
            if (view !== 'all-schedules' && !id) return false;
            
            // 공유 모드에서는 서비스 워커 등록하지 않음
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }

            document.body.innerHTML = `
                <div id="loader" class="loader"><div >데이터를 불러오는 중...</div></div>
                <header class="top-bar">
                    <h1>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                        <span>체육 수업 도우미 (공유 모드)</span>
                    </h1>
                </header>
                <main id="share-view-content" class="main-content" style="padding: 24px;"></main>
                <footer class="sidebar-footer" style="padding: 12px; flex-shrink:0;">만든이: 김신회(laguyo87@gmail.com)</footer>
            `;
            
            const checkFirebase = setInterval(() => {
                if (window.firebase) {
                    clearInterval(checkFirebase);
                    loadSharedData(uid, id, mode, view);
                }
            }, 100);

            return true;
        }
        return false;
    }

    async function loadSharedData(uid, id, mode, view) {
        if (!dataManager) {
            console.error('DataManager가 초기화되지 않음');
            return;
        }
        
        const loader = $('#loader');
        if (loader) loader.classList.remove('hidden');
        
        try {
            // DataManager를 통해 공유 데이터 로드
            const appData = await dataManager.loadSharedData(uid, id, mode, view);
            
            if (appData) {
                // 로드된 데이터를 전역 변수에 설정
                leagueData = appData.leagues;
                tournamentData = appData.tournaments;
                papsData = appData.paps;
                progressClasses = appData.progress.classes;
                progressSelectedClassId = appData.progress.selectedClassId;
                
                if (mode === 'league' && view === 'all-schedules') {
                    renderAllClassesScheduleView();
                } else {
                    renderSharedView(id, mode, view);
                }
            } else {
                const container = $('#share-view-content');
                if (container) {
                    container.innerHTML = '<h2>공유된 데이터를 찾을 수 없습니다.</h2>';
                }
            }
        } catch (error) {
            console.error("공유 데이터 불러오기 실패:", error);
            const container = $('#share-view-content');
            if (container) {
                container.innerHTML = `
                    <h2>데이터를 불러오는 중 오류가 발생했습니다.</h2>
                    <p style="color: var(--ink-muted); margin-top: 10px;">오류: ${error.message}</p>
                    <p style="color: var(--ink-muted); margin-top: 5px;">잠시 후 다시 시도해주세요.</p>
                `;
            }
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    function renderSharedView(id, mode, view) {
        const container = $('#share-view-content');
        
        if (mode === 'league') {
            leagueData.selectedClassId = Number(id);
            const selectedClass = leagueData.classes.find(c => c.id === Number(id));
            if (!selectedClass) {
                container.innerHTML = '<h2>클래스를 찾을 수 없습니다.</h2>';
                return;
            }
            if (view === 'schedule') {
                container.innerHTML = `<h2>${selectedClass.name} - 경기 일정</h2><div id="gamesTableContainer" style="margin: 0 -24px; padding: 0 24px;"><div class="paps-table-wrap"><div id="gamesTableContent"></div></div></div>`;
                renderGamesTable(true);
            } else if (view === 'standings') {
                container.innerHTML = `<h2>${selectedClass.name} - 순위표</h2><div id="rankingsTableContainer" class="section-box" style="padding:0; overflow-x:auto;"></div>`;
                renderRankingsTable();
            }
        } else if (mode === 'tournament') {
            const tourney = tournamentData.tournaments.find(t => t.id === id);
             if (!tourney) {
                container.innerHTML = '<h2>토너먼트를 찾을 수 없습니다.</h2>';
                return;
            }
            if (view === 'bracket') {
                container.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <h2>${tourney.name} - 대진표</h2>
                      <span style="color:var(--ink-muted);">${tourney.sport || ''}</span>
                    </div>
                    <div id="bracket-container" class="bracket-wrap">
                        <div id="rounds" class="rounds"></div>
                        <svg id="svgLayer" class="svg-layer"></svg>
                    </div>
                `;
                renderBracket(tourney, true);
            }
        }
    }

    function renderAllClassesScheduleView() {
        const container = $('#share-view-content');
        
        if (!container) {
            console.error('공유 뷰 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        if (!leagueData || !leagueData.classes || leagueData.classes.length === 0) {
            container.innerHTML = '<h2>공유할 리그전 반이 없습니다.</h2>';
            return;
        }

        try {
            let html = '<h2 style="text-align: center; margin-bottom: 30px;">모든 반 경기 일정</h2>';
            
            leagueData.classes.forEach((classItem, index) => {
                // 해당 반의 경기 데이터 필터링
                const classGames = (leagueData.games || []).filter(game => game.classId === classItem.id);
                
                html += `
                    <div class="class-schedule-section" style="margin-bottom: 40px;">
                        <h3 style="color: var(--accent); border-bottom: 2px solid var(--accent); padding-bottom: 8px; margin-bottom: 20px;">
                            ${classItem.name} (${classGames.length}경기)
                        </h3>
                        <div class="paps-table-wrap">
                            <div class="games-table-content">
                                ${renderGamesTableForClass(classItem, classGames)}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } catch (error) {
            console.error('모든 반 일정 렌더링 중 오류:', error);
            container.innerHTML = `
                <h2>일정을 표시하는 중 오류가 발생했습니다.</h2>
                <p style="color: var(--ink-muted); margin-top: 10px;">오류: ${error.message}</p>
            `;
        }
    }

    function renderGamesTableForClass(classItem, games) {
        if (!games || games.length === 0) {
            return '<div style="text-align: center; padding: 2rem; color: var(--ink-muted);">경기가 없습니다.</div>';
        }

        // 경기를 간단하게 나열 (날짜별 그룹화 제거)
        return games.map(game => renderGameItem(game)).join('');
    }

    function renderGameItem(game) {
        // 리그전 경기 데이터에서 선수 이름 찾기
        let teamA = '팀 A';
        let teamB = '팀 B';
        
        if (game.player1Id && game.player2Id) {
            // 리그전 경기 데이터 구조
            const player1 = leagueData.students.find(s => s.id === game.player1Id);
            const player2 = leagueData.students.find(s => s.id === game.player2Id);
            teamA = player1 ? player1.name : '팀 A';
            teamB = player2 ? player2.name : '팀 B';
        } else if (game.teamA && game.teamB) {
            // 토너먼트 경기 데이터 구조
            teamA = game.teamA;
            teamB = game.teamB;
        }
        
        const scoreA = (game.player1Score !== null && game.player1Score !== undefined) ? game.player1Score : 
                      (game.scoreA !== null && game.scoreA !== undefined) ? game.scoreA : '-';
        const scoreB = (game.player2Score !== null && game.player2Score !== undefined) ? game.player2Score : 
                      (game.scoreB !== null && game.scoreB !== undefined) ? game.scoreB : '-';
        
        let resultClass = '';
        let resultText = '';
        
        // 점수가 입력된 경우 승부 결과 판정
        if (scoreA !== '-' && scoreB !== '-') {
            const numScoreA = parseFloat(scoreA);
            const numScoreB = parseFloat(scoreB);
            
            if (!isNaN(numScoreA) && !isNaN(numScoreB)) {
                if (numScoreA > numScoreB) {
                    resultClass = 'win';
                    resultText = `${teamA} 승`;
                } else if (numScoreB > numScoreA) {
                    resultClass = 'win';
                    resultText = `${teamB} 승`;
                } else {
                    resultClass = 'draw';
                    resultText = '무승부';
                }
            }
        }

        return `
            <div class="game-item" style="
                display: flex; 
                align-items: center; 
                padding: 12px 16px; 
                margin-bottom: 8px; 
                background: var(--bg-light); 
                border: 1px solid var(--border); 
                border-radius: 8px;
                ${resultClass ? `border-left: 4px solid var(--${resultClass === 'win' ? 'win' : 'draw'});` : ''}
            ">
                <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
                    <div style="font-weight: 600; min-width: 80px;">${teamA}</div>
                    <div style="color: var(--ink-muted);">vs</div>
                    <div style="font-weight: 600; min-width: 80px;">${teamB}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px; color: var(--ink-muted); font-size: 14px;">
                    <div style="min-width: 60px; text-align: center;">
                        <span style="font-weight: 600; color: var(--ink);">${scoreA}</span> - 
                        <span style="font-weight: 600; color: var(--ink);">${scoreB}</span>
                    </div>
                    ${resultText ? `<div style="color: var(--${resultClass === 'win' ? 'win' : 'draw'}); font-weight: 600;">${resultText}</div>` : ''}
                </div>
            </div>
        `;
    }

    function shareView(mode, view) {
        let id;
        if (mode === 'league') {
            id = leagueData.selectedClassId;
            if (!id) { showModal({ title: '오류', body: '먼저 반을 선택해주세요.', actions: [{ text: '확인', type: 'primary', callback: closeModal }] }); return; }
        } else if (mode === 'tournament') {
            id = tournamentData.activeTournamentId;
             if (!id) { showModal({ title: '오류', body: '먼저 토너먼트를 선택해주세요.', actions: [{ text: '확인', type: 'primary', callback: closeModal }] }); return; }
        }

        // 로컬 모드와 로그인 모드 모두 지원
        const uid = currentUser ? currentUser.uid : 'local';
        const url = `${window.location.origin}${window.location.pathname}?share=true&uid=${uid}&id=${id}&mode=${mode}&view=${view}`;
        copyToClipboard(url);
    }

    function shareAllClassesSchedule() {
        // 리그전 반이 있는지 확인
        if (!leagueData.classes || leagueData.classes.length === 0) {
            showModal({ 
                title: '오류', 
                body: '공유할 리그전 반이 없습니다. 먼저 반을 생성해주세요.', 
                actions: [{ text: '확인', type: 'primary', callback: closeModal }] 
            }); 
            return; 
        }

        // 로컬 모드와 로그인 모드 모두 지원
        const uid = currentUser ? currentUser.uid : 'local';
        const url = `${window.location.origin}${window.location.pathname}?share=true&uid=${uid}&mode=league&view=all-schedules`;
        copyToClipboard(url);
    }
    
    function copyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showModal({ title: '공유 링크 복사됨', body: '링크가 클립보드에 복사되었습니다. 원하는 곳에 붙여넣기 하세요.', actions: [{ text: '확인', type: 'primary', callback: closeModal }] });
        } catch (err) {
             showModal({ title: '복사 실패', body: '링크를 복사하는 데 실패했습니다.', actions: [{ text: '확인', type: 'danger', callback: closeModal }] });
        }
        document.body.removeChild(textArea);
    }

    // ========================================

    function initialize_app() {
        console.log('initialize_app 함수 시작');
        
        // Service Worker 등록 (지원하는 브라우저에서만)
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                try {
                    navigator.serviceWorker.register('./service-worker.js')
                        .then(registration => {
                            console.log('ServiceWorker registration successful: ', registration);
                        })
                        .catch(err => {
                            console.log('ServiceWorker registration failed: ', err);
                        });
                } catch (e) {
                    console.warn('ServiceWorker not supported:', e);
                }
            });
        }
        
        // 초기 화면을 수업 진도 관리 모드로 설정
        console.log('앱 모드 설정:', appMode);
        appMode = 'progress';
        console.log('앱 모드 변경됨:', appMode);
        
        // VisitorManager 초기화 확인
        if (!visitorManager) {
            console.log('VisitorManager가 초기화되지 않음, 초기화 시도');
            visitorManager = initializeVisitorManager();
            visitorManagerInitialized = true;
        }
        
        // HTML에서 이미 올바른 초기 상태로 설정되어 있음
        console.log('renderApp 호출 시작');
        renderApp();
        console.log('renderApp 호출 완료');
    }
    
    function setupFirebaseAuth() {
        // AuthManager가 초기화되었는지 확인
        if (!authManager) {
            console.error('AuthManager가 초기화되지 않음');
            return;
        }
        
        console.log('Firebase 인증 설정 시작');
        // authManager를 통해 Firebase 인증 설정
        authManager.setupFirebaseAuth();
        
        // dataManager에 현재 사용자 설정
        if (dataManager) {
            dataManager.setCurrentUser(currentUser);
        }
        
        // 인증 상태 변경 콜백 등록
        authManager.onAuthStateChange((user) => {
            console.log('=== Firebase 인증 상태 변경 ===');
            console.log('상태:', user ? '로그인됨' : '로그아웃됨');
            console.log('사용자 정보:', user);
            console.log('사용자 UID:', user ? user.uid : '없음');
            console.log('사용자 이메일:', user ? user.email : '없음');
            
            if (user) {
                currentUser = user;
                console.log('=== 사용자 로그인 처리 시작 ===');
                console.log('사용자 이메일 표시:', user.displayName || user.email);
                console.log('데이터 로딩 시작, UID:', user.uid);
                loadDataFromFirestore(user.uid);
                // 로그인 상태 UI 업데이트
                authManager.updateLoginStatus();
            } else {
                console.log('사용자 로그아웃 처리 시작');
                currentUser = null;
                // 로컬 스토리지에서 데이터 로드
                loadLocalData();
                
                // 사이드바 정리
                cleanupSidebar();
                
                // 앱 다시 렌더링
                renderApp();
            }
            });

        // 공통 이벤트 리스너 설정
        setupCommonEventListeners();
    }
    
    function setupCommonEventListeners() {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.body.dataset.theme = savedTheme;
        switchMode(appMode);

        $$('.mode-switch-btn').forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.mode)));
        $('#exportAllLeaguesBtn').addEventListener('click', exportAllLeaguesToExcel);
        $('#importAllLeaguesExcel').addEventListener('change', importAllLeaguesFromExcel);
        $('#theme-toggle-btn').addEventListener('click', () => {
            const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            document.body.dataset.theme = newTheme;
            localStorage.setItem("theme", newTheme);
        });
    }
    
    function setupLocalMode() {
        console.log('Firebase를 사용할 수 없음, 로컬 모드로만 작동');
        
        // AuthManager가 초기화되었는지 확인
        if (!authManager) {
            console.error('AuthManager가 초기화되지 않음');
            return;
        }
        
        console.log('로컬 모드 설정 시작');
        // authManager를 통해 로컬 모드 설정
        authManager.setupLocalMode();
        
        // dataManager에 현재 사용자 설정 (로컬 모드에서는 null)
        if (dataManager) {
            dataManager.setCurrentUser(null);
        }
        
        // 공통 이벤트 리스너 설정
        setupCommonEventListeners();
    }

    function importAllLeaguesFromExcel(event) {
        const file = event.target.files[0];
        if (!file) return;

        showModal({
            title: '전체 리그 가져오기',
            body: `'${file.name}' 파일에서 모든 리그 데이터를 가져옵니다. 이 작업은 현재 리그전 데이터를 모두 덮어씁니다. 계속하시겠습니까?`,
            actions: [
                { text: '취소', callback: () => {
                    event.target.value = ''; // 파일 선택 초기화
                    closeModal();
                }},
                { text: '가져오기', type: 'danger', callback: () => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });

                            const newLeagueData = { classes: [], students: [], games: [], selectedClassId: null };
                            const classMap = new Map();

                            workbook.SheetNames.forEach(sheetName => {
                                const isRankingSheet = sheetName.endsWith(' 순위');
                                const isScheduleSheet = sheetName.endsWith(' 일정');
                                if (!isRankingSheet && !isScheduleSheet) return;

                                const className = isRankingSheet ? sheetName.replace(' 순위', '') : sheetName.replace(' 일정', '');
                                if (!classMap.has(className)) {
                                    const newClass = { id: Date.now() + classMap.size, name: className, note: '' };
                                    classMap.set(className, { classInfo: newClass, students: new Map(), games: [] });
                                    newLeagueData.classes.push(newClass);
                                }

                                const classData = classMap.get(className);
                                const worksheet = workbook.Sheets[sheetName];
                                const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                                if (isRankingSheet && sheetData.length > 1) {
                                    sheetData.slice(1).forEach(row => {
                                        const studentName = row[1];
                                        if (studentName && !classData.students.has(studentName)) {
                                            const newStudent = { id: Date.now() + Math.random(), name: studentName, classId: classData.classInfo.id, note: '' };
                                            classData.students.set(studentName, newStudent);
                                        }
                                    });
                                } else if (isScheduleSheet && sheetData.length > 1) {
                                    sheetData.slice(1).forEach(row => {
                                        const [, p1Name, p1Score, p2Score, p2Name, status, completionDate, note] = row;
                                        if (!p1Name || !p2Name) return;
                                        
                                        const p1 = Array.from(classData.students.values()).find(s => s.name === p1Name);
                                        const p2 = Array.from(classData.students.values()).find(s => s.name === p2Name);
                                        if (!p1 || !p2) return;

                                        classData.games.push({
                                            id: Date.now() + Math.random(), classId: classData.classInfo.id,
                                            player1Id: p1.id, player2Id: p2.id,
                                            player1Score: p1Score === undefined ? null : Number(p1Score),
                                            player2Score: p2Score === undefined ? null : Number(p2Score),
                                            isCompleted: status === '완료', completionDate: completionDate || '', note: note || '', isHighlighted: false
                                        });
                                    });
                                }
                            });

                            classMap.forEach(data => newLeagueData.students.push(...data.students.values()));
                            classMap.forEach(data => newLeagueData.games.push(...data.games));

                            leagueData = newLeagueData;
                            saveDataToFirestore();
                            renderApp();
                        } catch (error) {
                            console.error("엑셀 파일 처리 중 오류 발생:", error);
                            alert('파일을 처리하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
                        } finally {
                            event.target.value = '';
                            closeModal();
                        }
                    };
                    reader.readAsArrayBuffer(file);
                }}
            ]
        });
    }

    function printLiveRankings() {
        const popupTitle = $('#popupTitle').textContent;
        const tableContainer = $('#popupRankingsTable').parentElement.innerHTML;

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write('<html><head><title>순위표 인쇄</title>');
        printWindow.document.write('<style>body{font-family: "Noto Sans KR", sans-serif;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px; text-align:center;} th{background:#f2f2f2;} .rank-wins{color:green;} .rank-losses{color:red;} .rank-points{color:blue; font-weight:bold;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h2>${popupTitle}</h2>`);
        printWindow.document.write(tableContainer);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }

    function printBracket() {
        const tourney = tournamentData.tournaments.find(t => t.id === tournamentData.activeTournamentId);
        if (!tourney) return;

        const printWindow = window.open('', '', 'height=800,width=1200');
        printWindow.document.write('<html><head><title>대진표 인쇄</title>');
        
        const styles = document.head.querySelectorAll('style');
        styles.forEach(style => {
            printWindow.document.write(style.outerHTML);
        });
        
        printWindow.document.write(`
            <style>
                body { 
                    background: #fff !important; 
                    color: #000 !important; 
                    font-family: 'Noto Sans KR', sans-serif;
                    margin: 0;
                    padding: 20px;
                }
                .bracket-wrap { 
                    overflow: visible !important; 
                    border: none !important; 
                    width: 100%;
                }
                .main-content { padding: 0 !important; }
                .btn { display: none !important; }
                .rounds {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    align-items: flex-start;
                }
                .round {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 200px;
                }
                .round-title {
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-align: center;
                    font-size: 14px;
                }
                .match-group {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .match {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: #fff;
                    min-width: 180px;
                }
                .team {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    border-bottom: 1px solid #eee;
                    min-height: 40px;
                }
                .team:last-child {
                    border-bottom: none;
                }
                .team.win {
                    background-color: #e8f5e8;
                    font-weight: bold;
                }
                .team.lose {
                    background-color: #f5e8e8;
                }
                .team-name {
                    flex: 1;
                    font-size: 13px;
                }
                .team-score {
                    width: 40px;
                    text-align: center;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 2px;
                    margin-left: 8px;
                }
                .team-actions {
                    margin-left: 8px;
                    font-size: 11px;
                }
                .medal {
                    display: inline-block;
                    margin-right: 4px;
                }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .bracket-wrap { page-break-inside: avoid; }
                }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h2 style="text-align: center; margin-bottom: 30px;">${tourney.name} - 대진표</h2>`);
        
        // 대진표 HTML 생성 - 실제 UI와 동일하게
        const roundsData = tourney.roundsData || tourney.rounds;
        if (!roundsData || roundsData.length === 0) {
            printWindow.document.write('<p>대진표가 생성되지 않았습니다.</p>');
            printWindow.document.close();
            return;
        }
        
        const roundLabels = makeRoundLabels(roundsData.length);
        const bracketHtml = `
            <div class="bracket-wrap">
                <div class="rounds">
                    ${roundsData.map((round, rIdx) => `
                        <div class="round">
                            <div class="round-title">${roundLabels[rIdx]}</div>
                            <div class="match-group">
                                ${round.matches ? round.matches.map(m => renderMatchCard(m, rIdx, tourney, true)).join('') : round.map(m => renderMatchCard(m, rIdx, tourney, true)).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        printWindow.document.write(bracketHtml);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // 인쇄 실행
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    }
    
    function drawSvgLinesForPrint(printWindow, tourney) {
        const svg = printWindow.document.getElementById('printSvgLayer');
        const roundsEl = printWindow.document.querySelector('.rounds');
        if(!svg || !roundsEl) return;
        
        svg.innerHTML = "";
        const scrollW = roundsEl.scrollWidth; 
        const scrollH = roundsEl.scrollHeight;
        svg.setAttribute("viewBox", `0 0 ${scrollW} ${scrollH}`);
        svg.setAttribute("width", scrollW); 
        svg.setAttribute("height", scrollH);
        
        if(!tourney || !Array.isArray(tourney.rounds)) return;

        // 인쇄 창용 좌표 계산 함수들
        const getBottomRightForPrint = (el, container) => { 
            const r1 = el.getBoundingClientRect(); 
            const rC = container.getBoundingClientRect(); 
            return { x: (r1.right - rC.left) + 15 + container.scrollLeft, y: (r1.bottom - rC.top) + 18 + container.scrollTop }; 
        };
        const getBottomLeftForPrint = (el, container) => { 
            const r1 = el.getBoundingClientRect(); 
            const rC = container.getBoundingClientRect(); 
            return { x: (r1.left - rC.left) + 15 + container.scrollLeft, y: (r1.bottom - rC.top) + 18 + container.scrollTop }; 
        };

        for(let r=0; r < tourney.rounds.length-1; r++){
            const currentRound = tourney.rounds[r];
            currentRound.forEach(match => {
                if (!match || !match.parentId) return;

                const childCard = roundsEl.querySelector(`[data-match-id="${match.id}"]`);
                const parentCard = roundsEl.querySelector(`[data-match-id="${match.parentId}"]`);
                if (!childCard || !parentCard) return;

                const start = getBottomRightForPrint(childCard, roundsEl);
                const end = getBottomLeftForPrint(parentCard, roundsEl);
                
                // 곡선 연결선
                const path = printWindow.document.createElementNS("http://www.w3.org/2000/svg","path");
                const gap = 40;
                const midX = start.x + gap;
                const d = `M ${start.x} ${start.y} 
                          C ${midX} ${start.y} ${midX} ${end.y} ${end.x} ${end.y}`;
                path.setAttribute("d", d);
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", match.winner ? "#1971c2" : "#dee2e6");
                path.setAttribute("stroke-width", match.winner ? "2.5" : "1.5");
                path.setAttribute("stroke-linecap", "round");
                path.setAttribute("stroke-linejoin", "round");
                svg.appendChild(path);
            });
        }
    }

    function printRankings() {
        const classId = leagueData.selectedClassId;
        if (!classId) return;
        const currentClass = leagueData.classes.find(c => c.id === classId);
        const tableContainer = document.createElement('div');
        
        // leagueManager를 통해 순위표 렌더링
        if (leagueManager) {
            leagueManager.renderRankingsTable(tableContainer);
        } else {
            console.error('leagueManager가 초기화되지 않음');
            return;
        }

        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write('<html><head><title>순위표 인쇄</title>');
        printWindow.document.write('<style>body{font-family: "Noto Sans KR", sans-serif;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px; text-align:center;} th{background:#f2f2f2;} .rank-wins{color:green;} .rank-losses{color:red;} .rank-points{color:blue; font-weight:bold;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h2>${currentClass.name} 순위표</h2>`);
        printWindow.document.write(tableContainer.innerHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
    }
    


    function showModal({ title, body, actions }) {
        $('#modal-title').textContent = title;
        $('#modal-body').innerHTML = body;
        const actionsEl = $('#modal-actions');
        actionsEl.innerHTML = '';
        actions.forEach(action => {
            const button = document.createElement('button');
            button.textContent = action.text;
            button.className = `btn ${action.type || ''}`;
            button.onclick = action.callback;
            actionsEl.appendChild(button);
        });
        $('#modal-container').classList.remove('hidden');
    }
    function closeModal() { $('#modal-container').classList.add('hidden'); }

  
