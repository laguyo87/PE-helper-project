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
      LeagueManager
    } from './js/modules/leagueManager.js';
    import { 
      TournamentManager
    } from './js/modules/tournamentManager.js';
    import { 
      PapsManager
    } from './js/modules/papsManager.js';
import {
  initializeProgressManager,
  ProgressManager
} from './js/modules/progressManager.js';
    
    // ========================================
    // 앱 상태 및 전역 변수
    // ========================================
    let versionManager = null;
    let versionManagerInitialized = false;
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
    let papsManager = null;
    let papsManagerInitialized = false;
    let appMode = 'progress';
let progressManager = null;
let progressManagerInitialized = false;

// 데이터 변수
let leagueData = { classes: [] };
let tournamentData = { tournaments: [] };
let papsData = { classes: [], activeClassId: null };
    let progressClasses = [];
let progressSelectedClassId = null;

// DOM 헬퍼 함수들
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

    // ========================================
// 사이드바 정리 함수
    // ========================================
function cleanupSidebar() {
    // 사이드바 요소들 정리
    const listContainer = $('#sidebar-list-container');
    if (listContainer) {
        listContainer.innerHTML = '';
    }
}

    // ========================================
// 앱 초기화
    // ========================================
async function initialize_app() {
    console.log('앱 초기화 시작');
    
    // 버전 체크
    checkVersion();
    
    // DOM 헬퍼 함수들을 전역으로 설정
    window.$ = $;
    window.$$ = $$;
    
    // 모듈 초기화
    try {
        // 버전 관리자 초기화
        versionManager = initializeVersionManager();
        versionManagerInitialized = true;
        console.log('VersionManager 초기화 완료');
        
        // 인증 관리자 초기화
            authManager = initializeAuthManager();
            authManagerInitialized = true;
        setupGlobalAuthFunctions();
        console.log('AuthManager 초기화 완료');
        
        // 데이터 관리자 초기화
            dataManager = initializeDataManager();
            dataManagerInitialized = true;
        console.log('DataManager 초기화 완료');
        
        // AuthManager와 DataManager 연결
        if (authManager && dataManager) {
            authManager.onAuthStateChange(async (user) => {
                console.log('인증 상태 변경됨, DataManager에 사용자 정보 설정:', user);
                dataManager.setCurrentUser(user);
                
                // 로그인 성공 시 데이터 다시 로드
                if (user) {
                    console.log('로그인 성공, 데이터 다시 로드 시작');
                    await loadDataFromFirestore();
                }
            });
        }
        
        // 방문자 관리자 초기화
            visitorManager = initializeVisitorManager();
            visitorManagerInitialized = true;
        console.log('VisitorManager 초기화 완료');
        
        // 리그 관리자 초기화
        leagueManager = new LeagueManager(leagueData, { saveCallback: saveDataToFirestore });
            leagueManagerInitialized = true;
        window.leagueManager = leagueManager; // 전역 변수로 등록
        console.log('LeagueManager 초기화 완료:', leagueManager);
        
        // 토너먼트 관리자 초기화
        tournamentManager = new TournamentManager(tournamentData, saveDataToFirestore);
            tournamentManagerInitialized = true;
        window.tournamentManager = tournamentManager; // 전역 변수로 등록
        console.log('TournamentManager 초기화 완료:', tournamentManager);
        
        // PAPS 관리자 초기화
        papsManager = new PapsManager(papsData, $, saveDataToFirestore, cleanupSidebar);
        papsManagerInitialized = true;
        window.papsManager = papsManager; // 전역 변수로 등록
        console.log('PapsManager 초기화 완료:', papsManager);
        console.log('window.papsManager 등록됨:', window.papsManager);
        console.log('window.papsManager.selectPapsClass:', typeof window.papsManager?.selectPapsClass);
        
        // ProgressManager 초기화
        progressManager = initializeProgressManager($, $$, saveProgressData);
        progressManagerInitialized = true;
        window.progressManager = progressManager; // 전역 변수로 등록
        console.log('ProgressManager 초기화 완료');
        
    } catch (error) {
        console.error('모듈 초기화 중 오류:', error);
    }
    
    // 데이터 로드
    await loadDataFromFirestore();
    
    // UI 초기화
    initializeUI();
    
    console.log('앱 초기화 완료');
    }

    // ========================================
// 버전 관리
    // ========================================
