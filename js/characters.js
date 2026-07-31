// ============================================================
// characters.js - Character Management
// ============================================================

function addCareerStatusEntry(container, status, startYear, endYear) {
    var entry = document.createElement('div');
    entry.className = 'career-status-entry';
    entry.innerHTML = `
        <select class="career-status-select">
            <option value="">Select status...</option>
            <option value="civilian" ${status === 'civilian' ? 'selected' : ''}>Civilian</option>
            <option value="trainee" ${status === 'trainee' ? 'selected' : ''}>Trainee</option>
            <option value="rookie" ${status === 'rookie' ? 'selected' : ''}>Rookie</option>
            <option value="junior" ${status === 'junior' ? 'selected' : ''}>Junior</option>
            <option value="senior" ${status === 'senior' ? 'selected' : ''}>Senior</option>
            <option value="instructor" ${status === 'instructor' ? 'selected' : ''}>Instructor</option>
            <option value="support" ${status === 'support' ? 'selected' : ''}>Support</option>
        </select>
        <input type="number" class="career-start-year" placeholder="Start Year" value="${startYear || ''}">
        <input type="number" class="career-end-year" placeholder="End Year (or leave blank)" value="${endYear || ''}">
        <button type="button" class="small danger remove-status">✕</button>
    `;
    container.appendChild(entry);
    var select = entry.querySelector('.career-status-select');
    var specialtyField = document.getElementById('specialty-field');
    select.onchange = function() {
        if (specialtyField) {
            specialtyField.style.display = (this.value === 'instructor' || this.value === 'support') ? 'block' : 'none';
        }
    };
    entry.querySelector('.remove-status').onclick = function() {
        if (container.children.length > 1) entry.remove();
        else alert('You need at least one status entry.');
    };
}

