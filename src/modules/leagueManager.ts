/**
 * 리그전 수업 관리 모듈
 * 
 * 이 모듈은 리그전 수업의 모든 기능을 관리합니다.
 * 반(팀) 생성/삭제, 학생 관리, 경기 일정 생성, 점수 관리, 순위표 등을 담당합니다.
 * 
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */

import { DataManager } from './dataManager.js';
import { validateData, LeagueClassSchema, LeagueStudentSchema, LeagueGameSchema } from './validators.js';
import { showError, showSuccess } from './errorHandler.js';
import { setInnerHTMLSafe } from './utils.js';
import { logger, logInfo, logWarn, logError } from './logger.js';

// ========================================
// 타입 정의
// ========================================

/**
 * 리그전 클래스(반/팀) 데이터 구조
 */
export interface LeagueClass {
    id: number;
    name: string;
    note: string;
}

/**
 * 리그전 학생 데이터 구조
 */
export interface LeagueStudent {
    id: number;
    name: string;
    classId: number;
    note: string;
}

/**
 * 리그전 경기 데이터 구조
 */
export interface LeagueGame {
    id: number;
    classId: number;
    player1Id: number;
    player2Id: number;
    player1Score: number | null;
    player2Score: number | null;
    isCompleted: boolean;
    completedAt: number | null;
    note: string;
    isHighlighted: boolean;
}

/**
 * 리그전 데이터 구조
 */
export interface LeagueData {
    classes: LeagueClass[];
    students: LeagueStudent[];
    games: LeagueGame[];
    selectedClassId: number | null;
}

/**
 * 순위 데이터 구조
 */
export interface RankingData {
    name: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
    gamesPlayed: number;
    rank?: number;
}

/**
 * 게임 통계 데이터 구조
 */
export interface GameStats {
    totalGames: number;
    completedGames: number;
    remainingGames: number;
    completionRate: number;
}

/**
 * 리그전 관리 옵션
 */
export interface LeagueManagerOptions {
    enableAutoSave?: boolean;
    enableGameStats?: boolean;
    enableRankings?: boolean;
    maxStudentsPerClass?: number;
}

// ========================================
// LeagueManager 클래스
// ========================================

/**
 * 리그전 수업을 관리하는 클래스
 */
export class LeagueManager {
    private leagueData: LeagueData;
    private options: LeagueManagerOptions;
    private dataManager: DataManager | null = null; // DataManager 인스턴스
    private saveCallback: (() => Promise<void>) | null = null;
    private dataUpdateCallback: ((data: LeagueData) => void) | null = null;
    

    /**
     * LeagueManager 인스턴스를 생성합니다.
     * @param leagueData 리그전 데이터
     * @param options 리그전 관리 옵션
     */
    constructor(leagueData: LeagueData, options: LeagueManagerOptions = {}) {
        this.leagueData = leagueData;
        this.options = {
            enableAutoSave: true,
            enableGameStats: true,
            enableRankings: true,
            maxStudentsPerClass: 50,
            ...options
        };
    }

    /**
     * DataManager 인스턴스를 설정합니다.
     * @param dataManager DataManager 인스턴스
     */
    public setDataManager(dataManager: DataManager): void {
        this.dataManager = dataManager;
    }

    /**
     * 저장 콜백을 설정합니다.
     * @param callback 저장 콜백 함수
     */
    public setSaveCallback(callback: () => Promise<void>): void {
        this.saveCallback = callback;
    }

    /**
     * 데이터 업데이트 콜백을 설정합니다.
     * @param callback 데이터 업데이트 콜백 함수
     */
    public setDataUpdateCallback(callback: (data: LeagueData) => void): void {
        this.dataUpdateCallback = callback;
    }

    /**
     * 데이터를 저장합니다.
     */
    private async saveData(): Promise<void> {
        // 데이터 업데이트 콜백 호출
        if (this.dataUpdateCallback) {
            this.dataUpdateCallback(this.leagueData);
        }
        
        if (this.saveCallback) {
            await this.saveCallback();
        }
    }

