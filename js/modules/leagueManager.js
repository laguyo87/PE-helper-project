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
        this.log('renderLeagueUI 시작');
        this.log('leagueData.classes.length:', this.leagueData.classes.length);
        this.log('leagueData:', this.leagueData);
        // 기존 요소들 정리
        this.cleanupSidebar();
        const sidebarTitle = this.getElement('#sidebarTitle');
        if (sidebarTitle) {
            sidebarTitle.textContent = '리그전 목록';
        }
        const isFirstTimeUser = this.leagueData.classes.length === 0;
        this.log('isFirstTimeUser:', isFirstTimeUser);
        const formHtml = `
            <div style="position: relative;" class="${isFirstTimeUser ? 'intro-container-active' : ''}">
                <div class="sidebar-form-group ${isFirstTimeUser ? 'intro-highlight' : ''}">
                    <input id="className" type="text" placeholder="새로운 반(팀) 이름">
                    <button onclick="window.leagueManager.createClass()" class="btn primary" data-tooltip="새로운 리그를 목록에 추가합니다.">
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
        if (formContainer) {
            formContainer.innerHTML = formHtml;
        }
        this.renderClassList();
        const selectedClass = this.leagueData.classes.find(c => c.id === this.leagueData.selectedClassId);
        if (selectedClass) {
            this.renderLeagueDashboard(selectedClass);
        }
        else {
            this.log('리그 데이터가 없음, 플레이스홀더 표시');
            const contentWrapper = this.getElement('#content-wrapper');
            if (contentWrapper) {
                contentWrapper.innerHTML = `
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
            }
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
            return `<div class="list-card ${isActive}" onclick="selectClass('${c.id || ''}')">
                <div style="flex-grow: 1;">
                    <div class="name">${c.name}</div>
                    <div class="details">${studentCount}명</div>
                </div>
                <div class="action-buttons row">
                    <button class="${hasNote}" onclick="event.stopPropagation(); editClassNote('${c.id || ''}')" data-tooltip="메모"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                    <button onclick="event.stopPropagation(); editClassName('${c.id || ''}')" data-tooltip="수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button onclick="event.stopPropagation(); deleteClass('${c.id || ''}');" data-tooltip="삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            </div>`;
        }).join('');
        classList.innerHTML = html;
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
        contentWrapper.innerHTML = htmlContent;
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
        const input = this.getElement('#className');
        if (!input)
            return;
        const name = input.value.trim();
        if (name && !this.leagueData.classes.some(c => c.name === name)) {
            const newClass = {
                id: Date.now(),
                name,
                note: ''
            };
            this.leagueData.classes.push(newClass);
            input.value = '';
            this.saveData();
            this.renderClassList(); // 반 목록 업데이트
            this.selectClass(newClass.id);
        }
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
     * @param id 반 ID
     */
    deleteClass(id) {
        if (confirm('반을 삭제하면 모든 학생과 경기 기록이 사라집니다. 정말 삭제하시겠습니까?')) {
            this.leagueData.classes = this.leagueData.classes.filter(c => c.id !== id);
            this.leagueData.students = this.leagueData.students.filter(s => s.classId !== id);
            this.leagueData.games = this.leagueData.games.filter(g => g.classId !== id);
            if (this.leagueData.selectedClassId === id) {
                this.leagueData.selectedClassId = null;
                const liveRankingBtn = this.getElement('#liveRankingBtn');
                if (liveRankingBtn) {
                    liveRankingBtn.classList.add('hidden');
                }
            }
            this.saveData();
            this.renderClassList();
            this.renderLeagueUI();
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
        if (name && classId && !this.leagueData.students.some(s => s.name === name && s.classId === classId)) {
            this.leagueData.students.push({
                id: Date.now(),
                name,
                classId,
                note: ''
            });
            input.value = '';
            this.saveData();
            this.renderStudentList();
            this.renderClassList(); // 학생 수 변경을 반영하기 위해 반 목록도 다시 렌더링
        }
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
        container.innerHTML = html;
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
        console.log('toggleGameHighlight 호출됨, gameId:', gameId, 'type:', typeof gameId);
        const game = this.leagueData.games.find(g => g.id === gameId);
        console.log('찾은 게임:', game);
        if (game) {
            game.isHighlighted = !game.isHighlighted;
            console.log('게임 강조 상태 변경:', game.isHighlighted);
            this.saveData();
            this.renderGamesTable();
        }
        else {
            console.error('게임을 찾을 수 없음, gameId:', gameId);
            console.log('사용 가능한 게임 ID들:', this.leagueData.games.map(g => g.id));
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
            button.textContent = '일정 재생성';
            button.setAttribute('data-tooltip', '기존 경기를 삭제하고 새로 생성합니다.');
        }
        else {
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
        container.innerHTML = html;
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
            container.innerHTML = `<div style="text-align:center; padding: 2rem;">반을 선택해주세요.</div>`;
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
            container.innerHTML = `<div style="text-align:center; padding: 2rem;">참가자가 없습니다.</div>`;
        }
        else {
            if (container.tagName.toLowerCase() === 'table') {
                container.innerHTML = tableContent;
            }
            else {
                container.innerHTML = `<table class="styled-table">${tableContent}</table>`;
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
        container.innerHTML = `
            <div class="game-stats">
                <span class="stat-item">총 경기: ${total}</span>
                <span class="stat-item">완료: ${completed}</span>
                <span class="stat-item">남은 경기: ${pending}</span>
                <span class="stat-item">진행률: ${((completed / total) * 100).toFixed(1)}%</span>
            </div>
        `;
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
        const elements = ['#classList', '#sidebar-form-container'];
        elements.forEach(selector => {
            const element = this.getElement(selector);
            if (element) {
                element.innerHTML = '';
            }
        });
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
        console.log(`[LeagueManager] ${message}`, ...args);
    }
    /**
     * 오류 로그를 출력합니다.
     * @param message 오류 메시지
     * @param args 추가 인수
     */
    logError(message, ...args) {
        console.error(`[LeagueManager] ${message}`, ...args);
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