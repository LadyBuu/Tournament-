// ============================================================
// app.js - Tournament Manager Main Application
// ============================================================

// ---- Database Configuration ----
var DB_NAME = 'TournamentManagerDB';
var DB_VERSION = 3;
var STORE_NAME = 'tournamentData';

// ---- Data Store ----
var data = {
    characters: [],
    teams: [],
    tournaments: [],
    activities: [],
    currentYear: new Date().getFullYear(),
    currentWeek: 1
};

var db = null;
var currentCalendarWeek = 1;

// ---- Utility Functions ----
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function getWeekBlock(weekNum) {
    var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
    var blockEnd = blockStart + 1;
    return { start: blockStart, end: blockEnd, label: blockStart + '-' + blockEnd };
}

function getRankingBlock(period) {
    var weekNum = parseInt(period);
    if (isNaN(weekNum)) return null;
    var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
    var blockEnd = blockStart + 1;
    return { start: blockStart, end: blockEnd, label: blockStart + '-' + blockEnd };
}

function calculateAge(char) {
    if (!char.birthYear) return null;
    var birthYear = parseInt(char.birthYear);
    if (isNaN(birthYear)) return null;
    if (char.deceased && char.deathAge) return parseInt(char.deathAge);
    if (char.deceased && char.deathYear) {
        var deathYear = parseInt(char.deathYear);
        if (!isNaN(deathYear)) return deathYear - birthYear;
        return null;
    }
    var currentYear = data.currentYear || new Date().getFullYear();
    return currentYear - birthYear;
}

function getCharacterAge(char) {
    var age = calculateAge(char);
    return age !== null ? age : '-';
}

function getCurrentStatus(char) {
    if (!char.careerStatus || char.careerStatus.length === 0) return 'Civilian';
    var currentYear = data.currentYear || new Date().getFullYear();
    var currentStatus = 'Civilian';
    char.careerStatus.forEach(function(status) {
        var start = parseInt(status.startYear);
        var end = status.endYear ? parseInt(status.endYear) : null;
        if (!isNaN(start) && start <= currentYear && (end === null || currentYear <= end)) {
            currentStatus = status.status.charAt(0).toUpperCase() + status.status.slice(1);
        }
    });
    return currentStatus;
}

function getCharacterTeamCount(charId) {
    var count = 0;
    data.teams.forEach(function(team) {
        if (team.members && team.members.some(function(m) { return m.characterId === charId; })) {
            count++;
        }
    });
    return count || '-';
}

// ============================================================
// DATABASE FUNCTIONS
// ============================================================

function openDatabase() {
    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = function(event) { reject(event.target.error); };
        request.onsuccess = function(event) {
            db = event.target.result;
            resolve(db);
        };
        request.onupgradeneeded = function(event) {
            var database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                var store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        };
    });
}

function loadDataInternal() {
    return new Promise(function(resolve, reject) {
        try {
            var transaction = db.transaction([STORE_NAME], 'readonly');
            var store = transaction.objectStore(STORE_NAME);
            var request = store.get('mainData');
            request.onerror = function(event) { reject(event.target.error); };
            request.onsuccess = function(event) {
                var result = event.target.result;
                if (result && result.data) {
                    data = result.data;
                    if (!data.currentYear) data.currentYear = new Date().getFullYear();
                    if (!data.currentWeek) data.currentWeek = 1;
                    data.characters.forEach(function(char) {
                        if (char.deceased === undefined) char.deceased = false;
                        if (char.deathYear === undefined) char.deathYear = '';
                        if (char.deathCause === undefined) char.deathCause = '';
                        if (char.deathAge === undefined) char.deathAge = '';
                        if (char.careerStatus === undefined) char.careerStatus = [];
                        if (char.specialty === undefined) char.specialty = '';
                        if (char.eliminatedWeeks === undefined) char.eliminatedWeeks = [];
                    });
                    data.teams.forEach(function(team) {
                        if (team.nameHistory === undefined) team.nameHistory = [];
                        if (team.rankingHistory === undefined) team.rankingHistory = [];
                        if (team.members === undefined) team.members = [];
                        if (team.currentRank === undefined) team.currentRank = '';
                        if (team.startPeriod === undefined) team.startPeriod = '';
                        if (team.endPeriod === undefined) team.endPeriod = '';
                    });
                    data.tournaments.forEach(function(tourn) {
                        if (tourn.eliminations === undefined) tourn.eliminations = [];
                        if (tourn.eliminationsPerWeek === undefined) tourn.eliminationsPerWeek = 4;
                    });
                    resolve(data);
                } else {
                    data = { characters: [], teams: [], tournaments: [], activities: [], currentYear: new Date().getFullYear(), currentWeek: 1 };
                    resolve(data);
                }
            };
        } catch (e) { reject(e); }
    });
}

function loadData() {
    return new Promise(function(resolve, reject) {
        if (!db) {
            openDatabase().then(function() { loadDataInternal().then(resolve).catch(reject); }).catch(reject);
            return;
        }
        loadDataInternal().then(resolve).catch(reject);
    });
}

function saveDataInternal() {
    return new Promise(function(resolve, reject) {
        try {
            var transaction = db.transaction([STORE_NAME], 'readwrite');
            var store = transaction.objectStore(STORE_NAME);
            var record = { id: 'mainData', data: data, updatedAt: new Date().toISOString() };
            var request = store.put(record);
            request.onerror = function(event) { reject(event.target.error); };
            request.onsuccess = function() { resolve(); };
        } catch (e) { reject(e); }
    });
}

function saveData() {
    return new Promise(function(resolve, reject) {
        if (!db) {
            openDatabase().then(function() { saveDataInternal().then(resolve).catch(reject); }).catch(reject);
            return;
        }
        saveDataInternal().then(resolve).catch(reject);
    });
}

// ============================================================
// ACTIVITY LOGGING & DASHBOARD
// ============================================================

function logActivity(message, type) {
    if (type === undefined) type = 'info';
    data.activities.unshift({ id: generateId(), message: message, type: type, timestamp: new Date().toISOString() });
    if (data.activities.length > 100) data.activities = data.activities.slice(0, 100);
    saveData().catch(function(e) { console.warn('Failed to save activity:', e); });
    updateActivityLog();
}

function updateActivityLog() {
    var log = document.getElementById('activity-log');
    if (!log) return;
    if (data.activities.length === 0) {
        log.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }
    log.innerHTML = data.activities.slice(0, 10).map(function(a) {
        return '<div class="activity-item">' + a.message + '</div>';
    }).join('');
}

function updateDashboard() {
    var charCount = document.getElementById('char-count');
    var teamCount = document.getElementById('team-count');
    var tournCount = document.getElementById('tournament-count');
    if (charCount) charCount.textContent = data.characters.length;
    if (teamCount) teamCount.textContent = data.teams.length;
    if (tournCount) tournCount.textContent = data.tournaments.length;
    var yearDisplay = document.getElementById('current-year-display');
    if (yearDisplay) yearDisplay.textContent = data.currentYear || new Date().getFullYear();
    var headerYear = document.getElementById('header-current-year');
    if (headerYear) headerYear.textContent = data.currentYear || new Date().getFullYear();
    updateActivityLog();
}

function renderAll() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    if (page === 'index.html' || page === '') {
        updateDashboard();
    } else if (page === 'characters.html') {
        renderCharacters();
        var headerYear = document.getElementById('header-current-year');
        if (headerYear) headerYear.textContent = data.currentYear || new Date().getFullYear();
    } else if (page === 'teams.html') {
        renderTeams();
    } else if (page === 'tournaments.html') {
        renderTournaments();
    } else if (page === 'calendar.html') {
        renderCalendar();
    }
}

function setCurrentYear(year) {
    var yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 0) { alert('Please enter a valid year.'); return false; }
    data.currentYear = yearNum;
    saveData().then(function() {
        logActivity('Set current year to ' + yearNum);
        renderAll();
        updateDashboard();
    }).catch(function(err) { console.error('Failed to save year:', err); alert('Failed to save year. Please try again.'); });
    return true;
}

function showYearModal() {
    var currentYear = data.currentYear || new Date().getFullYear();
    var newYear = prompt('Enter the current year:', currentYear);
    if (newYear !== null && newYear !== '') {
        var yearNum = parseInt(newYear);
        if (!isNaN(yearNum) && yearNum > 0) setCurrentYear(yearNum);
        else alert('Please enter a valid year (positive number).');
    }
}

// ============================================================
// CHARACTER MANAGEMENT
// ============================================================

function addCareerStatusEntry(container, status, startYear, endYear) {
    var entry = document.createElement('div');
    entry.className = 'career-status-entry';
    entry.innerHTML = `
        <select class="career-status-select">
            <option value="">Select status...</option>
            <option value="civilian" ${status === 'civilian' ? 'selected' : ''}>Civilian</option>
            <option value="trainee" ${status === 'trainee' ? 'selected' : ''}>Trainee</option>
            <option value="rookie" ${status === 'rookie' ? 'selected' : ''}>Rookie</option>
            <option value="junior" ${status === 'junior' ? 'selected' : ''}>Junior</option>
            <option value="senior" ${status === 'senior' ? 'selected' : ''}>Senior</option>
            <option value="instructor" ${status === 'instructor' ? 'selected' : ''}>Instructor</option>
            <option value="support" ${status === 'support' ? 'selected' : ''}>Support</option>
        </select>
        <input type="number" class="career-start-year" placeholder="Start Year" value="${startYear || ''}">
        <input type="number" class="career-end-year" placeholder="End Year (or leave blank)" value="${endYear || ''}">
        <button type="button" class="small danger remove-status">✕</button>
    `;
    container.appendChild(entry);
    var select = entry.querySelector('.career-status-select');
    var specialtyField = document.getElementById('specialty-field');
    select.onchange = function() {
        if (specialtyField) {
            specialtyField.style.display = (this.value === 'instructor' || this.value === 'support') ? 'block' : 'none';
        }
    };
    entry.querySelector('.remove-status').onclick = function() {
        if (container.children.length > 1) entry.remove();
        else alert('You need at least one status entry.');
    };
}

