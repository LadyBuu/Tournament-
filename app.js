Here are all the complete files for the Tournament Manager application:

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournament Manager - Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>Tournament <span>Manager</span></h1>
        <nav>
            <a href="index.html" class="active">Dashboard</a>
            <a href="characters.html">Characters</a>
            <a href="teams.html">Teams</a>
            <a href="tournaments.html">Tournaments</a>
        </nav>
        <div class="header-actions">
            <button id="export-json-btn" class="small">Export JSON</button>
            <button id="import-json-btn" class="small">Import JSON</button>
            <button id="export-csv-btn" class="small">Export CSV</button>
            <button id="import-csv-btn" class="small">Import CSV</button>
            <button id="template-csv-btn" class="small">Template CSV</button>
            <input type="file" id="json-file-input" accept=".json" style="display:none">
            <input type="file" id="csv-file-input" accept=".csv" style="display:none">
        </div>
    </header>

    <main class="dashboard">
        <section class="stats-grid">
            <div class="stat-card">
                <h3>Characters</h3>
                <p class="stat-number" id="char-count">0</p>
                <a href="characters.html" class="stat-link">Manage →</a>
            </div>
            <div class="stat-card">
                <h3>Teams</h3>
                <p class="stat-number" id="team-count">0</p>
                <a href="teams.html" class="stat-link">Manage →</a>
            </div>
            <div class="stat-card">
                <h3>Active Tournaments</h3>
                <p class="stat-number" id="tournament-count">0</p>
                <a href="tournaments.html" class="stat-link">Manage →</a>
            </div>
        </section>

        <section class="recent-activity">
            <h2>Recent Activity</h2>
            <div id="activity-log">
                <p class="empty-state">No recent activity</p>
            </div>
        </section>
    </main>

    <script src="app.js"></script>
</body>
</html>
```

## characters.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournament Manager - Characters</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>Tournament <span>Manager</span></h1>
        <nav>
            <a href="index.html">Dashboard</a>
            <a href="characters.html" class="active">Characters</a>
            <a href="teams.html">Teams</a>
            <a href="tournaments.html">Tournaments</a>
        </nav>
        <div class="header-actions">
            <button id="export-json-btn" class="small">Export JSON</button>
            <button id="import-json-btn" class="small">Import JSON</button>
            <button id="export-csv-btn" class="small">Export CSV</button>
            <button id="import-csv-btn" class="small">Import CSV</button>
            <button id="template-csv-btn" class="small">Template CSV</button>
            <input type="file" id="json-file-input" accept=".json" style="display:none">
            <input type="file" id="csv-file-input" accept=".csv" style="display:none">
        </div>
    </header>

    <main class="characters-page">
        <div class="page-header">
            <h2>Character Management</h2>
            <button id="add-character-btn" class="primary">+ Add Character</button>
        </div>

        <!-- Character Form -->
        <div id="character-form" class="form-container hidden">
            <h3 id="form-title">Add Character</h3>
            <form id="char-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label>First Name *</label>
                        <input type="text" id="char-firstname" required>
                    </div>
                    <div class="form-group">
                        <label>Middle Name</label>
                        <input type="text" id="char-middlename">
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" id="char-lastname">
                    </div>
                    <div class="form-group">
                        <label>Year of Birth</label>
                        <input type="number" id="char-birthyear" min="1900" max="2026">
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <input type="text" id="char-gender" placeholder="Male/Female/Other">
                    </div>
                    <div class="form-group">
                        <label>Associated Names (nicknames, aliases)</label>
                        <input type="text" id="char-associated-names" placeholder="e.g., The Shadow, Nightwalker">
                    </div>
                    <div class="form-group">
                        <label>Eye Color</label>
                        <input type="text" id="char-eyes" placeholder="Blue, Green, Brown...">
                    </div>
                    <div class="form-group">
                        <label>Hair Color</label>
                        <input type="text" id="char-hair" placeholder="Blonde, Black, Red...">
                    </div>
                    <div class="form-group">
                        <label>Skin Color/Tone</label>
                        <input type="text" id="char-skin" placeholder="Fair, Olive, Dark...">
                    </div>
                    <div class="form-group">
                        <label>Height</label>
                        <input type="text" id="char-height" placeholder="e.g., 5'10\", 178cm">
                    </div>
                    <div class="form-group">
                        <label>Build</label>
                        <input type="text" id="char-build" placeholder="Slim, Athletic, Stocky...">
                    </div>
                    <div class="form-group full-width">
                        <label>Appearance Notes</label>
                        <textarea id="char-appearance-notes" rows="2" placeholder="Scars, tattoos, distinguishing features..."></textarea>
                    </div>
                    <div class="form-group full-width">
                        <label>Background / Notes</label>
                        <textarea id="char-notes" rows="3" placeholder="Character background, motivations, etc."></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-char-btn" class="secondary">Cancel</button>
                    <button type="submit" id="save-char-btn" class="primary">Save Character</button>
                </div>
            </form>
        </div>

        <!-- Character List -->
        <div id="character-list">
            <div class="list-header">
                <span>Name</span>
                <span>Birth Year</span>
                <span>Appearance</span>
                <span>Teams</span>
                <span>Actions</span>
            </div>
            <div id="characters-container">
                <p class="empty-state">No characters created yet. Add your first character!</p>
            </div>
        </div>
    </main>

    <script src="app.js"></script>
</body>
</html>
```

