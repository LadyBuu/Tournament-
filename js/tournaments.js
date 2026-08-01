// ============================================================
// tournaments.js - Tournament Management
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

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
}

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

function renderMatches(tourn) {
    var container = document.getElementById('matches-list');
    if (!tourn.matches || tourn.matches.length === 0) {
        container.innerHTML = '<p class="empty-state">No matches created</p>';
        return;
    }
    var html = '';
    tourn.matches.forEach(function(match, index) {
        var p1Name = getParticipantName(match.participant1, tourn);
        var p2Name = getParticipantName(match.participant2, tourn);
        var winnerName = match.winner ? getParticipantName(match.winner, tourn) : 'TBD';
        var winnerDisplay = match.winner ? '🏆 ' + winnerName : '⏳ ' + winnerName;
        
        html += '<div class="match-entry">' +
            '<span><strong>Round ' + match.round + ':</strong> ' + p1Name + ' vs ' + p2Name + ' → ' + winnerDisplay + '</span>' +
            '<div class="match-actions">' +
                '<button class="small set-winner" data-tourn="' + tourn.id + '" data-index="' + index + '" data-participant="1">🏆 ' + p1Name + '</button>' +
                '<button class="small set-winner" data-tourn="' + tourn.id + '" data-index="' + index + '" data-participant="2">🏆 ' + p2Name + '</button>' +
                '<button class="small danger remove-match" data-tourn="' + tourn.id + '" data-index="' + index + '">✕</button>' +
            '</div>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.set-winner').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            setMatchWinner(btn.dataset.tourn, parseInt(btn.dataset.index), parseInt(btn.dataset.participant)); 
        });
    });
    container.querySelectorAll('.remove-match').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            removeMatch(btn.dataset.tourn, parseInt(btn.dataset.index)); 
        });
    });
}

