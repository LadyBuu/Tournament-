// ============================================================
// calendar.js - Calendar View
// ============================================================

var currentCalendarWeek = 1;
var selectedStudentId = null;

function initCalendarEvents() {
    // Populate student selector
    populateStudentSelector('calendar-student');
    
    document.getElementById('calendar-student').addEventListener('change', function() {
        selectedStudentId = this.value;
        renderCalendar();
    });
    
    document.getElementById('prev-cal-week').addEventListener('click', function() {
        if (currentCalendarWeek > 1) {
            currentCalendarWeek--;
            renderCalendar();
        }
    });
    
    document.getElementById('next-cal-week').addEventListener('click', function() {
        if (currentCalendarWeek < 52) {
            currentCalendarWeek++;
            renderCalendar();
        }
    });
    
    document.getElementById('set-cal-week').addEventListener('click', function() {
        var week = prompt('Enter week number (1-52):', currentCalendarWeek);
        if (week) {
            var w = parseInt(week);
            if (!isNaN(w) && w >= 1 && w <= 52) {
                currentCalendarWeek = w;
                renderCalendar();
            } else {
                alert('Please enter a valid week (1-52).');
            }
        }
    });
    
    document.getElementById('save-rest-days').addEventListener('click', function() {
        saveRestDays();
    });
    
    document.getElementById('export-schedule-btn').addEventListener('click', function() {
        exportSchedule();
    });
    
    // Set initial student
    var select = document.getElementById('calendar-student');
    if (select.options.length > 1) {
        select.selectedIndex = 1;
        selectedStudentId = select.value;
    }
    
    renderCalendar();
}

function populateStudentSelector(id) {
    var select = document.getElementById(id);
    if (!select) return;
    
    var students = getStudents();
    select.innerHTML = '<option value="">Select a student...</option>';
    students.forEach(function(student) {
        var name = [student.firstName, student.lastName].filter(function(n) { return n; }).join(' ');
        var option = document.createElement('option');
        option.value = student.id;
        option.textContent = name;
        select.appendChild(option);
    });
}

function renderCalendar() {
    if (!selectedStudentId) {
        document.querySelector('.calendar-grid').style.display = 'none';
        document.querySelector('.calendar-sidebar').innerHTML = '<p class="empty-state">Please select a student</p>';
        return;
    }
    
    document.querySelector('.calendar-grid').style.display = 'grid';
    
    // Update week display
    document.getElementById('cal-week-display').textContent = 'Week ' + currentCalendarWeek;
    
    // Get rest days and exam days for this week
    var restDays = curriculumData.restDays[currentCalendarWeek] || [];
    var examDays = curriculumData.examDays[currentCalendarWeek] || [];
    
    // Get student schedule
    var schedule = getStudentSchedule(selectedStudentId, currentCalendarWeek);
    
    // Render each day
    var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var hours = [];
    for (var h = 5; h <= 24; h++) {
        hours.push(h);
    }
    
    for (var day = 1; day <= 7; day++) {
        var column = document.querySelector('.day-column[data-day="' + day + '"]');
        var slots = column.querySelector('.day-slots');
        var isRestDay = restDays.indexOf(day) !== -1;
        var isExamDay = examDays.indexOf(day) !== -1;
        
        column.classList.toggle('rest-day', isRestDay);
        column.classList.toggle('exam-day', isExamDay);
        
        slots.innerHTML = '';
        
        hours.forEach(function(hour) {
            var slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.day = day;
            slot.dataset.hour = hour;
            
            var timeLabel = document.createElement('span');
            timeLabel.className = 'slot-time';
            timeLabel.textContent = hour + ':00';
            slot.appendChild(timeLabel);
            
            if (isRestDay || isExamDay) {
                slot.classList.add('empty');
                slot.textContent = isExamDay ? '📝 Exam' : '⛔ Rest';
                slots.appendChild(slot);
                return;
            }
            
            var disciplineId = schedule[day] && schedule[day][hour];
            if (disciplineId) {
                var discipline = getDiscipline(disciplineId);
                if (discipline) {
                    slot.classList.add('occupied');
                    var label = document.createElement('span');
                    label.className = 'slot-label';
                    label.textContent = discipline.name;
                    slot.appendChild(label);
                    
                    slot.title = discipline.name + ' (Click for details)';
                    slot.addEventListener('click', function() {
                        showClassDetails(selectedStudentId, disciplineId, currentCalendarWeek, day, hour);
                    });
                    
                    // Right click to remove
                    slot.addEventListener('contextmenu', function(e) {
                        e.preventDefault();
                        if (confirm('Remove this class from the schedule?')) {
                            removeClassFromSchedule(selectedStudentId, currentCalendarWeek, day, hour);
                        }
                    });
                }
            } else {
                slot.classList.add('empty');
                slot.textContent = '➕';
                slot.title = 'Click to add class';
                slot.addEventListener('click', function() {
                    showAddClassModal(selectedStudentId, currentCalendarWeek, day, hour);
                });
            }
            
            slots.appendChild(slot);
        });
    }
    
    // Update sidebar
    updateSidebar();
}

