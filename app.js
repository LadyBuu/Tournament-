// ============================================================
// app.js - Tournament Manager with IndexedDB Storage
// ============================================================

// ---- Database Configuration ----
var DB_NAME = 'TournamentManagerDB';
var DB_VERSION = 2;
var STORE_NAME = 'tournamentData';

// ---- Data Store ----
var data = {
    characters: [],
    teams: [],
    tournaments: [],
    activities: [],
    currentYear: new Date().getFullYear()
};

var db = null;

// ---- Open Database ----
function openDatabase() {
    return new Promise(function(resolve, reject) {
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = function(event) {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log('Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = function(event) {
            var database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                var store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
                console.log('Object store created');
            }
        };
    });
}

// ---- Load Data from IndexedDB ----
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

function loadDataInternal() {
    return new Promise(function(resolve, reject) {
        try {
            var transaction = db.transaction([STORE_NAME], 'readonly');
            var store = transaction.objectStore(STORE_NAME);
            var request = store.get('mainData');
            
            request.onerror = function(event) {
                console.error('Load error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = function(event) {
                var result = event.target.result;
                if (result && result.data) {
                    data = result.data;
                    if (!data.currentYear) {
                        data.currentYear = new Date().getFullYear();
                    }
                    data.characters.forEach(function(char) {
                        if (char.deceased === undefined) char.deceased = false;
                        if (char.deathYear === undefined) char.deathYear = '';
                        if (char.deathCause === undefined) char.deathCause = '';
                        if (char.deathAge === undefined) char.deathAge = '';
                    });
                    console.log('Data loaded from IndexedDB');
                    resolve(data);
                } else {
                    data = {
                        characters: [],
                        teams: [],
                        tournaments: [],
                        activities: [],
                        currentYear: new Date().getFullYear()
                    };
                    console.log('No data found, using defaults');
                    resolve(data);
                }
            };
        } catch (e) {
            console.error('Load error:', e);
            reject(e);
        }
    });
}

// ---- Save Data to IndexedDB ----
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

function saveDataInternal() {
    return new Promise(function(resolve, reject) {
        try {
            var transaction = db.transaction([STORE_NAME], 'readwrite');
            var store = transaction.objectStore(STORE_NAME);
            
            var record = {
                id: 'mainData',
                data: data,
                updatedAt: new Date().toISOString()
            };
            
            var request = store.put(record);
            
            request.onerror = function(event) {
                console.error('Save error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = function() {
                console.log('Data saved to IndexedDB');
                resolve();
            };
            
            transaction.oncomplete = function() {
                console.log('Transaction completed');
            };
        } catch (e) {
            console.error('Save error:', e);
            reject(e);
        }
    });
}

// ---- ID Generator ----
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ---- Activity Logger ----
function logActivity(message, type) {
    if (type === undefined) type = 'info';
    data.activities.unshift({
        id: generateId(),
        message: message,
        type: type,
        timestamp: new Date().toISOString()
    });
    if (data.activities.length > 100) {
        data.activities = data.activities.slice(0, 100);
    }
    saveData().catch(function(e) {
        console.warn('Failed to save activity:', e);
    });
    updateActivityLog();
}

// ---- Update Dashboard ----
function updateDashboard() {
    var charCount = document.getElementById('char-count');
    var teamCount = document.getElementById('team-count');
    var tournCount = document.getElementById('tournament-count');

    if (charCount) charCount.textContent = data.characters.length;
    if (teamCount) teamCount.textContent = data.teams.length;
    if (tournCount) tournCount.textContent = data.tournaments.length;

    // Update year display
    var yearDisplay = document.getElementById('current-year-display');
    if (yearDisplay) {
        yearDisplay.textContent = data.currentYear || new Date().getFullYear();
    }

    // Update header year if exists
    var headerYear = document.getElementById('header-current-year');
    if (headerYear) {
        headerYear.textContent = data.currentYear || new Date().getFullYear();
    }

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

// ---- Render All ----
function renderAll() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    
    if (page === 'index.html' || page === '') {
        updateDashboard();
    } else if (page === 'characters.html') {
        renderCharacters();
        // Update header year
        var headerYear = document.getElementById('header-current-year');
        if (headerYear) {
            headerYear.textContent = data.currentYear || new Date().getFullYear();
        }
    } else if (page === 'teams.html') {
        renderTeams();
    } else if (page === 'tournaments.html') {
        renderTournaments();
    }
}

// ---- Set Current Year ----
function setCurrentYear(year) {
    var yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 0) {
        alert('Please enter a valid year.');
        return false;
    }
    
    data.currentYear = yearNum;
    saveData().then(function() {
        logActivity('Set current year to ' + yearNum);
        renderAll();
        updateDashboard();
        // Update header year if exists
        var headerYear = document.getElementById('header-current-year');
        if (headerYear) {
            headerYear.textContent = yearNum;
        }
    }).catch(function(err) {
        console.error('Failed to save year:', err);
        alert('Failed to save year. Please try again.');
    });
    return true;
}

// ---- Show Year Modal ----
function showYearModal() {
    var currentYear = data.currentYear || new Date().getFullYear();
    var newYear = prompt('Enter the current year:', currentYear);
    if (newYear !== null && newYear !== '') {
        var yearNum = parseInt(newYear);
        if (!isNaN(yearNum) && yearNum > 0) {
            setCurrentYear(yearNum);
        } else {
            alert('Please enter a valid year (positive number).');
        }
    }
}

// ---- Calculate Age ----
function calculateAge(char) {
    if (!char.birthYear) return null;
    var birthYear = parseInt(char.birthYear);
    if (isNaN(birthYear)) return null;
    
    if (char.deceased && char.deathAge) {
        return parseInt(char.deathAge);
    }
    
    if (char.deceased && char.deathYear) {
        var deathYear = parseInt(char.deathYear);
        if (!isNaN(deathYear)) {
            var age = deathYear - birthYear;
            return age;
        }
        return null;
    }
    
    var currentYear = data.currentYear || new Date().getFullYear();
    var age = currentYear - birthYear;
    return age;
}

function getCharacterAge(char) {
    var age = calculateAge(char);
    return age !== null ? age : '-';
}

// ============================================================
// CHARACTER MANAGEMENT
// ============================================================

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
        var appearance = [char.eyes, char.hair, char.skin].filter(function(n) { return n; }).join(', ');
        
        var age = calculateAge(char);
        var ageDisplay = age !== null ? age + ' yrs' : '-';
        
        var isDead = char.deceased || false;
        var deadClass = isDead ? ' deceased' : '';
        var deadBadge = isDead ? ' <span class="deceased-badge">💀 Deceased</span>' : '';
        
        html += '<div class="list-item' + deadClass + '" data-id="' + char.id + '">' +
            '<span><strong>' + fullName + '</strong>' + deadBadge + '</span>' +
            '<span>' + ageDisplay + '</span>' +
            '<span>' + (char.birthYear || '-') + '</span>' +
            '<span>' + (appearance || '-') + '</span>' +
            '<span class="actions">' +
                '<button class="small edit-character" data-id="' + char.id + '">✎</button>' +
                '<button class="small danger delete-character" data-id="' + char.id + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.edit-character').forEach(function(btn) {
        btn.addEventListener('click', function() { editCharacter(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-character').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteCharacter(btn.dataset.id); });
    });
}

function showCharacterForm(editId) {
    if (editId === undefined) editId = null;
    var form = document.getElementById('character-form');
    var title = document.getElementById('form-title');
    var formElement = document.getElementById('char-form');

    form.classList.remove('hidden');

    var deceasedCheckbox = document.getElementById('char-deceased');
    var deathFields = document.getElementById('death-fields');
    if (deceasedCheckbox) {
        deceasedCheckbox.removeEventListener('change', function() {});
        deceasedCheckbox.addEventListener('change', function() {
            if (deathFields) {
                deathFields.style.display = this.checked ? 'block' : 'none';
            }
        });
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
            
            document.getElementById('char-deceased').checked = char.deceased || false;
            document.getElementById('char-death-year').value = char.deathYear || '';
            document.getElementById('char-death-cause').value = char.deathCause || '';
            document.getElementById('char-death-age').value = char.deathAge || '';
            
            if (deathFields) {
                deathFields.style.display = char.deceased ? 'block' : 'none';
            }
            
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Character';
        formElement.reset();
        delete formElement.dataset.editId;
        if (deathFields) {
            deathFields.style.display = 'none';
        }
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
        deathAge: deathAge
    };

    if (!charData.firstName) {
        alert('First name is required.');
        return;
    }

    if (isDeceased) {
        if (!deathYear && !deathAge) {
            alert('Please enter either Death Year or Death Age for deceased characters.');
            return;
        }
        if (!deathAge && deathYear && charData.birthYear) {
            var birthYear = parseInt(charData.birthYear);
            var dYear = parseInt(deathYear);
            if (!isNaN(birthYear) && !isNaN(dYear)) {
                charData.deathAge = String(dYear - birthYear);
            }
        }
    }

    if (editId) {
        var index = data.characters.findIndex(function(c) { return c.id === editId; });
        if (index !== -1) {
            if (!charData.deathAge && data.characters[index].deathAge) {
                charData.deathAge = data.characters[index].deathAge;
            }
            data.characters[index] = Object.assign({}, data.characters[index], charData);
            logActivity('Updated character: ' + charData.firstName);
        }
    } else {
        var newChar = {
            id: generateId(),
            firstName: charData.firstName,
            middleName: charData.middleName,
            lastName: charData.lastName,
            birthYear: charData.birthYear,
            gender: charData.gender,
            associatedNames: charData.associatedNames,
            eyes: charData.eyes,
            hair: charData.hair,
            skin: charData.skin,
            height: charData.height,
            build: charData.build,
            appearanceNotes: charData.appearanceNotes,
            notes: charData.notes,
            deceased: charData.deceased,
            deathYear: charData.deathYear,
            deathCause: charData.deathCause,
            deathAge: charData.deathAge,
            createdAt: new Date().toISOString()
        };
        data.characters.push(newChar);
        logActivity('Added character: ' + charData.firstName);
    }

    saveData().catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to save character. Please check console for details.');
    });
    
    renderCharacters();
    updateDashboard();
    hideCharacterForm();
}

