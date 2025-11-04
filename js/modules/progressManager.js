/**
 * 수업 진도 관리 모듈
 * 원본 main.js의 진도표 기능을 모듈화
 */
import { validateData, ProgressClassSchema } from './validators.js';
import { showError, showSuccess } from './errorHandler.js';
import { logger, logError } from './logger.js';
export class ProgressManager {
    constructor($, $$, saveCallback) {
        this.classes = [];
        this.selectedClassId = null;
        this.saveDebounceTimer = null;
        this.$ = $;
        this.$$ = $$;
        this.saveCallback = saveCallback;
    }
    /**
     * 초기화
     */
    initialize(classes, selectedClassId = null) {
        logger.debug('ProgressManager 초기화 시작');
        logger.debug('받은 classes:', classes);
        logger.debug('받은 selectedClassId:', selectedClassId);
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
        logger.debug('초기화된 classes:', this.classes);
        logger.debug('classes 배열 길이:', this.classes.length);
    }
    /**
     * Progress 데이터를 업데이트합니다 (재초기화 없이)
     * onChangeCallbacks에서 호출될 때 사용
     */
    updateProgressData(classes, selectedClassId = null) {
        logger.debug('[ProgressManager] updateProgressData 호출', {
            classesCount: classes?.length || 0,
            selectedClassId
        });
        // 현재 선택된 반 ID 저장
        const currentSelectedId = this.selectedClassId;
        // 데이터 업데이트 (참조 유지)
        this.classes = classes || [];
        this.selectedClassId = selectedClassId;
        // UI 요소가 아직 생성되지 않았으면 UI 업데이트 건너뛰기
        const progressClassList = this.$('#progressClassList');
        if (!progressClassList) {
            logger.debug('[ProgressManager] UI 요소가 아직 생성되지 않음, UI 업데이트 건너뜀');
            return;
        }
        // 현재 선택된 반이 변경되지 않았고, 데이터만 업데이트된 경우
        // UI를 리렌더링하지 않음 (무한 루프 방지)
        if (currentSelectedId === selectedClassId && currentSelectedId) {
            logger.debug('[ProgressManager] 선택된 반이 동일하므로 UI 리렌더링 건너뜀');
            return;
        }
        // 선택된 반이 변경되었거나 없었던 경우에만 UI 업데이트
        logger.debug('[ProgressManager] 선택된 반 변경 또는 초기 설정, UI 업데이트');
        this.renderProgressClassList();
    }
    /**
     * 진도표 UI 렌더링 (원본 renderProgressUI 함수 기반)
     */
    renderProgressUI() {
        logger.debug('renderProgressUI 시작');
        logger.debug('progressClasses.length:', this.classes.length);
        logger.debug('progressClasses:', this.classes);
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
        logger.debug('진도표 클래스 목록 렌더링 시작');
        this.renderProgressClassList();
        // 메인 콘텐츠 영역에 진도표만 표시
        logger.debug('진도표 메인 콘텐츠 렌더링');
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
        }
        else {
            // 선택된 반이 없을 때도 제목 업데이트
            this.updateProgressSheetTitle();
        }
        logger.debug('진도표 렌더링 완료');
    }
    /**
     * 사이드바 정리
     */
    cleanupSidebar() {
        const sidebarFormContainer = this.$('#sidebar-form-container');
        if (sidebarFormContainer) {
            sidebarFormContainer.innerHTML = '';
        }
        // sidebar-list-container는 renderProgressClassList()에서 다시 채우므로 여기서 비우지 않음
    }
    /**
     * 클래스 목록 렌더링 (원본 renderProgressClassList 함수 기반)
     */
    renderProgressClassList() {
        logger.debug('=== renderProgressClassList 시작 ===');
        logger.debug('progressClasses.length:', this.classes.length);
        logger.debug('progressClasses:', this.classes);
        const progressClassList = this.$('#progressClassList');
        if (!progressClassList) {
            logError('progressClassList 요소를 찾을 수 없습니다');
            return;
        }
        progressClassList.innerHTML = '';
        if (this.classes.length === 0) {
            logger.debug('클래스가 없음, 빈 상태 메시지 표시');
            const empty = document.createElement('div');
            empty.className = 'empty';
            empty.textContent = '아직 생성된 반이 없습니다.';
            progressClassList.appendChild(empty);
            return;
        }
        logger.debug('클래스 목록 렌더링 시작, 클래스 수:', this.classes.length);
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
            if (c.weeklyHours)
                parts.push(`주당 ${c.weeklyHours}시간`);
            if (c.teacherName)
                parts.push(`${c.teacherName} 선생님`);
            if (c.unitContent)
                parts.push(c.unitContent);
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
        logger.debug('=== renderProgressClassList 완료 ===');
        logger.debug('렌더링된 클래스 수:', this.classes.length);
    }
    /**
     * 이벤트 리스너 설정 (원본 setupProgressEventListeners 함수 기반)
     */
    setupProgressEventListeners() {
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
    addProgressClass() {
        const progressClassNameInput = this.$('#progressClassNameInput');
        if (!progressClassNameInput)
            return;
        const name = progressClassNameInput.value.trim();
        // 이름 유효성 검사
        if (!name) {
            showError(new Error('반 이름을 입력해주세요.'));
            return;
        }
        // 중복 검사
        if (this.classes.some(c => c.name === name)) {
            showError(new Error('이미 존재하는 반 이름입니다.'));
            return;
        }
        // 데이터 생성 및 검증
        const newClassData = {
            id: this.uuid(),
            name,
            teacherName: '',
            unitContent: '',
            weeklyHours: 2,
            schedule: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const validation = validateData(ProgressClassSchema, newClassData);
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
        const newClass = validation.data;
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
        showSuccess('반이 생성되었습니다.');
    }
    /**
     * 반 편집 설정
     */
    editProgressClassSettings(classId) {
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
    deleteProgressClass(classId) {
        const classIndex = this.classes.findIndex(c => c.id === classId);
        if (classIndex === -1)
            return;
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
            const progressTeacherName = this.$('#progressTeacherName');
            const progressUnitContent = this.$('#progressUnitContent');
            const progressWeeklyHours = this.$('#progressWeeklyHours');
            if (progressTeacherName)
                progressTeacherName.value = '';
            if (progressUnitContent)
                progressUnitContent.value = '';
            if (progressWeeklyHours)
                progressWeeklyHours.value = '1';
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
    loadProgressToRight(classId) {
        const selectedClass = this.getProgressSelected();
        if (!selectedClass)
            return;
        // 수업 설정 폼에 데이터 채우기
        const progressTeacherName = this.$('#progressTeacherName');
        const progressUnitContent = this.$('#progressUnitContent');
        const progressWeeklyHours = this.$('#progressWeeklyHours');
        if (progressTeacherName)
            progressTeacherName.value = selectedClass.teacherName || '';
        if (progressUnitContent)
            progressUnitContent.value = selectedClass.unitContent || '';
        if (progressWeeklyHours)
            progressWeeklyHours.value = (selectedClass.weeklyHours || 2).toString();
        // 진도표 렌더링
        this.renderProgressSheet(selectedClass);
        // 수업 설정 카드 전체 숨기기
        const progressSettingHeader = this.$('#progressSettingHeader');
        if (progressSettingHeader && progressSettingHeader.parentElement) {
            progressSettingHeader.parentElement.style.display = 'none';
        }
        logger.debug('진도표 렌더링 완료');
    }
    /**
     * 진도표 렌더링 (원본 renderProgressSheet 함수 기반)
     */
    renderProgressSheet(selectedClass) {
        const progressSheetArea = this.$('#progressSheetArea');
        if (!progressSheetArea)
            return;
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
    renderWeekRow(week, selectedClass) {
        const weeklyHours = selectedClass.weeklyHours || 2;
        // 주당 시간에 따라 동적으로 차시 컬럼 생성
        let sessionColumns = '';
        for (let session = 1; session <= weeklyHours; session++) {
            const sessionNumber = (week - 1) * weeklyHours + session;
            const sessionData = selectedClass.schedule?.find(s => s.weekNumber === week && s.sessionNumber === session);
            // 날짜 값 검증 및 형식 변환 (yyyy-MM-dd 형식이어야 함)
            let dateValue = '';
            if (sessionData?.date) {
                const dateStr = String(sessionData.date);
                // yyyy-MM-dd 형식인지 확인 (예: 2024-01-01)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    dateValue = dateStr;
                }
                else {
                    // 잘못된 형식인 경우 빈 문자열로 설정
                    logger.warn(`[ProgressManager] 잘못된 날짜 형식 발견: ${dateStr}, 빈 문자열로 설정`);
                    dateValue = '';
                }
            }
            sessionColumns += `
        <td>
          <div class="session-content">
            <div class="session-header">
              <span class="session-number">${sessionNumber}차시</span>
            </div>
            <div class="date-input-group">
              <input type="date" placeholder="수업 날짜" 
                     value="${dateValue}"
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
    setupProgressSheetEventListeners() {
        const progressSheetArea = this.$('#progressSheetArea');
        if (!progressSheetArea) {
            logger.warn('[ProgressManager] setupProgressSheetEventListeners: progressSheetArea를 찾을 수 없음');
            return;
        }
        // 기존 리스너 제거 후 새로 추가 (중복 방지)
        // cloneNode로 리스너 제거
        const newProgressSheetArea = progressSheetArea.cloneNode(true);
        progressSheetArea.parentNode?.replaceChild(newProgressSheetArea, progressSheetArea);
        // 모든 입력 필드에 이벤트 리스너 추가 (이벤트 위임 사용)
        // date 타입은 change 이벤트에서만 처리하므로 제외
        newProgressSheetArea.addEventListener('input', (e) => {
            const target = e.target;
            // date 타입은 change 이벤트에서만 처리 (클래스명도 체크)
            if (target.type === 'date' || target.classList.contains('date-input')) {
                return;
            }
            // textarea만 처리 (content 업데이트)
            if (target.tagName !== 'TEXTAREA') {
                return;
            }
            if (target.dataset.week && target.dataset.session) {
                logger.debug('[ProgressManager] input 이벤트 발생 (textarea)', {
                    week: target.dataset.week,
                    session: target.dataset.session,
                    value: target.value,
                    type: target.tagName
                });
                // 타겟 요소를 직접 전달하여 정확한 타입 확인
                this.updateProgressSession(parseInt(target.dataset.week), parseInt(target.dataset.session), target.value, undefined, target);
            }
        });
        logger.debug('[ProgressManager] 진도표 이벤트 리스너 설정 완료');
    }
    /**
     * 주차 제어 이벤트 리스너 설정
     */
    setupWeekControlListeners() {
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
    addWeek() {
        const selectedClass = this.getProgressSelected();
        if (!selectedClass)
            return;
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
    removeWeek() {
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
    setupDateChangeListeners() {
        const progressSheetArea = this.$('#progressSheetArea');
        if (!progressSheetArea) {
            logger.warn('[ProgressManager] setupDateChangeListeners: progressSheetArea를 찾을 수 없음');
            return;
        }
        // change 이벤트는 이미 progressSheetArea에 있으므로 중복 방지를 위해 체크
        // 이벤트 위임으로 처리하므로 중복 등록 방지
        const handler = (e) => {
            const target = e.target;
            if (target.type === 'date' && target.dataset.week && target.dataset.session) {
                logger.debug('[ProgressManager] date change 이벤트 발생', {
                    week: target.dataset.week,
                    session: target.dataset.session,
                    value: target.value
                });
                this.updateDayOfWeek(target);
                // 타겟 요소를 직접 전달
                this.updateProgressSession(parseInt(target.dataset.week), parseInt(target.dataset.session), target.value, undefined, target);
            }
        };
        // 기존 핸들러가 있으면 제거 (data 속성으로 확인)
        if (progressSheetArea.__progressDateChangeHandler) {
            progressSheetArea.removeEventListener('change', progressSheetArea.__progressDateChangeHandler);
        }
        progressSheetArea.__progressDateChangeHandler = handler;
        progressSheetArea.addEventListener('change', handler);
        logger.debug('[ProgressManager] 날짜 변경 리스너 설정 완료');
    }
    /**
     * 요일 업데이트
     */
    updateDayOfWeek(dateInput) {
        const dayOfWeekSpan = this.$(`.day-of-week[data-week="${dateInput.dataset.week}"][data-session="${dateInput.dataset.session}"]`);
        if (dayOfWeekSpan && dateInput.value) {
            const date = new Date(dateInput.value);
            const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            const dayOfWeek = days[date.getDay()];
            dayOfWeekSpan.textContent = `(${dayOfWeek})`;
        }
        else if (dayOfWeekSpan) {
            dayOfWeekSpan.textContent = '';
        }
    }
    /**
     * 진도표 세션 업데이트
     */
    updateProgressSession(week, session, value, completed, inputElement) {
        const selectedClass = this.getProgressSelected();
        if (!selectedClass) {
            logger.warn('[ProgressManager] updateProgressSession: 선택된 반이 없음');
            return;
        }
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
            logger.debug('[ProgressManager] 새로운 세션 데이터 생성', { week, session });
        }
        // 입력 필드 타입에 따라 다른 속성 업데이트
        // inputElement가 전달되지 않은 경우에만 DOM에서 찾기
        const targetElement = inputElement || this.$(`[data-week="${week}"][data-session="${session}"]`);
        if (targetElement) {
            if (targetElement.type === 'date') {
                // 날짜 값 검증 (yyyy-MM-dd 형식)
                const dateStr = String(value);
                if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    sessionData.date = dateStr;
                    logger.debug('[ProgressManager] 날짜 업데이트', { week, session, date: dateStr });
                }
                else if (dateStr) {
                    logger.warn('[ProgressManager] 잘못된 날짜 형식', { week, session, value });
                }
            }
            else if (targetElement.tagName === 'TEXTAREA') {
                sessionData.content = value || '';
                logger.debug('[ProgressManager] 내용 업데이트', { week, session, contentLength: value.length, content: value.substring(0, 50) });
            }
        }
        else {
            // 요소를 찾지 못한 경우 타입을 추론해서 처리
            // value가 날짜 형식인지 확인
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                sessionData.date = value;
                logger.debug('[ProgressManager] 날짜 업데이트 (타입 추론)', { week, session, date: value });
            }
            else {
                // 날짜 형식이 아니면 내용으로 처리
                sessionData.content = value || '';
                logger.debug('[ProgressManager] 내용 업데이트 (타입 추론)', { week, session, contentLength: value.length });
            }
        }
        if (completed !== undefined) {
            sessionData.completed = completed;
        }
        selectedClass.updatedAt = Date.now();
        logger.debug('[ProgressManager] 세션 업데이트 완료, 저장 시작', {
            className: selectedClass.name,
            week,
            session,
            scheduleLength: selectedClass.schedule.length
        });
        // 저장 실행
        this.saveProgressClasses();
    }
    /**
     * 설정 저장 (원본 saveProgressSettings 함수 기반)
     */
    saveProgressSettings() {
        const selectedClass = this.getProgressSelected();
        if (!selectedClass) {
            alert('반을 먼저 선택해주세요');
            return;
        }
        const progressTeacherName = this.$('#progressTeacherName');
        const progressUnitContent = this.$('#progressUnitContent');
        const progressWeeklyHours = this.$('#progressWeeklyHours');
        if (progressTeacherName)
            selectedClass.teacherName = progressTeacherName.value;
        if (progressUnitContent)
            selectedClass.unitContent = progressUnitContent.value;
        if (progressWeeklyHours)
            selectedClass.weeklyHours = parseInt(progressWeeklyHours.value);
        selectedClass.updatedAt = Date.now();
        this.saveProgressClasses();
        this.renderProgressClassList();
        this.renderProgressSheet(selectedClass);
        alert('설정이 저장되었습니다');
    }
    /**
     * 선택된 반 가져오기
     */
    getProgressSelected() {
        return this.classes.find(c => c.id === this.selectedClassId) || null;
    }
    /**
     * 선택된 반 저장
     */
    saveProgressSelected(id) {
        this.selectedClassId = id;
        try {
            const result = this.saveCallback();
            // 비동기 콜백인 경우 처리
            if (result instanceof Promise) {
                result.catch((error) => {
                    logger.error('[ProgressManager] 선택된 반 저장 중 오류 발생:', error);
                });
            }
        }
        catch (error) {
            logger.error('[ProgressManager] 선택된 반 저장 중 오류 발생:', error);
        }
    }
    /**
     * 클래스 목록 저장 (디바운싱 적용)
     */
    saveProgressClasses() {
        logger.debug('[ProgressManager] 저장 시작 (디바운싱 적용)', {
            classesCount: this.classes.length,
            selectedClassId: this.selectedClassId
        });
        // 기존 타이머가 있으면 취소
        if (this.saveDebounceTimer !== null) {
            clearTimeout(this.saveDebounceTimer);
        }
        // 500ms 후에 저장 실행 (디바운싱)
        this.saveDebounceTimer = setTimeout(() => {
            try {
                const result = this.saveCallback();
                // 비동기 콜백인 경우 처리
                if (result instanceof Promise) {
                    result.catch((error) => {
                        logger.error('[ProgressManager] 저장 중 오류 발생:', error);
                    });
                }
                logger.debug('[ProgressManager] 저장 콜백 호출 완료');
            }
            catch (error) {
                logger.error('[ProgressManager] 저장 중 오류 발생:', error);
            }
            finally {
                this.saveDebounceTimer = null;
            }
        }, 500);
    }
    /**
     * 진도표 제목 업데이트
     */
    updateProgressSheetTitle() {
        const selectedClass = this.getProgressSelected();
        const titleElement = this.$('.progress-sheet-header h2');
        if (titleElement) {
            if (selectedClass) {
                titleElement.textContent = `${selectedClass.name} - 수업 기록 관리`;
            }
            else {
                titleElement.textContent = '수업 기록 관리';
            }
        }
    }
    /**
     * 방문자 수 업데이트
     */
    updateProgressVisitorCount() {
        // 방문자 수 업데이트 로직 (필요시 구현)
    }
    /**
     * UUID 생성
     */
    uuid() {
        return 'c-' + Math.random().toString(36).slice(2, 9);
    }
    /**
     * 클래스 목록 가져오기
     */
    getClasses() {
        return this.classes;
    }
    /**
     * 선택된 클래스 ID 가져오기
     */
    getSelectedClassId() {
        return this.selectedClassId;
    }
}
/**
 * ProgressManager 초기화 함수
 */
export function initializeProgressManager($, $$, saveCallback) {
    return new ProgressManager($, $$, saveCallback);
}
//# sourceMappingURL=progressManager.js.map