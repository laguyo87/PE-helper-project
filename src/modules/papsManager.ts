/**
 * PAPS 수업 관리 모듈
 * 
 * 이 모듈은 PAPS(Physical Activity Promotion System) 수업의 모든 기능을 관리합니다.
 * PAPS 반 생성/삭제, 학생 관리, 기록 입력, 등급 계산, 엑셀 내보내기 등을 담당합니다.
 * 
 * 현재 지원하는 기능:
 * - PAPS 반 관리 (생성, 편집, 삭제, 선택)
 * - 학생 명단 관리 (추가, 삭제, 엑셀 업로드)
 * - PAPS 기록 입력 및 등급 계산
 * - 엑셀 내보내기/가져오기
 * - 차트 및 통계 생성
 * 
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */

// 타입 정의
export interface PapsStudent {
    id: number;
    number: number;
    name: string;
    gender: '남자' | '여자';
    records: Record<string, number>;
}

export interface PapsClass {
    id: number;
    name: string;
    gradeLevel: string;
    students: PapsStudent[];
    settings?: PapsSettings;
    eventSettings?: Record<string, string>;
}

export interface PapsSettings {
    gradeLevel: string;
    customCategories?: Record<string, any>;
}

export interface PapsData {
    classes: PapsClass[];
    activeClassId: number | null;
}

// PAPS 항목 정의
const PAPS_ITEMS: Record<string, { id: string; options: string[] }> = {
    "심폐지구력": { id: "endurance", options: ["왕복오래달리기", "오래달리기", "스텝검사"] },
    "유연성": { id: "flexibility", options: ["앉아윗몸앞으로굽히기", "종합유연성검사"] },
    "근력/근지구력": { id: "strength", options: ["악력", "팔굽혀펴기", "윗몸말아올리기"] },
    "순발력": { id: "power", options: ["제자리멀리뛰기", "50m 달리기"] },
    "체지방": { id: "bodyfat", options: ["BMI"] }
};

