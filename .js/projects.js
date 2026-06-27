// js/projects.js
function loadProjectList() {
    const container = document.getElementById('projects-list-container');
    container.innerHTML = '';
    state.projects.forEach(proj => {
        const isActive = proj.id === state.activeProjectId;
        const card = document.createElement('div');
        card.className = `p-5 rounded-2xl border transition duration-200 cursor-pointer ${isActive ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/5' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`;
        card.onclick = () => selectProject(proj.id);
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest">${proj.genre}</span>
                ${isActive ? '<span class="bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Projet Actif</span>' : ''}
            </div>
            <h3 class="text-lg font-bold text-white mb-2">${proj.title}</h3>
            <p class="text-xs text-slate-400 mb-4 line-clamp-2">${proj.pitch}</p>
            <div class="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                <span class="flex items-center gap-1"><i data-lucide="users" class="w-3.5 h-3.5 text-blue-400"></i> ${proj.characters.length} Persos</span>
                <span class="flex items-center gap-1"><i data-lucide="clapperboard" class="w-3.5 h-3.5 text-purple-400"></i> ${proj.episodes.length} Épisodes</span>
            </div>
        `;
        container.appendChild(card);
    });
    lucide.createIcons();
}

function selectProject(projId) {
    state.activeProjectId = projId;
    const proj = state.projects.find(p => p.id === projId);
    document.getElementById('active-project-title').innerText = proj.title;
    document.getElementById('active-project-genre').innerHTML = `<i data-lucide="tags" class="w-3.5 h-3.5 text-indigo-400"></i> Style: ${proj.genre}`;
    loadProjectList();
    updateDashboardStats();
    lucide.createIcons();
}

function openNewProjectModal() {
    document.getElementById('new-project-modal').classList.remove('hidden');
}

function closeNewProjectModal() {
    document.getElementById('new-project-modal').classList.add('hidden');
}

function createNewProject() {
    const title = document.getElementById('modal-project-title').value.trim();
    const genre = document.getElementById('modal-project-genre').value;
    const pitch = document.getElementById('modal-project-pitch').value.trim();
    if (!title) {
        alertToast("Veuillez renseigner un titre de manga.");
        return;
    }
    const newProj = {
        id: 'proj-' + Date.now(),
        title,
        genre,
        pitch: pitch || 'Pas de description renseignée.',
        characters: [],
        episodes: [],
        boards: []
    };
    state.projects.push(newProj);
    state.activeProjectId = newProj.id;
    closeNewProjectModal();
    selectProject(newProj.id);
    alertToast(`Projet "${title}" créé avec succès !`);
}

function updateDashboardStats() {
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    document.getElementById('stat-projects-count').innerText = state.projects.length;
    document.getElementById('stat-characters-count').innerText = proj.characters.length;
    document.getElementById('stat-episodes-count').innerText = proj.episodes.length;
    document.getElementById('stat-boards-count').innerText = proj.boards.length;
}

// Fonctions globales pour l'IA rapide (appelées depuis la sidebar)
async function generateGlobalConcept() {
    alertToast("L'IA invente un concept de manga original...");
    const systemPrompt = "Tu es un consultant de divertissement de classe mondiale, expert en création de mangas à fort potentiel commercial.";
    const userQuery = "Suggère un titre de manga inédit, un genre novateur, un pitch d'histoire et les caractéristiques de deux personnages principaux sous forme de paragraphe structuré.";
    try {
        const response = await callGeminiAPI(userQuery, systemPrompt, false);
        switchTab('dashboard');
        openNewProjectModal();
        document.getElementById('modal-project-title').value = "Incursion Alpha";
        document.getElementById('modal-project-pitch').value = response;
        alertToast("Idée reçue ! Modifiez-la et validez la création.");
    } catch (err) {
        console.error(err);
        alertToast("Erreur lors de l'appel d'idées IA.");
    }
}

async function optimizePromptHelper() {
    const prompt = document.getElementById('board-prompt-input').value.trim();
    if (!prompt) {
        alertToast("Écrivez d'abord un prompt basique dans l'onglet 'Planches' pour l'optimiser.");
        switchTab('board-editor');
        return;
    }
    alertToast("Optimisation du prompt pour le moteur de dessin...");
    const systemPrompt = "Tu es un traducteur de prompt créatif pour IA d'illustration d'art numérique.";
    const userQuery = `Optimise ce prompt en anglais pour qu'il produise un rendu de manga moderne, dynamique et de qualité studio d'animation : "${prompt}". Renvoie uniquement le prompt traduit optimisé.`;
    try {
        const response = await callGeminiAPI(userQuery, systemPrompt, false);
        document.getElementById('board-prompt-input').value = response;
        switchTab('board-editor');
        alertToast("Prompt optimisé pour un rendu de haute qualité !");
    } catch (err) {
        console.error(err);
        alertToast("Échec de l'optimisation par IA.");
    }
}
