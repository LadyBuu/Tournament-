// ============================================================
// curriculum-app.js - Curriculum Manager Main Entry Point
// ============================================================

// ---- Wait for data to be loaded ----
function waitForData(callback) {
    if (typeof data !== 'undefined' && data.characters) {
        callback();
        return;
    }
    setTimeout(function() { waitForData(callback); }, 100);
}

// ---- Extend data object with curriculum data ----
function loadCurriculumData() {
    // Wait for data to be available
    waitForData(function() {
        if (!data.curriculum) {
            data.curriculum = {
                disciplines: [],
                schedules: {},
                restDays: {},
                examDays: {},
                grades: {},
                rankings: {},
                currentWeek: 1
            };
        }
        // Copy curriculum data to global variable
        window.curriculumData = data.curriculum;
        
        // Ensure all properties exist
        if (!window.curriculumData.restDays) window.curriculumData.restDays = {};
        if (!window.curriculumData.examDays) window.curriculumData.examDays = {};
        if (!window.curriculumData.schedules) window.curriculumData.schedules = {};
        if (!window.curriculumData.grades) window.curriculumData.grades = {};
        if (!window.curriculumData.rankings) window.curriculumData.rankings = {};
        
        // Initialize the page based on current URL
        initCurriculumPage();
    });
}

// ---- Save curriculum data ----
function saveCurriculumData() {
    if (typeof data !== 'undefined') {
        data.curriculum = window.curriculumData;
        if (typeof saveData === 'function') {
            saveData();
        }
    }
}

// ---- Get students (trainees from character list) ----
function getStudents() {
    if (typeof data === 'undefined' || !data.characters) return [];
    return data.characters.filter(function(c) {
        if (c.deceased) return false;
        var status = getCurrentStatus(c).toLowerCase();
        // Students are trainees, rookies, juniors, or anyone with "student" in their status
        return status === 'trainee' || status === 'rookie' || status === 'junior' || status === 'student';
    }).sort(function(a, b) {
        return a.firstName.localeCompare(b.firstName);
    });
}

// ---- Get instructors ----
function getInstructors() {
    if (typeof data === 'undefined' || !data.characters) return [];
    return data.characters.filter(function(c) {
        if (c.deceased) return false;
        var status = getCurrentStatus(c).toLowerCase();
        return status === 'instructor' || status === 'teacher' || status === 'professor' || status === 'senior';
    }).sort(function(a, b) {
        return a.firstName.localeCompare(b.firstName);
    });
}

// ---- Get discipline by ID ----
function getDiscipline(id) {
    if (!window.curriculumData) return null;
    return window.curriculumData.disciplines.find(function(d) { return String(d.id) === String(id); });
}

// ---- Get available disciplines for a week ----
function getAvailableDisciplines(week) {
    if (!window.curriculumData) return [];
    return window.curriculumData.disciplines.filter(function(d) {
        var start = parseInt(d.startWeek);
        var end = parseInt(d.endWeek);
        return !isNaN(start) && start <= week && (isNaN(end) || end >= week);
    });
}

// ---- Get student schedule for a week ----
function getStudentSchedule(studentId, week) {
    if (!window.curriculumData) return {};
    if (!window.curriculumData.schedules[studentId]) {
        window.curriculumData.schedules[studentId] = {};
    }
    if (!window.curriculumData.schedules[studentId][week]) {
        window.curriculumData.schedules[studentId][week] = {};
    }
    return window.curriculumData.schedules[studentId][week];
}

// ---- Get total hours for a student in a week ----
function getTotalHours(studentId, week) {
    var schedule = getStudentSchedule(studentId, week);
    var total = 0;
    for (var day in schedule) {
        for (var hour in schedule[day]) {
            if (schedule[day][hour]) total++;
        }
    }
    return total;
}

// ---- Get hours used per discipline for a student in a week ----
function getDisciplineHours(studentId, week) {
    var schedule = getStudentSchedule(studentId, week);
    var hours = {};
    for (var day in schedule) {
        for (var hour in schedule[day]) {
            var disciplineId = schedule[day][hour];
            if (disciplineId) {
                if (!hours[disciplineId]) hours[disciplineId] = 0;
                hours[disciplineId]++;
            }
        }
    }
    return hours;
}