    /**
     * 리그전 UI를 렌더링합니다.
     */
    public renderLeagueUI(): void {
        logger.debug('=== LeagueManager.renderLeagueUI() 시작 ===');
        this.log('renderLeagueUI 시작');
        this.log('leagueData.classes.length:', this.leagueData.classes.length);
        this.log('leagueData:', this.leagueData);
        
        try {
            // 기존 요소들 정리
            this.cleanupSidebar();
            logger.debug('사이드바 정리 완료');
            
            const sidebarTitle = this.getElement('#sidebarTitle');
            logger.debug('sidebarTitle 요소:', sidebarTitle);
            if (sidebarTitle) {
                sidebarTitle.textContent = '리그전 목록';
                logger.debug('사이드바 제목 설정 완료');
            } else {
                logError('❌ sidebarTitle 요소를 찾을 수 없음');
            }
        
        const isFirstTimeUser = this.leagueData.classes.length === 0;
        this.log('isFirstTimeUser:', isFirstTimeUser);
        
        const formHtml = `
            <div style="position: relative;" class="${isFirstTimeUser ? 'intro-container-active' : ''}">
                <div class="sidebar-form-group ${isFirstTimeUser ? 'intro-highlight' : ''}">
                    <input id="className" type="text" placeholder="새로운 반(팀) 이름">
                    <button id="createLeagueClassBtn" class="btn primary" data-tooltip="새로운 리그를 목록에 추가합니다.">
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
        
            const formContainer = this.getElement('#sidebar-form-container');
            logger.debug('formContainer 요소:', formContainer);
            if (formContainer) {
                setInnerHTMLSafe(formContainer, formHtml);
                logger.debug('폼 HTML 설정 완료');
                
                // 버튼에 이벤트 리스너 직접 추가 (onclick이 제대로 작동하지 않을 수 있으므로)
                // setInnerHTMLSafe 이후 requestAnimationFrame으로 DOM 업데이트 대기
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                    const createBtn = this.getElement('#createLeagueClassBtn');
                    if (createBtn) {
                        // 기존 리스너 제거 (중복 방지)
                        const newBtn = createBtn.cloneNode(true);
                        createBtn.parentNode?.replaceChild(newBtn, createBtn);
                        
                        (newBtn as HTMLElement).addEventListener('click', () => {
                            this.log('createLeagueClassBtn 클릭 이벤트 발생');
                            if (typeof (window as any).leagueManager?.createClass === 'function') {
                                this.log('window.leagueManager.createClass 호출');
                                (window as any).leagueManager.createClass();
                            } else {
                                this.log('❌ window.leagueManager.createClass가 함수가 아님:', typeof (window as any).leagueManager?.createClass);
                                // 직접 호출
                                this.createClass();
                            }
                        });
                        logger.debug('createLeagueClassBtn 이벤트 리스너 등록 완료');
                    } else {
                        logError('❌ createLeagueClassBtn 요소를 찾을 수 없음');
                    }
                    });
                });
            } else {
                logError('❌ sidebar-form-container 요소를 찾을 수 없음');
            }

            
            // Progress 모드 전용 엑셀 버튼 제거
            const progressExcelActions = document.querySelector('.progress-excel-actions');
            if (progressExcelActions) {
                progressExcelActions.remove();
            }
            
            const papsExcelActions = document.querySelector('.paps-excel-actions');
            if (papsExcelActions) {
                papsExcelActions.remove();
            }
            
            // sidebar-list-container가 Progress 모드에서 숨겨졌을 수 있으므로 다시 표시
            // CSS의 !important를 override하기 위해 setProperty 사용
            const sidebarListContainer = this.getElement('#sidebar-list-container');
            if (sidebarListContainer) {
                // 즉시 표시
                sidebarListContainer.style.setProperty('display', 'flex', 'important');
                
                // requestAnimationFrame으로 다시 확인 (모드 전환 후 CSS가 재적용될 수 있음)
                requestAnimationFrame(() => {
                    const el = this.getElement('#sidebar-list-container');
                    if (el && !document.body.classList.contains('progress-mode')) {
                        el.style.setProperty('display', 'flex', 'important');
                    }
                });
            }
            
            // 사이드바 맨 아래에 엑셀 버튼 추가 (리그전 모드 전용)
            // 기존 버튼 영역이 있으면 제거
            const existingActions = document.querySelector('.league-excel-actions');
            if (existingActions) {
                existingActions.remove();
            }
            
            // 사이드바 컨테이너 찾기 (aside 요소)
            const sidebar = this.getElement('aside');
            if (sidebar) {
                // 버튼 영역 생성
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'league-excel-actions';
                actionsDiv.style.cssText = 'border-top: 1px solid var(--line); padding-top: 16px; padding-bottom: 16px; display: flex; flex-direction: column; gap: 8px;';
                actionsDiv.innerHTML = `
                    <button id="exportAllLeaguesBtn" class="btn" style="background:var(--win); color:white; width:100%;" aria-label="모든 반의 경기 기록을 엑셀 파일로 내보내기">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m11.5 16.5-3-3 3-3"/><path d="m8.5 13.5 7 .01"/></svg>
                        모든 반 경기 기록 엑셀로 내보내기
                    </button>
                    <label for="importAllLeaguesExcel" class="btn" style="width:100%;" aria-label="엑셀 파일에서 모든 반의 경기 기록을 가져오기">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m11.5 10.5 3 3-3 3"/><path d="m8.5 13.5-7 .01"/></svg>
                        모든 반 경기 기록 엑셀에서 가져오기
                    </label>
                <input type="file" id="importAllLeaguesExcel" accept=".xlsx, .xls" class="hidden" aria-label="엑셀 파일 선택" />
                  `;
                
                // sidebar-footer 바로 앞에 삽입 (사이드바 맨 아래)
                const sidebarFooter = this.getElement('.sidebar-footer');
                if (sidebarFooter && sidebarFooter.parentNode) {
                    sidebarFooter.parentNode.insertBefore(actionsDiv, sidebarFooter);
                } else {
                    // sidebar-footer가 없으면 사이드바 맨 끝에 추가
                    sidebar.appendChild(actionsDiv);
                }
                
                // 버튼 이벤트 리스너 추가
                const exportBtn = this.getElement('#exportAllLeaguesBtn');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => this.exportAllLeaguesToExcel());
                }
                
                // 엑셀 파일 가져오기 이벤트 리스너 추가
                const importInput = this.getElement('#importAllLeaguesExcel') as HTMLInputElement;
                if (importInput) {
                    importInput.addEventListener('change', (e) => this.handleAllLeaguesExcelUpload(e));
                }
            }
            
            this.renderClassList();
            logger.debug('반 목록 렌더링 완료');
            
            const selectedClass = this.leagueData.classes.find(c => c.id === this.leagueData.selectedClassId);
            logger.debug('선택된 반:', selectedClass);
            if (selectedClass) {
                logger.debug('대시보드 렌더링 시작...');
                this.renderLeagueDashboard(selectedClass);
                logger.debug('대시보드 렌더링 완료');
            } else {
                this.log('리그 데이터가 없음, 플레이스홀더 표시');
                const contentWrapper = this.getElement('#content-wrapper');
                logger.debug('contentWrapper 요소:', contentWrapper);
                if (contentWrapper) {
                    const placeholderHtml = `
                        <div class="placeholder-view">
                            <div class="placeholder-content">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <h3>반을 선택하여 시작하세요</h3>
                                <p>왼쪽에서 반을 선택하거나 새로 만들어주세요.</p>
                            </div>
                        </div>
                    `;
                    setInnerHTMLSafe(contentWrapper, placeholderHtml);
                    logger.debug('플레이스홀더 표시 완료');
                } else {
                    logError('❌ content-wrapper 요소를 찾을 수 없음');
                }
            }
            
            logger.debug('=== LeagueManager.renderLeagueUI() 완료 ===');
        } catch (error) {
            logError('❌ LeagueManager.renderLeagueUI() 오류:', error);
            throw error;
        }
    }

    /**
     * 반 목록을 렌더링합니다.
     */
    public renderClassList(): void {
        this.log('renderClassList 호출됨');
        const classList = this.getElement('#sidebar-list-container');
        if (!classList) {
            this.logError('sidebar-list-container 요소를 찾을 수 없음');
            return;
        }

        const html = this.leagueData.classes.map(c => {
            const isActive = String(c.id) === String(this.leagueData.selectedClassId) ? 'active' : '';
            const hasNote = (c.note || '').trim() ? 'has-note' : '';
            const studentCount = this.leagueData.students.filter(s => s.classId === c.id).length;
            return `<div class="list-card ${isActive}" data-class-id="${c.id}">
                <div style="flex-grow: 1;">
                    <div class="name">${c.name}</div>
                    <div class="details">${studentCount}명</div>
                </div>
                <div class="action-buttons row">
                    <button class="${hasNote}" data-action="edit-note" data-class-id="${c.id}" data-tooltip="메모"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                    <button data-action="edit-name" data-class-id="${c.id}" data-tooltip="수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button data-action="delete" data-class-id="${c.id}" data-tooltip="삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            </div>`;
        }).join('');
        
        setInnerHTMLSafe(classList, html);
        
        // 이벤트 리스너 등록 (onclick이 제대로 작동하지 않을 수 있으므로)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
            const cards = classList.querySelectorAll('.list-card');
            cards.forEach(card => {
                const classId = card.getAttribute('data-class-id');
                if (!classId) return;
                
                // 카드 클릭 시 반 선택
                card.addEventListener('click', (e) => {
                    // 버튼 클릭이 아닌 경우에만 반 선택
                    if ((e.target as HTMLElement).closest('button')) {
                        return;
                    }
                    this.selectClass(parseInt(classId));
                });
                
                // 메모 버튼
                const editNoteBtn = card.querySelector('[data-action="edit-note"]');
                if (editNoteBtn) {
                    editNoteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof (window as any).editClassNote === 'function') {
                            (window as any).editClassNote(parseInt(classId));
                        } else {
                            this.log('❌ editClassNote 함수를 찾을 수 없음');
                        }
                    });
                }
                
                // 수정 버튼
                const editNameBtn = card.querySelector('[data-action="edit-name"]');
                if (editNameBtn) {
                    editNameBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof (window as any).editClassName === 'function') {
                            (window as any).editClassName(parseInt(classId));
                        } else {
                            this.log('❌ editClassName 함수를 찾을 수 없음');
                        }
                    });
                }
                
                // 삭제 버튼
                const deleteBtn = card.querySelector('[data-action="delete"]');
                if (deleteBtn) {
                    // 기존 리스너 제거 (중복 방지)
                    const newDeleteBtn = deleteBtn.cloneNode(true);
                    deleteBtn.parentNode?.replaceChild(newDeleteBtn, deleteBtn);
                    
                    (newDeleteBtn as HTMLElement).addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        
                        const btnClassId = (newDeleteBtn as HTMLElement).getAttribute('data-class-id');
                        this.log('삭제 버튼 클릭, classId:', btnClassId || classId);
                        
                        // ID를 숫자로 변환
                        const numericId = parseInt(btnClassId || classId, 10);
                        
                        if (isNaN(numericId)) {
                            this.log('❌ 잘못된 ID:', btnClassId || classId);
                            showError(new Error('잘못된 반 ID입니다.'));
                            return;
                        }
                        
                        // window.deleteClass가 있으면 사용, 없으면 직접 호출
                        if (typeof (window as any).deleteClass === 'function') {
                            this.log('window.deleteClass 호출, ID:', numericId);
                            (window as any).deleteClass(numericId);
                        } else {
                            this.log('window.deleteClass가 없음, 직접 호출, ID:', numericId);
                            this.deleteClass(numericId);
                        }
                    });
                }
            });
            
            this.log('반 목록 이벤트 리스너 등록 완료, 카드 수:', cards.length);
            });
        });
    }

    /**
     * 리그전 대시보드를 렌더링합니다.
     * @param selectedClass 선택된 반
     */
    public renderLeagueDashboard(selectedClass: LeagueClass): void {
        this.log('renderLeagueDashboard 호출됨, selectedClass:', selectedClass);
        const contentWrapper = this.getElement('#content-wrapper');
        if (!contentWrapper) {
            this.logError('content-wrapper 요소를 찾을 수 없음');
            return;
        }

        const htmlContent = `
            <h2>${selectedClass.name} - 참가자 관리</h2>
            <section class="section-box">
                <div class="row" style="align-items: flex-end;">
                    <div class="field" style="flex-grow:1; margin-bottom: 0;">
                         <label>신규 선수 추가</label>
                        <input id="studentName" type="text" placeholder="학생 이름 입력 후 엔터">
                    </div>
                    <button class="btn primary" onclick="window.leagueManager.addStudent()" data-tooltip="입력한 학생을 목록에 추가합니다."><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>추가</button>
                    <button class="btn" onclick="window.leagueManager.bulkAddStudents()" data-tooltip="쉼표로 구분된 여러 학생을 한번에 추가합니다."><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>일괄 추가</button>
                    <button class="btn" onclick="window.leagueManager.sortStudentsByName()" data-tooltip="학생 목록을 가나다 순으로 정렬합니다."><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>가나다 순 정렬</button>
                </div>
                <div id="studentListGrid" class="student-list-grid" style="margin-top: 1rem;"></div>
            </section>
            
            <div class="schedule-header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="row">
                     <h2 class="schedule-title">경기 일정</h2>
                     <div id="gameStatsContainer"></div>
                  </div>
                  <div class="row">
                    <button class="btn" onclick="window.shareView('league', 'schedule')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        일정 공유
                    </button>
                    <button class="btn" onclick="window.shareAllClassesSchedule()" data-tooltip="모든 반의 일정을 하나의 페이지에서 공유합니다">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        모든 반 일정 공유
                    </button>
                    <button class="btn" onclick="window.clearAllHighlights()" data-tooltip="모든 강조 표시를 해제합니다."><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 5-8 8"/><path d="m12 19 8-8"/><path d="M20 13a2.5 2.5 0 0 0-3.54-3.54l-8.37 8.37A2.5 2.5 0 0 0 9.46 20l8.37-8.37a2.5 2.5 0 0 0 2.17-6.38Z"/></svg>모든 강조 해제</button>
                    <button id="generateGamesBtn" class="btn" onclick="window.leagueManager.generateGames()" style="background:var(--win); color:white;" data-tooltip="현재 학생 명단으로 새 경기 일정을 생성합니다."><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>일정 생성</button>
                  </div>
                </div>
            </div>
            <div id="gamesTableContainer" style="margin: 0 -24px; padding: 0 24px;">
                <div class="paps-table-wrap">
                    <div id="gamesTableContent"></div>
                </div>
            </div>
            
             <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>순위표</h2>
                <div class="row">
                    <button class="btn" onclick="window.shareView('league', 'standings')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                        공유
                    </button>
                    <button class="btn" onclick="window.printRankings()" data-tooltip="현재 순위표를 인쇄합니다.">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        순위표 인쇄
                    </button>
                </div>
            </div>
            <div id="rankingsTableContainer" class="section-box" style="margin: 0 -24px; padding: 0 24px; overflow-x:auto;"></div>
        `;
        
        this.log('HTML 생성 완료, 길이:', htmlContent.length);
        setInnerHTMLSafe(contentWrapper, htmlContent);
        this.log('content-wrapper에 HTML 삽입 완료');

        // 이벤트 리스너 설정
        const studentNameInput = this.getElement('#studentName');
        if (studentNameInput) {
            studentNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addStudent();
                }
            });
        }

        this.renderStudentList();
        
        // DOM 업데이트가 완료된 후 하위 렌더링 함수들 호출
        // requestAnimationFrame을 사용하여 브라우저 렌더링 사이클과 동기화
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // 요소가 존재할 때까지 대기하는 함수
                const waitForElement = (selector: string, callback: () => void, maxAttempts: number = 20) => {
                    let attempts = 0;
                    const checkElement = () => {
                        const element = this.getElement(selector);
                        if (element) {
                            this.log(`요소 발견: ${selector}`);
                            callback();
                        } else if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkElement, 50);
                        } else {
                            this.logError(`요소를 찾을 수 없음: ${selector} (${maxAttempts}회 시도)`);
                        }
                    };
                    checkElement();
                };
                
                this.log('경기 일정 테이블 렌더링 시작...');
                waitForElement('#gamesTableContent', () => {
                    this.log('renderGamesTable 호출 시도');
            this.renderGamesTable();
                });
                
                waitForElement('#rankingsTableContainer', () => {
            this.renderRankingsTable();
                });
                
                waitForElement('#gameStatsContainer', () => {
            this.renderGameStats();
                });
            
            // 일정 생성 버튼 상태 초기화
                const classGames = this.leagueData.games.filter(g => {
                    const gameClassId = typeof g.classId === 'number' ? g.classId : parseInt(String(g.classId), 10);
                    const targetClassId = typeof this.leagueData.selectedClassId === 'number' ? this.leagueData.selectedClassId : parseInt(String(this.leagueData.selectedClassId), 10);
                    return gameClassId === targetClassId;
                });
            this.updateGenerateGamesButtonState(classGames.length > 0);
            });
        });
    }

    /**
     * 반을 생성합니다.
     */
    public createClass(): void {
        this.log('createClass 호출됨');
        
        // 여러 방법으로 input 요소 찾기 시도
        let input = this.getElement('#className') as HTMLInputElement | null;
        
        // 첫 번째 시도가 실패하면 formContainer 내부에서 찾기
        if (!input) {
            const formContainer = this.getElement('#sidebar-form-container');
            if (formContainer) {
                input = formContainer.querySelector('#className') as HTMLInputElement | null;
                this.log('formContainer 내부에서 #className 찾기 시도:', !!input);
                
                // 여전히 못 찾으면 placeholder로 찾기
                if (!input) {
                    input = formContainer.querySelector('input[placeholder="새로운 반(팀) 이름"]') as HTMLInputElement | null;
                    this.log('placeholder로 찾기 시도:', !!input);
                }
                
                // 여전히 못 찾으면 첫 번째 input 찾기
                if (!input) {
                    input = formContainer.querySelector('input[type="text"]') as HTMLInputElement | null;
                    this.log('첫 번째 text input 찾기 시도:', !!input);
                }
            }
        }
        
        // 여전히 못 찾으면 document에서 직접 찾기
        if (!input) {
            input = document.querySelector('#className') as HTMLInputElement | null;
            this.log('document에서 #className 직접 찾기 시도:', !!input);
        }
        
        // 모든 시도가 실패하면 에러
        if (!input) {
            this.log('❌ className input 요소를 찾을 수 없음');
            this.log('현재 DOM 상태 확인:');
            const formContainer = this.getElement('#sidebar-form-container');
            if (formContainer) {
                this.log('formContainer 내용:', formContainer.innerHTML.substring(0, 300));
            }
            showError(new Error('입력 필드를 찾을 수 없습니다. 페이지를 새로고침해주세요.'));
            return;
        }
        
        this.log('✅ input 요소 찾기 성공:', input.id || 'id 없음', input.placeholder || 'placeholder 없음');
        
        const name = (input as HTMLInputElement).value.trim();
        this.log('입력된 이름:', name);
        
        // 이름 유효성 검사
        if (!name) {
            this.log('❌ 이름이 비어있음');
            showError(new Error('반 이름을 입력해주세요.'));
            return;
        }
        
        // 중복 검사
        if (this.leagueData.classes.some(c => c.name === name)) {
            this.log('❌ 중복된 이름:', name);
            showError(new Error('이미 존재하는 반 이름입니다.'));
            return;
        }
        
        // 데이터 생성 및 검증
        const newClassData = { 
            id: Math.floor(Date.now()), 
            name, 
            note: '' 
        };
        
        this.log('새 반 데이터 생성:', newClassData);
        
        const validation = validateData(LeagueClassSchema, newClassData);
        if (!validation.success) {
            this.log('❌ 데이터 검증 실패:', validation.errors || validation.formattedErrors);
            if (validation.errors) {
                showError(validation.errors);
            } else if (validation.formattedErrors) {
                showError(new Error(validation.formattedErrors.join(', ')));
            } else {
                showError(new Error('데이터 검증에 실패했습니다.'));
            }
            return;
        }
        
        // 검증 통과 후 추가
        const newClass: LeagueClass = validation.data!;
        this.log('검증 통과, 반 추가 중:', newClass);
        this.leagueData.classes.push(newClass);
        this.log('반 추가 완료, 현재 반 수:', this.leagueData.classes.length);
        
        (input as HTMLInputElement).value = '';
        this.saveData();
        this.log('데이터 저장 완료, UI 업데이트 시작');
        this.renderClassList(); // 반 목록 업데이트
        this.selectClass(newClass.id);
        showSuccess('반이 생성되었습니다.');
        this.log('createClass 완료');
    }

    /**
     * 반을 선택합니다.
     * @param id 반 ID (문자열 또는 숫자)
     */
    public selectClass(id: number | string): void {
        const classId = typeof id === 'string' ? parseInt(id) : id;
        this.leagueData.selectedClassId = classId;
        
        
        this.saveData();
        
        // UI 직접 업데이트
        this.renderClassList();
        this.renderLeagueUI();
    }

    /**
     * 반을 삭제합니다.
     * @param id 반 ID (숫자 또는 문자열)
     */
    public deleteClass(id: number | string): void {
        // ID를 숫자로 변환
        const classId = typeof id === 'string' ? parseInt(id, 10) : id;
        
        this.log('deleteClass 호출됨, 원본 ID:', id, '변환된 ID:', classId);
        this.log('현재 반 목록:', this.leagueData.classes.map(c => ({ id: c.id, name: c.name })));
        
        // ID 유효성 검사
        if (isNaN(classId)) {
            this.log('❌ 잘못된 ID:', id);
            showError(new Error('잘못된 반 ID입니다.'));
            return;
        }
        
        // 삭제할 반이 존재하는지 확인
        const classToDelete = this.leagueData.classes.find(c => c.id === classId);
        if (!classToDelete) {
            this.log('❌ 삭제할 반을 찾을 수 없음, ID:', classId);
            showError(new Error('삭제할 반을 찾을 수 없습니다.'));
            return;
        }
        
        this.log('삭제할 반:', classToDelete);
        
        if (confirm('반을 삭제하면 모든 학생과 경기 기록이 사라집니다. 정말 삭제하시겠습니까?')) {
            // 삭제 전 개수 확인
            const beforeClassesCount = this.leagueData.classes.length;
            const beforeStudentsCount = this.leagueData.students.length;
            const beforeGamesCount = this.leagueData.games.length;
            
            // 반 삭제
            this.leagueData.classes = this.leagueData.classes.filter(c => c.id !== classId);
            this.leagueData.students = this.leagueData.students.filter(s => s.classId !== classId);
            this.leagueData.games = this.leagueData.games.filter(g => g.classId !== classId);
            
            // 삭제 후 개수 확인
            const afterClassesCount = this.leagueData.classes.length;
            const afterStudentsCount = this.leagueData.students.length;
            const afterGamesCount = this.leagueData.games.length;
            
            this.log('삭제 결과:', {
                classes: `${beforeClassesCount} -> ${afterClassesCount}`,
                students: `${beforeStudentsCount} -> ${afterStudentsCount}`,
                games: `${beforeGamesCount} -> ${afterGamesCount}`
            });
            
            // 선택된 반이 삭제된 반이면 선택 해제
            if (this.leagueData.selectedClassId === classId) {
                this.leagueData.selectedClassId = null;
            }
            
            this.saveData();
            this.log('데이터 저장 완료, UI 업데이트 시작');
            this.renderClassList();
            this.renderLeagueUI();
            this.log('deleteClass 완료');
            showSuccess('반이 삭제되었습니다.');
        } else {
            this.log('삭제 취소됨');
        }
    }

    /**
     * 학생을 추가합니다.
     */
    public addStudent(): void {
        const input = this.getElement('#studentName');
        if (!input) return;
        
        const name = (input as HTMLInputElement).value.trim();
        const classId = this.leagueData.selectedClassId;
        
        // 유효성 검사
        if (!name) {
            showError(new Error('학생 이름을 입력해주세요.'));
            return;
        }
        
        if (!classId) {
            showError(new Error('반을 먼저 선택해주세요.'));
            return;
        }
        
        // 중복 검사
        if (this.leagueData.students.some(s => s.name === name && s.classId === classId)) {
            showError(new Error('이미 존재하는 학생 이름입니다.'));
            return;
        }
        
        // 데이터 생성 및 검증
        const studentData = { 
            id: Math.floor(Date.now()), 
            name, 
            classId, 
            note: '' 
        };
        
        const validation = validateData(LeagueStudentSchema, studentData);
        if (!validation.success) {
            if (validation.errors) {
                showError(validation.errors);
            } else if (validation.formattedErrors) {
                showError(new Error(validation.formattedErrors.join(', ')));
            } else {
                showError(new Error('데이터 검증에 실패했습니다.'));
            }
            return;
        }
        
        // 검증 통과 후 추가
        const student: LeagueStudent = validation.data!;
        this.leagueData.students.push(student);
        (input as HTMLInputElement).value = '';
        this.saveData();
        this.renderStudentList();
        this.renderClassList(); // 학생 수 변경을 반영하기 위해 반 목록도 다시 렌더링
        showSuccess('학생이 추가되었습니다.');
    }

    /**
     * 학생을 일괄 추가합니다.
     */
    public bulkAddStudents(): void {
        const names = prompt('학생 이름을 쉼표로 구분하여 입력하세요:');
        if (!names) return;
        
        const classId = this.leagueData.selectedClassId;
        if (!classId) return;
        
        const nameList = names.split(',').map(name => name.trim()).filter(name => name);
        let addedCount = 0;
        
        nameList.forEach((name, index) => {
            if (!this.leagueData.students.some(s => s.name === name && s.classId === classId)) {
                // 고유한 정수 ID 생성 (Date.now() + 인덱스로 고유성 보장)
                this.leagueData.students.push({ 
                    id: Math.floor(Date.now()) + index, 
                    name, 
                    classId, 
                    note: '' 
                });
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            this.saveData();
            this.renderStudentList();
            this.renderClassList(); // 학생 수 변경을 반영하기 위해 반 목록도 다시 렌더링
            alert(`${addedCount}명의 학생이 추가되었습니다.`);
        } else {
            alert('추가할 수 있는 학생이 없습니다.');
        }
    }

    /**
     * 학생 목록을 렌더링합니다.
     */
    public renderStudentList(): void {
        const container = this.getElement('#studentListGrid');
        if (!container) return;
        
        const classId = this.leagueData.selectedClassId;
        if (!classId) return;
        
        const students = this.leagueData.students.filter(s => s.classId === classId);
        
        const html = students.map(student => `
            <div class="student-item">
                <span>${student.name}</span>
                <div class="action-buttons row">
                    <button class="${(student.note || '').trim() ? 'has-note' : ''}" onclick="editStudentNote('${student.id || ''}')" data-tooltip="메모"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                    <button onclick="editStudentName('${student.id || ''}')" data-tooltip="수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button onclick="removeStudent('${student.id || ''}')" data-tooltip="삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            </div>
        `).join('');
        
        setInnerHTMLSafe(container, html);
    }

    /**
     * 학생을 제거합니다.
     * @param id 학생 ID
     */
    public removeStudent(id: number | string): void {
        // ID를 정수로 변환 (float ID도 처리)
        const studentId = typeof id === 'string' ? parseFloat(id) : id;
        const studentIdNum = typeof studentId === 'number' ? Math.floor(studentId) : studentId;
        
        // 정확한 ID 매칭 시도
        let removed = false;
        this.leagueData.students = this.leagueData.students.filter(s => {
            const sId = typeof s.id === 'number' ? Math.floor(s.id) : s.id;
            if (sId === studentIdNum) {
                removed = true;
                return false;
            }
            return true;
        });
        
        // 경기도 제거 (ID 매칭 시 float 처리)
        this.leagueData.games = this.leagueData.games.filter(g => {
            const p1Id = typeof g.player1Id === 'number' ? Math.floor(g.player1Id) : g.player1Id;
            const p2Id = typeof g.player2Id === 'number' ? Math.floor(g.player2Id) : g.player2Id;
            return p1Id !== studentIdNum && p2Id !== studentIdNum;
        });
        
        if (removed) {
            this.saveData();
            this.renderStudentList();
            this.renderClassList(); // 학생 수 변경을 반영하기 위해 반 목록도 다시 렌더링
            this.renderGamesTable();
            this.renderRankingsTable();
        }
    }

    /**
     * 학생 이름을 수정합니다.
     * @param id 학생 ID
     */
    public editStudentName(id: number | string): void {
        // ID를 정수로 변환 (float ID도 처리)
        const studentId = typeof id === 'string' ? parseFloat(id) : id;
        const studentIdNum = typeof studentId === 'number' ? Math.floor(studentId) : studentId;
        
        const student = this.leagueData.students.find(s => {
            const sId = typeof s.id === 'number' ? Math.floor(s.id) : s.id;
            return sId === studentIdNum;
        });
        if (!student) return;
        
        const newName = prompt('학생 이름을 수정하세요:', student.name);
        if (newName && newName.trim()) {
            student.name = newName.trim();
            this.saveData();
            this.renderStudentList();
        }
    }

    /**
     * 학생 메모를 수정합니다.
     * @param id 학생 ID
     */
    public editStudentNote(id: number | string): void {
        // ID를 정수로 변환 (float ID도 처리)
        const studentId = typeof id === 'string' ? parseFloat(id) : id;
        const studentIdNum = typeof studentId === 'number' ? Math.floor(studentId) : studentId;
        
        const student = this.leagueData.students.find(s => {
            const sId = typeof s.id === 'number' ? Math.floor(s.id) : s.id;
            return sId === studentIdNum;
        });
        if (!student) return;
        
        const newNote = prompt(`${student.name} - 메모:`, student.note || '');
        if (newNote !== null) {
            student.note = newNote.trim();
            this.saveData();
            this.renderStudentList();
        }
    }

    /**
     * 학생 목록을 가나다 순으로 정렬합니다.
     */
    public sortStudentsByName(): void {
        const classId = this.leagueData.selectedClassId;
        if (!classId) {
            showError(new Error('반을 먼저 선택해주세요.'));
            return;
        }

        // 현재 반의 학생들만 필터링
        const classStudents = this.leagueData.students.filter(s => {
            const studentClassId = typeof s.classId === 'number' ? s.classId : parseFloat(String(s.classId));
            const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
            return Math.abs(studentClassId - targetClassId) < 0.0001;
        });

        if (classStudents.length === 0) {
            showError(new Error('정렬할 학생이 없습니다.'));
            return;
        }

        // 학생들을 가나다 순으로 정렬
        const sortedStudents = [...classStudents].sort((a, b) => {
            return a.name.localeCompare(b.name, 'ko');
        });

        // 원본 배열에서 해당 학생들의 순서를 변경
        // 먼저 해당 반의 학생들을 제거
        this.leagueData.students = this.leagueData.students.filter(s => {
            const studentClassId = typeof s.classId === 'number' ? s.classId : parseFloat(String(s.classId));
            const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
            return Math.abs(studentClassId - targetClassId) >= 0.0001;
        });

        // 정렬된 학생들을 다시 추가
        this.leagueData.students.push(...sortedStudents);

        // 데이터 저장 및 UI 업데이트
        this.saveData();
        this.renderStudentList();
        showSuccess('학생 목록이 가나다 순으로 정렬되었습니다.');
    }

    /**
     * 반 메모를 수정합니다.
     * @param id 반 ID
     */
    public editClassNote(id: number): void {
        const classItem = this.leagueData.classes.find(c => c.id === id);
        if (!classItem) return;
        
        const newNote = prompt(`${classItem.name} - 메모:`, classItem.note || '');
        if (newNote !== null) {
            classItem.note = newNote.trim();
            this.saveData();
            this.renderClassList();
        }
    }

    /**
     * 반 이름을 수정합니다.
     * @param id 반 ID
     */
    public editClassName(id: number): void {
        const classItem = this.leagueData.classes.find(c => c.id === id);
        if (!classItem) return;
        
        const newName = prompt('반 이름을 수정하세요:', classItem.name);
        if (newName && newName.trim()) {
            classItem.name = newName.trim();
            this.saveData();
            this.renderClassList();
            // 현재 선택된 반이면 대시보드도 다시 렌더링
            if (this.leagueData.selectedClassId === id) {
                this.renderLeagueUI();
            }
        }
    }

    /**
     * 경기 일정을 생성합니다.
     */
    public generateGames(): void {
        const classId = this.leagueData.selectedClassId;
        if (!classId) return;
        
        const players = this.leagueData.students.filter(s => s.classId === classId);
        if (players.length < 2) {
            alert("선수가 2명 이상 필요합니다.");
            return;
        }

        // 모달 대신 확인 대화상자 사용
        if (!confirm('기존 경기 기록이 모두 사라집니다. 계속하시겠습니까?')) {
            return;
        }

        this.leagueData.games = this.leagueData.games.filter(g => g.classId !== classId);
        
        let schedulePlayers = [...players];
        if (schedulePlayers.length % 2 !== 0) {
            schedulePlayers.push({ id: -1, name: 'BYE', classId: classId, note: '' });
        }

        const numPlayers = schedulePlayers.length;
        const numRounds = numPlayers - 1;
        const gamesPerRound = numPlayers / 2;
        const newGames: LeagueGame[] = [];

        for (let r = 0; r < numRounds; r++) {
            for (let i = 0; i < gamesPerRound; i++) {
                const player1 = schedulePlayers[i];
                const player2 = schedulePlayers[numPlayers - 1 - i];

                if (player1 && player2 && player1.id !== -1 && player2.id !== -1) {
                    const p1_index = players.findIndex(p => p.id === player1.id);
                    const p2_index = players.findIndex(p => p.id === player2.id);

                    newGames.push({
                        id: Math.floor(Date.now()) + newGames.length, // 고유한 정수 ID 생성
                        classId,
                        player1Id: (p1_index < p2_index) ? player1.id : player2.id,
                        player2Id: (p1_index < p2_index) ? player2.id : player1.id,
                        player1Score: null,
                        player2Score: null,
                        isCompleted: false,
                        completedAt: null,
                        note: '',
                        isHighlighted: false
                    });
                }
            }
            
            // 다음 라운드를 위해 배열 회전
            schedulePlayers.splice(1, 0, schedulePlayers.pop()!);
        }

        this.leagueData.games.push(...newGames);
        this.saveData();
        this.renderGamesTable();
        this.renderRankingsTable();
        this.updateGenerateGamesButtonState(true);
        
        alert(`${newGames.length}개의 경기가 생성되었습니다.`);
    }

    /**
     * 리그전 점수를 업데이트합니다.
     * @param gameId 경기 ID
     * @param player 플레이어 (1 또는 2)
     * @param score 점수
     */
    public updateLeagueScore(gameId: number, player: 'player1' | 'player2', score: string): void {
        const game = this.leagueData.games.find(g => g.id === gameId);
        if (!game) return;
        
        const scoreValue = parseInt(score) || 0;
        
        if (player === 'player1') {
            game.player1Score = scoreValue;
        } else if (player === 'player2') {
            game.player2Score = scoreValue;
        }
        
        game.isCompleted = ((game.player1Score || 0) > 0 || (game.player2Score || 0) > 0);
        if (game.isCompleted && !game.completedAt) {
            // 오늘 날짜만 저장 (시간 제외)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            game.completedAt = today.getTime();
        }
        
        this.saveData();
        this.renderGamesTable();
        this.renderRankingsTable();
    }

    /**
     * 경기 메모를 업데이트합니다.
     * @param gameId 경기 ID
     * @param note 메모
     */
    public updateGameNote(gameId: number, note: string): void {
        const game = this.leagueData.games.find(g => g.id === gameId);
        if (!game) return;
        
        game.note = note;
        this.saveData();
    }

    /**
     * 게임 강조를 토글합니다.
     * @param gameId 게임 ID
     */
    public toggleGameHighlight(gameId: number | string): void {
        // ID를 정수로 변환 (float ID도 처리)
        const gameIdNum = typeof gameId === 'string' ? parseFloat(gameId) : gameId;
        const gameIdInt = typeof gameIdNum === 'number' ? Math.floor(gameIdNum) : gameIdNum;
        
        logger.debug('toggleGameHighlight 호출됨, gameId:', gameIdInt, 'type:', typeof gameIdInt);
        const game = this.leagueData.games.find(g => {
            const gId = typeof g.id === 'number' ? Math.floor(g.id) : g.id;
            return gId === gameIdInt;
        });
        logger.debug('찾은 게임:', game);
        if (game) {
            game.isHighlighted = !game.isHighlighted;
            logger.debug('게임 강조 상태 변경:', game.isHighlighted);
            this.saveData();
            this.renderGamesTable();
        } else {
            logError('게임을 찾을 수 없음, gameId:', gameIdInt);
            logger.debug('사용 가능한 게임 ID들:', this.leagueData.games.map(g => g.id));
        }
    }

    /**
     * 모든 강조를 해제합니다.
     */
    public clearAllHighlights(): void {
        this.leagueData.games.forEach(game => {
            game.isHighlighted = false;
        });
        this.saveData();
        this.renderGamesTable();
    }

    /**
     * 경기 생성 버튼 상태를 업데이트합니다.
     * @param hasGames 경기가 있는지 여부
     */
    public updateGenerateGamesButtonState(hasGames: boolean): void {
        const button = this.getElement('#generateGamesBtn');
        if (!button) return;
        
        if (hasGames) {
            // 일정이 이미 있으면 버튼 숨기기 (일정 재생성 버튼 제거)
            (button as HTMLElement).style.display = 'none';
        } else {
            // 일정이 없으면 '일정 생성' 버튼 표시
            (button as HTMLElement).style.display = '';
            button.textContent = '일정 생성';
            button.setAttribute('data-tooltip', '현재 학생 명단으로 새 경기 일정을 생성합니다.');
        }
    }

    /**
     * 경기 데이터의 playerId를 복구합니다.
     * 잘못된 형식의 playerId를 올바른 학생 ID로 매칭합니다.
     */
    private repairGamePlayerIds(): void {
        const classId = this.leagueData.selectedClassId;
        if (!classId) return;
        
        const classGames = this.leagueData.games.filter(g => {
            const gameClassId = typeof g.classId === 'number' ? g.classId : parseFloat(String(g.classId));
            const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
            return Math.abs(gameClassId - targetClassId) < 0.0001;
        });
        
        const classStudents = this.leagueData.students.filter(s => {
            const studentClassId = typeof s.classId === 'number' ? s.classId : parseFloat(String(s.classId));
            const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
            return Math.abs(studentClassId - targetClassId) < 0.0001;
        });
        
        if (classGames.length === 0 || classStudents.length === 0) return;
        
        let repairedCount = 0;
        
        classGames.forEach(game => {
            let p1Found = false;
            let p2Found = false;
            
            // player1Id 복구
            let p1 = classStudents.find(s => {
                const studentId = typeof s.id === 'number' ? s.id : parseFloat(String(s.id));
                const playerId = typeof game.player1Id === 'number' ? game.player1Id : parseFloat(String(game.player1Id));
                return Math.abs(studentId - playerId) < 0.0001;
            });
            
            if (!p1) {
                // 가장 가까운 학생 ID 찾기 (소수점이 있는 경우)
                const playerIdNum = typeof game.player1Id === 'number' ? game.player1Id : parseFloat(String(game.player1Id));
                if (!isNaN(playerIdNum)) {
                    // 정수 부분이 같은 학생 찾기
                    const playerIdBase = Math.floor(playerIdNum);
                    p1 = classStudents.find(s => {
                        const studentId = typeof s.id === 'number' ? s.id : parseFloat(String(s.id));
                        const studentIdBase = Math.floor(studentId);
                        return studentIdBase === playerIdBase;
                    });
                    
                    if (p1) {
                        // 올바른 학생 ID로 복구
                        const oldId = game.player1Id;
                        game.player1Id = p1.id as number;
                        p1Found = true;
                        this.log(`경기 복구: player1Id ${oldId} -> ${game.player1Id} (학생: ${p1.name})`);
                    }
                }
            } else {
                p1Found = true;
            }
            
            // player2Id 복구
            let p2 = classStudents.find(s => {
                const studentId = typeof s.id === 'number' ? s.id : parseFloat(String(s.id));
                const playerId = typeof game.player2Id === 'number' ? game.player2Id : parseFloat(String(game.player2Id));
                return Math.abs(studentId - playerId) < 0.0001;
            });
            
            if (!p2) {
                // 가장 가까운 학생 ID 찾기 (소수점이 있는 경우)
                const playerIdNum = typeof game.player2Id === 'number' ? game.player2Id : parseFloat(String(game.player2Id));
                if (!isNaN(playerIdNum)) {
                    // 정수 부분이 같은 학생 찾기
                    const playerIdBase = Math.floor(playerIdNum);
                    p2 = classStudents.find(s => {
                        const studentId = typeof s.id === 'number' ? s.id : parseFloat(String(s.id));
                        const studentIdBase = Math.floor(studentId);
                        return studentIdBase === playerIdBase;
                    });
                    
                    if (p2) {
                        // 올바른 학생 ID로 복구
                        const oldId = game.player2Id;
                        game.player2Id = p2.id as number;
                        p2Found = true;
                        this.log(`경기 복구: player2Id ${oldId} -> ${game.player2Id} (학생: ${p2.name})`);
                    }
                }
            } else {
                p2Found = true;
            }
            
            if (p1Found || p2Found) {
                repairedCount++;
            }
        });
        
        if (repairedCount > 0) {
            this.log(`경기 데이터 복구 완료: ${repairedCount}개 경기 수정됨`);
            this.saveData();
        }
    }

    /**
     * 경기 테이블을 렌더링합니다.
     * @param isReadOnly 읽기 전용 여부
     */
    public renderGamesTable(isReadOnly: boolean = false): void {
        this.log('=== renderGamesTable 호출됨 ===');
        const container = this.getElement('#gamesTableContent');
        if (!container) {
            this.logError('❌ gamesTableContent 요소를 찾을 수 없음');
            // 요소를 찾을 수 없으면 재시도
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                this.log('재시도: renderGamesTable');
                this.renderGamesTable(isReadOnly);
                });
            });
            return;
        }
        
        const classId = this.leagueData.selectedClassId;
        this.log('renderGamesTable - classId:', classId);
        this.log('renderGamesTable - 전체 games 수:', this.leagueData.games.length);
        if (!classId) {
            this.logError('❌ classId가 없습니다');
            return;
        }
        
        // 경기 데이터 복구 시도
        this.repairGamePlayerIds();
        
        // classId 비교 (숫자와 문자열 모두 처리)
        const classGames = this.leagueData.games.filter(g => {
            const gameClassId = typeof g.classId === 'number' ? g.classId : parseFloat(String(g.classId));
            const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
            const matches = Math.abs(gameClassId - targetClassId) < 0.0001;
            if (matches) {
                this.log(`경기 발견: id=${g.id}, player1=${g.player1Id}, player2=${g.player2Id}`);
            }
            return matches;
        });
        this.log(`renderGamesTable - classGames.length: ${classGames.length}, selectedClassId: ${classId}`);
        
        // 일정 생성 버튼 상태 업데이트
        this.updateGenerateGamesButtonState(classGames.length > 0);
        
        if (classGames.length === 0) {
            setInnerHTMLSafe(container, `<div style="text-align:center; padding: 2rem; color: var(--ink-muted);">생성된 경기가 없습니다.</div>`);
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
        
        // 먼저 해당 반의 학생만 필터링 (성능 향상)
        const classStudents = this.leagueData.students.filter(s => {
            const studentClassId = typeof s.classId === 'number' ? s.classId : parseFloat(String(s.classId));
            const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
            return Math.abs(studentClassId - targetClassId) < 0.0001;
        });
        this.log(`renderGamesTable - classStudents.length: ${classStudents.length}`);
        
        // 학생 ID 매핑 생성 (성능 향상 및 디버깅)
        const studentIdMap = new Map<string | number, typeof classStudents[0]>();
        classStudents.forEach(s => {
            studentIdMap.set(s.id, s);
            // 숫자 ID도 문자열로 변환해서 저장 (양방향 매핑)
            if (typeof s.id === 'number') {
                studentIdMap.set(String(s.id), s);
            }
        });
        
        html += classGames.map((game, i) => {
            // 여러 방법으로 학생 찾기 시도
            let p1 = studentIdMap.get(game.player1Id);
            if (!p1) {
                p1 = studentIdMap.get(String(game.player1Id));
            }
            if (!p1) {
                // 숫자 비교 (소수점 오차 허용)
                p1 = classStudents.find(s => {
                    const studentId = typeof s.id === 'number' ? s.id : parseFloat(String(s.id));
                    const playerId = typeof game.player1Id === 'number' ? game.player1Id : parseFloat(String(game.player1Id));
                    return !isNaN(studentId) && !isNaN(playerId) && Math.abs(studentId - playerId) < 0.0001;
                });
            }
            
            let p2 = studentIdMap.get(game.player2Id);
            if (!p2) {
                p2 = studentIdMap.get(String(game.player2Id));
            }
            if (!p2) {
                // 숫자 비교 (소수점 오차 허용)
                p2 = classStudents.find(s => {
                    const studentId = typeof s.id === 'number' ? s.id : parseFloat(String(s.id));
                    const playerId = typeof game.player2Id === 'number' ? game.player2Id : parseFloat(String(game.player2Id));
                    return !isNaN(studentId) && !isNaN(playerId) && Math.abs(studentId - playerId) < 0.0001;
                });
            }
            
            if (!p1 || !p2) {
                // 학생을 찾지 못한 경우 로그 출력
                if (i < 5) { // 처음 5개만 로그 출력
                    this.log(`⚠️ 경기 ${i+1}: 학생을 찾지 못함 - player1Id: ${game.player1Id} (${p1 ? '찾음' : '없음'}), player2Id: ${game.player2Id} (${p2 ? '찾음' : '없음'})`);
                    this.log(`   전체 학생 수: ${this.leagueData.students.length}, classId: ${this.leagueData.selectedClassId}`);
                    if (this.leagueData.students.length > 0) {
                        const sampleStudents = this.leagueData.students.filter(s => {
                            const studentClassId = typeof s.classId === 'number' ? s.classId : parseFloat(String(s.classId));
                            const targetClassId = typeof this.leagueData.selectedClassId === 'number' ? this.leagueData.selectedClassId : parseFloat(String(this.leagueData.selectedClassId));
                            return Math.abs(studentClassId - targetClassId) < 0.0001;
                        }).slice(0, 3);
                        this.log(`   이 반의 학생 샘플:`, sampleStudents.map(s => ({id: s.id, name: s.name, classId: s.classId})));
                    }
                }
                return '';
            }
            
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
                        `<input type="number" class="score" value="${score1}" onchange="window.leagueManager.updateLeagueScore(${game.id}, 'player1', this.value)">`
                    }
                </td>
                <td style="text-align: center; font-weight: bold; color: var(--ink-muted); font-size: 0.9rem;">vs</td>
                <td style="text-align: center;">
                    ${isReadOnly ? 
                        `<span style="font-weight: 500; color: var(--ink);">${score2}</span>` : 
                        `<input type="number" class="score" value="${score2}" onchange="window.leagueManager.updateLeagueScore(${game.id}, 'player2', this.value)">`
                    }
                </td>
                <td style="font-weight: 500;">${p2.name}</td>
                <td style="text-align: center;">
                    <span class="status-badge ${game.isCompleted ? 'completed' : 'pending'}">
                        ${game.isCompleted ? '완료' : '대기'}
                    </span>
                </td>
                <td style="text-align: center; font-size: 0.85rem; color: var(--ink-muted);">
                    ${game.completedAt ? new Date(game.completedAt).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td>
                    ${isReadOnly ? 
                        `<span style="color: var(--ink-muted);">${note || '-'}</span>` : 
                        `<input type="text" class="game-note" value="${note}" onchange="window.leagueManager.updateGameNote(${game.id}, this.value)" placeholder="메모 입력" style="width: 90%;">`
                    }
                </td>
            </tr>`;
        }).join('');
        
