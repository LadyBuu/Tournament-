// ============================================================
// tournaments.js - Tournament Management
// ============================================================

// ---- Tournament List ----
function renderTournaments() {
    var container = document.getElementById('tournaments-container');
    if (!container) return;
    if (data.tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet. Create your first tournament!</p>';
        return;
    }
    var html = '';
    data.tournaments.forEach(function(tourn) {
        var participantCount = tourn.mode === 'single' ? (tourn.participants ? tourn.participants.length : 0) : (tourn.teams ? tourn.teams.length : 0);
        html += '<div class="list-item" data-id="' + tourn.id + '">' +
            '<span><strong>' + tourn.name + '</strong></span>' +
            '<span>' + (tourn.mode || 'team') + '</span>' +
            '<span>Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?') + '</span>' +
            '<span>' + participantCount + '</span>' +
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
            document.getElementById('tournament-mode').value = tourn.mode || 'team';
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            document.getElementById('tournament-start-week').value = tourn.startWeek || '';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '';
            document.getElementById('tournament-eliminations').value = tourn.eliminationsPerRound || 4;
            document.getElementById('tournament-description').value = tourn.description || '';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Create Tournament';
        formElement.reset();
        document.getElementById('tournament-mode').value = 'team';
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
        mode: document.getElementById('tournament-mode').value,
        academicYear: document.getElementById('tournament-year').value.trim(),
        startWeek: document.getElementById('tournament-start-week').value || '',
        endWeek: document.getElementById('tournament-end-week').value || '',
        eliminationsPerRound: parseInt(document.getElementById('tournament-eliminations').value) || 4,
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
        var newTourn = { 
            id: generateId(), 
            name: tournData.name, 
            mode: tournData.mode,
            academicYear: tournData.academicYear, 
            startWeek: tournData.startWeek, 
            endWeek: tournData.endWeek,
            eliminationsPerRound: tournData.eliminationsPerRound, 
            description: tournData.description,
            status: tournData.status, 
            teams: [], 
            participants: [], 
            matches: [], 
            eliminations: [], 
            winners: [], 
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
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderTournaments();
    updateDashboard();
    closeTournamentDetail();
}

// ---- Tournament Detail View ----
function viewTournament(id) {
    var tourn = data.tournaments.find(function(t) { return t.id === id; });
    if (!tourn) return;
    var modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;
    
    var info = document.getElementById('tournament-info');
    info.innerHTML = 
        '<p><strong>Mode:</strong> ' + (tourn.mode || 'team') + '</p>' +
        '<p><strong>Academic Year:</strong> ' + (tourn.academicYear || 'N/A') + '</p>' +
        '<p><strong>Weeks:</strong> Wk ' + (tourn.startWeek || '?') + ' - Wk ' + (tourn.endWeek || '?') + '</p>' +
        '<p><strong>Eliminations per Round:</strong> ' + (tourn.eliminationsPerRound || 4) + '</p>' +
        '<p><strong>Status:</strong> ' + (tourn.status || 'draft') + '</p>' +
        '<p><strong>Description:</strong> ' + (tourn.description || 'No description') + '</p>';

    populateParticipantSelects(tourn);
    populateEliminationSelect(tourn);
    populateTeamSelector(tourn);
    
    renderParticipants(tourn);
    renderTournamentTeams(tourn);
    renderMatches(tourn);
    renderEliminations(tourn);
    renderBracket(tourn);
    
    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
}

// ---- Participants Management ----
function renderParticipants(tourn) {
    var container = document.getElementById('participants-list');
    if (!tourn.participants || tourn.participants.length === 0) {
        container.innerHTML = '<p class="empty-state">No participants added</p>';
        return;
    }
    var html = '';
    tourn.participants.forEach(function(participant, index) {
        var name = getParticipantName(participant, tourn);
        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) { 
            return e.participantId === participant.id && e.participantType === participant.type; 
        });
        var elimMarker = isEliminated ? ' 💀' : '';
        html += '<div class="participant-entry">' +
            '<span>' + name + elimMarker + '</span>' +
            '<button class="small danger remove-participant" data-tourn="' + tourn.id + '" data-index="' + index + '">✕</button>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.remove-participant').forEach(function(btn) {
        btn.addEventListener('click', function() { removeParticipant(btn.dataset.tourn, parseInt(btn.dataset.index)); });
    });
}

function addParticipant() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    
    var value = document.getElementById('participant-select').value;
    if (!value) { alert('Please select a participant.'); return; }
    
    var parts = value.split('_');
    var type = parts[0];
    var id = parts[1];
    
    if (!tourn.participants) tourn.participants = [];
    
    if (tourn.participants.some(function(p) { return p.id === id && p.type === type; })) {
        alert('Participant already added.'); 
        return;
    }
    
    tourn.participants.push({ type: type, id: id });
    
    if (tourn.mode === 'team' && type === 'team') {
        if (!tourn.teams) tourn.teams = [];
        if (!tourn.teams.some(function(t) { return t.teamId === id; })) {
            tourn.teams.push({ teamId: id, seed: tourn.teams.length + 1 });
        }
    }
    
    logActivity('Added participant to tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function removeParticipant(tournId, index) {
    if (!confirm('Remove this participant?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.participants) return;
    
    var removed = tourn.participants[index];
    tourn.participants.splice(index, 1);
    
    if (tourn.mode === 'team' && removed.type === 'team') {
        if (tourn.teams) {
            tourn.teams = tourn.teams.filter(function(t) { return t.teamId !== removed.id; });
        }
    }
    
    if (tourn.eliminations) {
        tourn.eliminations = tourn.eliminations.filter(function(e) {
            return !(e.participantId === removed.id && e.participantType === removed.type);
        });
    }
    
    logActivity('Removed participant from tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

// ---- Team Management in Tournament ----
function populateTeamSelector(tourn) {
    var select = document.getElementById('tournament-team-select');
    if (!select) return;
    
    var currentWeek = parseInt(tourn.startWeek) || currentCalendarWeek || 1;
    var activeTeams = getActiveTeamsForWeek(currentWeek, tourn.id);
    
    select.innerHTML = '<option value="">Select academic team...</option>';
    activeTeams.forEach(function(team) {
        var alreadyAdded = tourn.teams && tourn.teams.some(function(t) { return t.teamId === team.id; });
        if (!alreadyAdded) {
            var option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name + (team.currentRank ? ' (#' + team.currentRank + ')' : '');
            select.appendChild(option);
        }
    });
    
    if (select.options.length === 1) {
        select.innerHTML += '<option value="" disabled>No available teams</option>';
    }
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
        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
            return e.participantId === entry.teamId && e.participantType === 'team';
        });
        var elimClass = isEliminated ? ' eliminated' : '';
        var elimMarker = isEliminated ? ' 💀' : '';
        
        html += '<div class="team-entry' + elimClass + '">' +
            '<span>' + (team ? team.name : 'Unknown team') + elimMarker + '</span>' +
            '<span>' + (entry.seed || 'Unseeded') + '</span>' +
            '<span class="team-actions">' +
                '<button class="small danger eliminate-team" data-tourn="' + tourn.id + '" data-team="' + entry.teamId + '">Eliminate</button>' +
                '<button class="small restore-team" data-tourn="' + tourn.id + '" data-team="' + entry.teamId + '" style="display:' + (isEliminated ? 'inline-block' : 'none') + ';">Restore</button>' +
                '<button class="small danger remove-team-from-tournament" data-tourn="' + tourn.id + '" data-team="' + entry.teamId + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.eliminate-team').forEach(function(btn) {
        btn.addEventListener('click', function() { eliminateTeam(btn.dataset.tourn, btn.dataset.team); });
    });
    container.querySelectorAll('.restore-team').forEach(function(btn) {
        btn.addEventListener('click', function() { restoreTeam(btn.dataset.tourn, btn.dataset.team); });
    });
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
        alert('Team already added to this tournament.'); 
        return;
    }
    
    tourn.teams.push({ teamId: teamId, seed: tourn.teams.length + 1 });
    
    if (!tourn.participants) tourn.participants = [];
    if (!tourn.participants.some(function(p) { return p.id === teamId && p.type === 'team'; })) {
        tourn.participants.push({ type: 'team', id: teamId });
    }
    
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

function eliminateTeam(tournId, teamId) {
    if (!confirm('Eliminate this team from the tournament?')) return;
    
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    if (!tourn.eliminations) tourn.eliminations = [];
    
    var block = getWeekBlock(currentCalendarWeek || 1);
    var week = block.start;
    
    if (tourn.eliminations.some(function(e) { return e.participantId === teamId && e.participantType === 'team'; })) {
        alert('Team already eliminated.');
        return;
    }
    
    tourn.eliminations.push({
        participantId: teamId,
        participantType: 'team',
        week: week
    });
    
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (team && team.members) {
        team.members.forEach(function(member) {
            var char = data.characters.find(function(c) { return c.id === member.characterId; });
            if (char && !char.deceased) {
                char.deceased = true;
                char.deathYear = data.currentYear || new Date().getFullYear();
                char.deathCause = 'Eliminated with team ' + team.name + ' in tournament: ' + tourn.name;
                var birthYear = parseInt(char.birthYear);
                if (!isNaN(birthYear)) char.deathAge = String(parseInt(char.deathYear) - birthYear);
            }
        });
    }
    
    logActivity('Eliminated team ' + (team ? team.name : '') + ' from tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function restoreTeam(tournId, teamId) {
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    
    if (tourn.eliminations) {
        tourn.eliminations = tourn.eliminations.filter(function(e) {
            return !(e.participantId === teamId && e.participantType === 'team');
        });
    }
    
    var team = data.teams.find(function(t) { return t.id === teamId; });
    if (team && team.members) {
        team.members.forEach(function(member) {
            var char = data.characters.find(function(c) { return c.id === member.characterId; });
            if (char && char.deceased) {
                var stillEliminated = false;
                data.tournaments.forEach(function(t) {
                    if (t.id === tournId) return;
                    if (t.eliminations) {
                        t.eliminations.forEach(function(e) {
                            if (e.participantId === char.id && e.participantType === 'char') {
                                stillEliminated = true;
                            }
                        });
                    }
                });
                if (!stillEliminated) {
                    char.deceased = false;
                    char.deathYear = '';
                    char.deathCause = '';
                    char.deathAge = '';
                }
            }
        });
    }
    
    logActivity('Restored team ' + (team ? team.name : '') + ' in tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}