function checkVersion() {
    const storedVersion = localStorage.getItem('pe_helper_version');
    if (storedVersion !== APP_VERSION) {
        console.log(`새 버전 감지: ${APP_VERSION} (이전: ${storedVersion})`);
        localStorage.setItem('pe_helper_version', APP_VERSION);
        localStorage.setItem('cache_buster', Date.now());
        
        if (storedVersion) {
            showVersionNotification(APP_VERSION, storedVersion);
        }
    }
}

function showVersionNotification(newVersion, oldVersion) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1565c0;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: 'Noto Sans KR', sans-serif;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 8px;">🔄 새 버전 사용 가능</div>
        <div style="font-size: 14px; margin-bottom: 12px;">
          v${newVersion}이 출시되었습니다.<br>
          최신 기능을 사용하려면 새로고침해주세요.
                </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="location.reload()" style="background: white; color: #1565c0; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;">새로고침</button>
          <button onclick="this.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">나중에</button>
            </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    }

    // ========================================
// 데이터 관리
    // ========================================
async function loadDataFromFirestore() {
    console.log('=== loadDataFromFirestore 호출됨 ===');
    console.log('dataManager:', dataManager);
    console.log('dataManagerInitialized:', dataManagerInitialized);
    console.log('authManager:', authManager);
    console.log('authManagerInitialized:', authManagerInitialized);
    
    try {
        if (dataManager && dataManagerInitialized) {
            const userId = authManager?.currentUser?.uid || 'anonymous';
            console.log('사용자 ID:', userId);
            console.log('authManager.currentUser:', authManager?.currentUser);
            console.log('Firebase 연결 상태 확인 중...');
            
            // Firebase 연결 상태 확인
            if (window.firebase) {
                console.log('window.firebase 존재:', !!window.firebase);
                console.log('window.firebase.db 존재:', !!window.firebase.db);
                console.log('window.firebase.auth 존재:', !!window.firebase.auth);
                console.log('window.firebase.doc 존재:', !!window.firebase.doc);
                console.log('window.firebase.getDoc 존재:', !!window.firebase.getDoc);
        } else {
                console.log('window.firebase가 없음');
                console.log('Firebase 초기화 대기 중...');
                // Firebase 초기화 대기
                return new Promise((resolve) => {
                    window.addEventListener('firebaseReady', () => {
                        console.log('Firebase 초기화 완료, 데이터 로드 재시도');
                        loadDataFromFirestore().then(resolve);
                    }, { once: true });
                });
            }
            
            console.log('DataManager.loadDataFromFirestore 호출 시작...');
            const appData = await dataManager.loadDataFromFirestore(userId);
            console.log('Firestore에서 데이터 로드됨:', appData);
            console.log('데이터 타입:', typeof appData);
            console.log('데이터가 null인가?', appData === null);
            console.log('데이터가 undefined인가?', appData === undefined);
            console.log('데이터가 객체인가?', typeof appData === 'object' && appData !== null);
            if (appData && typeof appData === 'object') {
                console.log('데이터 키들:', Object.keys(appData));
                console.log('데이터 크기:', Object.keys(appData).length);
                
                // 각 데이터 섹션 상세 분석
                console.log('=== Firebase 데이터 상세 분석 ===');
                console.log('appData.leagues:', appData.leagues);
                console.log('appData.tournaments:', appData.tournaments);
                console.log('appData.paps:', appData.paps);
                console.log('appData.progress:', appData.progress);
                
                // PAPS 데이터 상세 분석
                if (appData.paps) {
                    console.log('=== PAPS 데이터 상세 분석 ===');
                    console.log('paps.classes:', appData.paps.classes);
                    console.log('paps.classes.length:', appData.paps.classes?.length || 0);
                    console.log('paps.activeClassId:', appData.paps.activeClassId);
                    if (appData.paps.classes && appData.paps.classes.length > 0) {
                        console.log('첫 번째 PAPS 클래스:', appData.paps.classes[0]);
                        console.log('첫 번째 클래스의 students:', appData.paps.classes[0].students);
                        console.log('첫 번째 클래스의 students.length:', appData.paps.classes[0].students?.length || 0);
                    }
                }
                
                if (appData.leagues) {
                    console.log('leagues.classes:', appData.leagues.classes);
                    console.log('leagues.classes.length:', appData.leagues.classes?.length || 0);
                }
                if (appData.tournaments) {
                    console.log('tournaments.tournaments:', appData.tournaments.tournaments);
                    console.log('tournaments.tournaments.length:', appData.tournaments.tournaments?.length || 0);
                }
                if (appData.paps) {
                    console.log('paps.classes:', appData.paps.classes);
                    console.log('paps.classes.length:', appData.paps.classes?.length || 0);
                }
                if (appData.progress) {
                    console.log('progress.classes:', appData.progress.classes);
                    console.log('progress.classes.length:', appData.progress.classes?.length || 0);
                }
            }
            
            if (appData && Object.keys(appData).length > 0) {
                // 데이터 구조 안전하게 처리
                leagueData = appData.leagues || { classes: [], students: [], games: [], selectedClassId: null };
                tournamentData = appData.tournaments || { tournaments: [], activeTournamentId: null };
                papsData = appData.paps || { classes: [], activeClassId: null };
                progressClasses = appData.progress?.classes || [];
                progressSelectedClassId = appData.progress?.selectedClassId || null;
                
                // PAPS 데이터 구조 검증 및 수정
                if (papsData && papsData.classes) {
                    console.log('=== PAPS 데이터 구조 검증 ===');
                    papsData.classes.forEach((cls, index) => {
                        console.log(`클래스 ${index}:`, cls);
                        // students 배열이 없으면 빈 배열로 초기화
                        if (!cls.students) {
                            console.log(`클래스 ${index}에 students 속성 추가`);
                            cls.students = [];
                        }
                        // eventSettings가 없으면 빈 객체로 초기화
                        if (!cls.eventSettings) {
                            console.log(`클래스 ${index}에 eventSettings 속성 추가`);
                            cls.eventSettings = {};
                        }
                        // gradeLevel이 없으면 기본값 설정
                        if (!cls.gradeLevel) {
                            console.log(`클래스 ${index}에 gradeLevel 속성 추가`);
                            cls.gradeLevel = '중1';
                        }
                    });
                } else if (papsData && !papsData.classes) {
                    console.log('PAPS 데이터에 classes 속성이 없음, 빈 배열로 초기화');
                    papsData.classes = [];
                }
                
                console.log('=== 데이터 구조 검증 ===');
                console.log('leagueData 구조:', {
                    classes: leagueData.classes?.length || 0,
                    students: leagueData.students?.length || 0,
                    games: leagueData.games?.length || 0,
                    selectedClassId: leagueData.selectedClassId
                });
                console.log('tournamentData 구조:', {
                    tournaments: tournamentData.tournaments?.length || 0,
                    activeTournamentId: tournamentData.activeTournamentId
                });
                console.log('papsData 구조:', {
                    classes: papsData.classes?.length || 0,
                    activeClassId: papsData.activeClassId
                });
                console.log('progressClasses 구조:', {
                    classes: progressClasses?.length || 0,
                    selectedClassId: progressSelectedClassId
                });
                
                console.log('=== Firestore 데이터 로딩 완료 ===');
                console.log('leagueData:', leagueData);
                console.log('tournamentData:', tournamentData);
                console.log('papsData:', papsData);
                console.log('progressClasses:', progressClasses);
                console.log('progressSelectedClassId:', progressSelectedClassId);
                
                // ProgressManager에 데이터 전달
                if (progressManager && progressManagerInitialized) {
                    console.log('ProgressManager에 데이터 전달');
                    progressManager.initialize(progressClasses, progressSelectedClassId);
                }
                
                // 각 매니저에 데이터만 전달 (렌더링은 하지 않음)
                if (leagueManager && leagueManagerInitialized) {
                    console.log('LeagueManager에 데이터 전달');
                    leagueManager.leagueData = leagueData;
                }
                
                if (tournamentManager && tournamentManagerInitialized) {
                    console.log('TournamentManager에 데이터 전달');
                    tournamentManager.tournamentData = tournamentData;
                }
                
                if (papsManager && papsManagerInitialized) {
                    console.log('PapsManager에 데이터 전달');
                    papsManager.papsData = papsData;
                    console.log('PapsManager 데이터 전달 완료:', papsManager.papsData);
                }
        } else {
                console.log('Firestore에 데이터 없음, 로컬 스토리지에서 로드');
                loadLocalData();
            }
        } else {
            console.log('DataManager가 초기화되지 않음, 로컬 데이터 로드');
            loadLocalData();
        }
    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        loadLocalData();
    }
    
    // ProgressManager 초기화 (데이터 로드 후)
    if (!progressManagerInitialized) {
        try {
            console.log('ProgressManager 초기화 시작 (데이터 로드 후)');
            console.log('progressClasses 데이터:', progressClasses);
            console.log('progressSelectedClassId:', progressSelectedClassId);
            progressManager = initializeProgressManager(
                $,
                $$,
                saveProgressData
            );
            progressManagerInitialized = true;
            window.progressManager = progressManager;
            // 데이터가 있는 경우에만 초기화
            if (progressClasses && progressClasses.length > 0) {
                progressManager.initialize(progressClasses, progressSelectedClassId || null);
                console.log('ProgressManager 데이터와 함께 초기화 완료');
        } else {
                console.log('ProgressManager 빈 데이터로 초기화');
                progressManager.initialize([], null);
            }
            console.log('ProgressManager 초기화 완료 (데이터 로드 후)');
        } catch (error) {
            console.error('ProgressManager 초기화 실패 (데이터 로드 후):', error);
            progressManager = null;
            progressManagerInitialized = false;
        }
    }
    
    // 데이터 로드 완료 후 렌더링
    console.log('데이터 로드 완료, 앱 렌더링 시작');
    setTimeout(() => {
        renderApp();
    }, 100);
}

