/**
 * 수업 진도 관리 모듈
 *
 * 이 모듈은 수업 진도표의 모든 기능을 관리합니다.
 * 반 생성/삭제, 수업 설정, 진도 기록, 시간표 관리 등을 담당합니다.
 *
 * 현재 지원하는 기능:
 * - 반 관리 (생성, 수정, 삭제, 선택)
 * - 수업 설정 관리 (담당교사, 단원 내용, 주당 시간)
 * - 진도 기록 입력 및 관리
 * - 시간표 생성 및 관리
 * - 데이터 저장 및 로딩
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */

// ========================================
// 타입 정의
// ========================================

/**
 * 수업 진도 클래스 구조
 */
export interface ProgressClass {
  id: string;
  name: string;
  teacherName: string;
  unitContent: string;
  weeklyHours: number;
  schedule: ProgressSchedule;
  records: ProgressRecord[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 수업 시간표 구조
 */
export interface ProgressSchedule {
  [week: number]: {
    [hour: number]: {
      content: string;
      note?: string;
    };
  };
}

/**
 * 진도 기록 구조
 */
export interface ProgressRecord {
  id: string;
  week: number;
  hour: number;
  content: string;
  note?: string;
  completed: boolean;
  createdAt: number;
}

/**
 * ProgressManager 설정
 */
export interface ProgressConfig {
  enableAutoSave: boolean;
  enableNotifications: boolean;
  defaultWeeklyHours: number;
}

// ========================================
// ProgressManager 클래스
// ========================================

/**
 * 수업 진도 관리자 클래스
 */
export class ProgressManager {
  private progressClasses: ProgressClass[] = [];
  private selectedClassId: string | null = null;
  private $: (selector: string) => HTMLElement | null;
  private $$: (selector: string) => NodeListOf<HTMLElement>;
  private saveDataCallback: () => void;
  private config: ProgressConfig;

  /**
   * ProgressManager 인스턴스를 생성합니다.
   * @param progressClasses 기존 진도 클래스 데이터
   * @param selectedClassId 선택된 클래스 ID
   * @param $ DOM 선택자 함수
   * @param $$ DOM 다중 선택자 함수
   * @param saveDataCallback 데이터 저장 콜백
   * @param config 설정 옵션
   */
  constructor(
    progressClasses: ProgressClass[],
    selectedClassId: string | null,
    $: (selector: string) => HTMLElement | null,
    $$: (selector: string) => NodeListOf<HTMLElement>,
    saveDataCallback: () => void,
    config: ProgressConfig = {
      enableAutoSave: true,
      enableNotifications: true,
      defaultWeeklyHours: 2
    }
  ) {
    this.progressClasses = progressClasses;
    this.selectedClassId = selectedClassId;
    this.$ = $;
    this.$$ = $$;
    this.saveDataCallback = saveDataCallback;
    this.config = config;
  }

  /**
   * 수업 진도 UI를 렌더링합니다.
   */
  public renderProgressUI(): void {
    console.log('renderProgressUI 시작');
    console.log('progressClasses.length:', this.progressClasses.length);
    console.log('progressClasses:', this.progressClasses);
    
    // 기존 요소들 정리
    this.cleanupSidebar();
    
    const sidebarTitle = this.$('#sidebarTitle');
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
    const sidebarFormContainer = this.$('#sidebar-form-container');
    if (sidebarFormContainer) sidebarFormContainer.innerHTML = formHtml;
    
    // 사이드바 푸터에 방문자 수와 저작권 추가
    const sidebarFooter = this.$('.sidebar-footer');
    if (sidebarFooter) {
        sidebarFooter.innerHTML = `
            <div class="visitor-count">
                <span>방문자 수: <span id="visitorCount">로딩 중...</span></span>
            </div>
            <div class="copyright">
                <span>&copy; 2024 PE Helper Online. All rights reserved.</span>
            </div>
        `;
    }

    console.log('진도표 메인 콘텐츠 렌더링');
    const contentWrapper = this.$('#content-wrapper');
    console.log('contentWrapper 찾기:', contentWrapper);
    if (contentWrapper) {
        contentWrapper.innerHTML = `
            <div class="progress-main-content">
                <div class="progress-right">
                    <div class="progress-right-header">
                        <div class="progress-setting-header" id="progressSettingHeader">
                            <div class="title">수업 설정</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                디버그: 진도표 클래스 수 ${this.progressClasses.length}, 선택된 ID: ${this.selectedClassId}
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
        console.log('contentWrapper innerHTML 설정 완료');
    } else {
        console.error('contentWrapper를 찾을 수 없습니다!');
    }

    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 데이터 로드 및 초기화
    this.loadProgressSelected();
    this.renderProgressClassList();
  }

  /**
   * 반 목록을 렌더링합니다.
   */
  public renderProgressClassList(): void {
    console.log('renderProgressClassList 시작');
    const classList = this.$('#progressClassList');
    console.log('classList 찾기:', classList);
    if (!classList) return;

    if (this.progressClasses.length === 0) {
        classList.innerHTML = '<div class="empty-state">아직 생성된 반이 없습니다.</div>';
        return;
    }

    const classListHtml = this.progressClasses.map(cls => `
        <div class="progress-class-item ${cls.id === this.selectedClassId ? 'active' : ''}" 
             data-class-id="${cls.id}">
            <div class="class-info">
                <div class="class-name">${cls.name}</div>
                <div class="class-details">
                    <span>${cls.teacherName || '담당교사 미설정'}</span>
                    <span>•</span>
                    <span>${cls.weeklyHours}시간/주</span>
                </div>
            </div>
            <div class="class-actions">
                <button class="btn-icon edit" data-action="edit" data-class-id="${cls.id}" title="편집">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon delete" data-action="delete" data-class-id="${cls.id}" title="삭제">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg>
                </button>
            </div>
        </div>
    `).join('');
    
    console.log('생성된 classList HTML:', classListHtml);
    classList.innerHTML = classListHtml;
    console.log('classList innerHTML 설정 완료');
  }

  /**
   * 새 반을 추가합니다.
   */
  public addProgressClass(): void {
    const input = this.$('#progressClassNameInput') as HTMLInputElement;
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
        alert('반 이름을 입력해주세요.');
        return;
    }

    const newClass: ProgressClass = {
        id: Date.now().toString(),
        name,
        teacherName: '',
        unitContent: '',
        weeklyHours: this.config.defaultWeeklyHours,
        schedule: {},
        records: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    this.progressClasses.push(newClass);
    this.selectedClassId = newClass.id;
    
    input.value = '';
    this.saveDataCallback();
    this.renderProgressClassList();
    this.loadProgressSelected();
  }

  /**
   * 반을 선택합니다.
   * @param classId 선택할 반의 ID
   */
  public selectProgressClass(classId: string): void {
    this.selectedClassId = classId;
    this.saveProgressSelected();
    this.renderProgressClassList();
    this.loadProgressSelected();
  }

  /**
   * 반을 삭제합니다.
   * @param classId 삭제할 반의 ID
   */
  public deleteProgressClass(classId: string): void {
    if (!confirm('정말로 이 반을 삭제하시겠습니까?')) return;

    const index = this.progressClasses.findIndex(cls => cls.id === classId);
    if (index === -1) return;

    this.progressClasses.splice(index, 1);
    
    if (this.selectedClassId === classId) {
        this.selectedClassId = null;
    }
    
    this.saveDataCallback();
    this.renderProgressClassList();
    this.loadProgressSelected();
  }

  /**
   * 수업 설정을 저장합니다.
   */
  public saveProgressSetting(): void {
    if (!this.selectedClassId) {
        alert('먼저 반을 선택해주세요.');
        return;
    }

    const selectedClass = this.progressClasses.find(cls => cls.id === this.selectedClassId);
    if (!selectedClass) return;

    const teacherName = (this.$('#progressTeacherName') as HTMLInputElement)?.value || '';
    const unitContent = (this.$('#progressUnitContent') as HTMLInputElement)?.value || '';
    const weeklyHours = parseInt((this.$('#progressWeeklyHours') as HTMLSelectElement)?.value || '2');

    selectedClass.teacherName = teacherName;
    selectedClass.unitContent = unitContent;
    selectedClass.weeklyHours = weeklyHours;
    selectedClass.updatedAt = Date.now();

    this.saveDataCallback();
    this.renderProgressClassList();
    
    // 진도표 생성
    this.generateProgressSheet(selectedClass);
  }

    /**
     * 진도표를 생성합니다.
     * @param selectedClass 선택된 반 정보
     */
    private generateProgressSheet(selectedClass: ProgressClass): void {
        const sheetArea = this.$('#progressSheetArea');
        if (!sheetArea) return;

        // records 배열이 없으면 초기화
        if (!selectedClass.records) {
            selectedClass.records = [];
        }

        const weeks = 20; // 20주차까지
        const hours = selectedClass.weeklyHours;

    let tableHtml = `
        <div class="progress-table-container">
            <table class="progress-table">
                <thead>
                    <tr>
                        <th>주차</th>
                        ${Array.from({ length: hours }, (_, i) => `<th>${i + 1}차시</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    for (let week = 1; week <= weeks; week++) {
        tableHtml += `<tr><td class="week-cell">${week}주</td>`;
        
        for (let hour = 1; hour <= hours; hour++) {
            const record = selectedClass.records.find(r => r.week === week && r.hour === hour);
            const content = record?.content || '';
            const note = record?.note || '';
            const completed = record?.completed || false;
            
            tableHtml += `
                <td class="hour-cell ${completed ? 'completed' : ''}">
                    <div class="hour-content">
                        <input type="text" 
                               class="content-input" 
                               placeholder="수업 내용" 
                               value="${content}"
                               data-week="${week}" 
                               data-hour="${hour}">
                        <input type="text" 
                               class="note-input" 
                               placeholder="비고" 
                               value="${note}"
                               data-week="${week}" 
                               data-hour="${hour}">
                        <label class="completed-checkbox">
                            <input type="checkbox" 
                                   ${completed ? 'checked' : ''}
                                   data-week="${week}" 
                                   data-hour="${hour}">
                            완료
                        </label>
                    </div>
                </td>
            `;
        }
        
        tableHtml += '</tr>';
    }

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    sheetArea.innerHTML = tableHtml;
  }

  /**
   * 이벤트 리스너를 설정합니다.
   */
  private setupEventListeners(): void {
    // 반 추가 버튼
    const addBtn = this.$('#progressAddClassBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => this.addProgressClass());
    }

    // 반 이름 입력 엔터키
    const nameInput = this.$('#progressClassNameInput') as HTMLInputElement;
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addProgressClass();
        });
    }

    // 반 목록 클릭 이벤트
    const classList = this.$('#progressClassList');
    if (classList) {
        classList.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const classItem = target.closest('.progress-class-item');
            const actionBtn = target.closest('[data-action]');
            
            if (classItem && !actionBtn) {
                const classId = classItem.getAttribute('data-class-id');
                if (classId) this.selectProgressClass(classId);
            } else if (actionBtn) {
                const action = actionBtn.getAttribute('data-action');
                const classId = actionBtn.getAttribute('data-class-id');
                
                if (action === 'edit' && classId) {
                    this.editProgressClass(classId);
                } else if (action === 'delete' && classId) {
                    this.deleteProgressClass(classId);
                }
            }
        });
    }

    // 설정 저장 버튼
    const saveBtn = this.$('#progressSaveSettingBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => this.saveProgressSetting());
    }

    // 진도표 입력 이벤트
    const sheetArea = this.$('#progressSheetArea');
    if (sheetArea) {
        sheetArea.addEventListener('input', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('content-input') || 
                target.classList.contains('note-input') ||
                target.classList.contains('completed-checkbox')) {
                this.updateProgressRecord(target);
            }
        });
    }
  }

  /**
   * 진도 기록을 업데이트합니다.
   * @param element 변경된 요소
   */
  private updateProgressRecord(element: HTMLElement): void {
    if (!this.selectedClassId) return;

    const selectedClass = this.progressClasses.find(cls => cls.id === this.selectedClassId);
    if (!selectedClass) return;

    const week = parseInt(element.getAttribute('data-week') || '0');
    const hour = parseInt(element.getAttribute('data-hour') || '0');
    
    if (week === 0 || hour === 0) return;

    let record = selectedClass.records.find(r => r.week === week && r.hour === hour);
    
    if (!record) {
        record = {
            id: Date.now().toString(),
            week,
            hour,
            content: '',
            note: '',
            completed: false,
            createdAt: Date.now()
        };
        selectedClass.records.push(record);
    }

    if (element.classList.contains('content-input')) {
        record.content = (element as HTMLInputElement).value;
    } else if (element.classList.contains('note-input')) {
        record.note = (element as HTMLInputElement).value;
    } else if (element.classList.contains('completed-checkbox')) {
        record.completed = (element as HTMLInputElement).checked;
    }

    selectedClass.updatedAt = Date.now();
    this.saveDataCallback();
  }

  /**
   * 반을 편집합니다.
   * @param classId 편집할 반의 ID
   */
  private editProgressClass(classId: string): void {
    const selectedClass = this.progressClasses.find(cls => cls.id === classId);
    if (!selectedClass) return;

    const newName = prompt('반 이름을 수정하세요:', selectedClass.name);
    if (newName && newName.trim() !== selectedClass.name) {
        selectedClass.name = newName.trim();
        selectedClass.updatedAt = Date.now();
        this.saveDataCallback();
        this.renderProgressClassList();
    }
  }

  /**
   * 선택된 반을 로드합니다.
   */
  private loadProgressSelected(): void {
    if (!this.selectedClassId) return;

    const selectedClass = this.progressClasses.find(cls => cls.id === this.selectedClassId);
    if (!selectedClass) return;

    // 설정 폼에 데이터 채우기
    const teacherNameInput = this.$('#progressTeacherName') as HTMLInputElement;
    const unitContentInput = this.$('#progressUnitContent') as HTMLInputElement;
    const weeklyHoursSelect = this.$('#progressWeeklyHours') as HTMLSelectElement;

    if (teacherNameInput) teacherNameInput.value = selectedClass.teacherName || '';
    if (unitContentInput) unitContentInput.value = selectedClass.unitContent || '';
    if (weeklyHoursSelect) weeklyHoursSelect.value = selectedClass.weeklyHours.toString();

    // 진도표 생성
    this.generateProgressSheet(selectedClass);
  }

  /**
   * 선택된 반을 저장합니다.
   */
  private saveProgressSelected(): void {
    if (this.selectedClassId) {
        localStorage.setItem('progressSelectedClassId', this.selectedClassId);
    } else {
        localStorage.removeItem('progressSelectedClassId');
    }
  }

  /**
   * 사이드바를 정리합니다.
   */
  private cleanupSidebar(): void {
    const sidebarFormContainer = this.$('#sidebar-form-container');
    if (sidebarFormContainer) {
        sidebarFormContainer.innerHTML = '';
    }
  }

  /**
   * 현재 반 목록을 반환합니다.
   * @returns 현재 반 목록
   */
  public getProgressClasses(): ProgressClass[] {
    return this.progressClasses;
  }

  /**
   * 선택된 반 ID를 반환합니다.
   * @returns 선택된 반 ID 또는 null
   */
  public getSelectedClassId(): string | null {
    return this.selectedClassId;
  }

  /**
   * 반 목록을 설정합니다.
   * @param classes 설정할 반 목록
   */
  public setProgressClasses(classes: ProgressClass[]): void {
    this.progressClasses = classes;
  }

  /**
   * 선택된 반 ID를 설정합니다.
   * @param classId 설정할 반 ID
   */
  public setSelectedClassId(classId: string | null): void {
    this.selectedClassId = classId;
  }
}

// ========================================
// 전역 함수들
// ========================================

/**
 * ProgressManager 인스턴스를 초기화합니다.
 * @param progressClasses 기존 진도 클래스 데이터
 * @param selectedClassId 선택된 클래스 ID
 * @param $ DOM 선택자 함수
 * @param $$ DOM 다중 선택자 함수
 * @param saveDataCallback 데이터 저장 콜백
 * @param config 설정 옵션
 * @returns 초기화된 ProgressManager 인스턴스
 */
export function initializeProgressManager(
  progressClasses: ProgressClass[],
  selectedClassId: string | null,
  $: (selector: string) => HTMLElement | null,
  $$: (selector: string) => NodeListOf<HTMLElement>,
  saveDataCallback: () => void,
  config?: ProgressConfig
): ProgressManager {
  return new ProgressManager(progressClasses, selectedClassId, $, $$, saveDataCallback, config);
}
