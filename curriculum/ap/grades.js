// ============================================================
// grades.js - Grade Management
// ============================================================

var currentGradeWeek = 1;
var selectedGradeStudentId = null;

function renderGrades() {
    var container = document.getElementById('grades-container');
    var summary = document.getElementById('grades-summary-content');
    
    if (!selectedGradeStudentId) {
        container.innerHTML = '<p class="empty-state">Select a student to view and manage grades</p>';
        summary.innerHTML = '<p class="empty-state">No grades data available</p>';
        return;
    }
    
    var student = data.characters.find(function(c) { return String(c.id) === String(selectedGradeStudentId); });
    if (!student) {
        container.innerHTML = '<p class="empty-state">Student not found</p>';
        return;
    }
    
    // Get disciplines available this week
    var disciplines = getAvailableDisciplines(currentGradeWeek);
    if (disciplines.length === 0) {
        container.innerHTML = '<p class="empty-state">No disciplines available for week ' + currentGradeWeek + '</p>';
        summary.innerHTML = '<p class="empty-state">No grades data available</p>';
        return;
    }
    
    // Get student's schedule for this week
    var schedule = getStudentSchedule(selectedGradeStudentId, currentGradeWeek);
    var studentDisciplines = [];
    for (var day in schedule) {
        for (var hour in schedule[day]) {
            var disciplineId = schedule[day][hour];
            if (disciplineId) {
                var d = getDiscipline(disciplineId);
                if (d && studentDisciplines.indexOf(disciplineId) === -1) {
                    studentDisciplines.push(disciplineId);
                }
            }
        }
    }
    
    // Get grades for this student/week
    if (!curriculumData.grades[selectedGradeStudentId]) {
        curriculumData.grades[selectedGradeStudentId] = {};
    }
    if (!curriculumData.grades[selectedGradeStudentId][currentGradeWeek]) {
        curriculumData.grades[selectedGradeStudentId][currentGradeWeek] = {};
    }
    var grades = curriculumData.grades[selectedGradeStudentId][currentGradeWeek];
    
    var html = '<table class="grades-table">';
    html += '<thead><tr>';
    html += '<th>Discipline</th>';
    html += '<th>Weight</th>';
    html += '<th>Score</th>';
    html += '<th>Grade</th>';
    html += '<th>Weighted Score</th>';
    html += '</tr></thead><tbody>';
    
    var totalWeighted = 0;
    var totalWeight = 0;
    
    // Sort disciplines by name
    disciplines.sort(function(a, b) { return a.name.localeCompare(b.name); });
    
    disciplines.forEach(function(d) {
        var isInSchedule = studentDisciplines.indexOf(d.id) !== -1;
        var score = grades[d.id] !== undefined ? grades[d.id] : '';
        var letter = getGradeLetter(d, score);
        var weighted = score && d.weight ? score * d.weight : 0;
        
        if (score && d.weight) {
            totalWeighted += weighted;
            totalWeight += d.weight;
        }
        
        html += '<tr' + (isInSchedule ? '' : ' style="opacity:0.4;"') + '>';
        html += '<td>' + d.name + (isInSchedule ? '' : ' (not scheduled)') + '</td>';
        html += '<td class="weight">' + d.weight + '</td>';
        html += '<td><input type="number" class="grade-input" data-discipline="' + d.id + '" value="' + score + '" min="0" max="100" step="0.1"></td>';
        html += '<td class="grade-letter">' + (letter || '—') + '</td>';
        html += '<td>' + (weighted ? weighted.toFixed(1) : '—') + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    // Add save button
    html += '<div style="margin-top:12px;"><button id="save-grades-btn" class="primary small">Save Grades</button></div>';
    container.innerHTML = html;
    
    // Attach grade change listeners
    container.querySelectorAll('.grade-input').forEach(function(input) {
        input.addEventListener('change', function() {
            var disciplineId = this.dataset.discipline;
            var value = parseFloat(this.value);
            var discipline = getDiscipline(disciplineId);
            var letter = getGradeLetter(discipline, value);
            var row = this.closest('tr');
            row.querySelector('.grade-letter').textContent = letter || '—';
        });
    });
    
    // Save grades button
    container.querySelector('#save-grades-btn').addEventListener('click', function() {
        saveGrades();
    });
    
    // Update summary
    updateGradeSummary();
}

function getGradeLetter(discipline, score) {
    if (!discipline || !discipline.gradingSystem || discipline.gradingSystem.length === 0 || score === undefined || score === null || score === '') {
        return '';
    }
    var numScore = parseFloat(score);
    if (isNaN(numScore)) return '';
    
    // Sort grading system by min value (descending)
    var sorted = discipline.gradingSystem.slice().sort(function(a, b) { return b.min - a.min; });
    
    for (var i = 0; i < sorted.length; i++) {
        var grade = sorted[i];
        if (numScore >= grade.min && numScore <= grade.max) {
            return grade.letter;
        }
    }
    return '';
}

function saveGrades() {
    if (!selectedGradeStudentId) return;
    
    var inputs = document.querySelectorAll('.grade-input');
    var grades = {};
    inputs.forEach(function(input) {
        var disciplineId = input.dataset.discipline;
        var value = parseFloat(input.value);
        if (!isNaN(value)) {
            grades[disciplineId] = value;
        }
    });
    
    if (!curriculumData.grades[selectedGradeStudentId]) {
        curriculumData.grades[selectedGradeStudentId] = {};
    }
    curriculumData.grades[selectedGradeStudentId][currentGradeWeek] = grades;
    
    saveCurriculumData();
    renderGrades();
    logActivity('Saved grades for student week ' + currentGradeWeek);
}

function updateGradeSummary() {
    var summary = document.getElementById('grades-summary-content');
    if (!selectedGradeStudentId) {
        summary.innerHTML = '<p class="empty-state">No grades data available</p>';
        return;
    }
    
    var grades = curriculumData.grades[selectedGradeStudentId] && curriculumData.grades[selectedGradeStudentId][currentGradeWeek] ? 
        curriculumData.grades[selectedGradeStudentId][currentGradeWeek] : {};
    
    var disciplines = getAvailableDisciplines(currentGradeWeek);
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
    
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">';
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Average</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--accent);">' + average.toFixed(1) + '</span></div>';
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Disciplines</span><br><span style="font-size:1.8rem;font-weight:700;color:var(--text);">' + count + '/' + disciplines.length + '</span></div>';
    html += '<div style="background:var(--bg);padding:12px;border-radius:6px;"><span style="color:var(--text-dim);">Status</span><br><span style="font-size:1.8rem;font-weight:700;' + (average >= 70 ? 'color:var(--accent);' : 'color:var(--danger);') + '">' + (average >= 70 ? '✅ Passing' : '⚠️ Needs Work') + '</span></div>';
    html += '</div>';
    
    summary.innerHTML = html;
}

function initGradesEvents() {
    populateStudentSelector('grades-student');
    
    document.getElementById('grades-student').addEventListener('change', function() {
        selectedGradeStudentId = this.value;
        renderGrades();
    });
    
    document.getElementById('prev-grade-week').addEventListener('click', function() {
        if (currentGradeWeek > 1) {
            currentGradeWeek--;
            document.getElementById('grade-week-display').textContent = 'Week ' + currentGradeWeek;
            renderGrades();
        }
    });
    
    document.getElementById('next-grade-week').addEventListener('click', function() {
        if (currentGradeWeek < 52) {
            currentGradeWeek++;
            document.getElementById('grade-week-display').textContent = 'Week ' + currentGradeWeek;
            renderGrades();
        }
    });
    
    // Set initial student
    var select = document.getElementById('grades-student');
    if (select.options.length > 1) {
        select.selectedIndex = 1;
        selectedGradeStudentId = select.value;
        renderGrades();
    }
}
