// js/characters.js
async function autofillCharacter() {
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    const systemPrompt = "Tu es un scénariste de manga de renom mondial. Génère un personnage de manga captivant.";
    const userQuery = `Génère une description détaillée en français d'un personnage pour un manga de genre "${proj.genre}". 
    Donne les détails suivants au format JSON strict :
    {"name": "Nom du perso", "age": "Âge", "role": "Protagoniste ou Antagoniste", "powers": "Pouvoirs magiques ou capacités", "physical": "Description visuelle très précise pour un dessinateur de manga"}`;
    alertToast("L'IA conçoit le personnage...");
    try {
        const response = await callGeminiAPI(userQuery, systemPrompt, true);
        const charData = JSON.parse(response);
        document.getElementById('char-name').value = charData.name || '';
        document.getElementById('char-age').value = charData.age || '';
        document.getElementById('char-role').value = charData.role || 'Protagoniste';
        document.getElementById('char-powers').value = charData.powers || '';
        document.getElementById('char-physical').value = charData.physical || '';
        alertToast("Profil du personnage généré avec succès !");
    } catch (err) {
        console.error(err);
        alertToast("Erreur lors de la génération IA du personnage.");
    }
}

async function generateCharacterPortrait() {
    const name = document.getElementById('char-name').value.trim();
    const physical = document.getElementById('char-physical').value.trim();
    const artStyle = document.getElementById('char-art-style').value;
    if (!name || !physical) {
        alertToast("Veuillez renseigner au moins le nom et la description physique du personnage.");
        return;
    }
    alertToast("Dessin du portrait en cours par Imagen...");
    const optimizeSystem = "Tu es un ingénieur de prompt spécialisé dans la génération d'images d'anime et de manga d'une précision absolue.";
    const optimizeQuery = `Rédige un prompt en anglais hyper-détaillé et professionnel pour générer le portrait de ce personnage de manga : "${physical}". Le style de dessin doit être : "${artStyle}". N'inclus rien d'autre que le prompt optimisé.`;
    try {
        const optimizedPrompt = await callGeminiAPI(optimizeQuery, optimizeSystem, false);
        const portraitUrl = await callImagenAPI(optimizedPrompt);
        const proj = state.projects.find(p => p.id === state.activeProjectId);
        const newChar = {
            id: 'char-' + Date.now(),
            name,
            role: document.getElementById('char-role').value,
            age: document.getElementById('char-age').value,
            powers: document.getElementById('char-powers').value,
            physical,
            image: portraitUrl
        };
        proj.characters.push(newChar);
        saveImageToGallery(portraitUrl);
        renderCharacters();
        updateDashboardStats();
        alertToast(`Le portrait de ${name} est prêt !`);
    } catch (err) {
        console.error(err);
        alertToast("Erreur lors du dessin du portrait.");
    }
}

function renderCharacters() {
    const container = document.getElementById('characters-list-container');
    container.innerHTML = '';
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    if (proj.characters.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 text-center p-8 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl text-slate-500">
                Aucun personnage pour ce projet. Créez-en un avec le module de gauche !
            </div>
        `;
        return;
    }
    proj.characters.forEach(char => {
        const card = document.createElement('div');
        card.className = "bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col md:flex-row";
        card.innerHTML = `
            <div class="w-full md:w-1/3 aspect-square md:aspect-auto bg-slate-950 flex items-center justify-center relative overflow-hidden border-r border-slate-800">
                <img src="${char.image}" alt="${char.name}" class="object-cover w-full h-full" onerror="this.src='https://placehold.co/400x500?text=Portrait'">
                <span class="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">${char.role}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h4 class="text-md font-bold text-white mb-0.5">${char.name}</h4>
                    <p class="text-xs text-slate-400 mb-2">Âge: ${char.age || 'Inconnu'}</p>
                    <p class="text-xs text-slate-300 font-medium mb-1"><strong class="text-slate-400">Aptitudes:</strong> ${char.powers || 'Aucun'}</p>
                    <p class="text-[11px] text-slate-400 leading-relaxed line-clamp-3">${char.physical}</p>
                </div>
                <button onclick="useCharacterAsPrompt('${char.id}')" class="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-1.5 rounded-lg transition flex items-center justify-center gap-1.5">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-blue-400"></i> Choisir comme Prompt Case
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    lucide.createIcons();
}

function useCharacterAsPrompt(charId) {
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    const char = proj.characters.find(c => c.id === charId);
    if (!char) return;
    switchTab('board-editor');
    document.getElementById('board-prompt-input').value = `${char.name}, ${char.physical}, style de dessin manga`;
    alertToast(`Prompt mis à jour avec le profil de ${char.name} !`);
}
