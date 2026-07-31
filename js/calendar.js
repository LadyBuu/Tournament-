// ============================================================
// calendar.js - Calendar View
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
    var tournamentLabel = document.getElementById('tournament-week-label');
    if (tournamentLabel) {
        var block = getWeekBlock(currentCalendarWeek || 1);
        tournamentLabel.textContent = 'Weeks ' + block.label;
    }
    renderUnassignedCharacters();
    renderEliminatedCharacters();
    renderTeamRankings();
    renderActiveTeams();
    renderTournamentTeams();
}

function renderUnassignedCharacters() {
    var container = document.getElementById('unassigned-characters');
    if (!container) return;

    var block = getWeekBlock(currentCalendarWeek || 1);
    var weekStart = block.start;
    var weekEnd = block.end;

    var assignedIds = [];
    data.teams.forEach(function(team) {
        if (team.members) {
            team.members.forEach(function(member) {
                var join = parseInt(member.joinPeriod);
                var leave = parseInt(member.leavePeriod);
                if (!isNaN(join)) {
                    if (join <= weekEnd) {
                        if (isNaN(leave) || leave >= weekStart) {
                            assignedIds.push(member.characterId);
                        }
                    }
                }
            });
        }
    });

    var unassigned = data.characters.filter(function(char) {
        return !char.deceased && assignedIds.indexOf(char.id) === -1;
    });

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
    var weekStart = block.start;
    var weekEnd = block.end;
    
    var eliminatedEntries = [];
    
    data.tournaments.forEach(function(tourn) {
        if (tourn.eliminations) {
            tourn.eliminations.forEach(function(elim) {
                var week = parseInt(elim.week);
                if (!isNaN(week) && week >= weekStart && week <= weekEnd) {
                    var name = getParticipantName({ type: elim.participantType, id: elim.participantId }, tourn);
                    var teamName = '';
                    
                    if (elim.participantType === 'char') {
                        var char = data.characters.find(function(c) { return c.id === elim.participantId; });
                        if (char) {
                            data.teams.forEach(function(team) {
                                if (team.members) {
                                    team.members.forEach(function(member) {
                                        if (member.characterId === char.id) {
                                            var join = parseInt(member.joinPeriod);
                                            var leave = parseInt(member.leavePeriod);
                                            if (!isNaN(join) && join <= weekEnd && (isNaN(leave) || leave >= weekStart)) {
                                                teamName = team.name;
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    }
                    
                    eliminatedEntries.push({
                        name: name,
                        team: teamName,
                        tournament: tourn.name,
                        week: week,
                        round: elim.matchRound || '?'
                    });
                }
            });
        }
    });
    
    if (eliminatedEntries.length === 0) {
        container.innerHTML = '<p class="empty-state">No eliminations this block</p>';
        return;
    }
    
    var html = '';
    eliminatedEntries.forEach(function(entry) {
        var teamDisplay = entry.team ? ' (' + entry.team + ')' : '';
        html += '<div class="activity-item" style="color:var(--danger);">' +
            entry.name + teamDisplay + 
            ' <span style="font-size:0.75rem;">eliminated in ' + entry.tournament + 
            ' (Wk ' + entry.week + ', Round ' + entry.round + ')</span>' +
        '</div>';
    });
    container.innerHTML = html;
}

function renderTeamRankings() {
    var container = document.getElementById('team-rankings');
    if (!container) return;

    var block = getWeekBlock(currentCalendarWeek || 1);
    var weekStart = block.start;
    var weekEnd = block.end;

    var teams = data.teams.filter(function(t) { 
        return t.type === 'academic' && t.status !== 'deleted'; 
    });

    var ranked = [];
    teams.forEach(function(team) {
        if (team.rankingHistory) {
            team.rankingHistory.forEach(function(rank) {
                var period = parseInt(rank.period);
                if (!isNaN(period)) {
                    var rankBlock = getRankingBlock(period);
                    if (rankBlock && rankBlock.start <= weekEnd && rankBlock.end >= weekStart) {
                        ranked.push({
                            team: team,
                            rank: parseInt(rank.rank),
                            period: period,
                            blockLabel: rankBlock.label
                        });
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
                ranked.push({
                    team: team,
                    rank: parseInt(team.currentRank),
                    period: null,
                    blockLabel: 'Current'
                });
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
    var weekStart = block.start;
    var weekEnd = block.end;

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

    active.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

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
            if (blockRank.length > 0) {
                rankDisplay = '#' + blockRank[0].rank;
            } else if (team.currentRank) {
                rankDisplay = '#' + team.currentRank + '*';
            }
        } else if (team.currentRank) {
            rankDisplay = '#' + team.currentRank + '*';
        }
        
        var periodDisplay = '';
        if (team.startPeriod && team.endPeriod) {
            periodDisplay = 'Wk ' + team.startPeriod + '-' + team.endPeriod;
        } else if (team.startPeriod) {
            periodDisplay = 'Wk ' + team.startPeriod + '+';
        }
        
        html += '<div class="team-ranking-item">' +
            '<span class="team-name">' + team.name + '</span>' +
            '<span style="font-size:.75rem;color:var(--text-dim);">' + memberCount + ' members</span>' +
            '<span style="font-size:.75rem;color:var(--text-dim);">' + periodDisplay + '</span>' +
            '<span style="font-size:.75rem;color:var(--accent);font-weight:600;">' + rankDisplay + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
}

function renderTournamentTeams() {
    var container = document.getElementById('tournament-teams');
    if (!container) return;
    
    var block = getWeekBlock(currentCalendarWeek || 1);
    var weekStart = block.start;
    var weekEnd = block.end;
    
    var activeTournaments = data.tournaments.filter(function(tourn) {
        var start = parseInt(tourn.startWeek);
        var end = parseInt(tourn.endWeek);
        return !isNaN(start) && start <= weekEnd && (isNaN(end) || end >= weekStart);
    });
    
    if (activeTournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments active this block</p>';
        return;
    }
    
    var html = '';
    activeTournaments.forEach(function(tourn) {
        html += '<div class="tournament-block">';
        html += '<h4>' + tourn.name + ' (' + tourn.mode + ')</h4>';
        
        if (tourn.mode === 'team') {
            if (tourn.teams && tourn.teams.length > 0) {
                html += '<div class="tournament-teams-list">';
                tourn.teams.forEach(function(teamEntry) {
                    var team = data.teams.find(function(t) { return t.id === teamEntry.teamId; });
                    if (team) {
                        var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                            return e.participantId === team.id && e.participantType === 'team';
                        });
                        html += '<div class="tournament-team-item' + (isEliminated ? ' eliminated' : '') + '">' +
                            team.name + (isEliminated ? ' 💀' : '') +
                            (team.currentRank ? ' (#' + team.currentRank + ')' : '') +
                        '</div>';
                    }
                });
                html += '</div>';
            }
            
            if (tourn.matches && tourn.matches.length > 0) {
                var blockMatches = tourn.matches.filter(function(match) {
                    var round = parseInt(match.round);
                    var matchWeek = tourn.startWeek ? parseInt(tourn.startWeek) + (round - 1) * 2 : 1;
                    return matchWeek >= weekStart && matchWeek <= weekEnd;
                });
                
                if (blockMatches.length > 0) {
                    html += '<div class="matches-list">';
                    blockMatches.forEach(function(match) {
                        var p1Name = getParticipantName(match.participant1, tourn);
                        var p2Name = getParticipantName(match.participant2, tourn);
                        var winnerName = match.winner ? getParticipantName(match.winner, tourn) : 'TBD';
                        html += '<div class="match-item">' +
                            'Round ' + match.round + ': ' + p1Name + ' vs ' + p2Name + 
                            ' → <span class="winner">' + winnerName + '</span>' +
                        '</div>';
                    });
                    html += '</div>';
                }
            }
        } else {
            if (tourn.participants && tourn.participants.length > 0) {
                html += '<div class="tournament-teams-list">';
                tourn.participants.forEach(function(participant) {
                    var name = getParticipantName(participant, tourn);
                    var isEliminated = tourn.eliminations && tourn.eliminations.some(function(e) {
                        return e.participantId === participant.id && e.participantType === participant.type;
                    });
                    html += '<div class="tournament-team-item' + (isEliminated ? ' eliminated' : '') + '">' +
                        name + (isEliminated ? ' 💀' : '') +
                    '</div>';
                });
                html += '</div>';
            }
        }
        
        html += '</div>';
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