## teams.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournament Manager - Teams</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>Tournament <span>Manager</span></h1>
        <nav>
            <a href="index.html">Dashboard</a>
            <a href="characters.html">Characters</a>
            <a href="teams.html" class="active">Teams</a>
            <a href="tournaments.html">Tournaments</a>
        </nav>
        <div class="header-actions">
            <button id="export-json-btn" class="small">Export JSON</button>
            <button id="import-json-btn" class="small">Import JSON</button>
            <button id="export-csv-btn" class="small">Export CSV</button>
            <button id="import-csv-btn" class="small">Import CSV</button>
            <button id="template-csv-btn" class="small">Template CSV</button>
            <input type="file" id="json-file-input" accept=".json" style="display:none">
            <input type="file" id="csv-file-input" accept=".csv" style="display:none">
        </div>
    </header>

    <main class="teams-page">
        <div class="page-header">
            <h2>Team Management</h2>
            <button id="add-team-btn" class="primary">+ Add Team</button>
        </div>

        <!-- Team Form -->
        <div id="team-form" class="form-container hidden">
            <h3 id="team-form-title">Add Team</h3>
            <form id="team-form-inner">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Team Name *</label>
                        <input type="text" id="team-name" required>
                    </div>
                    <div class="form-group">
                        <label>Team Type *</label>
                        <select id="team-type" required>
                            <option value="">Select type...</option>
                            <option value="academic">Academic (weeks)</option>
                            <option value="professional">Professional (years)</option>
                            <option value="internship">Internship (one-time)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Founded Year</label>
                        <input type="number" id="team-founded" min="1900" max="2026">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="team-status">
                            <option value="active">Active</option>
                            <option value="deprecated">Deprecated (history kept)</option>
                            <option value="deleted">Deleted (permanent)</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-team-btn" class="secondary">Cancel</button>
                    <button type="submit" id="save-team-btn" class="primary">Save Team</button>
                </div>
            </form>
        </div>

        <!-- Team List -->
        <div id="team-list">
            <div class="list-header">
                <span>Team Name</span>
                <span>Type</span>
                <span>Members</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
            <div id="teams-container">
                <p class="empty-state">No teams created yet. Add your first team!</p>
            </div>
        </div>

        <!-- Member Management Modal -->
        <div id="member-modal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-team-name">Team Members</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="member-form">
                        <select id="member-character">
                            <option value="">Select character...</option>
                        </select>
                        <input type="text" id="member-role" placeholder="Role (e.g., Captain)">
                        <input type="number" id="member-join-year" placeholder="Join Year">
                        <input type="number" id="member-leave-year" placeholder="Leave Year (optional)">
                        <button id="add-member-btn" class="primary small">Add Member</button>
                    </div>
                    <div id="members-list">
                        <p class="empty-state">No members in this team</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Member Modal -->
        <div id="edit-member-modal" class="modal hidden">
            <div class="modal-content small">
                <div class="modal-header">
                    <h3>Edit Member</h3>
                    <button class="close-modal" id="close-edit-member">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-member-form">
                        <div class="form-group">
                            <label>Character</label>
                            <p id="edit-member-name" style="margin:4px 0 12px 0;font-weight:600;"></p>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <input type="text" id="edit-member-role">
                        </div>
                        <div class="form-group">
                            <label>Join Year</label>
                            <input type="number" id="edit-member-join-year">
                        </div>
                        <div class="form-group">
                            <label>Leave Year</label>
                            <input type="number" id="edit-member-leave-year">
                        </div>
                        <div class="form-actions">
                            <button type="button" id="cancel-edit-member" class="secondary">Cancel</button>
                            <button type="submit" id="save-edit-member" class="primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </main>

    <script src="app.js"></script>
</body>
</html>
```

## tournaments.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tournament Manager - Tournaments</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>Tournament <span>Manager</span></h1>
        <nav>
            <a href="index.html">Dashboard</a>
            <a href="characters.html">Characters</a>
            <a href="teams.html">Teams</a>
            <a href="tournaments.html" class="active">Tournaments</a>
        </nav>
        <div class="header-actions">
            <button id="export-json-btn" class="small">Export JSON</button>
            <button id="import-json-btn" class="small">Import JSON</button>
            <button id="export-csv-btn" class="small">Export CSV</button>
            <button id="import-csv-btn" class="small">Import CSV</button>
            <button id="template-csv-btn" class="small">Template CSV</button>
            <input type="file" id="json-file-input" accept=".json" style="display:none">
            <input type="file" id="csv-file-input" accept=".csv" style="display:none">
        </div>
    </header>

    <main class="tournaments-page">
        <div class="page-header">
            <h2>Academic Tournaments</h2>
            <button id="add-tournament-btn" class="primary">+ Create Tournament</button>
        </div>

        <!-- Tournament Form -->
        <div id="tournament-form" class="form-container hidden">
            <h3 id="tournament-form-title">Create Tournament</h3>
            <form id="tournament-form-inner">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Tournament Name *</label>
                        <input type="text" id="tournament-name" required>
                    </div>
                    <div class="form-group">
                        <label>Academic Year</label>
                        <input type="text" id="tournament-year" placeholder="e.g., 2025-2026">
                    </div>
                    <div class="form-group">
                        <label>Start Week</label>
                        <input type="number" id="tournament-start-week" min="1" max="52">
                    </div>
                    <div class="form-group">
                        <label>End Week</label>
                        <input type="number" id="tournament-end-week" min="1" max="52">
                    </div>
                    <div class="form-group full-width">
                        <label>Description</label>
                        <textarea id="tournament-description" rows="3" placeholder="Tournament details..."></textarea>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-tournament-btn" class="secondary">Cancel</button>
                    <button type="submit" id="save-tournament-btn" class="primary">Save Tournament</button>
                </div>
            </form>
        </div>

        <!-- Tournament List -->
        <div id="tournament-list">
            <div class="list-header">
                <span>Tournament</span>
                <span>Academic Year</span>
                <span>Weeks</span>
                <span>Teams</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
            <div id="tournaments-container">
                <p class="empty-state">No tournaments created yet. Create your first tournament!</p>
            </div>
        </div>

        <!-- Tournament Detail Modal -->
        <div id="tournament-detail-modal" class="modal hidden">
            <div class="modal-content wide">
                <div class="modal-header">
                    <h3 id="detail-tournament-name">Tournament Details</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="tournament-info"></div>
                    <div id="tournament-bracket">
                        <h4>Tournament Bracket</h4>
                        <div id="bracket-container"></div>
                    </div>
                    <div class="team-selection">
                        <h4>Add Teams</h4>
                        <select id="tournament-team-select">
                            <option value="">Select academic team...</option>
                        </select>
                        <button id="add-team-to-tournament" class="primary small">Add Team</button>
                    </div>
                    <div id="tournament-teams-list"></div>
                </div>
            </div>
        </div>
    </main>

    <script src="app.js"></script>
</body>
</html>
```

## style.css

