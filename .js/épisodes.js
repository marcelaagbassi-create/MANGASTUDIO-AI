// js/episodes.js
function renderEpisodes() {
    const list = document.getElementById('episodes-list');
    list.innerHTML = '';
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    if (proj.episodes.length === 0) {
        list.innerHTML = `<div class="text-xs text-slate-500 text-center py-6">Aucun épisode créé. Commencez en un clic !</div>`;
        return;
    }
    proj.episodes.forEach(ep => {
        const isActive = ep.id === state.selectedEpisodeId;
        const item = document.createElement('div');
        item.className = `p-3 rounded-lg border cursor-pointer transition ${isActive ? 'bg-indigo-950/40 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`;
        item.onclick = () => selectEpisode(ep.id);
        item.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] font-bold text-slate-400">ÉPISODE ${ep.number}</span>
                <span class="text-[9px] bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded font-mono">${ep.scenes ? ep.scenes.length : 0} Cases</span>
            </div>
            <h4 class="text-sm font-bold text-white truncate">${ep.title}</h4>
        `;
        list.appendChild(item);
    });
}

function selectEpisode(epId) {
    state.selectedEpisodeId = epId;
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    const ep = proj.episodes.find(e => e.id === epId);
    document.getElementById('no-episode-placeholder').classList.add('hidden');
    document.getElementById('episode-editor-container').classList.remove('hidden');
    document.getElementById('current-episode-num').innerText = `ÉPISODE ${ep.number}`;
    document.getElementById('current-episode-title').innerText = ep.title;
    document.getElementById('episode-concept').value = ep.concept || '';
    document.getElementById('episode-story').value = ep.story || '';
    renderEpisodes();
    renderEpisodePrompts(ep);
}

function createNewEpisode() {
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    const epNum = proj.episodes.length + 1;
    const newEp = {
        id: 'ep-' + Date.now(),
        number: epNum,
        title: `Chapitre ${epNum}: Épisode sans titre`,
        concept: '',
        story: '',
        scenes: []
    };
    proj.episodes.push(newEp);
    state.selectedEpisodeId = newEp.id;
    selectEpisode(newEp.id);
    updateDashboardStats();
    alertToast(`Épisode ${epNum} initié !`);
}

async function generateEpisodeStory() {
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    const ep = proj.episodes.find(e => e.id === state.selectedEpisodeId);
    const concept = document.getElementById('episode-concept').value.trim();
    if (!concept) {
        alertToast("Veuillez saisir un résumé ou un pitch d'épisode de départ.");
        return;
    }
    alertToast("L'IA Gemini compose l'histoire complète...");
    const systemPrompt = "Tu es un mangaka chevronné. Rédige un scénario de manga complet découpé en plusieurs actions/descriptions visuelles clés.";
    const userQuery = `Rédige l'histoire détaillée du manga "${proj.title}" pour l'épisode intitulé "${ep.title}". 
    Genre: ${proj.genre}. 
    Pitch de départ de l'épisode : "${concept}".
    Mets en scène de façon percutante les rebondissements et structures de combat ou de drama typique du style. Écris le script de manière narrative.`;
    try {
        const story = await callGeminiAPI(userQuery, systemPrompt, false);
        document.getElementById('episode-story').value = story;
        ep.story = story;
        ep.concept = concept;
        await extractVisualPrompts();
    } catch (err) {
        console.error(err);
        alertToast("Erreur lors de la rédaction de l'histoire.");
    }
}

async function extractVisualPrompts() {
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    const ep = proj.episodes.find(e => e.id === state.selectedEpisodeId);
    const story = document.getElementById('episode-story').value.trim();
    if (!story) {
        alertToast("Veuillez d'abord rédiger ou générer l'histoire de l'épisode.");
        return;
    }
    alertToast("Extraction des descriptions de planches...");
    const systemPrompt = "Tu es un réalisateur d'anime / story-boarder de manga. Tu découpes un script écrit en prompts précis pour l'IA d'image Imagen.";
    const userQuery = `Découpe cette histoire de manga en 4 cases clés successives pour faire une planche complète de manga.
    Pour chaque case, génère un prompt d'image en anglais hyper-descriptif et pro. 
    Renvoie uniquement un format JSON strict :
    [
      {"case": 1, "action": "Description française", "prompt": "english detailed prompt, anime style, clean lines, masterpiece"},
      {"case": 2, "action": "Description française", "prompt": "english detailed prompt..."},
      {"case": 3, "action": "Description française", "prompt": "english detailed prompt..."},
      {"case": 4, "action": "Description française", "prompt": "english detailed prompt..."}
    ]
    Voici l'histoire : "${story}"`;
    try {
        const response = await callGeminiAPI(userQuery, systemPrompt, true);
        const scenes = JSON.parse(response);
        ep.scenes = scenes;
        renderEpisodePrompts(ep);
        alertToast("Prompts de cases extraits avec succès !");
    } catch (err) {
        console.error(err);
        alertToast("Échec de l'extraction des prompts.");
    }
}

function renderEpisodePrompts(ep) {
    const container = document.getElementById('episode-prompts-container');
    container.innerHTML = '';
    if (!ep.scenes || ep.scenes.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic">Aucun prompt disponible. Cliquez sur "Générer les Prompts".</p>`;
        return;
    }
    ep.scenes.forEach(sc => {
        const div = document.createElement('div');
        div.className = "bg-slate-950 border border-slate-800/80 p-3 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3";
        div.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Case ${sc.case}</span>
                    <span class="text-xs text-slate-400 font-medium truncate">${sc.action}</span>
                </div>
                <p class="text-[11px] text-slate-500 font-mono select-all line-clamp-1">${sc.prompt}</p>
            </div>
            <button onclick="sendToCanvasEditor('${encodeURIComponent(sc.prompt)}', ${sc.case})" class="bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-semibold text-xs py-1.5 px-3 rounded-md transition flex items-center gap-1">
                <i data-lucide="send" class="w-3.5 h-3.5"></i> Placer & Dessiner
            </button>
        `;
        container.appendChild(div);
    });
    lucide.createIcons();
}

function sendToCanvasEditor(encodedPrompt, caseNum) {
    const prompt = decodeURIComponent(encodedPrompt);
    switchTab('board-editor');
    document.getElementById('board-prompt-input').value = prompt;
    state.selectedCaseIndex = caseNum - 1;
    highlightSelectedCase(caseNum - 1);
    alertToast(`Prompt envoyé vers le canevas (Case active : ${caseNum})`);
}
