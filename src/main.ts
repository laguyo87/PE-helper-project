/**
 * 앱 진입점
 * 
 * 이 파일은 앱의 진입점으로, 모든 모듈을 초기화하고 앱을 시작합니다.
 * 
 * @author 김신회
 * @version 2.2.1
 * @since 2024-01-01
 */

import { createAppInitializer } from './modules/appInitializer.js';
import { createAppStateManager } from './modules/appStateManager.js';
import { createDataSyncService } from './modules/dataSyncService.js';
import { createUIRenderer } from './modules/uiRenderer.js';
import { createShareManager } from './modules/shareManager.js';
import { getAppContext, initializeAppContext, AppContext } from './modules/appContext.js';
import { createGlobalBridge } from './modules/globalBridge.js';
import { createInitializationChain } from './modules/initializationChain.js';
import { $, $$, cleanupSidebar, checkVersion, getDefaultData } from './modules/utils.js';

// ========================================
// 앱 초기화
// ========================================

/**
 * 앱을 초기화합니다.
 * Promise 기반 초기화 체인을 사용합니다.
 */
async function initialize_app(): Promise<void> {
  console.log('=== 앱 초기화 시작 ===');
  
  try {
    // AppContext 초기화
    const context = initializeAppContext({});

    // 1. AppStateManager 초기화
    context.appStateManager = createAppStateManager(getDefaultData(), {
      autoSave: true,
      saveCallback: async () => {
        if (context.dataSyncService) {
          await context.dataSyncService.saveToFirestore();
        }
      },
      onChangeCallbacks: {
        leagues: (s) => {
          if (context.leagueManager) {
            context.leagueManager.setLeagueData(s);
          }
        },
        tournaments: (s) => {
          if (context.tournamentManager) {
            context.tournamentManager.setTournamentData(s);
          }
        },
        paps: (s) => {
          if (context.papsManager) {
            context.papsManager.setPapsData(s);
          }
        },
        progress: (s) => {
          if (context.progressManager) {
            // 재초기화 대신 데이터만 업데이트 (무한 루프 방지)
            context.progressManager.updateProgressData(s.classes, s.selectedClassId);
          }
        }
      }
    });

    // 2. 데이터 로드/저장 래퍼 함수들
    const saveDataToFirestore = async (): Promise<void> => {
      await context.dataSyncService?.saveToFirestore();
    };

    const saveProgressData = async (): Promise<void> => {
      if (context.progressManager && context.appStateManager) {
        const classes = context.progressManager.getClasses();
        const selectedClassId = context.progressManager.getSelectedClassId();
        
        console.log('[saveProgressData] 저장 시작', { 
          classesCount: classes.length, 
          selectedClassId 
        });
        
        context.appStateManager.setProgress({
          classes: classes,
          selectedClassId: selectedClassId
        });
        
        console.log('[saveProgressData] setProgress 완료, saveImmediate 호출');
        await context.appStateManager.saveImmediate();
        console.log('[saveProgressData] saveImmediate 완료');
      } else {
        console.warn('[saveProgressData] ProgressManager 또는 AppStateManager가 초기화되지 않음', {
          hasProgressManager: !!context.progressManager,
          hasAppStateManager: !!context.appStateManager
        });
      }
    };

    const switchMode = (mode: string): void => {
      context.uiRenderer?.switchMode(mode);
    };

    // loadDataFromFirestore 함수를 정의 (globalBridge는 나중에 설정)
    let loadDataFromFirestore: () => Promise<void>;
    let globalBridgeRef: ReturnType<typeof createGlobalBridge> | null = null;
    
    loadDataFromFirestore = async (): Promise<void> => {
      console.log('=== loadDataFromFirestore 호출됨 (로그인 후 데이터 재로드) ===');
      console.log('context 상태:', {
        hasDataSyncService: !!context.dataSyncService,
        hasDataManager: !!context.dataManager,
        hasAppStateManager: !!context.appStateManager,
        hasLeagueManager: !!context.leagueManager,
        hasTournamentManager: !!context.tournamentManager,
        hasPapsManager: !!context.papsManager,
        hasProgressManager: !!context.progressManager,
        hasUIRenderer: !!context.uiRenderer
      });
      
      // DataSyncService가 아직 생성되지 않았으면 나중에 호출
      if (!context.dataSyncService) {
        console.warn('DataSyncService가 아직 초기화되지 않음, 데이터 로드는 나중에 수행됩니다.');
        return;
      }
      
      // DataManager가 초기화되지 않았으면 DataSyncService에 설정
      if (context.dataSyncService && context.dataManager && !(context.dataSyncService as any).dataManager) {
        console.log('DataManager를 DataSyncService에 설정 중...');
        context.dataSyncService.setDataManager(context.dataManager);
      }
      
      if (context.dataSyncService && context.authManager && !(context.dataSyncService as any).authManager) {
        console.log('AuthManager를 DataSyncService에 설정 중...');
        context.dataSyncService.setAuthManager(context.authManager);
      }
      
      try {
        // Firestore에서 데이터 로드
        console.log('DataSyncService.loadFromFirestore 호출 시작...');
        const result = await context.dataSyncService.loadFromFirestore();
        console.log('데이터 로드 결과:', result);
        
        if (result.success) {
          // 데이터 로드 후 Manager들에 데이터 전달
          if (!context.appStateManager) {
            console.warn('AppStateManager가 초기화되지 않음');
            return;
          }
          
          const state = context.appStateManager.getState();
          
          // LeagueManager에 데이터 전달
          if (context.leagueManager) {
            context.leagueManager.setLeagueData(state.leagues);
            console.log('LeagueManager에 데이터 전달 완료');
          }
          
          // TournamentManager에 데이터 전달
          if (context.tournamentManager) {
            context.tournamentManager.setTournamentData(state.tournaments);
            console.log('TournamentManager에 데이터 전달 완료');
          }
          
          // PapsManager에 데이터 전달
          if (context.papsManager) {
            context.papsManager.setPapsData(state.paps);
            console.log('PapsManager에 데이터 전달 완료');
          }
          
          // ProgressManager에 데이터 전달
          if (context.progressManager) {
            context.progressManager.updateProgressData(state.progress.classes, state.progress.selectedClassId);
            console.log('ProgressManager에 데이터 전달 완료');
          }
          
          // UIRenderer의 Manager 참조 업데이트
          if (context.uiRenderer) {
            context.uiRenderer.updateManagers({
              leagueManager: context.leagueManager ?? undefined,
              tournamentManager: context.tournamentManager ?? undefined,
              papsManager: context.papsManager ?? undefined,
              progressManager: context.progressManager ?? undefined
            });
            console.log('UIRenderer Manager 참조 업데이트 완료');
          }
          
          // GlobalBridge 재등록 (Manager 참조 업데이트)
          if (globalBridgeRef) {
            globalBridgeRef.registerAll();
            console.log('GlobalBridge 재등록 완료');
          }
          
          // 현재 모드로 UI 다시 렌더링
          if (context.uiRenderer) {
            // UIRenderer의 getMode 메서드 사용
            const currentMode = context.uiRenderer.getMode?.() || 'progress';
            console.log('현재 모드로 UI 다시 렌더링:', currentMode);
            context.uiRenderer.renderApp();
          }
          
          console.log('데이터 재로드 및 UI 업데이트 완료');
        } else {
          console.warn('데이터 로드 실패:', result);
        }
      } catch (error) {
        console.error('데이터 재로드 중 오류:', error);
      }
    };

    const initializeUI = (): void => {
      context.uiRenderer?.initializeUI();
    };

    // 3. AppInitializer 초기화
    context.appInitializer = createAppInitializer({
      $: (s: string) => $(s),
      $$,
      checkVersion,
      loadDataFromFirestore,
      saveDataToFirestore,
      saveProgressData,
      cleanupSidebar,
      initializeUI
    });

    // 4. DataSyncService 초기화 (Manager 초기화 전에 준비)
    // 실제 초기화는 체인에서 수행
    context.dataSyncService = createDataSyncService({
      dataManager: null, // 나중에 설정
      authManager: null, // 나중에 설정
      stateManager: context.appStateManager,
      storageKey: 'pe_helper_data',
      getDefaultData
    });

    // 5. UIRenderer 초기화 (Manager 초기화 전에 준비)
    // 실제 초기화는 체인에서 수행
    context.uiRenderer = createUIRenderer({
      stateManager: context.appStateManager,
      managers: {}, // 나중에 설정
      $,
      $$
    });

    // 6. ShareManager 초기화
    context.shareManager = createShareManager({
      firebaseDb: typeof window !== 'undefined' ? (window as any).firebase?.db : undefined,
      $
    });

    // 7. GlobalBridge 초기화
    globalBridgeRef = createGlobalBridge({
      context,
      $,
      $$,
      switchMode,
      saveDataToFirestore
    });
    const globalBridge = globalBridgeRef;

    // 8. Promise 기반 초기화 체인 실행
    const initializationChain = createInitializationChain({
      context,
      stateManager: context.appStateManager,
      dataSyncService: context.dataSyncService,
      uiRenderer: context.uiRenderer,
      shareManager: context.shareManager,
      globalBridge,
      $,
      $$,
      onProgress: (result) => {
        console.log(`[초기화 진행] ${result.step}: ${result.success ? '✅' : '❌'}`);
        if (result.error) {
          console.error(`[초기화 오류] ${result.step}:`, result.error);
        }
      },
      onError: (error, step) => {
        console.error(`[초기화 실패] 단계: ${step}`, error);
      }
    });

    // 체인 실행 (체인 내에서 Manager 참조 업데이트를 처리함)
    const results = await initializationChain.execute();

    // Managers가 제대로 설정되었는지 확인
    console.log('Manager 초기화 확인:', {
      league: !!context.leagueManager,
      tournament: !!context.tournamentManager,
      paps: !!context.papsManager,
      progress: !!context.progressManager
    });

    // UIRenderer의 Manager 참조 업데이트 (체인에서 이미 초기화했지만 참조만 업데이트)
    // UIRenderer는 readonly이므로 재생성 필요
    if (context.uiRenderer) {
      context.uiRenderer = createUIRenderer({
        stateManager: context.appStateManager,
        managers: {
          leagueManager: context.leagueManager ?? undefined,
          tournamentManager: context.tournamentManager ?? undefined,
          papsManager: context.papsManager ?? undefined,
          progressManager: context.progressManager ?? undefined,
          authManager: context.authManager ?? undefined
        },
        $,
        $$
      });
      context.uiRenderer.initializeUI();
      
      // 초기 모드로 렌더링 시작 (progress 모드가 기본값)
      console.log('초기 화면 렌더링 시작...');
      context.uiRenderer.setMode('progress');
      context.uiRenderer.renderApp();
      console.log('초기 화면 렌더링 완료');
    }

    // GlobalBridge 등록 (Manager 참조 업데이트 후) - window.leagueManager도 여기서 등록됨
    globalBridge.registerAll();
    
    // window.leagueManager 등록 확인
    if (context.leagueManager) {
      (window as any).leagueManager = context.leagueManager;
      console.log('window.leagueManager 등록 확인:', typeof (window as any).leagueManager?.createClass);
    } else {
      console.warn('⚠️ context.leagueManager가 없어서 window.leagueManager를 등록할 수 없습니다.');
    }

    // 초기화 결과 확인
    const failedSteps = results.filter(r => !r.success && r.step !== 'data-load'); // data-load 실패는 치명적이지 않음
    if (failedSteps.length > 0) {
      console.warn('일부 초기화 단계가 실패했습니다:', failedSteps.map(r => r.step));
    }

    console.log('=== 앱 초기화 완료 ===');
    console.log(`초기화 단계 결과: ${results.filter(r => r.success).length}/${results.length} 성공`);
  } catch (error) {
    console.error('앱 초기화 중 오류:', error);
    throw error;
  }
}