```css
/* ============================================================
   style.css - Tournament Manager Theme
   Dark grey-green with subtle glow effects
   ============================================================ */

:root {
  --bg: #0d0f0d;
  --panel: #141914;
  --panel-alt: #1a201a;
  --border: #2a3a2a;
  --border-soft: #1f2a1f;
  --text: #c8dcc8;
  --text-dim: #6e8a6e;
  --accent: #6a9a6a;
  --accent-soft: rgba(106, 154, 106, 0.12);
  --accent-glow: 0 0 14px rgba(106, 154, 106, 0.2);
  --danger: #c1453c;
  --danger-soft: rgba(193, 69, 60, 0.12);
  --warning: #c9a24b;
  --warning-soft: rgba(201, 162, 75, 0.12);
  --radius: 10px;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

* {
  box-sizing: border-box;
  min-width: 0;
}

html,
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
}

h1,
h2,
h3,
h4 {
  font-family: 'Fraunces', serif;
  font-weight: 700;
  margin: 0;
}

/* ---- Scrollbars ---- */
::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}
::-webkit-scrollbar-track {
  background: var(--bg);
  border-radius: 5px;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 5px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}
* {
  scrollbar-width: thin;
  scrollbar-color: var(--border) var(--bg);
}

/* ---- Header ---- */
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--panel), var(--bg));
  position: sticky;
  top: 0;
  z-index: 100;
}

header h1 {
  font-size: 1.4rem;
  letter-spacing: .02em;
  text-shadow: 0 0 20px rgba(106, 154, 106, 0.12);
}

header h1 span {
  color: var(--accent);
  text-shadow: 0 0 30px rgba(106, 154, 106, 0.25);
}

header nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

header nav a {
  color: var(--text-dim);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: .85rem;
  transition: .2s;
}

header nav a:hover {
  color: var(--text);
  background: var(--panel-alt);
}

header nav a.active {
  color: var(--accent);
  background: var(--accent-soft);
  box-shadow: var(--accent-glow);
}

.header-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.header-actions button.small {
  font-size: .7rem;
  padding: 4px 10px;
}

/* ---- Buttons ---- */
button {
  font-family: 'Inter', sans-serif;
  font-size: .82rem;
  font-weight: 500;
  background: var(--panel-alt);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 8px 16px;
  cursor: pointer;
  transition: .2s;
}

button:hover {
  border-color: var(--accent);
  box-shadow: var(--accent-glow);
}

button.primary {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

button.primary:hover {
  box-shadow: 0 0 20px rgba(106, 154, 106, 0.18);
}

button.danger {
  color: var(--danger);
}

button.danger:hover {
  border-color: var(--danger);
  background: var(--danger-soft);
  box-shadow: 0 0 20px rgba(193, 69, 60, 0.12);
}

button.secondary {
  background: transparent;
  border-color: transparent;
  color: var(--text-dim);
}

button.secondary:hover {
  border-color: var(--border);
  background: var(--panel-alt);
}

button.small {
  padding: 4px 10px;
  font-size: .72rem;
}

/* ---- Main Content ---- */
main {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-header h2 {
  font-size: 1.6rem;
  color: var(--accent);
  text-shadow: 0 0 30px rgba(106, 154, 106, 0.1);
}

/* ---- Dashboard ---- */
.dashboard .stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.stat-card h3 {
  font-size: .85rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: .05em;
}

.stat-card .stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  font-family: 'Fraunces', serif;
  color: var(--accent);
  margin: 8px 0;
}

.stat-card .stat-link {
  color: var(--accent);
  text-decoration: none;
  font-size: .85rem;
}

.stat-card .stat-link:hover {
  text-decoration: underline;
}

.recent-activity {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.recent-activity h2 {
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: var(--text-dim);
}

.activity-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-soft);
  font-size: .85rem;
}

.activity-item:last-child {
  border-bottom: none;
}

/* ---- Forms ---- */
.form-container {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.form-container.hidden {
  display: none;
}

.form-container h3 {
  font-size: 1.2rem;
  color: var(--accent);
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: .78rem;
  color: var(--text-dim);
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  background: var(--panel-alt);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: .85rem;
  font-family: 'Inter', sans-serif;
  width: 100%;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(106, 154, 106, 0.08);
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end;
}

/* ---- Lists ---- */
.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 10px 16px;
  background: var(--panel-alt);
  border-radius: var(--radius) var(--radius) 0 0;
  border: 1px solid var(--border);
  border-bottom: none;
  font-weight: 600;
  font-size: .78rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: .05em;
}

.list-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 10px 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-top: none;
  align-items: center;
}

.list-item:last-child {
  border-radius: 0 0 var(--radius) var(--radius);
}

.list-item .actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-dim);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

/* ---- Modal ---- */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .7);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal.hidden {
  display: none;
}

.modal-content {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 50px rgba(0, 0, 0, .5);
}

.modal-content.wide {
  max-width: 900px;
}

.modal-content.small {
  max-width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-soft);
}

.modal-header h3 {
  color: var(--accent);
}

.close-modal {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 8px;
}

.close-modal:hover {
  color: var(--text);
}

/* ---- Member Management ---- */
.member-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--panel-alt);
  border-radius: var(--radius);
  align-items: center;
}

.member-form select,
.member-form input {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: .8rem;
  font-family: 'Inter', sans-serif;
  flex: 1;
  min-width: 100px;
}

.member-form select:focus,
.member-form input:focus {
  outline: none;
  border-color: var(--accent);
}

#members-list .member-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--panel-alt);
  border-radius: 6px;
  margin-bottom: 4px;
}

#members-list .member-entry .member-info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
}

#members-list .member-entry .member-info span {
  font-size: .85rem;
}

#members-list .member-entry .member-info .role {
  color: var(--accent);
}

#members-list .member-entry .member-info .years {
  color: var(--text-dim);
  font-size: .75rem;
}

#members-list .member-entry .member-actions {
  display: flex;
  gap: 4px;
}

/* ---- Tournament bracket ---- */
#bracket-container {
  display: flex;
  gap: 40px;
  overflow-x: auto;
  padding: 20px 0;
  min-height: 200px;
}

.bracket-round {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 150px;
}

.bracket-round .round-label {
  font-size: .75rem;
  color: var(--text-dim);
  text-align: center;
  font-weight: 600;
}

.bracket-match {
  background: var(--panel-alt);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.bracket-match .team {
  font-size: .8rem;
  padding: 2px 0;
}

.bracket-match .team.winner {
  color: var(--accent);
  font-weight: 600;
}

/* ---- Team Selection in Tournament ---- */
.team-selection {
  margin: 16px 0;
  padding: 12px;
  background: var(--panel-alt);
  border-radius: var(--radius);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.team-selection select {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: .8rem;
  font-family: 'Inter', sans-serif;
  flex: 1;
  min-width: 150px;
}

#tournament-teams-list .team-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--panel-alt);
  border-radius: 6px;
  margin-bottom: 4px;
}

/* ---- Responsive ---- */
@media (max-width: 760px) {
  header {
    padding: 12px 16px;
  }

  header nav {
    width: 100%;
    justify-content: center;
    order: 2;
  }

  header .header-actions {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  header h1 {
    font-size: 1.15rem;
  }

  header nav a {
    font-size: .75rem;
    padding: 4px 10px;
  }

  main {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .list-header,
  .list-item {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    font-size: .75rem;
  }

  .list-header span:nth-child(3),
  .list-header span:nth-child(4),
  .list-item>*:nth-child(3),
  .list-item>*:nth-child(4) {
    display: none;
  }

  .list-item .actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }

  .member-form {
    flex-direction: column;
  }

  .member-form select,
  .member-form input {
    width: 100%;
  }

  .modal-content {
    padding: 16px;
    margin: 10px;
  }

  #bracket-container {
    gap: 20px;
  }

  .bracket-round {
    min-width: 120px;
  }
}
```

## app.js