function showCharacterForm(editId) {
    var form = document.getElementById('character-form');
    var title = document.getElementById('form-title');
    var formElement = document.getElementById('char-form');
    form.classList.remove('hidden');
    var deceasedCheckbox = document.getElementById('char-deceased');
    var deathFields = document.getElementById('death-fields');
    if (deceasedCheckbox) {
        deceasedCheckbox.onchange = function() {
            if (deathFields) deathFields.style.display = this.checked ? 'block' : 'none';
        };
    }
    if (editId) {
        title.textContent = 'Edit Character';
        var char = data.characters.find(function(c) { return c.id === editId; });
        if (char) {
            document.getElementById('char-firstname').value = char.firstName || '';
            document.getElementById('char-middlename').value = char.middleName || '';
            document.getElementById('char-lastname').value = char.lastName || '';
            document.getElementById('char-birthyear').value = char.birthYear || '';
            document.getElementById('char-gender').value = char.gender || '';
            document.getElementById('char-associated-names').value = char.associatedNames || '';
            document.getElementById('char-eyes').value = char.eyes || '';
            document.getElementById('char-hair').value = char.hair || '';
            document.getElementById('char-skin').value = char.skin || '';
            document.getElementById('char-height').value = char.height || '';
            document.getElementById('char-build').value = char.build || '';
            document.getElementById('char-appearance-notes').value = char.appearanceNotes || '';
            document.getElementById('char-notes').value = char.notes || '';
            document.getElementById('char-specialty').value = char.specialty || '';
            document.getElementById('char-deceased').checked = char.deceased || false;
            document.getElementById('char-death-year').value = char.deathYear || '';
            document.getElementById('char-death-cause').value = char.deathCause || '';
            document.getElementById('char-death-age').value = char.deathAge || '';
            if (deathFields) deathFields.style.display = char.deceased ? 'block' : 'none';
            var container = document.getElementById('career-status-container');
            container.innerHTML = '';
            if (char.careerStatus && char.careerStatus.length > 0) {
                char.careerStatus.forEach(function(status) { addCareerStatusEntry(container, status.status, status.startYear, status.endYear); });
            } else { addCareerStatusEntry(container); }
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Character';
        formElement.reset();
        delete formElement.dataset.editId;
        if (deathFields) deathFields.style.display = 'none';
        var container = document.getElementById('career-status-container');
        container.innerHTML = '';
        addCareerStatusEntry(container);
        document.getElementById('char-specialty').value = '';
        var specialtyField = document.getElementById('specialty-field');
        if (specialtyField) specialtyField.style.display = 'none';
    }
    document.getElementById('char-form').scrollIntoView({ behavior: 'smooth' });
}

function hideCharacterForm() {
    document.getElementById('character-form').classList.add('hidden');
}

function saveCharacter(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    var isDeceased = document.getElementById('char-deceased').checked;
    var deathYear = document.getElementById('char-death-year').value.trim();
    var deathCause = document.getElementById('char-death-cause').value.trim();
    var deathAge = document.getElementById('char-death-age').value.trim();
    var careerStatus = [];
    var statusEntries = document.querySelectorAll('.career-status-entry');
    statusEntries.forEach(function(entry) {
        var select = entry.querySelector('.career-status-select');
        var startInput = entry.querySelector('.career-start-year');
        var endInput = entry.querySelector('.career-end-year');
        if (select.value) {
            careerStatus.push({ status: select.value, startYear: startInput.value || '', endYear: endInput.value || '' });
        }
    });
    var charData = {
        firstName: document.getElementById('char-firstname').value.trim(),
        middleName: document.getElementById('char-middlename').value.trim(),
        lastName: document.getElementById('char-lastname').value.trim(),
        birthYear: document.getElementById('char-birthyear').value || '',
        gender: document.getElementById('char-gender').value.trim(),
        associatedNames: document.getElementById('char-associated-names').value.trim(),
        eyes: document.getElementById('char-eyes').value.trim(),
        hair: document.getElementById('char-hair').value.trim(),
        skin: document.getElementById('char-skin').value.trim(),
        height: document.getElementById('char-height').value.trim(),
        build: document.getElementById('char-build').value.trim(),
        appearanceNotes: document.getElementById('char-appearance-notes').value.trim(),
        notes: document.getElementById('char-notes').value.trim(),
        deceased: isDeceased,
        deathYear: deathYear,
        deathCause: deathCause,
        deathAge: deathAge,
        careerStatus: careerStatus,
        specialty: document.getElementById('char-specialty').value.trim(),
        eliminatedWeeks: []
    };
    if (!charData.firstName) { alert('First name is required.'); return; }
    if (isDeceased) {
        if (!deathYear && !deathAge) { alert('Please enter either Death Year or Death Age for deceased characters.'); return; }
        if (!deathAge && deathYear && charData.birthYear) {
            var birthYear = parseInt(charData.birthYear);
            var dYear = parseInt(deathYear);
            if (!isNaN(birthYear) && !isNaN(dYear)) charData.deathAge = String(dYear - birthYear);
        }
    }
    if (editId) {
        var index = data.characters.findIndex(function(c) { return c.id === editId; });
        if (index !== -1) {
            if (!charData.deathAge && data.characters[index].deathAge) charData.deathAge = data.characters[index].deathAge;
            if (!charData.eliminatedWeeks) charData.eliminatedWeeks = [];
            data.characters[index] = Object.assign({}, data.characters[index], charData);
            logActivity('Updated character: ' + charData.firstName);
        }
    } else {
        var newChar = { id: generateId(), firstName: charData.firstName, middleName: charData.middleName, lastName: charData.lastName,
            birthYear: charData.birthYear, gender: charData.gender, associatedNames: charData.associatedNames,
            eyes: charData.eyes, hair: charData.hair, skin: charData.skin, height: charData.height, build: charData.build,
            appearanceNotes: charData.appearanceNotes, notes: charData.notes, deceased: charData.deceased,
            deathYear: charData.deathYear, deathCause: charData.deathCause, deathAge: charData.deathAge,
            careerStatus: charData.careerStatus, specialty: charData.specialty, eliminatedWeeks: [], createdAt: new Date().toISOString() };
        data.characters.push(newChar);
        logActivity('Added character: ' + charData.firstName);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); alert('Failed to save character. Please check console for details.'); });
    renderCharacters();
    updateDashboard();
    hideCharacterForm();
}

function editCharacter(id) { showCharacterForm(id); }

function deleteCharacter(id) {
    if (!confirm('Delete this character permanently? This will remove them from all teams.')) return;
    var char = data.characters.find(function(c) { return c.id === id; });
    if (!char) return;
    data.teams.forEach(function(team) {
        if (team.members) team.members = team.members.filter(function(m) { return m.characterId !== id; });
    });
    data.characters = data.characters.filter(function(c) { return c.id !== id; });
    logActivity('Deleted character: ' + char.firstName);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderCharacters();
    updateDashboard();
}