        html += '</tbody></table>';
        this.log('경기 테이블 HTML 생성 완료, 길이:', html.length);
        
        // tbody에 실제 행이 있는지 확인
        const tbodyContent = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
        const hasRows = tbodyContent && tbodyContent[1].trim().length > 0;
        
        if (!hasRows) {
            this.logError('❌ 경기 테이블에 행이 없습니다. 학생 매칭 실패 가능성.');
            this.log(`   경기 수: ${classGames.length}, 해당 반 학생 수: ${classStudents.length}`);
            if (classGames.length > 0 && classStudents.length > 0) {
                this.log(`   첫 번째 경기: player1Id=${classGames[0].player1Id}, player2Id=${classGames[0].player2Id}`);
                this.log(`   학생 ID 샘플:`, classStudents.slice(0, 3).map(s => s.id));
            }
            // 빈 테이블 대신 메시지 표시
            setInnerHTMLSafe(container, `<div style="text-align:center; padding: 2rem; color: var(--ink-muted);">
                <p>경기 데이터는 있지만 학생 정보를 찾을 수 없습니다.</p>
                <p style="font-size: 0.9em; margin-top: 0.5rem;">경기 수: ${classGames.length}, 학생 수: ${classStudents.length}</p>
            </div>`);
            return;
        }
        