```javascript
// ============================================================
// app.js - Tournament Manager Application Logic
// ============================================================

// ---- Data Store ----
let data = {
    characters: [],
    teams: [],
    tournaments: [],
    activities: []
};

// Load from localStorage
function loadData() {
    try {
        const stored = localStorage.getItem('tournament-manager-data');
        if (stored) {
            data = JSON.parse(stored);
            return true;
        }
    } catch (e) {
        console.warn('Failed to load data:', e);
    }
    return false;
}

// Save to localStorage
function saveData() {
    try {
        localStorage.setItem('tournament-manager-data', JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save data:', e);
    }
}

// ---- ID Generator ----
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ---- Activity Logger ----
function logActivity(message, type = 'info') {
    data.activities.unshift({
        id: generateId(),
        message: message,
        type: type,
        timestamp: new Date().toISOString()
    });
    if (data.activities.length > 100) data.activities.pop();
    saveData();
    updateActivityLog();
}

// ---- Update Dashboard ----
function updateDashboard() {
    const charCount = document.getElementById('char-count');
    const teamCount = document.getElementById('team-count');
    const tournCount = document.getElementById('tournament-count');

    if (charCount) charCount.textContent = data.characters.length;
    if (teamCount) teamCount.textContent = data.teams.length;
    if (tournCount) tournCount.textContent = data.tournaments.length;

    updateActivityLog();
}

function updateActivityLog() {
    const log = document.getElementById('activity-log');
    if (!log) return;

    if (data.activities.length === 0) {
        log.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }

    log.innerHTML = data.activities.slice(0, 10).map(a =>
        `<div class="activity-item">${a.message}</div>`
    ).join('');
}

// ============================================================
// IMPORT / EXPORT FUNCTIONS
// ============================================================

// ---- Export JSON ----
function exportJSON() {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-data-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logActivity('Exported data to JSON');
}

// ---- Import JSON ----
function importJSON(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (!imported.characters || !imported.teams || !imported.tournaments) {
                alert('Invalid data format. Missing required fields.');
                return;
            }

            if (!confirm('This will replace all current data. Continue?')) return;

            data = imported;
            saveData();
            logActivity('Imported data from JSON');
            renderAll();
            updateDashboard();
            alert('Data imported successfully!');
        } catch (err) {
            alert('Failed to import JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ---- Export CSV ----
function exportCSV() {
    const lines = [];

    lines.push('# CHARACTERS');
    lines.push('FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes');
    data.characters.forEach(c => {
        lines.push([
            csvField(c.firstName || ''),
            csvField(c.middleName || ''),
            csvField(c.lastName || ''),
            c.birthYear || '',
            csvField(c.gender || ''),
            csvField(c.associatedNames || ''),
            csvField(c.eyes || ''),
            csvField(c.hair || ''),
            csvField(c.skin || ''),
            csvField(c.height || ''),
            csvField(c.build || ''),
            csvField(c.appearanceNotes || ''),
            csvField(c.notes || '')
        ].join(','));
    });

    lines.push('\n# TEAMS');
    lines.push('TeamName,TeamType,FoundedYear,Status');
    data.teams.forEach(t => {
        lines.push(`${csvField(t.name)},${csvField(t.type)},${t.foundedYear || ''},${csvField(t.status)}`);
    });

    lines.push('\n# TEAM MEMBERS');
    lines.push('TeamName,CharacterFirstName,CharacterLastName,Role,JoinYear,LeaveYear');
    data.teams.forEach(t => {
        if (t.members) {
            t.members.forEach(m => {
                const char = data.characters.find(c => c.id === m.characterId);
                lines.push(`${csvField(t.name)},${csvField(char ? char.firstName : '')},${csvField(char ? char.lastName : '')},${csvField(m.role)},${m.joinYear || ''},${m.leaveYear || ''}`);
            });
        }
    });

    lines.push('\n# TOURNAMENTS');
    lines.push('TournamentName,AcademicYear,StartWeek,EndWeek,Status,Description');
    data.tournaments.forEach(t => {
        lines.push(`${csvField(t.name)},${csvField(t.academicYear)},${t.startWeek || ''},${t.endWeek || ''},${csvField(t.status)},${csvField(t.description)}`);
    });

    lines.push('\n# TOURNAMENT TEAMS');
    lines.push('TournamentName,TeamName,Seed');
    data.tournaments.forEach(t => {
        if (t.teams) {
            t.teams.forEach(entry => {
                const team = data.teams.find(tm => tm.id === entry.teamId);
                lines.push(`${csvField(t.name)},${csvField(team ? team.name : '')},${entry.seed || ''}`);
            });
        }
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-data-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logActivity('Exported data to CSV');
}

// ---- Import CSV ----
function importCSV(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (!confirm('This will replace all current data. Continue?')) return;

            const lines = e.target.result.split('\n');
            let section = '';
            let newData = {
                characters: [],
                teams: [],
                tournaments: [],
                activities: []
            };
            let charMap = {};
            let teamMap = {};
            let tournMap = {};

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue;

                if (line.startsWith('# CHARACTERS')) { section = 'characters'; continue; }
                if (line.startsWith('# TEAMS')) { section = 'teams'; continue; }
                if (line.startsWith('# TEAM MEMBERS')) { section = 'members'; continue; }
                if (line.startsWith('# TOURNAMENTS')) { section = 'tournaments'; continue; }
                if (line.startsWith('# TOURNAMENT TEAMS')) { section = 'tournament_teams'; continue; }

                if (line.startsWith('FirstName,') || 
                    line.startsWith('TeamName,') || 
                    line.startsWith('TournamentName,')) continue;

                const values = parseCSVLine(line);

                if (section === 'characters' && values.length >= 13) {
                    const char = {
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
                        createdAt: new Date().toISOString()
                    };
                    newData.characters.push(char);
                    const key = (char.firstName + '|' + char.lastName).toLowerCase();
                    charMap[key] = char;
                }
                else if (section === 'teams' && values.length >= 4) {
                    const team = {
                        id: generateId(),
                        name: values[0] || '',
                        type: values[1] || '',
                        foundedYear: values[2] || '',
                        status: values[3] || 'active',
                        members: [],
                        createdAt: new Date().toISOString()
                    };
                    newData.teams.push(team);
                    teamMap[team.name.toLowerCase()] = team;
                }
                else if (section === 'members' && values.length >= 6) {
                    const teamName = values[0];
                    const charFirstName = values[1];
                    const charLastName = values[2];
                    const team = teamMap[teamName.toLowerCase()];
                    if (team) {
                        const key = (charFirstName + '|' + charLastName).toLowerCase();
                        const char = charMap[key];
                        if (char) {
                            team.members.push({
                                characterId: char.id,
                                role: values[3] || 'Member',
                                joinYear: values[4] || '',
                                leaveYear: values[5] || ''
                            });
                        }
                    }
                }
                else if (section === 'tournaments' && values.length >= 6) {
                    const tourn = {
                        id: generateId(),
                        name: values[0] || '',
                        academicYear: values[1] || '',
                        startWeek: values[2] || '',
                        endWeek: values[3] || '',
                        status: values[4] || 'draft',
                        description: values[5] || '',
                        teams: [],
                        bracket: [],
                        createdAt: new Date().toISOString()
                    };
                    newData.tournaments.push(tourn);
                    tournMap[tourn.name.toLowerCase()] = tourn;
                }
                else if (section === 'tournament_teams' && values.length >= 3) {
                    const tournName = values[0];
                    const teamName = values[1];
                    const tourn = tournMap[tournName.toLowerCase()];
                    const team = teamMap[teamName.toLowerCase()];
                    if (tourn && team) {
                        tourn.teams.push({
                            teamId: team.id,
                            seed: parseInt(values[2]) || tourn.teams.length + 1
                        });
                    }
                }
            }

            if (newData.characters.length === 0 && newData.teams.length === 0 && newData.tournaments.length === 0) {
                alert('No valid data found in CSV file.');
                return;
            }

            data = newData;
            saveData();
            logActivity('Imported data from CSV');
            renderAll();
            updateDashboard();
            alert(`Imported successfully!\nCharacters: ${data.characters.length}\nTeams: ${data.teams.length}\nTournaments: ${data.tournaments.length}`);
        } catch (err) {
            alert('Failed to import CSV: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ---- Export Template CSV ----
function exportTemplateCSV() {
    const lines = [
        '# CHARACTERS',
        'FirstName,MiddleName,LastName,BirthYear,Gender,AssociatedNames,EyeColor,HairColor,SkinColor,Height,Build,AppearanceNotes,Notes',
        'John,,Doe,1990,Male,,Blue,Brown,Fair,5\'10",Athletic,,Example character',
        'Jane,Mary,Smith,1992,Female,The Shadow,Green,Black,Olive,5\'7",Slim,Scar on cheek,',
        '',
        '# TEAMS',
        'TeamName,TeamType,FoundedYear,Status',
        'Example Team,academic,2020,active',
        'Another Team,professional,2018,active',
        '',
        '# TEAM MEMBERS',
        'TeamName,CharacterFirstName,CharacterLastName,Role,JoinYear,LeaveYear',
        'Example Team,John,Doe,Captain,2020,',
        'Example Team,Jane,Smith,Member,2021,2023',
        '',
        '# TOURNAMENTS',
        'TournamentName,AcademicYear,StartWeek,EndWeek,Status,Description',
        'Spring Cup,2025-2026,1,12,active,Annual spring tournament',
        '',
        '# TOURNAMENT TEAMS',
        'TournamentName,TeamName,Seed',
        'Spring Cup,Example Team,1',
        'Spring Cup,Another Team,2'
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tournament-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logActivity('Exported template CSV');
}

// ---- CSV Helper Functions ----
function csvField(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"' && line[i+1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    values.push(current.trim());
    return values;
}

// ---- Render All ----
function renderAll() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    if (page === 'index.html' || page === '') {
        updateDashboard();
    } else if (page === 'characters.html') {
        renderCharacters();
    } else if (page === 'teams.html') {
        renderTeams();
    } else if (page === 'tournaments.html') {
        renderTournaments();
    }
}

// ---- Character Management ----
function renderCharacters() {
    const container = document.getElementById('characters-container');
    if (!container) return;

    if (data.characters.length === 0) {
        container.innerHTML = '<p class="empty-state">No characters created yet. Add your first character!</p>';
        return;
    }

    container.innerHTML = data.characters.map(char => {
        const fullName = [char.firstName, char.middleName, char.lastName].filter(Boolean).join(' ');
        const appearance = [char.eyes, char.hair, char.skin].filter(Boolean).join(', ');
        return `
        <div class="list-item" data-id="${char.id}">
            <span><strong>${fullName}</strong></span>
            <span>${char.birthYear || '-'}</span>
            <span>${appearance || '-'}</span>
            <span>${getCharacterTeamCount(char.id)}</span>
            <span class="actions">
                <button class="small edit-character" data-id="${char.id}">✎</button>
                <button class="small danger delete-character" data-id="${char.id}">✕</button>
            </span>
        </div>
    `}).join('');

    container.querySelectorAll('.edit-character').forEach(btn => {
        btn.addEventListener('click', () => editCharacter(btn.dataset.id));
    });
    container.querySelectorAll('.delete-character').forEach(btn => {
        btn.addEventListener('click', () => deleteCharacter(btn.dataset.id));
    });
}

function getCharacterTeamCount(charId) {
    let count = 0;
    data.teams.forEach(team => {
        if (team.members && team.members.some(m => m.characterId === charId)) {
            count++;
        }
    });
    return count || '-';
}

function showCharacterForm(editId = null) {
    const form = document.getElementById('character-form');
    const title = document.getElementById('form-title');
    const formElement = document.getElementById('char-form');

    form.classList.remove('hidden');

    if (editId) {
        title.textContent = 'Edit Character';
        const char = data.characters.find(c => c.id === editId);
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
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Character';
        formElement.reset();
        delete formElement.dataset.editId;
    }

    document.getElementById('char-form').scrollIntoView({ behavior: 'smooth' });
}

function hideCharacterForm() {
    document.getElementById('character-form').classList.add('hidden');
}

function saveCharacter(e) {
    e.preventDefault();
    const form = e.target;
    const editId = form.dataset.editId;

    const charData = {
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
        notes: document.getElementById('char-notes').value.trim()
    };

    if (!charData.firstName) {
        alert('First name is required.');
        return;
    }

    if (editId) {
        const index = data.characters.findIndex(c => c.id === editId);
        if (index !== -1) {
            data.characters[index] = { ...data.characters[index], ...charData };
            logActivity(`Updated character: ${charData.firstName}`);
        }
    } else {
        const newChar = {
            id: generateId(),
            ...charData,
            createdAt: new Date().toISOString()
        };
        data.characters.push(newChar);
        logActivity(`Added character: ${charData.firstName}`);
    }

    saveData();
    renderCharacters();
    updateDashboard();
    hideCharacterForm();
}

function editCharacter(id) {
    showCharacterForm(id);
}

function deleteCharacter(id) {
    if (!confirm('Delete this character permanently? This will remove them from all teams.')) return;

    const char = data.characters.find(c => c.id === id);
    if (!char) return;

    data.teams.forEach(team => {
        if (team.members) {
            team.members = team.members.filter(m => m.characterId !== id);
        }
    });

    data.characters = data.characters.filter(c => c.id !== id);
    logActivity(`Deleted character: ${char.firstName}`);
    saveData();
    renderCharacters();
    updateDashboard();
}

// ---- Team Management ----
let currentEditMember = null;

function renderTeams() {
    const container = document.getElementById('teams-container');
    if (!container) return;

    if (data.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams created yet. Add your first team!</p>';
        return;
    }

    container.innerHTML = data.teams.map(team => `
        <div class="list-item" data-id="${team.id}">
            <span><strong>${team.name}</strong></span>
            <span>${team.type || '-'}</span>
            <span>${team.members ? team.members.length : 0}</span>
            <span>${team.status || 'active'}</span>
            <span class="actions">
                <button class="small manage-members" data-id="${team.id}">👥</button>
                <button class="small edit-team" data-id="${team.id}">✎</button>
                <button class="small danger delete-team" data-id="${team.id}">✕</button>
            </span>
        </div>
    `).join('');

    container.querySelectorAll('.manage-members').forEach(btn => {
        btn.addEventListener('click', () => openMemberModal(btn.dataset.id));
    });
    container.querySelectorAll('.edit-team').forEach(btn => {
        btn.addEventListener('click', () => editTeam(btn.dataset.id));
    });
    container.querySelectorAll('.delete-team').forEach(btn => {
        btn.addEventListener('click', () => deleteTeam(btn.dataset.id));
    });
}

function showTeamForm(editId = null) {
    const form = document.getElementById('team-form');
    const title = document.getElementById('team-form-title');
    const formElement = document.getElementById('team-form-inner');

    form.classList.remove('hidden');

    if (editId) {
        title.textContent = 'Edit Team';
        const team = data.teams.find(t => t.id === editId);
        if (team) {
            document.getElementById('team-name').value = team.name || '';
            document.getElementById('team-type').value = team.type || '';
            document.getElementById('team-founded').value = team.foundedYear || '';
            document.getElementById('team-status').value = team.status || 'active';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Add Team';
        formElement.reset();
        delete formElement.dataset.editId;
    }

    document.getElementById('team-form').scrollIntoView({ behavior: 'smooth' });
}

function hideTeamForm() {
    document.getElementById('team-form').classList.add('hidden');
}

function saveTeam(e) {
    e.preventDefault();
    const form = e.target;
    const editId = form.dataset.editId;

    const teamData = {
        name: document.getElementById('team-name').value.trim(),
        type: document.getElementById('team-type').value,
        foundedYear: document.getElementById('team-founded').value || '',
        status: document.getElementById('team-status').value || 'active'
    };

    if (!teamData.name) {
        alert('Team name is required.');
        return;
    }
    if (!teamData.type) {
        alert('Team type is required.');
        return;
    }

    if (editId) {
        const index = data.teams.findIndex(t => t.id === editId);
        if (index !== -1) {
            data.teams[index] = { ...data.teams[index], ...teamData };
            logActivity(`Updated team: ${teamData.name}`);
        }
    } else {
        const newTeam = {
            id: generateId(),
            ...teamData,
            members: [],
            createdAt: new Date().toISOString()
        };
        data.teams.push(newTeam);
        logActivity(`Added team: ${teamData.name}`);
    }

    saveData();
    renderTeams();
    updateDashboard();
    hideTeamForm();
}

function editTeam(id) {
    showTeamForm(id);
}

function deleteTeam(id) {
    const team = data.teams.find(t => t.id === id);
    if (!team) return;

    if (!confirm(`Delete "${team.name}" permanently? This will also remove it from tournaments.`)) return;

    data.tournaments.forEach(t => {
        if (t.teams) {
            t.teams = t.teams.filter(entry => entry.teamId !== id);
        }
    });

    data.teams = data.teams.filter(t => t.id !== id);
    logActivity(`Deleted team: ${team.name}`);
    saveData();
    renderTeams();
    updateDashboard();
    closeMemberModal();
}

// ---- Member Management Modal ----
let currentTeamId = null;

function openMemberModal(teamId) {
    const modal = document.getElementById('member-modal');
    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;

    currentTeamId = teamId;
    document.getElementById('modal-team-name').textContent = `${team.name} - Members`;

    const select = document.getElementById('member-character');
    select.innerHTML = '<option value="">Select character...</option>';
    data.characters.forEach(char => {
        const name = [char.firstName, char.middleName, char.lastName].filter(Boolean).join(' ');
        select.innerHTML += `<option value="${char.id}">${name}</option>`;
    });

    document.getElementById('member-role').value = '';
    document.getElementById('member-join-year').value = '';
    document.getElementById('member-leave-year').value = '';

    renderMembers(team);

    modal.classList.remove('hidden');
}

function closeMemberModal() {
    document.getElementById('member-modal').classList.add('hidden');
    currentTeamId = null;
}

function renderMembers(team) {
    const container = document.getElementById('members-list');
    if (!team.members || team.members.length === 0) {
        container.innerHTML = '<p class="empty-state">No members in this team</p>';
        return;
    }

    container.innerHTML = team.members.map((member, index) => {
        const char = data.characters.find(c => c.id === member.characterId);
        const name = char ? [char.firstName, char.middleName, char.lastName].filter(Boolean).join(' ') : 'Unknown';
        return `
            <div class="member-entry">
                <div class="member-info">
                    <span><strong>${name}</strong></span>
                    <span class="role">${member.role || 'Member'}</span>
                    <span class="years">${member.joinYear || '?'} ${member.leaveYear ? '→ ' + member.leaveYear : ''}</span>
                </div>
                <div class="member-actions">
                    <button class="small edit-member" data-team="${team.id}" data-index="${index}">✎</button>
                    <button class="small danger remove-member" data-team="${team.id}" data-char="${member.characterId}">✕</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.edit-member').forEach(btn => {
        btn.addEventListener('click', () => openEditMemberModal(btn.dataset.team, parseInt(btn.dataset.index)));
    });
    container.querySelectorAll('.remove-member').forEach(btn => {
        btn.addEventListener('click', () => removeMember(btn.dataset.team, btn.dataset.char));
    });
}

