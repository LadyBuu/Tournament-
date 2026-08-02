// ============================================================
// export.js - Curriculum Export Functions
// ============================================================

// ---- Export schedule to table (for Word) ----
function exportSchedule() {
    if (!selectedStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var student = data.characters.find(function(c) { return String(c.id) === String(selectedStudentId); });
    var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    var schedule = getStudentSchedule(selectedStudentId, currentCalendarWeek);
    var restDays = curriculumData.restDays[currentCalendarWeek] || [];
    var examDays = curriculumData.examDays[currentCalendarWeek] || [];
    
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var hours = [];
    for (var h = 5; h <= 24; h++) {
        hours.push(h);
    }
    
    // Build table
    var table = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;width:100%;">';
    table += '<tr><th style="background:#eee;">Hour</th>';
    for (var d = 1; d <= 7; d++) {
        var isRest = restDays.indexOf(d) !== -1;
        var isExam = examDays.indexOf(d) !== -1;
        var label = dayNames[d];
        if (isRest) label += ' (Rest)';
        if (isExam) label += ' (Exam)';
        table += '<th style="background:#eee;">' + label + '</th>';
    }
    table += '</tr>';
    
    hours.forEach(function(hour) {
        var timeLabel = hour + ':00';
        if (hour === 24) timeLabel = '00:00';
        table += '<tr><td style="font-weight:bold;">' + timeLabel + '</td>';
        for (var d = 1; d <= 7; d++) {
            var isRest = restDays.indexOf(d) !== -1;
            var isExam = examDays.indexOf(d) !== -1;
            var cell = '';
            if (isRest) {
                cell = '⛔ Rest';
            } else if (isExam) {
                cell = '📝 Exam';
            } else if (schedule[d] && schedule[d][hour]) {
                var discipline = getDiscipline(schedule[d][hour]);
                if (discipline) {
                    var instructor = data.characters.find(function(c) { return String(c.id) === String(discipline.instructorId); });
                    var instructorName = instructor ? instructor.firstName : 'TBD';
                    cell = discipline.name + ' (' + instructorName + ')';
                } else {
                    cell = '—';
                }
            } else {
                cell = '—';
            }
            table += '<td>' + cell + '</td>';
        }
        table += '</tr>';
    });
    table += '</table>';
    
    // Create a new window for printing
    var win = window.open('', '_blank');
    win.document.write('<html><head><title>Schedule - ' + studentName + ' Week ' + currentCalendarWeek + '</title>');
    win.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;}h2{color:#333;}th{background:#f5f5f5;}</style>');
    win.document.write('</head><body>');
    win.document.write('<h2>Schedule for ' + studentName + ' - Week ' + currentCalendarWeek + '</h2>');
    win.document.write(table);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}

// ---- Export all grades for a student ----
function exportGrades() {
    if (!selectedGradeStudentId) {
        alert('Please select a student first.');
        return;
    }
    
    var student = data.characters.find(function(c) { return String(c.id) === String(selectedGradeStudentId); });
    var studentName = student ? [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ') : 'Unknown';
    
    var weeks = [];
    for (var w = 1; w <= 52; w++) {
        weeks.push(w);
    }
    
    var disciplines = curriculumData.disciplines;
    var grades = curriculumData.grades[selectedGradeStudentId] || {};
    
    // Build table
    var table = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11px;width:100%;">';
    table += '<tr><th style="background:#eee;">Discipline</th>';
    weeks.forEach(function(w) {
        table += '<th style="background:#eee;">Wk ' + w + '</th>';
    });
    table += '<th style="background:#eee;">Avg</th></tr>';
    
    disciplines.forEach(function(d) {
        table += '<tr><td style="font-weight:bold;">' + d.name + '</td>';
        var total = 0;
        var count = 0;
        weeks.forEach(function(w) {
            var score = grades[w] && grades[w][d.id] !== undefined ? grades[w][d.id] : '';
            table += '<td>' + (score !== '' ? score : '—') + '</td>';
            if (score !== '') {
                total += parseFloat(score);
                count++;
            }
        });
        var avg = count > 0 ? total / count : 0;
        table += '<td style="font-weight:bold;color:var(--accent);">' + (count > 0 ? avg.toFixed(1) : '—') + '</td>';
        table += '</tr>';
    });
    table += '</table>';
    
    var win = window.open('', '_blank');
    win.document.write('<html><head><title>Grades - ' + studentName + '</title>');
    win.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;}h2{color:#333;}th{background:#f5f5f5;}</style>');
    win.document.write('</head><body>');
    win.document.write('<h2>Grades for ' + studentName + '</h2>');
    win.document.write(table);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}
