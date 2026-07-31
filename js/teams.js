// ============================================================
// teams.js - Team Management
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
                team.nameHistory.forEach(function(entry) { 
                    addNameHistoryEntry(container, entry.name, entry.startPeriod, entry.endPeriod); 
                });
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
            nameHistory.push({ 
                name: nameInput.value.trim(), 
                startPeriod: startInput.value || '', 
                endPeriod: endInput.value || '' 
            });
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
        var newTeam = { 
            id: generateId(), 
            name: teamData.name, 
            type: teamData.type, 
            startPeriod: teamData.startPeriod,
            endPeriod: teamData.endPeriod, 
            currentRank: teamData.currentRank, 
            status: teamData.status,
            nameHistory: teamData.nameHistory, 
            members: [], 
            rankingHistory: [], 
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
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTeams();
    updateDashboard();
    closeMemberModal();
}

function renderTeams() {
    var container = document.getElementById('teams-container');
    if (!container) return;

    var filterWeek = parseInt(document.getElementById('team-filter-week')?.value) || currentFilterWeek || 1;
    currentFilterWeek = filterWeek;

    var filteredTeams = data.teams.filter(function(team) {
        if (team.status === 'deleted') return false;
        var start = parseInt(team.startPeriod);
        var end = parseInt(team.endPeriod);
        if (isNaN(start)) return true;
        return start <= filterWeek && (isNaN(end) || end >= filterWeek);
    });

    filteredTeams.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    if (filteredTeams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams active in Week ' + filterWeek + '. <br><span style="font-size:0.8rem;color:var(--text-dim);">Try adjusting the filter week above.</span></p>';
        return;
    }

    var html = '';
    filteredTeams.forEach(function(team) {
        var isEliminated = false;
        data.tournaments.forEach(function(tourn) {
            if (tourn.eliminations) {
                tourn.eliminations.forEach(function(elim) {
                    if (elim.participantId === team.id && elim.participantType === 'team') {
                        var elimWeek = parseInt(elim.week);
                        if (!isNaN(elimWeek) && elimWeek <= filterWeek) {
                            isEliminated = true;
                        }
                    }
                });
            }
        });

        var periodDisplay = '';
        if (team.type === 'academic') {
            var startBlock = getRankingBlock(team.startPeriod);
            var endBlock = getRankingBlock(team.endPeriod);
            if (startBlock && endBlock) periodDisplay = 'Wk ' + startBlock.label + ' - Wk ' + endBlock.label;
            else if (startBlock) periodDisplay = 'Wk ' + startBlock.label + '+';
            else periodDisplay = '-';
        } else {
            periodDisplay = team.startPeriod ? team.startPeriod + (team.endPeriod ? ' - ' + team.endPeriod : '') : '-';
        }

        var isExpanded = expandedTeamId === team.id;
        var memberCount = team.members ? team.members.filter(function(m) {
            var join = parseInt(m.joinPeriod);
            var leave = parseInt(m.leavePeriod);
            return !isNaN(join) && join <= filterWeek && (isNaN(leave) || leave >= filterWeek);
        }).length : 0;

        html += '<div class="list-item team-item" data-id="' + team.id + '">' +
            '<span><strong>' + team.name + '</strong>' + (isEliminated ? ' <span class="eliminated-badge">💀 Eliminated</span>' : '') + '</span>' +
            '<span>' + (team.type || '-') + '</span>' +
            '<span>' + periodDisplay + '</span>' +
            '<span>' + (team.currentRank || '-') + '</span>' +
            '<span>' + memberCount + '</span>' +
            '<span class="actions">' +
                '<button class="small toggle-members" data-id="' + team.id + '">' + (isExpanded ? '▼' : '▶') + '</button>' +
                '<button class="small manage-members" data-id="' + team.id + '">👥</button>' +
                '<button class="small manage-rankings" data-id="' + team.id + '">🏆</button>' +
                '<button class="small edit-team" data-id="' + team.id + '">✎</button>' +
                '<button class="small danger delete-team" data-id="' + team.id + '">✕</button>' +
            '</span>' +
        '</div>';

        if (isExpanded) {
            html += '<div class="team-members-expanded" data-team-id="' + team.id + '">';
            var activeMembers = team.members ? team.members.filter(function(m) {
                var join = parseInt(m.joinPeriod);
                var leave = parseInt(m.leavePeriod);
                return !isNaN(join) && join <= filterWeek && (isNaN(leave) || leave >= filterWeek);
            }) : [];
            
            if (activeMembers.length === 0) {
                html += '<div class="member-entry empty">No active members this week</div>';
            } else {
                activeMembers.forEach(function(member) {
                    var char = data.characters.find(function(c) { return c.id === member.characterId; });
                    var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                    var age = char ? getCharacterAge(char) : '-';
                    var deadMarker = char && char.deceased ? ' 💀' : '';
                    html += '<div class="member-entry">' +
                        '<span>' + name + deadMarker + ' <span class="role">(' + (member.role || 'Member') + ')</span></span>' +
                        '<span style="color:var(--text-dim);font-size:0.75rem;">Age: ' + age + ' | Joined: ' + (member.joinPeriod || '?') + (member.leavePeriod ? ' → ' + member.leavePeriod : '') + '</span>' +
                    '</div>';
                });
            }
            html += '</div>';
        }
    });
    container.innerHTML = html;

    container.querySelectorAll('.toggle-members').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = btn.dataset.id;
            if (expandedTeamId === id) expandedTeamId = null;
            else expandedTeamId = id;
            renderTeams();
        });
    });

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

function initTeamEvents() {
    document.getElementById('add-team-btn').addEventListener('click', function() { 
        showTeamForm(); 
    });
    document.getElementById('cancel-team-btn').addEventListener('click', hideTeamForm);
    document.getElementById('team-form-inner').addEventListener('submit', saveTeam);
    
    document.getElementById('apply-filter-btn').addEventListener('click', function() {
        var week = parseInt(document.getElementById('team-filter-week').value);
        if (!isNaN(week) && week > 0 && week <= 52) {
            currentFilterWeek = week;
            renderTeams();
        } else {
            alert('Please enter a valid week (1-52).');
        }
    });
    
    document.getElementById('team-filter-week').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('apply-filter-btn').click();
        }
    });

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
}