function addMember() {
    if (!currentTeamId) return;

    const charId = document.getElementById('member-character').value;
    const role = document.getElementById('member-role').value.trim();
    const joinYear = document.getElementById('member-join-year').value;
    const leaveYear = document.getElementById('member-leave-year').value;

    if (!charId) {
        alert('Please select a character.');
        return;
    }

    const team = data.teams.find(t => t.id === currentTeamId);
    if (!team) return;

    if (team.members && team.members.some(m => m.characterId === charId)) {
        alert('This character is already in the team.');
        return;
    }

    if (!team.members) team.members = [];

    team.members.push({
        characterId: charId,
        role: role || 'Member',
        joinYear: joinYear || '',
        leaveYear: leaveYear || ''
    });

    const char = data.characters.find(c => c.id === charId);
    logActivity(`Added ${char ? char.firstName : 'character'} to team: ${team.name}`);
    saveData();
    renderMembers(team);
    renderTeams();
    updateDashboard();

    document.getElementById('member-role').value = '';
    document.getElementById('member-join-year').value = '';
    document.getElementById('member-leave-year').value = '';
}

function removeMember(teamId, charId) {
    if (!confirm('Remove this member from the team?')) return;

    const team = data.teams.find(t => t.id === teamId);
    if (!team) return;

    team.members = team.members.filter(m => m.characterId !== charId);
    const char = data.characters.find(c => c.id === charId);
    logActivity(`Removed ${char ? char.firstName : 'character'} from team: ${team.name}`);
    saveData();
    renderMembers(team);
    renderTeams();
    updateDashboard();
}

