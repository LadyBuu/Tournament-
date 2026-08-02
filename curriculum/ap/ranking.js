// ============================================================
// ranking.js - Student Ranking
// ============================================================

var currentRankWeek = 1;

function renderRanking() {
    var container = document.getElementById('ranking-container');
    
    document.getElementById('rank-week-display').textContent = 'Week ' + currentRankWeek;
    
    var students = getStudents();
    if (students.length === 0) {
        container.innerHTML = '<p class="empty-state">No students found</p>';
        return;
    }
    
    // Calculate averages for each student
    var rankings = [];
    students.forEach(function(student) {
        var grades = curriculumData.grades[student.id] && curriculumData.grades[student.id][currentRankWeek] ? 
            curriculumData.grades[student.id][currentRankWeek] : {};
        
        var disciplines = getAvailableDisciplines(currentRankWeek);
        var totalWeighted = 0;
        var totalWeight = 0;
        var count = 0;
        
        disciplines.forEach(function(d) {
            var score = grades[d.id];
            if (score !== undefined && score !== null && score !== '' && d.weight) {
                totalWeighted += parseFloat(score) * d.weight;
                totalWeight += d.weight;
                count++;
            }
        });
        
        var average = totalWeight > 0 ? totalWeighted / totalWeight : 0;
        rankings.push({
            studentId: student.id,
            firstName: student.firstName,
            lastName: student.lastName || '',
            average: average,
            count: count,
            total: disciplines.length
        });
    });
    
    // Sort by average (descending)
    rankings.sort(function(a, b) {
        if (b.average !== a.average) return b.average - a.average;
        return a.firstName.localeCompare(b.firstName);
    });
    
    // Get existing rankings for this week
    var existingRankings = curriculumData.rankings[currentRankWeek] || [];
    
    // If no rankings exist, create them
    if (existingRankings.length === 0) {
        rankings.forEach(function(r, index) {
            existingRankings.push({
                studentId: r.studentId,
                rank: index + 1,
                average: r.average
            });
        });
        curriculumData.rankings[currentRankWeek] = existingRankings;
        saveCurriculumData();
    }
    
    if (rankings.length === 0) {
        container.innerHTML = '<p class="empty-state">No ranking data available for this week</p>';
        return;
    }
    
    var html = '<table class="ranking-table">';
    html += '<thead><tr>';
    html += '<th>Rank</th>';
    html += '<th>Student</th>';
    html += '<th>Average</th>';
    html += '<th>Disciplines</th>';
    html += '<th>Change</th>';
    html += '</tr></thead><tbody>';
    
    var previousRankings = curriculumData.rankings[currentRankWeek - 1] || [];
    
    rankings.forEach(function(r) {
        var existing = existingRankings.find(function(e) { return String(e.studentId) === String(r.studentId); });
        var rank = existing ? existing.rank : '-';
        var previous = previousRankings.find(function(e) { return String(e.studentId) === String(r.studentId); });
        var prevRank = previous ? previous.rank : null;
        
        var change = '';
        var changeClass = '';
        if (prevRank !== null && prevRank !== undefined) {
            var diff = prevRank - rank;
            if (diff > 0) {
                change = '↑' + diff;
                changeClass = 'up';
            } else if (diff < 0) {
                change = '↓' + Math.abs(diff);
                changeClass = 'down';
            } else {
                change = '—';
                changeClass = 'same';
            }
        }
        
        html += '<tr>';
        html += '<td class="rank-number"><input type="number" class="rank-input" data-student="' + r.studentId + '" value="' + rank + '" min="1" max="' + rankings.length + '"></td>';
        html += '<td>' + r.firstName + (r.lastName ? ' ' + r.lastName : '') + '</td>';
        html += '<td style="font-weight:700;color:var(--accent);">' + (r.average > 0 ? r.average.toFixed(1) : '—') + '</td>';
        html += '<td>' + r.count + '/' + r.total + '</td>';
        html += '<td><span class="rank-change ' + changeClass + '">' + change + '</span></td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    // Add auto-rank and save buttons
    html += '<div style="margin-top:12px;display:flex;gap:8px;">';
    html += '<button id="auto-rank-btn" class="primary small">Auto-Rank</button>';
    html += '<button id="save-rankings-btn" class="primary small">Save Rankings</button>';
    html += '</div>';
    
    container.innerHTML = html;
    
    // Rank input change handler
    container.querySelectorAll('.rank-input').forEach(function(input) {
        input.addEventListener('change', function() {
            var studentId = this.dataset.student;
            var newRank = parseInt(this.value);
            var maxRank = parseInt(this.max);
            
            if (isNaN(newRank) || newRank < 1 || newRank > maxRank) {
                alert('Please enter a rank between 1 and ' + maxRank);
                this.value = this.defaultValue;
                return;
            }
            
            // Update rankings
            var existing = existingRankings.find(function(e) { return String(e.studentId) === String(studentId); });
            if (existing) {
                var oldRank = existing.rank;
                existing.rank = newRank;
                
                // Shift other rankings
                existingRankings.forEach(function(e) {
                    if (String(e.studentId) === String(studentId)) return;
                    if (oldRank < newRank && e.rank > oldRank && e.rank <= newRank) {
                        e.rank--;
                    } else if (oldRank > newRank && e.rank >= newRank && e.rank < oldRank) {
                        e.rank++;
                    }
                });
                
                // Ensure uniqueness
                var usedRanks = existingRankings.map(function(e) { return e.rank; });
                var current = 1;
                var sorted = existingRankings.slice().sort(function(a, b) { return a.rank - b.rank; });
                sorted.forEach(function(e) {
                    while (usedRanks.indexOf(current) !== -1 && usedRanks.indexOf(current) !== usedRanks.indexOf(e.rank)) {
                        current++;
                    }
                    e.rank = current;
                    current++;
                });
                
                saveCurriculumData();
                renderRanking();
                logActivity('Updated rankings for week ' + currentRankWeek);
            }
        });
    });
    
    // Auto-rank button
    container.querySelector('#auto-rank-btn').addEventListener('click', function() {
        autoRank();
    });
    
    // Save rankings button
    container.querySelector('#save-rankings-btn').addEventListener('click', function() {
        saveRankings();
    });
}

function autoRank() {
    var students = getStudents();
    var rankings = [];
    
    students.forEach(function(student) {
        var grades = curriculumData.grades[student.id] && curriculumData.grades[student.id][currentRankWeek] ? 
            curriculumData.grades[student.id][currentRankWeek] : {};
        
        var disciplines = getAvailableDisciplines(currentRankWeek);
        var totalWeighted = 0;
        var totalWeight = 0;
        
        disciplines.forEach(function(d) {
            var score = grades[d.id];
            if (score !== undefined && score !== null && score !== '' && d.weight) {
                totalWeighted += parseFloat(score) * d.weight;
                totalWeight += d.weight;
            }
        });
        
        var average = totalWeight > 0 ? totalWeighted / totalWeight : 0;
        rankings.push({
            studentId: student.id,
            average: average
        });
    });
    
    // Sort by average
    rankings.sort(function(a, b) {
        if (b.average !== a.average) return b.average - a.average;
        // If same average, sort by name
        var aName = data.characters.find(function(c) { return String(c.id) === String(a.studentId); });
        var bName = data.characters.find(function(c) { return String(c.id) === String(b.studentId); });
        var aFirstName = aName ? aName.firstName : '';
        var bFirstName = bName ? bName.firstName : '';
        return aFirstName.localeCompare(bFirstName);
    });
    
    var newRankings = [];
    rankings.forEach(function(r, index) {
        newRankings.push({
            studentId: r.studentId,
            rank: index + 1,
            average: r.average
        });
    });
    
    curriculumData.rankings[currentRankWeek] = newRankings;
    saveCurriculumData();
    renderRanking();
    logActivity('Auto-ranked students for week ' + currentRankWeek);
}

function saveRankings() {
    // Rankings are already saved when changes are made, but this provides a manual save button
    saveCurriculumData();
    alert('Rankings saved successfully!');
}

function initRankingEvents() {
    document.getElementById('prev-rank-week').addEventListener('click', function() {
        if (currentRankWeek > 1) {
            currentRankWeek--;
            renderRanking();
        }
    });
    
    document.getElementById('next-rank-week').addEventListener('click', function() {
        if (currentRankWeek < 52) {
            currentRankWeek++;
            renderRanking();
        }
    });
    
    renderRanking();
}
