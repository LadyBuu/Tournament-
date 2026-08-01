// ============================================================
// weekly.js - Weekly Team View
// ============================================================

var currentStartWeek = 1;
var visibleWeeks = 8;

function renderWeeklyView() {
    var tbody = document.getElementById('weekly-teams-body');
    if (!tbody) return;

    var teams = data.teams.filter(function(t) { return t.status !== 'deleted'; });
    
    teams.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    if (teams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="27" class="empty-state">No teams created yet. Add your first team!</td></tr>';
        return;
    }

    var endWeek = Math.min(currentStartWeek + visibleWeeks * 2 - 1, 52);
    
    var html = '';
    teams.forEach(function(team) {
        html += '<tr class="team-row" data-team-id="' + team.id + '">';
        html += '<td class="team-name-cell"><strong>' + team.name + '</strong></td>';
        
        for (var w = currentStartWeek; w <= endWeek; w += 2) {
            var blockStart = w;
            var blockEnd = w + 1;
            var membersInBlock = getTeamMembersInBlock(team, blockStart, blockEnd);
            var isActive = isTeamActiveInBlock(team, blockStart, blockEnd);
            
            if (!isActive) {
                html += '<td class="week-cell inactive-team">—</td>';
                continue;
            }
            
            if (membersInBlock.length === 0) {
                html += '<td class="week-cell empty">—</td>';
                continue;
            }
            
            var memberHtml = '<div class="week-members">';
            membersInBlock.forEach(function(member) {
                var char = data.characters.find(function(c) { return c.id === member.characterId; });
                var name = char ? char.firstName : 'Unknown';
                var isEliminated = checkIfEliminatedInWeek(char, blockStart, blockEnd);
                var memberClass = 'member-name';
                if (isEliminated) {
                    memberClass += ' eliminated';
                }
                memberHtml += '<span class="' + memberClass + '" title="' + (member.role || 'Member') + '">' + name + '</span>';
            });
            memberHtml += '</div>';
            
            html += '<td class="week-cell">' + memberHtml + '</td>';
        }
        
        html += '</tr>';
    });

    tbody.innerHTML = html;

    var headers = document.querySelectorAll('.week-header');
    headers.forEach(function(th) {
        var weekNum = parseInt(th.dataset.week);
        if (weekNum >= currentStartWeek && weekNum <= endWeek) {
            th.style.display = '';
        } else {
            th.style.display = 'none';
        }
    });

    var rangeDisplay = document.getElementById('weekly-range-display');
    if (rangeDisplay) {
        var startLabel = getWeekBlock(currentStartWeek).label;
        var endLabel = getWeekBlock(endWeek).label;
        rangeDisplay.textContent = 'Weeks ' + startLabel + ' - ' + endLabel;
    }
}

function getTeamMembersInBlock(team, blockStart, blockEnd) {
    if (!team.members) return [];
    return team.members.filter(function(member) {
        var join = parseInt(member.joinPeriod);
        var leave = parseInt(member.leavePeriod);
        if (isNaN(join)) return false;
        return join <= blockEnd && (isNaN(leave) || leave >= blockStart);
    });
}

function isTeamActiveInBlock(team, blockStart, blockEnd) {
    var start = parseInt(team.startPeriod);
    var end = parseInt(team.endPeriod);
    if (isNaN(start)) return true;
    return start <= blockEnd && (isNaN(end) || end >= blockStart);
}

function checkIfEliminatedInWeek(char, blockStart, blockEnd) {
    if (!char || !char.eliminatedWeeks) return false;
    return char.eliminatedWeeks.some(function(week) {
        var w = parseInt(week);
        return !isNaN(w) && w >= blockStart && w <= blockEnd;
    });
}

function prevWeeks() {
    if (currentStartWeek > 1) {
        currentStartWeek = Math.max(1, currentStartWeek - 2);
        renderWeeklyView();
    }
}

function nextWeeks() {
    if (currentStartWeek < 52) {
        currentStartWeek = Math.min(52, currentStartWeek + 2);
        renderWeeklyView();
    }
}

function initWeeklyEvents() {
    document.getElementById('prev-weeks-btn').addEventListener('click', prevWeeks);
    document.getElementById('next-weeks-btn').addEventListener('click', nextWeeks);
}