// ---- Edit Member Modal ----
function openEditMemberModal(teamId, index) {
    const team = data.teams.find(t => t.id === teamId);
    if (!team || !team.members || !team.members[index]) return;

    const member = team.members[index];
    const char = data.characters.find(c => c.id === member.characterId);
    const name = char ? [char.firstName, char.middleName, char.lastName].filter(Boolean).join(' ') : 'Unknown';

    currentEditMember = { teamId, index };

    document.getElementById('edit-member-name').textContent = name;
    document.getElementById('edit-member-role').value = member.role || '';
    document.getElementById('edit-member-join-year').value = member.joinYear || '';
    document.getElementById('edit-member-leave-year').value = member.leaveYear || '';

    document.getElementById('edit-member-modal').classList.remove('hidden');
}

function closeEditMemberModal() {
    document.getElementById('edit-member-modal').classList.add('hidden');
    currentEditMember = null;
}

function saveEditMember(e) {
    e.preventDefault();
    if (!currentEditMember) return;

    const { teamId, index } = currentEditMember;
    const team = data.teams.find(t => t.id === teamId);
    if (!team || !team.members || !team.members[index]) return;

    const role = document.getElementById('edit-member-role').value.trim();
    const joinYear = document.getElementById('edit-member-join-year').value;
    const leaveYear = document.getElementById('edit-member-leave-year').value;

    team.members[index].role = role || 'Member';
    team.members[index].joinYear = joinYear || '';
    team.members[index].leaveYear = leaveYear || '';

    const char = data.characters.find(c => c.id === team.members[index].characterId);
    logActivity(`Updated member ${char ? char.firstName : ''} in team: ${team.name}`);
    saveData();
    renderMembers(team);
    renderTeams();
    closeEditMemberModal();
}

