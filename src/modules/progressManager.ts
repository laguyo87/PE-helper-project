/**
 * 수업 진도 관리 모듈
 * 원본 main.js의 진도표 기능을 모듈화
 */

export interface ProgressClass {
  id: string;
  name: string;
  teacherName?: string;
  unitContent?: string;
  weeklyHours?: number;
  schedule?: ProgressSession[];
  createdAt: number;
  updatedAt: number;
}

export interface ProgressSession {
  weekNumber: number;
  sessionNumber: number;
  date: string;
  content: string;
  completed: boolean;
  notes: string;
}

export class ProgressManager {
  private $: (selector: string) => HTMLElement | null;
  private $$: (selector: string) => NodeListOf<HTMLElement>;
  private saveCallback: () => void;
  private classes: ProgressClass[] = [];
  private selectedClassId: string | null = null;

  constructor(
    $: (selector: string) => HTMLElement | null,
    $$: (selector: string) => NodeListOf<HTMLElement>,
    saveCallback: () => void
  ) {
    this.$ = $;
    this.$$ = $$;
    this.saveCallback = saveCallback;
  }

  /**
   * 초기화
   */
  initialize(classes: ProgressClass[], selectedClassId: string | null = null): void {
    console.log('ProgressManager 초기화 시작');
    console.log('받은 classes:', classes);
    console.log('받은 selectedClassId:', selectedClassId);
    
    this.classes = Array.isArray(classes) ? classes : [];
    this.selectedClassId = selectedClassId;
    
    // 모든 클래스의 필수 속성 초기화
    this.classes.forEach((cls, index) => {
      if (cls && typeof cls === 'object') {
        cls.id = cls.id || `class-${Date.now()}-${index}`;
        cls.name = cls.name || `반 ${index + 1}`;
        cls.schedule = Array.isArray(cls.schedule) ? cls.schedule : [];
        cls.weeklyHours = typeof cls.weeklyHours === 'number' ? cls.weeklyHours : 2;
        cls.teacherName = typeof cls.teacherName === 'string' ? cls.teacherName : '';
        cls.unitContent = typeof cls.unitContent === 'string' ? cls.unitContent : '';
        cls.createdAt = typeof cls.createdAt === 'number' ? cls.createdAt : Date.now();
        cls.updatedAt = typeof cls.updatedAt === 'number' ? cls.updatedAt : Date.now();
      }
    });
    
    console.log('초기화된 classes:', this.classes);
    console.log('classes 배열 길이:', this.classes.length);
  }

  /**
   * 진도표 UI 렌더링 (원본 renderProgressUI 함수 기반)
   */
  renderProgressUI(): void {
    console.log('renderProgressUI 시작');
    console.log('progressClasses.length:', this.classes.length);
    console.log('progressClasses:', this.classes);
    
    // 기존 요소들 정리
    this.cleanupSidebar();
    
    // 사이드바 제목 설정
    const sidebarTitle = this.$('#sidebarTitle');
    if (sidebarTitle) {
      sidebarTitle.textContent = '수업 진도 관리';
    }
    
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
    if (sidebarFormContainer) {
      sidebarFormContainer.innerHTML = formHtml;
    }
    
    // 사이드바 푸터에 방문자 수와 저작권 추가
    const sidebarFooter = this.$('.sidebar-footer');
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
      this.updateProgressVisitorCount();
    }
    
    // 클래스 목록 렌더링
    console.log('진도표 클래스 목록 렌더링 시작');
    this.renderProgressClassList();
    
