// ============================================================
// export.js - CSV/JSON Export/Import
// ============================================================

function csvField(value) {
    if (value === null || value === undefined) return '';
    var str = String(value);
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function parseCSVLine(line) {
    var values = [], current = '', inQuotes = false;
    for (var i = 0; i < line.length; i++) {
        var char = line[i];
        if (inQuotes) {
            if (char === '"' && line[i+1] === '"') { current += '"'; i++; }
            else if (char === '"') inQuotes = false;
            else current += char;
        } else {
            if (char === '"') inQuotes = true;
            else if (char === ',') { values.push(current.trim()); current = ''; }
            else current += char;
        }
    }
    values.push(current.trim());
    return values;
}

function exportCSV() {
    var lines = [];
    lines.push('# CHARACTERS');
    lines.push('FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes,Deceased,DeathYear,DeathCause,DeathAge,Specialty,CareerStatus');
    data.characters.forEach(function(c) {
        var careerStr = '';
        if (c.careerStatus) {
            careerStr = c.careerStatus.map(function(s) { 
                return s.status + ':' + s.startYear + '-' + (s.endYear || 'present'); 
            }).join(';');
        }
        lines.push([
            csvField(c.firstName || ''), csvField(c.middleName || ''), csvField(c.lastName || ''),
            c.birthYear || '', csvField(c.gender || ''), csvField(c.associatedNames || ''),
            csvField(c.eyes || ''), csvField(c.hair || ''), csvField(c.skin || ''),
            csvField(c.height || ''), csvField(c.build || ''), csvField(c.appearanceNotes || ''),
            csvField(c.notes || ''), c.deceased ? 'true' : 'false', c.deathYear || '',
            csvField(c.deathCause || ''), c.deathAge || '', csvField(c.specialty || ''), csvField(careerStr)
        ].join(','));
    });
    lines.push('\n# TEAMS');
    lines.push('TeamName,TeamType,StartPeriod,EndPeriod,CurrentRank,Status,NameHistory');
    data.teams.forEach(function(t) {
        var nameHistoryStr = '';
        if (t.nameHistory) {
            nameHistoryStr = t.nameHistory.map(function(n) { 
                return n.name + ':' + n.startPeriod + '-' + (n.endPeriod || 'present'); 
            }).join(';');
        }
        lines.push(csvField(t.name) + ',' + csvField(t.type) + ',' + (t.startPeriod || '') + ',' + 
                   (t.endPeriod || '') + ',' + (t.currentRank || '') + ',' + csvField(t.status) + ',' + 
                   csvField(nameHistoryStr));
    });
    lines.push('\n# TEAM MEMBERS');
    lines.push('TeamName,CharacterName,Role,JoinPeriod,LeavePeriod');
    data.teams.forEach(function(t) {
        if (t.members) {
            t.members.forEach(function(m) {
                var char = data.characters.find(function(c) { return c.id === m.characterId; });
                var name = char ? [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
                lines.push(csvField(t.name) + ',' + csvField(name) + ',' + csvField(m.role) + ',' + 
                           (m.joinPeriod || '') + ',' + (m.leavePeriod || ''));
            });
        }
    });
    lines.push('\n# TEAM RANKINGS');
    lines.push('TeamName,Period,Rank');
    data.teams.forEach(function(t) {
        if (t.rankingHistory) {
            t.rankingHistory.forEach(function(r) { 
                lines.push(csvField(t.name) + ',' + (r.period || '') + ',' + (r.rank || '')); 
            });
        }
    });
    lines.push('\n# TOURNAMENTS');
    lines.push('TournamentName,Mode,AcademicYear,StartWeek,EndWeek,EliminationsPerRound,Status,Description');
    data.tournaments.forEach(function(t) {
        lines.push(csvField(t.name) + ',' + csvField(t.mode || 'team') + ',' + csvField(t.academicYear) + ',' + 
                   (t.startWeek || '') + ',' + (t.endWeek || '') + ',' + (t.eliminationsPerRound || 4) + ',' + 
                   csvField(t.status) + ',' + csvField(t.description));
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
    lines.push('\n# TOURNAMENT MATCHES');
    lines.push('TournamentName,Round,Participant1,Participant2,Winner');
    data.tournaments.forEach(function(t) {
        if (t.matches) {
            t.matches.forEach(function(m) {
                var p1 = getParticipantName(m.participant1, t);
                var p2 = getParticipantName(m.participant2, t);
                var winner = m.winner ? getParticipantName(m.winner, t) : '';
                lines.push(csvField(t.name) + ',' + (m.round || '') + ',' + csvField(p1) + ',' + 
                           csvField(p2) + ',' + csvField(winner));
            });
        }
    });
    lines.push('\n# TOURNAMENT ELIMINATIONS');
    lines.push('TournamentName,Participant,Week,Round');
    data.tournaments.forEach(function(t) {
        if (t.eliminations) {
            t.eliminations.forEach(function(e) {
                var name = getParticipantName({ type: e.participantType, id: e.participantId }, t);
                lines.push(csvField(t.name) + ',' + csvField(name) + ',' + (e.week || '') + ',' + 
                           (e.matchRound || ''));
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
                currentYear: data.currentYear || new Date().getFullYear(), 
                currentWeek: 1 
            };
            var charMap = {}, teamMap = {};
            
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;
                if (line.startsWith('# CHARACTERS')) { section = 'characters'; continue; }
                if (line.startsWith('# TEAMS')) { section = 'teams'; continue; }
                if (line.startsWith('# TEAM MEMBERS')) { section = 'members'; continue; }
                if (line.startsWith('# TEAM RANKINGS')) { section = 'rankings'; continue; }
                if (line.startsWith('# TOURNAMENTS')) { section = 'tournaments'; continue; }
                if (line.startsWith('# TOURNAMENT TEAMS')) { section = 'tournament_teams'; continue; }
                if (line.startsWith('# TOURNAMENT MATCHES')) { section = 'tournament_matches'; continue; }
                if (line.startsWith('# TOURNAMENT ELIMINATIONS')) { section = 'tournament_eliminations'; continue; }
                if (line.startsWith('FirstName,') || line.startsWith('TeamName,') || line.startsWith('TournamentName,')) continue;
                
                var values = parseCSVLine(line);
                
                if (section === 'characters' && values.length >= 19) {
                    var careerStatus = [];
                    if (values[18]) {
                        var careerParts = values[18].split(';');
                        careerParts.forEach(function(part) {
                            var match = part.match(/([^:]+):([^-]+)-(.+)/);
                            if (match) {
                                careerStatus.push({ 
                                    status: match[1], 
                                    startYear: match[2], 
                                    endYear: match[3] === 'present' ? '' : match[3] 
                                });
                            }
                        });
                    }
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
                        specialty: values[17] || '',
                        careerStatus: careerStatus, 
                        eliminatedWeeks: [], 
                        createdAt: new Date().toISOString() 
                    };
                    newData.characters.push(char);
                    var key = (char.firstName + '|' + char.lastName).toLowerCase();
                    charMap[key] = char;
                } else if (section === 'teams' && values.length >= 7) {
                    var nameHistory = [];
                    if (values[6]) {
                        var nameParts = values[6].split(';');
                        nameParts.forEach(function(part) {
                            var match = part.match(/([^:]+):([^-]+)-(.+)/);
                            if (match) {
                                nameHistory.push({ 
                                    name: match[1], 
                                    startPeriod: match[2], 
                                    endPeriod: match[3] === 'present' ? '' : match[3] 
                                });
                            }
                        });
                    }
                    var team = { 
                        id: generateId(), 
                        name: values[0] || '', 
                        type: values[1] || '', 
                        startPeriod: values[2] || '',
                        endPeriod: values[3] || '', 
                        currentRank: values[4] || '', 
                        status: values[5] || 'active',
                        nameHistory: nameHistory, 
                        members: [], 
                        rankingHistory: [], 
                        createdAt: new Date().toISOString() 
                    };
                    newData.teams.push(team);
                    teamMap[team.name.toLowerCase()] = team;
                } else if (section === 'members' && values.length >= 5) {
                    var teamName = values[0];
                    var charName = values[1];
                    var team = teamMap[teamName.toLowerCase()];
                    if (team) {
                        var charKey = charName.toLowerCase();
                        var char = Object.values(charMap).find(function(c) {
                            return (c.firstName + ' ' + c.lastName).toLowerCase() === charKey ||
                                   (c.firstName + ' ' + (c.middleName || '') + ' ' + c.lastName).toLowerCase().trim() === charKey;
                        });
                        if (char) {
                            team.members.push({ 
                                characterId: char.id, 
                                role: values[2] || 'Member', 
                                joinPeriod: values[3] || '', 
                                leavePeriod: values[4] || '' 
                            });
                        }
                    }
                } else if (section === 'rankings' && values.length >= 3) {
                    var teamName = values[0];
                    var team = teamMap[teamName.toLowerCase()];
                    if (team) {
                        if (!team.rankingHistory) team.rankingHistory = [];
                        team.rankingHistory.push({ period: values[1] || '', rank: values[2] || '' });
                    }
                } else if (section === 'tournaments' && values.length >= 8) {
                    var tourn = { 
                        id: generateId(), 
                        name: values[0] || '', 
                        mode: values[1] || 'team',
                        academicYear: values[2] || '', 
                        startWeek: values[3] || '', 
                        endWeek: values[4] || '', 
                        eliminationsPerRound: parseInt(values[5]) || 4,
                        status: values[6] || 'draft', 
                        description: values[7] || '', 
                        teams: [], 
                        participants: [], 
                        matches: [], 
                        eliminations: [], 
                        winners: [], 
                        createdAt: new Date().toISOString() 
                    };
                    newData.tournaments.push(tourn);
                } else if (section === 'tournament_teams' && values.length >= 3) {
                    var tournName = values[0];
                    var teamName = values[1];
                    var tourn = newData.tournaments.find(function(t) { return t.name === tournName; });
                    var team = teamMap[teamName.toLowerCase()];
                    if (tourn && team) {
                        tourn.teams.push({ teamId: team.id, seed: parseInt(values[2]) || tourn.teams.length + 1 });
                        if (!tourn.participants) tourn.participants = [];
                        if (!tourn.participants.some(function(p) { return p.id === team.id && p.type === 'team'; })) {
                            tourn.participants.push({ type: 'team', id: team.id });
                        }
                    }
                } else if (section === 'tournament_matches' && values.length >= 5) {
                    var tournName = values[0];
                    var tourn = newData.tournaments.find(function(t) { return t.name === tournName; });
                    if (tourn) {
                        var p1Name = values[2];
                        var p2Name = values[3];
                        var winnerName = values[4];
                        
                        var findParticipant = function(name) {
                            if (!name) return null;
                            var char = newData.characters.find(function(c) {
                                var fullName = [c.firstName, c.middleName, c.lastName].filter(function(n) { return n; }).join(' ');
                                return fullName === name;
                            });
                            if (char) return { type: 'char', id: char.id };
                            var team = newData.teams.find(function(t) { return t.name === name; });
                            if (team) return { type: 'team', id: team.id };
                            return null;
                        };
                        
                        var p1 = findParticipant(p1Name);
                        var p2 = findParticipant(p2Name);
                        var winner = winnerName ? findParticipant(winnerName) : null;
                        
                        if (p1 && p2) {
                            if (!tourn.matches) tourn.matches = [];
                            tourn.matches.push({
                                round: values[1] || '',
                                participant1: p1,
                                participant2: p2,
                                winner: winner
                            });
                        }
                    }
                } else if (section === 'tournament_eliminations' && values.length >= 4) {
                    var tournName = values[0];
                    var tourn = newData.tournaments.find(function(t) { return t.name === tournName; });
                    if (tourn) {
                        var name = values[1];
                        var char = newData.characters.find(function(c) {
                            var fullName = [c.firstName, c.middleName, c.lastName].filter(function(n) { return n; }).join(' ');
                            return fullName === name;
                        });
                        if (char) {
                            if (!tourn.eliminations) tourn.eliminations = [];
                            tourn.eliminations.push({
                                participantId: char.id,
                                participantType: 'char',
                                week: values[2] || '',
                                matchRound: values[3] || ''
                            });
                        } else {
                            var team = newData.teams.find(function(t) { return t.name === name; });
                            if (team) {
                                if (!tourn.eliminations) tourn.eliminations = [];
                                tourn.eliminations.push({
                                    participantId: team.id,
                                    participantType: 'team',
                                    week: values[2] || '',
                                    matchRound: values[3] || ''
                                });
                            }
                        }
                    }
                }
            }

            if (newData.characters.length === 0 && newData.teams.length === 0 && newData.tournaments.length === 0) {
                alert('No valid data found in CSV file.'); 
                return;
            }

            data = newData;
            saveData().then(function() {
                logActivity('Imported data from CSV');
                renderAll();
                updateDashboard();
                alert('Imported successfully!\nCharacters: ' + data.characters.length + 
                      '\nTeams: ' + data.teams.length + '\nTournaments: ' + data.tournaments.length);
            }).catch(function(err) { alert('Failed to save data: ' + err.message); });
        } catch (err) { alert('Failed to import CSV: ' + err.message); }
    };
    reader.readAsText(file);
}

function exportTemplateCSV() {
    var lines = [
        '# CHARACTERS',
        'FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes,Deceased,DeathYear,DeathCause,DeathAge,Specialty,CareerStatus',
        'John,,Doe,1990,Male,,Blue,Brown,Fair,5\'10",Athletic,,Example character,false,,,,,',
        'Jane,Mary,Smith,1992,Female,The Shadow,Green,Black,Olive,5\'7",Slim,Scar on cheek,,false,,,,,trainee:2020-2023;rookie:2023-',
        '',
        '# TEAMS',
        'TeamName,TeamType,StartPeriod,EndPeriod,CurrentRank,Status,NameHistory',
        'Example Team,academic,1,2,1,active,Example Team:1-2',
        'Another Team,academic,3,4,2,active,Another Team:3-4',
        '',
        '# TEAM MEMBERS',
        'TeamName,CharacterName,Role,JoinPeriod,LeavePeriod',
        'Example Team,John Doe,Captain,1,',
        'Example Team,Jane Smith,Member,1,',
        '',
        '# TEAM RANKINGS',
        'TeamName,Period,Rank',
        'Example Team,1,1',
        'Another Team,3,2',
        '',
        '# TOURNAMENTS',
        'TournamentName,Mode,AcademicYear,StartWeek,EndWeek,EliminationsPerRound,Status,Description',
        'Spring Cup,team,2025-2026,1,12,4,active,Annual spring tournament',
        '',
        '# TOURNAMENT TEAMS',
        'TournamentName,TeamName,Seed',
        'Spring Cup,Example Team,1',
        'Spring Cup,Another Team,2',
        '',
        '# TOURNAMENT MATCHES',
        'TournamentName,Round,Participant1,Participant2,Winner',
        'Spring Cup,1,Example Team,Another Team,Example Team',
        '',
        '# TOURNAMENT ELIMINATIONS',
        'TournamentName,Participant,Week,Round',
        'Spring Cup,Another Team,1,1'
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
            data = imported;
            if (!data.currentYear) data.currentYear = new Date().getFullYear();
            if (!data.currentWeek) data.currentWeek = 1;
            saveData().then(function() {
                logActivity('Imported data from JSON');
                renderAll();
                updateDashboard();
                alert('Data imported successfully!');
            }).catch(function(err) { alert('Failed to save data: ' + err.message); });
        } catch (err) { alert('Failed to import JSON: ' + err.message); }
    };
    reader.readAsText(file);
}

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
}