// ========================================
// 공유 링크 처리
// ========================================

/**
 * 공유된 순위표를 처리합니다.
 * @param shareId 공유 ID
 */
async function handleSharedRanking(shareId: string): Promise<void> {
  const context = getAppContext();
  if (context.shareManager) {
    await context.shareManager.handleSharedRanking(shareId);
  } else {
    const sm = createShareManager({
      firebaseDb: typeof window !== 'undefined' ? (window as any).firebase?.db : undefined,
      $
    });
    await sm.handleSharedRanking(shareId);
  }
}

// ========================================
// 앱 시작
// ========================================

/**
 * Firebase가 준비될 때까지 기다립니다.
 */
async function waitForFirebase(timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).firebase && (window as any).firebase.db) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('firebaseReady', handler);
      console.warn('[main] Firebase 초기화 대기 시간 초과');
      resolve(false);
    }, timeout);

    const handler = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('firebaseReady', handler);
      resolve(true);
    };

    window.addEventListener('firebaseReady', handler, { once: true });
  });
}

// DOMContentLoaded 이벤트 핸들러 (이미 발생했으면 즉시 실행)
async function initMain() {
  console.log('[main] 앱 초기화 시작');
  console.log('[main] 현재 URL:', window.location.href);
  console.log('[main] DOM 상태:', document.readyState);
  
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('share');
  const papsShareId = urlParams.get('paps');
  
  console.log('[main] URL 파라미터 확인:', { shareId, papsShareId });
  
  if (papsShareId) {
    console.log('[main] PAPS 공유 링크 처리 시작, shareId:', papsShareId);
    
    // 일반 앱 UI 숨기기 (학생 기록 조회 화면만 표시)
    const appContainer = document.querySelector('#app') as HTMLElement;
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    const contentWrapper = document.querySelector('#content-wrapper') as HTMLElement;
    
    if (appContainer) appContainer.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (contentWrapper) contentWrapper.style.display = 'none';
    
    // body 배경을 흰색으로 설정
    document.body.style.background = '#ffffff';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // PAPS 개별 학생 공유 링크 처리
    // Firebase 초기화 대기
    console.log('[main] Firebase 초기화 대기 시작');
    const firebaseReady = await waitForFirebase();
    console.log('[main] Firebase 초기화 대기 완료, ready:', firebaseReady);
    
    if (!firebaseReady) {
      console.error('[main] Firebase 초기화 실패 - PAPS 공유 링크 처리 불가');
      alert('Firebase 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
      return;
    }

    console.log('[main] Firebase 초기화 확인 완료, ShareManager 생성 시작');
    try {
      // 이미 import된 createShareManager 사용 (동적 import 대신)
      console.log('[main] ShareManager 모듈 사용 (이미 로드됨)');
      
      const sm = createShareManager({
        firebaseDb: typeof window !== 'undefined' ? (window as any).firebase?.db : undefined,
        $: (selector: string) => document.querySelector(selector)
      });
      console.log('[main] ShareManager 인스턴스 생성 완료');
      
      console.log('[main] handleSharedPapsStudent 호출 시작');
      await sm.handleSharedPapsStudent(papsShareId);
      console.log('[main] handleSharedPapsStudent 호출 완료');
    } catch (error: any) {
      console.error('[main] PAPS 공유 링크 처리 실패:', error);
      console.error('[main] 에러 상세:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      alert(`개인 기록을 불러오는데 실패했습니다.\n에러: ${error?.message || '알 수 없는 오류'}\nQR 코드를 다시 확인해주세요.`);
    }
  } else if (shareId) {
    console.log('[main] 공유 순위표 링크 처리 시작');
    await handleSharedRanking(shareId);
  } else {
    console.log('[main] 일반 앱 초기화 시작');
    await initialize_app();
  }
}

// DOMContentLoaded가 이미 발생했는지 확인하고 적절히 실행
if (document.readyState === 'loading') {
  // 아직 로딩 중이면 이벤트 리스너 등록
  document.addEventListener('DOMContentLoaded', initMain);
} else {
  // 이미 로드되었으면 즉시 실행
  initMain();
}