// ---- Initialize curriculum page ----
function initCurriculumPage() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    
    // Check if we're in the curriculum folder
    if (page === 'index.html') {
        updateCurriculumDashboard();
    } else if (page === 'disciplines.html') {
        renderDisciplines();
        initDisciplineEvents();
    } else if (page === 'calendar.html') {
        initCalendarEvents();
        renderCalendar();
    } else if (page === 'grades.html') {
        renderGrades();
        initGradesEvents();
    } else if (page === 'ranking.html') {
        renderRanking();
        initRankingEvents();
    }
}

// ---- Update curriculum dashboard ----
function updateCurriculumDashboard() {
    var students = getStudents();
    var instructors = getInstructors();
    
    document.getElementById('student-count').textContent = students.length;
    document.getElementById('instructor-count').textContent = instructors.length;
    document.getElementById('discipline-count').textContent = window.curriculumData.disciplines.length;
    document.getElementById('current-week-display').textContent = window.curriculumData.currentWeek || 1;
    
    // Show today's classes
    var today = new Date().getDay();
    if (today === 0) today = 7; // Convert Sunday from 0 to 7
    var todayClasses = document.getElementById('today-classes');
    var week = window.curriculumData.currentWeek || 1;
    var todayClassesList = [];
    
    students.forEach(function(student) {
        var schedule = getStudentSchedule(student.id, week);
        if (schedule[today]) {
            for (var hour in schedule[today]) {
                var disciplineId = schedule[today][hour];
                if (disciplineId) {
                    var discipline = getDiscipline(disciplineId);
                    if (discipline) {
                        todayClassesList.push({
                            student: student.firstName + ' ' + (student.lastName || ''),
                            discipline: discipline.name,
                            hour: hour,
                            instructor: discipline.instructorName || 'TBD'
                        });
                    }
                }
            }
        }
    });
    
    if (todayClassesList.length === 0) {
        todayClasses.innerHTML = '<p class="empty-state">No classes scheduled for today</p>';
    } else {
        var html = '';
        todayClassesList.forEach(function(cls) {
            html += '<div class="activity-item">' + 
                cls.student + ' - ' + cls.discipline + ' (' + cls.hour + ':00)' +
                ' <span style="font-size:0.75rem;color:var(--text-dim);">' + cls.instructor + '</span>' +
            '</div>';
        });
        todayClasses.innerHTML = html;
    }
    
    // Show upcoming classes (next 7 days)
    var upcoming = document.getElementById('upcoming-classes');
    var upcomingList = [];
    var days = [1, 2, 3, 4, 5, 6, 7];
    
    days.forEach(function(day) {
        if (day <= today) return;
        students.forEach(function(student) {
            var schedule = getStudentSchedule(student.id, week);
            if (schedule[day]) {
                for (var hour in schedule[day]) {
                    var disciplineId = schedule[day][hour];
                    if (disciplineId) {
                        var discipline = getDiscipline(disciplineId);
                        if (discipline) {
                            upcomingList.push({
                                student: student.firstName + ' ' + (student.lastName || ''),
                                discipline: discipline.name,
                                day: day,
                                hour: hour
                            });
                        }
                    }
                }
            }
        });
    });
    
    if (upcomingList.length === 0) {
        upcoming.innerHTML = '<p class="empty-state">No upcoming classes</p>';
    } else {
        var dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        var html = '';
        upcomingList.slice(0, 10).forEach(function(cls) {
            html += '<div class="activity-item">' + 
                dayNames[cls.day] + ' - ' + cls.student + ' - ' + cls.discipline + ' (' + cls.hour + ':00)' +
            '</div>';
        });
        if (upcomingList.length > 10) {
            html += '<div style="font-size:0.75rem;color:var(--text-dim);padding:4px 12px;">... and ' + (upcomingList.length - 10) + ' more</div>';
        }
        upcoming.innerHTML = html;
    }
}

// ---- Set current week ----
function setCurriculumWeek(week) {
    var weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 52) {
        alert('Please enter a valid week number (1-52).');
        return false;
    }
    window.curriculumData.currentWeek = weekNum;
    saveCurriculumData();
    return true;
}

// ---- Initialize on DOM ready ----
document.addEventListener('DOMContentLoaded', function() {
    loadCurriculumData();
});

// ---- Override renderAll for curriculum pages ----
var originalRenderAll = window.renderAll;
window.renderAll = function() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    var isCurriculum = path.indexOf('/curriculum/') !== -1;
    
    if (isCurriculum) {
        loadCurriculumData();
    } else if (typeof originalRenderAll === 'function') {
        originalRenderAll();
    }
};