function updateSidebar() {
    // Week overview
    var overview = document.getElementById('week-overview');
    var schedule = getStudentSchedule(selectedStudentId, currentCalendarWeek);
    var totalHours = 0;
    var classes = [];
    
    for (var day in schedule) {
        for (var hour in schedule[day]) {
            var disciplineId = schedule[day][hour];
            if (disciplineId) {
                var discipline = getDiscipline(disciplineId);
                if (discipline) {
                    classes.push({
                        day: parseInt(day),
                        hour: parseInt(hour),
                        discipline: discipline.name,
                        disciplineId: disciplineId
                    });
                    totalHours++;
                }
            }
        }
    }
    
    if (classes.length === 0) {
        overview.innerHTML = '<p class="empty-state">No classes scheduled</p>';
    } else {
        var dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        var html = '';
        classes.sort(function(a, b) {
            if (a.day !== b.day) return a.day - b.day;
            return a.hour - b.hour;
        });
        classes.forEach(function(cls) {
            html += '<div class="activity-item" style="font-size:0.75rem;padding:4px 8px;">' +
                dayNames[cls.day] + ' ' + cls.hour + ':00 - ' + cls.discipline +
            '</div>';
        });
        overview.innerHTML = html;
    }
    
    // Available disciplines
    var availContainer = document.getElementById('available-disciplines');
    var available = getAvailableDisciplines(currentCalendarWeek);
    
    if (available.length === 0) {
        availContainer.innerHTML = '<p class="empty-state">No disciplines available this week</p>';
    } else {
        var disciplineHours = getDisciplineHours(selectedStudentId, currentCalendarWeek);
        var html = '';
        available.sort(function(a, b) { return a.name.localeCompare(b.name); });
        available.forEach(function(d) {
            var used = disciplineHours[d.id] || 0;
            var total = d.weeklyHours || 1;
            var isFull = used >= total;
            var instructor = data.characters.find(function(c) { return String(c.id) === String(d.instructorId); });
            var instructorName = instructor ? instructor.firstName : 'TBD';
            
            html += '<div class="available-discipline' + (isFull ? ' full' : '') + '">' +
                '<span>' + d.name + ' (' + instructorName + ')</span>' +
                '<span class="hours">' + used + '/' + total + 'h</span>' +
            '</div>';
        });
        availContainer.innerHTML = html;
    }
    
    // Hours used
    var total = document.getElementById('total-hours');
    var used = document.getElementById('used-hours');
    var totalHoursCalc = 0;
    var available = getAvailableDisciplines(currentCalendarWeek);
    available.forEach(function(d) {
        totalHoursCalc += d.weeklyHours || 0;
    });
    total.textContent = totalHoursCalc;
    used.textContent = classes.length;
}

