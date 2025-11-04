/**
 * 토너먼트 수업 관리 모듈
 *
 * 이 모듈은 토너먼트 수업의 모든 기능을 관리합니다.
 * 토너먼트 생성/삭제, 팀 관리, 대진표 구성, 경기 관리 등을 담당합니다.
 *
 * 현재 지원하는 팀 수: 3-24팀
 * TODO: 25-32팀 토너먼트 로직 추가 예정
 *
 * @author PE Helper Online
 * @version 2.2.1
 * @since 2024-01-01
 */
import { validateData, TournamentSchema } from './validators.js';
import { showError, showSuccess } from './errorHandler.js';
import { logger, logWarn, logError } from './logger.js';
/**
 * 토너먼트 관리자 클래스
 */
export class TournamentManager {
    constructor(tournamentData, saveCallback) {
        this.saveCallback = null;
        this.dataUpdateCallback = null;
        this.tournamentData = tournamentData;
        this.saveCallback = saveCallback || null;
    }
    /**
     * 토너먼트 데이터를 설정합니다.
     * @param data 토너먼트 데이터
     */
    setTournamentData(data) {
        this.tournamentData = data;
    }
    /**
     * 데이터 업데이트 콜백을 설정합니다.
     * @param callback 콜백 함수
     */
    setDataUpdateCallback(callback) {
        this.dataUpdateCallback = callback;
    }
    /**
     * 저장 콜백을 설정합니다.
     * @param callback 콜백 함수
     */
    setSaveCallback(callback) {
        this.saveCallback = callback;
    }
    /**
     * 데이터를 저장합니다.
     */
    saveData() {
        if (this.dataUpdateCallback) {
            this.dataUpdateCallback(this.tournamentData);
        }
        if (this.saveCallback) {
            this.saveCallback();
        }
    }
    /**
     * DOM 요소를 가져옵니다.
     * @param selector CSS 선택자
     * @returns DOM 요소 또는 null
     */
    getElement(selector) {
        return document.querySelector(selector);
    }
    /**
     * jQuery 스타일 선택자 함수
     * @param selector CSS 선택자
     * @returns jQuery 스타일 객체
     */
    $(selector) {
        const element = document.querySelector(selector);
        if (!element)
            return null;
        return {
            html: (content) => {
                if (content !== undefined) {
                    element.innerHTML = content;
                    return this;
                }
                return element.innerHTML;
            },
            text: (content) => {
                if (content !== undefined) {
                    element.textContent = content;
                    return this;
                }
                return element.textContent;
            },
            addEventListener: (event, handler) => {
                element.addEventListener(event, handler);
                return this;
            },
            classList: element.classList,
            style: element.style,
            value: element.value,
            checked: element.checked,
            innerHTML: element.innerHTML,
            textContent: element.textContent
        };
    }
    /**
     * 로그를 출력합니다.
     * @param message 로그 메시지
     * @param data 추가 데이터
     */
    log(message, data) {
        if (data !== undefined) {
            logger.debug(`[TournamentManager] ${message}`, data);
        }
        else {
            logger.debug(`[TournamentManager] ${message}`);
        }
    }
    /**
     * 에러 로그를 출력합니다.
     * @param message 에러 메시지
     */
    logError(message) {
        logError(`[TournamentManager] ${message}`);
    }
    /**
     * 사이드바를 정리합니다.
     */
    cleanupSidebar() {
        this.log('사이드바 정리 시작');
        const sidebarTitle = this.getElement('#sidebarTitle');
        const sidebarFormContainer = this.getElement('#sidebar-form-container');
        if (sidebarTitle)
            sidebarTitle.textContent = '';
        if (sidebarFormContainer)
            sidebarFormContainer.innerHTML = '';
        // sidebar-list-container는 renderTournamentList()에서 다시 채우므로 여기서 비우지 않음
        this.log('사이드바 정리 완료');
    }
    /**
     * 토너먼트 UI를 렌더링합니다.
     */
    renderTournamentUI() {
        this.log('renderTournamentUI 호출됨');
        // 기존 요소들 정리
        this.cleanupSidebar();
        this.$('#sidebarTitle').text('토너먼트 목록');
        const isFirstTimeUser = this.tournamentData.tournaments.length === 0;
        let formHtml = `
            <div style="position: relative;" class="${isFirstTimeUser ? 'intro-container-active' : ''}">
                <div class="sidebar-form-group ${isFirstTimeUser ? 'intro-highlight' : ''}">
                    <input id="tournamentNameInput" type="text" placeholder="새로운 토너먼트 이름">
                    <button onclick="createTournament()" class="btn primary" data-tooltip="새로운 토너먼트를 목록에 추가합니다.">
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
        this.$('#sidebar-form-container').html(formHtml);
        this.renderTournamentList();
        const activeTournament = this.tournamentData.tournaments.find(t => t.id === this.tournamentData.activeTournamentId);
        if (activeTournament) {
            this.renderTournamentDashboard(activeTournament);
        }
        else {
            this.$('#content-wrapper').html('<div class="placeholder-view"><div class="placeholder-content"><h3>토너먼트를 선택하여 시작하세요</h3><p>왼쪽에서 토너먼트를 선택하거나 새로 만들어주세요.</p></div></div>');
        }
    }
    /**
     * 토너먼트 목록을 렌더링합니다.
     */
    renderTournamentList() {
        this.log('renderTournamentList 호출됨');
        const list = this.$('#sidebar-list-container');
        list.html('');
        if (this.tournamentData.tournaments.length === 0) {
            list.html(`<p style="text-align:center; color: var(--ink-muted);">저장된 토너먼트가 없습니다.</p>`);
        }
        else {
            this.tournamentData.tournaments.forEach(t => {
                const card = document.createElement('div');
                card.className = `list-card ${t.id === this.tournamentData.activeTournamentId ? 'active' : ''}`;
                card.onclick = () => this.selectTournament(t.id);
                card.innerHTML = `
                    <div>
                        <div class="name">${t.name}</div>
                        <div class="details">${t.sport || '종목 미지정'} · ${t.teams.length}팀</div>
                    </div>
                     <div class="action-buttons row">
                        <button onclick="event.stopPropagation(); showTournamentSettings('${t.id}');" data-tooltip="설정 수정"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button onclick="event.stopPropagation(); deleteTournament('${t.id}');" data-tooltip="삭제"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                    </div>
                `;
                this.getElement('#sidebar-list-container')?.appendChild(card);
            });
        }
    }
    /**
     * 토너먼트 대시보드를 렌더링합니다.
     * @param tourney 토너먼트 객체
     */
    renderTournamentDashboard(tourney) {
        this.log('renderTournamentDashboard 호출됨', tourney.name);
        this.$('#content-wrapper').html(`
            <h2 style="display: flex; align-items: center; gap: 8px;">
                토너먼트 설정
            </h2>
            <section class="section-box">
                <div class="settings-grid">
                    <div class="field"><label for="tourneyName">토너먼트 이름*</label><input id="tourneyName" type="text" value="${tourney.name || ''}"></div>
                    <div class="field"><label for="tourneySport">경기 종목*</label><input id="tourneySport" type="text" value="${tourney.sport || ''}" placeholder="예) 족구, 피구"></div>
                    <div class="field"><label>토너먼트 형식*</label><div class="chip-group"><label><input type="radio" name="format" value="single" ${tourney.format === 'single' ? 'checked' : ''}> 싱글</label><label><input type="radio" name="format" value="double" disabled data-tooltip="준비 중인 기능입니다."> 더블(준비중)</label></div></div>
                    <div class="field"><label>시드 배정</label><div class="chip-group"><label><input type="radio" name="seeding" value="input" ${tourney.seeding !== 'random' ? 'checked' : ''}> 입력 순</label><label><input type="radio" name="seeding" value="random" ${tourney.seeding === 'random' ? 'checked' : ''}> 무작위</label></div></div>
                    <button onclick="updateTournamentSettings()" class="btn" style="background:var(--win); color:white;">설정 저장</button>
                </div>
            </section>

            <h2 style="margin-top: 1.5rem;">참가 팀 관리 (${tourney.teams.length}팀)</h2>
            <section class="section-box">
                 <div class="row" style="align-items: flex-end;">
                    <div class="field" style="flex-grow:1; margin-bottom: 0;">
                        <label for="teamNameInput">신규 팀 추가</label>
                        <div class="form-group">
                            <input id="teamNameInput" type="text" placeholder="팀(선수) 이름 입력 후 엔터" style="ime-mode: active;">
                            <button onclick="addTeamToTournament()" class="btn primary" data-tooltip="팀 추가">추가</button>
                        </div>
                    </div>
                </div>
                <div id="teamsList" class="student-list-grid" style="margin-top: 1rem;">
                    ${tourney.teams.map(team => `<div class="student-item"><span>${team}</span><div class="action-buttons"><button onclick="removeTeamFromTournament('${team}')" data-tooltip="삭제">삭제</button></div></div>`).join('')}
                </div>
            </section>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                 <h2 style="margin-top: 1.5rem;">대진표</h2>
                 <div class="row">
                     <button class="btn" onclick="shareView('tournament', 'bracket')">대진표 공유</button>
                     <button class="btn" onclick="printBracket()">인쇄</button>
                 </div>
            </div>
            <div id="bracket-container" class="bracket-wrap">
                <div id="rounds" class="rounds"></div>
                <svg id="svgLayer" class="svg-layer"></svg>
            </div>
             <div style="font-size: 12px; color: var(--ink-muted); text-align: right; padding-top: 8px;">팀 추가/삭제 시 대진표는 자동 저장됩니다.</div>
        `);
        this.$('#teamNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTeamToTournament();
            }
        });
        // 대진표 렌더링
        this.buildBracket(tourney);
    }
    /**
     * 토너먼트를 생성합니다.
     */
    createTournament() {
        this.log('createTournament 호출됨');
        const input = this.getElement('#tournamentNameInput');
        if (!input)
            return;
        const name = input.value.trim();
        // 이름 유효성 검사
        if (!name) {
            showError(new Error('토너먼트 이름을 입력해주세요.'));
            return;
        }
        // 데이터 생성 및 검증
        const newTourneyData = {
            id: 't_' + Date.now(),
            name,
            teams: [],
            rounds: [],
            sport: '',
            format: 'single',
            seeding: 'input'
        };
        const validation = validateData(TournamentSchema, newTourneyData);
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
        const newTourney = validation.data;
        this.tournamentData.tournaments.unshift(newTourney);
        this.tournamentData.activeTournamentId = newTourney.id;
        input.value = '';
        this.saveData();
        this.renderTournamentList();
        this.renderTournamentDashboard(newTourney);
        showSuccess('토너먼트가 생성되었습니다.');
    }
    /**
     * 토너먼트를 선택합니다.
     * @param id 토너먼트 ID
     */
    selectTournament(id) {
        this.log('selectTournament 호출됨', id);
        this.tournamentData.activeTournamentId = id;
        const tourney = this.tournamentData.tournaments.find(t => t.id === id);
        if (tourney) {
            this.renderTournamentDashboard(tourney);
        }
        this.saveData();
    }
    /**
     * 토너먼트를 삭제합니다.
     * @param id 토너먼트 ID
     */
    deleteTournament(id) {
        this.log('deleteTournament 호출됨', id);
        if (confirm('이 토너먼트의 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
            this.tournamentData.tournaments = this.tournamentData.tournaments.filter(t => t.id !== id);
            if (this.tournamentData.activeTournamentId === id) {
                this.tournamentData.activeTournamentId = null;
            }
            this.saveData();
            this.renderTournamentList();
            this.$('#content-wrapper').html('<div class="placeholder-view"><div class="placeholder-content"><h3>토너먼트를 선택하여 시작하세요</h3><p>왼쪽에서 토너먼트를 선택하거나 새로 만들어주세요.</p></div></div>');
        }
    }
    /**
     * 토너먼트 설정을 표시합니다.
     * @param tournamentId 토너먼트 ID
     */
    showTournamentSettings(tournamentId) {
        this.log('showTournamentSettings 호출됨', tournamentId);
        this.tournamentData.activeTournamentId = tournamentId;
        const tourney = this.tournamentData.tournaments.find(t => t.id === tournamentId);
        if (tourney) {
            this.renderTournamentDashboard(tourney);
        }
    }
    /**
     * 토너먼트 설정을 업데이트합니다.
     */
    updateTournamentSettings() {
        this.log('updateTournamentSettings 호출됨');
        const tourney = this.tournamentData.tournaments.find(t => t.id === this.tournamentData.activeTournamentId);
        if (!tourney)
            return;
        const nameInput = this.getElement('#tourneyName');
        const sportInput = this.getElement('#tourneySport');
        const formatInputs = document.querySelectorAll('input[name="format"]');
        const seedingInputs = document.querySelectorAll('input[name="seeding"]');
        if (nameInput)
            tourney.name = nameInput.value.trim();
        if (sportInput)
            tourney.sport = sportInput.value.trim();
        formatInputs.forEach(input => {
            if (input.checked)
                tourney.format = input.value;
        });
        seedingInputs.forEach(input => {
            if (input.checked)
                tourney.seeding = input.value;
        });
        this.saveData();
        this.renderTournamentList();
        alert('설정이 저장되었습니다.');
    }
    /**
     * 토너먼트에 팀을 추가합니다.
     */
    addTeamToTournament() {
        this.log('addTeamToTournament 호출됨');
        const tourney = this.tournamentData.tournaments.find(t => t.id === this.tournamentData.activeTournamentId);
        if (!tourney)
            return;
        const input = this.getElement('#teamNameInput');
        if (!input)
            return;
        const teamName = input.value.trim();
        if (teamName && !tourney.teams.includes(teamName)) {
            tourney.teams.push(teamName);
            input.value = '';
            this.saveData();
            this.renderTournamentDashboard(tourney);
        }
    }
    /**
     * 토너먼트에서 팀을 제거합니다.
     * @param teamNameToRemove 제거할 팀 이름
     */
    removeTeamFromTournament(teamNameToRemove) {
        this.log('removeTeamFromTournament 호출됨', teamNameToRemove);
        const tourney = this.tournamentData.tournaments.find(t => t.id === this.tournamentData.activeTournamentId);
        if (!tourney)
            return;
        tourney.teams = tourney.teams.filter(team => team !== teamNameToRemove);
        // 대진표가 있으면 다시 생성
        if (tourney.rounds && tourney.rounds.length > 0) {
            this.buildBracket(tourney);
        }
        this.saveData();
        this.renderTournamentDashboard(tourney);
    }
    /**
     * 팀 이름을 편집합니다.
     * @param oldName 기존 팀 이름
     * @param newName 새로운 팀 이름
     */
    editTeamName(oldName, newName) {
        this.log('editTeamName 호출됨', { oldName, newName });
        const tourney = this.tournamentData.tournaments.find(t => t.id === this.tournamentData.activeTournamentId);
        if (!tourney)
            return;
        const teamIndex = tourney.teams.indexOf(oldName);
        if (teamIndex !== -1) {
            tourney.teams[teamIndex] = newName;
            this.saveData();
            this.renderTournamentDashboard(tourney);
        }
    }
    /**
     * 대진표를 구성합니다.
     * @param tourney 토너먼트 객체
     */
    buildBracket(tourney) {
        this.log('buildBracket 호출됨');
        const currentTourney = tourney || this.tournamentData.tournaments.find(t => t.id === this.tournamentData.activeTournamentId);
        if (!currentTourney)
            return;
        if (currentTourney.teams.length < 2) {
            // 팀이 부족해도 빈 대진표는 렌더링
            this.renderBracket(currentTourney);
            return;
        }
        const teams = currentTourney.teams;
        let roundsData = [];
        if (teams.length > 0) {
            let matchIdSeq = 1;
            const makeMatch = (roundIdx, slotIdx, teamA, teamB, isBye = false) => ({
                id: 'm_' + currentTourney.id + '_' + (Date.now() + matchIdSeq++),
                roundIdx,
                slotIdx,
                teamA: teamA || null,
                teamB: teamB || null,
                scoreA: null,
                scoreB: null,
                winner: null,
                parentId: null,
                isBye: isBye,
                matchNumber: null
            });
            const numTeams = teams.length;
            let seededTeams = currentTourney.seeding === 'random' ? [...teams].sort(() => 0.5 - Math.random()) : [...teams];
            // 2의 n승 계산하여 부전승 팀 수 결정
            const totalSlots = 1 << Math.ceil(Math.log2(numTeams));
            const byeCount = totalSlots - numTeams;
            this.log(`팀 수: ${numTeams}, 총 슬롯: ${totalSlots}, 부전승: ${byeCount}`);
            if (numTeams <= 24) {
                // 16팀 이하: 특별한 대진표 생성
                if (numTeams === 3) {
                    // 3팀: 1팀 부전승, 2팀 경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[1], seededTeams[2])
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null) // 1팀 vs ROUND1 승자
                    ]);
                    roundsData[0][0].parentId = roundsData[1][0].id;
                }
                else if (numTeams === 4) {
                    // 4팀: 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[0], seededTeams[3]),
                        makeMatch(0, 1, seededTeams[1], seededTeams[2])
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData.push([
                        makeMatch(1, 0, null, null)
                    ]);
                    roundsData[0][0].parentId = roundsData[1][0].id;
                    roundsData[0][1].parentId = roundsData[1][0].id;
                }
                else if (numTeams === 5) {
                    // 5팀: 1경기 → 2라운드(3팀 부전승) → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[3], seededTeams[4])
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData.push([
                        makeMatch(1, 0, null, null), // #1 vs ROUND1 승자
                        makeMatch(1, 1, seededTeams[1], seededTeams[2]) // #2 vs #3
                    ]);
                    roundsData[1][1].matchNumber = 2;
                    roundsData.push([
                        makeMatch(2, 0, null, null)
                    ]);
                    // 연결선을 위한 parentId 설정
                    roundsData[0][0].parentId = roundsData[1][0].id;
                    roundsData[1][0].parentId = roundsData[2][0].id;
                    roundsData[1][1].parentId = roundsData[2][0].id;
                }
                else if (numTeams === 6) {
                    // 6팀: 2팀 부전승, 4팀 경기 → 2라운드 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[2], seededTeams[3]),
                        makeMatch(0, 1, seededTeams[4], seededTeams[5])
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1팀 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[1], null) // 2팀 vs ROUND1-2 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null)
                    ]);
                    roundsData[0][0].parentId = roundsData[1][0].id;
                    roundsData[0][1].parentId = roundsData[1][1].id;
                    roundsData[1][0].parentId = roundsData[2][0].id;
                    roundsData[1][1].parentId = roundsData[2][0].id;
                }
                else if (numTeams === 7) {
                    // 7팀: 1팀 부전승, 6팀 3경기 → 2라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[3], seededTeams[4]), // 4반 vs 6반
                        makeMatch(0, 1, seededTeams[1], seededTeams[6]), // 2반 vs 5반
                        makeMatch(0, 2, seededTeams[2], seededTeams[5]) // 3반 vs 7반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, null, null) // ROUND1-2 승자 vs ROUND1-3 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][1].id; // 1라운드 2경기 → 2라운드 2경기
                    roundsData[0][2].parentId = roundsData[1][1].id; // 1라운드 3경기 → 2라운드 2경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 결승
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 결승
                }
                else if (numTeams === 9) {
                    // 9팀: 7팀 부전승, 2팀 1경기 → 2라운드 4경기 → 3라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[7], seededTeams[8]) // 8반 vs 9반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1 승자
                        makeMatch(1, 1, seededTeams[1], seededTeams[2]), // 2반 vs 3반
                        makeMatch(1, 2, seededTeams[3], seededTeams[4]), // 4반 vs 5반
                        makeMatch(1, 3, seededTeams[5], seededTeams[6]) // 6반 vs 7반
                    ]);
                    roundsData[1][1].matchNumber = 2;
                    roundsData[1][2].matchNumber = 3;
                    roundsData[1][3].matchNumber = 4;
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 → 2라운드 1경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 10) {
                    // 10팀: 6팀 부전승, 4팀 2경기 → 2라운드 4경기 → 3라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(0, 1, seededTeams[6], seededTeams[9]) // 7반 vs 10반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[3], seededTeams[4]), // 4반 vs 5반
                        makeMatch(1, 2, seededTeams[1], null), // 2반 vs ROUND1-2 승자
                        makeMatch(1, 3, seededTeams[2], seededTeams[5]) // 3반 vs 6반
                    ]);
                    roundsData[1][1].matchNumber = 2;
                    roundsData[1][2].matchNumber = 3;
                    roundsData[1][3].matchNumber = 4;
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][2].id; // 1라운드 2경기 → 2라운드 3경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 11) {
                    // 11팀: 5팀 부전승, 6팀 3경기 → 2라운드 4경기 → 3라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(0, 1, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(0, 2, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[3], seededTeams[4]), // 4반 vs 5반
                        makeMatch(1, 2, seededTeams[1], null), // 2반 vs ROUND1-2 승자
                        makeMatch(1, 3, seededTeams[2], null) // 3반 vs ROUND1-3 승자
                    ]);
                    roundsData[1][1].matchNumber = 2;
                    roundsData[1][2].matchNumber = 3;
                    roundsData[1][3].matchNumber = 4;
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][2].id; // 1라운드 2경기 → 2라운드 3경기
                    roundsData[0][2].parentId = roundsData[1][3].id; // 1라운드 3경기 → 2라운드 4경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 12) {
                    // 12팀: 4팀 부전승, 8팀 4경기 → 2라운드 4경기 → 3라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(0, 1, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(0, 2, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(0, 3, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[3], null), // 4반 vs ROUND1-2 승자
                        makeMatch(1, 2, seededTeams[1], null), // 2반 vs ROUND1-3 승자
                        makeMatch(1, 3, seededTeams[2], null) // 3반 vs ROUND1-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][1].id; // 1라운드 2경기 → 2라운드 2경기
                    roundsData[0][2].parentId = roundsData[1][2].id; // 1라운드 3경기 → 2라운드 3경기
                    roundsData[0][3].parentId = roundsData[1][3].id; // 1라운드 4경기 → 2라운드 4경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 13) {
                    // 13팀: 3팀 부전승, 10팀 5경기 → 2라운드 4경기 → 3라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(0, 1, seededTeams[3], seededTeams[12]), // 4반 vs 13반
                        makeMatch(0, 2, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(0, 3, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(0, 4, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[1], null), // 2반 vs ROUND1-2 승자
                        makeMatch(1, 2, seededTeams[2], null), // 3반 vs ROUND1-3 승자
                        makeMatch(1, 3, null, null) // ROUND1-4 승자 vs ROUND1-5 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][1].id; // 1라운드 2경기 → 2라운드 2경기
                    roundsData[0][2].parentId = roundsData[1][2].id; // 1라운드 3경기 → 2라운드 3경기
                    roundsData[0][3].parentId = roundsData[1][3].id; // 1라운드 4경기 → 2라운드 4경기
                    roundsData[0][4].parentId = roundsData[1][3].id; // 1라운드 5경기 → 2라운드 4경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 14) {
                    // 14팀: 2팀 부전승, 12팀 6경기 → 2라운드 4경기 → 3라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(0, 1, seededTeams[3], seededTeams[12]), // 4반 vs 13반
                        makeMatch(0, 2, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(0, 3, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(0, 4, seededTeams[2], seededTeams[13]), // 3반 vs 14반
                        makeMatch(0, 5, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData[0][5].matchNumber = 6;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, null, null), // ROUND1-2 승자 vs ROUND1-3 승자
                        makeMatch(1, 2, seededTeams[1], null), // 2반 vs ROUND1-4 승자
                        makeMatch(1, 3, null, null) // ROUND1-5 승자 vs ROUND1-6 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][1].id; // 1라운드 2경기 → 2라운드 2경기
                    roundsData[0][2].parentId = roundsData[1][1].id; // 1라운드 3경기 → 2라운드 2경기
                    roundsData[0][3].parentId = roundsData[1][2].id; // 1라운드 4경기 → 2라운드 3경기
                    roundsData[0][4].parentId = roundsData[1][3].id; // 1라운드 5경기 → 2라운드 4경기
                    roundsData[0][5].parentId = roundsData[1][3].id; // 1라운드 6경기 → 2라운드 4경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 15) {
                    // 15팀: 1팀 부전승, 14팀 7경기 → 2라운드 4경기 → 3라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(0, 1, seededTeams[3], seededTeams[12]), // 4반 vs 13반
                        makeMatch(0, 2, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(0, 3, seededTeams[1], seededTeams[14]), // 2반 vs 15반
                        makeMatch(0, 4, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(0, 5, seededTeams[2], seededTeams[13]), // 3반 vs 14반
                        makeMatch(0, 6, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData[0][5].matchNumber = 6;
                    roundsData[0][6].matchNumber = 7;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, null, null), // ROUND1-2 승자 vs ROUND1-3 승자
                        makeMatch(1, 2, null, null), // ROUND1-4 승자 vs ROUND1-5 승자
                        makeMatch(1, 3, null, null) // ROUND1-6 승자 vs ROUND1-7 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][1].id; // 1라운드 2경기 → 2라운드 2경기
                    roundsData[0][2].parentId = roundsData[1][1].id; // 1라운드 3경기 → 2라운드 2경기
                    roundsData[0][3].parentId = roundsData[1][2].id; // 1라운드 4경기 → 2라운드 3경기
                    roundsData[0][4].parentId = roundsData[1][2].id; // 1라운드 5경기 → 2라운드 3경기
                    roundsData[0][5].parentId = roundsData[1][3].id; // 1라운드 6경기 → 2라운드 4경기
                    roundsData[0][6].parentId = roundsData[1][3].id; // 1라운드 7경기 → 2라운드 4경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 16) {
                    // 16팀: 표준 토너먼트 (부전승 없음)
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[0], seededTeams[15]), // 1반 vs 16반
                        makeMatch(0, 1, seededTeams[8], seededTeams[7]), // 9반 vs 8반
                        makeMatch(0, 2, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(0, 3, seededTeams[12], seededTeams[3]), // 13반 vs 4반
                        makeMatch(0, 4, seededTeams[2], seededTeams[13]), // 3반 vs 14반
                        makeMatch(0, 5, seededTeams[10], seededTeams[5]), // 11반 vs 6반
                        makeMatch(0, 6, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(0, 7, seededTeams[14], seededTeams[1]) // 15반 vs 2반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData[0][5].matchNumber = 6;
                    roundsData[0][6].matchNumber = 7;
                    roundsData[0][7].matchNumber = 8;
                    roundsData.push([
                        makeMatch(1, 0, null, null), // ROUND1-1 승자 vs ROUND1-2 승자
                        makeMatch(1, 1, null, null), // ROUND1-3 승자 vs ROUND1-4 승자
                        makeMatch(1, 2, null, null), // ROUND1-5 승자 vs ROUND1-6 승자
                        makeMatch(1, 3, null, null) // ROUND1-7 승자 vs ROUND1-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null) // ROUND2-3 승자 vs ROUND2-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][0].id; // 1라운드 2경기 → 2라운드 1경기
                    roundsData[0][2].parentId = roundsData[1][1].id; // 1라운드 3경기 → 2라운드 2경기
                    roundsData[0][3].parentId = roundsData[1][1].id; // 1라운드 4경기 → 2라운드 2경기
                    roundsData[0][4].parentId = roundsData[1][2].id; // 1라운드 5경기 → 2라운드 3경기
                    roundsData[0][5].parentId = roundsData[1][2].id; // 1라운드 6경기 → 2라운드 3경기
                    roundsData[0][6].parentId = roundsData[1][3].id; // 1라운드 7경기 → 2라운드 4경기
                    roundsData[0][7].parentId = roundsData[1][3].id; // 1라운드 8경기 → 2라운드 4경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 결승
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 결승
                }
                else if (numTeams === 17) {
                    // 17팀: 15팀 부전승, 2팀 1경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]) // 16반 vs 17반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(1, 2, seededTeams[3], seededTeams[12]), // 4반 vs 13반
                        makeMatch(1, 3, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(1, 4, seededTeams[1], seededTeams[14]), // 2반 vs 15반
                        makeMatch(1, 5, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(1, 6, seededTeams[2], seededTeams[13]), // 3반 vs 14반
                        makeMatch(1, 7, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else if (numTeams === 18) {
                    // 18팀: 14팀 부전승, 4팀 2경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]), // 16반 vs 17반
                        makeMatch(0, 1, seededTeams[13], seededTeams[17]) // 14반 vs 18반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(1, 2, seededTeams[3], seededTeams[12]), // 4반 vs 13반
                        makeMatch(1, 3, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(1, 4, seededTeams[1], null), // 2반 vs ROUND1-2 승자
                        makeMatch(1, 5, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(1, 6, seededTeams[2], seededTeams[14]), // 3반 vs 15반
                        makeMatch(1, 7, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][4].id; // 1라운드 2경기 → 2라운드 5경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else if (numTeams === 19) {
                    // 19팀: 13팀 부전승, 6팀 3경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]), // 16반 vs 17반
                        makeMatch(0, 1, seededTeams[14], seededTeams[17]), // 15반 vs 18반
                        makeMatch(0, 2, seededTeams[13], seededTeams[18]) // 14반 vs 19반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(1, 2, seededTeams[3], seededTeams[12]), // 4반 vs 13반
                        makeMatch(1, 3, null, seededTeams[1]), // ROUND1-2 승자 vs 2반
                        makeMatch(1, 4, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(1, 5, null, seededTeams[2]), // ROUND1-3 승자 vs 3반
                        makeMatch(1, 6, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(1, 7, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][3].id; // 1라운드 2경기 → 2라운드 4경기 (15반vs18반 승자 vs 2반)
                    roundsData[0][2].parentId = roundsData[1][5].id; // 1라운드 3경기 → 2라운드 6경기 (14반vs19반 승자 vs 3반)
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else if (numTeams === 20) {
                    // 20팀: 12팀 부전승, 8팀 4경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]), // 16반 vs 17반
                        makeMatch(0, 1, seededTeams[12], seededTeams[19]), // 13반 vs 20반
                        makeMatch(0, 2, seededTeams[13], seededTeams[18]), // 14반 vs 19반
                        makeMatch(0, 3, seededTeams[14], seededTeams[17]) // 15반 vs 18반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(1, 2, seededTeams[3], null), // 4반 vs ROUND1-2 승자
                        makeMatch(1, 3, seededTeams[4], seededTeams[11]), // 5반 vs 12반
                        makeMatch(1, 4, seededTeams[1], null), // 2반 vs ROUND1-3 승자
                        makeMatch(1, 5, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(1, 6, seededTeams[2], null), // 3반 vs ROUND1-4 승자
                        makeMatch(1, 7, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][2].id; // 1라운드 2경기 → 2라운드 3경기
                    roundsData[0][2].parentId = roundsData[1][4].id; // 1라운드 3경기 → 2라운드 5경기
                    roundsData[0][3].parentId = roundsData[1][6].id; // 1라운드 4경기 → 2라운드 7경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else if (numTeams === 21) {
                    // 21팀: 11팀 부전승, 10팀 5경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]), // 16반 vs 17반
                        makeMatch(0, 1, seededTeams[12], seededTeams[19]), // 13반 vs 20반
                        makeMatch(0, 2, seededTeams[11], seededTeams[20]), // 12반 vs 21반
                        makeMatch(0, 3, seededTeams[13], seededTeams[18]), // 14반 vs 19반
                        makeMatch(0, 4, seededTeams[14], seededTeams[17]) // 15반 vs 18반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(1, 2, seededTeams[3], null), // 4반 vs ROUND1-2 승자
                        makeMatch(1, 3, seededTeams[4], null), // 5반 vs ROUND1-3 승자
                        makeMatch(1, 4, seededTeams[1], null), // 2반 vs ROUND1-4 승자
                        makeMatch(1, 5, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(1, 6, seededTeams[2], null), // 3반 vs ROUND1-5 승자
                        makeMatch(1, 7, seededTeams[5], seededTeams[10]) // 6반 vs 11반
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][2].id; // 1라운드 2경기 → 2라운드 3경기
                    roundsData[0][2].parentId = roundsData[1][3].id; // 1라운드 3경기 → 2라운드 4경기
                    roundsData[0][3].parentId = roundsData[1][4].id; // 1라운드 4경기 → 2라운드 5경기
                    roundsData[0][4].parentId = roundsData[1][6].id; // 1라운드 5경기 → 2라운드 7경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else if (numTeams === 22) {
                    // 22팀: 10팀 부전승, 12팀 6경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]), // 16반 vs 17반
                        makeMatch(0, 1, seededTeams[12], seededTeams[19]), // 13반 vs 20반
                        makeMatch(0, 2, seededTeams[11], seededTeams[20]), // 12반 vs 21반
                        makeMatch(0, 3, seededTeams[13], seededTeams[18]), // 14반 vs 19반
                        makeMatch(0, 4, seededTeams[10], seededTeams[21]), // 11반 vs 22반
                        makeMatch(0, 5, seededTeams[14], seededTeams[17]) // 15반 vs 18반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData[0][5].matchNumber = 6;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(1, 2, seededTeams[3], null), // 4반 vs ROUND1-2 승자
                        makeMatch(1, 3, seededTeams[4], null), // 5반 vs ROUND1-3 승자
                        makeMatch(1, 4, seededTeams[1], null), // 2반 vs ROUND1-4 승자
                        makeMatch(1, 5, seededTeams[6], seededTeams[9]), // 7반 vs 10반
                        makeMatch(1, 6, seededTeams[2], null), // 3반 vs ROUND1-5 승자
                        makeMatch(1, 7, seededTeams[5], null) // 6반 vs ROUND1-6 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][2].id; // 1라운드 2경기 → 2라운드 3경기
                    roundsData[0][2].parentId = roundsData[1][3].id; // 1라운드 3경기 → 2라운드 4경기
                    roundsData[0][3].parentId = roundsData[1][4].id; // 1라운드 4경기 → 2라운드 5경기
                    roundsData[0][4].parentId = roundsData[1][6].id; // 1라운드 5경기 → 2라운드 7경기
                    roundsData[0][5].parentId = roundsData[1][7].id; // 1라운드 6경기 → 2라운드 8경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else if (numTeams === 23) {
                    // 23팀: 9팀 부전승, 14팀 7경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]), // 16반 vs 17반
                        makeMatch(0, 1, seededTeams[12], seededTeams[19]), // 13반 vs 20반
                        makeMatch(0, 2, seededTeams[11], seededTeams[20]), // 12반 vs 21반
                        makeMatch(0, 3, seededTeams[13], seededTeams[18]), // 14반 vs 19반
                        makeMatch(0, 4, seededTeams[10], seededTeams[21]), // 11반 vs 22반
                        makeMatch(0, 5, seededTeams[9], seededTeams[22]), // 10반 vs 23반
                        makeMatch(0, 6, seededTeams[14], seededTeams[17]) // 15반 vs 18반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData[0][5].matchNumber = 6;
                    roundsData[0][6].matchNumber = 7;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], seededTeams[8]), // 8반 vs 9반
                        makeMatch(1, 2, seededTeams[3], null), // 4반 vs ROUND1-2 승자
                        makeMatch(1, 3, seededTeams[4], null), // 5반 vs ROUND1-3 승자
                        makeMatch(1, 4, seededTeams[1], null), // 2반 vs ROUND1-4 승자
                        makeMatch(1, 5, seededTeams[6], null), // 7반 vs ROUND1-5 승자
                        makeMatch(1, 6, seededTeams[2], null), // 3반 vs ROUND1-6 승자
                        makeMatch(1, 7, seededTeams[5], null) // 6반 vs ROUND1-7 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][2].id; // 1라운드 2경기 → 2라운드 3경기
                    roundsData[0][2].parentId = roundsData[1][3].id; // 1라운드 3경기 → 2라운드 4경기
                    roundsData[0][3].parentId = roundsData[1][4].id; // 1라운드 4경기 → 2라운드 5경기
                    roundsData[0][4].parentId = roundsData[1][5].id; // 1라운드 5경기 → 2라운드 6경기
                    roundsData[0][5].parentId = roundsData[1][6].id; // 1라운드 6경기 → 2라운드 7경기
                    roundsData[0][6].parentId = roundsData[1][7].id; // 1라운드 7경기 → 2라운드 8경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else if (numTeams === 24) {
                    // 24팀: 8팀 부전승, 16팀 8경기 → 2라운드 8경기 → 3라운드 4경기 → 4라운드 2경기 → 결승
                    roundsData.push([
                        makeMatch(0, 0, seededTeams[15], seededTeams[16]), // 16반 vs 17반
                        makeMatch(0, 1, seededTeams[8], seededTeams[23]), // 9반 vs 24반
                        makeMatch(0, 2, seededTeams[12], seededTeams[19]), // 13반 vs 20반
                        makeMatch(0, 3, seededTeams[11], seededTeams[20]), // 12반 vs 21반
                        makeMatch(0, 4, seededTeams[13], seededTeams[18]), // 14반 vs 19반
                        makeMatch(0, 5, seededTeams[9], seededTeams[22]), // 10반 vs 23반
                        makeMatch(0, 6, seededTeams[14], seededTeams[17]), // 15반 vs 18반
                        makeMatch(0, 7, seededTeams[10], seededTeams[21]) // 11반 vs 22반
                    ]);
                    roundsData[0][0].matchNumber = 1;
                    roundsData[0][1].matchNumber = 2;
                    roundsData[0][2].matchNumber = 3;
                    roundsData[0][3].matchNumber = 4;
                    roundsData[0][4].matchNumber = 5;
                    roundsData[0][5].matchNumber = 6;
                    roundsData[0][6].matchNumber = 7;
                    roundsData[0][7].matchNumber = 8;
                    roundsData.push([
                        makeMatch(1, 0, seededTeams[0], null), // 1반 vs ROUND1-1 승자
                        makeMatch(1, 1, seededTeams[7], null), // 8반 vs ROUND1-2 승자
                        makeMatch(1, 2, seededTeams[3], null), // 4반 vs ROUND1-3 승자
                        makeMatch(1, 3, seededTeams[4], null), // 5반 vs ROUND1-4 승자
                        makeMatch(1, 4, seededTeams[1], null), // 2반 vs ROUND1-5 승자
                        makeMatch(1, 5, seededTeams[6], null), // 7반 vs ROUND1-6 승자
                        makeMatch(1, 6, seededTeams[2], null), // 3반 vs ROUND1-7 승자
                        makeMatch(1, 7, seededTeams[5], null) // 6반 vs ROUND1-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(2, 0, null, null), // ROUND2-1 승자 vs ROUND2-2 승자
                        makeMatch(2, 1, null, null), // ROUND2-3 승자 vs ROUND2-4 승자
                        makeMatch(2, 2, null, null), // ROUND2-5 승자 vs ROUND2-6 승자
                        makeMatch(2, 3, null, null) // ROUND2-7 승자 vs ROUND2-8 승자
                    ]);
                    roundsData.push([
                        makeMatch(3, 0, null, null), // ROUND3-1 승자 vs ROUND3-2 승자
                        makeMatch(3, 1, null, null) // ROUND3-3 승자 vs ROUND3-4 승자
                    ]);
                    roundsData.push([
                        makeMatch(4, 0, null, null) // 결승
                    ]);
                    // 연결선 설정
                    roundsData[0][0].parentId = roundsData[1][0].id; // 1라운드 1경기 → 2라운드 1경기
                    roundsData[0][1].parentId = roundsData[1][1].id; // 1라운드 2경기 → 2라운드 2경기
                    roundsData[0][2].parentId = roundsData[1][2].id; // 1라운드 3경기 → 2라운드 3경기
                    roundsData[0][3].parentId = roundsData[1][3].id; // 1라운드 4경기 → 2라운드 4경기
                    roundsData[0][4].parentId = roundsData[1][4].id; // 1라운드 5경기 → 2라운드 5경기
                    roundsData[0][5].parentId = roundsData[1][5].id; // 1라운드 6경기 → 2라운드 6경기
                    roundsData[0][6].parentId = roundsData[1][6].id; // 1라운드 7경기 → 2라운드 7경기
                    roundsData[0][7].parentId = roundsData[1][7].id; // 1라운드 8경기 → 2라운드 8경기
                    roundsData[1][0].parentId = roundsData[2][0].id; // 2라운드 1경기 → 3라운드 1경기
                    roundsData[1][1].parentId = roundsData[2][0].id; // 2라운드 2경기 → 3라운드 1경기
                    roundsData[1][2].parentId = roundsData[2][1].id; // 2라운드 3경기 → 3라운드 2경기
                    roundsData[1][3].parentId = roundsData[2][1].id; // 2라운드 4경기 → 3라운드 2경기
                    roundsData[1][4].parentId = roundsData[2][2].id; // 2라운드 5경기 → 3라운드 3경기
                    roundsData[1][5].parentId = roundsData[2][2].id; // 2라운드 6경기 → 3라운드 3경기
                    roundsData[1][6].parentId = roundsData[2][3].id; // 2라운드 7경기 → 3라운드 4경기
                    roundsData[1][7].parentId = roundsData[2][3].id; // 2라운드 8경기 → 3라운드 4경기
                    roundsData[2][0].parentId = roundsData[3][0].id; // 3라운드 1경기 → 4라운드 1경기
                    roundsData[2][1].parentId = roundsData[3][0].id; // 3라운드 2경기 → 4라운드 1경기
                    roundsData[2][2].parentId = roundsData[3][1].id; // 3라운드 3경기 → 4라운드 2경기
                    roundsData[2][3].parentId = roundsData[3][1].id; // 3라운드 4경기 → 4라운드 2경기
                    roundsData[3][0].parentId = roundsData[4][0].id; // 4라운드 1경기 → 결승
                    roundsData[3][1].parentId = roundsData[4][0].id; // 4라운드 2경기 → 결승
                }
                else {
                    // 25팀 이상: 현재 미지원 (일반적인 부전승 로직으로 대체)
                    logWarn(`25팀 이상의 토너먼트는 현재 미지원입니다. 24팀 이하로 설정해주세요. (현재: ${numTeams}팀)`);
                    const byeTeams = seededTeams.slice(0, byeCount);
                    const firstRoundTeams = seededTeams.slice(byeCount);
                    // 1라운드: 하위 시드 팀들끼리 경기
                    const firstRoundMatches = [];
                    for (let i = 0; i < firstRoundTeams.length; i += 2) {
                        const teamA = firstRoundTeams[i];
                        const teamB = firstRoundTeams[i + 1];
                        const match = makeMatch(0, Math.floor(i / 2), teamA, teamB);
                        match.matchNumber = Math.floor(i / 2) + 1;
                        firstRoundMatches.push(match);
                    }
                    roundsData.push(firstRoundMatches);
                    // 2라운드부터: 부전승 팀들과 1라운드 승자들
                    let currentRoundMatches = [...firstRoundMatches];
                    let roundIdx = 1;
                    while (currentRoundMatches.length > 1) {
                        const nextRoundMatches = [];
                        let matchIdx = 0;
                        // 부전승 팀들과 이전 라운드 승자들을 매칭
                        for (let i = 0; i < currentRoundMatches.length; i += 2) {
                            const teamA = i < byeTeams.length ? byeTeams[i] : null;
                            const teamB = i + 1 < byeTeams.length ? byeTeams[i + 1] : null;
                            const match = makeMatch(roundIdx, matchIdx, teamA, teamB);
                            nextRoundMatches.push(match);
                            // 연결선 설정 - 각 이전 경기가 다음 경기로 연결됨
                            if (i < currentRoundMatches.length) {
                                currentRoundMatches[i].parentId = match.id;
                                this.log(`경기 ${currentRoundMatches[i].id} -> ${match.id} 연결`);
                            }
                            if (i + 1 < currentRoundMatches.length) {
                                currentRoundMatches[i + 1].parentId = match.id;
                                this.log(`경기 ${currentRoundMatches[i + 1].id} -> ${match.id} 연결`);
                            }
                            matchIdx++;
                        }
                        roundsData.push(nextRoundMatches);
                        currentRoundMatches = nextRoundMatches;
                        roundIdx++;
                    }
                }
            }
            else {
                // 17팀 이상: 일반적인 부전승 로직
                const byeTeams = seededTeams.slice(0, byeCount);
                const firstRoundTeams = seededTeams.slice(byeCount);
                // 1라운드: 하위 시드 팀들끼리 경기
                const firstRoundMatches = [];
                for (let i = 0; i < firstRoundTeams.length; i += 2) {
                    const teamA = firstRoundTeams[i];
                    const teamB = firstRoundTeams[i + 1];
                    const match = makeMatch(0, Math.floor(i / 2), teamA, teamB);
                    match.matchNumber = Math.floor(i / 2) + 1;
                    firstRoundMatches.push(match);
                }
                roundsData.push(firstRoundMatches);
                // 2라운드부터: 부전승 팀들과 1라운드 승자들
                let currentRoundMatches = [...firstRoundMatches];
                let roundIdx = 1;
                while (currentRoundMatches.length > 1) {
                    const nextRoundMatches = [];
                    let matchIdx = 0;
                    // 부전승 팀들과 이전 라운드 승자들을 매칭
                    for (let i = 0; i < currentRoundMatches.length; i += 2) {
                        const teamA = i < byeTeams.length ? byeTeams[i] : null;
                        const teamB = i + 1 < byeTeams.length ? byeTeams[i + 1] : null;
                        const match = makeMatch(roundIdx, matchIdx, teamA, teamB);
                        nextRoundMatches.push(match);
                        // 연결선 설정 - 각 이전 경기가 다음 경기로 연결됨
                        if (i < currentRoundMatches.length) {
                            currentRoundMatches[i].parentId = match.id;
                            this.log(`경기 ${currentRoundMatches[i].id} -> ${match.id} 연결`);
                        }
                        if (i + 1 < currentRoundMatches.length) {
                            currentRoundMatches[i + 1].parentId = match.id;
                            this.log(`경기 ${currentRoundMatches[i + 1].id} -> ${match.id} 연결`);
                        }
                        matchIdx++;
                    }
                    roundsData.push(nextRoundMatches);
                    currentRoundMatches = nextRoundMatches;
                    roundIdx++;
                }
            }
        }
        currentTourney.rounds = roundsData;
        this.saveData();
        this.renderBracket(currentTourney);
    }
    /**
     * 토너먼트 점수를 입력합니다.
     * @param matchId 경기 ID
     * @param side 팀 (A 또는 B)
     * @param value 점수
     */
    onScoreInputTournament(matchId, side, value) {
        this.log('onScoreInputTournament 호출됨', { matchId, side, value });
        const tourney = this.tournamentData.tournaments.find(t => t.id === this.tournamentData.activeTournamentId);
        if (!tourney || !Array.isArray(tourney.rounds))
            return;
        const numValue = value === '' ? null : Number(value);
        if (value !== '' && (isNaN(numValue) || numValue < 0)) {
            alert('올바른 점수를 입력해주세요. (0 이상의 숫자)');
            return;
        }
        // 경기 찾기 및 점수 업데이트
        for (let round of tourney.rounds) {
            for (let match of round) {
                if (match.id === matchId) {
                    if (side === 'A') {
                        match.scoreA = numValue;
                    }
                    else {
                        match.scoreB = numValue;
                    }
                    break;
                }
            }
        }
        this.propagateWinners(tourney);
        this.saveData();
        this.renderBracket(tourney);
    }
    /**
     * 승자를 전파합니다.
     * @param tourney 토너먼트 객체
     */
    propagateWinners(tourney) {
        if (!tourney || !Array.isArray(tourney.rounds))
            return;
        const numTeams = tourney.teams.length;
        // 3팀, 4팀, 5팀, 6팀, 7팀, 8팀, 9팀 이상의 특별한 로직 처리
        if (numTeams === 3 || numTeams === 4 || numTeams === 5 || numTeams === 6 || numTeams === 7 || numTeams === 8 || numTeams === 16 || numTeams >= 9) {
            tourney.rounds.forEach((round, rIdx) => {
                round.forEach(match => {
                    if (rIdx === 0) {
                        // 첫 라운드는 이미 팀이 배정되어 있음
                        match.winner = null;
                        if (match.teamA && !match.teamB) {
                            match.winner = match.teamA;
                        }
                        else if (!match.teamA && match.teamB) {
                            match.winner = match.teamB;
                        }
                        else if (match.scoreA !== null && match.scoreB !== null && match.teamA && match.teamB) {
                            if (Number(match.scoreA) > Number(match.scoreB))
                                match.winner = match.teamA;
                            else if (Number(match.scoreB) > Number(match.scoreA))
                                match.winner = match.teamB;
                        }
                    }
                    else if (rIdx === 1) {
                        // 두 번째 라운드: 부전승 팀과 이전 라운드 승자들 매칭
                        if (numTeams === 3) {
                            // 3팀: #1 vs ROUND1 승자
                            match.teamA = tourney.teams[0]; // #1
                            if (tourney.rounds[0][0].winner) {
                                match.teamB = tourney.rounds[0][0].winner; // ROUND1 승자
                            }
                        }
                        else if (numTeams === 4) {
                            // 4팀: ROUND1 승자들끼리
                            if (tourney.rounds[0][0].winner) {
                                match.teamA = tourney.rounds[0][0].winner; // ROUND1-1승자
                            }
                            if (tourney.rounds[0][1].winner) {
                                match.teamB = tourney.rounds[0][1].winner; // ROUND1-2승자
                            }
                        }
                        else if (numTeams === 5) {
                            if (match.slotIdx === 0) {
                                // #1 vs ROUND1 승자
                                match.teamA = tourney.teams[0]; // #1
                                // 1라운드 경기가 완료되었을 때만 승자를 배정
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // ROUND1 승자
                                }
                                this.log(`5팀 2라운드 1경기: teamA=${match.teamA}, teamB=${match.teamB}`);
                            }
                            else {
                                // #2 vs #3 (부전승 팀들은 항상 배정)
                                match.teamA = tourney.teams[1]; // #2
                                match.teamB = tourney.teams[2]; // #3
                                this.log(`5팀 2라운드 2경기: teamA=${match.teamA}, teamB=${match.teamB}`);
                            }
                        }
                        else if (numTeams === 6) {
                            if (match.slotIdx === 0) {
                                // #1 vs ROUND1-1승자
                                match.teamA = tourney.teams[0]; // #1
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // ROUND1-1승자
                                }
                            }
                            else {
                                // #2 vs ROUND1-2승자
                                match.teamA = tourney.teams[1]; // #2
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // ROUND1-2승자
                                }
                            }
                        }
                        else if (numTeams === 7) {
                            if (match.slotIdx === 0) {
                                // #1 vs ROUND1-1승자
                                match.teamA = tourney.teams[0]; // #1
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // ROUND1-1승자
                                }
                            }
                            else {
                                // ROUND1-2승자 vs ROUND1-3승자
                                if (tourney.rounds[0][1].winner) {
                                    match.teamA = tourney.rounds[0][1].winner; // ROUND1-2승자
                                }
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // ROUND1-3승자
                                }
                            }
                        }
                        else if (numTeams === 8) {
                            if (match.slotIdx === 0) {
                                // ROUND1-1승자 vs ROUND1-2승자
                                if (tourney.rounds[0][0].winner) {
                                    match.teamA = tourney.rounds[0][0].winner; // ROUND1-1승자
                                }
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // ROUND1-2승자
                                }
                            }
                            else {
                                // ROUND1-3승자 vs ROUND1-4승자
                                if (tourney.rounds[0][2].winner) {
                                    match.teamA = tourney.rounds[0][2].winner; // ROUND1-3승자
                                }
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // ROUND1-4승자
                                }
                            }
                        }
                        else if (numTeams === 9) {
                            // 9팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                            }
                            // 나머지 매치들(2반vs3반, 4반vs5반, 6반vs7반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 10) {
                            // 10팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 7반vs10반 승자
                                }
                            }
                            // 나머지 매치들(4반vs5반, 3반vs6반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 11) {
                            // 11팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 7반vs10반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // 3반 vs (6반vs11반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 6반vs11반 승자
                                }
                            }
                            // 나머지 매치들(4반vs5반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 12) {
                            // 12팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                                }
                            }
                            else if (match.slotIdx === 1) {
                                // 4반 vs (5반vs12반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 5반vs12반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 7반vs10반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // 3반 vs (6반vs11반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // 6반vs11반 승자
                                }
                            }
                        }
                        else if (numTeams === 13) {
                            // 13팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                                }
                            }
                            else if (match.slotIdx === 1) {
                                // 2반 vs (4반vs13반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 4반vs13반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 3반 vs (5반vs12반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 5반vs12반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // (7반vs10반 승자) vs (6반vs11반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamA = tourney.rounds[0][3].winner; // 7반vs10반 승자
                                }
                                if (tourney.rounds[0][4].winner) {
                                    match.teamB = tourney.rounds[0][4].winner; // 6반vs11반 승자
                                }
                            }
                        }
                        else if (numTeams === 14) {
                            // 14팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                                }
                            }
                            else if (match.slotIdx === 1) {
                                // (4반vs13반 승자) vs (5반vs12반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamA = tourney.rounds[0][1].winner; // 4반vs13반 승자
                                }
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 5반vs12반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 2반 vs (7반vs10반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // 7반vs10반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // (3반vs14반 승자) vs (6반vs11반 승자)
                                if (tourney.rounds[0][4].winner) {
                                    match.teamA = tourney.rounds[0][4].winner; // 3반vs14반 승자
                                }
                                if (tourney.rounds[0][5].winner) {
                                    match.teamB = tourney.rounds[0][5].winner; // 6반vs11반 승자
                                }
                            }
                        }
                        else if (numTeams === 15) {
                            // 15팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (8반vs9반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 8반vs9반 승자
                                }
                            }
                            else if (match.slotIdx === 1) {
                                // (4반vs13반 승자) vs (5반vs12반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamA = tourney.rounds[0][1].winner; // 4반vs13반 승자
                                }
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 5반vs12반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // (2반vs15반 승자) vs (7반vs10반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamA = tourney.rounds[0][3].winner; // 2반vs15반 승자
                                }
                                if (tourney.rounds[0][4].winner) {
                                    match.teamB = tourney.rounds[0][4].winner; // 7반vs10반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // (3반vs14반 승자) vs (6반vs11반 승자)
                                if (tourney.rounds[0][5].winner) {
                                    match.teamA = tourney.rounds[0][5].winner; // 3반vs14반 승자
                                }
                                if (tourney.rounds[0][6].winner) {
                                    match.teamB = tourney.rounds[0][6].winner; // 6반vs11반 승자
                                }
                            }
                        }
                        else if (numTeams === 16) {
                            // 16팀: 표준 토너먼트
                            if (match.slotIdx === 0) {
                                // ROUND1-1승자 vs ROUND1-2승자
                                match.teamA = tourney.rounds[0][0].winner; // ROUND1-1승자
                                match.teamB = tourney.rounds[0][1].winner; // ROUND1-2승자
                            }
                            else if (match.slotIdx === 1) {
                                // ROUND1-3승자 vs ROUND1-4승자
                                match.teamA = tourney.rounds[0][2].winner; // ROUND1-3승자
                                match.teamB = tourney.rounds[0][3].winner; // ROUND1-4승자
                            }
                            else if (match.slotIdx === 2) {
                                // ROUND1-5승자 vs ROUND1-6승자
                                match.teamA = tourney.rounds[0][4].winner; // ROUND1-5승자
                                match.teamB = tourney.rounds[0][5].winner; // ROUND1-6승자
                            }
                            else if (match.slotIdx === 3) {
                                // ROUND1-7승자 vs ROUND1-8승자
                                match.teamA = tourney.rounds[0][6].winner; // ROUND1-7승자
                                match.teamB = tourney.rounds[0][7].winner; // ROUND1-8승자
                            }
                        }
                        else if (numTeams === 17) {
                            // 17팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            // 나머지 매치들(8반vs9반, 4반vs13반, 5반vs12반, 2반vs15반, 7반vs10반, 3반vs14반, 6반vs11반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 18) {
                            // 18팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            else if (match.slotIdx === 4) {
                                // 2반 vs (14반vs18반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 14반vs18반 승자
                                }
                            }
                            // 나머지 매치들(8반vs9반, 4반vs13반, 5반vs12반, 7반vs10반, 3반vs15반, 6반vs11반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 19) {
                            // 19팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // (15반vs18반 승자) vs 2반
                                if (tourney.rounds[0][1].winner) {
                                    match.teamA = tourney.rounds[0][1].winner; // 15반vs18반 승자
                                }
                            }
                            else if (match.slotIdx === 5) {
                                // (14반vs19반 승자) vs 3반
                                if (tourney.rounds[0][2].winner) {
                                    match.teamA = tourney.rounds[0][2].winner; // 14반vs19반 승자
                                }
                            }
                            // 나머지 매치들(8반vs9반, 4반vs13반, 5반vs12반, 7반vs10반, 6반vs11반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 20) {
                            // 20팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 4반 vs (13반vs20반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 13반vs20반 승자
                                }
                            }
                            else if (match.slotIdx === 4) {
                                // 2반 vs (14반vs19반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 14반vs19반 승자
                                }
                            }
                            else if (match.slotIdx === 6) {
                                // 3반 vs (15반vs18반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // 15반vs18반 승자
                                }
                            }
                            // 나머지 매치들(8반vs9반, 5반vs12반, 7반vs10반, 6반vs11반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 21) {
                            // 21팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 4반 vs (13반vs20반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 13반vs20반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // 5반 vs (12반vs21반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 12반vs21반 승자
                                }
                            }
                            else if (match.slotIdx === 4) {
                                // 2반 vs (14반vs19반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // 14반vs19반 승자
                                }
                            }
                            else if (match.slotIdx === 6) {
                                // 3반 vs (15반vs18반 승자)
                                if (tourney.rounds[0][4].winner) {
                                    match.teamB = tourney.rounds[0][4].winner; // 15반vs18반 승자
                                }
                            }
                            // 나머지 매치들(8반vs9반, 7반vs10반, 6반vs11반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 22) {
                            // 22팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 4반 vs (13반vs20반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 13반vs20반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // 5반 vs (12반vs21반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 12반vs21반 승자
                                }
                            }
                            else if (match.slotIdx === 4) {
                                // 2반 vs (14반vs19반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // 14반vs19반 승자
                                }
                            }
                            else if (match.slotIdx === 6) {
                                // 3반 vs (11반vs22반 승자)
                                if (tourney.rounds[0][4].winner) {
                                    match.teamB = tourney.rounds[0][4].winner; // 11반vs22반 승자
                                }
                            }
                            else if (match.slotIdx === 7) {
                                // 6반 vs (15반vs18반 승자)
                                if (tourney.rounds[0][5].winner) {
                                    match.teamB = tourney.rounds[0][5].winner; // 15반vs18반 승자
                                }
                            }
                            // 나머지 매치들(8반vs9반, 7반vs10반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 23) {
                            // 23팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 4반 vs (13반vs20반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 13반vs20반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // 5반 vs (12반vs21반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 12반vs21반 승자
                                }
                            }
                            else if (match.slotIdx === 4) {
                                // 2반 vs (14반vs19반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // 14반vs19반 승자
                                }
                            }
                            else if (match.slotIdx === 5) {
                                // 7반 vs (11반vs22반 승자)
                                if (tourney.rounds[0][4].winner) {
                                    match.teamB = tourney.rounds[0][4].winner; // 11반vs22반 승자
                                }
                            }
                            else if (match.slotIdx === 6) {
                                // 3반 vs (10반vs23반 승자)
                                if (tourney.rounds[0][5].winner) {
                                    match.teamB = tourney.rounds[0][5].winner; // 10반vs23반 승자
                                }
                            }
                            else if (match.slotIdx === 7) {
                                // 6반 vs (15반vs18반 승자)
                                if (tourney.rounds[0][6].winner) {
                                    match.teamB = tourney.rounds[0][6].winner; // 15반vs18반 승자
                                }
                            }
                            // 나머지 매치들(8반vs9반)은 부전승 팀들이 이미 배정되어 있음
                        }
                        else if (numTeams === 24) {
                            // 24팀: 2라운드에서 1라운드 승자들을 배정
                            if (match.slotIdx === 0) {
                                // 1반 vs (16반vs17반 승자)
                                if (tourney.rounds[0][0].winner) {
                                    match.teamB = tourney.rounds[0][0].winner; // 16반vs17반 승자
                                }
                            }
                            else if (match.slotIdx === 1) {
                                // 8반 vs (9반vs24반 승자)
                                if (tourney.rounds[0][1].winner) {
                                    match.teamB = tourney.rounds[0][1].winner; // 9반vs24반 승자
                                }
                            }
                            else if (match.slotIdx === 2) {
                                // 4반 vs (13반vs20반 승자)
                                if (tourney.rounds[0][2].winner) {
                                    match.teamB = tourney.rounds[0][2].winner; // 13반vs20반 승자
                                }
                            }
                            else if (match.slotIdx === 3) {
                                // 5반 vs (12반vs21반 승자)
                                if (tourney.rounds[0][3].winner) {
                                    match.teamB = tourney.rounds[0][3].winner; // 12반vs21반 승자
                                }
                            }
                            else if (match.slotIdx === 4) {
                                // 2반 vs (14반vs19반 승자)
                                if (tourney.rounds[0][4].winner) {
                                    match.teamB = tourney.rounds[0][4].winner; // 14반vs19반 승자
                                }
                            }
                            else if (match.slotIdx === 5) {
                                // 7반 vs (10반vs23반 승자)
                                if (tourney.rounds[0][5].winner) {
                                    match.teamB = tourney.rounds[0][5].winner; // 10반vs23반 승자
                                }
                            }
                            else if (match.slotIdx === 6) {
                                // 3반 vs (15반vs18반 승자)
                                if (tourney.rounds[0][6].winner) {
                                    match.teamB = tourney.rounds[0][6].winner; // 15반vs18반 승자
                                }
                            }
                            else if (match.slotIdx === 7) {
                                // 6반 vs (11반vs22반 승자)
                                if (tourney.rounds[0][7].winner) {
                                    match.teamB = tourney.rounds[0][7].winner; // 11반vs22반 승자
                                }
                            }
                        }
                        else if (numTeams >= 17) {
                            // 17팀 이상: 일반적인 부전승 로직
                            const totalSlots = 1 << (Math.ceil(Math.log2(numTeams)));
                            const byeCount = totalSlots - numTeams;
                            const byeTeams = tourney.teams.slice(0, byeCount);
                            const firstRoundTeams = tourney.teams.slice(byeCount);
                            if (match.slotIdx < byeCount) {
                                // 부전승 팀 vs 1라운드 승자
                                match.teamA = byeTeams[match.slotIdx];
                                match.teamB = tourney.rounds[0][match.slotIdx].winner;
                            }
                            else {
                                // 부전승 팀 vs 부전승 팀
                                const byeIndex = match.slotIdx - byeCount;
                                match.teamA = byeTeams[byeIndex * 2];
                                match.teamB = byeTeams[byeIndex * 2 + 1];
                            }
                        }
                        // 승자 결정
                        if (match.teamA && !match.teamB) {
                            match.winner = match.teamA;
                        }
                        else if (!match.teamA && match.teamB) {
                            match.winner = match.teamB;
                        }
                        else if (match.scoreA !== null && match.scoreB !== null && match.teamA && match.teamB) {
                            if (Number(match.scoreA) > Number(match.scoreB))
                                match.winner = match.teamA;
                            else if (Number(match.scoreB) > Number(match.scoreA))
                                match.winner = match.teamB;
                        }
                    }
                    else {
                        // 3라운드 이상: 이전 라운드 승자들끼리
                        const prevRound = tourney.rounds[rIdx - 1];
                        const prevMatches = prevRound.filter(m => m.parentId === match.id);
                        if (prevMatches.length > 0) {
                            // 이전 경기가 완료되었을 때만 승자를 배정
                            // 경기가 완료되려면 양쪽 팀이 모두 있고 점수가 입력되어야 함
                            if (prevMatches[0] && prevMatches[0].teamA && prevMatches[0].teamB &&
                                prevMatches[0].scoreA !== null && prevMatches[0].scoreB !== null &&
                                prevMatches[0].winner) {
                                match.teamA = prevMatches[0].winner;
                            }
                            if (prevMatches[1] && prevMatches[1].teamA && prevMatches[1].teamB &&
                                prevMatches[1].scoreA !== null && prevMatches[1].scoreB !== null &&
                                prevMatches[1].winner) {
                                match.teamB = prevMatches[1].winner;
                            }
                        }
                        // 승자 결정
                        if (match.teamA && match.teamB) {
                            // 양쪽 팀이 모두 배정된 경우
                            if (match.scoreA !== null && match.scoreB !== null) {
                                // 점수가 입력된 경우에만 승자 결정
                                if (Number(match.scoreA) > Number(match.scoreB))
                                    match.winner = match.teamA;
                                else if (Number(match.scoreB) > Number(match.scoreA))
                                    match.winner = match.teamB;
                            }
                            else {
                                // 점수가 입력되지 않았으면 아직 경기 미완료
                                match.winner = null;
                            }
                        }
                        else {
                            // 한쪽 팀이 없으면 아직 경기 미완료
                            match.winner = null;
                        }
                    }
                });
            });
        }
    }
    /**
     * 대진표를 렌더링합니다.
     * @param tourney 토너먼트 객체
     * @param isReadOnly 읽기 전용 여부
     */
    renderBracket(tourney, isReadOnly = false) {
        this.log('renderBracket 호출됨', isReadOnly);
        // 승자 전파 먼저 실행
        this.propagateWinners(tourney);
        const roundsEl = this.$('#rounds');
        const svgEl = this.$('#svgLayer');
        const roundsData = tourney.rounds;
        if (!roundsEl || !svgEl || !Array.isArray(roundsData) || roundsData.length === 0) {
            if (roundsEl)
                roundsEl.html('<div style="text-align:center; padding: 2rem; color: var(--ink-muted);">팀을 추가하여 대진표 생성을 시작하세요.</div>');
            if (svgEl)
                svgEl.html('');
            return;
        }
        const roundLabels = this.makeRoundLabels(roundsData.length);
        roundsEl.html(roundsData.map((round, rIdx) => `
            <div class="round">
                <div class="round-title">${roundLabels[rIdx]}</div>
                <div class="match-group">
                    ${round.map(m => this.renderMatchCard(m, rIdx, tourney, isReadOnly)).join('')}
                </div>
            </div>
        `).join(''));
        requestAnimationFrame(() => this.drawSvgLines(tourney));
    }
    /**
     * 경기 카드를 렌더링합니다.
     * @param match 경기 객체
     * @param rIdx 라운드 인덱스
     * @param tourney 토너먼트 객체
     * @param isReadOnly 읽기 전용 여부
     * @returns HTML 문자열
     */
    renderMatchCard(match, rIdx, tourney, isReadOnly = false) {
        // 팀 표시 로직 개선
        const isFirstRound = rIdx === 0;
        const isSecondRound = rIdx === 1;
        const isLaterRound = rIdx >= 2;
        // 1라운드: null이면 (미정), 2라운드: 부전승 팀이면 부전승, 나머지는 (미정)
        const teamA = match.teamA || (isFirstRound ? '(미정)' : (match.isBye ? '부전승' : '(미정)'));
        const teamB = match.teamB || (isFirstRound ? '(미정)' : (match.isBye ? '부전승' : '(미정)'));
        const isNext = match.teamA && match.teamB && !match.winner;
        let rankBadgeA = '', rankBadgeB = '';
        const winBadge = '<span style="color: var(--win); font-weight: bold; font-size: 12px; margin-left: auto;">승</span>';
        const byeBadge = '<span style="color: var(--ink-muted); font-style: italic; font-size: 11px;">부전승</span>';
        const isScoredMatch = match.scoreA !== null && match.scoreB !== null;
        const roundsData = tourney.rounds;
        const finalRoundIdx = roundsData.length - 1;
        if (finalRoundIdx >= 0 && roundsData[finalRoundIdx][0].winner) {
            const winner = roundsData[finalRoundIdx][0].winner;
            const runnerUp = winner === roundsData[finalRoundIdx][0].teamA ? roundsData[finalRoundIdx][0].teamB : roundsData[finalRoundIdx][0].teamA;
            if (rIdx === finalRoundIdx) {
                if (match.teamA === winner)
                    rankBadgeA = this.getMedal('gold');
                if (match.teamB === winner)
                    rankBadgeB = this.getMedal('gold');
                if (match.teamA === runnerUp)
                    rankBadgeA = this.getMedal('silver');
                if (match.teamB === runnerUp)
                    rankBadgeB = this.getMedal('silver');
            }
            if (roundsData.length > 1 && rIdx === finalRoundIdx - 1) {
                const semiFinalLosers = [roundsData[rIdx][0].teamA, roundsData[rIdx][0].teamB, roundsData[rIdx][1]?.teamA, roundsData[rIdx][1]?.teamB].filter(t => t && t !== winner && t !== runnerUp);
                if (semiFinalLosers.includes(match.teamA))
                    rankBadgeA = this.getMedal('bronze');
                if (semiFinalLosers.includes(match.teamB))
                    rankBadgeB = this.getMedal('bronze');
            }
        }
        // 부전승 매치인 경우 스타일링
        const isByeMatch = match.isBye;
        const byeMatchClass = isByeMatch ? 'bye-match' : '';
        // 원래 팀 렌더링 함수
        const renderTeam = (team, teamType, rankBadge, isWinner, isLoser, isBye) => {
            const isEmpty = !team || team === '(미정)';
            const isByeTeam = isBye && isEmpty;
            return `
                <div class="team ${match.winner === team ? 'win' : ''} ${match.winner && match.winner !== team ? 'lose' : ''} ${!team && match.isBye ? 'bye-team' : ''}"
                     data-match-id="${match.id}" 
                     data-team-type="${teamType}"
                     data-team-name="${team || ''}"
                     draggable="${isReadOnly || isByeMatch ? 'false' : 'true'}"
                     ondragstart="handleDragStart(event)"
                     ondragover="handleDragOver(event)"
                     ondrop="handleDrop(event)"
                     ondragleave="handleDragLeave(event)">
                    <span class="team-name">
                        ${rankBadge}${team || (isByeTeam ? '부전승' : '(미정)')}
                    </span>
                    <input type="number" class="team-score" value="${teamType === 'A' ? (match.scoreA ?? '') : (match.scoreB ?? '')}" 
                           onchange="onScoreInputTournament('${match.id}', '${teamType}', this.value)" 
                           ${(!team || !match.teamA || !match.teamB || isReadOnly || isByeMatch) ? 'disabled' : ''} 
                           placeholder="점수" min="0"
                           title="${(!team || !match.teamA || !match.teamB || isReadOnly || isByeMatch) ? '점수를 입력할 수 없습니다' : '점수를 입력하세요. 승자는 자동으로 결정됩니다.'}">
                    <div class="team-actions">
                        ${isWinner && isScoredMatch ? winBadge : ''}
                        ${isByeTeam ? byeBadge : ''}
                    </div>
                </div>
            `;
        };
        return `
            <div class="match">
                ${renderTeam(teamA, 'A', rankBadgeA, match.winner === match.teamA, !!(match.winner && match.winner !== match.teamA), !!(match.teamA && match.isBye))}
                ${renderTeam(teamB, 'B', rankBadgeB, match.winner === match.teamB, !!(match.winner && match.winner !== match.teamB), !!(match.teamB && match.isBye))}
            </div>
        `;
    }
    /**
     * 라운드 라벨을 생성합니다.
     * @param count 라운드 수
     * @returns 라운드 라벨 배열
     */
    makeRoundLabels(count) {
        if (count <= 0)
            return [];
        if (count === 1)
            return ["Final"];
        if (count === 2)
            return ["Semi-Final", "Final"];
        if (count === 3)
            return ["8강", "Semi-Final", "Final"];
        if (count === 4)
            return ["16강", "8강", "Semi-Final", "Final"];
        if (count === 5)
            return ["32강", "16강", "8강", "Semi-Final", "Final"];
        if (count === 6)
            return ["64강", "32강", "16강", "8강", "Semi-Final", "Final"];
        return Array.from({ length: count }, (_, i) => {
            if (i === count - 1)
                return "Final";
            if (i === count - 2)
                return "Semi-Final";
            if (i === count - 3)
                return "8강";
            if (i === count - 4)
                return "16강";
            if (i === count - 5)
                return "32강";
            if (i === count - 6)
                return "64강";
            return `${Math.pow(2, count - 1 - i)}강`;
        });
    }
    /**
     * 메달 아이콘을 생성합니다.
     * @param type 메달 타입
     * @returns 메달 HTML
     */
    getMedal(type) {
        const colors = { gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' };
        const rank = { gold: '1위', silver: '2위', bronze: '공동 3위' };
        return `<span class="rank-badge" data-tooltip="${rank[type]}"><svg viewBox="0 0 24 24" fill="${colors[type]}"><path d="M12 2L9.5 7.5 4 8l4.5 4L7 18l5-3 5 3-1.5-6 4.5-4-5.5-.5z"/></svg></span>`;
    }
    /**
     * SVG 연결선을 그립니다.
     * @param tourney 토너먼트 객체
     */
    drawSvgLines(tourney) {
        const svg = this.getElement('#svgLayer');
        const roundsEl = this.getElement('#rounds');
        if (!svg || !roundsEl)
            return;
        svg.innerHTML = "";
        const scrollW = roundsEl.scrollWidth;
        const scrollH = roundsEl.scrollHeight;
        svg.setAttribute("viewBox", `0 0 ${scrollW} ${scrollH}`);
        svg.setAttribute("width", scrollW.toString());
        svg.setAttribute("height", scrollH.toString());
        if (!tourney || !Array.isArray(tourney.rounds))
            return;
        for (let r = 0; r < tourney.rounds.length - 1; r++) {
            const currentRound = tourney.rounds[r];
            currentRound.forEach(match => {
                if (!match || !match.parentId)
                    return;
                const childCard = roundsEl.querySelector(`[data-match-id="${match.id}"]`);
                const parentCard = roundsEl.querySelector(`[data-match-id="${match.parentId}"]`);
                if (!childCard || !parentCard)
                    return;
                const start = this.getBottomRight(childCard, roundsEl);
                const end = this.getBottomLeft(parentCard, roundsEl);
                // 곡선 연결선
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const gap = 40;
                const midX = start.x + gap;
                const d = `M ${start.x} ${start.y} 
                          C ${midX} ${start.y} ${midX} ${end.y} ${end.x} ${end.y}`;
                path.setAttribute("d", d);
                path.setAttribute("fill", "none");
                path.setAttribute("stroke", match.winner ? "var(--accent)" : "var(--line)");
                path.setAttribute("stroke-width", match.winner ? "2.5" : "1.5");
                path.setAttribute("stroke-linecap", "round");
                path.setAttribute("stroke-linejoin", "round");
                svg.appendChild(path);
            });
        }
    }
    /**
     * 요소의 오른쪽 하단 좌표를 가져옵니다.
     * @param el 요소
     * @param container 컨테이너
     * @returns 좌표 객체
     */
    getBottomRight(el, container) {
        const r1 = el.getBoundingClientRect();
        const rC = container.getBoundingClientRect();
        return { x: (r1.right - rC.left) + 15 + container.scrollLeft, y: (r1.bottom - rC.top) + 18 + container.scrollTop };
    }
    /**
     * 요소의 왼쪽 하단 좌표를 가져옵니다.
     * @param el 요소
     * @param container 컨테이너
     * @returns 좌표 객체
     */
    getBottomLeft(el, container) {
        const r1 = el.getBoundingClientRect();
        const rC = container.getBoundingClientRect();
        return { x: (r1.left - rC.left) + 15 + container.scrollLeft, y: (r1.bottom - rC.top) + 18 + container.scrollTop };
    }
}
/**
 * 토너먼트 관리자를 초기화합니다.
 * @param tournamentData 토너먼트 데이터
 * @param saveCallback 저장 콜백
 * @returns TournamentManager 인스턴스
 */
export function initializeTournamentManager(tournamentData, saveCallback) {
    return new TournamentManager(tournamentData, saveCallback);
}
//# sourceMappingURL=tournamentManager.js.map