// PAPS 평가 기준 데이터 (2024년 기준)
const PAPS_CRITERIA_DATA: Record<string, any> = {
    "남자": {
        "초4": {
            "왕복오래달리기": { "1등급": [0, 20], "2등급": [21, 30], "3등급": [31, 40], "4등급": [41, 50], "5등급": [51, 100] },
            "오래달리기": { "1등급": [0, 5], "2등급": [6, 7], "3등급": [8, 9], "4등급": [10, 11], "5등급": [12, 100] },
            "스텝검사": { "1등급": [0, 90], "2등급": [91, 100], "3등급": [101, 110], "4등급": [111, 120], "5등급": [121, 1000] },
            "앉아윗몸앞으로굽히기": { "1등급": [0, 5], "2등급": [6, 10], "3등급": [11, 15], "4등급": [16, 20], "5등급": [21, 100] },
            "종합유연성검사": { "1등급": [0, 10], "2등급": [11, 15], "3등급": [16, 20], "4등급": [21, 25], "5등급": [26, 100] },
            "악력": { "1등급": [0, 15], "2등급": [16, 20], "3등급": [21, 25], "4등급": [26, 30], "5등급": [31, 100] },
            "팔굽혀펴기": { "1등급": [0, 10], "2등급": [11, 15], "3등급": [16, 20], "4등급": [21, 25], "5등급": [26, 100] },
            "윗몸말아올리기": { "1등급": [0, 15], "2등급": [16, 20], "3등급": [21, 25], "4등급": [26, 30], "5등급": [31, 100] },
            "제자리멀리뛰기": { "1등급": [0, 150], "2등급": [151, 170], "3등급": [171, 190], "4등급": [191, 210], "5등급": [211, 1000] },
            "50m 달리기": { "1등급": [0, 8], "2등급": [9, 9.5], "3등급": [10, 10.5], "4등급": [11, 11.5], "5등급": [12, 100] }
        }
        // 더 많은 학년 데이터는 실제 구현에서 추가
    },
    "여자": {
        "초4": {
            "왕복오래달리기": { "1등급": [0, 20], "2등급": [21, 30], "3등급": [31, 40], "4등급": [41, 50], "5등급": [51, 100] },
            "오래달리기": { "1등급": [0, 5], "2등급": [6, 7], "3등급": [8, 9], "4등급": [10, 11], "5등급": [12, 100] },
            "스텝검사": { "1등급": [0, 90], "2등급": [91, 100], "3등급": [101, 110], "4등급": [111, 120], "5등급": [121, 1000] },
            "앉아윗몸앞으로굽히기": { "1등급": [0, 5], "2등급": [6, 10], "3등급": [11, 15], "4등급": [16, 20], "5등급": [21, 100] },
            "종합유연성검사": { "1등급": [0, 10], "2등급": [11, 15], "3등급": [16, 20], "4등급": [21, 25], "5등급": [26, 100] },
            "악력": { "1등급": [0, 10], "2등급": [11, 15], "3등급": [16, 20], "4등급": [21, 25], "5등급": [26, 100] },
            "무릎대고팔굽혀펴기": { "1등급": [0, 10], "2등급": [11, 15], "3등급": [16, 20], "4등급": [21, 25], "5등급": [26, 100] },
            "윗몸말아올리기": { "1등급": [0, 15], "2등급": [16, 20], "3등급": [21, 25], "4등급": [26, 30], "5등급": [31, 100] },
            "제자리멀리뛰기": { "1등급": [0, 130], "2등급": [131, 150], "3등급": [151, 170], "4등급": [171, 190], "5등급": [191, 1000] },
            "50m 달리기": { "1등급": [0, 8.5], "2등급": [9, 9.5], "3등급": [10, 10.5], "4등급": [11, 11.5], "5등급": [12, 100] }
        }
        // 더 많은 학년 데이터는 실제 구현에서 추가
    },
    "BMI": {
        "남자": {
            "초4": { "정상": [14, 18.5], "과체중": [18.6, 23], "비만": [23.1, 100] },
            "초5": { "정상": [14, 19], "과체중": [19.1, 23.5], "비만": [23.6, 100] },
            "초6": { "정상": [14, 19.5], "과체중": [19.6, 24], "비만": [24.1, 100] },
            "중1": { "정상": [14, 20], "과체중": [20.1, 24.5], "비만": [24.6, 100] },
            "중2": { "정상": [14, 20.5], "과체중": [20.6, 25], "비만": [25.1, 100] },
            "중3": { "정상": [14, 21], "과체중": [21.1, 25.5], "비만": [25.6, 100] },
            "고1": { "정상": [14, 21.5], "과체중": [21.6, 26], "비만": [26.1, 100] },
            "고2": { "정상": [14, 22], "과체중": [22.1, 26.5], "비만": [26.6, 100] },
            "고3": { "정상": [14, 22.5], "과체중": [22.6, 27], "비만": [27.1, 100] }
        },
        "여자": {
            "초4": { "정상": [14, 18.5], "과체중": [18.6, 23], "비만": [23.1, 100] },
            "초5": { "정상": [14, 19], "과체중": [19.1, 23.5], "비만": [23.6, 100] },
            "초6": { "정상": [14, 19.5], "과체중": [19.6, 24], "비만": [24.1, 100] },
            "중1": { "정상": [14, 20], "과체중": [20.1, 24.5], "비만": [24.6, 100] },
            "중2": { "정상": [14, 20.5], "과체중": [20.6, 25], "비만": [25.1, 100] },
            "중3": { "정상": [14, 21], "과체중": [21.1, 25.5], "비만": [25.6, 100] },
            "고1": { "정상": [14, 21.5], "과체중": [21.6, 26], "비만": [26.1, 100] },
            "고2": { "정상": [14, 22], "과체중": [22.1, 26.5], "비만": [26.6, 100] },
            "고3": { "정상": [14, 22.5], "과체중": [22.6, 27], "비만": [27.1, 100] }
        }
    }
};

export class PapsManager {
    private papsData: PapsData;
    private $: (id: string) => HTMLElement;
    private saveDataToFirestore: () => void;
    private cleanupSidebar: () => void;

