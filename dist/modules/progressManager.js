"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressManager = void 0;
exports.initializeProgressManager = initializeProgressManager;
// ========================================
// ProgressManager 클래스
// ========================================
/**
 * 수업 진도 관리자 클래스
 */
var ProgressManager = /** @class */ (function () {
    /**
     * ProgressManager 인스턴스를 생성합니다.
     * @param progressClasses 기존 진도 클래스 데이터
     * @param selectedClassId 선택된 클래스 ID
     * @param $ DOM 선택자 함수
     * @param $$ DOM 다중 선택자 함수
     * @param saveDataCallback 데이터 저장 콜백
     * @param config 설정 옵션
     */
    function ProgressManager(progressClasses, selectedClassId, $, $$, saveDataCallback, config) {
        if (config === void 0) { config = {
            enableAutoSave: true,
            enableNotifications: true,
            defaultWeeklyHours: 2
        }; }
        this.progressClasses = [];
        this.selectedClassId = null;
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
    ProgressManager.prototype.renderProgressUI = function () {
        console.log('renderProgressUI 시작');
        console.log('progressClasses.length:', this.progressClasses.length);
        console.log('progressClasses:', this.progressClasses);
        // 기존 요소들 정리
        this.cleanupSidebar();
        var sidebarTitle = this.$('#sidebarTitle');
        if (sidebarTitle)
            sidebarTitle.textContent = '수업 진도 관리';
        // 사이드바에 반 목록과 시간표 표시
        var formHtml = "\n        <div class=\"sidebar-form-group\">\n            <input id=\"progressClassNameInput\" type=\"text\" placeholder=\"\uC0C8\uB85C\uC6B4 \uBC18 \uC774\uB984\">\n            <button id=\"progressAddClassBtn\" class=\"btn primary\" data-tooltip=\"\uC0C8\uB85C\uC6B4 \uBC18\uC744 \uCD94\uAC00\uD569\uB2C8\uB2E4.\">\n                <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"></line></svg>\n            </button>\n        </div>\n        <div id=\"progressClassList\" class=\"progress-class-list\"></div>\n    ";
        var sidebarFormContainer = this.$('#sidebar-form-container');
        if (sidebarFormContainer)
            sidebarFormContainer.innerHTML = formHtml;
        // 사이드바 푸터에 방문자 수와 저작권 추가
        var sidebarFooter = this.$('.sidebar-footer');
        if (sidebarFooter) {
            sidebarFooter.innerHTML = "\n            <div class=\"visitor-count\">\n                <span>\uBC29\uBB38\uC790 \uC218: <span id=\"visitorCount\">\uB85C\uB529 \uC911...</span></span>\n            </div>\n            <div class=\"copyright\">\n                <span>&copy; 2024 PE Helper Online. All rights reserved.</span>\n            </div>\n        ";
        }
        console.log('진도표 메인 콘텐츠 렌더링');
        var contentWrapper = this.$('#content-wrapper');
        if (contentWrapper) {
            contentWrapper.innerHTML = "\n            <div class=\"progress-main-content\">\n                <div class=\"progress-right\">\n                    <div class=\"progress-right-header\">\n                        <div class=\"progress-setting-header\" id=\"progressSettingHeader\">\n                            <div class=\"title\">\uC218\uC5C5 \uC124\uC815</div>\n                            <div style=\"font-size: 12px; color: #666; margin-top: 4px;\">\n                                \uB514\uBC84\uADF8: \uC9C4\uB3C4\uD45C \uD074\uB798\uC2A4 \uC218 ".concat(this.progressClasses.length, ", \uC120\uD0DD\uB41C ID: ").concat(this.selectedClassId, "\n                            </div>\n                        </div>\n                        <div class=\"progress-setting-bar\">\n                            <div class=\"progress-setting-controls\" id=\"progressSettingControls\">\n                                <label for=\"progressTeacherName\">\uB2F4\uB2F9\uAD50\uC0AC</label>\n                                <input id=\"progressTeacherName\" type=\"text\" placeholder=\"\uB2F4\uB2F9\uAD50\uC0AC\uBA85 \uC785\uB825\" />\n                                <label for=\"progressUnitContent\">\uB2E8\uC6D0 \uB0B4\uC6A9</label>\n                                <input id=\"progressUnitContent\" type=\"text\" placeholder=\"\uB2E8\uC6D0 \uB0B4\uC6A9 \uC785\uB825\" />\n                                <label for=\"progressWeeklyHours\">\uC8FC\uB2F9 \uC2DC\uAC04</label>\n                                <select id=\"progressWeeklyHours\">\n                                    <option value=\"1\">1\uC2DC\uAC04</option>\n                                    <option value=\"2\">2\uC2DC\uAC04</option>\n                                    <option value=\"3\">3\uC2DC\uAC04</option>\n                                    <option value=\"4\">4\uC2DC\uAC04</option>\n                                    <option value=\"5\">5\uC2DC\uAC04</option>\n                                </select>\n                                <button id=\"progressSaveSettingBtn\" class=\"save\">\uC124\uC815 \uC800\uC7A5</button>\n                            </div>\n                        </div>\n                    </div>\n                    <div class=\"progress-right-body\">\n                        <div class=\"progress-sheet-header\">\n                            <h2>\uC218\uC5C5 \uAE30\uB85D \uAD00\uB9AC</h2>\n                        </div>\n                        <div id=\"progressSheetArea\" class=\"progress-sheet\">\n                            <div class=\"progress-empty\">\uBC18\uC744 \uC120\uD0DD\uD558\uACE0 \"\uC124\uC815 \uC800\uC7A5\"\uC744 \uB204\uB974\uBA74 \uC9C4\uB3C4\uD45C\uAC00 \uC0DD\uC131\uB429\uB2C8\uB2E4.</div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        ");
        }
        // 이벤트 리스너 설정
        this.setupEventListeners();
        // 데이터 로드 및 초기화
        this.loadProgressSelected();
        this.renderProgressClassList();
    };
    /**
     * 반 목록을 렌더링합니다.
     */
    ProgressManager.prototype.renderProgressClassList = function () {
        var _this = this;
        var classList = this.$('#progressClassList');
        if (!classList)
            return;
        if (this.progressClasses.length === 0) {
            classList.innerHTML = '<div class="empty-state">아직 생성된 반이 없습니다.</div>';
            return;
        }
        classList.innerHTML = this.progressClasses.map(function (cls) { return "\n        <div class=\"progress-class-item ".concat(cls.id === _this.selectedClassId ? 'active' : '', "\" \n             data-class-id=\"").concat(cls.id, "\">\n            <div class=\"class-info\">\n                <div class=\"class-name\">").concat(cls.name, "</div>\n                <div class=\"class-details\">\n                    <span>").concat(cls.teacherName || '담당교사 미설정', "</span>\n                    <span>\u2022</span>\n                    <span>").concat(cls.weeklyHours, "\uC2DC\uAC04/\uC8FC</span>\n                </div>\n            </div>\n            <div class=\"class-actions\">\n                <button class=\"btn-icon edit\" data-action=\"edit\" data-class-id=\"").concat(cls.id, "\" title=\"\uD3B8\uC9D1\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\"></path><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\"></path></svg>\n                </button>\n                <button class=\"btn-icon delete\" data-action=\"delete\" data-class-id=\"").concat(cls.id, "\" title=\"\uC0AD\uC81C\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"3,6 5,6 21,6\"></polyline><path d=\"M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2\"></path></svg>\n                </button>\n            </div>\n        </div>\n    "); }).join('');
    };
    /**
     * 새 반을 추가합니다.
     */
    ProgressManager.prototype.addProgressClass = function () {
        var input = this.$('#progressClassNameInput');
        if (!input)
            return;
        var name = input.value.trim();
        if (!name) {
            alert('반 이름을 입력해주세요.');
            return;
        }
        var newClass = {
            id: Date.now().toString(),
            name: name,
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
    };
    /**
     * 반을 선택합니다.
     * @param classId 선택할 반의 ID
     */
    ProgressManager.prototype.selectProgressClass = function (classId) {
        this.selectedClassId = classId;
        this.saveProgressSelected();
        this.renderProgressClassList();
        this.loadProgressSelected();
    };
    /**
     * 반을 삭제합니다.
     * @param classId 삭제할 반의 ID
     */
    ProgressManager.prototype.deleteProgressClass = function (classId) {
        if (!confirm('정말로 이 반을 삭제하시겠습니까?'))
            return;
        var index = this.progressClasses.findIndex(function (cls) { return cls.id === classId; });
        if (index === -1)
            return;
        this.progressClasses.splice(index, 1);
        if (this.selectedClassId === classId) {
            this.selectedClassId = null;
        }
        this.saveDataCallback();
        this.renderProgressClassList();
        this.loadProgressSelected();
    };
    /**
     * 수업 설정을 저장합니다.
     */
    ProgressManager.prototype.saveProgressSetting = function () {
        var _this = this;
        var _a, _b, _c;
        if (!this.selectedClassId) {
            alert('먼저 반을 선택해주세요.');
            return;
        }
        var selectedClass = this.progressClasses.find(function (cls) { return cls.id === _this.selectedClassId; });
        if (!selectedClass)
            return;
        var teacherName = ((_a = this.$('#progressTeacherName')) === null || _a === void 0 ? void 0 : _a.value) || '';
        var unitContent = ((_b = this.$('#progressUnitContent')) === null || _b === void 0 ? void 0 : _b.value) || '';
        var weeklyHours = parseInt(((_c = this.$('#progressWeeklyHours')) === null || _c === void 0 ? void 0 : _c.value) || '2');
        selectedClass.teacherName = teacherName;
        selectedClass.unitContent = unitContent;
        selectedClass.weeklyHours = weeklyHours;
        selectedClass.updatedAt = Date.now();
        this.saveDataCallback();
        this.renderProgressClassList();
        // 진도표 생성
        this.generateProgressSheet(selectedClass);
    };
    /**
     * 진도표를 생성합니다.
     * @param selectedClass 선택된 반 정보
     */
    ProgressManager.prototype.generateProgressSheet = function (selectedClass) {
        var sheetArea = this.$('#progressSheetArea');
        if (!sheetArea)
            return;
        var weeks = 20; // 20주차까지
        var hours = selectedClass.weeklyHours;
        var tableHtml = "\n        <div class=\"progress-table-container\">\n            <table class=\"progress-table\">\n                <thead>\n                    <tr>\n                        <th>\uC8FC\uCC28</th>\n                        ".concat(Array.from({ length: hours }, function (_, i) { return "<th>".concat(i + 1, "\uCC28\uC2DC</th>"); }).join(''), "\n                    </tr>\n                </thead>\n                <tbody>\n    ");
        var _loop_1 = function (week) {
            tableHtml += "<tr><td class=\"week-cell\">".concat(week, "\uC8FC</td>");
            var _loop_2 = function (hour) {
                var record = selectedClass.records.find(function (r) { return r.week === week && r.hour === hour; });
                var content = (record === null || record === void 0 ? void 0 : record.content) || '';
                var note = (record === null || record === void 0 ? void 0 : record.note) || '';
                var completed = (record === null || record === void 0 ? void 0 : record.completed) || false;
                tableHtml += "\n                <td class=\"hour-cell ".concat(completed ? 'completed' : '', "\">\n                    <div class=\"hour-content\">\n                        <input type=\"text\" \n                               class=\"content-input\" \n                               placeholder=\"\uC218\uC5C5 \uB0B4\uC6A9\" \n                               value=\"").concat(content, "\"\n                               data-week=\"").concat(week, "\" \n                               data-hour=\"").concat(hour, "\">\n                        <input type=\"text\" \n                               class=\"note-input\" \n                               placeholder=\"\uBE44\uACE0\" \n                               value=\"").concat(note, "\"\n                               data-week=\"").concat(week, "\" \n                               data-hour=\"").concat(hour, "\">\n                        <label class=\"completed-checkbox\">\n                            <input type=\"checkbox\" \n                                   ").concat(completed ? 'checked' : '', "\n                                   data-week=\"").concat(week, "\" \n                                   data-hour=\"").concat(hour, "\">\n                            \uC644\uB8CC\n                        </label>\n                    </div>\n                </td>\n            ");
            };
            for (var hour = 1; hour <= hours; hour++) {
                _loop_2(hour);
            }
            tableHtml += '</tr>';
        };
        for (var week = 1; week <= weeks; week++) {
            _loop_1(week);
        }
        tableHtml += "\n                </tbody>\n            </table>\n        </div>\n    ";
        sheetArea.innerHTML = tableHtml;
    };
    /**
     * 이벤트 리스너를 설정합니다.
     */
    ProgressManager.prototype.setupEventListeners = function () {
        var _this = this;
        // 반 추가 버튼
        var addBtn = this.$('#progressAddClassBtn');
        if (addBtn) {
            addBtn.addEventListener('click', function () { return _this.addProgressClass(); });
        }
        // 반 이름 입력 엔터키
        var nameInput = this.$('#progressClassNameInput');
        if (nameInput) {
            nameInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter')
                    _this.addProgressClass();
            });
        }
        // 반 목록 클릭 이벤트
        var classList = this.$('#progressClassList');
        if (classList) {
            classList.addEventListener('click', function (e) {
                var target = e.target;
                var classItem = target.closest('.progress-class-item');
                var actionBtn = target.closest('[data-action]');
                if (classItem && !actionBtn) {
                    var classId = classItem.getAttribute('data-class-id');
                    if (classId)
                        _this.selectProgressClass(classId);
                }
                else if (actionBtn) {
                    var action = actionBtn.getAttribute('data-action');
                    var classId = actionBtn.getAttribute('data-class-id');
                    if (action === 'edit' && classId) {
                        _this.editProgressClass(classId);
                    }
                    else if (action === 'delete' && classId) {
                        _this.deleteProgressClass(classId);
                    }
                }
            });
        }
        // 설정 저장 버튼
        var saveBtn = this.$('#progressSaveSettingBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function () { return _this.saveProgressSetting(); });
        }
        // 진도표 입력 이벤트
        var sheetArea = this.$('#progressSheetArea');
        if (sheetArea) {
            sheetArea.addEventListener('input', function (e) {
                var target = e.target;
                if (target.classList.contains('content-input') ||
                    target.classList.contains('note-input') ||
                    target.classList.contains('completed-checkbox')) {
                    _this.updateProgressRecord(target);
                }
            });
        }
    };
    /**
     * 진도 기록을 업데이트합니다.
     * @param element 변경된 요소
     */
    ProgressManager.prototype.updateProgressRecord = function (element) {
        var _this = this;
        if (!this.selectedClassId)
            return;
        var selectedClass = this.progressClasses.find(function (cls) { return cls.id === _this.selectedClassId; });
        if (!selectedClass)
            return;
        var week = parseInt(element.getAttribute('data-week') || '0');
        var hour = parseInt(element.getAttribute('data-hour') || '0');
        if (week === 0 || hour === 0)
            return;
        var record = selectedClass.records.find(function (r) { return r.week === week && r.hour === hour; });
        if (!record) {
            record = {
                id: Date.now().toString(),
                week: week,
                hour: hour,
                content: '',
                note: '',
                completed: false,
                createdAt: Date.now()
            };
            selectedClass.records.push(record);
        }
        if (element.classList.contains('content-input')) {
            record.content = element.value;
        }
        else if (element.classList.contains('note-input')) {
            record.note = element.value;
        }
        else if (element.classList.contains('completed-checkbox')) {
            record.completed = element.checked;
        }
        selectedClass.updatedAt = Date.now();
        this.saveDataCallback();
    };
    /**
     * 반을 편집합니다.
     * @param classId 편집할 반의 ID
     */
    ProgressManager.prototype.editProgressClass = function (classId) {
        var selectedClass = this.progressClasses.find(function (cls) { return cls.id === classId; });
        if (!selectedClass)
            return;
        var newName = prompt('반 이름을 수정하세요:', selectedClass.name);
        if (newName && newName.trim() !== selectedClass.name) {
            selectedClass.name = newName.trim();
            selectedClass.updatedAt = Date.now();
            this.saveDataCallback();
            this.renderProgressClassList();
        }
    };
    /**
     * 선택된 반을 로드합니다.
     */
    ProgressManager.prototype.loadProgressSelected = function () {
        var _this = this;
        if (!this.selectedClassId)
            return;
        var selectedClass = this.progressClasses.find(function (cls) { return cls.id === _this.selectedClassId; });
        if (!selectedClass)
            return;
        // 설정 폼에 데이터 채우기
        var teacherNameInput = this.$('#progressTeacherName');
        var unitContentInput = this.$('#progressUnitContent');
        var weeklyHoursSelect = this.$('#progressWeeklyHours');
        if (teacherNameInput)
            teacherNameInput.value = selectedClass.teacherName || '';
        if (unitContentInput)
            unitContentInput.value = selectedClass.unitContent || '';
        if (weeklyHoursSelect)
            weeklyHoursSelect.value = selectedClass.weeklyHours.toString();
        // 진도표 생성
        this.generateProgressSheet(selectedClass);
    };
    /**
     * 선택된 반을 저장합니다.
     */
    ProgressManager.prototype.saveProgressSelected = function () {
        if (this.selectedClassId) {
            localStorage.setItem('progressSelectedClassId', this.selectedClassId);
        }
        else {
            localStorage.removeItem('progressSelectedClassId');
        }
    };
    /**
     * 사이드바를 정리합니다.
     */
    ProgressManager.prototype.cleanupSidebar = function () {
        var sidebarFormContainer = this.$('#sidebar-form-container');
        if (sidebarFormContainer) {
            sidebarFormContainer.innerHTML = '';
        }
    };
    /**
     * 현재 반 목록을 반환합니다.
     * @returns 현재 반 목록
     */
    ProgressManager.prototype.getProgressClasses = function () {
        return this.progressClasses;
    };
    /**
     * 선택된 반 ID를 반환합니다.
     * @returns 선택된 반 ID 또는 null
     */
    ProgressManager.prototype.getSelectedClassId = function () {
        return this.selectedClassId;
    };
    /**
     * 반 목록을 설정합니다.
     * @param classes 설정할 반 목록
     */
    ProgressManager.prototype.setProgressClasses = function (classes) {
        this.progressClasses = classes;
    };
    /**
     * 선택된 반 ID를 설정합니다.
     * @param classId 설정할 반 ID
     */
    ProgressManager.prototype.setSelectedClassId = function (classId) {
        this.selectedClassId = classId;
    };
    return ProgressManager;
}());
exports.ProgressManager = ProgressManager;
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
function initializeProgressManager(progressClasses, selectedClassId, $, $$, saveDataCallback, config) {
    return new ProgressManager(progressClasses, selectedClassId, $, $$, saveDataCallback, config);
}