function loadLocalData() {
    console.log('=== loadLocalData 호출됨 ===');
    try {
        const appData = JSON.parse(localStorage.getItem('pe_helper_data') || '{}');
        console.log('로컬 스토리지 데이터:', appData);
        
        if (appData && Object.keys(appData).length > 0) {
            // 로드된 데이터를 전역 변수에 설정
            leagueData = appData.leagues || { classes: [] };
            tournamentData = appData.tournaments || { tournaments: [] };
            papsData = appData.paps || { classes: [], activeClassId: null };
            progressClasses = appData.progress?.classes || [];
            progressSelectedClassId = appData.progress?.selectedClassId || null;
            
            console.log('로컬 데이터 로딩 완료');
                console.log('leagueData:', leagueData);
                console.log('tournamentData:', tournamentData);
                console.log('papsData:', papsData);
                console.log('progressClasses:', progressClasses);
                
                // 각 매니저에 데이터 전달
                if (leagueManager && leagueManagerInitialized) {
                    console.log('LeagueManager에 로컬 데이터 전달');
                    leagueManager.leagueData = leagueData;
                }
                
                if (tournamentManager && tournamentManagerInitialized) {
                    console.log('TournamentManager에 로컬 데이터 전달');
                    tournamentManager.tournamentData = tournamentData;
                }
                
                if (papsManager && papsManagerInitialized) {
                    console.log('PapsManager에 로컬 데이터 전달');
                    papsManager.papsData = papsData;
                    console.log('PapsManager 로컬 데이터 전달 완료:', papsManager.papsData);
                }
        } else {
            console.log('로컬 스토리지에 데이터 없음, 기본 데이터 사용');
            const defaultData = getDefaultData();
            leagueData = defaultData.leagues;
            tournamentData = defaultData.tournaments;
            papsData = defaultData.paps;
            progressClasses = defaultData.progress.classes;
            progressSelectedClassId = defaultData.progress.selectedClassId;
            
            // 테스트용 데이터 추가 (개발 중에만)
            if (progressClasses.length === 0) {
                console.log('테스트용 진도표 데이터 추가');
                progressClasses = [
                    {
                        id: 'test-class-1',
                        name: '1학년 1반',
                        teacherName: '김선생님',
                        unitContent: '체육 기초',
                        weeklyHours: 2,
                        schedule: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    }
                ];
                progressSelectedClassId = 'test-class-1';
                console.log('테스트 데이터 추가됨:', progressClasses);
            }
            
            // 각 매니저에 기본 데이터 전달
            if (leagueManager && leagueManagerInitialized) {
                console.log('LeagueManager에 기본 데이터 전달');
                leagueManager.leagueData = leagueData;
            }
            
            if (tournamentManager && tournamentManagerInitialized) {
                console.log('TournamentManager에 기본 데이터 전달');
                tournamentManager.tournamentData = tournamentData;
            }
            
            if (papsManager && papsManagerInitialized) {
                console.log('PapsManager에 기본 데이터 전달');
                papsManager.papsData = papsData;
                console.log('PapsManager 기본 데이터 전달 완료:', papsManager.papsData);
            }
        }
            } catch (error) {
        console.error('로컬 데이터 로딩 실패:', error);
        progressManager = null;
        progressManagerInitialized = false;
    }
}

