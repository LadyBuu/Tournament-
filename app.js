// ============================================================
// app.js - Tournament Manager Application Logic
// ============================================================

// ---- Data Store ----
let data = {
    characters: [],
    teams: [],
    tournaments: [],
    activities: []
};

// Load from localStorage
function loadData() {
    try {
        const stored = localStorage.getItem('tournament-manager-data');
        if (stored) {
            data = JSON.parse(stored);
            return true;
        }
    } catch (e) {
        console.warn('Failed to load data:', e);
    }
    return false;
}

// Save to localStorage
function saveData() {
    try {
        localStorage.setItem('tournament-manager-data', JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save data:', e);
    }
}

// ---- ID Generator ----
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ---- Activity Logger ----
function logActivity(message, type = 'info') {
    data.activities.unshift({
        id: generateId(),
        message: message,
        type: type,
        timestamp: new Date().toISOString()
    });
    if (data.activities.length > 100) data.activities.pop();
    saveData();
    updateActivityLog();
}

// ---- Update Dashboard ----
function updateDashboard() {
    const charCount = document.getElementById('char-count');
    const teamCount = document.getElementById('team-count');
    const tournCount = document.getElementById('tournament-count');

    if (charCount) charCount.textContent = data.characters.length;
    if (teamCount) teamCount.textContent = data.teams.length;
    if (tournCount) tournCount.textContent = data.tournaments.length;

    updateActivityLog();
}

function updateActivityLog() {
    const log = document.getElementById('activity-log');
    if (!log) return;

    if (data.activities.length === 0) {
        log.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }

    log.innerHTML = data.activities.slice(0, 10).map(a =>
        `<div class="activity-item">${a.message}</div>`
    ).join('');
}

// ---- Character Management ----
function renderCharacters() {
    const container = document.getElementById('characters-container');
    if (!container) return;

    if (data.characters.length === 0) {
        container.innerHTML = '<p class="empty-state">No characters created yet. Add your first character!</p>';
        return;
    }

    container.innerHTML = data.characters.map(char => `
        <div class="list-item" data-id="${char.id}">
            <span><strong>${char.firstName} ${char.lastName || ''}</strong></span>
            <span>${char.birthYear || '-'}</span>
            <span>${char.appearance || '-'}</span>
            <span>${getCharacterTeamCount(char.id)}</span>
            <span class="actions">
                <button class="small edit-character" data-id="${char.id}">✎</button>
                <button class="small danger delete-character" data-id="${char.id}">✕</button>
            </span>
        </div>
    `).join('');

    // Attach event listeners
    container.querySelectorAll('.edit-character').forEach(btn => {
        btn.addEventListener('click', () => editCharacter(btn.dataset.id));
    });
    container.querySelectorAll('.delete-character').forEach(btn => {
        btn.addEventListener('click', () => deleteCharacter(btn.dataset.id));
    });
}

function getCharacterTeamCount(charId) {
    let count = 0;
    data.teams.forEach(team => {
        if (team.members && team.members.some(m => m.characterId === charId)) {
            count++;
        }
    });
    return count || '-';
}

function showCharacterForm(editId = null) {
    const form = document.getElementById('character-form');
    const title = document.getElementById('form-title');
    const formElement = document.getElementById('char-form');

    form.classList.remove('hidden');

    if (editId) {
        title.textContent = 'Edit Character';
        const char = data.characters.find(c => c.id === editId);
        if (char) {
            document.getElementById('char-firstname').value = char.firstName || '';
            document.getElementById('char-lastname').value = char.lastName || '';
            document.getElementById('char-birthyear').value = char.birthYear || '';
            document.getElementById('char-appearance').value = char.appearance || '';
            document.getElementById('char-gender').value = char.gender || '';
            document.getElementById('char-notes').value = char.notes || '';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Character';
        formElement.reset();
        delete formElement.dataset.editId;
    }

    document.getElementById('char-form').scrollIntoView({ behavior: 'smooth' });
}

function hideCharacterForm() {
    document.getElementById('character-form').classList.add('hidden');
}

function saveCharacter(e) {
    e.preventDefault();
    const form = e.target;
    const editId = form.dataset.editId;

    const charData = {
        firstName: document.getElementById('char-firstname').value.trim(),
        lastName: document.getElementById('char-lastname').value.trim(),
        birthYear: document.getElementById('char-birthyear').value || '',
        appearance: document.getElementById('char-appearance').value || '',
        gender: document.getElementById('char-gender').value.trim(),
        notes: document.getElementById('char-notes').value.trim()
    };

    if (!charData.firstName) {
        alert('First name is required.');
        return;
    }

    if (editId) {
        // Edit existing
        const index = data.characters.findIndex(c => c.id === editId);
        if (index !== -1) {
            data.characters[index] = { ...data.characters[index], ...charData };
            logActivity(`Updated character: ${charData.firstName}`);
        }
    } else {
        // Add new
        const newChar = {
            id: generateId(),
            ...charData,
            createdAt: new Date().toISOString()
        };
        data.characters.push(newChar);
        logActivity(`Added character: ${charData.firstName}`);
    }

    saveData();
    renderCharacters();
    updateDashboard();
    hideCharacterForm();
}

function editCharacter(id) {
    showCharacterForm(id);
}

function deleteCharacter(id) {
    if (!confirm('Delete this character permanently? This will remove them from all teams.')) return;

    const char = data.characters.find(c => c.id === id);
    if (!char) return;

    // Remove from teams
    data.teams.forEach(team => {
        if (team.members) {
            team.members = team.members.filter(m => m.characterId !== id);
        }
    });

    data.characters = data.characters.filter(c => c.id !== id);
    logActivity(`Deleted character: ${char.firstName}`);
    saveData();
    renderCharacters();
    updateDashboard();
}

// ---- Team Management ----
function renderTeams() {
    const container = document.getElementById('teams-container');
    if (!container) return;

    if (data.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams created yet. Add your first team!</p>';
        return;
    }

    container.innerHTML = data.teams.map(team => `
        <div class="list-item" data-id="${team.id}">
            <span><strong>${team.name}</strong></span>
            <span>${team.type || '-'}</span>
            <span>${team.members ? team.members.length : 0}</span>
            <span>${team.status || 'active'}</span>
            <span class="actions">
                <button class="small manage-members" data-id="${team.id}">👥</button>
                <button class="small edit-team" data-id="${team.id}">✎</button>
                <button class="small danger delete-team" data-id="${team.id}">✕</button>
            </span>
        </div>
    `).join('');

    // Attach event listeners
    container.querySelectorAll('.manage-members').forEach(btn => {
        btn.addEventListener('click', () => openMemberModal(btn.dataset.id));
    });
    container.querySelectorAll('.edit-team').forEach(btn => {
        btn.addEventListener('click', () => editTeam(btn.dataset.id));
    });
    container.querySelectorAll('.delete-team').forEach(btn => {
        btn.addEventListener('click', () => deleteTeam(btn.dataset.id));
    });
}

function showTeamForm(editId = null) {
    const form = document.getElementById('team-form');
    const title = document.getElementById('team-form-title');
    const formElement = document.getElementById('team-form-inner');

    form.classList.remove('hidden');

    if (editId) {
        title.textContent = 'Edit Team';
        const team = data.teams.find(t => t.id === editId);
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
    const form = e.target;
    const editId = form.dataset.editId;

    const teamData = {
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
        const index = data.teams.findIndex(t => t.id === editId);
        if (index !== -1) {
            data.teams[index] = { ...data.teams[index], ...teamData };
            logActivity(`Updated team: ${teamData.name}`);
        }
    } else {
        const newTeam = {
            id: generateId(),
            ...teamData,
            members: [],
            createdAt: new Date().toISOString()
        };
        data.teams.push(newTeam);
        logActivity(`Added team: ${teamData.name}`);
    }

    saveData();
    renderTeams();
    updateDashboard();
    hideTeamForm();
}

function editTeam(id) {
    showTeamForm(id);
}

function deleteTeam(id) {
    const team = data.teams.find(t => t.id === id);
    if (!team) return;

    const action = confirm(
        `Delete "${team.name}"?\n\n` +
        '• "Delete" - permanently remove (cannot undo)\n' +
        '• "Cancel" - keep the team'
    );

    if (!action) return;

    data.teams = data.teams.filter(t => t.id !== id);
    logActivity(`Deleted team: ${team.name}`);
    saveData();
    renderTeams();
    updateDashboard();
    closeMemberModal();
}

// ---- Member Management Modal ----
let currentTeamId = null;

function openMemberModal(teamId) {
    const modal = document.getElementById('member-modal');
    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;

    currentTeamId = teamId;
    document.getElementById('modal-team-name').textContent = `${team.name} - Members`;

    // Populate character dropdown
    const select = document.getElementById('member-character');
    select.innerHTML = '<option value="">Select character...</option>';
    data.characters.forEach(char => {
        select.innerHTML += `<option value="${char.id}">${char.firstName} ${char.lastName || ''}</option>`;
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
    const container = document.getElementById('members-list');
    if (!team.members || team.members.length === 0) {
        container.innerHTML = '<p class="empty-state">No members in this team</p>';
        return;
    }

    container.innerHTML = team.members.map(member => {
        const char = data.characters.find(c => c.id === member.characterId);
        const name = char ? `${char.firstName} ${char.lastName || ''}` : 'Unknown';
        return `
            <div class="member-entry">
                <div class="member-info">
                    <span><strong>${name}</strong></span>
                    <span class="role">${member.role || 'Member'}</span>
                    <span class="years">${member.joinYear || '?'} ${member.leaveYear ? '→ ' + member.leaveYear : ''}</span>
                </div>
                <button class="small danger remove-member" data-team="${team.id}" data-char="${member.characterId}">✕</button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.remove-member').forEach(btn => {
        btn.addEventListener('click', () => removeMember(btn.dataset.team, btn.dataset.char));
    });
}

function addMember() {
    if (!currentTeamId) return;

    const charId = document.getElementById('member-character').value;
    const role = document.getElementById('member-role').value.trim();
    const joinYear = document.getElementById('member-join-year').value;
    const leaveYear = document.getElementById('member-leave-year').value;

    if (!charId) {
        alert('Please select a character.');
        return;
    }

    const team = data.teams.find(t => t.id === currentTeamId);
    if (!team) return;

    // Check if character already in team
    if (team.members && team.members.some(m => m.characterId === charId)) {
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

    const char = data.characters.find(c => c.id === charId);
    logActivity(`Added ${char ? char.firstName : 'character'} to team: ${team.name}`);
    saveData();
    renderMembers(team);
    renderTeams();
    updateDashboard();

    // Reset form
    document.getElementById('member-role').value = '';
    document.getElementById('member-join-year').value = '';
    document.getElementById('member-leave-year').value = '';
}

function removeMember(teamId, charId) {
    if (!confirm('Remove this member from the team?')) return;

    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;

    team.members = team.members.filter(m => m.characterId !== charId);
    const char = data.characters.find(c => c.id === charId);
    logActivity(`Removed ${char ? char.firstName : 'character'} from team: ${team.name}`);
    saveData();
    renderMembers(team);
    renderTeams();
    updateDashboard();
}

// ---- Tournament Management ----
function renderTournaments() {
    const container = document.getElementById('tournaments-container');
    if (!container) return;

    if (data.tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet. Create your first tournament!</p>';
        return;
    }

    container.innerHTML = data.tournaments.map(tourn => {
        const academicTeams = data.teams.filter(t => t.type === 'academic' && t.status !== 'deleted');
        const teamCount = tourn.teams ? tourn.teams.length : 0;

        return `
            <div class="list-item" data-id="${tourn.id}">
                <span><strong>${tourn.name}</strong></span>
                <span>${tourn.academicYear || '-'}</span>
                <span>${tourn.startWeek || '?'} - ${tourn.endWeek || '?'}</span>
                <span>${teamCount}</span>
                <span>${tourn.status || 'draft'}</span>
                <span class="actions">
                    <button class="small view-tournament" data-id="${tourn.id}">📋</button>
                    <button class="small edit-tournament" data-id="${tourn.id}">✎</button>
                    <button class="small danger delete-tournament" data-id="${tourn.id}">✕</button>
                </span>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.view-tournament').forEach(btn => {
        btn.addEventListener('click', () => viewTournament(btn.dataset.id));
    });
    container.querySelectorAll('.edit-tournament').forEach(btn => {
        btn.addEventListener('click', () => editTournament(btn.dataset.id));
    });
    container.querySelectorAll('.delete-tournament').forEach(btn => {
        btn.addEventListener('click', () => deleteTournament(btn.dataset.id));
    });
}

function showTournamentForm(editId = null) {
    const form = document.getElementById('tournament-form');
    const title = document.getElementById('tournament-form-title');
    const formElement = document.getElementById('tournament-form-inner');

    form.classList.remove('hidden');

    if (editId) {
        title.textContent = 'Edit Tournament';
        const tourn = data.tournaments.find(t => t.id === editId);
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
    const form = e.target;
    const editId = form.dataset.editId;

    const tournData = {
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
        const index = data.tournaments.findIndex(t => t.id === editId);
        if (index !== -1) {
            data.tournaments[index] = { ...data.tournaments[index], ...tournData };
            logActivity(`Updated tournament: ${tournData.name}`);
        }
    } else {
        const newTourn = {
            id: generateId(),
            ...tournData,
            teams: [],
            bracket: [],
            createdAt: new Date().toISOString()
        };
        data.tournaments.push(newTourn);
        logActivity(`Created tournament: ${tournData.name}`);
    }

    saveData();
    renderTournaments();
    updateDashboard();
    hideTournamentForm();
}

function editTournament(id) {
    showTournamentForm(id);
}

function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return;

    const tourn = data.tournaments.find(t => t.id === id);
    if (!tourn) return;

    data.tournaments = data.tournaments.filter(t => t.id !== id);
    logActivity(`Deleted tournament: ${tourn.name}`);
    saveData();
    renderTournaments();
    updateDashboard();
    closeTournamentDetail();
}

// ---- Tournament Detail View ----
function viewTournament(id) {
    const tourn = data.tournaments.find(t => t.id === id);
    if (!tourn) return;

    const modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;

    // Info
    const info = document.getElementById('tournament-info');
    info.innerHTML = `
        <p><strong>Academic Year:</strong> ${tourn.academicYear || 'N/A'}</p>
        <p><strong>Weeks:</strong> ${tourn.startWeek || '?'} - ${tourn.endWeek || '?'}</p>
        <p><strong>Status:</strong> ${tourn.status || 'draft'}</p>
        <p><strong>Description:</strong> ${tourn.description || 'No description'}</p>
    `;

    // Populate team selector with academic teams
    const select = document.getElementById('tournament-team-select');
    const academicTeams = data.teams.filter(t => t.type === 'academic' && t.status !== 'deleted');
    select.innerHTML = '<option value="">Select academic team...</option>';
    academicTeams.forEach(team => {
        // Check if already added
        const alreadyAdded = tourn.teams && tourn.teams.some(t => t.teamId === team.id);
        if (!alreadyAdded) {
            select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
        }
    });

    // Render teams in tournament
    renderTournamentTeams(tourn);

    // Render bracket
    renderBracket(tourn);

    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
}

function renderTournamentTeams(tourn) {
    const container = document.getElementById('tournament-teams-list');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams added to this tournament</p>';
        return;
    }

    container.innerHTML = tourn.teams.map(entry => {
        const team = data.teams.find(t => t.id === entry.teamId);
        return `
            <div class="team-entry">
                <span>${team ? team.name : 'Unknown team'}</span>
                <span>${entry.seed || 'Unseeded'}</span>
                <button class="small danger remove-team-from-tournament" data-tourn="${tourn.id}" data-team="${entry.teamId}">✕</button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.remove-team-from-tournament').forEach(btn => {
        btn.addEventListener('click', () => removeTeamFromTournament(btn.dataset.tourn, btn.dataset.team));
    });
}

function addTeamToTournament() {
    const modal = document.getElementById('tournament-detail-modal');
    const tournId = modal.dataset.tournamentId;
    const tourn = data.tournaments.find(t => t.id === tournId);
    if (!tourn) return;

    const teamId = document.getElementById('tournament-team-select').value;
    if (!teamId) {
        alert('Please select a team.');
        return;
    }

    if (!tourn.teams) tourn.teams = [];

    // Check if already added
    if (tourn.teams.some(t => t.teamId === teamId)) {
        alert('Team already added to this tournament.');
        return;
    }

    tourn.teams.push({
        teamId: teamId,
        seed: tourn.teams.length + 1
    });

    const team = data.teams.find(t => t.id === teamId);
    logActivity(`Added team ${team ? team.name : ''} to tournament: ${tourn.name}`);
    saveData();
    viewTournament(tournId);
}

function removeTeamFromTournament(tournId, teamId) {
    if (!confirm('Remove this team from the tournament?')) return;

    const tourn = data.tournaments.find(t => t.id === tournId);
    if (!tourn) return;

    tourn.teams = tourn.teams.filter(t => t.teamId !== teamId);
    const team = data.teams.find(t => t.id === teamId);
    logActivity(`Removed team ${team ? team.name : ''} from tournament: ${tourn.name}`);
    saveData();
    viewTournament(tournId);
}

function renderBracket(tourn) {
    const container = document.getElementById('bracket-container');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">Add teams to generate bracket</p>';
        return;
    }

    // Simple bracket generation
    const teams = tourn.teams.map(t => {
        const team = data.teams.find(tm => tm.id === t.teamId);
        return team ? team.name : 'Unknown';
    });

    // Generate rounds
    const rounds = [];
    let currentTeams = [...teams];

    while (currentTeams.length > 1) {
        const roundTeams = [];
        for (let i = 0; i < currentTeams.length; i += 2) {
            if (i + 1 < currentTeams.length) {
                roundTeams.push([currentTeams[i], currentTeams[i + 1]]);
            } else {
                roundTeams.push([currentTeams[i], 'BYE']);
            }
        }
        rounds.push(roundTeams);
        currentTeams = roundTeams.map(match => {
            // Simulate winner (just first team for demo)
            return match[0] !== 'BYE' ? match[0] : match[1];
        });
    }

    // Render rounds
    container.innerHTML = rounds.map((round, index) => `
        <div class="bracket-round">
            <div class="round-label">Round ${index + 1}</div>
            ${round.map(match => `
                <div class="bracket-match">
                    <div class="team">${match[0] || '?'}</div>
                    <div class="team">${match[1] || '?'}</div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', function() {
    // Load data
    loadData();

    // Determine page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    // Initialize based on page
    if (page === 'index.html' || page === '') {
        updateDashboard();
    } else if (page === 'characters.html') {
        renderCharacters();

        // Character form events
        document.getElementById('add-character-btn').addEventListener('click', () => showCharacterForm());
        document.getElementById('cancel-char-btn').addEventListener('click', hideCharacterForm);
        document.getElementById('char-form').addEventListener('submit', saveCharacter);

    } else if (page === 'teams.html') {
        renderTeams();

        // Team form events
        document.getElementById('add-team-btn').addEventListener('click', () => showTeamForm());
        document.getElementById('cancel-team-btn').addEventListener('click', hideTeamForm);
        document.getElementById('team-form-inner').addEventListener('submit', saveTeam);

        // Member modal events
        document.querySelector('#member-modal .close-modal').addEventListener('click', closeMemberModal);
        document.getElementById('member-modal').addEventListener('click', function(e) {
            if (e.target === this) closeMemberModal();
        });
        document.getElementById('add-member-btn').addEventListener('click', addMember);

    } else if (page === 'tournaments.html') {
        renderTournaments();

        // Tournament form events
        document.getElementById('add-tournament-btn').addEventListener('click', () => showTournamentForm());
        document.getElementById('cancel-tournament-btn').addEventListener('click', hideTournamentForm);
        document.getElementById('tournament-form-inner').addEventListener('submit', saveTournament);

        // Tournament detail modal events
        document.querySelector('#tournament-detail-modal .close-modal').addEventListener('click', closeTournamentDetail);
        document.getElementById('tournament-detail-modal').addEventListener('click', function(e) {
            if (e.target === this) closeTournamentDetail();
        });
        document.getElementById('add-team-to-tournament').addEventListener('click', addTeamToTournament);
    }

    // Save data periodically
    setInterval(saveData, 30000);
});