    constructor(
        papsData: PapsData,
        $: (id: string) => HTMLElement,
        saveDataToFirestore: () => void,
        cleanupSidebar: () => void
    ) {
        this.papsData = papsData;
        this.$ = $;
        this.saveDataToFirestore = saveDataToFirestore;
        this.cleanupSidebar = cleanupSidebar;
    }

    /**
     * PAPS UI를 렌더링합니다.
     */
    public renderPapsUI(): void {
        // 기존 요소들 정리
        this.cleanupSidebar();
        
        this.$('#sidebarTitle').textContent = 'PAPS 반 목록';
        const formHtml = `
            <div class="sidebar-form-group">
                <input id="papsClassName" type="text" placeholder="새로운 반 이름">
                <button onclick="papsManager.createPapsClass()" class="btn primary" data-tooltip="새로운 반을 추가합니다.">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>`;
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
        } else {
            this.renderPapsDashboard(selected);
        }
        
        // PAPS 엑셀 버튼 이벤트 리스너 (중복 방지)
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
     * PAPS 반 목록을 렌더링합니다.
     */
    public renderPapsClassList(): void {
        this.$('#sidebar-list-container').innerHTML = this.papsData.classes.map(c => `
            <div class="list-card ${c.id === this.papsData.activeClassId ? 'active' : ''}" onclick="papsManager.selectPapsClass(${c.id})">
                <div style="flex-grow:1;">
                    <div class="name">${c.name}</div>
                    <div class="details">${(c.students||[]).length}명 · ${c.gradeLevel||'학년 미설정'}</div>
                </div>
                <div class="action-buttons row">
                    <button onclick="event.stopPropagation(); papsManager.showPapsSettings()" data-tooltip="설정 수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick="event.stopPropagation(); papsManager.editPapsClass(${c.id})" data-tooltip="반 편집"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick="event.stopPropagation(); papsManager.deletePapsClass(${c.id})" data-tooltip="반 삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg></button>
                </div>
            </div>
        `).join('');
    }

    /**
     * PAPS 반을 생성합니다.
     */
    public createPapsClass(): void {
        const name = (this.$('#papsClassName') as HTMLInputElement).value.trim();
        if (!name) return;
        
        const id = Date.now();
        this.papsData.classes.push({
            id,
            name,
            gradeLevel: '1학년',
            students: []
        });
        
        (this.$('#papsClassName') as HTMLInputElement).value = '';
        this.saveDataToFirestore();
        this.renderPapsUI();
    }

    /**
     * PAPS 반을 편집합니다.
     */
    public editPapsClass(id: number): void {
        const cls = this.papsData.classes.find(c => c.id === id);
        if (!cls) return;

        const newName = prompt('반 이름을 입력하세요:', cls.name);
        if (newName && newName.trim() && newName.trim() !== cls.name) {
            cls.name = newName.trim();
            this.saveDataToFirestore();
            this.renderPapsUI();
        }
    }

    /**
     * PAPS 반을 삭제합니다.
     */
    public deletePapsClass(id: number): void {
        if (!confirm('정말로 이 반을 삭제하시겠습니까?')) return;
        
        this.papsData.classes = this.papsData.classes.filter(c => c.id !== id);
        if (this.papsData.activeClassId === id) {
            this.papsData.activeClassId = null;
        }
        this.saveDataToFirestore();
        this.renderPapsUI();
    }

    /**
     * PAPS 반을 선택합니다.
     */
    public selectPapsClass(id: number): void {
        this.papsData.activeClassId = id;
        this.saveDataToFirestore();
        this.renderPapsUI();
    }