    // 메인 콘텐츠 영역에 진도표만 표시
    console.log('진도표 메인 콘텐츠 렌더링');
    const contentWrapper = this.$('#content-wrapper');
    if (contentWrapper) {
      contentWrapper.innerHTML = `
        <div class="progress-main-content">
          <div class="progress-right">
            <div class="progress-right-header">
              <div class="progress-setting-header" id="progressSettingHeader">
                <div class="title">수업 설정</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  디버그: 진도표 클래스 수 ${this.classes.length}, 선택된 ID: ${this.selectedClassId}
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
    }
    
    // 이벤트 리스너 등록 (DOM이 생성된 후)
    setTimeout(() => {
      this.setupProgressEventListeners();
    }, 0);
    
    if (this.selectedClassId) {
      this.loadProgressToRight(this.selectedClassId);
    } else {
      // 선택된 반이 없을 때도 제목 업데이트
      this.updateProgressSheetTitle();
    }
    
    console.log('진도표 렌더링 완료');
  }

  /**
   * 사이드바 정리
   */
  private cleanupSidebar(): void {
    const sidebarFormContainer = this.$('#sidebar-form-container');
    const sidebarListContainer = this.$('#sidebar-list-container');
    
    if (sidebarFormContainer) {
      sidebarFormContainer.innerHTML = '';
    }
    if (sidebarListContainer) {
      sidebarListContainer.innerHTML = '';
    }
  }

  /**
   * 클래스 목록 렌더링 (원본 renderProgressClassList 함수 기반)
   */
  private renderProgressClassList(): void {
    console.log('=== renderProgressClassList 시작 ===');
    console.log('progressClasses.length:', this.classes.length);
    console.log('progressClasses:', this.classes);
    
    const progressClassList = this.$('#progressClassList');
    if (!progressClassList) {
      console.error('progressClassList 요소를 찾을 수 없습니다');
      return;
    }
    
    progressClassList.innerHTML = '';
    
    if (this.classes.length === 0) {
      console.log('클래스가 없음, 빈 상태 메시지 표시');
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = '아직 생성된 반이 없습니다.';
      progressClassList.appendChild(empty);
      return;
    }
    
    console.log('클래스 목록 렌더링 시작, 클래스 수:', this.classes.length);
    this.classes.forEach(c => {
      const card = document.createElement('div');
      card.className = 'btn' + (c.id === this.selectedClassId ? ' active' : '');
      card.style.justifyContent = 'space-between';
      card.style.marginBottom = '8px';
      card.addEventListener('click', () => {
        this.saveProgressSelected(c.id);
        this.renderProgressClassList();
        this.loadProgressToRight(c.id);
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
      meta.style.color = c.id === this.selectedClassId ? 'white' : 'var(--ink-muted)';
      const parts = [];
      if (c.weeklyHours) parts.push(`주당 ${c.weeklyHours}시간`);
      if (c.teacherName) parts.push(`${c.teacherName} 선생님`);
      if (c.unitContent) parts.push(c.unitContent);
      
      meta.textContent = parts.join(' • ');

      leftContent.appendChild(title);
      leftContent.appendChild(meta);

      const rightContent = document.createElement('div');
      rightContent.style.display = 'flex';
      rightContent.style.gap = '4px';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-icon';
      editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editProgressClassSettings(c.id);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon';
      deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg>';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteProgressClass(c.id);
      });

      rightContent.appendChild(editBtn);
      rightContent.appendChild(deleteBtn);

      card.appendChild(leftContent);
      card.appendChild(rightContent);
      progressClassList.appendChild(card);
    });
    
    console.log('=== renderProgressClassList 완료 ===');
    console.log('렌더링된 클래스 수:', this.classes.length);
  }

  /**
   * 이벤트 리스너 설정 (원본 setupProgressEventListeners 함수 기반)
   */
  private setupProgressEventListeners(): void {
    // 반 추가
    const progressClassNameInput = this.$('#progressClassNameInput');
    if (progressClassNameInput) {
      progressClassNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.addProgressClass();
        }
      });
    }

    const progressAddClassBtn = this.$('#progressAddClassBtn');
    if (progressAddClassBtn) {
      progressAddClassBtn.addEventListener('click', () => {
        this.addProgressClass();
      });
    }

    // 설정 저장
    const progressSaveSettingBtn = this.$('#progressSaveSettingBtn');
    if (progressSaveSettingBtn) {
      progressSaveSettingBtn.addEventListener('click', () => {
        this.saveProgressSettings();
      });
    }
  }

  /**
   * 반 추가 (원본 addProgressClass 함수 기반)
   */
  private addProgressClass(): void {
    const progressClassNameInput = this.$('#progressClassNameInput') as HTMLInputElement;
    if (!progressClassNameInput || !progressClassNameInput.value.trim()) {
      alert('반 이름을 입력해주세요');
      return;
    }

    const newClass: ProgressClass = {
      id: this.uuid(),
      name: progressClassNameInput.value.trim(),
      teacherName: '',
      unitContent: '',
      weeklyHours: 2,
      schedule: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.classes.push(newClass);
    progressClassNameInput.value = '';
    
    this.saveProgressClasses();
    this.renderProgressClassList();
    this.loadProgressToRight(newClass.id);
    
    // 새로운 반 생성 시 수업 설정 카드 표시
    const progressSettingHeader = this.$('#progressSettingHeader');
    if (progressSettingHeader && progressSettingHeader.parentElement) {
      progressSettingHeader.parentElement.style.display = 'block';
    }
  }

  /**
   * 반 편집 설정
   */
  private editProgressClassSettings(classId: string): void {
    // 해당 반을 선택
    this.saveProgressSelected(classId);
    this.renderProgressClassList();
    this.loadProgressToRight(classId);
    
    // 수업 설정 카드 전체 다시 표시
    const progressSettingHeader = this.$('#progressSettingHeader');
    if (progressSettingHeader && progressSettingHeader.parentElement) {
      progressSettingHeader.parentElement.style.display = 'block';
    }
  }

  /**
   * 반 삭제 (원본 deleteProgressClass 함수 기반)
   */
  private deleteProgressClass(classId: string): void {
    const classIndex = this.classes.findIndex(c => c.id === classId);
    if (classIndex === -1) return;
    
    // 삭제할 반이 현재 선택된 반이면 선택 해제
    if (this.selectedClassId === classId) {
      this.selectedClassId = null;
      this.saveProgressSelected('');
    }
    
    // 반 삭제
    this.classes.splice(classIndex, 1);
    this.saveProgressClasses();
    this.renderProgressClassList();
    
    // 선택된 반이 삭제되었으면 우측 영역 완전 초기화
    if (this.selectedClassId === null) {
      // 수업 설정 폼 초기화
      const progressTeacherName = this.$('#progressTeacherName') as HTMLInputElement;
      const progressUnitContent = this.$('#progressUnitContent') as HTMLInputElement;
      const progressWeeklyHours = this.$('#progressWeeklyHours') as HTMLSelectElement;
      
      if (progressTeacherName) progressTeacherName.value = '';
      if (progressUnitContent) progressUnitContent.value = '';
      if (progressWeeklyHours) progressWeeklyHours.value = '1';
      
      // 수업 기록 테이블 초기화
      const progressSheetArea = this.$('#progressSheetArea');
      if (progressSheetArea) {
        progressSheetArea.innerHTML = '<div class="progress-empty">반을 선택하고 "설정 저장"을 누르면 진도표가 생성됩니다.</div>';
      }
      
      // 제목 초기화
      this.updateProgressSheetTitle();
      
      // 수업 설정 카드 표시
      const progressSettingHeader = this.$('#progressSettingHeader');
      if (progressSettingHeader && progressSettingHeader.parentElement) {
        progressSettingHeader.parentElement.style.display = 'block';
      }
    }
  }

  /**
   * 우측 영역 로드 (원본 loadProgressToRight 함수 기반)
   */
  private loadProgressToRight(classId: string): void {
    const selectedClass = this.getProgressSelected();
    if (!selectedClass) return;

    // 수업 설정 폼에 데이터 채우기
    const progressTeacherName = this.$('#progressTeacherName') as HTMLInputElement;
    const progressUnitContent = this.$('#progressUnitContent') as HTMLInputElement;
    const progressWeeklyHours = this.$('#progressWeeklyHours') as HTMLSelectElement;
    
    if (progressTeacherName) progressTeacherName.value = selectedClass.teacherName || '';
    if (progressUnitContent) progressUnitContent.value = selectedClass.unitContent || '';
    if (progressWeeklyHours) progressWeeklyHours.value = (selectedClass.weeklyHours || 2).toString();

    // 진도표 렌더링
    this.renderProgressSheet(selectedClass);
    
    // 수업 설정 카드 전체 숨기기
    const progressSettingHeader = this.$('#progressSettingHeader');
    if (progressSettingHeader && progressSettingHeader.parentElement) {
      progressSettingHeader.parentElement.style.display = 'none';
    }
    
    console.log('진도표 렌더링 완료');
  }

  /**
   * 진도표 렌더링 (원본 renderProgressSheet 함수 기반)
   */
  private renderProgressSheet(selectedClass: ProgressClass): void {
    const progressSheetArea = this.$('#progressSheetArea');
    if (!progressSheetArea) return;

    if (!selectedClass.weeklyHours || selectedClass.weeklyHours < 1) {
      progressSheetArea.innerHTML = '<div class="progress-empty">"수업 설정"에서 주당 시간을 저장하면 진도표가 생성됩니다.</div>';
      return;
    }

    // 진도표 HTML 생성 - 1주만 표시하고 + / - 버튼 추가
    let html = `
      <div class="progress-controls">
        <button id="addWeekBtn" class="btn primary">+ 주차 추가</button>
        <button id="removeWeekBtn" class="btn secondary">- 주차 삭제</button>
        <span id="weekCounter">현재 1주차 표시 중</span>
      </div>
      <table class="progress-table">
        <tbody id="progressTableBody">
    `;
    
    // 1주차만 렌더링
    html += this.renderWeekRow(1, selectedClass);
    
    html += '</tbody></table>';
    progressSheetArea.innerHTML = html;
    
    // 이벤트 리스너 추가
    this.setupProgressSheetEventListeners();
    this.setupWeekControlListeners();
    
    // 날짜 입력 시 요일 업데이트
    this.setupDateChangeListeners();
  }

  /**
   * 주차 행 렌더링
   */
  private renderWeekRow(week: number, selectedClass: ProgressClass): string {
    const weeklyHours = selectedClass.weeklyHours || 2;
    
    // 주당 시간에 따라 동적으로 차시 컬럼 생성
    let sessionColumns = '';
    for (let session = 1; session <= weeklyHours; session++) {
      const sessionNumber = (week - 1) * weeklyHours + session;
      const sessionData = selectedClass.schedule?.find(s => s.weekNumber === week && s.sessionNumber === session);
      
      sessionColumns += `
        <td>
          <div class="session-content">
            <div class="session-header">
              <span class="session-number">${sessionNumber}차시</span>
            </div>
            <div class="date-input-group">
              <input type="date" placeholder="수업 날짜" 
                     value="${sessionData?.date || ''}"
                     data-week="${week}" data-session="${session}" class="date-input">
              <span class="day-of-week" data-week="${week}" data-session="${session}"></span>
            </div>
            <textarea placeholder="수업 내용" 
                      data-week="${week}" data-session="${session}" 
                      class="content-textarea">${sessionData?.content || ''}</textarea>
          </div>
        </td>
      `;
    }
    
    return `
      <tr>
        <td class="week-cell">${week}주</td>
        ${sessionColumns}
      </tr>
    `;
  }

  /**
   * 진도표 이벤트 리스너 설정
   */
  private setupProgressSheetEventListeners(): void {
    const progressSheetArea = this.$('#progressSheetArea');
    if (!progressSheetArea) return;

    // 모든 입력 필드에 이벤트 리스너 추가
    progressSheetArea.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.dataset.week && target.dataset.session) {
        this.updateProgressSession(
          parseInt(target.dataset.week),
          parseInt(target.dataset.session),
          target.value,
          undefined
        );
      }
    });
  }

  /**
   * 주차 제어 이벤트 리스너 설정
   */
  private setupWeekControlListeners(): void {
    const addWeekBtn = this.$('#addWeekBtn');
    const removeWeekBtn = this.$('#removeWeekBtn');
    
    if (addWeekBtn) {
      addWeekBtn.addEventListener('click', () => {
        this.addWeek();
      });
    }
    
    if (removeWeekBtn) {
      removeWeekBtn.addEventListener('click', () => {
        this.removeWeek();
      });
    }
  }

  /**
   * 주차 추가
   */
  private addWeek(): void {
    const selectedClass = this.getProgressSelected();
    if (!selectedClass) return;
    
    const tableBody = this.$('#progressTableBody');
    const weekCounter = this.$('#weekCounter');
    
    if (tableBody && weekCounter) {
      const currentWeeks = tableBody.children.length;
      const newWeek = currentWeeks + 1;
      
      // 새 주차 행 추가
      const newRow = this.renderWeekRow(newWeek, selectedClass);
      tableBody.insertAdjacentHTML('beforeend', newRow);
      
      // 카운터 업데이트
      weekCounter.textContent = `현재 ${newWeek}주차 표시 중`;
      
      // 새로 추가된 행의 이벤트 리스너 설정
      this.setupDateChangeListeners();
    }
  }

  /**
   * 주차 삭제
   */
  private removeWeek(): void {
    const tableBody = this.$('#progressTableBody');
    const weekCounter = this.$('#weekCounter');
    
    if (tableBody && weekCounter && tableBody.children.length > 1) {
      // 마지막 주차 행 삭제
      const lastRow = tableBody.lastElementChild;
      if (lastRow) {
        lastRow.remove();
        
        const remainingWeeks = tableBody.children.length;
        weekCounter.textContent = `현재 ${remainingWeeks}주차 표시 중`;
      }
    }
  }

  /**
   * 날짜 변경 이벤트 리스너 설정
   */
  private setupDateChangeListeners(): void {
    const progressSheetArea = this.$('#progressSheetArea');
    if (!progressSheetArea) return;

    // 날짜 입력 필드에 이벤트 리스너 추가
    progressSheetArea.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'date' && target.dataset.week && target.dataset.session) {
        this.updateDayOfWeek(target);
        this.updateProgressSession(
          parseInt(target.dataset.week),
          parseInt(target.dataset.session),
          target.value,
          undefined
        );
      }
    });
  }

  /**
   * 요일 업데이트
   */
  private updateDayOfWeek(dateInput: HTMLInputElement): void {
    const dayOfWeekSpan = this.$(`.day-of-week[data-week="${dateInput.dataset.week}"][data-session="${dateInput.dataset.session}"]`);
    if (dayOfWeekSpan && dateInput.value) {
      const date = new Date(dateInput.value);
      const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const dayOfWeek = days[date.getDay()];
      dayOfWeekSpan.textContent = `(${dayOfWeek})`;
    } else if (dayOfWeekSpan) {
      dayOfWeekSpan.textContent = '';
    }
  }

  /**
   * 진도표 세션 업데이트
   */
  private updateProgressSession(week: number, session: number, value: string, completed?: boolean): void {
    const selectedClass = this.getProgressSelected();
    if (!selectedClass) return;

    if (!selectedClass.schedule) {
      selectedClass.schedule = [];
    }

    let sessionData = selectedClass.schedule.find(s => s.weekNumber === week && s.sessionNumber === session);
    if (!sessionData) {
      sessionData = {
        weekNumber: week,
        sessionNumber: session,
        date: '',
        content: '',
        completed: false,
        notes: ''
      };
      selectedClass.schedule.push(sessionData);
    }

    // 입력 필드 타입에 따라 다른 속성 업데이트
    const inputElement = this.$(`[data-week="${week}"][data-session="${session}"]`) as HTMLInputElement | HTMLTextAreaElement;
    if (inputElement) {
      if (inputElement.type === 'date') {
        sessionData.date = value;
      } else if (inputElement.tagName === 'TEXTAREA') {
        sessionData.content = value;
      }
    }

    if (completed !== undefined) {
      sessionData.completed = completed;
    }

    selectedClass.updatedAt = Date.now();
    this.saveProgressClasses();
  }

  /**
   * 설정 저장 (원본 saveProgressSettings 함수 기반)
   */
  private saveProgressSettings(): void {
    const selectedClass = this.getProgressSelected();
    if (!selectedClass) {
      alert('반을 먼저 선택해주세요');
      return;
    }

    const progressTeacherName = this.$('#progressTeacherName') as HTMLInputElement;
    const progressUnitContent = this.$('#progressUnitContent') as HTMLInputElement;
    const progressWeeklyHours = this.$('#progressWeeklyHours') as HTMLSelectElement;

    if (progressTeacherName) selectedClass.teacherName = progressTeacherName.value;
    if (progressUnitContent) selectedClass.unitContent = progressUnitContent.value;
    if (progressWeeklyHours) selectedClass.weeklyHours = parseInt(progressWeeklyHours.value);

    selectedClass.updatedAt = Date.now();
    this.saveProgressClasses();
    this.renderProgressClassList();
    this.renderProgressSheet(selectedClass);

    alert('설정이 저장되었습니다');
  }

  /**
   * 선택된 반 가져오기
   */
  private getProgressSelected(): ProgressClass | null {
    return this.classes.find(c => c.id === this.selectedClassId) || null;
  }

  /**
   * 선택된 반 저장
   */
  private saveProgressSelected(id: string | null): void {
    this.selectedClassId = id;
    this.saveCallback();
  }

  /**
   * 클래스 목록 저장
   */
  private saveProgressClasses(): void {
    this.saveCallback();
  }

  /**
   * 진도표 제목 업데이트
   */
  private updateProgressSheetTitle(): void {
    const selectedClass = this.getProgressSelected();
    const titleElement = this.$('.progress-sheet-header h2');
    if (titleElement) {
      if (selectedClass) {
        titleElement.textContent = `${selectedClass.name} - 수업 기록 관리`;
      } else {
        titleElement.textContent = '수업 기록 관리';
      }
    }
  }

  /**
   * 방문자 수 업데이트
   */
  private updateProgressVisitorCount(): void {
    // 방문자 수 업데이트 로직 (필요시 구현)
  }

  /**
   * UUID 생성
   */
  private uuid(): string {
    return 'c-' + Math.random().toString(36).slice(2, 9);
  }

  /**
   * 클래스 목록 가져오기
   */
  getClasses(): ProgressClass[] {
    return this.classes;
  }

  /**
   * 선택된 클래스 ID 가져오기
   */
  getSelectedClassId(): string | null {
    return this.selectedClassId;
  }
}

/**
 * ProgressManager 초기화 함수
 */
export function initializeProgressManager(
  $: (selector: string) => HTMLElement | null,
  $$: (selector: string) => NodeListOf<HTMLElement>,
  saveCallback: () => void
): ProgressManager {
  return new ProgressManager($, $$, saveCallback);
}