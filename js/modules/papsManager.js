/**
 * PAPS 수업 관리 모듈
 *
 * 이 모듈은 PAPS(Physical Activity Promotion System) 수업의 모든 기능을 관리합니다.
 * PAPS 반 생성/삭제, 학생 관리, 체력 측정 기록, 평가 기준 적용 등을 담당합니다.
 *
 * 현재 지원하는 기능:
 * - PAPS 반 관리 (생성, 수정, 삭제)
 * - 학생 명단 관리 (추가, 삭제, 엑셀 업로드)
 * - 체력 측정 기록 입력 및 등급 계산
 * - PAPS 평가 기준 적용 (2024년 기준)
 * - 엑셀 내보내기/가져오기
 * - 차트 및 통계 분석
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
/**
 * PAPS 관리자 클래스
 */
export class PapsManager {
    constructor(papsData, $, saveDataCallback) {
        this.papsData = papsData;
        this.$ = $;
        this.saveDataCallback = saveDataCallback;
    }
    /**
     * PAPS UI를 렌더링합니다.
     */
    renderPapsUI() {
        this.cleanupSidebar();
        this.$('#sidebarTitle').textContent = 'PAPS 반 목록';
        const formHtml = `
            <div class="sidebar-form-group">
                <input id="papsClassName" type="text" placeholder="새로운 반 이름">
                <button onclick="window.papsManager.createPapsClass()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
        `;
        this.$('#sidebar-form-container').innerHTML = formHtml;
        this.renderPapsClassList();
        const selected = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!selected) {
            this.$('#content-wrapper').innerHTML = `
                <div class="placeholder-view"><div class="placeholder-content">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/></svg>
                    <h3>PAPS 반을 선택하거나 추가하세요</h3>
                    <p>왼쪽에서 반을 선택하거나 생성해주세요.</p>
                </div></div>`;
        }
        else {
            this.renderPapsDashboard(selected);
        }
        this.setupPapsEventListeners();
    }
    /**
     * PAPS 반 목록을 렌더링합니다.
     */
    renderPapsClassList() {
        this.$('#sidebar-list-container').innerHTML = this.papsData.classes.map(c => `
            <div class="list-card ${c.id === this.papsData.activeClassId ? 'active' : ''}" onclick="window.papsManager.selectPapsClass(${c.id})">
                <div style="flex-grow:1;">
                    <div class="name">${c.name}</div>
                    <div class="details">${(c.students || []).length}명 · ${c.gradeLevel || '학년 미설정'}</div>
                </div>
                <div class="action-buttons row">
                    <button onclick="event.stopPropagation(); window.papsManager.showPapsSettings()" data-tooltip="설정 수정">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onclick="event.stopPropagation(); window.papsManager.deletePapsClass(${c.id})" data-tooltip="삭제">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
    /**
     * PAPS 반을 생성합니다.
     */
    createPapsClass() {
        const input = this.$('#papsClassName');
        const name = input.value.trim();
        if (!name)
            return;
        const newClass = {
            id: Date.now(),
            name,
            students: [],
            eventSettings: {}
        };
        this.papsData.classes.push(newClass);
        this.papsData.activeClassId = newClass.id;
        this.saveDataCallback();
        this.renderPapsUI();
        input.value = '';
    }
    /**
     * PAPS 반을 선택합니다.
     */
    selectPapsClass(id) {
        this.papsData.activeClassId = id;
        this.saveDataCallback();
        this.renderPapsUI();
    }
    /**
     * PAPS 반을 삭제합니다.
     */
    deletePapsClass(id) {
        if (typeof window.showModal === 'function') {
            window.showModal({
                title: '반 삭제',
                body: '이 반의 모든 PAPS 데이터가 삭제됩니다. 진행하시겠습니까?',
                actions: [
                    { text: '취소', callback: window.closeModal },
                    { text: '삭제', callback: () => {
                            this.papsData.classes = this.papsData.classes.filter(c => c.id !== id);
                            if (this.papsData.activeClassId === id) {
                                this.papsData.activeClassId = null;
                            }
                            this.saveDataCallback();
                            this.renderPapsUI();
                            window.closeModal();
                        } }
                ]
            });
        }
    }
    /**
     * PAPS 대시보드를 렌더링합니다.
     */
    renderPapsDashboard(cls) {
        // 설정이 완료되었는지 확인
        const hasSettings = cls.gradeLevel && cls.eventSettings &&
            Object.keys(cls.eventSettings).length > 0;
        if (!hasSettings) {
            this.$('#content-wrapper').innerHTML = `
                <div class="paps-setup-container">
                    <div class="setup-header">
                        <h2>PAPS 설정</h2>
                        <p>반 설정을 완료한 후 학생 데이터를 입력할 수 있습니다.</p>
                    </div>
                    <div class="setup-form">
                        <div class="form-group">
                            <label>학년 선택</label>
                            <select id="paps-grade-select">
                                <option value="">학년을 선택하세요</option>
                                <option value="초4">초등학교 4학년</option>
                                <option value="초5">초등학교 5학년</option>
                                <option value="초6">초등학교 6학년</option>
                                <option value="중1">중학교 1학년</option>
                                <option value="중2">중학교 2학년</option>
                                <option value="중3">중학교 3학년</option>
                                <option value="고1">고등학교 1학년</option>
                                <option value="고2">고등학교 2학년</option>
                                <option value="고3">고등학교 3학년</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>체력 측정 항목 설정</label>
                            <div class="paps-events-config">
                                ${Object.keys(PapsManager.PAPS_ITEMS).filter(k => k !== "체지방").map(category => {
                const item = PapsManager.PAPS_ITEMS[category];
                const current = cls.eventSettings?.[item.id] || item.options[0];
                return `<div class="paps-event-group">
                                        <label style="min-width:90px; color: var(--ink-muted);">${category}</label>
                                        <select data-paps-category="${item.id}">
                                            ${item.options.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o}</option>`).join('')}
                                        </select>
                                    </div>`;
            }).join('')}
                            </div>
                        </div>
                        <div class="form-actions">
                            <button id="paps-save-settings-btn" class="btn-primary">설정 저장</button>
                        </div>
                    </div>
                </div>
            `;
        }
        else {
            this.$('#content-wrapper').innerHTML = `
                <div class="paps-dashboard">
                    <div class="dashboard-header">
                        <h2>${cls.name}</h2>
                        <div class="dashboard-actions">
                            <button id="paps-add-student-btn" class="btn-secondary">학생 추가</button>
                            <button id="paps-delete-selected-btn" class="btn-danger">선택 삭제</button>
                            <button id="paps-show-charts-btn" class="btn-primary">그래프로 보기</button>
                        </div>
                    </div>
                    <div class="paps-table-container">
                        <table class="paps-table">
                            <thead id="paps-record-head"></thead>
                            <tbody id="paps-record-body"></tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        this.setupPapsDashboardEvents(cls);
    }
    /**
     * PAPS 테이블을 구성합니다.
     */
    buildPapsTable(cls) {
        const head = this.$('#paps-record-head');
        const body = this.$('#paps-record-body');
        // Header 구성
        let header1 = '<tr><th rowspan="2"><input type="checkbox" id="paps-select-all"></th><th rowspan="2">번호</th><th rowspan="2">이름</th><th rowspan="2">성별</th>';
        let header2 = '<tr>';
        Object.keys(PapsManager.PAPS_ITEMS).filter(k => k !== "체지방").forEach(category => {
            const item = PapsManager.PAPS_ITEMS[category];
            let eventName = cls.eventSettings?.[item.id] || item.options[0];
            // 성별에 따라 팔굽혀펴기 종목명 변경
            if (eventName === '팔굽혀펴기') {
                eventName = '팔굽혀펴기(남)';
            }
            if (eventName === '악력') {
                header1 += `<th colspan="2">${eventName}</th>`;
                header2 += `<th>왼손</th><th>오른손</th>`;
            }
            else {
                header1 += `<th rowspan="2">${eventName}</th>`;
            }
        });
        header1 += '<th rowspan="2">키(cm)</th><th rowspan="2">몸무게(kg)</th><th rowspan="2">BMI</th><th rowspan="2">종합 등급</th></tr>';
        header2 += '</tr>';
        head.innerHTML = header1 + header2;
        // 전체 선택 체크박스 이벤트
        this.$('#paps-select-all').addEventListener('change', (e) => {
            const target = e.target;
            body.querySelectorAll('.paps-row-checkbox').forEach((cb) => {
                cb.checked = target.checked;
            });
        });
        // Body 구성
        body.innerHTML = cls.students.map(st => `
            <tr data-sid="${st.id}">
                <td><input type="checkbox" class="paps-row-checkbox"></td>
                <td><input type="number" class="paps-input number" value="${st.number}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                <td><input type="text" class="paps-input name" value="${st.name}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                <td>
                    <select class="paps-input gender" onchange="window.papsManager.onPapsInput(event, ${cls.id})">
                        <option value="남자" ${st.gender === '남자' ? 'selected' : ''}>남</option>
                        <option value="여자" ${st.gender === '여자' ? 'selected' : ''}>여</option>
                    </select>
                </td>
                ${Object.keys(PapsManager.PAPS_ITEMS).filter(k => k !== "체지방").map(k => {
            const id = PapsManager.PAPS_ITEMS[k].id;
            const eventName = cls.eventSettings?.[id] || PapsManager.PAPS_ITEMS[k].options[0];
            if (eventName === '악력') {
                return `
                            <td><input type="number" class="paps-input rec" data-id="${id}_left" value="${st.records?.[`${id}_left`] || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                            <td><input type="number" class="paps-input rec" data-id="${id}_right" value="${st.records?.[`${id}_right`] || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                        `;
            }
            else {
                return `<td><input type="number" class="paps-input rec" data-id="${id}" value="${st.records?.[id] || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>`;
            }
        }).join('')}
                <td><input type="number" class="paps-input height" value="${st.records?.height || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                <td><input type="number" class="paps-input weight" value="${st.records?.weight || ''}" onchange="window.papsManager.onPapsInput(event, ${cls.id})"></td>
                <td class="grade-cell" data-id="bodyfat"></td>
                <td class="grade-cell overall-grade"></td>
            </tr>
        `).join('');
        // 각 행의 등급 계산
        body.querySelectorAll('tr').forEach(tr => {
            if (cls) {
                this.updatePapsRowGrades(tr, cls);
            }
        });
    }
    /**
     * PAPS 입력 이벤트를 처리합니다.
     */
    onPapsInput(e, classId) {
        const target = e.target;
        const tr = target.closest('tr');
        if (!tr)
            return;
        const sid = Number(tr.dataset.sid);
        const cls = this.papsData.classes.find(c => c.id === classId);
        const st = cls?.students.find(s => s.id === sid);
        if (!st)
            return;
        st.records = st.records || {};
        if (target.classList.contains('number')) {
            st.number = Number(target.value);
        }
        else if (target.classList.contains('name')) {
            st.name = target.value;
        }
        else if (target.classList.contains('gender')) {
            st.gender = target.value;
        }
        else if (target.classList.contains('rec')) {
            const dataId = target.getAttribute('data-id');
            if (dataId) {
                st.records[dataId] = Number(target.value);
            }
        }
        else if (target.classList.contains('height')) {
            st.records.height = Number(target.value);
        }
        else if (target.classList.contains('weight')) {
            st.records.weight = Number(target.value);
        }
        if (cls) {
            this.updatePapsRowGrades(tr, cls);
        }
        this.saveDataCallback();
    }
    /**
     * PAPS 행의 등급을 업데이트합니다.
     */
    updatePapsRowGrades(tr, cls) {
        const sid = Number(tr.dataset.sid);
        const st = cls.students.find(s => s.id === sid);
        if (!st)
            return;
        // BMI 계산
        const height = parseFloat(tr.querySelector('.height')?.value || '');
        const weight = parseFloat(tr.querySelector('.weight')?.value || '');
        const bmi = height && weight ? (weight / Math.pow(height / 100, 2)) : 0;
        // 등급 셀 초기화
        tr.querySelectorAll('.grade-cell').forEach(td => {
            td.textContent = '';
            td.className = 'grade-cell';
        });
        // 각 항목별 등급 계산
        Object.keys(PapsManager.PAPS_ITEMS).forEach(k => {
            const id = PapsManager.PAPS_ITEMS[k].id;
            const eventName = cls.eventSettings?.[id] || PapsManager.PAPS_ITEMS[k].options[0];
            if (id === 'bodyfat') {
                const value = bmi;
                const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                const gradeText = this.calcPapsGrade(id, value, st.gender, cls.gradeLevel || '', cls);
                if (td) {
                    td.textContent = gradeText || '';
                    if (gradeText) {
                        td.classList.add(`grade-${gradeText}`);
                    }
                }
            }
            else if (eventName === '악력') {
                const leftValue = parseFloat(tr.querySelector(`.rec[data-id="${id}_left"]`)?.value || '');
                const rightValue = parseFloat(tr.querySelector(`.rec[data-id="${id}_right"]`)?.value || '');
                const leftTd = tr.querySelector(`.grade-cell[data-id="${id}_left"]`);
                const rightTd = tr.querySelector(`.grade-cell[data-id="${id}_right"]`);
                const leftGradeText = this.calcPapsGrade(id, leftValue, st.gender, cls.gradeLevel || '', cls);
                const rightGradeText = this.calcPapsGrade(id, rightValue, st.gender, cls.gradeLevel || '', cls);
                if (leftTd) {
                    leftTd.textContent = leftGradeText || '';
                    if (leftGradeText) {
                        leftTd.classList.add(`grade-${leftGradeText}`);
                    }
                }
                if (rightTd) {
                    rightTd.textContent = rightGradeText || '';
                    if (rightGradeText) {
                        rightTd.classList.add(`grade-${rightGradeText}`);
                    }
                }
            }
            else {
                const value = parseFloat(tr.querySelector(`.rec[data-id="${id}"]`)?.value || '');
                const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                const gradeText = this.calcPapsGrade(id, value, st.gender, cls.gradeLevel || '', cls);
                if (td) {
                    td.textContent = gradeText || '';
                    if (gradeText) {
                        td.classList.add(`grade-${gradeText}`);
                    }
                }
            }
        });
        // BMI 표시 업데이트
        const bmiTd = tr.querySelector('.grade-cell[data-id="bodyfat"]');
        if (bmiTd && bmi > 0) {
            bmiTd.textContent = bmi.toFixed(1);
        }
    }
    /**
     * PAPS 등급을 계산합니다.
     */
    calcPapsGrade(categoryId, value, gender, gradeLevel, cls) {
        if (value == null || isNaN(value) || !gender || !gradeLevel)
            return '';
        let selectedTest = null;
        if (categoryId === 'bodyfat') {
            selectedTest = 'BMI';
        }
        else {
            const catKey = Object.keys(PapsManager.PAPS_ITEMS).find(k => PapsManager.PAPS_ITEMS[k].id === categoryId);
            selectedTest = cls.eventSettings?.[categoryId] || (catKey ? PapsManager.PAPS_ITEMS[catKey].options[0] : '');
        }
        const criteria = PapsManager.PAPS_CRITERIA[gender]?.[gradeLevel]?.[selectedTest];
        if (!criteria)
            return '';
        for (const [min, max, grade] of criteria) {
            if (value >= min && value <= max) {
                return grade.toString();
            }
        }
        return '';
    }
    /**
     * PAPS 학생을 추가합니다.
     */
    addPapsStudent(cls) {
        const id = Date.now();
        cls.students.push({
            id,
            number: (cls.students?.length || 0) + 1,
            name: '',
            gender: '남자',
            records: {}
        });
    }
    /**
     * 선택된 PAPS 학생들을 삭제합니다.
     */
    deleteSelectedPapsStudents(cls) {
        const rows = Array.from(this.$('#paps-record-body').querySelectorAll('tr'));
        const keep = [];
        rows.forEach(r => {
            const checked = r.querySelector('.paps-row-checkbox')?.checked;
            const sid = Number(r.dataset.sid);
            if (!checked)
                keep.push(sid);
        });
        cls.students = (cls.students || []).filter(s => keep.includes(s.id));
        this.buildPapsTable(cls);
        this.saveDataCallback();
    }
    /**
     * PAPS 설정을 표시합니다.
     */
    showPapsSettings() {
        const selectedClass = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!selectedClass)
            return;
        if (typeof window.showModal === 'function') {
            window.showModal({
                title: 'PAPS 설정',
                body: `
                    <div class="paps-settings-modal">
                        <div class="form-group">
                            <label>학년 선택</label>
                            <select id="paps-grade-select-modal">
                                <option value="">학년을 선택하세요</option>
                                <option value="초4" ${selectedClass.gradeLevel === '초4' ? 'selected' : ''}>초등학교 4학년</option>
                                <option value="초5" ${selectedClass.gradeLevel === '초5' ? 'selected' : ''}>초등학교 5학년</option>
                                <option value="초6" ${selectedClass.gradeLevel === '초6' ? 'selected' : ''}>초등학교 6학년</option>
                                <option value="중1" ${selectedClass.gradeLevel === '중1' ? 'selected' : ''}>중학교 1학년</option>
                                <option value="중2" ${selectedClass.gradeLevel === '중2' ? 'selected' : ''}>중학교 2학년</option>
                                <option value="중3" ${selectedClass.gradeLevel === '중3' ? 'selected' : ''}>중학교 3학년</option>
                                <option value="고1" ${selectedClass.gradeLevel === '고1' ? 'selected' : ''}>고등학교 1학년</option>
                                <option value="고2" ${selectedClass.gradeLevel === '고2' ? 'selected' : ''}>고등학교 2학년</option>
                                <option value="고3" ${selectedClass.gradeLevel === '고3' ? 'selected' : ''}>고등학교 3학년</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>체력 측정 항목 설정</label>
                            <div class="paps-events-config">
                                ${Object.keys(PapsManager.PAPS_ITEMS).filter(k => k !== "체지방").map(category => {
                    const item = PapsManager.PAPS_ITEMS[category];
                    const current = selectedClass.eventSettings?.[item.id] || item.options[0];
                    return `<div class="paps-event-group">
                                        <label style="min-width:90px; color: var(--ink-muted);">${category}</label>
                                        <select data-paps-category="${item.id}">
                                            ${item.options.map(o => `<option value="${o}" ${o === current ? 'selected' : ''}>${o}</option>`).join('')}
                                        </select>
                                    </div>`;
                }).join('')}
                            </div>
                        </div>
                    </div>
                `,
                actions: [
                    { text: '취소', callback: window.closeModal },
                    { text: '저장', callback: () => this.savePapsSettings() }
                ]
            });
        }
    }
    /**
     * PAPS 설정을 저장합니다.
     */
    savePapsSettings() {
        const selectedClass = this.papsData.classes.find(c => c.id === this.papsData.activeClassId);
        if (!selectedClass)
            return;
        const gradeSelect = this.$('#paps-grade-select-modal');
        const eventSelects = this.$('#paps-grade-select-modal').parentElement?.querySelectorAll('[data-paps-category]');
        if (gradeSelect) {
            selectedClass.gradeLevel = gradeSelect.value;
        }
        if (eventSelects) {
            selectedClass.eventSettings = {};
            eventSelects.forEach(select => {
                const category = select.getAttribute('data-paps-category');
                if (category) {
                    selectedClass.eventSettings[category] = select.value;
                }
            });
        }
        this.saveDataCallback();
        this.renderPapsUI();
        if (typeof window.closeModal === 'function') {
            window.closeModal();
        }
    }
    /**
     * PAPS 이벤트 리스너를 설정합니다.
     */
    setupPapsEventListeners() {
        // 엑셀 버튼 이벤트 리스너 (중복 방지)
        const exportBtn = this.$('#exportAllPapsBtn');
        if (exportBtn && !exportBtn.dataset.listenerAdded) {
            exportBtn.addEventListener('click', () => this.exportAllPapsToExcel());
            exportBtn.dataset.listenerAdded = 'true';
        }
        const importInput = this.$('#importAllPapsExcel');
        if (importInput && !importInput.dataset.listenerAdded) {
            importInput.addEventListener('change', (e) => this.handleAllPapsExcelUpload(e));
            importInput.dataset.listenerAdded = 'true';
        }
    }
    /**
     * PAPS 대시보드 이벤트를 설정합니다.
     */
    setupPapsDashboardEvents(cls) {
        // 학생 추가 버튼
        const addBtn = this.$('#paps-add-student-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addPapsStudent(cls);
                this.buildPapsTable(cls);
                this.saveDataCallback();
            });
        }
        // 선택 삭제 버튼
        const deleteBtn = this.$('#paps-delete-selected-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSelectedPapsStudents(cls));
        }
        // 그래프 보기 버튼
        const chartsBtn = this.$('#paps-show-charts-btn');
        if (chartsBtn) {
            chartsBtn.addEventListener('click', () => {
                console.log('그래프로 보기 버튼 클릭됨');
                // 차트 렌더링 로직 추가 예정
            });
        }
        // 설정 저장 버튼
        const saveSettingsBtn = this.$('#paps-save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.savePapsSettings());
        }
    }
    /**
     * 사이드바를 정리합니다.
     */
    cleanupSidebar() {
        // 기존 이벤트 리스너 제거 및 요소 정리
        const listContainer = this.$('#sidebar-list-container');
        if (listContainer) {
            listContainer.innerHTML = '';
        }
    }
    /**
     * 모든 PAPS 데이터를 엑셀로 내보냅니다.
     */
    exportAllPapsToExcel() {
        if (!this.papsData || !this.papsData.classes || this.papsData.classes.length === 0) {
            alert('내보낼 PAPS 데이터가 없습니다.');
            return;
        }
        // 엑셀 내보내기 로직 구현 예정
        console.log('PAPS 전체 데이터 엑셀 내보내기');
    }
    /**
     * PAPS 엑셀 파일을 업로드합니다.
     */
    handleAllPapsExcelUpload(event) {
        const target = event.target;
        const file = target.files?.[0];
        if (!file)
            return;
        // 엑셀 업로드 로직 구현 예정
        console.log('PAPS 엑셀 파일 업로드:', file.name);
    }
    /**
     * PAPS 데이터를 가져옵니다.
     */
    getPapsData() {
        return this.papsData;
    }
    /**
     * PAPS 데이터를 설정합니다.
     */
    setPapsData(data) {
        this.papsData = data;
    }
}
// PAPS 평가 항목 데이터
PapsManager.PAPS_ITEMS = {
    "심폐지구력": { id: "endurance", options: ["왕복오래달리기", "오래달리기", "스텝검사"] },
    "유연성": { id: "flexibility", options: ["앉아윗몸앞으로굽히기", "종합유연성검사"] },
    "근력/근지구력": { id: "strength", options: ["악력", "팔굽혀펴기", "윗몸말아올리기"] },
    "민첩성": { id: "agility", options: ["50m 달리기", "제자리멀리뛰기", "던지기"] },
    "체지방": { id: "bodyfat", options: ["BMI"] }
};
// PAPS 평가 기준 데이터 (2024년 기준)
PapsManager.PAPS_CRITERIA = {
    "남자": {
        "초4": {
            "왕복오래달리기": [[96, 9999, 1], [69, 95, 2], [45, 68, 3], [26, 44, 4], [0, 25, 5]],
            "앉아윗몸앞으로굽히기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]],
            "제자리멀리뛰기": [[170.1, 9999, 1], [149.1, 170, 2], [130.1, 149, 3], [100.1, 130, 4], [0, 100, 5]],
            "팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]],
            "윗몸말아올리기": [[80, 9999, 1], [40, 79, 2], [22, 39, 3], [7, 21, 4], [0, 6, 5]],
            "악력": [[31, 9999, 1], [18.5, 30.9, 2], [15, 18.4, 3], [11.5, 14.9, 4], [0, 11.4, 5]],
            "50m 달리기": [[0, 8.8, 1], [8.81, 9.7, 2], [9.71, 10.5, 3], [10.51, 13.2, 4], [13.21, 9999, 5]],
            "오래달리기걷기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]],
            "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]],
            "던지기": [[25, 9999, 1], [22, 24.9, 2], [19, 21.9, 3], [16, 18.9, 4], [0, 15.9, 5]]
        },
        "초5": {
            "왕복오래달리기": [[100, 9999, 1], [73, 99, 2], [50, 72, 3], [29, 49, 4], [0, 28, 5]],
            "앉아윗몸앞으로굽히기": [[8, 9999, 1], [5, 7.9, 2], [1, 4.9, 3], [-4, 0.9, 4], [-999, -4.1, 5]],
            "제자리멀리뛰기": [[180.1, 9999, 1], [159.1, 180, 2], [141.1, 159, 3], [111.1, 141, 4], [0, 111, 5]],
            "팔굽혀펴기": [[0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5]],
            "윗몸말아올리기": [[80, 9999, 1], [40, 79, 2], [22, 39, 3], [10, 21, 4], [0, 9, 5]],
            "악력": [[31, 9999, 1], [23, 30.9, 2], [17, 22.9, 3], [12.5, 16.9, 4], [0, 12.4, 5]],
            "50m 달리기": [[0, 8.5, 1], [8.51, 9.4, 2], [9.41, 10.2, 3], [10.21, 13.2, 4], [13.21, 9999, 5]],
            "오래달리기걷기": [[0, 281, 1], [282, 324, 2], [325, 409, 3], [410, 479, 4], [480, 9999, 5]],
            "스텝검사": [[76, 9999, 1], [62, 75.9, 2], [52, 61.9, 3], [47, 51.9, 4], [0, 46.9, 5]],
            "던지기": [[28, 9999, 1], [25, 27.9, 2], [22, 24.9, 3], [19, 21.9, 4], [0, 18.9, 5]]
        }
        // 더 많은 학년 데이터는 필요에 따라 추가
    },
    "여자": {
    // 여자 데이터도 필요에 따라 추가
    }
};
// 전역 변수 설정
window.papsItems = PapsManager.PAPS_ITEMS;
//# sourceMappingURL=papsManager.js.map