function showCharacterForm(editId) {
    var form = document.getElementById('character-form');
    var title = document.getElementById('form-title');
    var formElement = document.getElementById('char-form');
    form.classList.remove('hidden');
    var deceasedCheckbox = document.getElementById('char-deceased');
    var deathFields = document.getElementById('death-fields');
    if (deceasedCheckbox) {
        deceasedCheckbox.onchange = function() {
            if (deathFields) deathFields.style.display = this.checked ? 'block' : 'none';
        };
    }
    if (editId) {
        title.textContent = 'Edit Character';
        var char = data.characters.find(function(c) { return c.id === editId; });
        if (char) {
            document.getElementById('char-firstname').value = char.firstName || '';
            document.getElementById('char-middlename').value = char.middleName || '';
            document.getElementById('char-lastname').value = char.lastName || '';
            document.getElementById('char-birthyear').value = char.birthYear || '';
            document.getElementById('char-gender').value = char.gender || '';
            document.getElementById('char-associated-names').value = char.associatedNames || '';
            document.getElementById('char-eyes').value = char.eyes || '';
            document.getElementById('char-hair').value = char.hair || '';
            document.getElementById('char-skin').value = char.skin || '';
            document.getElementById('char-height').value = char.height || '';
            document.getElementById('char-build').value = char.build || '';
            document.getElementById('char-appearance-notes').value = char.appearanceNotes || '';
            document.getElementById('char-notes').value = char.notes || '';
            document.getElementById('char-specialty').value = char.specialty || '';
            document.getElementById('char-deceased').checked = char.deceased || false;
            document.getElementById('char-death-year').value = char.deathYear || '';
            document.getElementById('char-death-cause').value = char.deathCause || '';
            document.getElementById('char-death-age').value = char.deathAge || '';
            if (deathFields) deathFields.style.display = char.deceased ? 'block' : 'none';
            var container = document.getElementById('career-status-container');
            container.innerHTML = '';
            if (char.careerStatus && char.careerStatus.length > 0) {
                char.careerStatus.forEach(function(status) { 
                    addCareerStatusEntry(container, status.status, status.startYear, status.endYear); 
                });
            } else { addCareerStatusEntry(container); }
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Character';
        formElement.reset();
        delete formElement.dataset.editId;
        if (deathFields) deathFields.style.display = 'none';
        var container = document.getElementById('career-status-container');
        container.innerHTML = '';
        addCareerStatusEntry(container);
        document.getElementById('char-specialty').value = '';
        var specialtyField = document.getElementById('specialty-field');
        if (specialtyField) specialtyField.style.display = 'none';
    }
    document.getElementById('char-form').scrollIntoView({ behavior: 'smooth' });
}

function hideCharacterForm() {
    document.getElementById('character-form').classList.add('hidden');
}

function saveCharacter(e) {
    e.preventDefault();
    var form = e.target;
    var editId = form.dataset.editId;
    var isDeceased = document.getElementById('char-deceased').checked;
    var deathYear = document.getElementById('char-death-year').value.trim();
    var deathCause = document.getElementById('char-death-cause').value.trim();
    var deathAge = document.getElementById('char-death-age').value.trim();
    var careerStatus = [];
    var statusEntries = document.querySelectorAll('.career-status-entry');
    statusEntries.forEach(function(entry) {
        var select = entry.querySelector('.career-status-select');
        var startInput = entry.querySelector('.career-start-year');
        var endInput = entry.querySelector('.career-end-year');
        if (select.value) {
            careerStatus.push({ 
                status: select.value, 
                startYear: startInput.value || '', 
                endYear: endInput.value || '' 
            });
        }
    });
    var charData = {
        firstName: document.getElementById('char-firstname').value.trim(),
        middleName: document.getElementById('char-middlename').value.trim(),
        lastName: document.getElementById('char-lastname').value.trim(),
        birthYear: document.getElementById('char-birthyear').value || '',
        gender: document.getElementById('char-gender').value.trim(),
        associatedNames: document.getElementById('char-associated-names').value.trim(),
        eyes: document.getElementById('char-eyes').value.trim(),
        hair: document.getElementById('char-hair').value.trim(),
        skin: document.getElementById('char-skin').value.trim(),
        height: document.getElementById('char-height').value.trim(),
        build: document.getElementById('char-build').value.trim(),
        appearanceNotes: document.getElementById('char-appearance-notes').value.trim(),
        notes: document.getElementById('char-notes').value.trim(),
        deceased: isDeceased,
        deathYear: deathYear,
        deathCause: deathCause,
        deathAge: deathAge,
        careerStatus: careerStatus,
        specialty: document.getElementById('char-specialty').value.trim(),
        eliminatedWeeks: []
    };
    if (!charData.firstName) { alert('First name is required.'); return; }
    if (isDeceased) {
        if (!deathYear && !deathAge) { 
            alert('Please enter either Death Year or Death Age for deceased characters.'); 
            return; 
        }
        if (!deathAge && deathYear && charData.birthYear) {
            var birthYear = parseInt(charData.birthYear);
            var dYear = parseInt(deathYear);
            if (!isNaN(birthYear) && !isNaN(dYear)) {
                charData.deathAge = String(dYear - birthYear);
            }
        }
    }
    if (editId) {
        var index = data.characters.findIndex(function(c) { return c.id === editId; });
        if (index !== -1) {
            if (!charData.deathAge && data.characters[index].deathAge) {
                charData.deathAge = data.characters[index].deathAge;
            }
            if (!charData.eliminatedWeeks) charData.eliminatedWeeks = [];
            data.characters[index] = Object.assign({}, data.characters[index], charData);
            logActivity('Updated character: ' + charData.firstName);
        }
    } else {
        var newChar = { 
            id: generateId(), 
            firstName: charData.firstName, 
            middleName: charData.middleName, 
            lastName: charData.lastName,
            birthYear: charData.birthYear, 
            gender: charData.gender, 
            associatedNames: charData.associatedNames,
            eyes: charData.eyes, 
            hair: charData.hair, 
            skin: charData.skin, 
            height: charData.height, 
            build: charData.build,
            appearanceNotes: charData.appearanceNotes, 
            notes: charData.notes, 
            deceased: charData.deceased,
            deathYear: charData.deathYear, 
            deathCause: charData.deathCause, 
            deathAge: charData.deathAge,
            careerStatus: charData.careerStatus, 
            specialty: charData.specialty, 
            eliminatedWeeks: [], 
            createdAt: new Date().toISOString() 
        };
        data.characters.push(newChar);
        logActivity('Added character: ' + charData.firstName);
    }
    saveData().catch(function(err) { 
        console.error('Failed to save:', err); 
        alert('Failed to save character. Please check console for details.'); 
    });
    renderCharacters();
    updateDashboard();
    hideCharacterForm();
}

function editCharacter(id) { 
    showCharacterForm(id); 
}

function deleteCharacter(id) {
    if (!confirm('Delete this character permanently? This will remove them from all teams.')) return;
    var char = data.characters.find(function(c) { return c.id === id; });
    if (!char) return;
    data.teams.forEach(function(team) {
        if (team.members) {
            team.members = team.members.filter(function(m) { return m.characterId !== id; });
        }
    });
    data.characters = data.characters.filter(function(c) { return c.id !== id; });
    logActivity('Deleted character: ' + char.firstName);
    saveData().catch(function(err) { console.error('Failed to save:', err); });
    renderCharacters();
    updateDashboard();
}

function renderCharacters() {
    var container = document.getElementById('characters-container');
    if (!container) return;
    if (data.characters.length === 0) {
        container.innerHTML = '<p class="empty-state">No characters created yet. Add your first character!</p>';
        return;
    }
    var sortedChars = data.characters.slice().sort(function(a, b) {
        if (a.deceased && !b.deceased) return 1;
        if (!a.deceased && b.deceased) return -1;
        return (a.firstName || '').toLowerCase().localeCompare((b.firstName || '').toLowerCase());
    });
    var html = '';
    sortedChars.forEach(function(char) {
        var fullName = [char.firstName, char.middleName, char.lastName].filter(function(n) { return n; }).join(' ');
        var age = calculateAge(char);
        var ageDisplay = age !== null ? age + ' yrs' : '-';
        var status = getCurrentStatus(char);
        var teamCount = getCharacterTeamCount(char.id);
        var isDead = char.deceased || false;
        var deadClass = isDead ? ' deceased' : '';
        var deadBadge = isDead ? ' <span class="deceased-badge">💀 Deceased</span>' : '';
        html += '<div class="list-item' + deadClass + '" data-id="' + char.id + '">' +
            '<span><strong>' + fullName + '</strong>' + deadBadge + '</span>' +
            '<span>' + ageDisplay + '</span>' +
            '<span>' + status + '</span>' +
            '<span>' + teamCount + '</span>' +
            '<span class="actions">' +
                '<button class="small edit-character" data-id="' + char.id + '">✎</button>' +
                '<button class="small danger delete-character" data-id="' + char.id + '">✕</button>' +
            '</span>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.edit-character').forEach(function(btn) {
        btn.addEventListener('click', function(e) { 
            e.stopPropagation(); 
            editCharacter(btn.dataset.id); 
        });
    });
    container.querySelectorAll('.delete-character').forEach(function(btn) {
        btn.addEventListener('click', function(e) { 
            e.stopPropagation(); 
            deleteCharacter(btn.dataset.id); 
        });
    });
}

function initCharacterEvents() {
    document.getElementById('add-character-btn').addEventListener('click', function() { 
        showCharacterForm(); 
    });
    document.getElementById('cancel-char-btn').addEventListener('click', hideCharacterForm);
    document.getElementById('char-form').addEventListener('submit', saveCharacter);
    document.getElementById('add-status-btn').addEventListener('click', function() {
        var container = document.getElementById('career-status-container');
        addCareerStatusEntry(container);
    });
}