function addMatch() {
    var modal = document.getElementById('tournament-detail-modal');
    var tournId = modal.dataset.tournamentId;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn) return;
    
    var round = document.getElementById('match-round').value;
    var p1Value = document.getElementById('match-participant1').value;
    var p2Value = document.getElementById('match-participant2').value;
    
    if (!round) { alert('Please enter a round number.'); return; }
    if (!p1Value || !p2Value) { alert('Please select both participants.'); return; }
    if (p1Value === p2Value) { alert('Participants must be different.'); return; }
    
    var p1Parts = p1Value.split('_');
    var p2Parts = p2Value.split('_');
    
    if (!tourn.matches) tourn.matches = [];
    
    tourn.matches.push({
        round: round,
        participant1: { type: p1Parts[0], id: p1Parts[1] },
        participant2: { type: p2Parts[0], id: p2Parts[1] },
        winner: null
    });
    
    logActivity('Added match to tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function removeMatch(tournId, index) {
    if (!confirm('Remove this match?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.matches) return;
    tourn.matches.splice(index, 1);
    logActivity('Removed match from tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function setMatchWinner(tournId, matchIndex, participantNum) {
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.matches || !tourn.matches[matchIndex]) return;
    
    var match = tourn.matches[matchIndex];
    var winner = participantNum === 1 ? match.participant1 : match.participant2;
    match.winner = winner;
    
    if (tourn.mode === 'single') {
        var loser = participantNum === 1 ? match.participant2 : match.participant1;
        if (!tourn.eliminations) tourn.eliminations = [];
        
        var weekNum = parseInt(tourn.startWeek) || 1;
        var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
        
        if (!tourn.eliminations.some(function(e) { 
            return e.participantId === loser.id && e.participantType === loser.type; 
        })) {
            tourn.eliminations.push({
                participantId: loser.id,
                participantType: loser.type,
                week: String(blockStart),
                matchRound: match.round
            });
            
            if (loser.type === 'char') {
                var char = data.characters.find(function(c) { return c.id === loser.id; });
                if (char && !char.deceased) {
                    char.deceased = true;
                    char.deathYear = data.currentYear || new Date().getFullYear();
                    char.deathCause = 'Eliminated in tournament: ' + tourn.name + ' (Round ' + match.round + ')';
                    var birthYear = parseInt(char.birthYear);
                    if (!isNaN(birthYear)) char.deathAge = String(parseInt(char.deathYear) - birthYear);
                }
            }
        }
    }
    
    logActivity('Set winner for match in tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function renderEliminations(tourn) {
    var container = document.getElementById('elimination-list');
    if (!tourn.eliminations || tourn.eliminations.length === 0) {
        container.innerHTML = '<p class="empty-state">No eliminations recorded</p>';
        return;
    }
    var html = '';
    var sorted = tourn.eliminations.slice().sort(function(a, b) { 
        return parseInt(a.week) - parseInt(b.week); 
    });
    sorted.forEach(function(entry, index) {
        var name = getParticipantName({ type: entry.participantType, id: entry.participantId }, tourn);
        var block = getWeekBlock(entry.week);
        var weekDisplay = block ? block.label : entry.week;
        html += '<div class="elimination-entry">' +
            '<span><strong>Wk ' + weekDisplay + ':</strong> ' + name + (entry.matchRound ? ' (Round ' + entry.matchRound + ')' : '') + '</span>' +
            '<button class="small danger remove-elimination" data-tourn="' + tourn.id + '" data-index="' + index + '">✕</button>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.remove-elimination').forEach(function(btn) {
        btn.addEventListener('click', function() { 
            removeElimination(btn.dataset.tourn, parseInt(btn.dataset.index)); 
        });
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
    if (selectedOptions.length === 0) { 
        alert('Please select at least one participant to eliminate.'); 
        return; 
    }
    if (!tourn.eliminations) tourn.eliminations = [];

    var weekNum = parseInt(week);
    if (!isNaN(weekNum)) {
        var blockStart = Math.floor((weekNum - 1) / 2) * 2 + 1;
        week = String(blockStart);
    }

    var added = 0;
    for (var i = 0; i < selectedOptions.length; i++) {
        var value = selectedOptions[i].value;
        if (!value) continue;
        var parts = value.split('_');
        var type = parts[0];
        var id = parts[1];
        
        var existing = tourn.eliminations.some(function(e) { 
            return e.participantId === id && e.participantType === type && parseInt(e.week) === parseInt(week); 
        });
        if (!existing) {
            tourn.eliminations.push({
                participantId: id,
                participantType: type,
                week: week
            });
            
            if (type === 'char') {
                var char = data.characters.find(function(c) { return c.id === id; });
                if (char && !char.deceased) {
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

    if (added === 0) { 
        alert('All selected participants are already eliminated this week.'); 
        return; 
    }
    
    logActivity('Added ' + added + ' elimination(s) for tournament: ' + tourn.name + ' (Week ' + week + ')');
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function removeElimination(tournId, index) {
    if (!confirm('Remove this elimination?')) return;
    var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
    if (!tourn || !tourn.eliminations || !tourn.eliminations[index]) return;
    
    var removed = tourn.eliminations[index];
    tourn.eliminations.splice(index, 1);
    
    if (removed.participantType === 'char') {
        var char = data.characters.find(function(c) { return c.id === removed.participantId; });
        if (char) {
            var stillEliminated = tourn.eliminations.some(function(e) { 
                return e.participantId === removed.participantId && e.participantType === 'char'; 
            });
            if (!stillEliminated) {
                char.deceased = false;
                char.deathYear = '';
                char.deathCause = '';
                char.deathAge = '';
            }
        }
    }
    
    logActivity('Removed elimination from tournament: ' + tourn.name);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    viewTournament(tournId);
}

function renderBracket(tourn) {
    var container = document.getElementById('bracket-container');
    
    if (tourn.matches && tourn.matches.length > 0) {
        var html = '';
        var rounds = {};
        tourn.matches.forEach(function(match) {
            if (!rounds[match.round]) rounds[match.round] = [];
            rounds[match.round].push(match);
        });
        
        var roundKeys = Object.keys(rounds).sort(function(a, b) { return parseInt(a) - parseInt(b); });
        roundKeys.forEach(function(round) {
            html += '<div class="bracket-round">' +
                '<div class="round-label">Round ' + round + '</div>';
            rounds[round].forEach(function(match) {
                var p1Name = getParticipantName(match.participant1, tourn);
                var p2Name = getParticipantName(match.participant2, tourn);
                var winnerName = match.winner ? getParticipantName(match.winner, tourn) : 'TBD';
                var p1Class = match.winner && match.winner.id === match.participant1.id ? 'team winner' : 'team';
                var p2Class = match.winner && match.winner.id === match.participant2.id ? 'team winner' : 'team';
                
                html += '<div class="bracket-match">' +
                    '<div class="' + p1Class + '">' + p1Name + (p1Class === 'team winner' ? ' 🏆' : '') + '</div>' +
                    '<div class="' + p2Class + '">' + p2Name + (p2Class === 'team winner' ? ' 🏆' : '') + '</div>' +
                    '<div style="font-size:0.7rem;color:var(--text-dim);border-top:1px solid var(--border-soft);margin-top:4px;padding-top:4px;">Winner: ' + winnerName + '</div>' +
                '</div>';
            });
            html += '</div>';
        });
        container.innerHTML = html;
        return;
    }
    
    if ((!tourn.participants || tourn.participants.length === 0) && (!tourn.teams || tourn.teams.length === 0)) {
        container.innerHTML = '<p class="empty-state">Add participants to generate bracket</p>';
        return;
    }

    var participants = tourn.participants || [];
    if (tourn.mode === 'team') {
        var teams = tourn.teams || [];
        participants = teams.map(function(t) { return { type: 'team', id: t.teamId }; });
    }
    
    var rounds = [];
    var currentParticipants = participants.slice();
    
    if (currentParticipants.length === 1) {
        var name = getParticipantName(currentParticipants[0], tourn);
        rounds.push([['🏆 ' + name, 'BYE']]);
    } else {
        while (currentParticipants.length > 1) {
            var roundTeams = [];
            for (var i = 0; i < currentParticipants.length; i += 2) {
                if (i + 1 < currentParticipants.length) {
                    roundTeams.push([currentParticipants[i], currentParticipants[i + 1]]);
                } else {
                    roundTeams.push([currentParticipants[i], 'BYE']);
                }
            }
            rounds.push(roundTeams);
            currentParticipants = roundTeams.map(function(match) {
                if (match[0] === 'BYE') return match[1];
                if (match[1] === 'BYE') return match[0];
                var p1Eliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                    return e.participantId === match[0].id && e.participantType === match[0].type;
                });
                var p2Eliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                    return e.participantId === match[1].id && e.participantType === match[1].type;
                });
                if (p1Eliminated && !p2Eliminated) return match[1];
                if (p2Eliminated && !p1Eliminated) return match[0];
                return Math.random() < 0.5 ? match[0] : match[1];
            });
        }
    }
    
    var html = '';
    rounds.forEach(function(round, index) {
        html += '<div class="bracket-round">' +
            '<div class="round-label">Round ' + (index + 1) + '</div>';
        round.forEach(function(match) {
            var p1Name = match[0] !== 'BYE' ? getParticipantName(match[0], tourn) : 'BYE';
            var p2Name = match[1] !== 'BYE' ? getParticipantName(match[1], tourn) : 'BYE';
            
            var p1Eliminated = match[0] !== 'BYE' && tourn.eliminations && tourn.eliminations.some(function(e) {
                return e.participantId === match[0].id && e.participantType === match[0].type;
            });
            var p2Eliminated = match[1] !== 'BYE' && tourn.eliminations && tourn.eliminations.some(function(e) {
                return e.participantId === match[1].id && e.participantType === match[1].type;
            });
            
            var p1Class = p1Eliminated ? 'team eliminated' : 'team';
            var p2Class = p2Eliminated ? 'team eliminated' : 'team';
            
            html += '<div class="bracket-match">' +
                '<div class="' + p1Class + '">' + p1Name + (p1Eliminated ? ' 💀' : '') + '</div>' +
                '<div class="' + p2Class + '">' + p2Name + (p2Eliminated ? ' 💀' : '') + '</div>' +
            '</div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

function populateParticipantSelects(tourn) {
    var select1 = document.getElementById('match-participant1');
    var select2 = document.getElementById('match-participant2');
    var participantSelect = document.getElementById('participant-select');
    
    select1.innerHTML = '<option value="">Select...</option>';
    select2.innerHTML = '<option value="">Select...</option>';
    participantSelect.innerHTML = '<option value="">Select participant...</option>';
    
    var currentWeek = parseInt(tourn.startWeek) || currentCalendarWeek || 1;
    
    if (tourn.mode === 'single') {
        var availableChars = data.characters.filter(function(char) {
            if (char.deceased) return false;
            if (tourn.participants && tourn.participants.some(function(p) { 
                return p.id === char.id && p.type === 'char'; 
            })) return false;
            return true;
        });
        availableChars.forEach(function(char) {
            var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
            var option1 = document.createElement('option');
            option1.value = 'char_' + char.id;
            option1.textContent = name;
            select1.appendChild(option1);
            
            var option2 = document.createElement('option');
            option2.value = 'char_' + char.id;
            option2.textContent = name;
            select2.appendChild(option2);
            
            var optionP = document.createElement('option');
            optionP.value = 'char_' + char.id;
            optionP.textContent = name;
            participantSelect.appendChild(optionP);
        });
    } else {
        var activeTeams = getActiveTeamsForWeek(currentWeek, tourn.id);
        activeTeams.forEach(function(team) {
            if (tourn.participants && tourn.participants.some(function(p) { 
                return p.id === team.id && p.type === 'team'; 
            })) return;
            
            var option1 = document.createElement('option');
            option1.value = 'team_' + team.id;
            option1.textContent = team.name + (team.currentRank ? ' (#' + team.currentRank + ')' : '');
            select1.appendChild(option1);
            
            var option2 = document.createElement('option');
            option2.value = 'team_' + team.id;
            option2.textContent = team.name + (team.currentRank ? ' (#' + team.currentRank + ')' : '');
            select2.appendChild(option2);
            
            var optionP = document.createElement('option');
            optionP.value = 'team_' + team.id;
            optionP.textContent = team.name + (team.currentRank ? ' (#' + team.currentRank + ')' : '');
            participantSelect.appendChild(optionP);
        });
    }
}

function populateEliminationSelect(tourn) {
    var elimSelect = document.getElementById('elim-characters');
    elimSelect.innerHTML = '';
    
    if (tourn.mode === 'single') {
        var participants = tourn.participants || [];
        participants.forEach(function(participant) {
            if (participant.type === 'char') {
                var char = data.characters.find(function(c) { return c.id === participant.id; });
                if (char) {
                    var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                    var option = document.createElement('option');
                    option.value = 'char_' + char.id;
                    option.textContent = name + (char.deceased ? ' 💀' : '');
                    elimSelect.appendChild(option);
                }
            }
        });
    } else {
        var teams = tourn.teams || [];
        teams.forEach(function(teamEntry) {
            var team = data.teams.find(function(t) { return t.id === teamEntry.teamId; });
            if (team && team.members) {
                team.members.forEach(function(member) {
                    var char = data.characters.find(function(c) { return c.id === member.characterId; });
                    if (char) {
                        var name = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
                        var option = document.createElement('option');
                        option.value = 'char_' + char.id;
                        option.textContent = team.name + ' - ' + name + (char.deceased ? ' 💀' : '');
                        elimSelect.appendChild(option);
                    }
                });
            }
        });
    }
}

function initTournamentEvents() {
    document.getElementById('add-tournament-btn').addEventListener('click', function() { 
        showTournamentForm(); 
    });
    document.getElementById('cancel-tournament-btn').addEventListener('click', hideTournamentForm);
    document.getElementById('tournament-form-inner').addEventListener('submit', saveTournament);

    document.querySelector('#tournament-detail-modal .close-modal').addEventListener('click', closeTournamentDetail);
    document.getElementById('tournament-detail-modal').addEventListener('click', function(e) {
        if (e.target === this) closeTournamentDetail();
    });
    
    document.getElementById('add-participant-btn').addEventListener('click', addParticipant);
    document.getElementById('add-team-to-tournament').addEventListener('click', addTeamToTournament);
    document.getElementById('add-match-btn').addEventListener('click', addMatch);
    document.getElementById('add-elimination-btn').addEventListener('click', addElimination);
    
    document.getElementById('remove-elimination-btn').addEventListener('click', function() {
        var select = document.getElementById('elim-characters');
        var selected = [];
        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].selected) selected.push(select.options[i].value);
        }
        if (selected.length === 0) { 
            alert('Please select characters to remove.'); 
            return; 
        }
        if (!confirm('Remove selected eliminations?')) return;
        
        var modal = document.getElementById('tournament-detail-modal');
        var tournId = modal.dataset.tournamentId;
        var tourn = data.tournaments.find(function(t) { return t.id === tournId; });
        if (!tourn || !tourn.eliminations) return;
        
        var toRemove = [];
        tourn.eliminations.forEach(function(e, index) {
            if (selected.indexOf(e.participantId) !== -1) toRemove.push(index);
        });
        toRemove.sort(function(a, b) { return b - a; });
        toRemove.forEach(function(idx) {
            var removed = tourn.eliminations[idx];
            var char = data.characters.find(function(c) { return c.id === removed.participantId; });
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
}
