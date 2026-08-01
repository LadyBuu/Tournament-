// ============================================================
// app.js - Tournament Manager Main Entry Point
// ============================================================

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
var currentFilterWeek = 1;
var expandedTeamId = null;

document.addEventListener('DOMContentLoaded', function() {
    openDatabase().then(function() { 
        return loadData(); 
    }).then(function() {
        initImportExport();
        initEventListeners();
        
        currentCalendarWeek = data.currentWeek || 1;
        
        var path = window.location.pathname;
        var page = path.split('/').pop() || 'index.html';
        
        if (page === 'index.html' || page === '') {
            updateDashboard();
        } else if (page === 'characters.html') {
            renderCharacters();
            initCharacterEvents();
        } else if (page === 'teams.html') {
            renderTeams();
            initTeamEvents();
        } else if (page === 'tournaments.html') {
            renderTournaments();
            initTournamentEvents();
        } else if (page === 'calendar.html') {
            renderCalendar();
        } else if (page === 'weekly.html') {
            renderWeeklyView();
            initWeeklyEvents();
        }
    }).catch(function(err) {
        console.error('Failed to initialize database:', err);
        alert('Failed to open database. Please check console for details.');
    });
});

window.addEventListener('beforeunload', function() {
    saveData().catch(function(err) {
        console.warn('Failed to save on unload:', err);
    });
});

window.showYearModal = showYearModal;
window.setCurrentYear = setCurrentYear;
window.calculateAge = calculateAge;
window.prevWeek = prevWeek;
window.nextWeek = nextWeek;
window.showWeekModal = showWeekModal;

function initEventListeners() {
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