function showAddClassModal(studentId, week, day, hour) {
    var available = getAvailableDisciplines(week);
    var disciplineHours = getDisciplineHours(studentId, week);
    
    // Filter disciplines that aren't full
    var availableFiltered = available.filter(function(d) {
        var used = disciplineHours[d.id] || 0;
        var total = d.weeklyHours || 1;
        return used < total;
    });
    
    if (availableFiltered.length === 0) {
        alert('All disciplines are full for this week.');
        return;
    }
    
    // Create modal
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <h3>Add Class - Week ${week}, Day ${day}, ${hour}:00</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Select Discipline:</label>
                    <select id="add-class-discipline" style="width:100%;padding:8px;">
                        ${availableFiltered.map(function(d) {
                            var used = disciplineHours[d.id] || 0;
                            var total = d.weeklyHours || 1;
                            var instructor = data.characters.find(function(c) { return String(c.id) === String(d.instructorId); });
                            var instructorName = instructor ? instructor.firstName : 'TBD';
                            return '<option value="' + d.id + '">' + d.name + ' (' + instructorName + ') - ' + used + '/' + total + 'h</option>';
                        }).join('')}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-add-class" class="secondary">Cancel</button>
                    <button type="button" id="confirm-add-class" class="primary">Add Class</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#cancel-add-class').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#confirm-add-class').onclick = function() {
        var disciplineId = document.getElementById('add-class-discipline').value;
        if (!disciplineId) { alert('Please select a discipline.'); return; }
        
        // Check if slot is already taken
        var schedule = getStudentSchedule(studentId, week);
        if (schedule[day] && schedule[day][hour]) {
            alert('This slot is already occupied.');
            modal.remove();
            return;
        }
        
        if (!schedule[day]) schedule[day] = {};
        schedule[day][hour] = disciplineId;
        
        saveCurriculumData();
        modal.remove();
        renderCalendar();
        logActivity('Added class to student schedule');
    };
}

function showClassDetails(studentId, disciplineId, week, day, hour) {
    var discipline = getDiscipline(disciplineId);
    if (!discipline) return;
    
    var instructor = data.characters.find(function(c) { return String(c.id) === String(discipline.instructorId); });
    var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Not assigned';
    
    // Find other students in this class
    var otherStudents = [];
    var students = getStudents();
    students.forEach(function(student) {
        if (String(student.id) === String(studentId)) return;
        var schedule = getStudentSchedule(student.id, week);
        if (schedule[day] && String(schedule[day][hour]) === String(disciplineId)) {
            otherStudents.push([student.firstName, student.lastName].filter(function(n) { return n; }).join(' '));
        }
    });
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <div class="modal-header">
                <h3>${discipline.name}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-row"><span class="label">Instructor:</span> <span>${instructorName}</span></div>
                <div class="detail-row"><span class="label">Curriculum:</span> <span>${discipline.curriculum || 'N/A'}</span></div>
                <div class="detail-row"><span class="label">Week:</span> <span>${week}</span></div>
                <div class="detail-row"><span class="label">Day/Time:</span> <span>${['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day]} at ${hour}:00</span></div>
                <div class="detail-row"><span class="label">Students:</span> <span>${otherStudents.length > 0 ? otherStudents.join(', ') : 'Only this student'}</span></div>
                <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" id="remove-class-btn" class="danger small">Remove from Schedule</button>
                    <button type="button" id="close-detail-btn" class="secondary small">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = function() { modal.remove(); };
    modal.querySelector('#close-detail-btn').onclick = function() { modal.remove(); };
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    modal.querySelector('#remove-class-btn').onclick = function() {
        if (confirm('Remove this class from the schedule?')) {
            removeClassFromSchedule(studentId, week, day, hour);
            modal.remove();
        }
    };
}

function removeClassFromSchedule(studentId, week, day, hour) {
    var schedule = getStudentSchedule(studentId, week);
    if (schedule[day] && schedule[day][hour]) {
        delete schedule[day][hour];
        saveCurriculumData();
        renderCalendar();
        logActivity('Removed class from schedule');
    }
}

function saveRestDays() {
    var checkboxes = document.querySelectorAll('.rest-day');
    var restDays = [];
    checkboxes.forEach(function(cb) {
        if (cb.checked) {
            restDays.push(parseInt(cb.dataset.day));
        }
    });
    curriculumData.restDays[currentCalendarWeek] = restDays;
    saveCurriculumData();
    renderCalendar();
    logActivity('Saved rest days for week ' + currentCalendarWeek);
}

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
    var table = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">';
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
    win.document.write('<html><head><title>Schedule - ' + studentName + ' Week ' + currentCalendarWeek + '</title></head><body>');
    win.document.write('<h2>Schedule for ' + studentName + ' - Week ' + currentCalendarWeek + '</h2>');
    win.document.write(table);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}
