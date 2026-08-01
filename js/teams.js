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

function closeMemberModal() {
    document.getElementById('member-modal').classList.add('hidden');
    currentTeamId = null;
}

function closeEditMemberModal() {
    document.getElementById('edit-member-modal').classList.add('hidden');
    currentEditMember = null;
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
    team.members.push({ 
        characterId: charId, 
        role: role || 'Member', 
        joinPeriod: joinPeriod || '', 
        leavePeriod: leavePeriod || '' 
    });
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

function closeRankingModal() {
    document.getElementById('ranking-modal').classList.add('hidden');
    currentRankingTeamId = null;
}

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