        setInnerHTMLSafe(container, html);
        this.log('✅ 경기 테이블 HTML 삽입 완료');
        
        // DOM에 삽입된 후 확인
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
            const table = container.querySelector('table');
            const tbody = table?.querySelector('tbody');
            const rows = tbody?.querySelectorAll('tr');
            if (table && rows && rows.length > 0) {
                this.log(`✅ 경기 테이블이 성공적으로 렌더링되었습니다. (${rows.length}개 행)`);
            } else {
                this.logError('❌ 경기 테이블이 DOM에 없거나 행이 없습니다.');
            }
            });
        });
    }

    /**
     * 순위표를 렌더링합니다.
     * @param targetEl 대상 요소
     */
    public renderRankingsTable(targetEl?: HTMLElement | null): void {
        this.log('renderRankingsTable 호출됨');
        const container = targetEl || this.getElement('#rankingsTableContainer');
        if (!container) {
            this.logError('rankingsTableContainer 요소를 찾을 수 없음');
            return;
        }
        
        const classId = this.leagueData.selectedClassId;
        this.log('renderRankingsTable - classId:', classId);
        if (!classId) {
            setInnerHTMLSafe(container, `<div style="text-align:center; padding: 2rem;">반을 선택해주세요.</div>`);
            return;
        }

        const ranks = this.getRankingsData(classId);
        this.log('renderRankingsTable - ranks.length:', ranks.length);

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
             setInnerHTMLSafe(container, `<div style="text-align:center; padding: 2rem;">참가자가 없습니다.</div>`);
        } else {
            if (container.tagName.toLowerCase() === 'table') {
                 setInnerHTMLSafe(container, tableContent);
            } else {
                 setInnerHTMLSafe(container, `<table class="styled-table">${tableContent}</table>`);
            }
        }
    }

    /**
     * 순위 데이터를 가져옵니다.
     * @param classId 반 ID
     * @returns 순위 데이터 배열
     */
    public getRankingsData(classId: number): RankingData[] {
        if (!classId) return [];
        const players = this.leagueData.students.filter(s => s.classId === classId);
        const games = this.leagueData.games.filter(g => g.classId === classId && g.isCompleted);
        
        return players.map(p => {
            const stats = { wins: 0, losses: 0, draws: 0, points: 0, gamesPlayed: 0 };
            games.forEach(g => {
                let p1Score, p2Score;
                if (g.player1Id === p.id) { 
                    stats.gamesPlayed++; 
                    p1Score = g.player1Score; 
                    p2Score = g.player2Score; 
                } 
                else if (g.player2Id === p.id) { 
                    stats.gamesPlayed++; 
                    p1Score = g.player2Score; 
                    p2Score = g.player1Score; 
                } 
                else return;
                
                if ((p1Score || 0) > (p2Score || 0)) { 
                    stats.wins++; 
                    stats.points += 3; 
                } 
                else if ((p1Score || 0) < (p2Score || 0)) { 
                    stats.losses++; 
                } 
                else { 
                    stats.draws++; 
                    stats.points += 1; 
                }
            });
            return { name: p.name, ...stats };
        }).sort((a,b) => b.points - a.points || b.wins - a.wins);
    }

    /**
     * 게임 통계를 렌더링합니다.
     */
    public renderGameStats(): void {
        const container = this.getElement('#gameStatsContainer');
        if (!container) return;
        
        const classId = this.leagueData.selectedClassId;
        if (!classId) return;
        
        const allGames = this.leagueData.games.filter(g => g.classId === classId);
        const total = allGames.length;
        const completed = allGames.filter(g => g.isCompleted).length;
        const pending = total - completed;

        if (total === 0) {
            container.innerHTML = '';
            return;
        }

        const statsHtml = `
            <div class="game-stats">
                <span class="stat-item">총 경기: ${total}</span>
                <span class="stat-item">완료: ${completed}</span>
                <span class="stat-item">남은 경기: ${pending}</span>
                <span class="stat-item">진행률: ${((completed / total) * 100).toFixed(1)}%</span>
            </div>
        `;
        setInnerHTMLSafe(container, statsHtml);
    }

    /**
     * 모든 리그전을 엑셀로 내보냅니다.
     */
    public exportAllLeaguesToExcel(): void {
        if (typeof window === 'undefined' || !(window as any).XLSX) {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
            return;
        }

        if (this.leagueData.classes.length === 0) {
            alert('내보낼 반이 없습니다.');
            return;
        }

        try {
            const XLSX = (window as any).XLSX;
            const wb = XLSX.utils.book_new();

            // 각 반에 대해 시트 생성
            this.leagueData.classes.forEach((classItem) => {
                const students = this.leagueData.students.filter(s => s.classId === classItem.id);
                const games = this.leagueData.games.filter(g => g.classId === classItem.id);
                const rankings = this.getRankingsData(classItem.id);
                
                // 헤더 행
                const data: any[][] = [
                    ['반명', classItem.name],
                    ['', ''], // 빈 줄
                    ['순위', '이름', '승', '무', '패', '승점', '경기 수']
                ];

                // 순위표 데이터
                if (rankings.length > 0) {
                    rankings.forEach((r, index) => {
                        data.push([
                            index + 1,
                            r.name,
                            r.wins,
                            r.draws,
                            r.losses,
                            r.points,
                            r.gamesPlayed
                        ]);
                    });
                } else {
                    data.push(['순위 데이터가 없습니다.', '', '', '', '', '', '']);
                }

                // 빈 줄
                data.push(['', '']);
                data.push(['경기 기록', '']);
                data.push(['#', '선수1', '선수2', '점수1', '점수2', '완료 여부', '비고']);

                // 경기 기록 데이터
                if (games.length > 0) {
                    // 경기를 ID 순으로 정렬하여 경기번호 할당
                    const sortedGames = [...games].sort((a, b) => {
                        const aId = typeof a.id === 'number' ? a.id : parseFloat(String(a.id));
                        const bId = typeof b.id === 'number' ? b.id : parseFloat(String(b.id));
                        return aId - bId;
                    });
                    
                    sortedGames.forEach((game, index) => {
                        const p1 = students.find(s => s.id === game.player1Id);
                        const p2 = students.find(s => s.id === game.player2Id);
                        data.push([
                            index + 1, // 경기번호
                            p1?.name || 'Unknown',
                            p2?.name || 'Unknown',
                            game.player1Score !== null ? game.player1Score : '',
                            game.player2Score !== null ? game.player2Score : '',
                            game.isCompleted ? '완료' : '미완료',
                            game.note || ''
                        ]);
                    });
                } else {
                    data.push(['경기 기록이 없습니다.', '', '', '', '', '', '']);
                }

                // 시트 생성
                const ws = XLSX.utils.aoa_to_sheet(data);
                
                // 컬럼 너비 설정
                const colWidths = [
                    { wch: 10 }, // 순위
                    { wch: 15 }, // 이름
                    { wch: 8 },  // 승
                    { wch: 8 },  // 무
                    { wch: 8 },  // 패
                    { wch: 10 }, // 승점
                    { wch: 10 }, // 경기 수
                    { wch: 8 },  // 경기번호 (#)
                    { wch: 15 }, // 선수1
                    { wch: 15 }, // 선수2
                    { wch: 10 }, // 점수1
                    { wch: 10 }, // 점수2
                    { wch: 12 }, // 완료 여부
                    { wch: 20 }  // 비고
                ];
                ws['!cols'] = colWidths;

                // 시트 이름 (반 이름, 최대 31자)
                const sheetName = classItem.name.length > 31 ? classItem.name.substring(0, 31) : classItem.name;
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });

            // 파일 저장
            const fileName = `리그전_경기기록_전체_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            showSuccess('모든 반의 경기 기록이 엑셀 파일로 내보내졌습니다.');
        } catch (error) {
            this.logError('엑셀 내보내기 오류:', error);
            showError(new Error('엑셀 파일 내보내기 중 오류가 발생했습니다.'));
        }
    }

    /**
     * 모든 반의 경기 기록을 엑셀 파일에서 가져옵니다.
     */
    public handleAllLeaguesExcelUpload(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            return;
        }

        const file = input.files[0];
        if (typeof window === 'undefined' || !(window as any).XLSX) {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const XLSX = (window as any).XLSX;
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });

                const importedClasses: LeagueClass[] = [];
                const importedStudents: LeagueStudent[] = [];
                const importedGames: LeagueGame[] = [];

                // 각 시트를 순회하면서 데이터 파싱
                wb.SheetNames.forEach((sheetName: string) => {
                    const ws = wb.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

                    if (json.length < 3) {
                        return;
                    }

                    // 반 정보 파싱 (첫 행: 반명)
                    let className = '';
                    if (json[0] && json[0].length >= 2) {
                        className = String(json[0][1] || sheetName).trim();
                    } else {
                        className = sheetName;
                    }

                    // 반 생성 (정수 ID 사용)
                    const classId = Math.floor(Date.now() + Math.random() * 1000);
                    const leagueClass: LeagueClass = {
                        id: classId,
                        name: className || sheetName,
                        note: ''
                    };
                    importedClasses.push(leagueClass);

                    // 순위표에서 학생 이름 추출 (3번째 행부터 경기 기록 시작 전까지)
                    const studentNames = new Set<string>();
                    let gameStartRow = 0;
                    for (let i = 2; i < json.length; i++) {
                        const row = json[i];
                        if (!row || row.length === 0) continue;
                        
                        // "경기 기록" 행을 찾으면 중단
                        if (row[0] && String(row[0]).includes('경기 기록')) {
                            gameStartRow = i + 1;
                            break;
                        }
                        
                        // 순위표 데이터에서 학생 이름 추출 (2번째 열)
                        if (row[1] && typeof row[1] === 'string' && row[1].trim()) {
                            studentNames.add(row[1].trim());
                        }
                    }

                    // 학생 데이터 생성
                    let studentIdCounter = 1;
                    studentNames.forEach((name) => {
                        const student: LeagueStudent = {
                            id: classId * 1000 + studentIdCounter++,
                            name: name,
                            classId: classId,
                            note: ''
                        };
                        importedStudents.push(student);
                    });

                    // 경기 기록 파싱 (gameStartRow부터)
                    if (gameStartRow > 0 && gameStartRow < json.length) {
                        // 헤더 행 확인하여 컬럼 구조 판단
                        const headerRow = json[gameStartRow];
                        let hasGameNumber = false;
                        if (headerRow && headerRow.length > 0) {
                            const firstCol = String(headerRow[0] || '').trim();
                            hasGameNumber = firstCol === '#' || firstCol === '경기번호';
                        }
                        
                        // 헤더 행 다음부터 (gameStartRow + 1)
                        for (let i = gameStartRow + 1; i < json.length; i++) {
                            const row = json[i];
                            if (!row || row.length < 2) continue;

                            // 경기번호 컬럼이 있으면 스킵 (인덱스 0), 없으면 첫 번째 컬럼이 선수1
                            const player1ColIndex = hasGameNumber ? 1 : 0;
                            const player2ColIndex = hasGameNumber ? 2 : 1;
                            const score1ColIndex = hasGameNumber ? 3 : 2;
                            const score2ColIndex = hasGameNumber ? 4 : 3;
                            const completedColIndex = hasGameNumber ? 5 : 5; // 완료 여부는 항상 5번째 (또는 경기번호 있으면 6번째)
                            const noteColIndex = hasGameNumber ? 6 : 4; // 비고는 경기번호 있으면 7번째, 없으면 5번째

                            const player1Name = String(row[player1ColIndex] || '').trim();
                            const player2Name = String(row[player2ColIndex] || '').trim();

                            // 경기번호만 있고 선수 이름이 없는 경우 스킵
                            if (hasGameNumber && (row[0] === '' || row[0] === null || !isNaN(parseFloat(String(row[0])))) && !player1Name) {
                                continue;
                            }

                            if (!player1Name || !player2Name) continue;

                            const player1 = importedStudents.find(s => s.classId === classId && s.name === player1Name);
                            const player2 = importedStudents.find(s => s.classId === classId && s.name === player2Name);

                            if (!player1 || !player2) continue;

                            const player1Score = row[score1ColIndex] !== null && row[score1ColIndex] !== '' && row[score1ColIndex] !== undefined ? 
                                (typeof row[score1ColIndex] === 'number' ? row[score1ColIndex] : parseInt(String(row[score1ColIndex]), 10)) : null;
                            const player2Score = row[score2ColIndex] !== null && row[score2ColIndex] !== '' && row[score2ColIndex] !== undefined ? 
                                (typeof row[score2ColIndex] === 'number' ? row[score2ColIndex] : parseInt(String(row[score2ColIndex]), 10)) : null;
                            const isCompleted = row[completedColIndex] === '완료' || row[completedColIndex] === true || row[completedColIndex] === 'true' || row[completedColIndex] === 1;
                            const note = row[noteColIndex] ? String(row[noteColIndex]).trim() : '';

                            const game: LeagueGame = {
                                id: classId * 10000 + importedGames.filter(g => g.classId === classId).length + 1,
                                classId: classId,
                                player1Id: player1.id,
                                player2Id: player2.id,
                                player1Score: player1Score,
                                player2Score: player2Score,
                                isCompleted: isCompleted,
                                completedAt: isCompleted ? Date.now() : null,
                                note: note,
                                isHighlighted: false
                            };
                            importedGames.push(game);
                        }
                    }
                });

                if (importedClasses.length === 0) {
                    alert('엑셀 파일에서 데이터를 읽을 수 없습니다. 파일 형식을 확인해주세요.');
                    return;
                }

                // 데이터 확인 메시지
                const confirmMessage = `엑셀 파일에서 ${importedClasses.length}개의 반 데이터를 찾았습니다.\n\n기존 데이터를 모두 교체하시겠습니까?`;
                if (!confirm(confirmMessage)) {
                    input.value = '';
                    return;
                }

                // 기존 데이터를 새 데이터로 교체
                this.leagueData.classes = importedClasses;
                this.leagueData.students = importedStudents;
                this.leagueData.games = importedGames;
                this.leagueData.selectedClassId = null;

                // 데이터 저장
                this.saveData();

                // UI 업데이트
                this.renderClassList();
                
                // 메인 콘텐츠 영역 초기화
                const contentWrapper = this.getElement('#content-wrapper');
                if (contentWrapper) {
                    contentWrapper.innerHTML = `
                        <div class="league-main-content">
                            <div class="league-right">
                                <div class="league-right-header">
                                    <h2>리그전 수업 관리</h2>
                                    <p style="color: var(--ink-muted);">반을 선택하여 경기 기록을 확인하거나 수정하세요.</p>
                                </div>
                            </div>
                        </div>
                    `;
                }

                showSuccess(`${importedClasses.length}개의 반 데이터가 성공적으로 불러와졌습니다.`);
                
                input.value = '';
            } catch (error) {
                this.logError('엑셀 파일 읽기 오류:', error);
                showError(new Error('엑셀 파일 읽기 중 오류가 발생했습니다. 파일 형식을 확인해주세요.'));
                input.value = '';
            }
        };

        reader.onerror = () => {
            showError(new Error('파일을 읽는 중 오류가 발생했습니다.'));
            input.value = '';
        };

        reader.readAsArrayBuffer(file);
    }

    /**
     * 사이드바를 정리합니다.
     */
    private cleanupSidebar(): void {
        // sidebar-form-container만 비우고, sidebar-list-container는 renderClassList에서 관리
        const formContainer = this.getElement('#sidebar-form-container');
        if (formContainer) {
            formContainer.innerHTML = '';
        }
        // sidebar-list-container는 renderClassList()에서 다시 채우므로 여기서 비우지 않음
    }

    /**
     * DOM 요소를 가져옵니다.
     * @param selector CSS 선택자
     * @returns DOM 요소 또는 null
     */
    private getElement(selector: string): HTMLElement | null {
        try {
            return document.querySelector(selector);
        } catch (error) {
            this.logError('DOM 요소 조회 오류:', error);
            return null;
        }
    }

    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    private log(message: string, ...args: any[]): void {
        logger.debug(`[LeagueManager] ${message}`, ...args);
    }

    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    private logError(message: string, ...args: any[]): void {
        logError(`[LeagueManager] ${message}`, ...args);
    }

    /**
     * 현재 리그전 데이터를 반환합니다.
     * @returns 리그전 데이터
     */
    public getLeagueData(): LeagueData {
        return this.leagueData;
    }

    /**
     * 리그전 데이터를 설정합니다.
     * @param data 리그전 데이터
     */
    public setLeagueData(data: LeagueData): void {
        this.leagueData = data;
    }

    /**
     * 엑셀 파일을 이용하여 경기 데이터를 복구합니다.
     * 엑셀 파일의 경기 기록에서 선수 이름을 추출하여 현재 경기 데이터와 매칭합니다.
     */
    public repairGamesFromExcel(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !(window as any).XLSX) {
                reject(new Error('엑셀 라이브러리가 로드되지 않았습니다.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const XLSX = (window as any).XLSX;
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const wb = XLSX.read(data, { type: 'array' });

                    const classId = this.leagueData.selectedClassId;
                    if (!classId) {
                        reject(new Error('반을 먼저 선택해주세요.'));
                        return;
                    }

                    const currentClass = this.leagueData.classes.find(c => c.id === classId);
                    if (!currentClass) {
                        reject(new Error('선택된 반을 찾을 수 없습니다.'));
                        return;
                    }

                    this.log(`현재 선택된 반: ${currentClass.name} (ID: ${classId})`);

                    const classGames = this.leagueData.games.filter(g => {
                        const gameClassId = typeof g.classId === 'number' ? g.classId : parseFloat(String(g.classId));
                        const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
                        return Math.abs(gameClassId - targetClassId) < 0.0001;
                    });

                    const classStudents = this.leagueData.students.filter(s => {
                        const studentClassId = typeof s.classId === 'number' ? s.classId : parseFloat(String(s.classId));
                        const targetClassId = typeof classId === 'number' ? classId : parseFloat(String(classId));
                        return Math.abs(studentClassId - targetClassId) < 0.0001;
                    });

                    if (classGames.length === 0) {
                        reject(new Error('현재 선택된 반에 경기 데이터가 없습니다. 경기 일정을 먼저 생성해주세요.'));
                        return;
                    }
                    
                    if (classStudents.length === 0) {
                        reject(new Error('현재 선택된 반에 학생 데이터가 없습니다. 학생을 먼저 추가해주세요.'));
                        return;
                    }

                    // 학생 이름으로 매핑 생성
                    const studentNameMap = new Map<string, typeof classStudents[0]>();
                    classStudents.forEach(s => {
                        studentNameMap.set(s.name.trim(), s);
                    });

                    // 엑셀 파일에서 경기 기록 추출
                    const excelGames: Array<{ player1Name: string, player2Name: string, rowIndex: number }> = [];
                    
                    // 현재 선택된 반과 일치하는 시트 찾기
                    wb.SheetNames.forEach((sheetName: string) => {
                        const ws = wb.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];

                        // 반명 확인
                        let className = '';
                        if (json[0] && json[0].length >= 2) {
                            className = String(json[0][1] || sheetName).trim();
                        } else {
                            className = sheetName;
                        }

                        this.log(`엑셀 시트 "${sheetName}"의 반명: "${className}"`);

                        // 현재 선택된 반과 일치하는지 확인 (반 이름 또는 시트 이름으로 비교)
                        if (currentClass.name !== className && currentClass.name !== sheetName) {
                            this.log(`시트 "${sheetName}"는 현재 반과 일치하지 않아 스킵합니다.`);
                            return; // 다른 반이면 스킵
                        }

                        this.log(`시트 "${sheetName}"에서 경기 기록 찾는 중...`);

                        // 경기 기록 찾기
                        let gameStartRow = -1;
                        let headerRow = -1;
                        for (let i = 0; i < json.length; i++) {
                            const row = json[i];
                            if (!row || row.length === 0) continue;
                            
                            // "경기 기록" 행 찾기
                            if (row[0] && String(row[0]).includes('경기 기록')) {
                                this.log(`"경기 기록" 행을 찾았습니다: 행 ${i}`);
                                // 다음 행부터 헤더 행 찾기
                                for (let j = i + 1; j < json.length; j++) {
                                    const headerRowData = json[j];
                                    if (headerRowData && headerRowData.length >= 2) {
                                        const firstCol = String(headerRowData[0] || '').trim();
                                        const secondCol = String(headerRowData[1] || '').trim();
                                        // 헤더 행 확인 ('#', '선수1', '선수2' 또는 '선수 1', '선수 2' 등)
                                        // 첫 번째 컬럼이 '#'이거나 숫자이고, 두 번째 컬럼이 '선수1'인 경우
                                        const isNumberHeader = firstCol === '#' || firstCol === '경기번호' || !isNaN(parseFloat(firstCol));
                                        const isPlayer1Header = secondCol.includes('선수') || secondCol === '선수1' || secondCol === '선수 1';
                                        // 또는 첫 번째 컬럼이 '선수1'인 경우 (기존 형식 호환)
                                        const isOldFormat = (firstCol.includes('선수') || firstCol === '선수1' || firstCol === '선수 1') && 
                                                          (secondCol.includes('선수') || secondCol === '선수2' || secondCol === '선수 2');
                                        
                                        if ((isNumberHeader && isPlayer1Header) || isOldFormat) {
                                            headerRow = j;
                                            gameStartRow = j + 1; // 헤더 다음 행부터 데이터
                                            this.log(`헤더 행을 찾았습니다: 행 ${headerRow}, 데이터 시작 행: ${gameStartRow}`);
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                        }

                        // 경기 기록 파싱
                        if (gameStartRow > 0) {
                            this.log(`경기 기록 파싱 시작: 행 ${gameStartRow}부터`);
                            for (let i = gameStartRow; i < json.length; i++) {
                                const row = json[i];
                                if (!row || row.length < 2) continue;

                                // 헤더 행인지 확인 (첫 번째 컬럼이 '#' 또는 숫자, 두 번째가 '선수1' 또는 첫 번째가 '선수1')
                                const firstCol = String(row[0] || '').trim();
                                const secondCol = row.length > 1 ? String(row[1] || '').trim() : '';
                                const isHeaderRow = (firstCol === '#' || firstCol === '경기번호' || (!isNaN(parseFloat(firstCol)) && (secondCol === '선수1' || secondCol.includes('선수1')))) ||
                                                   (firstCol === '선수1' || firstCol.includes('선수1') || firstCol.includes('경기 기록'));
                                
                                if (isHeaderRow) {
                                    continue;
                                }
                                
                                // 경기번호 컬럼이 있는지 확인
                                const hasGameNumber = firstCol === '#' || (!isNaN(parseFloat(firstCol)) && secondCol !== '');
                                const player1ColIndex = hasGameNumber ? 1 : 0;
                                const player2ColIndex = hasGameNumber ? 2 : 1;
                                
                                const player1Name = String(row[player1ColIndex] || '').trim();
                                const player2Name = String(row[player2ColIndex] || '').trim();

                                // 빈 행 스킵
                                if (!player1Name || !player2Name) {
                                    continue;
                                }

                                excelGames.push({
                                    player1Name,
                                    player2Name,
                                    rowIndex: i
                                });
                            }
                            this.log(`시트 "${sheetName}"에서 ${excelGames.length}개의 경기 기록을 찾았습니다.`);
                        } else {
                            this.log(`시트 "${sheetName}"에서 경기 기록을 찾을 수 없습니다.`);
                        }
                    });

                    if (excelGames.length === 0) {
                        this.logError('엑셀 파일에서 경기 기록을 찾을 수 없습니다.');
                        this.log('엑셀 파일 구조 확인:');
                        wb.SheetNames.forEach((sheetName: string) => {
                            const ws = wb.Sheets[sheetName];
                            const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
                            this.log(`시트 "${sheetName}": ${json.length}개 행`);
                            // 처음 15개 행 출력
                            for (let i = 0; i < Math.min(15, json.length); i++) {
                                this.log(`  행 ${i}:`, json[i]);
                            }
                        });
                        reject(new Error(`엑셀 파일에서 경기 기록을 찾을 수 없습니다. 현재 선택된 반: "${currentClass.name}". 엑셀 파일의 시트 이름과 반명을 확인해주세요.`));
                        return;
                    }

                    this.log(`엑셀에서 ${excelGames.length}개의 경기 기록을 찾았습니다.`);
                    this.log(`현재 경기 수: ${classGames.length}개`);

                    // 경기를 ID 순으로 정렬
                    const sortedGames = [...classGames].sort((a, b) => {
                        const aId = typeof a.id === 'number' ? a.id : parseFloat(String(a.id));
                        const bId = typeof b.id === 'number' ? b.id : parseFloat(String(b.id));
                        return aId - bId;
                    });

                    let repairedCount = 0;
                    const minLength = Math.min(excelGames.length, sortedGames.length);

                    // 엑셀 경기 기록과 현재 경기 데이터를 순서대로 매칭
                    for (let i = 0; i < minLength; i++) {
                        const excelGame = excelGames[i];
                        const game = sortedGames[i];

                        const p1 = studentNameMap.get(excelGame.player1Name);
                        const p2 = studentNameMap.get(excelGame.player2Name);

                        if (p1 && p2 && p1.id !== p2.id) {
                            const oldP1Id = game.player1Id;
                            const oldP2Id = game.player2Id;

                            if (oldP1Id !== p1.id || oldP2Id !== p2.id) {
                                game.player1Id = p1.id as number;
                                game.player2Id = p2.id as number;
                                repairedCount++;
                                this.log(`경기 ${i + 1} 복구 (엑셀): player1Id ${oldP1Id} -> ${p1.id} (${p1.name}), player2Id ${oldP2Id} -> ${p2.id} (${p2.name})`);
                            }
                        } else {
                            if (!p1) {
                                this.log(`⚠️ 경기 ${i + 1}: 선수1 "${excelGame.player1Name}"을(를) 찾을 수 없습니다.`);
                            }
                            if (!p2) {
                                this.log(`⚠️ 경기 ${i + 1}: 선수2 "${excelGame.player2Name}"을(를) 찾을 수 없습니다.`);
                            }
                        }
                    }

                    if (repairedCount > 0) {
                        this.log(`✅ 엑셀 파일을 이용한 경기 데이터 복구 완료: ${repairedCount}개 경기 수정됨`);
                        this.saveData();
                        resolve();
                    } else {
                        this.log('엑셀 파일과 현재 경기 데이터가 이미 일치하거나 매칭할 수 없습니다.');
                        resolve();
                    }
                } catch (error) {
                    this.logError('엑셀 파일 읽기 오류:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
            };

            reader.readAsArrayBuffer(file);
        });
    }
}

// ========================================
// 팩토리 함수
// ========================================

/**
 * LeagueManager 인스턴스를 생성합니다.
 * @param leagueData 리그전 데이터
 * @param options 리그전 관리 옵션
 * @returns LeagueManager 인스턴스
 */
export function initializeLeagueManager(leagueData: LeagueData, options?: LeagueManagerOptions): LeagueManager {
    return new LeagueManager(leagueData, options);
}

// ========================================
// 기본 내보내기
// ========================================

export default LeagueManager;