function renderCharacters() {
    var container = document.getElementById('characters-container');
    if (!container) return;
    if (data.characters.length === 0) {
        container.innerHTML = '<p class="empty-state">No characters created yet. Add your first character!</p>';
        return;
    }
    var sortedChars = data.characters.slice().sort(function(a, b) {
        if (a.deceased && !b.deceased) return 1;
        if (!a.deceased && b.deceased) return -1;
        return (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase());
    });
    var html = '';
    sortedChars.forEach(function(char) {
        var fullName = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var age = calculateAge(char);
        var ageDisplay = age !== null ? age + ' yrs' : '-';
        var status = getCurrentStatus(char);
        var teamCount = getCharacterTeamCount(char.id);
        var isDead = char.deceased || false;
        var deadClass = isDead ? ' deceased' : '';
        var deadBadge = isDead ? ' <span class="deceased-badge">💀 Deceased</span>' : '';
        html += '<div class="list-item' + deadClass + '" data-id="' + char.id + '">' +
            '<span><strong>' + fullName + '</strong>' + deadBadge + '</span>' +
            '<span>' + ageDisplay + '</span>' +
            '<span>' + status + '</span>' +
            '<span>' + teamCount + '</span>' +
            '<span class="actions">' +
                '<button class="small edit-character" data-id="' + char.id + '">✎</button>' +
                '<button class="small danger delete-character" data-id="' + char.id + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.edit-character').forEach(function(btn) {
        btn.addEventListener('click', function(e) { e.stopPropagation(); editCharacter(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-character').forEach(function(btn) {
        btn.addEventListener('click', function(e) { e.stopPropagation(); deleteCharacter(btn.dataset.id); });
    });
}

// ============================================================
// TEAM MANAGEMENT
// ============================================================

var currentEditMember = null;
var currentTeamId = null;
var currentRankingTeamId = null;

function addNameHistoryEntry(container, name, start, end) {
    var entry = document.createElement('div');
    entry.className = 'name-history-entry';
    entry.innerHTML = `
        <input type="text" class="name-history-name" placeholder="Team Name" value="${name || ''}">
        <input type="number" class="name-history-start" placeholder="Start Week/Year" value="${start || ''}">
        <input type="number" class="name-history-end" placeholder="End Week/Year" value="${end || ''}">
        <button type="button" class="small danger remove-name">✕</button>
    `;
    container.appendChild(entry);
    entry.querySelector('.remove-name').onclick = function() {
        if (container.children.length > 1) entry.remove();
        else alert('You need at least one name entry.');
    };
}

function showTeamForm(editId) {
    var form = document.getElementById('team-form');
    var title = document.getElementById('team-form-title');
    var formElement = document.getElementById('team-form-inner');
    form.classList.remove('hidden');
    if (editId) {
        title.textContent = 'Edit Team';
        var team = data.teams.find(function(t) { return t.id === editId; });
        if (team) {
            document.getElementById('team-name').value = team.name || '';
            document.getElementById('team-type').value = team.type || '';
            document.getElementById('team-start').value = team.startPeriod || '';
            document.getElementById('team-end').value = team.endPeriod || '';
            document.getElementById('team-ranking').value = team.currentRank || '';
            document.getElementById('team-status').value = team.status || 'active';
            formElement.dataset.editId = editId;
            var container = document.getElementById('name-history-container');
            container.innerHTML = '';
            if (team.nameHistory && team.nameHistory.length > 0) {
                team.nameHistory.forEach(function(entry) { addNameHistoryEntry(container, entry.name, entry.startPeriod, entry.endPeriod); });
            } else { addNameHistoryEntry(container); }
        }
    } else {
        title.textContent = 'Add Team';
        formElement.reset();
        delete formElement.dataset.editId;
        var container = document.getElementById('name-history-container');
        container.innerHTML = '';
        addNameHistoryEntry(container);
    }
    document.getElementById('team-form').scrollIntoView({ behavior: 'smooth' });
}

function hideTeamForm() {
    document.getElementById('team-form').classList.add('hidden');
}

function saveTeam(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    var nameHistory = [];
    var nameEntries = document.querySelectorAll('.name-history-entry');
    nameEntries.forEach(function(entry) {
        var nameInput = entry.querySelector('.name-history-name');
        var startInput = entry.querySelector('.name-history-start');
        var endInput = entry.querySelector('.name-history-end');
        if (nameInput.value.trim()) {
            nameHistory.push({ name: nameInput.value.trim(), startPeriod: startInput.value || '', endPeriod: endInput.value || '' });
        }
    });
    var teamData = {
        name: document.getElementById('team-name').value.trim(),
        type: document.getElementById('team-type').value,
        startPeriod: document.getElementById('team-start').value || '',
        endPeriod: document.getElementById('team-end').value || '',
        currentRank: document.getElementById('team-ranking').value || '',
        status: document.getElementById('team-status').value || 'active',
        nameHistory: nameHistory
    };
    if (!teamData.name) { alert('Team name is required.'); return; }
    if (!teamData.type) { alert('Team type is required.'); return; }
    if (editId) {
        var index = data.teams.findIndex(function(t) { return t.id === editId; });
        if (index !== -1) {
            if (!teamData.members) teamData.members = data.teams[index].members || [];
            if (!teamData.rankingHistory) teamData.rankingHistory = data.teams[index].rankingHistory || [];
            data.teams[index] = Object.assign({}, data.teams[index], teamData);
            logActivity('Updated team: ' + teamData.name);
        }
    } else {
        var newTeam = { id: generateId(), name: teamData.name, type: teamData.type, startPeriod: teamData.startPeriod,
            endPeriod: teamData.endPeriod, currentRank: teamData.currentRank, status: teamData.status,
            nameHistory: teamData.nameHistory, members: [], rankingHistory: [], createdAt: new Date().toISOString() };
        data.teams.push(newTeam);
        logActivity('Added team: ' + teamData.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); alert('Failed to save team. Please check console for details.'); });
    renderTeams();
    updateDashboard();
    hideTeamForm();
}

function editTeam(id) { showTeamForm(id); }

function deleteTeam(id) {
    var team = data.teams.find(function(t) { return t.id === id; });
    if (!team) return;
    if (!confirm('Delete "' + team.name + '" permanently? This will also remove it from tournaments.')) return;
    data.tournaments.forEach(function(t) {
        if (t.teams) t.teams = t.teams.filter(function(entry) { return entry.teamId !== id; });
    });
    data.teams = data.teams.filter(function(t) { return t.id !== id; });
    logActivity('Deleted team: ' + team.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTeams();
    updateDashboard();
    closeMemberModal();
}

function openMemberModal(teamId) {
    var modal = document.getElementById('member-modal');
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;
    currentTeamId = teamId;
    var periodLabel = team.type === 'academic' ? 'Week' : 'Year';
    document.getElementById('modal-team-name').textContent = team.name + ' - Members (' + periodLabel + 's)';
    var currentPeriod = parseInt(team.startPeriod) || 1;
    if (team.endPeriod) {
        var endPeriod = parseInt(team.endPeriod);
        if (!isNaN(endPeriod)) currentPeriod = Math.floor((currentPeriod + endPeriod) / 2);
    }
    var select = document.getElementById('member-character');
    select.innerHTML = '<option value="">Select character...</option>';
    var sortedChars = data.characters.slice().sort(function(a, b) {
        var nameA = [a.firstName, a.middleName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.firstName, b.middleName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    var assigned = [], unassigned = [];
    sortedChars.forEach(function(char) {
        var inThisTeam = team.members && team.members.some(function(m) { return m.characterId === char.id; });
        var inOtherTeam = false;
        if (!inThisTeam) {
            data.teams.forEach(function(t) {
                if (t.id === team.id) return;
                if (t.members) {
                    t.members.forEach(function(m) {
                        if (m.characterId === char.id) {
                            var joinPeriod = parseInt(m.joinPeriod);
                            var leavePeriod = parseInt(m.leavePeriod);
                            if (!isNaN(joinPeriod) && joinPeriod <= currentPeriod && (isNaN(leavePeriod) || leavePeriod >= currentPeriod)) {
                                inOtherTeam = true;
                            }
                        }
                    });
                }
            });
        }
        if (inThisTeam) assigned.push(char);
        else if (inOtherTeam) assigned.push(char);
        else unassigned.push(char);
    });
    var allChars = unassigned.concat(assigned);
    allChars.forEach(function(char) {
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var deadMarker = char.deceased ? ' 💀' : '';
        var inTeamMarker = '';
        var inThisTeam = team.members && team.members.some(function(m) { return m.characterId === char.id; });
        if (inThisTeam) {
            inTeamMarker = ' ✓';
        } else {
            data.teams.forEach(function(t) {
                if (t.id === team.id) return;
                if (t.members) {
                    t.members.forEach(function(m) {
                        if (m.characterId === char.id) {
                            var joinPeriod = parseInt(m.joinPeriod);
                            var leavePeriod = parseInt(m.leavePeriod);
                            if (!isNaN(joinPeriod) && joinPeriod <= currentPeriod && (isNaN(leavePeriod) || leavePeriod >= currentPeriod)) {
                                inTeamMarker = ' (in ' + t.name + ')';
                            }
                        }
                    });
                }
            });
        }
        var option = document.createElement('option');
        option.value = char.id;
        option.textContent = name + deadMarker + inTeamMarker;
        if (inThisTeam) { option.style.color = 'var(--accent)'; option.style.fontWeight = '600'; }
        else if (inTeamMarker) { option.style.color = 'var(--text-dim)'; }
        select.appendChild(option);
    });
    document.getElementById('member-role').value = '';
    document.getElementById('member-join').placeholder = 'Join ' + periodLabel;
    document.getElementById('member-join').value = '';
    document.getElementById('member-leave').placeholder = 'Leave ' + periodLabel;
    document.getElementById('member-leave').value = '';
    renderMembers(team);
    modal.classList.remove('hidden');
}

function closeMemberModal() {
    document.getElementById('member-modal').classList.add('hidden');
    currentTeamId = null;
}

function renderMembers(team) {
    var container = document.getElementById('members-list');
    if (!team.members || team.members.length === 0) {
        container.innerHTML = '<p class="empty-state">No members in this team</p>';
        return;
    }
    var periodLabel = team.type === 'academic' ? 'Wk' : 'Yr';
    var html = '';
    team.members.forEach(function(member, index) {
        var char = data.characters.find(function(c) { return c.id === member.characterId; });
        var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        var age = char ? getCharacterAge(char) : '-';
        var deadMarker = char && char.deceased ? ' 💀' : '';
        html += '<div class="member-entry">' +
            '<div class="member-info">' +
                '<span><strong>' + name + deadMarker + '</strong></span>' +
                '<span class="role">' + (member.role || 'Member') + '</span>' +
                '<span class="years">' + periodLabel + (member.joinPeriod || '?') + (member.leavePeriod ? ' → ' + periodLabel + member.leavePeriod : '') + '</span>' +
                '<span class="years">Age: ' + age + '</span>' +
            '</div>' +
            '<div class="member-actions">' +
                '<button class="small edit-member" data-team="' + team.id + '" data-index="' + index + '">✎</button>' +
                '<button class="small danger remove-member" data-team="' + team.id + '" data-char="' + member.characterId + '">✕</button>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.edit-member').forEach(function(btn) {
        btn.addEventListener('click', function() { openEditMemberModal(btn.dataset.team, parseInt(btn.dataset.index)); });
    });
    container.querySelectorAll('.remove-member').forEach(function(btn) {
        btn.addEventListener('click', function() { removeMember(btn.dataset.team, btn.dataset.char); });
    });
}

function refreshMemberDropdown(team) {
    var select = document.getElementById('member-character');
    if (!select) return;
    var currentPeriod = parseInt(team.startPeriod) || 1;
    if (team.endPeriod) {
        var endPeriod = parseInt(team.endPeriod);
        if (!isNaN(endPeriod)) currentPeriod = Math.floor((currentPeriod + endPeriod) / 2);
    }
    var currentValue = select.value;
    select.innerHTML = '<option value="">Select character...</option>';
    var sortedChars = data.characters.slice().sort(function(a, b) {
        var nameA = [a.firstName, a.middleName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.firstName, b.middleName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    var assigned = [], unassigned = [];
    sortedChars.forEach(function(char) {
        var inThisTeam = team.members && team.members.some(function(m) { return m.characterId === char.id; });
        var inOtherTeam = false;
        if (!inThisTeam) {
            data.teams.forEach(function(t) {
                if (t.id === team.id) return;
                if (t.members) {
                    t.members.forEach(function(m) {
                        if (m.characterId === char.id) {
                            var joinPeriod = parseInt(m.joinPeriod);
                            var leavePeriod = parseInt(m.leavePeriod);
                            if (!isNaN(joinPeriod) && joinPeriod <= currentPeriod && (isNaN(leavePeriod) || leavePeriod >= currentPeriod)) {
                                inOtherTeam = true;
                            }
                        }
                    });
                }
            });
        }
        if (inThisTeam) assigned.push(char);
        else if (inOtherTeam) assigned.push(char);
        else unassigned.push(char);
    });
    var allChars = unassigned.concat(assigned);
    allChars.forEach(function(char) {
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var deadMarker = char.deceased ? ' 💀' : '';
        var inTeamMarker = '';
        var inThisTeam = team.members && team.members.some(function(m) { return m.characterId === char.id; });
        if (inThisTeam) {
            inTeamMarker = ' ✓';
        } else {
            data.teams.forEach(function(t) {
                if (t.id === team.id) return;
                if (t.members) {
                    t.members.forEach(function(m) {
                        if (m.characterId === char.id) {
                            var joinPeriod = parseInt(m.joinPeriod);
                            var leavePeriod = parseInt(m.leavePeriod);
                            if (!isNaN(joinPeriod) && joinPeriod <= currentPeriod && (isNaN(leavePeriod) || leavePeriod >= currentPeriod)) {
                                inTeamMarker = ' (in ' + t.name + ')';
                            }
                        }
                    });
                }
            });
        }
        var option = document.createElement('option');
        option.value = char.id;
        option.textContent = name + deadMarker + inTeamMarker;
        if (inThisTeam) { option.style.color = 'var(--accent)'; option.style.fontWeight = '600'; }
        else if (inTeamMarker) { option.style.color = 'var(--text-dim)'; }
        select.appendChild(option);
    });
    if (currentValue) {
        var exists = false;
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value === currentValue) { exists = true; break; }
        }
        if (exists) select.value = currentValue;
    }
}

function addMember() {
    if (!currentTeamId) return;
    var charId = document.getElementById('member-character').value;
    var role = document.getElementById('member-role').value.trim();
    var joinPeriod = document.getElementById('member-join').value;
    var leavePeriod = document.getElementById('member-leave').value;
    if (!charId) { alert('Please select a character.'); return; }
    var team = data.teams.find(function(t) { return t.id === currentTeamId; });
    if (!team) return;
    if (team.members && team.members.some(function(m) { return m.characterId === charId; })) {
        alert('This character is already in the team.'); return;
    }
    var currentPeriod = parseInt(joinPeriod) || parseInt(team.startPeriod) || 1;
    var inOtherTeam = false, otherTeamName = '';
    data.teams.forEach(function(t) {
        if (t.id === team.id) return;
        if (t.members) {
            t.members.forEach(function(m) {
                if (m.characterId === charId) {
                    var join = parseInt(m.joinPeriod);
                    var leave = parseInt(m.leavePeriod);
                    if (!isNaN(join) && join <= currentPeriod && (isNaN(leave) || leave >= currentPeriod)) {
                        inOtherTeam = true; otherTeamName = t.name;
                    }
                }
            });
        }
    });
    if (inOtherTeam) {
        if (!confirm('This character is already in "' + otherTeamName + '" during this period. Add them anyway?')) return;
    }
    if (!team.members) team.members = [];
    team.members.push({ characterId: charId, role: role || 'Member', joinPeriod: joinPeriod || '', leavePeriod: leavePeriod || '' });
    var char = data.characters.find(function(c) { return c.id === charId; });
    logActivity('Added ' + (char ? char.firstName : 'character') + ' to team: ' + team.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeams();
    updateDashboard();
    refreshMemberDropdown(team);
    document.getElementById('member-role').value = '';
    document.getElementById('member-join').value = '';
    document.getElementById('member-leave').value = '';
}

function removeMember(teamId, charId) {
    if (!confirm('Remove this member from the team?')) return;
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;
    team.members = team.members.filter(function(m) { return m.characterId !== charId; });
    var char = data.characters.find(function(c) { return c.id === charId; });
    logActivity('Removed ' + (char ? char.firstName : 'character') + ' from team: ' + team.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeams();
    updateDashboard();
}

function openEditMemberModal(teamId, index) {
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.members || !team.members[index]) return;
    var member = team.members[index];
    var char = data.characters.find(function(c) { return c.id === member.characterId; });
    var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    currentEditMember = { teamId: teamId, index: index };
    var periodLabel = team.type === 'academic' ? 'Week' : 'Year';
    document.getElementById('edit-member-name').textContent = name;
    document.getElementById('edit-member-role').value = member.role || '';
    document.getElementById('edit-member-join').placeholder = 'Join ' + periodLabel;
    document.getElementById('edit-member-join').value = member.joinPeriod || '';
    document.getElementById('edit-member-leave').placeholder = 'Leave ' + periodLabel;
    document.getElementById('edit-member-leave').value = member.leavePeriod || '';
    document.getElementById('edit-member-modal').classList.remove('hidden');
}

function closeEditMemberModal() {
    document.getElementById('edit-member-modal').classList.add('hidden');
    currentEditMember = null;
}

function saveEditMember(e) {
    e.preventDefault();
    if (!currentEditMember) return;
    var teamId = currentEditMember.teamId;
    var index = currentEditMember.index;
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.members || !team.members[index]) return;
    var role = document.getElementById('edit-member-role').value.trim();
    var joinPeriod = document.getElementById('edit-member-join').value;
    var leavePeriod = document.getElementById('edit-member-leave').value;
    team.members[index].role = role || 'Member';
    team.members[index].joinPeriod = joinPeriod || '';
    team.members[index].leavePeriod = leavePeriod || '';
    var char = data.characters.find(function(c) { return c.id === team.members[index].characterId; });
    logActivity('Updated member ' + (char ? char.firstName : '') + ' in team: ' + team.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderMembers(team);
    renderTeams();
    closeEditMemberModal();
}

function renderTeams() {
    var container = document.getElementById('teams-container');
    if (!container) return;
    if (data.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams created yet. Add your first team!</p>';
        return;
    }
    var html = '';
    data.teams.forEach(function(team) {
        var periodDisplay = '';
        if (team.type === 'academic') {
            if (team.startPeriod && team.endPeriod) {
                var startBlock = getRankingBlock(team.startPeriod);
                var endBlock = getRankingBlock(team.endPeriod);
                if (startBlock && endBlock) periodDisplay = 'Wk ' + startBlock.label + ' - Wk ' + endBlock.label;
                else periodDisplay = 'Wk ' + team.startPeriod + ' - Wk ' + team.endPeriod;
            } else if (team.startPeriod) {
                var block = getRankingBlock(team.startPeriod);
                periodDisplay = block ? 'Wk ' + block.label : 'Wk ' + team.startPeriod;
            } else { periodDisplay = '-'; }
        } else {
            periodDisplay = team.startPeriod ? team.startPeriod + (team.endPeriod ? ' - ' + team.endPeriod : '') : '-';
        }
        var rankDisplay = team.currentRank || '-';
        if (team.currentRank && team.rankingHistory && team.rankingHistory.length > 0) {
            var sorted = team.rankingHistory.slice().sort(function(a, b) { return parseInt(a.period) - parseInt(b.period); });
            var latest = sorted[sorted.length - 1];
            if (team.type === 'academic') {
                var block = getRankingBlock(latest.period);
                if (block) rankDisplay = '#' + team.currentRank + ' (Wk ' + block.label + ')';
                else rankDisplay = '#' + team.currentRank;
            } else {
                rankDisplay = '#' + team.currentRank + ' (' + latest.period + ')';
            }
        } else if (team.currentRank) { rankDisplay = '#' + team.currentRank; }
        html += '<div class="list-item" data-id="' + team.id + '">' +
            '<span><strong>' + team.name + '</strong></span>' +
            '<span>' + (team.type || '-') + '</span>' +
            '<span>' + periodDisplay + '</span>' +
            '<span>' + rankDisplay + '</span>' +
            '<span>' + (team.members ? team.members.length : 0) + '</span>' +
            '<span class="actions">' +
                '<button class="small manage-members" data-id="' + team.id + '">👥</button>' +
                '<button class="small manage-rankings" data-id="' + team.id + '">🏆</button>' +
                '<button class="small edit-team" data-id="' + team.id + '">✎</button>' +
                '<button class="small danger delete-team" data-id="' + team.id + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.manage-members').forEach(function(btn) {
        btn.addEventListener('click', function() { openMemberModal(btn.dataset.id); });
    });
    container.querySelectorAll('.manage-rankings').forEach(function(btn) {
        btn.addEventListener('click', function() { openRankingModal(btn.dataset.id); });
    });
    container.querySelectorAll('.edit-team').forEach(function(btn) {
        btn.addEventListener('click', function() { editTeam(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-team').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteTeam(btn.dataset.id); });
    });
}

// ---- Ranking Management ----
function openRankingModal(teamId) {
    var modal = document.getElementById('ranking-modal');
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;
    currentRankingTeamId = teamId;
    var periodLabel = team.type === 'academic' ? 'Week Block' : 'Year';
    document.getElementById('ranking-modal-title').textContent = team.name + ' - Ranking History';
    document.getElementById('ranking-week').placeholder = periodLabel + ' (e.g., 1 for weeks 1-2)';
    document.getElementById('ranking-week').value = '';
    document.getElementById('ranking-rank').value = '';
    renderRankings(team);
    modal.classList.remove('hidden');
}

function closeRankingModal() {
    document.getElementById('ranking-modal').classList.add('hidden');
    currentRankingTeamId = null;
}

function renderRankings(team) {
    var container = document.getElementById('ranking-list');
    if (!team.rankingHistory || team.rankingHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">No ranking history</p>';
        return;
    }
    var periodLabel = team.type === 'academic' ? 'Weeks' : 'Yr';
    var html = '';
    var sorted = team.rankingHistory.slice().sort(function(a, b) { return parseInt(a.period) - parseInt(b.period); });
    sorted.forEach(function(entry, index) {
        var blockDisplay = '';
        if (team.type === 'academic') {
            var block = getRankingBlock(entry.period);
            if (block) blockDisplay = ' (Wk ' + block.label + ')';
            else blockDisplay = ' (Wk ' + entry.period + ')';
        } else { blockDisplay = ' (' + entry.period + ')'; }
        html += '<div class="ranking-entry">' +
            '<span><strong>#' + entry.rank + '</strong> - ' + periodLabel + blockDisplay + '</span>' +
            '<button class="small danger remove-ranking" data-team="' + team.id + '" data-index="' + index + '">✕</button>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.remove-ranking').forEach(function(btn) {
        btn.addEventListener('click', function() { removeRanking(btn.dataset.team, parseInt(btn.dataset.index)); });
    });
}

function addRanking() {
    if (!currentRankingTeamId) return;
    var period = document.getElementById('ranking-week').value;
    var rank = document.getElementById('ranking-rank').value;
    if (!period) {
        alert('Please enter a ' + (data.teams.find(t => t.id === currentRankingTeamId)?.type === 'academic' ? 'week block (1 for weeks 1-2, 3 for weeks 3-4, etc.)' : 'year') + '.');
        return;
    }
    if (!rank) { alert('Please enter a rank.'); return; }
    var team = data.teams.find(function(t) { return t.id === currentRankingTeamId; });
    if (!team) return;
    if (!team.rankingHistory) team.rankingHistory = [];
    var periodNum = parseInt(period);
    if (team.type === 'academic' && !isNaN(periodNum)) {
        var blockStart = Math.floor((periodNum - 1) / 2) * 2 + 1;
        period = String(blockStart);
    }
    var existing = team.rankingHistory.findIndex(function(r) { return parseInt(r.period) === parseInt(period); });
    if (existing !== -1) {
        if (!confirm('Ranking for ' + (team.type === 'academic' ? 'weeks ' + (getRankingBlock(period)?.label || period) : period) + ' already exists. Overwrite?')) return;
        team.rankingHistory[existing] = { period: period, rank: rank };
    } else {
        team.rankingHistory.push({ period: period, rank: rank });
    }
    team.rankingHistory.sort(function(a, b) { return parseInt(a.period) - parseInt(b.period); });
    if (team.rankingHistory.length > 0) {
        var sorted = team.rankingHistory.slice().sort(function(a, b) { return parseInt(a.period) - parseInt(b.period); });
        team.currentRank = sorted[sorted.length - 1].rank;
    }
    var blockDisplay = team.type === 'academic' ? 'weeks ' + (getRankingBlock(period)?.label || period) : period;
    logActivity('Added ranking #' + rank + ' for team: ' + team.name + ' (' + blockDisplay + ')');
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderRankings(team);
    renderTeams();
    document.getElementById('ranking-week').value = '';
    document.getElementById('ranking-rank').value = '';
}

function removeRanking(teamId, index) {
    if (!confirm('Remove this ranking entry?')) return;
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team || !team.rankingHistory) return;
    var removed = team.rankingHistory[index];
    team.rankingHistory.splice(index, 1);
    if (team.rankingHistory.length > 0) {
        var sorted = team.rankingHistory.slice().sort(function(a, b) { return parseInt(a.period) - parseInt(b.period); });
        team.currentRank = sorted[sorted.length - 1].rank;
    } else { team.currentRank = ''; }
    var blockDisplay = team.type === 'academic' ? 'weeks ' + (getRankingBlock(removed.period)?.label || removed.period) : removed.period;
    logActivity('Removed ranking from team: ' + team.name + ' (' + blockDisplay + ')');
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderRankings(team);
    renderTeams();
}

// ============================================================
// TOURNAMENT MANAGEMENT
// ============================================================

function renderTournaments() {
    var container = document.getElementById('tournaments-container');
    if (!container) return;
    if (data.tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet. Create your first tournament!</p>';
        return;
    }
    var html = '';
    data.tournaments.forEach(function(tourn) {
        var teamCount = tourn.teams ? tourn.teams.length : 0;
        html += '<div class="list-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong></span>' +
            '<span>' + (tourn.academicYear || '-') + '</span>' +
            '<span>Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?') + '</span>' +
            '<span>' + teamCount + '</span>' +
            '<span>' + (tourn.status || 'draft') + '</span>' +
            '<span class="actions">' +
                '<button class="small view-tournament" data-id="' + tourn.id + '">📋</button>' +
                '<button class="small edit-tournament" data-id="' + tourn.id + '">✎</button>' +
                '<button class="small danger delete-tournament" data-id="' + tourn.id + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.view-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { viewTournament(btn.dataset.id); });
    });
    container.querySelectorAll('.edit-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { editTournament(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteTournament(btn.dataset.id); });
    });
}

function showTournamentForm(editId) {
    var form = document.getElementById('tournament-form');
    var title = document.getElementById('tournament-form-title');
    var formElement = document.getElementById('tournament-form-inner');
    form.classList.remove('hidden');
    if (editId) {
        title.textContent = 'Edit Tournament';
        var tourn = data.tournaments.find(function(t) { return t.id === editId; });
        if (tourn) {
            document.getElementById('tournament-name').value = tourn.name || '';
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            document.getElementById('tournament-start-week').value = tourn.startWeek || '';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '';
            document.getElementById('tournament-eliminations').value = tourn.eliminationsPerWeek || 4;
            document.getElementById('tournament-description').value = tourn.description || '';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Create Tournament';
        formElement.reset();
        document.getElementById('tournament-eliminations').value = 4;
        delete formElement.dataset.editId;
    }
    document.getElementById('tournament-form').scrollIntoView({ behavior: 'smooth' });
}

function hideTournamentForm() {
    document.getElementById('tournament-form').classList.add('hidden');
}

function saveTournament(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    var tournData = {
        name: document.getElementById('tournament-name').value.trim(),
        academicYear: document.getElementById('tournament-year').value.trim(),
        startWeek: document.getElementById('tournament-start-week').value || '',
        endWeek: document.getElementById('tournament-end-week').value || '',
        eliminationsPerWeek: parseInt(document.getElementById('tournament-eliminations').value) || 4,
        description: document.getElementById('tournament-description').value.trim(),
        status: 'draft'
    };
    if (!tournData.name) { alert('Tournament name is required.'); return; }
    if (editId) {
        var index = data.tournaments.findIndex(function(t) { return t.id === editId; });
        if (index !== -1) {
            data.tournaments[index] = Object.assign({}, data.tournaments[index], tournData);
            logActivity('Updated tournament: ' + tournData.name);
        }
    } else {
        var newTourn = { id: generateId(), name: tournData.name, academicYear: tournData.academicYear,
            startWeek: tournData.startWeek, endWeek: tournData.endWeek, eliminationsPerWeek: tournData.eliminationsPerWeek,
            description: tournData.description, status: tournData.status, teams: [], bracket: [], eliminations: [], createdAt: new Date().toISOString() };
        data.tournaments.push(newTourn);
        logActivity('Created tournament: ' + tournData.name);
    }
    saveData().catch(function(err) { console.error('Failed to save:', err); alert('Failed to save tournament. Please check console for details.'); });
    renderTournaments();
    updateDashboard();
    hideTournamentForm();
}

function editTournament(id) { showTournamentForm(id); }

function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === id; });
    if (!tourn) return;
    data.tournaments = data.tournaments.filter(function(t) { return t.id !== id; });
    logActivity('Deleted tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTournaments();
    updateDashboard();
    closeTournamentDetail();
}

function viewTournament(id) {
    var tourn = data.tournaments.find(function(t) { return t.id === id; });
    if (!tourn) return;
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    var info = document.getElementById('tournament-info');
    info.innerHTML = 
        '<p><strong>Academic Year:</strong> ' + (tourn.academicYear || 'N/A') + '</p>' +
        '<p><strong>Weeks:</strong> Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?') + '</p>' +
        '<p><strong>Eliminations per Week:</strong> ' + (tourn.eliminationsPerWeek || 4) + '</p>' +
        '<p><strong>Status:</strong> ' + (tourn.status || 'draft') + '</p>' +
        '<p><strong>Description:</strong> ' + (tourn.description || 'No description') + '</p>';
    var elimSelect = document.getElementById('elim-characters');
    elimSelect.innerHTML = '';
    var sortedChars = data.characters.slice().sort(function(a, b) {
        var nameA = [a.firstName, a.middleName, a.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        var nameB = [b.firstName, b.middleName, b.lastName].filter(function(n) { return n; }).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
    });
    sortedChars.forEach(function(char) {
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var option = document.createElement('option');
        option.value = char.id;
        option.textContent = name + (char.deceased ? ' 💀' : '');
        elimSelect.appendChild(option);
    });
    var select = document.getElementById('tournament-team-select');
    var academicTeams = data.teams.filter(function(t) { return t.type === 'academic' && t.status !== 'deleted'; });
    select.innerHTML = '<option value="">Select academic team...</option>';
    academicTeams.forEach(function(team) {
        var alreadyAdded = tourn.teams && tourn.teams.some(function(t) { return t.teamId === team.id; });
        if (!alreadyAdded) select.innerHTML += '<option value="' + team.id + '">' + team.name + '</option>';
    });
    renderEliminations(tourn);
    renderTournamentTeams(tourn);
    renderBracket(tourn);
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
}

function renderEliminations(tourn) {
    var container = document.getElementById('elimination-list');
    if (!tourn.eliminations || tourn.eliminations.length === 0) {
        container.innerHTML = '<p class="empty-state">No eliminations recorded</p>';
        return;
    }
    var html = '';
    var sorted = tourn.eliminations.slice().sort(function(a, b) { return parseInt(a.week) - parseInt(b.week); });
    sorted.forEach(function(entry, index) {
        var char = data.characters.find(function(c) { return c.id === entry.characterId; });
        var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
        html += '<div class="elimination-entry">' +
            '<span><strong>Wk ' + entry.week + ':</strong> ' + name + '</span>' +
            '<button class="small danger remove-elimination" data-tourn="' + tourn.id + '" data-index="' + index + '">✕</button>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.remove-elimination').forEach(function(btn) {
        btn.addEventListener('click', function() { removeElimination(btn.dataset.tourn, parseInt(btn.dataset.index)); });
    });
}

function addElimination() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    var week = document.getElementById('elim-week').value;
    var selectedOptions = document.getElementById('elim-characters').selectedOptions;
    if (!week) { alert('Please enter a week number.'); return; }
    if (selectedOptions.length === 0) { alert('Please select at least one character to eliminate.'); return; }
    if (!tourn.eliminations) tourn.eliminations = [];
    var added = 0;
    for (var i = 0; i < selectedOptions.length; i++) {
        var charId = selectedOptions[i].value;
        if (!charId) continue;
        var existing = tourn.eliminations.some(function(e) { return e.characterId === charId && parseInt(e.week) === parseInt(week); });
        if (!existing) {
            tourn.eliminations.push({ characterId: charId, week: week });
            var char = data.characters.find(function(c) { return c.id === charId; });
            if (char) {
                if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
                if (char.eliminatedWeeks.indexOf(week) === -1) char.eliminatedWeeks.push(week);
                if (!char.deceased) {
                    char.deceased = true;
                    char.deathYear = data.currentYear || new Date().getFullYear();
                    char.deathCause = 'Eliminated in tournament: ' + tourn.name + ' (Week ' + week + ')';
                    var birthYear = parseInt(char.birthYear);
                    if (!isNaN(birthYear)) char.deathAge = String(parseInt(char.deathYear) - birthYear);
                }
            }
            added++;
        }
    }
    if (added === 0) { alert('All selected characters are already eliminated this week.'); return; }
    logActivity('Added ' + added + ' elimination(s) for tournament: ' + tourn.name + ' (Week ' + week + ')');
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderEliminations(tourn);
    renderBracket(tourn);
    document.getElementById('elim-week').value = '';
    document.getElementById('elim-characters').selectedIndex = -1;
}

function removeElimination(tournId, index) {
    if (!confirm('Remove this elimination?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.eliminations || !tourn.eliminations[index]) return;
    var removed = tourn.eliminations[index];
    tourn.eliminations.splice(index, 1);
    var char = data.characters.find(function(c) { return c.id === removed.characterId; });
    if (char && char.eliminatedWeeks) {
        var weekIndex = char.eliminatedWeeks.indexOf(removed.week);
        if (weekIndex !== -1) char.eliminatedWeeks.splice(weekIndex, 1);
        if (char.eliminatedWeeks.length === 0 && char.deceased) {
            char.deceased = false;
            char.deathYear = '';
            char.deathCause = '';
            char.deathAge = '';
        }
    }
    logActivity('Removed elimination from tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderEliminations(tourn);
    renderBracket(tourn);
}

function renderTournamentTeams(tourn) {
    var container = document.getElementById('tournament-teams-list');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams added to this tournament</p>';
        return;
    }
    var html = '';
    tourn.teams.forEach(function(entry) {
        var team = data.teams.find(function(t) { return t.id === entry.teamId; });
        html += '<div class="team-entry">' +
            '<span>' + (team ? team.name : 'Unknown team') + '</span>' +
            '<span>' + (entry.seed || 'Unseeded') + '</span>' +
            '<button class="small danger remove-team-from-tournament" data-tourn="' + tourn.id + '" data-team="' + entry.teamId + '">✕</button>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.remove-team-from-tournament').forEach(function(btn) {
        btn.addEventListener('click', function() { removeTeamFromTournament(btn.dataset.tourn, btn.dataset.team); });
    });
}

function addTeamToTournament() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    var teamId = document.getElementById('tournament-team-select').value;
    if (!teamId) { alert('Please select a team.'); return; }
    if (!tourn.teams) tourn.teams = [];
    if (tourn.teams.some(function(t) { return t.teamId === teamId; })) {
        alert('Team already added to this tournament.'); return;
    }
    tourn.teams.push({ teamId: teamId, seed: tourn.teams.length + 1 });
    var team = data.teams.find(function(t) { return t.id === teamId; });
    logActivity('Added team ' + (team ? team.name : '') + ' to tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function removeTeamFromTournament(tournId, teamId) {
    if (!confirm('Remove this team from the tournament?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    tourn.teams = tourn.teams.filter(function(t) { return t.teamId !== teamId; });
    var team = data.teams.find(function(t) { return t.id === teamId; });
    logActivity('Removed team ' + (team ? team.name : '') + ' from tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function renderBracket(tourn) {
    var container = document.getElementById('bracket-container');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">Add teams to generate bracket</p>';
        return;
    }
    var teamsWithRank = tourn.teams.map(function(t) {
        var team = data.teams.find(function(tm) { return tm.id === t.teamId; });
        var rank = team ? team.currentRank : null;
        return { name: team ? team.name : 'Unknown', id: t.teamId, rank: rank ? parseInt(rank) : null, seed: t.seed || null };
    });
    var sortedTeams = teamsWithRank.slice().sort(function(a, b) {
        if (a.rank && b.rank) return a.rank - b.rank;
        if (a.rank) return -1;
        if (b.rank) return 1;
        return (a.seed || 999) - (b.seed || 999);
    });
    var eliminatedIds = [];
    if (tourn.eliminations) {
        tourn.eliminations.forEach(function(e) { eliminatedIds.push(e.characterId); });
    }
    var rounds = [];
    var currentTeams = sortedTeams.map(function(t) { return t.name; });
    if (currentTeams.length === 1) {
        rounds.push([['🏆 ' + currentTeams[0], 'BYE']]);
    } else {
        while (currentTeams.length > 1) {
            var roundTeams = [];
            for (var i = 0; i < currentTeams.length; i += 2) {
                if (i + 1 < currentTeams.length) roundTeams.push([currentTeams[i], currentTeams[i + 1]]);
                else roundTeams.push([currentTeams[i], 'BYE']);
            }
            rounds.push(roundTeams);
            currentTeams = roundTeams.map(function(match) {
                if (match[0] === 'BYE') return match[1];
                if (match[1] === 'BYE') return match[0];
                return Math.random() < 0.5 ? match[0] : match[1];
            });
        }
    }
    var html = '';
    rounds.forEach(function(round, index) {
        html += '<div class="bracket-round">' +
            '<div class="round-label">Round ' + (index + 1) + '</div>';
        round.forEach(function(match) {
            var team1Eliminated = false, team2Eliminated = false;
            var team1 = sortedTeams.find(function(t) { return t.name === match[0]; });
            var team2 = sortedTeams.find(function(t) { return t.name === match[1]; });
            if (team1) {
                var team1Members = data.teams.find(function(t) { return t.id === team1.id; });
                if (team1Members && team1Members.members) {
                    team1Eliminated = team1Members.members.some(function(m) { return eliminatedIds.indexOf(m.characterId) !== -1; });
                }
            }
            if (team2) {
                var team2Members = data.teams.find(function(t) { return t.id === team2.id; });
                if (team2Members && team2Members.members) {
                    team2Eliminated = team2Members.members.some(function(m) { return eliminatedIds.indexOf(m.characterId) !== -1; });
                }
            }
            var team1Class = team1Eliminated ? 'team eliminated' : 'team';
            var team2Class = team2Eliminated ? 'team eliminated' : 'team';
            html += '<div class="bracket-match">' +
                '<div class="' + team1Class + '">' + (match[0] || '?') + (team1Eliminated ? ' 💀' : '') + '</div>' +
                '<div class="' + team2Class + '">' + (match[1] || '?') + (team2Eliminated ? ' 💀' : '') + '</div>' +
            '</div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

// ============================================================
// CALENDAR VIEW
// ============================================================

function renderCalendar() {
    var weekDisplay = document.getElementById('current-week-display');
    if (weekDisplay) {
        var block = getWeekBlock(currentCalendarWeek || 1);
        weekDisplay.textContent = 'Weeks ' + block.label;
    }
    var rankingLabel = document.getElementById('ranking-week-label');
    if (rankingLabel) {
        var block = getWeekBlock(currentCalendarWeek || 1);
        rankingLabel.textContent = 'Weeks ' + block.label;
    }
    renderUnassignedCharacters();
    renderEliminatedCharacters();
    renderTeamRankings();
    renderActiveTeams();
}

function renderUnassignedCharacters() {
    var container = document.getElementById('unassigned-characters');
    if (!container) return;
    var block = getWeekBlock(currentCalendarWeek || 1);
    var weekStart = block.start, weekEnd = block.end;
    var assignedIds = [];
    data.teams.forEach(function(team) {
        if (team.members) {
            team.members.forEach(function(member) {
                var join = parseInt(member.joinPeriod);
                var leave = parseInt(member.leavePeriod);
                if (!isNaN(join)) {
                    if (join <= weekEnd) {
                        if (isNaN(leave) || leave >= weekStart) assignedIds.push(member.characterId);
                    }
                }
            });
        }
    });
    var unassigned = data.characters.filter(function(char) { return !char.deceased && assignedIds.indexOf(char.id) === -1; });
    if (unassigned.length === 0) {
        container.innerHTML = '<p class="empty-state">All characters assigned to teams</p>';
        return;
    }
    var html = '';
    unassigned.forEach(function(char) {
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var status = getCurrentStatus(char);
        html += '<div class="activity-item">' + name + ' <span style="color:var(--text-dim);font-size:0.75rem;">(' + status + ')</span></div>';
    });
    container.innerHTML = html;
}

function renderEliminatedCharacters() {
    var container = document.getElementById('eliminated-characters');
    if (!container) return;
    var block = getWeekBlock(currentCalendarWeek || 1);
    var weekStart = block.start, weekEnd = block.end;
    var eliminated = data.characters.filter(function(char) {
        if (!char.eliminatedWeeks) return false;
        return char.eliminatedWeeks.some(function(week) {
            var w = parseInt(week);
            return !isNaN(w) && w >= weekStart && w <= weekEnd;
        });
    });
    if (eliminated.length === 0) {
        container.innerHTML = '<p class="empty-state">No eliminations this block</p>';
        return;
    }
    var html = '';
    eliminated.forEach(function(char) {
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var weeks = char.eliminatedWeeks.filter(function(w) {
            var wk = parseInt(w);
            return !isNaN(wk) && wk >= weekStart && wk <= weekEnd;
        }).join(', ');
        html += '<div class="activity-item" style="color:var(--danger);">' + name + ' <span style="font-size:0.75rem;">(Wk ' + weeks + ')</span></div>';
    });
    container.innerHTML = html;
}

function renderTeamRankings() {
    var container = document.getElementById('team-rankings');
    if (!container) return;
    var block = getWeekBlock(currentCalendarWeek || 1);
    var weekStart = block.start, weekEnd = block.end;
    var teams = data.teams.filter(function(t) { return t.type === 'academic' && t.status !== 'deleted'; });
    var ranked = [];
    teams.forEach(function(team) {
        if (team.rankingHistory) {
            team.rankingHistory.forEach(function(rank) {
                var period = parseInt(rank.period);
                if (!isNaN(period)) {
                    var rankBlock = getRankingBlock(period);
                    if (rankBlock && rankBlock.start <= weekEnd && rankBlock.end >= weekStart) {
                        ranked.push({ team: team, rank: parseInt(rank.rank), period: period, blockLabel: rankBlock.label });
                    }
                }
            });
        }
    });
    teams.forEach(function(team) {
        if (team.currentRank && !ranked.some(function(r) { return r.team.id === team.id; })) {
            var start = parseInt(team.startPeriod);
            var end = parseInt(team.endPeriod);
            if (!isNaN(start) && start <= weekEnd && (isNaN(end) || end >= weekStart)) {
                ranked.push({ team: team, rank: parseInt(team.currentRank), period: null, blockLabel: 'Current' });
            }
        }
    });
    ranked.sort(function(a, b) { return a.rank - b.rank; });
    if (ranked.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams ranked for this block</p>';
        return;
    }
    var html = '';
    ranked.forEach(function(item) {
        var periodDisplay = item.blockLabel || 'Wk ' + item.period;
        html += '<div class="team-ranking-item">' +
            '<span class="rank">#' + item.rank + '</span>' +
            '<span class="team-name">' + item.team.name + '</span>' +
            '<span style="font-size:.75rem;color:var(--text-dim);">' + periodDisplay + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
}

function renderActiveTeams() {
    var container = document.getElementById('active-teams');
    if (!container) return;
    var block = getWeekBlock(currentCalendarWeek || 1);
    var weekStart = block.start, weekEnd = block.end;
    var active = data.teams.filter(function(team) {
        if (team.status === 'deleted') return false;
        var start = parseInt(team.startPeriod);
        var end = parseInt(team.endPeriod);
        return !isNaN(start) && start <= weekEnd && (isNaN(end) || end >= weekStart);
    });
    if (active.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams active this block</p>';
        return;
    }
    active.sort(function(a, b) { return a.name.localeCompare(b.name); });
    var html = '';
    active.forEach(function(team) {
        var memberCount = team.members ? team.members.filter(function(m) {
            var join = parseInt(m.joinPeriod);
            var leave = parseInt(m.leavePeriod);
            return !isNaN(join) && join <= weekEnd && (isNaN(leave) || leave >= weekStart);
        }).length : 0;
        var rankDisplay = '-';
        if (team.rankingHistory) {
            var blockRank = team.rankingHistory.filter(function(r) {
                var period = parseInt(r.period);
                return !isNaN(period) && period >= weekStart && period <= weekEnd;
            });
            if (blockRank.length > 0) rankDisplay = '#' + blockRank[0].rank;
            else if (team.currentRank) rankDisplay = '#' + team.currentRank + '*';
        } else if (team.currentRank) rankDisplay = '#' + team.currentRank + '*';
        var periodDisplay = '';
        if (team.startPeriod && team.endPeriod) periodDisplay = 'Wk ' + team.startPeriod + '-' + team.endPeriod;
        else if (team.startPeriod) periodDisplay = 'Wk ' + team.startPeriod + '+';
        html += '<div class="team-ranking-item">' +
            '<span class="team-name">' + team.name + '</span>' +
            '<span style="font-size:.75rem;color:var(--text-dim);">' + memberCount + ' members</span>' +
            '<span style="font-size:.75rem;color:var(--text-dim);">' + periodDisplay + '</span>' +
            '<span style="font-size:.75rem;color:var(--accent);font-weight:600;">' + rankDisplay + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
}

function prevWeek() {
    if (currentCalendarWeek > 1) {
        currentCalendarWeek -= 2;
        if (currentCalendarWeek < 1) currentCalendarWeek = 1;
        renderCalendar();
    }
}

function nextWeek() {
    if (currentCalendarWeek < 52) {
        currentCalendarWeek += 2;
        if (currentCalendarWeek > 52) currentCalendarWeek = 52;
        renderCalendar();
    }
}

function setCurrentWeek(week) {
    var weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 52) {
        alert('Please enter a valid week number (1-52).');
        return false;
    }
    var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
    currentCalendarWeek = blockStart;
    data.currentWeek = blockStart;
    saveData().then(function() {
        logActivity('Set current week to block ' + getWeekBlock(blockStart).label);
        renderCalendar();
    }).catch(function(err) { console.error('Failed to save week:', err); alert('Failed to save week. Please try again.'); });
    return true;
}

function showWeekModal() {
    var currentBlock = getWeekBlock(currentCalendarWeek || 1);
    var newWeek = prompt('Enter the week number (1-52):', currentCalendarWeek || 1);
    if (newWeek !== null && newWeek !== '') {
        var weekNum = parseInt(newWeek);
        if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 52) setCurrentWeek(weekNum);
        else alert('Please enter a valid week number (1-52).');
    }
}

// ============================================================
// CSV/JSON EXPORT/IMPORT
// ============================================================

function csvField(value) {
    if (value === null || value === undefined) return '';
    var str = String(value);
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function parseCSVLine(line) {
    var values = [], current = '', inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var char = line[i];
        if (inQuotes) {
            if (char === '"' && line[i+1] === '"') { current += '"'; i++; }
            else if (char === '"') inQuotes = false;
            else current += char;
        } else {
            if (char === '"') inQuotes = true;
            else if (char === ',') { values.push(current.trim()); current = ''; }
            else current += char;
        }
    }
    values.push(current.trim());
    return values;
}

function exportCSV() {
    var lines = [];
    lines.push('# CHARACTERS');
    lines.push('FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes,Deceased,DeathYear,DeathCause,DeathAge,Specialty,CareerStatus');
    data.characters.forEach(function(c) {
        var careerStr = '';
        if (c.careerStatus) {
            careerStr = c.careerStatus.map(function(s) { return s.status + ':' + s.startYear + '-' + (s.endYear || 'present'); }).join(';');
        }
        lines.push([
            csvField(c.firstName || ''), csvField(c.middleName || ''), csvField(c.lastName || ''),
            c.birthYear || '', csvField(c.gender || ''), csvField(c.associatedNames || ''),
            csvField(c.eyes || ''), csvField(c.hair || ''), csvField(c.skin || ''),
            csvField(c.height || ''), csvField(c.build || ''), csvField(c.appearanceNotes || ''),
            csvField(c.notes || ''), c.deceased ? 'true' : 'false', c.deathYear || '',
            csvField(c.deathCause || ''), c.deathAge || '', csvField(c.specialty || ''), csvField(careerStr)
        ].join(','));
    });
    lines.push('\n# TEAMS');
    lines.push('TeamName,TeamType,StartPeriod,EndPeriod,CurrentRank,Status,NameHistory');
    data.teams.forEach(function(t) {
        var nameHistoryStr = '';
        if (t.nameHistory) {
            nameHistoryStr = t.nameHistory.map(function(n) { return n.name + ':' + n.startPeriod + '-' + (n.endPeriod || 'present'); }).join(';');
        }
        lines.push(csvField(t.name) + ',' + csvField(t.type) + ',' + (t.startPeriod || '') + ',' + (t.endPeriod || '') + ',' + (t.currentRank || '') + ',' + csvField(t.status) + ',' + csvField(nameHistoryStr));
    });
    lines.push('\n# TEAM MEMBERS');
    lines.push('TeamName,CharacterName,Role,JoinPeriod,LeavePeriod');
    data.teams.forEach(function(t) {
        if (t.members) {
            t.members.forEach(function(m) {
                var char = data.characters.find(function(c) { return c.id === m.characterId; });
                var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                lines.push(csvField(t.name) + ',' + csvField(name) + ',' + csvField(m.role) + ',' + (m.joinPeriod || '') + ',' + (m.leavePeriod || ''));
            });
        }
    });
    lines.push('\n# TEAM RANKINGS');
    lines.push('TeamName,Period,Rank');
    data.teams.forEach(function(t) {
        if (t.rankingHistory) {
            t.rankingHistory.forEach(function(r) { lines.push(csvField(t.name) + ',' + (r.period || '') + ',' + (r.rank || '')); });
        }
    });
    lines.push('\n# TOURNAMENTS');
    lines.push('TournamentName,AcademicYear,StartWeek,EndWeek,EliminationsPerWeek,Status,Description');
    data.tournaments.forEach(function(t) {
        lines.push(csvField(t.name) + ',' + csvField(t.academicYear) + ',' + (t.startWeek || '') + ',' + (t.endWeek || '') + ',' + (t.eliminationsPerWeek || 4) + ',' + csvField(t.status) + ',' + csvField(t.description));
    });
    lines.push('\n# TOURNAMENT TEAMS');
    lines.push('TournamentName,TeamName,Seed');
    data.tournaments.forEach(function(t) {
        if (t.teams) {
            t.teams.forEach(function(entry) {
                var team = data.teams.find(function(tm) { return tm.id === entry.teamId; });
                lines.push(csvField(t.name) + ',' + csvField(team ? team.name : '') + ',' + (entry.seed || ''));
            });
        }
    });
    var csvContent = lines.join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tournament-data-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logActivity('Exported data to CSV');
}

function importCSV(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (!confirm('This will replace all current data. Continue?')) return;
            var lines = e.target.result.split('\n');
            var section = '';
            var newData = { characters: [], teams: [], tournaments: [], activities: [], currentYear: data.currentYear || new Date().getFullYear(), currentWeek: 1 };
            var charMap = {}, teamMap = {};
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;
                if (line.startsWith('# CHARACTERS')) { section = 'characters'; continue; }
                if (line.startsWith('# TEAMS')) { section = 'teams'; continue; }
                if (line.startsWith('# TEAM MEMBERS')) { section = 'members'; continue; }
                if (line.startsWith('# TEAM RANKINGS')) { section = 'rankings'; continue; }
                if (line.startsWith('# TOURNAMENTS')) { section = 'tournaments'; continue; }
                if (line.startsWith('# TOURNAMENT TEAMS')) { section = 'tournament_teams'; continue; }
                if (line.startsWith('FirstName,') || line.startsWith('TeamName,') || line.startsWith('TournamentName,')) continue;
                var values = parseCSVLine(line);
                if (section === 'characters' && values.length >= 19) {
                    var careerStatus = [];
                    if (values[18]) {
                        var careerParts = values[18].split(';');
                        careerParts.forEach(function(part) {
                            var match = part.match(/([^:]+):([^-]+)-(.+)/);
                            if (match) careerStatus.push({ status: match[1], startYear: match[2], endYear: match[3] === 'present' ? '' : match[3] });
                        });
                    }
                    var char = { id: generateId(), firstName: values[0] || '', middleName: values[1] || '', lastName: values[2] || '',
                        birthYear: values[3] || '', gender: values[4] || '', associatedNames: values[5] || '',
                        eyes: values[6] || '', hair: values[7] || '', skin: values[8] || '',
                        height: values[9] || '', build: values[10] || '', appearanceNotes: values[11] || '',
                        notes: values[12] || '', deceased: values[13] === 'true', deathYear: values[14] || '',
                        deathCause: values[15] || '', deathAge: values[16] || '', specialty: values[17] || '',
                        careerStatus: careerStatus, eliminatedWeeks: [], createdAt: new Date().toISOString() };
                    newData.characters.push(char);
                    var key = (char.firstName + '|' + char.lastName).toLowerCase();
                    charMap[key] = char;
                } else if (section === 'teams' && values.length >= 7) {
                    var nameHistory = [];
                    if (values[6]) {
                        var nameParts = values[6].split(';');
                        nameParts.forEach(function(part) {
                            var match = part.match(/([^:]+):([^-]+)-(.+)/);
                            if (match) nameHistory.push({ name: match[1], startPeriod: match[2], endPeriod: match[3] === 'present' ? '' : match[3] });
                        });
                    }
                    var team = { id: generateId(), name: values[0] || '', type: values[1] || '', startPeriod: values[2] || '',
                        endPeriod: values[3] || '', currentRank: values[4] || '', status: values[5] || 'active',
                        nameHistory: nameHistory, members: [], rankingHistory: [], createdAt: new Date().toISOString() };
                    newData.teams.push(team);
                    teamMap[team.name.toLowerCase()] = team;
                } else if (section === 'members' && values.length >= 5) {
                    var teamName = values[0];
                    var charName = values[1];
                    var team = teamMap[teamName.toLowerCase()];
                    if (team) {
                        var charKey = charName.toLowerCase();
                        var char = Object.values(charMap).find(function(c) {
                            return (c.firstName + ' ' + c.lastName).toLowerCase() === charKey ||
                                   (c.firstName + ' ' + (c.middleName || '') + ' ' + c.lastName).toLowerCase().trim() === charKey;
                        });
                        if (char) team.members.push({ characterId: char.id, role: values[2] || 'Member', joinPeriod: values[3] || '', leavePeriod: values[4] || '' });
                    }
                } else if (section === 'rankings' && values.length >= 3) {
                    var teamName = values[0];
                    var team = teamMap[teamName.toLowerCase()];
                    if (team) {
                        if (!team.rankingHistory) team.rankingHistory = [];
                        team.rankingHistory.push({ period: values[1] || '', rank: values[2] || '' });
                    }
                } else if (section === 'tournaments' && values.length >= 7) {
                    var tourn = { id: generateId(), name: values[0] || '', academicYear: values[1] || '',
                        startWeek: values[2] || '', endWeek: values[3] || '', eliminationsPerWeek: parseInt(values[4]) || 4,
                        status: values[5] || 'draft', description: values[6] || '', teams: [], bracket: [], eliminations: [], createdAt: new Date().toISOString() };
                    newData.tournaments.push(tourn);
                } else if (section === 'tournament_teams' && values.length >= 3) {
                    var tournName = values[0];
                    var teamName = values[1];
                    var tourn = newData.tournaments.find(function(t) { return t.name === tournName; });
                    var team = teamMap[teamName.toLowerCase()];
                    if (tourn && team) tourn.teams.push({ teamId: team.id, seed: parseInt(values[2]) || tourn.teams.length + 1 });
                }
            }
            if (newData.characters.length === 0 && newData.teams.length === 0 && newData.tournaments.length === 0) {
                alert('No valid data found in CSV file.'); return;
            }
            data = newData;
            saveData().then(function() {
                logActivity('Imported data from CSV');
                renderAll();
                updateDashboard();
                alert('Imported successfully!\nCharacters: ' + data.characters.length + '\nTeams: ' + data.teams.length + '\nTournaments: ' + data.tournaments.length);
            }).catch(function(err) { alert('Failed to save data: ' + err.message); });
        } catch (err) { alert('Failed to import CSV: ' + err.message); }
    };
    reader.readAsText(file);
}

function exportTemplateCSV() {
    var lines = [
        '# CHARACTERS',
        'FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes,Deceased,DeathYear,DeathCause,DeathAge,Specialty,CareerStatus',
        'John,,Doe,1990,Male,,Blue,Brown,Fair,5\'10",Athletic,,Example character,false,,,,,',
        'Jane,Mary,Smith,1992,Female,The Shadow,Green,Black,Olive,5\'7",Slim,Scar on cheek,,false,,,,,trainee:2020-2023;rookie:2023-',
        '',
        '# TEAMS',
        'TeamName,TeamType,StartPeriod,EndPeriod,CurrentRank,Status,NameHistory',
        'Example Team,academic,1,2,1,active,Example Team:1-2',
        'Another Team,academic,3,4,2,active,Another Team:3-4',
        '',
        '# TEAM MEMBERS',
        'TeamName,CharacterName,Role,JoinPeriod,LeavePeriod',
        'Example Team,John Doe,Captain,1,',
        'Example Team,Jane Smith,Member,1,',
        '',
        '# TEAM RANKINGS',
        'TeamName,Period,Rank',
        'Example Team,1,1',
        'Another Team,3,2',
        '',
        '# TOURNAMENTS',
        'TournamentName,AcademicYear,StartWeek,EndWeek,EliminationsPerWeek,Status,Description',
        'Spring Cup,2025-2026,1,12,4,active,Annual spring tournament',
        '',
        '# TOURNAMENT TEAMS',
        'TournamentName,TeamName,Seed',
        'Spring Cup,Example Team,1',
        'Spring Cup,Another Team,2'
    ];
    var csvContent = lines.join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tournament-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logActivity('Exported template CSV');
}

function exportJSON() {
    var jsonData = JSON.stringify(data, null, 2);
    var blob = new Blob([jsonData], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'tournament-data-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logActivity('Exported data to JSON');
}

function importJSON(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var imported = JSON.parse(e.target.result);
            if (!imported.characters || !imported.teams || !imported.tournaments) {
                alert('Invalid data format. Missing required fields.'); return;
            }
            if (!confirm('This will replace all current data. Continue?')) return;
            data = imported;
            if (!data.currentYear) data.currentYear = new Date().getFullYear();
            if (!data.currentWeek) data.currentWeek = 1;
            saveData().then(function() {
                logActivity('Imported data from JSON');
                renderAll();
                updateDashboard();
                alert('Data imported successfully!');
            }).catch(function(err) { alert('Failed to save data: ' + err.message); });
        } catch (err) { alert('Failed to import JSON: ' + err.message); }
    };
    reader.readAsText(file);
}

// ============================================================
// INITIALIZATION
// ============================================================

function initImportExport() {
    document.querySelectorAll('#export-json-btn').forEach(function(btn) {
        btn.addEventListener('click', exportJSON);
    });
    document.querySelectorAll('#import-json-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { document.getElementById('json-file-input').click(); });
    });
    document.querySelectorAll('#json-file-input').forEach(function(input) {
        input.addEventListener('change', function(e) {
            if (this.files.length > 0) { importJSON(this.files[0]); this.value = ''; }
        });
    });
    document.querySelectorAll('#export-csv-btn').forEach(function(btn) {
        btn.addEventListener('click', exportCSV);
    });
    document.querySelectorAll('#import-csv-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { document.getElementById('csv-file-input').click(); });
    });
    document.querySelectorAll('#csv-file-input').forEach(function(input) {
        input.addEventListener('change', function(e) {
            if (this.files.length > 0) { importCSV(this.files[0]); this.value = ''; }
        });
    });
    document.querySelectorAll('#template-csv-btn').forEach(function(btn) {
        btn.addEventListener('click', exportTemplateCSV);
    });
    document.querySelectorAll('#set-year-btn').forEach(function(btn) {
        btn.addEventListener('click', showYearModal);
    });
    document.querySelectorAll('#current-year-display').forEach(function(el) {
        el.addEventListener('click', showYearModal);
    });
    document.querySelectorAll('#prev-week-btn').forEach(function(btn) {
        btn.addEventListener('click', prevWeek);
    });
    document.querySelectorAll('#next-week-btn').forEach(function(btn) {
        btn.addEventListener('click', nextWeek);
    });
    document.querySelectorAll('#set-week-btn').forEach(function(btn) {
        btn.addEventListener('click', showWeekModal);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    openDatabase().then(function() { return loadData(); }).then(function() {
        initImportExport();
        currentCalendarWeek = data.currentWeek || 1;
        var path = window.location.pathname;
        var page = path.split('/').pop() || 'index.html';
        if (page === 'index.html' || page === '') {
            updateDashboard();
        } else if (page === 'characters.html') {
            renderCharacters();
            document.getElementById('add-character-btn').addEventListener('click', function() { showCharacterForm(); });
            document.getElementById('cancel-char-btn').addEventListener('click', hideCharacterForm);
            document.getElementById('char-form').addEventListener('submit', saveCharacter);
            document.getElementById('add-status-btn').addEventListener('click', function() {
                var container = document.getElementById('career-status-container');
                addCareerStatusEntry(container);
            });
        } else if (page === 'teams.html') {
            renderTeams();
            document.getElementById('add-team-btn').addEventListener('click', function() { showTeamForm(); });
            document.getElementById('cancel-team-btn').addEventListener('click', hideTeamForm);
            document.getElementById('team-form-inner').addEventListener('submit', saveTeam);
            document.querySelector('#member-modal .close-modal').addEventListener('click', closeMemberModal);
            document.getElementById('member-modal').addEventListener('click', function(e) {
                if (e.target === this) closeMemberModal();
            });
            document.getElementById('add-member-btn').addEventListener('click', addMember);
            document.querySelector('#edit-member-modal .close-modal').addEventListener('click', closeEditMemberModal);
            document.getElementById('edit-member-modal').addEventListener('click', function(e) {
                if (e.target === this) closeEditMemberModal();
            });
            document.getElementById('cancel-edit-member').addEventListener('click', closeEditMemberModal);
            document.getElementById('edit-member-form').addEventListener('submit', saveEditMember);
            document.querySelector('#ranking-modal .close-modal').addEventListener('click', closeRankingModal);
            document.getElementById('ranking-modal').addEventListener('click', function(e) {
                if (e.target === this) closeRankingModal();
            });
            document.getElementById('add-ranking-btn').addEventListener('click', addRanking);
            document.getElementById('add-name-history-btn').addEventListener('click', function() {
                var container = document.getElementById('name-history-container');
                addNameHistoryEntry(container);
            });
        } else if (page === 'tournaments.html') {
            renderTournaments();
            document.getElementById('add-tournament-btn').addEventListener('click', function() { showTournamentForm(); });
            document.getElementById('cancel-tournament-btn').addEventListener('click', hideTournamentForm);
            document.getElementById('tournament-form-inner').addEventListener('submit', saveTournament);
            document.querySelector('#tournament-detail-modal .close-modal').addEventListener('click', closeTournamentDetail);
            document.getElementById('tournament-detail-modal').addEventListener('click', function(e) {
                if (e.target === this) closeTournamentDetail();
            });
            document.getElementById('add-team-to-tournament').addEventListener('click', addTeamToTournament);
            document.getElementById('add-elimination-btn').addEventListener('click', addElimination);
            document.getElementById('remove-elimination-btn').addEventListener('click', function() {
                var select = document.getElementById('elim-characters');
                var selected = [];
                for (var i = 0; i < select.options.length; i++) {
                    if (select.options[i].selected) selected.push(select.options[i].value);
                }
                if (selected.length === 0) { alert('Please select characters to remove.'); return; }
                if (!confirm('Remove selected eliminations?')) return;
                var modal = document.getElementById('tournament-detail-modal');
                var tournId = modal.dataset.tournamentId;
                var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
                if (!tourn || !tourn.eliminations) return;
                var toRemove = [];
                tourn.eliminations.forEach(function(e, index) {
                    if (selected.indexOf(e.characterId) !== -1) toRemove.push(index);
                });
                toRemove.sort(function(a, b) { return b - a; });
                toRemove.forEach(function(idx) {
                    var removed = tourn.eliminations[idx];
                    var char = data.characters.find(function(c) { return c.id === removed.characterId; });
                    if (char && char.eliminatedWeeks) {
                        var weekIdx = char.eliminatedWeeks.indexOf(removed.week);
                        if (weekIdx !== -1) char.eliminatedWeeks.splice(weekIdx, 1);
                        if (char.eliminatedWeeks.length === 0 && char.deceased) {
                            char.deceased = false;
                            char.deathYear = '';
                            char.deathCause = '';
                            char.deathAge = '';
                        }
                    }
                    tourn.eliminations.splice(idx, 1);
                });
                saveData().catch(function(err) { console.error('Failed to save:', err); });
                renderEliminations(tourn);
                renderBracket(tourn);
                logActivity('Removed eliminations from tournament: ' + tourn.name);
            });
        } else if (page === 'calendar.html') {
            renderCalendar();
        }
    }).catch(function(err) {
        console.error('Failed to initialize database:', err);
        alert('Failed to open database. Please check console for details.');
    });
});

window.addEventListener('beforeunload', function() {
    saveData().catch(function(err) { console.warn('Failed to save on unload:', err); });
});

window.showYearModal = showYearModal;
window.setCurrentYear = setCurrentYear;
window.calculateAge = calculateAge;
window.prevWeek = prevWeek;
window.nextWeek = nextWeek;
window.showWeekModal = showWeekModal;