    /**
     * PAPS 대시보드를 렌더링합니다.
     */
    public renderPapsDashboard(cls: PapsClass): void {
        // 설정이 완료되었는지 확인 (학년과 이벤트 설정이 모두 있는지)
        const hasSettings = cls.gradeLevel && cls.eventSettings && 
                           Object.keys(cls.eventSettings).length > 0;
        
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
                        ${Object.keys(PAPS_ITEMS).filter(k=>k!=="체지방").map(category => {
                            const item = PAPS_ITEMS[category];
                            const current = cls.eventSettings?.[item.id] || item.options[0];
                            return `<div class="paps-event-group"><label style="min-width:90px; color: var(--ink-muted);">${category}</label><select data-paps-category="${item.id}">${item.options.map(o => `<option value="${o}" ${o===current?'selected':''}>${o}</option>`).join('')}</select></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>`;
        }
        
        this.$('#content-wrapper').innerHTML = `
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
            (this.$('#paps-grade-select') as HTMLSelectElement).value = cls.gradeLevel || '';
            this.$('#content-wrapper').querySelectorAll('select[data-paps-category]').forEach(sel => {
                sel.addEventListener('change', e => {
                    const target = e.target as HTMLSelectElement;
                    if (!cls.eventSettings) cls.eventSettings = {};
                    cls.eventSettings[target.dataset.papsCategory!] = target.value;
                    this.saveDataToFirestore();
                    this.buildPapsTable(cls);
                });
            });
            (this.$('#paps-grade-select') as HTMLSelectElement).addEventListener('change', e => { 
                const target = e.target as HTMLSelectElement;
                cls.gradeLevel = target.value; 
                this.saveDataToFirestore(); 
                this.buildPapsTable(cls);
                // 좌측 사이드바의 반 카드도 실시간으로 업데이트
                this.renderPapsClassList();
            });
            this.$('#paps-download-template-btn').addEventListener('click', () => this.papsDownloadTemplate());
            this.$('#paps-load-list-btn').addEventListener('click', () => this.$('#paps-student-upload').click());
            (this.$('#paps-student-upload') as HTMLInputElement).addEventListener('change', e => this.handlePapsStudentUpload(e, cls));
            // 설정 저장 버튼 이벤트 리스너
            const saveSettingsBtn = this.$('#paps-save-settings-btn');
            if (saveSettingsBtn) {
                saveSettingsBtn.addEventListener('click', () => this.savePapsSettings());
            }
        }
        
        this.$('#paps-add-student-btn').addEventListener('click', () => { 
            this.addPapsStudent(cls); 
            this.buildPapsTable(cls); 
            this.saveDataToFirestore(); 
        });
        this.$('#paps-delete-selected-btn').addEventListener('click', () => this.deleteSelectedPapsStudents(cls));
        this.$('#paps-show-charts-btn').addEventListener('click', () => { 
            console.log('그래프로 보기 버튼 클릭됨');
            console.log('현재 클래스:', cls);
            console.log('테이블 행 수:', this.$('#paps-record-body').querySelectorAll('tr').length);
            
            try {
                this.renderPapsCharts(cls); 
                this.$('#paps-chart-section').style.display = 'block';
                console.log('차트 섹션 표시됨');
            } catch (error) {
                console.error('차트 렌더링 중 오류 발생:', error);
                alert('차트를 표시하는 중 오류가 발생했습니다: ' + (error as Error).message);
            }
        });
        this.$('#paps-hide-charts-btn').addEventListener('click', () => { 
            this.$('#paps-chart-section').style.display = 'none'; 
        });

        this.buildPapsTable(cls);
    }

    /**
     * PAPS 테이블을 구성합니다.
     */
    public buildPapsTable(cls: PapsClass): void {
        const head = this.$('#paps-record-head');
        const body = this.$('#paps-record-body');
        
        // Header build
        let header1 = '<tr><th rowspan="2"><input type="checkbox" id="paps-select-all"></th><th rowspan="2">번호</th><th rowspan="2">이름</th><th rowspan="2">성별</th>'; 
        let header2 = '<tr>';
        
        Object.keys(PAPS_ITEMS).filter(k=>k!=="체지방").forEach(category => {
            const item = PAPS_ITEMS[category]; 
            let eventName = cls.eventSettings?.[item.id] || item.options[0];
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
        header1 += '<th colspan="4">체지방</th>'; 
        header2 += '<th>신장(cm)</th><th>체중(kg)</th><th>BMI</th><th>등급</th>';
        header1 += '<th rowspan="2">종합 등급</th></tr>'; 
        header2 += '</tr>';
        head.innerHTML = header1 + header2;
        
        (this.$('#paps-select-all') as HTMLInputElement).addEventListener('change', function(){ 
            body.querySelectorAll('.paps-row-checkbox').forEach(cb => (cb as HTMLInputElement).checked = this.checked); 
        });

        // Body
        body.innerHTML = '';
        const students = (cls.students||[]).slice().sort((a,b)=> (a.number||0)-(b.number||0));
        students.forEach(st => {
            const tr = document.createElement('tr'); 
            tr.dataset.sid = st.id.toString();
            tr.innerHTML = `
                <td><input type="checkbox" class="paps-row-checkbox"></td>
                <td><input type="number" class="paps-input number" value="${st.number||''}"></td>
                <td><input type="text" class="paps-input name" value="${st.name||''}"></td>
                <td><select class="paps-input gender"><option value="남자" ${st.gender==='남자'?'selected':''}>남</option><option value="여자" ${st.gender==='여자'?'selected':''}>여</option></select></td>
                ${Object.keys(PAPS_ITEMS).filter(k=>k!=="체지방").map(k => {
                    const id = PAPS_ITEMS[k].id; 
                    const eventName = cls.eventSettings?.[id] || PAPS_ITEMS[k].options[0];
                    
                    // 악력 종목은 왼손/오른손으로 분리
                    if (eventName === '악력') {
                        const leftVal = (st.records||{})[`${id}_left`]||'';
                        const rightVal = (st.records||{})[`${id}_right`]||'';
                        return `<td><input type="number" step="any" class="paps-input rec" data-id="${id}_left" value="${leftVal}"></td><td class="grade-cell" data-id="${id}_left"></td><td><input type="number" step="any" class="paps-input rec" data-id="${id}_right" value="${rightVal}"></td><td class="grade-cell" data-id="${id}_right"></td>`;
                    } else {
                        const val = (st.records||{})[id]||''; 
                        return `<td><input type="number" step="any" class="paps-input rec" data-id="${id}" value="${val}"></td><td class="grade-cell" data-id="${id}"></td>`;
                    }
                }).join('')}
                <td><input type="number" step="any" class="paps-input height" value="${(st.records||{}).height||''}"></td>
                <td><input type="number" step="any" class="paps-input weight" value="${(st.records||{}).weight||''}"></td>
                <td class="bmi-cell"></td>
                <td class="grade-cell" data-id="bodyfat"></td>
                <td class="overall-grade-cell"></td>
            `;
            body.appendChild(tr);
            this.updatePapsRowGrades(tr, cls);
        });

        body.addEventListener('input', e => this.onPapsInput(e, cls));
        body.addEventListener('keydown', e => {
            if (e.key !== 'Enter' || !(e.target as HTMLElement).matches('input')) return; 
            e.preventDefault();
            const cell = (e.target as HTMLElement).closest('td'); 
            const row = (e.target as HTMLElement).closest('tr'); 
            if(!cell||!row) return; 
            const idx = Array.from(row.children).indexOf(cell); 
            const next = row.nextElementSibling; 
            if(next){ 
                const ncell = next.children[idx]; 
                const ninp = ncell?.querySelector('input'); 
                if(ninp){ 
                    (ninp as HTMLInputElement).focus(); 
                    (ninp as HTMLInputElement).select(); 
                }
            }
        });
    }

    /**
     * PAPS 입력을 처리합니다.
     */
    public onPapsInput(e: Event, cls: PapsClass): void {
        const target = e.target as HTMLElement;
        const tr = target.closest('tr'); 
        if (!tr) return; 
        const sid = Number(tr.dataset.sid); 
        const st = cls.students.find(s=>s.id===sid); 
        if(!st){ return; }
        
        st.records = st.records || {};
        if (target.classList.contains('rec')) { 
            st.records[(target as HTMLInputElement).dataset.id!] = Number((target as HTMLInputElement).value); 
        }
        else if (target.classList.contains('height')) { 
            st.records.height = Number((target as HTMLInputElement).value); 
        }
        else if (target.classList.contains('weight')) { 
            st.records.weight = Number((target as HTMLInputElement).value); 
        }
        else if (target.classList.contains('name')) { 
            st.name = (target as HTMLInputElement).value; 
        }
        else if (target.classList.contains('number')) { 
            st.number = Number((target as HTMLInputElement).value); 
        }
        else if (target.classList.contains('gender')) { 
            st.gender = (target as HTMLSelectElement).value as '남자' | '여자'; 
        }
        this.updatePapsRowGrades(tr as HTMLTableRowElement, cls); 
        this.saveDataToFirestore();
    }

    /**
     * PAPS 행 등급을 업데이트합니다.
     */
    public updatePapsRowGrades(tr: HTMLTableRowElement, cls: PapsClass): void {
        // BMI
        const h = parseFloat((tr.querySelector('.height') as HTMLInputElement)?.value||''); 
        const w = parseFloat((tr.querySelector('.weight') as HTMLInputElement)?.value||'');
        const bmiCell = tr.querySelector('.bmi-cell'); 
        let bmi = null; 
        if (h>0 && w>0){ 
            const m = h/100; 
            bmi = w/(m*m); 
            bmiCell!.textContent = bmi.toFixed(2); 
        } else { 
            bmiCell!.textContent = ''; 
        }
        
        // Each category
        const studentGender = (tr.querySelector('.gender') as HTMLSelectElement)?.value || '남자'; 
        const gradeLevel = cls.gradeLevel || '';
        tr.querySelectorAll('.grade-cell').forEach(td => { 
            td.textContent=''; 
            td.className='grade-cell'; 
        });
        
        Object.keys(PAPS_ITEMS).forEach(k => {
            const id = PAPS_ITEMS[k].id; 
            const eventName = cls.eventSettings?.[id] || PAPS_ITEMS[k].options[0];
            
            if (id === 'bodyfat') { 
                const value = bmi;
                const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                const gradeText = value ? this.calcPapsGrade(id, value, studentGender, gradeLevel, cls) : '';
                if (td) { 
                    td.textContent = gradeText||''; 
                    if(gradeText){ 
                        td.classList.add(`grade-${gradeText}`); 
                    } 
                }
            } else if (eventName === '악력') {
                // 악력은 왼손과 오른손 각각 처리
                const leftValue = parseFloat((tr.querySelector(`.rec[data-id="${id}_left"]`) as HTMLInputElement)?.value||'');
                const rightValue = parseFloat((tr.querySelector(`.rec[data-id="${id}_right"]`) as HTMLInputElement)?.value||'');
                
                if (!isNaN(leftValue)) {
                    const leftGrade = this.calcPapsGrade(`${id}_left`, leftValue, studentGender, gradeLevel, cls);
                    const leftTd = tr.querySelector(`.grade-cell[data-id="${id}_left"]`);
                    if (leftTd) {
                        leftTd.textContent = leftGrade || '';
                        if (leftGrade) leftTd.classList.add(`grade-${leftGrade}`);
                    }
                }
                
                if (!isNaN(rightValue)) {
                    const rightGrade = this.calcPapsGrade(`${id}_right`, rightValue, studentGender, gradeLevel, cls);
                    const rightTd = tr.querySelector(`.grade-cell[data-id="${id}_right"]`);
                    if (rightTd) {
                        rightTd.textContent = rightGrade || '';
                        if (rightGrade) rightTd.classList.add(`grade-${rightGrade}`);
                    }
                }
            } else {
                const value = parseFloat((tr.querySelector(`.rec[data-id="${id}"]`) as HTMLInputElement)?.value||'');
                if (!isNaN(value)) {
                    const grade = this.calcPapsGrade(id, value, studentGender, gradeLevel, cls);
                    const td = tr.querySelector(`.grade-cell[data-id="${id}"]`);
                    if (td) {
                        td.textContent = grade || '';
                        if (grade) td.classList.add(`grade-${grade}`);
                    }
                }
            }
        });
        
        // 종합 등급 계산
        const overallGrade = this.calcOverallGrade(tr);
        const overallTd = tr.querySelector('.overall-grade-cell');
        if (overallTd) {
            overallTd.textContent = overallGrade || '';
            if (overallGrade) overallTd.classList.add(`grade-${overallGrade}`);
        }
    }

    /**
     * PAPS 등급을 계산합니다.
     */
    public calcPapsGrade(categoryId: string, value: number, gender: string, gradeLevel: string, cls: PapsClass): string {
        if (value==null || isNaN(value) || !gender || !gradeLevel) return '';
        let selectedTest: string | null = null;
        if (categoryId === 'bodyfat') selectedTest = 'BMI';
        else {
            const catKey = Object.keys(PAPS_ITEMS).find(k => PAPS_ITEMS[k].id === categoryId);
            selectedTest = cls.eventSettings?.[categoryId] || PAPS_ITEMS[catKey!].options[0];
            
            // 성별에 따라 팔굽혀펴기 종목명 변경
            if (selectedTest === '팔굽혀펴기' && gender === '여자') {
                selectedTest = '무릎대고팔굽혀펴기';
            }
        }
        let criteria: any;
        if (selectedTest === 'BMI') criteria = PAPS_CRITERIA_DATA?.BMI?.[gender]?.[gradeLevel];
        else criteria = PAPS_CRITERIA_DATA?.[gender]?.[gradeLevel]?.[selectedTest];
        if (!criteria) return '';
        
        for (const [grade, range] of Object.entries(criteria)) {
            if (value >= (range as number[])[0] && value <= (range as number[])[1]) return grade;
        }
        return '';
    }

    /**
     * 전체 등급을 계산합니다.
     */
    public calcOverallGrade(tr: HTMLTableRowElement): string {
        const grades = Array.from(tr.querySelectorAll('.grade-cell')).map(td => td.textContent).filter(g => g && g !== '');
        if (grades.length === 0) return '';
        
        // 등급별 점수 계산 (1등급=5점, 2등급=4점, ..., 5등급=1점)
        const gradeScores: number[] = grades.map(grade => {
            if (grade === '1등급') return 5;
            if (grade === '2등급') return 4;
            if (grade === '3등급') return 3;
            if (grade === '4등급') return 2;
            if (grade === '5등급') return 1;
            if (grade === '정상') return 4; // BMI 정상은 2등급 수준
            if (grade === '과체중') return 3; // BMI 과체중은 3등급 수준
            if (grade === '비만') return 1; // BMI 비만은 5등급 수준
            return 0;
        });
        
        const averageScore = gradeScores.reduce((sum, score) => sum + score, 0) / gradeScores.length;
        
        if (averageScore >= 4.5) return '1등급';
        if (averageScore >= 3.5) return '2등급';
        if (averageScore >= 2.5) return '3등급';
        if (averageScore >= 1.5) return '4등급';
        return '5등급';
    }

    /**
     * PAPS 학생을 추가합니다.
     */
    public addPapsStudent(cls: PapsClass): void {
        const id = Date.now();
        cls.students.push({ 
            id, 
            number: (cls.students?.length||0)+1, 
            name: '', 
            gender: '남자', 
            records: {} 
        });
    }

    /**
     * 선택된 PAPS 학생을 삭제합니다.
     */
    public deleteSelectedPapsStudents(cls: PapsClass): void {
        const rows = Array.from(this.$('#paps-record-body').querySelectorAll('tr'));
        const keep: number[] = [];
        rows.forEach(r => {
            const checked = (r.querySelector('.paps-row-checkbox') as HTMLInputElement)?.checked;
            const sid = Number(r.dataset.sid);
            if (!checked) keep.push(sid);
        });
        cls.students = (cls.students||[]).filter(s => keep.includes(s.id));
        this.buildPapsTable(cls);
        this.saveDataToFirestore();
    }

    /**
     * PAPS 템플릿을 다운로드합니다.
     */
    public papsDownloadTemplate(): void {
        // XLSX 라이브러리가 필요합니다
        if (typeof window !== 'undefined' && (window as any).XLSX) {
            const wb = (window as any).XLSX.utils.book_new();
            const ws = (window as any).XLSX.utils.aoa_to_sheet([
                ["번호","이름","성별"],
                [1,'김체육','남자'],
                [2,'박건강','여자']
            ]);
            ws['!cols'] = [{wch:8},{wch:14},{wch:8}];
            (window as any).XLSX.utils.book_append_sheet(wb, ws, '학생 명렬표');
            (window as any).XLSX.writeFile(wb, 'PAPS_학생명렬표_양식.xlsx');
        } else {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
        }
    }

    /**
     * PAPS 설정을 저장합니다.
     */
    public savePapsSettings(): void {
        // 설정이 이미 저장되어 있으므로 추가 작업 불필요
        alert('설정이 저장되었습니다.');
    }

    /**
     * PAPS 설정을 표시합니다.
     */
    public showPapsSettings(): void {
        // 설정 모달이나 팝업을 표시하는 로직
        alert('PAPS 설정 기능은 개발 중입니다.');
    }

    /**
     * PAPS 학생 업로드를 처리합니다.
     */
    public handlePapsStudentUpload(event: Event, cls: PapsClass): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = e => {
            try {
                if (typeof window !== 'undefined' && (window as any).XLSX) {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const wb = (window as any).XLSX.read(data, {type:'array'});
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const json = (window as any).XLSX.utils.sheet_to_json(ws, {header:1});
                    const newStudents: PapsStudent[] = [];
                    
                    for(let i=1; i<json.length; i++){
                        const row = json[i];
                        if(!row || row.length === 0) continue;
                        const num = row[0];
                        const name = row[1];
                        let gender = row[2] || '남자';
                        if(typeof gender === 'string'){
                            if(gender.includes('여')) gender = '여자';
                            else gender = '남자';
                        } else gender = '남자';
                        newStudents.push({ 
                            id: Date.now() + i, 
                            number: num, 
                            name, 
                            gender: gender as '남자' | '여자', 
                            records: {} 
                        });
                    }
                    cls.students = newStudents;
                    this.buildPapsTable(cls);
                    this.saveDataToFirestore();
                    alert('학생 명렬표를 불러왔습니다.');
                } else {
                    alert('엑셀 라이브러리가 로드되지 않았습니다.');
                }
            } catch(err) {
                alert('파일 처리 중 오류가 발생했습니다.');
            } finally {
                target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    }

    /**
     * PAPS를 엑셀로 내보냅니다.
     */
    public exportPapsToExcel(cls: PapsClass): void {
        if (!cls || !cls.students || cls.students.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }
        
        if (typeof window !== 'undefined' && (window as any).XLSX) {
            // 엑셀 내보내기 로직 구현
            alert('엑셀 내보내기 기능은 개발 중입니다.');
        } else {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
        }
    }

    /**
     * 모든 PAPS를 엑셀로 내보냅니다.
     */
    public exportAllPapsToExcel(): void {
        if (typeof window !== 'undefined' && (window as any).XLSX) {
            // 모든 PAPS 엑셀 내보내기 로직 구현
            alert('전체 엑셀 내보내기 기능은 개발 중입니다.');
        } else {
            alert('엑셀 라이브러리가 로드되지 않았습니다.');
        }
    }

    /**
     * PAPS 기록 업로드를 처리합니다.
     */
    public handlePapsRecordUpload(event: Event, cls: PapsClass): void {
        // PAPS 기록 업로드 로직 구현
        alert('PAPS 기록 업로드 기능은 개발 중입니다.');
    }

    /**
     * 모든 PAPS 엑셀 업로드를 처리합니다.
     */
    public handleAllPapsExcelUpload(event: Event): void {
        // 모든 PAPS 엑셀 업로드 로직 구현
        alert('전체 PAPS 엑셀 업로드 기능은 개발 중입니다.');
    }

    /**
     * PAPS 차트를 렌더링합니다.
     */
    public renderPapsCharts(cls: PapsClass): void {
        // PAPS 차트 렌더링 로직 구현
        const chartsContainer = this.$('#paps-charts');
        chartsContainer.innerHTML = '<p>차트 기능은 개발 중입니다.</p>';
    }
}
