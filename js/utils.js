// ============================================================
// utils.js - Utility Functions
// ============================================================

// ---- ID Generator ----
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ---- Week Block Functions ----
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

// ---- Character Age Functions ----
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

function getParticipantName(participant, tourn) {
    if (!participant) return 'Unknown';
    if (participant.type === 'char') {
        var char = data.characters.find(function(c) { return c.id === participant.id; });
        return char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    } else {
        var team = data.teams.find(function(t) { return t.id === participant.id; });
        return team ? team.name : 'Unknown team';
    }
}

function getActiveTeamsForWeek(week, excludeTournamentId) {
    var weekNum = parseInt(week);
    if (isNaN(weekNum)) weekNum = 1;
    
    var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
    var blockEnd = blockStart + 1;
    
    return data.teams.filter(function(team) {
        if (team.status === 'deleted') return false;
        if (team.type !== 'academic') return false;
        var start = parseInt(team.startPeriod);
        var end = parseInt(team.endPeriod);
        if (isNaN(start)) return false;
        return start <= blockEnd && (isNaN(end) || end >= blockStart);
    }).sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
}

// ---- Activity Logging ----
function logActivity(message, type) {
    if (type === undefined) type = 'info';
    data.activities.unshift({ 
        id: generateId(), 
        message: message, 
        type: type, 
        timestamp: new Date().toISOString() 
    });
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