// ---- Tournament Management ----
function renderTournaments() {
    const container = document.getElementById('tournaments-container');
    if (!container) return;

    if (data.tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments created yet. Create your first tournament!</p>';
        return;
    }

    container.innerHTML = data.tournaments.map(tourn => {
        const teamCount = tourn.teams ? tourn.teams.length : 0;

        return `
            <div class="list-item" data-id="${tourn.id}">
                <span><strong>${tourn.name}</strong></span>
                <span>${tourn.academicYear || '-'}</span>
                <span>${tourn.startWeek || '?'} - ${tourn.endWeek || '?'}</span>
                <span>${teamCount}</span>
                <span>${tourn.status || 'draft'}</span>
                <span class="actions">
                    <button class="small view-tournament" data-id="${tourn.id}">📋</button>
                    <button class="small edit-tournament" data-id="${tourn.id}">✎</button>
                    <button class="small danger delete-tournament" data-id="${tourn.id}">✕</button>
                </span>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.view-tournament').forEach(btn => {
        btn.addEventListener('click', () => viewTournament(btn.dataset.id));
    });
    container.querySelectorAll('.edit-tournament').forEach(btn => {
        btn.addEventListener('click', () => editTournament(btn.dataset.id));
    });
    container.querySelectorAll('.delete-tournament').forEach(btn => {
        btn.addEventListener('click', () => deleteTournament(btn.dataset.id));
    });
}

function showTournamentForm(editId = null) {
    const form = document.getElementById('tournament-form');
    const title = document.getElementById('tournament-form-title');
    const formElement = document.getElementById('tournament-form-inner');

    form.classList.remove('hidden');

    if (editId) {
        title.textContent = 'Edit Tournament';
        const tourn = data.tournaments.find(t => t.id === editId);
        if (tourn) {
            document.getElementById('tournament-name').value = tourn.name || '';
            document.getElementById('tournament-year').value = tourn.academicYear || '';
            document.getElementById('tournament-start-week').value = tourn.startWeek || '';
            document.getElementById('tournament-end-week').value = tourn.endWeek || '';
            document.getElementById('tournament-description').value = tourn.description || '';
            formElement.dataset.editId = editId;
        }
    } else {
        title.textContent = 'Create Tournament';
        formElement.reset();
        delete formElement.dataset.editId;
    }

    document.getElementById('tournament-form').scrollIntoView({ behavior: 'smooth' });
}

function hideTournamentForm() {
    document.getElementById('tournament-form').classList.add('hidden');
}

function saveTournament(e) {
    e.preventDefault();
    const form = e.target;
    const editId = form.dataset.editId;

    const tournData = {
        name: document.getElementById('tournament-name').value.trim(),
        academicYear: document.getElementById('tournament-year').value.trim(),
        startWeek: document.getElementById('tournament-start-week').value || '',
        endWeek: document.getElementById('tournament-end-week').value || '',
        description: document.getElementById('tournament-description').value.trim(),
        status: 'draft'
    };

    if (!tournData.name) {
        alert('Tournament name is required.');
        return;
    }

    if (editId) {
        const index = data.tournaments.findIndex(t => t.id === editId);
        if (index !== -1) {
            data.tournaments[index] = { ...data.tournaments[index], ...tournData };
            logActivity(`Updated tournament: ${tournData.name}`);
        }
    } else {
        const newTourn = {
            id: generateId(),
            ...tournData,
            teams: [],
            bracket: [],
            createdAt: new Date().toISOString()
        };
        data.tournaments.push(newTourn);
        logActivity(`Created tournament: ${tournData.name}`);
    }

    saveData();
    renderTournaments();
    updateDashboard();
    hideTournamentForm();
}

function editTournament(id) {
    showTournamentForm(id);
}

function deleteTournament(id) {
    if (!confirm('Delete this tournament permanently?')) return;

    const tourn = data.tournaments.find(t => t.id === id);
    if (!tourn) return;

    data.tournaments = data.tournaments.filter(t => t.id !== id);
    logActivity(`Deleted tournament: ${tourn.name}`);
    saveData();
    renderTournaments();
    updateDashboard();
    closeTournamentDetail();
}

// ---- Tournament Detail View ----
function viewTournament(id) {
    const tourn = data.tournaments.find(t => t.id === id);
    if (!tourn) return;

    const modal = document.getElementById('tournament-detail-modal');
    document.getElementById('detail-tournament-name').textContent = tourn.name;

    const info = document.getElementById('tournament-info');
    info.innerHTML = `
        <p><strong>Academic Year:</strong> ${tourn.academicYear || 'N/A'}</p>
        <p><strong>Weeks:</strong> ${tourn.startWeek || '?'} - ${tourn.endWeek || '?'}</p>
        <p><strong>Status:</strong> ${tourn.status || 'draft'}</p>
        <p><strong>Description:</strong> ${tourn.description || 'No description'}</p>
    `;

    const select = document.getElementById('tournament-team-select');
    const academicTeams = data.teams.filter(t => t.type === 'academic' && t.status !== 'deleted');
    select.innerHTML = '<option value="">Select academic team...</option>';
    academicTeams.forEach(team => {
        const alreadyAdded = tourn.teams && tourn.teams.some(t => t.teamId === team.id);
        if (!alreadyAdded) {
            select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
        }
    });

    renderTournamentTeams(tourn);
    renderBracket(tourn);

    modal.dataset.tournamentId = id;
    modal.classList.remove('hidden');
}

function closeTournamentDetail() {
    document.getElementById('tournament-detail-modal').classList.add('hidden');
}

function renderTournamentTeams(tourn) {
    const container = document.getElementById('tournament-teams-list');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">No teams added to this tournament</p>';
        return;
    }

    container.innerHTML = tourn.teams.map(entry => {
        const team = data.teams.find(t => t.id === entry.teamId);
        return `
            <div class="team-entry">
                <span>${team ? team.name : 'Unknown team'}</span>
                <span>${entry.seed || 'Unseeded'}</span>
                <button class="small danger remove-team-from-tournament" data-tourn="${tourn.id}" data-team="${entry.teamId}">✕</button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.remove-team-from-tournament').forEach(btn => {
        btn.addEventListener('click', () => removeTeamFromTournament(btn.dataset.tourn, btn.dataset.team));
    });
}