function getDefaultData() {
    return {
        leagues: { classes: [] },
        tournaments: { tournaments: [] },
        paps: { classes: [], activeClassId: null },
        progress: { classes: [], selectedClassId: null }
    };
    }

    // ========================================
        // 데이터 저장
    // ========================================
async function saveDataToFirestore() {
    console.log('saveDataToFirestore 호출됨, dataManager:', dataManager);
    console.log('현재 사용자:', authManager?.currentUser);
    console.log('DataManager 현재 사용자:', dataManager?.currentUser);
    
    if (!dataManager || !dataManagerInitialized) {
        console.log('DataManager가 초기화되지 않음, 로컬 저장');
        saveToLocalStorage();
            return;
        }
        
    try {
        const data = {
            leagues: leagueData || { classes: [], students: [], games: [], selectedClassId: null },
            tournaments: tournamentData || { tournaments: [], activeTournamentId: null },
            paps: papsData || { classes: [], activeClassId: null },
            progress: {
                classes: progressClasses || [],
                selectedClassId: progressSelectedClassId || null
            },
            lastUpdated: Date.now()
        };
        
        console.log('=== 저장할 데이터 구조 검증 ===');
        console.log('leagues 구조:', {
            classes: data.leagues.classes?.length || 0,
            students: data.leagues.students?.length || 0,
            games: data.leagues.games?.length || 0,
            selectedClassId: data.leagues.selectedClassId
        });
        console.log('tournaments 구조:', {
            tournaments: data.tournaments.tournaments?.length || 0,
            activeTournamentId: data.tournaments.activeTournamentId
        });
        console.log('paps 구조:', {
            classes: data.paps.classes?.length || 0,
            activeClassId: data.paps.activeClassId
        });
        console.log('progress 구조:', {
            classes: data.progress.classes?.length || 0,
            selectedClassId: data.progress.selectedClassId
        });
        
        console.log('저장할 데이터:', data);
        await dataManager.saveDataToFirestore(data);
        console.log('Firestore 데이터 저장 성공');
        
        // 로컬 스토리지에도 백업 저장
        saveToLocalStorage();
    } catch (error) {
        console.error('Firestore 데이터 저장 실패:', error);
        // 실패 시 로컬 스토리지에 저장
        saveToLocalStorage();
    }
}

