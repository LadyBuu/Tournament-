// ============================================================
// disciplines.js - Discipline Management
// ============================================================

function renderDisciplines() {
    var container = document.getElementById('disciplines-container');
    if (!container) return;
    
    // Ensure curriculumData exists
    if (!window.curriculumData) {
        window.curriculumData = { disciplines: [], schedules: {}, restDays: {}, examDays: {}, grades: {}, rankings: {}, currentWeek: 1 };
    }
    
    if (window.curriculumData.disciplines.length === 0) {
        container.innerHTML = '<p class="empty-state">No disciplines created yet. Add your first discipline!</p>';
        return;
    }
    
    var html = '';
    window.curriculumData.disciplines.forEach(function(d) {
        var instructor = data.characters ? data.characters.find(function(c) { return String(c.id) === String(d.instructorId); }) : null;
        var instructorName = instructor ? [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ') : 'Not assigned';
        var weekDisplay = d.startWeek ? 'Wk ' + d.startWeek : '?';
        if (d.endWeek) weekDisplay += ' - Wk ' + d.endWeek;
        
        html += '<div class="list-item" data-id="' + d.id + '">' +
            '<span><strong>' + d.name + '</strong></span>' +
            '<span>' + instructorName + '</span>' +
            '<span>' + weekDisplay + '</span>' +
            '<span>' + (d.weeklyHours || '-') + 'h</span>' +
            '<span>' + (d.maxStudents || '-') + '</span>' +
            '<span class="actions">' +
                '<button class="small edit-discipline" data-id="' + d.id + '">✎</button>' +
                '<button class="small danger delete-discipline" data-id="' + d.id + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    
    container.querySelectorAll('.edit-discipline').forEach(function(btn) {
        btn.addEventListener('click', function() { editDiscipline(btn.dataset.id); });
    });
    container.querySelectorAll('.delete-discipline').forEach(function(btn) {
        btn.addEventListener('click', function() { deleteDiscipline(btn.dataset.id); });
    });
}

function showDisciplineForm(editId) {
    console.log('showDisciplineForm called', editId);
    
    // Ensure curriculumData exists
    if (!window.curriculumData) {
        window.curriculumData = { disciplines: [], schedules: {}, restDays: {}, examDays: {}, grades: {}, rankings: {}, currentWeek: 1 };
    }
    
    var form = document.getElementById('discipline-form');
    if (!form) {
        console.error('Discipline form not found');
        return;
    }
    
    var title = document.getElementById('discipline-form-title');
    var formElement = document.getElementById('discipline-form-inner');
    
    form.classList.remove('hidden');
    form.style.display = 'block';
    
    // Populate instructors
    var select = document.getElementById('discipline-instructor');
    if (select) {
        select.innerHTML = '<option value="">Select instructor...</option>';
        var instructors = getInstructors();
        if (instructors && instructors.length > 0) {
            instructors.forEach(function(instructor) {
                var name = [instructor.firstName, instructor.lastName].filter(function(n) { return n; }).join(' ');
                var option = document.createElement('option');
                option.value = instructor.id;
                option.textContent = name;
                select.appendChild(option);
            });
        }
    }
    
    if (editId) {
        title.textContent = 'Edit Discipline';
        var discipline = window.curriculumData.disciplines.find(function(d) { return String(d.id) === String(editId); });
        if (discipline) {
            document.getElementById('discipline-name').value = discipline.name || '';
            document.getElementById('discipline-curriculum').value = discipline.curriculum || '';
            document.getElementById('discipline-start-week').value = discipline.startWeek || '';
            document.getElementById('discipline-end-week').value = discipline.endWeek || '';
            document.getElementById('discipline-hours').value = discipline.weeklyHours || '';
            if (select) select.value = discipline.instructorId || '';
            document.getElementById('discipline-students').value = discipline.maxStudents || '';
            document.getElementById('discipline-weight').value = discipline.weight || 1;
            
            // Grading system
            var container = document.getElementById('grading-system-container');
            container.innerHTML = '';
            if (discipline.gradingSystem && discipline.gradingSystem.length > 0) {
                discipline.gradingSystem.forEach(function(g) {
                    addGradingEntry(container, g.letter, g.min, g.max);
                });
            } else {
                addGradingEntry(container);
            }
            
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Discipline';
        formElement.reset();
        document.getElementById('discipline-weight').value = 1;
        var container = document.getElementById('grading-system-container');
        container.innerHTML = '';
        addGradingEntry(container);
        delete formElement.dataset.editId;
    }
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
}

function addGradingEntry(container, letter, min, max) {
    var entry = document.createElement('div');
    entry.className = 'grading-entry';
    entry.innerHTML = `
        <input type="text" class="grading-letter" placeholder="Letter" value="${letter || ''}" style="width:80px;">
        <input type="number" class="grading-min" placeholder="Min %" value="${min || ''}" style="width:80px;" min="0" max="100">
        <input type="number" class="grading-max" placeholder="Max %" value="${max || ''}" style="width:80px;" min="0" max="100">
        <button type="button" class="small danger remove-grading">✕</button>
    `;
    container.appendChild(entry);
    entry.querySelector('.remove-grading').onclick = function() {
        if (container.children.length > 1) entry.remove();
        else alert('You need at least one grade level.');
    };
}

function hideDisciplineForm() {
    var form = document.getElementById('discipline-form');
    if (form) {
        form.classList.add('hidden');
        form.style.display = 'none';
    }
}

function saveDiscipline(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    
    // Collect grading system
    var gradingSystem = [];
    var gradingEntries = document.querySelectorAll('.grading-entry');
    gradingEntries.forEach(function(entry) {
        var letter = entry.querySelector('.grading-letter').value.trim();
        var min = entry.querySelector('.grading-min').value;
        var max = entry.querySelector('.grading-max').value;
        if (letter && min && max) {
            gradingSystem.push({ letter: letter, min: parseFloat(min), max: parseFloat(max) });
        }
    });
    
    var disciplineData = {
        name: document.getElementById('discipline-name').value.trim(),
        curriculum: document.getElementById('discipline-curriculum').value.trim(),
        startWeek: document.getElementById('discipline-start-week').value || '',
        endWeek: document.getElementById('discipline-end-week').value || '',
        weeklyHours: parseFloat(document.getElementById('discipline-hours').value) || '',
        instructorId: document.getElementById('discipline-instructor').value || '',
        maxStudents: parseInt(document.getElementById('discipline-students').value) || '',
        weight: parseFloat(document.getElementById('discipline-weight').value) || 1,
        gradingSystem: gradingSystem
    };
    
    if (!disciplineData.name) { alert('Discipline name is required.'); return; }
    
    if (!window.curriculumData) {
        window.curriculumData = { disciplines: [], schedules: {}, restDays: {}, examDays: {}, grades: {}, rankings: {}, currentWeek: 1 };
    }
    
    if (editId) {
        var index = window.curriculumData.disciplines.findIndex(function(d) { return String(d.id) === String(editId); });
        if (index !== -1) {
            window.curriculumData.disciplines[index] = Object.assign({}, window.curriculumData.disciplines[index], disciplineData);
            curriculumLog('Updated discipline: ' + disciplineData.name);
        }
    } else {
        var newDiscipline = {
            id: generateId(),
            name: disciplineData.name,
            curriculum: disciplineData.curriculum,
            startWeek: disciplineData.startWeek,
            endWeek: disciplineData.endWeek,
            weeklyHours: disciplineData.weeklyHours,
            instructorId: disciplineData.instructorId,
            maxStudents: disciplineData.maxStudents,
            weight: disciplineData.weight,
            gradingSystem: disciplineData.gradingSystem,
            createdAt: new Date().toISOString()
        };
        window.curriculumData.disciplines.push(newDiscipline);
        curriculumLog('Added discipline: ' + disciplineData.name);
    }
    
    saveCurriculumData();
    renderDisciplines();
    hideDisciplineForm();
}

function editDiscipline(id) {
    showDisciplineForm(id);
}

function deleteDiscipline(id) {
    if (!confirm('Delete this discipline permanently? This will remove it from all schedules.')) return;
    
    var discipline = window.curriculumData.disciplines.find(function(d) { return String(d.id) === String(id); });
    if (!discipline) return;
    
    // Remove from all schedules
    for (var studentId in window.curriculumData.schedules) {
        for (var week in window.curriculumData.schedules[studentId]) {
            var schedule = window.curriculumData.schedules[studentId][week];
            for (var day in schedule) {
                for (var hour in schedule[day]) {
                    if (String(schedule[day][hour]) === String(id)) {
                        delete schedule[day][hour];
                    }
                }
            }
        }
    }
    
    window.curriculumData.disciplines = window.curriculumData.disciplines.filter(function(d) { return String(d.id) !== String(id); });
    curriculumLog('Deleted discipline: ' + discipline.name);
    saveCurriculumData();
    renderDisciplines();
}

function initDisciplineEvents() {
    console.log('initDisciplineEvents called');
    
    var addBtn = document.getElementById('add-discipline-btn');
    if (addBtn) {
        // Remove existing listeners by cloning
        var newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.addEventListener('click', function(e) {
            console.log('Add discipline button clicked');
            showDisciplineForm();
        });
    }
    
    var cancelBtn = document.getElementById('cancel-discipline-btn');
    if (cancelBtn) {
        var newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', hideDisciplineForm);
    }
    
    var form = document.getElementById('discipline-form-inner');
    if (form) {
        // Remove existing listeners
        var newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', saveDiscipline);
    }
    
    var addGradingBtn = document.getElementById('add-grading-btn');
    if (addGradingBtn) {
        var newGradingBtn = addGradingBtn.cloneNode(true);
        addGradingBtn.parentNode.replaceChild(newGradingBtn, addGradingBtn);
        newGradingBtn.addEventListener('click', function() {
            var container = document.getElementById('grading-system-container');
            if (container) addGradingEntry(container);
        });
    }
}