function addTeamToTournament() {
    const modal = document.getElementById('tournament-detail-modal');
    const tournId = modal.dataset.tournamentId;
    const tourn = data.tournaments.find(t => t.id === tournId);
    if (!tourn) return;

    const teamId = document.getElementById('tournament-team-select').value;
    if (!teamId) {
        alert('Please select a team.');
        return;
    }

    if (!tourn.teams) tourn.teams = [];

    if (tourn.teams.some(t => t.teamId === teamId)) {
        alert('Team already added to this tournament.');
        return;
    }

    tourn.teams.push({
        teamId: teamId,
        seed: tourn.teams.length + 1
    });

    const team = data.teams.find(t => t.id === teamId);
    logActivity(`Added team ${team ? team.name : ''} to tournament: ${tourn.name}`);
    saveData();
    viewTournament(tournId);
}

function removeTeamFromTournament(tournId, teamId) {
    if (!confirm('Remove this team from the tournament?')) return;

    const tourn = data.tournaments.find(t => t.id === tournId);
    if (!tourn) return;

    tourn.teams = tourn.teams.filter(t => t.teamId !== teamId);
    const team = data.teams.find(t => t.id === teamId);
    logActivity(`Removed team ${team ? team.name : ''} from tournament: ${tourn.name}`);
    saveData();
    viewTournament(tournId);
}

function renderBracket(tourn) {
    const container = document.getElementById('bracket-container');
    if (!tourn.teams || tourn.teams.length === 0) {
        container.innerHTML = '<p class="empty-state">Add teams to generate bracket</p>';
        return;
    }

    const teams = tourn.teams.map(t => {
        const team = data.teams.find(tm => tm.id === t.teamId);
        return team ? team.name : 'Unknown';
    });

    const rounds = [];
    let currentTeams = [...teams];

    while (currentTeams.length > 1) {
        const roundTeams = [];
        for (let i = 0; i < currentTeams.length; i += 2) {
            if (i + 1 < currentTeams.length) {
                roundTeams.push([currentTeams[i], currentTeams[i + 1]]);
            } else {
                roundTeams.push([currentTeams[i], 'BYE']);
            }
        }
        rounds.push(roundTeams);
        currentTeams = roundTeams.map(match => {
            return match[0] !== 'BYE' ? match[0] : match[1];
        });
    }

    container.innerHTML = rounds.map((round, index) => `
        <div class="bracket-round">
            <div class="round-label">Round ${index + 1}</div>
            ${round.map(match => `
                <div class="bracket-match">
                    <div class="team">${match[0] || '?'}</div>
                    <div class="team">${match[1] || '?'}</div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// ---- Initialize Import/Export Buttons ----
function initImportExport() {
    document.querySelectorAll('#export-json-btn').forEach(btn => {
        btn.addEventListener('click', exportJSON);
    });

    document.querySelectorAll('#import-json-btn').forEach(btn => {
        btn.addEventListener('click', () => document.getElementById('json-file-input').click());
    });
    document.querySelectorAll('#json-file-input').forEach(input => {
        input.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                importJSON(this.files[0]);
                this.value = '';
            }
        });
    });

    document.querySelectorAll('#export-csv-btn').forEach(btn => {
        btn.addEventListener('click', exportCSV);
    });

    document.querySelectorAll('#import-csv-btn').forEach(btn => {
        btn.addEventListener('click', () => document.getElementById('csv-file-input').click());
    });
    document.querySelectorAll('#csv-file-input').forEach(input => {
        input.addEventListener('change', function(e) {
            if (this.files.length > 0) {
                importCSV(this.files[0]);
                this.value = '';
            }
        });
    });

    document.querySelectorAll('#template-csv-btn').forEach(btn => {
        btn.addEventListener('click', exportTemplateCSV);
    });
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initImportExport();

    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    if (page === 'index.html' || page === '') {
        updateDashboard();
    } else if (page === 'characters.html') {
        renderCharacters();

        document.getElementById('add-character-btn').addEventListener('click', () => showCharacterForm());
        document.getElementById('cancel-char-btn').addEventListener('click', hideCharacterForm);
        document.getElementById('char-form').addEventListener('submit', saveCharacter);

    } else if (page === 'teams.html') {
        renderTeams();

        document.getElementById('add-team-btn').addEventListener('click', () => showTeamForm());
        document.getElementById('cancel-team-btn').addEventListener('click', hideTeamForm);
        document.getElementById('team-form-inner').addEventListener('submit', saveTeam);

        document.querySelector('#member-modal .close-modal').addEventListener('click', closeMemberModal);
        document.getElementById('member-modal').addEventListener('click', function(e) {
            if (e.target === this) closeMemberModal();
        });
        document.getElementById('add-member-btn').addEventListener('click', addMember);

        document.querySelector('#edit-member-modal .close-modal').addEventListener('click', closeEditMemberModal);
        document.getElementById('edit-member-modal').addEventListener('click', function(e) {
            if (e.target === this) closeEditMemberModal();
        });
        document.getElementById('cancel-edit-member').addEventListener('click', closeEditMemberModal);
        document.getElementById('edit-member-form').addEventListener('submit', saveEditMember);

    } else if (page === 'tournaments.html') {
        renderTournaments();

        document.getElementById('add-tournament-btn').addEventListener('click', () => showTournamentForm());
        document.getElementById('cancel-tournament-btn').addEventListener('click', hideTournamentForm);
        document.getElementById('tournament-form-inner').addEventListener('submit', saveTournament);

        document.querySelector('#tournament-detail-modal .close-modal').addEventListener('click', closeTournamentDetail);
        document.getElementById('tournament-detail-modal').addEventListener('click', function(e) {
            if (e.target === this) closeTournamentDetail();
        });
        document.getElementById('add-team-to-tournament').addEventListener('click', addTeamToTournament);
    }

    setInterval(saveData, 30000);
});
```