// ProgressManager 전용 데이터 저장 함수
async function saveProgressData() {
    console.log('=== saveProgressData 호출됨 ===');
    console.log('현재 progressClasses:', progressClasses);
    console.log('현재 progressSelectedClassId:', progressSelectedClassId);
    console.log('progressManager:', progressManager);
    console.log('progressManagerInitialized:', progressManagerInitialized);
    
    // ProgressManager에서 데이터 가져오기
    if (progressManager && progressManagerInitialized) {
        const managerClasses = progressManager.getClasses();
        const managerSelectedId = progressManager.getSelectedClassId();
        
        console.log('ProgressManager에서 가져온 데이터:');
        console.log('managerClasses:', managerClasses);
        console.log('managerSelectedId:', managerSelectedId);
        
        // 전역 변수 업데이트
        progressClasses = managerClasses;
        progressSelectedClassId = managerSelectedId;
        
        console.log('전역 변수 업데이트 후:');
            console.log('progressClasses:', progressClasses);
        console.log('progressSelectedClassId:', progressSelectedClassId);
    }
    
    // 데이터 저장
    await saveDataToFirestore();
}

function saveToLocalStorage() {
    try {
        const data = {
            leagues: leagueData,
            tournaments: tournamentData,
            paps: papsData,
            progress: {
                classes: progressClasses,
                selectedClassId: progressSelectedClassId
            },
            lastUpdated: Date.now()
        };
        
        localStorage.setItem('pe_helper_data', JSON.stringify(data));
        console.log('로컬 스토리지 저장 완료');
    } catch (error) {
        console.error('로컬 스토리지 저장 실패:', error);
    }
    }

    // ========================================
// UI 초기화
    // ========================================