function editCharacter(id) {
    showCharacterForm(id);
}

function deleteCharacter(id) {
    if (!confirm('Delete this character permanently? This will remove them from all teams.')) return;

    var char = data.characters.find(function(c) { return c.id === id; });
    if (!char) return;

    data.teams.forEach(function(team) {
        if (team.members) {
            team.members = team.members.filter(function(m) { return m.characterId !== id; });
        }
    });

    data.characters = data.characters.filter(function(c) { return c.id !== id; });
    logActivity('Deleted character: ' + char.firstName);
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    renderCharacters();
    updateDashboard();
}

// ============================================================
// TEAM MANAGEMENT
// ============================================================

var currentEditMember = null;

function renderTeams() {
    var container = document.getElementById('teams-container');
    if (!container) return;

    if (data.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams created yet. Add your first team!</p>';
        return;
    }

    var html = '';
    data.teams.forEach(function(team) {
        html += '<div class="list-item" data-id="' + team.id + '">' +
            '<span><strong>' + team.name + '</strong></span>' +
            '<span>' + (team.type || '-') + '</span>' +
            '<span>' + (team.members ? team.members.length : 0) + '</span>' +
            '<span>' + (team.status || 'active') + '</span>' +
            '<span class="actions">' +
                '<button class="small manage-members" data-id="' + team.id + '">👥</button>' +
                '<button class="small edit-team" data-id="' + team.id + '">✎</button>' +
                '<button class="small danger delete-team" data-id="' + team.id + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.manage-members').forEach(function(btn) {
        btn.addEventListener('click', function() { openMemberModal(btn.dataset.id); });
    });
    container.querySelectorAll('.edit-team').forEach(function(btn) {
        btn.addEventListener('click', function() { editTeam(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-team').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteTeam(btn.dataset.id); });
    });
}

function showTeamForm(editId) {
    if (editId === undefined) editId = null;
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
            document.getElementById('team-founded').value = team.foundedYear || '';
            document.getElementById('team-status').value = team.status || 'active';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Team';
        formElement.reset();
        delete formElement.dataset.editId;
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

    var teamData = {
        name: document.getElementById('team-name').value.trim(),
        type: document.getElementById('team-type').value,
        foundedYear: document.getElementById('team-founded').value || '',
        status: document.getElementById('team-status').value || 'active'
    };

    if (!teamData.name) {
        alert('Team name is required.');
        return;
    }
    if (!teamData.type) {
        alert('Team type is required.');
        return;
    }

    if (editId) {
        var index = data.teams.findIndex(function(t) { return t.id === editId; });
        if (index !== -1) {
            data.teams[index] = Object.assign({}, data.teams[index], teamData);
            logActivity('Updated team: ' + teamData.name);
        }
    } else {
        var newTeam = {
            id: generateId(),
            name: teamData.name,
            type: teamData.type,
            foundedYear: teamData.foundedYear,
            status: teamData.status,
            members: [],
            createdAt: new Date().toISOString()
        };
        data.teams.push(newTeam);
        logActivity('Added team: ' + teamData.name);
    }

    saveData().catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to save team. Please check console for details.');
    });
    
    renderTeams();
    updateDashboard();
    hideTeamForm();
}

function editTeam(id) {
    showTeamForm(id);
}

function deleteTeam(id) {
    var team = data.teams.find(function(t) { return t.id === id; });
    if (!team) return;

    if (!confirm('Delete "' + team.name + '" permanently? This will also remove it from tournaments.')) return;

    data.tournaments.forEach(function(t) {
        if (t.teams) {
            t.teams = t.teams.filter(function(entry) { return entry.teamId !== id; });
        }
    });

    data.teams = data.teams.filter(function(t) { return t.id !== id; });
    logActivity('Deleted team: ' + team.name);
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    renderTeams();
    updateDashboard();
    closeMemberModal();
}

// ---- Member Management ----
var currentTeamId = null;

function openMemberModal(teamId) {
    var modal = document.getElementById('member-modal');
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;

    currentTeamId = teamId;
    document.getElementById('modal-team-name').textContent = team.name + ' - Members';

    var select = document.getElementById('member-character');
    select.innerHTML = '<option value="">Select character...</option>';
    data.characters.forEach(function(char) {
        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        select.innerHTML += '<option value="' + char.id + '">' + name + '</option>';
    });

    document.getElementById('member-role').value = '';
    document.getElementById('member-join-year').value = '';
    document.getElementById('member-leave-year').value = '';

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
                '<span class="years">' + (member.joinYear || '?') + (member.leaveYear ? ' → ' + member.leaveYear : '') + '</span>' +
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

function addMember() {
    if (!currentTeamId) return;

    var charId = document.getElementById('member-character').value;
    var role = document.getElementById('member-role').value.trim();
    var joinYear = document.getElementById('member-join-year').value;
    var leaveYear = document.getElementById('member-leave-year').value;

    if (!charId) {
        alert('Please select a character.');
        return;
    }

    var team = data.teams.find(function(t) { return t.id === currentTeamId; });
    if (!team) return;

    if (team.members && team.members.some(function(m) { return m.characterId === charId; })) {
        alert('This character is already in the team.');
        return;
    }

    if (!team.members) team.members = [];

    team.members.push({
        characterId: charId,
        role: role || 'Member',
        joinYear: joinYear || '',
        leaveYear: leaveYear || ''
    });

    var char = data.characters.find(function(c) { return c.id === charId; });
    logActivity('Added ' + (char ? char.firstName : 'character') + ' to team: ' + team.name);
    
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    
    renderMembers(team);
    renderTeams();
    updateDashboard();

    document.getElementById('member-role').value = '';
    document.getElementById('member-join-year').value = '';
    document.getElementById('member-leave-year').value = '';
}

function removeMember(teamId, charId) {
    if (!confirm('Remove this member from the team?')) return;

    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (!team) return;

    team.members = team.members.filter(function(m) { return m.characterId !== charId; });
    var char = data.characters.find(function(c) { return c.id === charId; });
    logActivity('Removed ' + (char ? char.firstName : 'character') + ' from team: ' + team.name);
    
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    
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

    document.getElementById('edit-member-name').textContent = name;
    document.getElementById('edit-member-role').value = member.role || '';
    document.getElementById('edit-member-join-year').value = member.joinYear || '';
    document.getElementById('edit-member-leave-year').value = member.leaveYear || '';

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
    var joinYear = document.getElementById('edit-member-join-year').value;
    var leaveYear = document.getElementById('edit-member-leave-year').value;

    team.members[index].role = role || 'Member';
    team.members[index].joinYear = joinYear || '';
    team.members[index].leaveYear = leaveYear || '';

    var char = data.characters.find(function(c) { return c.id === team.members[index].characterId; });
    logActivity('Updated member ' + (char ? char.firstName : '') + ' in team: ' + team.name);
    
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    
    renderMembers(team);
    renderTeams();
    closeEditMemberModal();
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
            '<span>' + (tourn.startWeek || '?') + ' - ' + (tourn.endWeek || '?') + '</span>' +
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
    if (editId === undefined) editId = null;
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
            document.getElementById('tournament-description').value = tourn.description || '';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Create Tournament';
        formElement.reset();
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
        description: document.getElementById('tournament-description').value.trim(),
        status: 'draft'
    };

    if (!tournData.name) {
        alert('Tournament name is required.');
        return;
    }

    if (editId) {
        var index = data.tournaments.findIndex(function(t) { return t.id === editId; });
        if (index !== -1) {
            data.tournaments[index] = Object.assign({}, data.tournaments[index], tournData);
            logActivity('Updated tournament: ' + tournData.name);
        }
    } else {
        var newTourn = {
            id: generateId(),
            name: tournData.name,
            academicYear: tournData.academicYear,
            startWeek: tournData.startWeek,
            endWeek: tournData.endWeek,
            description: tournData.description,
            status: tournData.status,
            teams: [],
            bracket: [],
            createdAt: new Date().toISOString()
        };
        data.tournaments.push(newTourn);
        logActivity('Created tournament: ' + tournData.name);
    }

    saveData().catch(function(err) {
        console.error('Failed to save:', err);
        alert('Failed to save tournament. Please check console for details.');
    });
    
    renderTournaments();
    updateDashboard();
    hideTournamentForm();
}

function editTournament(id) {
    showTournamentForm(id);
}

function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return;

    var tourn = data.tournaments.find(function(t) { return t.id === id; });
    if (!tourn) return;

    data.tournaments = data.tournaments.filter(function(t) { return t.id !== id; });
    logActivity('Deleted tournament: ' + tourn.name);
    
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    
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
        '<p><strong>Weeks:</strong> ' + (tourn.startWeek || '?') + ' - ' + (tourn.endWeek || '?') + '</p>' +
        '<p><strong>Status:</strong> ' + (tourn.status || 'draft') + '</p>' +
        '<p><strong>Description:</strong> ' + (tourn.description || 'No description') + '</p>';

    var select = document.getElementById('tournament-team-select');
    var academicTeams = data.teams.filter(function(t) { return t.type === 'academic' && t.status !== 'deleted'; });
    select.innerHTML = '<option value="">Select academic team...</option>';
    academicTeams.forEach(function(team) {
        var alreadyAdded = tourn.teams && tourn.teams.some(function(t) { return t.teamId === team.id; });
        if (!alreadyAdded) {
            select.innerHTML += '<option value="' + team.id + '">' + team.name + '</option>';
        }
    });

    renderTournamentTeams(tourn);
    renderBracket(tourn);

    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
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
    if (!teamId) {
        alert('Please select a team.');
        return;
    }

    if (!tourn.teams) tourn.teams = [];

    if (tourn.teams.some(function(t) { return t.teamId === teamId; })) {
        alert('Team already added to this tournament.');
        return;
    }

    tourn.teams.push({
        teamId: teamId,
        seed: tourn.teams.length + 1
    });

    var team = data.teams.find(function(t) { return t.id === teamId; });
    logActivity('Added team ' + (team ? team.name : '') + ' to tournament: ' + tourn.name);
    
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    
    viewTournament(tournId);
}

