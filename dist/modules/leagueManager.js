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
import { validateData, LeagueClassSchema, LeagueStudentSchema } from './validators.js';
import { showError, showSuccess } from './errorHandler.js';
import { setInnerHTMLSafe } from './utils.js';
import { logger, logError } from './logger.js';
// ========================================
// LeagueManager 클래스
// ========================================
/**
 * 리그전 수업을 관리하는 클래스
 */
export class LeagueManager {
    /**
     * LeagueManager 인스턴스를 생성합니다.
     * @param leagueData 리그전 데이터
     * @param options 리그전 관리 옵션
     */
    constructor(leagueData, options = {}) {
        this.dataManager = null; // DataManager 인스턴스
        this.saveCallback = null;
        this.dataUpdateCallback = null;
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
    setDataManager(dataManager) {
        this.dataManager = dataManager;
    }
    /**
     * 저장 콜백을 설정합니다.
     * @param callback 저장 콜백 함수
     */
    setSaveCallback(callback) {
        this.saveCallback = callback;
    }
    /**
     * 데이터 업데이트 콜백을 설정합니다.
     * @param callback 데이터 업데이트 콜백 함수
     */
    setDataUpdateCallback(callback) {
        this.dataUpdateCallback = callback;
    }
    /**
     * 데이터를 저장합니다.
     */
    async saveData() {
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
    renderLeagueUI() {
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
            }
            else {
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
                // setInnerHTMLSafe 이후 약간의 지연을 주어 DOM이 완전히 업데이트되도록 함
                setTimeout(() => {
                    const createBtn = this.getElement('#createLeagueClassBtn');
                    if (createBtn) {
                        // 기존 리스너 제거 (중복 방지)
                        const newBtn = createBtn.cloneNode(true);
                        createBtn.parentNode?.replaceChild(newBtn, createBtn);
                        newBtn.addEventListener('click', () => {
                            this.log('createLeagueClassBtn 클릭 이벤트 발생');
                            if (typeof window.leagueManager?.createClass === 'function') {
                                this.log('window.leagueManager.createClass 호출');
                                window.leagueManager.createClass();
                            }
                            else {
                                this.log('❌ window.leagueManager.createClass가 함수가 아님:', typeof window.leagueManager?.createClass);
                                // 직접 호출
                                this.createClass();
                            }
                        });
                        logger.debug('createLeagueClassBtn 이벤트 리스너 등록 완료');
                    }
                    else {
                        logError('❌ createLeagueClassBtn 요소를 찾을 수 없음');
                    }
                }, 0);
            }
            else {
                logError('❌ sidebar-form-container 요소를 찾을 수 없음');
            }
            this.renderClassList();
            logger.debug('반 목록 렌더링 완료');
            const selectedClass = this.leagueData.classes.find(c => c.id === this.leagueData.selectedClassId);
            logger.debug('선택된 반:', selectedClass);
            if (selectedClass) {
                logger.debug('대시보드 렌더링 시작...');
                this.renderLeagueDashboard(selectedClass);
                logger.debug('대시보드 렌더링 완료');
            }
            else {
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
                }
                else {
                    logError('❌ content-wrapper 요소를 찾을 수 없음');
                }
            }
            logger.debug('=== LeagueManager.renderLeagueUI() 완료 ===');
        }
        catch (error) {
            logError('❌ LeagueManager.renderLeagueUI() 오류:', error);
            throw error;
        }
    }
    /**
     * 반 목록을 렌더링합니다.
     */
    renderClassList() {
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
        setTimeout(() => {
            const cards = classList.querySelectorAll('.list-card');
            cards.forEach(card => {
                const classId = card.getAttribute('data-class-id');
                if (!classId)
                    return;
                // 카드 클릭 시 반 선택
                card.addEventListener('click', (e) => {
                    // 버튼 클릭이 아닌 경우에만 반 선택
                    if (e.target.closest('button')) {
                        return;
                    }
                    this.selectClass(parseInt(classId));
                });
                // 메모 버튼
                const editNoteBtn = card.querySelector('[data-action="edit-note"]');
                if (editNoteBtn) {
                    editNoteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof window.editClassNote === 'function') {
                            window.editClassNote(parseInt(classId));
                        }
                        else {
                            this.log('❌ editClassNote 함수를 찾을 수 없음');
                        }
                    });
                }
                // 수정 버튼
                const editNameBtn = card.querySelector('[data-action="edit-name"]');
                if (editNameBtn) {
                    editNameBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (typeof window.editClassName === 'function') {
                            window.editClassName(parseInt(classId));
                        }
                        else {
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
                    newDeleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const btnClassId = newDeleteBtn.getAttribute('data-class-id');
                        this.log('삭제 버튼 클릭, classId:', btnClassId || classId);
                        // ID를 숫자로 변환
                        const numericId = parseInt(btnClassId || classId, 10);
                        if (isNaN(numericId)) {
                            this.log('❌ 잘못된 ID:', btnClassId || classId);
                            showError(new Error('잘못된 반 ID입니다.'));
                            return;
                        }
                        // window.deleteClass가 있으면 사용, 없으면 직접 호출
                        if (typeof window.deleteClass === 'function') {
                            this.log('window.deleteClass 호출, ID:', numericId);
                            window.deleteClass(numericId);
                        }
                        else {
                            this.log('window.deleteClass가 없음, 직접 호출, ID:', numericId);
                            this.deleteClass(numericId);
                        }
                    });
                }
            });
            this.log('반 목록 이벤트 리스너 등록 완료, 카드 수:', cards.length);
        }, 0);
    }
    /**
     * 리그전 대시보드를 렌더링합니다.
     * @param selectedClass 선택된 반
     */
    renderLeagueDashboard(selectedClass) {
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
        setTimeout(() => {
            this.renderGamesTable();
            this.renderRankingsTable();
            this.renderGameStats();
            // 일정 생성 버튼 상태 초기화
            const classGames = this.leagueData.games.filter(g => g.classId === this.leagueData.selectedClassId);
            this.updateGenerateGamesButtonState(classGames.length > 0);
        }, 0);
    }
    /**
     * 반을 생성합니다.
     */
    createClass() {
        this.log('createClass 호출됨');
        // 여러 방법으로 input 요소 찾기 시도
        let input = this.getElement('#className');
        // 첫 번째 시도가 실패하면 formContainer 내부에서 찾기
        if (!input) {
            const formContainer = this.getElement('#sidebar-form-container');
            if (formContainer) {
                input = formContainer.querySelector('#className');
                this.log('formContainer 내부에서 #className 찾기 시도:', !!input);
                // 여전히 못 찾으면 placeholder로 찾기
                if (!input) {
                    input = formContainer.querySelector('input[placeholder="새로운 반(팀) 이름"]');
                    this.log('placeholder로 찾기 시도:', !!input);
                }
                // 여전히 못 찾으면 첫 번째 input 찾기
                if (!input) {
                    input = formContainer.querySelector('input[type="text"]');
                    this.log('첫 번째 text input 찾기 시도:', !!input);
                }
            }
        }
        // 여전히 못 찾으면 document에서 직접 찾기
        if (!input) {
            input = document.querySelector('#className');
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
        const name = input.value.trim();
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
            id: Date.now(),
            name,
            note: ''
        };
        this.log('새 반 데이터 생성:', newClassData);
        const validation = validateData(LeagueClassSchema, newClassData);
        if (!validation.success) {
            this.log('❌ 데이터 검증 실패:', validation.errors || validation.formattedErrors);
            if (validation.errors) {
                showError(validation.errors);
            }
            else if (validation.formattedErrors) {
                showError(new Error(validation.formattedErrors.join(', ')));
            }
            else {
                showError(new Error('데이터 검증에 실패했습니다.'));
            }
            return;
        }
        // 검증 통과 후 추가
        const newClass = validation.data;
        this.log('검증 통과, 반 추가 중:', newClass);
        this.leagueData.classes.push(newClass);
        this.log('반 추가 완료, 현재 반 수:', this.leagueData.classes.length);
        input.value = '';
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
    selectClass(id) {
        const classId = typeof id === 'string' ? parseInt(id) : id;
        this.leagueData.selectedClassId = classId;
        const liveRankingBtn = this.getElement('#liveRankingBtn');
        if (liveRankingBtn) {
            liveRankingBtn.classList.remove('hidden');
        }
        this.saveData();
        // UI 직접 업데이트
        this.renderClassList();
        this.renderLeagueUI();
    }
    /**
     * 반을 삭제합니다.
     * @param id 반 ID (숫자 또는 문자열)
     */
    deleteClass(id) {
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
                const liveRankingBtn = this.getElement('#liveRankingBtn');
                if (liveRankingBtn) {
                    liveRankingBtn.classList.add('hidden');
                }
            }
            this.saveData();
            this.log('데이터 저장 완료, UI 업데이트 시작');
            this.renderClassList();
            this.renderLeagueUI();
            this.log('deleteClass 완료');
            showSuccess('반이 삭제되었습니다.');
        }
        else {
            this.log('삭제 취소됨');
        }
    }
    /**
     * 학생을 추가합니다.
     */
    addStudent() {
        const input = this.getElement('#studentName');
        if (!input)
            return;
        const name = input.value.trim();
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
            id: Date.now(),
            name,
            classId,
            note: ''
        };
        const validation = validateData(LeagueStudentSchema, studentData);
        if (!validation.success) {
            if (validation.errors) {
                showError(validation.errors);
            }
            else if (validation.formattedErrors) {
                showError(new Error(validation.formattedErrors.join(', ')));
            }
            else {
                showError(new Error('데이터 검증에 실패했습니다.'));
            }
            return;
        }
        // 검증 통과 후 추가
        const student = validation.data;
        this.leagueData.students.push(student);
        input.value = '';
        this.saveData();
        this.renderStudentList();
        this.renderClassList(); // 학생 수 변경을 반영하기 위해 반 목록도 다시 렌더링
        showSuccess('학생이 추가되었습니다.');
    }
    /**
     * 학생을 일괄 추가합니다.
     */
    bulkAddStudents() {
        const names = prompt('학생 이름을 쉼표로 구분하여 입력하세요:');
        if (!names)
            return;
        const classId = this.leagueData.selectedClassId;
        if (!classId)
            return;
        const nameList = names.split(',').map(name => name.trim()).filter(name => name);
        let addedCount = 0;
        nameList.forEach(name => {
            if (!this.leagueData.students.some(s => s.name === name && s.classId === classId)) {
                this.leagueData.students.push({
                    id: Date.now() + Math.random(),
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
        }
        else {
            alert('추가할 수 있는 학생이 없습니다.');
        }
    }
    /**
     * 학생 목록을 렌더링합니다.
     */
    renderStudentList() {
        const container = this.getElement('#studentListGrid');
        if (!container)
            return;
        const classId = this.leagueData.selectedClassId;
        if (!classId)
            return;
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
    removeStudent(id) {
        this.leagueData.students = this.leagueData.students.filter(s => s.id !== id);
        this.leagueData.games = this.leagueData.games.filter(g => g.player1Id !== id && g.player2Id !== id);
        this.saveData();
        this.renderStudentList();
        this.renderClassList(); // 학생 수 변경을 반영하기 위해 반 목록도 다시 렌더링
        this.renderGamesTable();
        this.renderRankingsTable();
    }
    /**
     * 학생 이름을 수정합니다.
     * @param id 학생 ID
     */
    editStudentName(id) {
        const student = this.leagueData.students.find(s => s.id === id);
        if (!student)
            return;
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
    editStudentNote(id) {
        const student = this.leagueData.students.find(s => s.id === id);
        if (!student)
            return;
        const newNote = prompt(`${student.name} - 메모:`, student.note || '');
        if (newNote !== null) {
            student.note = newNote.trim();
            this.saveData();
            this.renderStudentList();
        }
    }
    /**
     * 반 메모를 수정합니다.
     * @param id 반 ID
     */
    editClassNote(id) {
        const classItem = this.leagueData.classes.find(c => c.id === id);
        if (!classItem)
            return;
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
    editClassName(id) {
        const classItem = this.leagueData.classes.find(c => c.id === id);
        if (!classItem)
            return;
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
    generateGames() {
        const classId = this.leagueData.selectedClassId;
        if (!classId)
            return;
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
        const newGames = [];
        for (let r = 0; r < numRounds; r++) {
            for (let i = 0; i < gamesPerRound; i++) {
                const player1 = schedulePlayers[i];
                const player2 = schedulePlayers[numPlayers - 1 - i];
                if (player1 && player2 && player1.id !== -1 && player2.id !== -1) {
                    const p1_index = players.findIndex(p => p.id === player1.id);
                    const p2_index = players.findIndex(p => p.id === player2.id);
                    newGames.push({
                        id: Date.now() + Math.random(),
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
            schedulePlayers.splice(1, 0, schedulePlayers.pop());
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
    updateLeagueScore(gameId, player, score) {
        const game = this.leagueData.games.find(g => g.id === gameId);
        if (!game)
            return;
        const scoreValue = parseInt(score) || 0;
        if (player === 'player1') {
            game.player1Score = scoreValue;
        }
        else if (player === 'player2') {
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
    updateGameNote(gameId, note) {
        const game = this.leagueData.games.find(g => g.id === gameId);
        if (!game)
            return;
        game.note = note;
        this.saveData();
    }
    /**
     * 게임 강조를 토글합니다.
     * @param gameId 게임 ID
     */
    toggleGameHighlight(gameId) {
        logger.debug('toggleGameHighlight 호출됨, gameId:', gameId, 'type:', typeof gameId);
        const game = this.leagueData.games.find(g => g.id === gameId);
        logger.debug('찾은 게임:', game);
        if (game) {
            game.isHighlighted = !game.isHighlighted;
            logger.debug('게임 강조 상태 변경:', game.isHighlighted);
            this.saveData();
            this.renderGamesTable();
        }
        else {
            logError('게임을 찾을 수 없음, gameId:', gameId);
            logger.debug('사용 가능한 게임 ID들:', this.leagueData.games.map(g => g.id));
        }
    }
    /**
     * 모든 강조를 해제합니다.
     */
    clearAllHighlights() {
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
    updateGenerateGamesButtonState(hasGames) {
        const button = this.getElement('#generateGamesBtn');
        if (!button)
            return;
        if (hasGames) {
            // 일정이 이미 있으면 버튼 숨기기 (일정 재생성 버튼 제거)
            button.style.display = 'none';
        }
        else {
            // 일정이 없으면 '일정 생성' 버튼 표시
            button.style.display = '';
            button.textContent = '일정 생성';
            button.setAttribute('data-tooltip', '현재 학생 명단으로 새 경기 일정을 생성합니다.');
        }
    }
    /**
     * 경기 테이블을 렌더링합니다.
     * @param isReadOnly 읽기 전용 여부
     */
    renderGamesTable(isReadOnly = false) {
        this.log('renderGamesTable 호출됨');
        const container = this.getElement('#gamesTableContent');
        if (!container) {
            this.logError('gamesTableContent 요소를 찾을 수 없음');
            return;
        }
        const classId = this.leagueData.selectedClassId;
        this.log('renderGamesTable - classId:', classId);
        if (!classId) {
            this.logError('classId가 없습니다');
            return;
        }
        const classGames = this.leagueData.games.filter(g => String(g.classId) === String(classId));
        this.log('renderGamesTable - classGames.length:', classGames.length);
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
        html += classGames.map((game, i) => {
            const p1 = this.leagueData.students.find(s => s.id === game.player1Id);
            const p2 = this.leagueData.students.find(s => s.id === game.player2Id);
            if (!p1 || !p2)
                return '';
            const score1 = game.player1Score ?? '';
            const score2 = game.player2Score ?? '';
            const note = game.note || '';
            return `<tr class="${game.isHighlighted ? 'highlighted-row' : ''}" data-game-id="${game.id}">
                <td style="text-align: center;" ${!isReadOnly ? `onclick="window.toggleGameHighlight(${game.id})"` : ''} data-tooltip="경기 번호 강조" data-tooltip-align="left">
                    <span class="game-number ${game.isHighlighted ? 'highlighted-number' : ''}">${i + 1}</span>
                </td>
                <td style="font-weight: 500;">${p1.name}</td>
                <td style="text-align: center;">
                    ${isReadOnly ?
                `<span style="font-weight: 500; color: var(--ink);">${score1}</span>` :
                `<input type="number" class="score" value="${score1}" onchange="window.leagueManager.updateLeagueScore(${game.id}, 'player1', this.value)">`}
                </td>
                <td style="text-align: center; font-weight: bold; color: var(--ink-muted); font-size: 0.9rem;">vs</td>
                <td style="text-align: center;">
                    ${isReadOnly ?
                `<span style="font-weight: 500; color: var(--ink);">${score2}</span>` :
                `<input type="number" class="score" value="${score2}" onchange="window.leagueManager.updateLeagueScore(${game.id}, 'player2', this.value)">`}
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
                `<input type="text" class="game-note" value="${note}" onchange="window.leagueManager.updateGameNote(${game.id}, this.value)" placeholder="메모 입력" style="width: 90%;">`}
                </td>
            </tr>`;
        }).join('');
        html += '</tbody></table>';
        setInnerHTMLSafe(container, html);
    }
    /**
     * 순위표를 렌더링합니다.
     * @param targetEl 대상 요소
     */
    renderRankingsTable(targetEl) {
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
        }
        else {
            if (container.tagName.toLowerCase() === 'table') {
                setInnerHTMLSafe(container, tableContent);
            }
            else {
                setInnerHTMLSafe(container, `<table class="styled-table">${tableContent}</table>`);
            }
        }
    }
    /**
     * 순위 데이터를 가져옵니다.
     * @param classId 반 ID
     * @returns 순위 데이터 배열
     */
    getRankingsData(classId) {
        if (!classId)
            return [];
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
                else
                    return;
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
        }).sort((a, b) => b.points - a.points || b.wins - a.wins);
    }
    /**
     * 게임 통계를 렌더링합니다.
     */
    renderGameStats() {
        const container = this.getElement('#gameStatsContainer');
        if (!container)
            return;
        const classId = this.leagueData.selectedClassId;
        if (!classId)
            return;
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
    exportAllLeaguesToExcel() {
        if (typeof window.exportToExcel === 'function') {
            const data = this.leagueData.classes.map(classItem => {
                const students = this.leagueData.students.filter(s => s.classId === classItem.id);
                const games = this.leagueData.games.filter(g => g.classId === classItem.id);
                const rankings = this.getRankingsData(classItem.id);
                return {
                    className: classItem.name,
                    students: students.map(s => s.name),
                    games: games.map(g => {
                        const p1 = students.find(s => s.id === g.player1Id);
                        const p2 = students.find(s => s.id === g.player2Id);
                        return {
                            player1: p1?.name || 'Unknown',
                            player2: p2?.name || 'Unknown',
                            player1Score: g.player1Score,
                            player2Score: g.player2Score,
                            note: g.note,
                            isCompleted: g.isCompleted
                        };
                    }),
                    rankings: rankings.map((r, index) => ({
                        rank: index + 1,
                        name: r.name,
                        wins: r.wins,
                        losses: r.losses,
                        draws: r.draws,
                        points: r.points,
                        gamesPlayed: r.gamesPlayed
                    }))
                };
            });
            window.exportToExcel(data, '리그전_데이터');
        }
    }
    /**
     * 사이드바를 정리합니다.
     */
    cleanupSidebar() {
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
    getElement(selector) {
        try {
            return document.querySelector(selector);
        }
        catch (error) {
            this.logError('DOM 요소 조회 오류:', error);
            return null;
        }
    }
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param args 추가 인수
     */
    log(message, ...args) {
        logger.debug(`[LeagueManager] ${message}`, ...args);
    }
    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    logError(message, ...args) {
        logError(`[LeagueManager] ${message}`, ...args);
    }
    /**
     * 현재 리그전 데이터를 반환합니다.
     * @returns 리그전 데이터
     */
    getLeagueData() {
        return this.leagueData;
    }
    /**
     * 리그전 데이터를 설정합니다.
     * @param data 리그전 데이터
     */
    setLeagueData(data) {
        this.leagueData = data;
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
export function initializeLeagueManager(leagueData, options) {
    return new LeagueManager(leagueData, options);
}
// ========================================
// 기본 내보내기
// ========================================
export default LeagueManager;
//# sourceMappingURL=leagueManager.js.map