function initializeUI() {
    console.log('UI 초기화 시작');
    
    // 모드 전환 버튼 이벤트 리스너
    setupModeButtons();
    
    // 로그인/로그아웃 버튼 이벤트 리스너
    setupAuthButtons();
    
    // 로그인 상태 UI 업데이트
    if (authManager && authManagerInitialized) {
        authManager.updateLoginStatus();
                                } else {
        // AuthManager가 초기화되지 않은 경우 기본적으로 로그인 화면 표시
        const authContainer = $('#auth-container');
        const appRoot = $('#app-root');
        if (authContainer && appRoot) {
            authContainer.classList.remove('hidden');
            appRoot.classList.add('hidden');
            console.log('AuthManager 미초기화, 로그인 화면 표시');
        }
    }
    
    // 초기 렌더링
        renderApp();
    
    console.log('UI 초기화 완료');
}

function setupModeButtons() {
    const modeButtons = $$('.mode-switch-btn');
    console.log('모드 버튼 수:', modeButtons.length);
    modeButtons.forEach(btn => {
        console.log('모드 버튼:', btn.dataset.mode);
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            console.log('모드 버튼 클릭됨:', mode);
            if (mode) {
                switchMode(mode);
            }
        });
    });
}

function setupAuthButtons() {
    const loginBtn = $('#loginBtn');
    const logoutBtn = $('#logoutBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (authManager && authManagerInitialized) {
                authManager.signInWithGoogle();
                                    } else {
                console.error('AuthManager가 초기화되지 않음');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (authManager && authManagerInitialized) {
                authManager.signOut();
                } else {
                console.error('AuthManager가 초기화되지 않음');
            }
        });
    }
    }
    
    // ========================================
// 모드 전환
    // ========================================