function removeTeamFromTournament(tournId, teamId) {
    if (!confirm('Remove this team from the tournament?')) return;

    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;

    tourn.teams = tourn.teams.filter(function(t) { return t.teamId !== teamId; });
    var team = data.teams.find(function(t) { return t.id === teamId; });
    logActivity('Removed team ' + (team ? team.name : '') + ' from tournament: ' + tourn.name);
    
    saveData().catch(function(err) {
        console.error('Failed to save:', err);
    });
    
    viewTournament(tournId);
}

function renderBracket(tourn) {
    var container = document.getElementById('bracket-container');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">Add teams to generate bracket</p>';
        return;
    }

    var teams = tourn.teams.map(function(t) {
        var team = data.teams.find(function(tm) { return tm.id === t.teamId; });
        return team ? team.name : 'Unknown';
    });

    var rounds = [];
    var currentTeams = teams.slice();

    while (currentTeams.length > 1) {
        var roundTeams = [];
        for (var i = 0; i < currentTeams.length; i += 2) {
            if (i + 1 < currentTeams.length) {
                roundTeams.push([currentTeams[i], currentTeams[i + 1]]);
            } else {
                roundTeams.push([currentTeams[i], 'BYE']);
            }
        }
        rounds.push(roundTeams);
        currentTeams = roundTeams.map(function(match) {
            return match[0] !== 'BYE' ? match[0] : match[1];
        });
    }

    var html = '';
    rounds.forEach(function(round, index) {
        html += '<div class="bracket-round">' +
            '<div class="round-label">Round ' + (index + 1) + '</div>';
        round.forEach(function(match) {
            html += '<div class="bracket-match">' +
                '<div class="team">' + (match[0] || '?') + '</div>' +
                '<div class="team">' + (match[1] || '?') + '</div>' +
            '</div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

// ============================================================
// CSV EXPORT/IMPORT
// ============================================================

function exportCSV() {
    var lines = [];

    lines.push('# CHARACTERS');
    lines.push('FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes,Deceased,DeathYear,DeathCause,DeathAge');
    data.characters.forEach(function(c) {
        lines.push([
            csvField(c.firstName || ''),
            csvField(c.middleName || ''),
            csvField(c.lastName || ''),
            c.birthYear || '',
            csvField(c.gender || ''),
            csvField(c.associatedNames || ''),
            csvField(c.eyes || ''),
            csvField(c.hair || ''),
            csvField(c.skin || ''),
            csvField(c.height || ''),
            csvField(c.build || ''),
            csvField(c.appearanceNotes || ''),
            csvField(c.notes || ''),
            c.deceased ? 'true' : 'false',
            c.deathYear || '',
            csvField(c.deathCause || ''),
            c.deathAge || ''
        ].join(','));
    });

    lines.push('\n# TEAMS');
    lines.push('TeamName,TeamType,FoundedYear,Status');
    data.teams.forEach(function(t) {
        lines.push(csvField(t.name) + ',' + csvField(t.type) + ',' + (t.foundedYear || '') + ',' + csvField(t.status));
    });

    lines.push('\n# TEAM MEMBERS');
    lines.push('TeamName,CharacterFirstName,CharacterLastName,Role,JoinYear,LeaveYear');
    data.teams.forEach(function(t) {
        if (t.members) {
            t.members.forEach(function(m) {
                var char = data.characters.find(function(c) { return c.id === m.characterId; });
                lines.push(csvField(t.name) + ',' + csvField(char ? char.firstName : '') + ',' + csvField(char ? char.lastName : '') + ',' + csvField(m.role) + ',' + (m.joinYear || '') + ',' + (m.leaveYear || ''));
            });
        }
    });

    lines.push('\n# TOURNAMENTS');
    lines.push('TournamentName,AcademicYear,StartWeek,EndWeek,Status,Description');
    data.tournaments.forEach(function(t) {
        lines.push(csvField(t.name) + ',' + csvField(t.academicYear) + ',' + (t.startWeek || '') + ',' + (t.endWeek || '') + ',' + csvField(t.status) + ',' + csvField(t.description));
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
            var newData = {
                characters: [],
                teams: [],
                tournaments: [],
                activities: [],
                currentYear: data.currentYear || new Date().getFullYear()
            };
            var charMap = {};
            var teamMap = {};
            var tournMap = {};

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;

                if (line.startsWith('# CHARACTERS')) { section = 'characters'; continue; }
                if (line.startsWith('# TEAMS')) { section = 'teams'; continue; }
                if (line.startsWith('# TEAM MEMBERS')) { section = 'members'; continue; }
                if (line.startsWith('# TOURNAMENTS')) { section = 'tournaments'; continue; }
                if (line.startsWith('# TOURNAMENT TEAMS')) { section = 'tournament_teams'; continue; }

                if (line.startsWith('FirstName,') || 
                    line.startsWith('TeamName,') || 
                    line.startsWith('TournamentName,')) continue;

                var values = parseCSVLine(line);

                if (section === 'characters' && values.length >= 17) {
                    var char = {
                        id: generateId(),
                        firstName: values[0] || '',
                        middleName: values[1] || '',
                        lastName: values[2] || '',
                        birthYear: values[3] || '',
                        gender: values[4] || '',
                        associatedNames: values[5] || '',
                        eyes: values[6] || '',
                        hair: values[7] || '',
                        skin: values[8] || '',
                        height: values[9] || '',
                        build: values[10] || '',
                        appearanceNotes: values[11] || '',
                        notes: values[12] || '',
                        deceased: values[13] === 'true',
                        deathYear: values[14] || '',
                        deathCause: values[15] || '',
                        deathAge: values[16] || '',
                        createdAt: new Date().toISOString()
                    };
                    newData.characters.push(char);
                    var key = (char.firstName + '|' + char.lastName).toLowerCase();
                    charMap[key] = char;
                }
                else if (section === 'teams' && values.length >= 4) {
                    var team = {
                        id: generateId(),
                        name: values[0] || '',
                        type: values[1] || '',
                        foundedYear: values[2] || '',
                        status: values[3] || 'active',
                        members: [],
                        createdAt: new Date().toISOString()
                    };
                    newData.teams.push(team);
                    teamMap[team.name.toLowerCase()] = team;
                }
                else if (section === 'members' && values.length >= 6) {
                    var teamName = values[0];
                    var charFirstName = values[1];
                    var charLastName = values[2];
                    var team = teamMap[teamName.toLowerCase()];
                    if (team) {
                        var key = (charFirstName + '|' + charLastName).toLowerCase();
                        var char = charMap[key];
                        if (char) {
                            team.members.push({
                                characterId: char.id,
                                role: values[3] || 'Member',
                                joinYear: values[4] || '',
                                leaveYear: values[5] || ''
                            });
                        }
                    }
                }
                else if (section === 'tournaments' && values.length >= 6) {
                    var tourn = {
                        id: generateId(),
                        name: values[0] || '',
                        academicYear: values[1] || '',
                        startWeek: values[2] || '',
                        endWeek: values[3] || '',
                        status: values[4] || 'draft',
                        description: values[5] || '',
                        teams: [],
                        bracket: [],
                        createdAt: new Date().toISOString()
                    };
                    newData.tournaments.push(tourn);
                    tournMap[tourn.name.toLowerCase()] = tourn;
                }
                else if (section === 'tournament_teams' && values.length >= 3) {
                    var tournName = values[0];
                    var teamName = values[1];
                    var tourn = tournMap[tournName.toLowerCase()];
                    var team = teamMap[teamName.toLowerCase()];
                    if (tourn && team) {
                        tourn.teams.push({
                            teamId: team.id,
                            seed: parseInt(values[2]) || tourn.teams.length + 1
                        });
                    }
                }
            }

            if (newData.characters.length === 0 && newData.teams.length === 0 && newData.tournaments.length === 0) {
                alert('No valid data found in CSV file.');
                return;
            }

            data.characters = newData.characters;
            data.teams = newData.teams;
            data.tournaments = newData.tournaments;
            data.activities = newData.activities;
            data.currentYear = newData.currentYear;
            
            saveData().then(function() {
                logActivity('Imported data from CSV');
                renderAll();
                updateDashboard();
                alert('Imported successfully!\nCharacters: ' + data.characters.length + '\nTeams: ' + data.teams.length + '\nTournaments: ' + data.tournaments.length);
            }).catch(function(err) {
                alert('Failed to save data: ' + err.message);
            });
        } catch (err) {
            alert('Failed to import CSV: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function exportTemplateCSV() {
    var lines = [
        '# CHARACTERS',
        'FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes,Deceased,DeathYear,DeathCause,DeathAge',
        'John,,Doe,1990,Male,,Blue,Brown,Fair,5\'10",Athletic,,Example character,false,,,',
        'Jane,Mary,Smith,1992,Female,The Shadow,Green,Black,Olive,5\'7",Slim,Scar on cheek,,false,,,',
        '',
        '# TEAMS',
        'TeamName,TeamType,FoundedYear,Status',
        'Example Team,academic,2020,active',
        'Another Team,professional,2018,active',
        '',
        '# TEAM MEMBERS',
        'TeamName,CharacterFirstName,CharacterLastName,Role,JoinYear,LeaveYear',
        'Example Team,John,Doe,Captain,2020,',
        'Example Team,Jane,Smith,Member,2021,2023',
        '',
        '# TOURNAMENTS',
        'TournamentName,AcademicYear,StartWeek,EndWeek,Status,Description',
        'Spring Cup,2025-2026,1,12,active,Annual spring tournament',
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

function csvField(value) {
    if (value === null || value === undefined) return '';
    var str = String(value);
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function parseCSVLine(line) {
    var values = [];
    var current = '';
    var inQuotes = false;
    
    for (var i = 0; i < line.length; i++) {
        var char = line[i];
        if (inQuotes) {
            if (char === '"' && line[i+1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    values.push(current.trim());
    return values;
}

// ---- Import/Export Button Setup ----
function initImportExport() {
    document.querySelectorAll('#export-json-btn').forEach(function(btn) {
        btn.addEventListener('click', exportJSON);
    });

    document.querySelectorAll('#import-json-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { document.getElementById('json-file-input').click(); });
    });
    document.querySelectorAll('#json-file-input').forEach(function(input) {
        input.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                importJSON(this.files[0]);
                this.value = '';
            }
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
            if (this.files.length > 0) {
                importCSV(this.files[0]);
                this.value = '';
            }
        });
    });

    document.querySelectorAll('#template-csv-btn').forEach(function(btn) {
        btn.addEventListener('click', exportTemplateCSV);
    });

    // Year setter buttons
    document.querySelectorAll('#set-year-btn').forEach(function(btn) {
        btn.addEventListener('click', showYearModal);
    });

    // Year display click
    document.querySelectorAll('#current-year-display').forEach(function(el) {
        el.addEventListener('click', showYearModal);
    });
}

// ---- Export JSON ----
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
                alert('Invalid data format. Missing required fields.');
                return;
            }

            if (!confirm('This will replace all current data. Continue?')) return;

            data.characters = imported.characters || [];
            data.teams = imported.teams || [];
            data.tournaments = imported.tournaments || [];
            data.activities = imported.activities || [];
            data.currentYear = imported.currentYear || new Date().getFullYear();
            
            saveData().then(function() {
                logActivity('Imported data from JSON');
                renderAll();
                updateDashboard();
                alert('Data imported successfully!');
            }).catch(function(err) {
                alert('Failed to save data: ' + err.message);
            });
        } catch (err) {
            alert('Failed to import JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', function() {
    openDatabase().then(function() {
        return loadData();
    }).then(function() {
        initImportExport();

        var path = window.location.pathname;
        var page = path.split('/').pop() || 'index.html';

        if (page === 'index.html' || page === '') {
            updateDashboard();
        } else if (page === 'characters.html') {
            renderCharacters();

            document.getElementById('add-character-btn').addEventListener('click', function() { showCharacterForm(); });
            document.getElementById('cancel-char-btn').addEventListener('click', hideCharacterForm);
            document.getElementById('char-form').addEventListener('submit', saveCharacter);

            // Year setter on character page
            var setYearBtn = document.querySelector('#set-year-btn');
            if (setYearBtn) {
                setYearBtn.addEventListener('click', showYearModal);
            }

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
        }
    }).catch(function(err) {
        console.error('Failed to initialize database:', err);
        alert('Failed to open database. Please check console for details.');
    });
});

// Save on page unload
window.addEventListener('beforeunload', function() {
    saveData().catch(function(err) {
        console.warn('Failed to save on unload:', err);
    });
});

// Expose functions globally
window.showYearModal = showYearModal;
window.setCurrentYear = setCurrentYear;
window.calculateAge = calculateAge;
