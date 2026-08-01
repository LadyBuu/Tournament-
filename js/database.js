// ============================================================
// database.js - IndexedDB Operations
// ============================================================

var DB_NAME = 'TournamentManagerDB';
var DB_VERSION = 3;
var STORE_NAME = 'tournamentData';

// ---- Open Database ----
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

// ---- Load Data ----
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
                    migrateData();
                    resolve(data);
                } else {
                    data = { 
                        characters: [], 
                        teams: [], 
                        tournaments: [], 
                        activities: [], 
                        currentYear: new Date().getFullYear(), 
                        currentWeek: 1 
                    };
                    resolve(data);
                }
            };
        } catch (e) { reject(e); }
    });
}

function loadData() {
    return new Promise(function(resolve, reject) {
        if (!db) {
            openDatabase().then(function() { 
                loadDataInternal().then(resolve).catch(reject); 
            }).catch(reject);
            return;
        }
        loadDataInternal().then(resolve).catch(reject);
    });
}

// ---- Save Data ----
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
            openDatabase().then(function() { 
                saveDataInternal().then(resolve).catch(reject); 
            }).catch(reject);
            return;
        }
        saveDataInternal().then(resolve).catch(reject);
    });
}

// ---- Data Migration ----
function migrateData() {
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
        if (tourn.eliminationsPerRound === undefined) tourn.eliminationsPerRound = 4;
        if (tourn.matches === undefined) tourn.matches = [];
        if (tourn.participants === undefined) tourn.participants = [];
        if (tourn.mode === undefined) tourn.mode = 'team';
        if (tourn.teams === undefined) tourn.teams = [];
    });
}
