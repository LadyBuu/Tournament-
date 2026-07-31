// ============================================================
// weekly.js - Weekly Team View
// ============================================================

var currentStartWeek = 1;
var visibleWeeks = 8; // Number of weeks to show at a time

function renderWeeklyView() {
    var tbody = document.getElementById('weekly-teams-body');
    if (!tbody) return;

    // Get all teams (filter out deleted)
    var teams = data.teams.filter(function(t) { return t.status !== 'deleted'; });
    
    // Sort teams alphabetically
    teams.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    if (teams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="27" class="empty-state">No teams created yet. Add your first team!</td></tr>';
        return;
    }

    // Determine visible week range
    var endWeek = Math.min(currentStartWeek + visibleWeeks * 2 - 1, 52);
    var weekHeaders = [];
    for (var w = currentStartWeek; w <= endWeek; w += 2) {
        weekHeaders.push(w);
    }

    // Update header visibility - show only visible weeks
    var headers = document.querySelectorAll('.week-header');
    headers.forEach(function(th, index) {
        var weekNum = parseInt(th.dataset.week);
        if (weekNum >= currentStartWeek && weekNum <= endWeek) {
            th.style.display = '';
        } else {
            th.style.display = 'none';
        }
    });

    // Update range display
    var rangeDisplay = document.getElementById('weekly-range-display');
    if (rangeDisplay) {
        var startLabel = getWeekBlock(currentStartWeek).label;
        var endLabel = getWeekBlock(endWeek).label;
        rangeDisplay.textContent = 'Weeks ' + startLabel + ' - ' + endLabel;
    }

    // Build table rows
    var html = '';
    teams.forEach(function(team) {
        html += '<tr class="team-row" data-team-id="' + team.id + '">';
        html += '<td class="team-name-cell"><strong>' + team.name + '</strong></td>';
        
        // For each visible week, check members
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
            
            // Build member list for this cell
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
}

function getTeamMembersInBlock(team, blockStart, blockEnd) {
    if (!team.members) return [];
    return team.members.filter(function(member) {
        var join = parseInt(member.joinPeriod);
        var leave = parseInt(member.leavePeriod);
        if (isNaN(join)) return false;
        // Member is active if they joined before or during the block and left after or during the block
        return join <= blockEnd && (isNaN(leave) || leave >= blockStart);
    });
}

function isTeamActiveInBlock(team, blockStart, blockEnd) {
    var start = parseInt(team.startPeriod);
    var end = parseInt(team.endPeriod);
    if (isNaN(start)) return true; // No start period, assume always active
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

// Initialize weekly view when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the weekly page
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    if (page === 'weekly.html') {
        // Wait for data to load
        var checkData = setInterval(function() {
            if (data && data.teams) {
                clearInterval(checkData);
                renderWeeklyView();
                initWeeklyEvents();
            }
        }, 100);
    }
});
