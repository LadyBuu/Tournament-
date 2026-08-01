// ============================================================
// eliminations.js - Tournament Elimination Management
// ============================================================

// This file contains elimination helper functions that are used
// across multiple modules. It's kept separate for organization.

// ---- Helper: Check if participant is eliminated ----
function isParticipantEliminated(tourn, participantId, participantType) {
    if (!tourn.eliminations) return false;
    return tourn.eliminations.some(function(e) {
        return e.participantId === participantId && e.participantType === participantType;
    });
}

// ---- Helper: Get elimination week display ----
function getEliminationWeekDisplay(week) {
    var block = getWeekBlock(week);
    return block ? block.label : week;
}

// ---- Helper: Mark character as eliminated ----
function markCharacterEliminated(charId, tournamentName, week, round) {
    var char = data.characters.find(function(c) { return c.id === charId; });
    if (!char) return false;
    
    if (!char.eliminatedWeeks) char.eliminatedWeeks = [];
    if (char.eliminatedWeeks.indexOf(week) === -1) {
        char.eliminatedWeeks.push(week);
    }
    
    if (!char.deceased) {
        char.deceased = true;
        char.deathYear = data.currentYear || new Date().getFullYear();
        char.deathCause = 'Eliminated in tournament: ' + tournamentName + ' (Week ' + week + (round ? ', Round ' + round : '') + ')';
        var birthYear = parseInt(char.birthYear);
        if (!isNaN(birthYear)) {
            char.deathAge = String(parseInt(char.deathYear) - birthYear);
        }
    }
    return true;
}

// ---- Helper: Restore character from elimination ----
function restoreCharacterFromElimination(charId, tournamentId) {
    var char = data.characters.find(function(c) { return c.id === charId; });
    if (!char) return false;
    
    // Check if character is still eliminated in other tournaments
    var stillEliminated = false;
    data.tournaments.forEach(function(t) {
        if (t.id === tournamentId) return;
        if (t.eliminations) {
            t.eliminations.forEach(function(e) {
                if (e.participantId === charId && e.participantType === 'char') {
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
    return true;
}