function switchMode(mode) {
    console.log('=== switchMode 호출됨 ===');
    console.log('요청된 모드:', mode);
    console.log('현재 appMode:', appMode);
    appMode = mode;
    window.appMode = appMode; // 전역 변수도 업데이트
    console.log('appMode 업데이트됨:', appMode);
    
    // body 클래스 업데이트 (CSS 스타일링을 위해)
    document.body.className = document.body.className.replace(/-\w+-mode/g, '');
    document.body.classList.add(`${mode}-mode`);
    
    // 버튼 활성화 상태 업데이트
    $$('.mode-switch-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // 실시간 순위표 버튼 표시/숨김 (리그전 모드에서만 표시)
    const liveRankingBtn = $('#liveRankingBtn');
    if (liveRankingBtn) {
        liveRankingBtn.classList.toggle('hidden', mode !== 'league');
    }
    
    // 앱 렌더링
    renderApp();
}
    
    // ========================================
// 앱 렌더링
    // ========================================
function renderApp() {
    console.log('앱 렌더링 시작, 모드:', appMode);
        
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
            console.log('LeagueManager 상태:', { leagueManager, leagueManagerInitialized });
            if (leagueManager && leagueManagerInitialized) {
                // LeagueManager에 최신 데이터 전달
                leagueManager.leagueData = leagueData;
                console.log('LeagueManager에 최신 데이터 전달:', leagueData);
                leagueManager.renderLeagueUI();
                } else {
                console.error('LeagueManager가 초기화되지 않음');
            }
        } else if (appMode === 'tournament') {
            console.log('토너먼트 UI 렌더링 시작');
            console.log('TournamentManager 상태:', { tournamentManager, tournamentManagerInitialized });
            if (tournamentManager && tournamentManagerInitialized) {
                // TournamentManager에 최신 데이터 전달
                tournamentManager.tournamentData = tournamentData;
                console.log('TournamentManager에 최신 데이터 전달:', tournamentData);
                tournamentManager.renderTournamentUI();
            } else {
                console.error('TournamentManager가 초기화되지 않음');
            }
        } else if (appMode === 'paps') {
            console.log('PAPS UI 렌더링 시작');
            console.log('PapsManager 상태:', { papsManager, papsManagerInitialized });
            if (papsManager && papsManagerInitialized) {
                // PapsManager에 최신 데이터 전달
                papsManager.papsData = papsData;
                console.log('PapsManager에 최신 데이터 전달:', papsData);
                console.log('PapsManager 데이터 구조 검증:', {
                    classes: papsData?.classes?.length || 0,
                    activeClassId: papsData?.activeClassId,
                    hasData: !!papsData
                });
                papsManager.renderPapsUI();
                } else {
                console.error('PapsManager가 초기화되지 않음');
            }
        } else if (appMode === 'progress') {
            console.log('진도표 UI 렌더링 시작');
        if (progressManager && progressManagerInitialized) {
            console.log('기존 ProgressManager 사용');
            progressManager.renderProgressUI();
        } else {
            console.log('ProgressManager 초기화 필요');
            try {
                progressManager = initializeProgressManager(
                    $,
                    $$,
                    saveProgressData
                );
                progressManagerInitialized = true;
                window.progressManager = progressManager;
                console.log('ProgressManager 지연 초기화 완료');
                // 데이터가 있는 경우에만 초기화
                if (progressClasses && progressClasses.length > 0) {
                    progressManager.initialize(progressClasses, progressSelectedClassId || null);
                    console.log('ProgressManager 데이터와 함께 지연 초기화 완료');
        } else {
                    progressManager.initialize([], null);
                    console.log('ProgressManager 빈 데이터로 지연 초기화 완료');
                }
                progressManager.renderProgressUI();
        } catch (error) {
                console.error('ProgressManager 지연 초기화 실패:', error);
            }
                }
            } else {
        console.log('알 수 없는 모드:', appMode);
    }
}


    // ========================================
    // 공유 링크 처리
    // ========================================
    async function handleSharedRanking(shareId) {
        try {
            console.log('공유된 순위표 로딩:', shareId);
            
            // Firebase에서 공유 데이터 가져오기
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('./firebase.js');
            
            const shareDoc = await getDoc(doc(db, 'sharedRankings', shareId));
            
            if (!shareDoc.exists()) {
                alert('공유된 순위표를 찾을 수 없습니다.');
                return;
            }
            
            const shareData = shareDoc.data();
            
            // 공유된 순위표 표시 모달 생성
            showSharedRankingModal(shareData);
            
        } catch (error) {
            console.error('공유된 순위표 로딩 실패:', error);
            alert('공유된 순위표를 불러오는데 실패했습니다.');
        }
    }
    
    function showSharedRankingModal(shareData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        // 순위표 HTML 생성
        let tableHtml = `
            <div style="background: white; padding: 24px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 style="margin: 0 0 16px 0; color: #333;">🏆 ${shareData.title}</h2>
                <p style="margin: 0 0 16px 0; color: #666;">${shareData.avgRecord}</p>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">순위</th>
                            <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">이름</th>
                            <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">기록</th>
                            <th style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center;">상위%</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        shareData.records.forEach((item, index) => {
            const rank = index + 1;
            const percentile = ((rank - 1) / shareData.records.length * 100).toFixed(1);
            const isPersonal = shareData.personalName && item.name === shareData.personalName;
            const rowStyle = isPersonal ? 'background-color: #fff3cd;' : '';
            
            tableHtml += `
                <tr style="${rowStyle}">
                    <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: #007bff;">${rank}</td>
                    <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: 500;">${item.name}</td>
                    <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: #28a745;">${item.record}</td>
                    <td style="padding: 12px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: #6f42c1;">${percentile}%</td>
                </tr>
            `;
        });
        
        tableHtml += `
                    </tbody>
                </table>
                <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; margin: 16px 0;">
                    <small style="color: #666;">
                        공유 생성일: ${new Date(shareData.createdAt).toLocaleString()}<br>
                        마지막 업데이트: ${new Date(shareData.lastUpdated).toLocaleString()}
                    </small>
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="close-shared-modal" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">닫기</button>
                </div>
            </div>
        `;
        
        modal.innerHTML = tableHtml;
        document.body.appendChild(modal);
        
        // 모달 닫기
        const closeBtn = modal.querySelector('#close-shared-modal');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // 배경 클릭 시 모달 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // ========================================
// 앱 시작
    // ========================================
    document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM 로드 완료, 앱 초기화 시작');
    
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');
    
    if (shareId) {
        // 공유된 순위표 표시
        await handleSharedRanking(shareId);
    } else {
        // 일반 앱 초기화
        await initialize_app();
    }
});
    
// 전역 함수로 등록
window.switchMode = switchMode;
window.saveDataToFirestore = saveDataToFirestore;
window.appMode = appMode;
window.$ = $; // $ 함수도 전역으로 등록
window.$$ = $$; // $$ 함수도 전역으로 등록
    
    // 안전한 모달 닫기 함수
    window.closeModal = function() {
        try {
            // 모달이 열려있는지 확인하고 닫기
            const modal = document.querySelector('.modal-overlay, .modal, [class*="modal"]');
            if (modal) {
                modal.style.display = 'none';
                modal.remove();
            }
            console.log('모달이 안전하게 닫혔습니다.');
                        } catch (error) {
            console.log('모달 닫기 중 오류:', error);
        }
    };