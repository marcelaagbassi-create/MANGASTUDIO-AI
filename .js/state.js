// js/state.js
const state = {
    apiKey: "", // à remplir avec votre clé
    projects: [
        {
            id: "default-proj",
            title: "Shadow Weaver",
            genre: "Seinen Dark Fantasy",
            pitch: "Dans un monde dystopique, les ombres prennent forme physique. Un jeune guerrier tente de sceller le grand fléau à l'aide de l'encre divine.",
            characters: [],
            episodes: [],
            boards: []
        }
    ],
    activeProjectId: "default-proj",
    selectedEpisodeId: null,
    selectedCaseIndex: null,
    generatedImages: []
};

// Fonction de changement d'onglet (utilisée dans le HTML)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-slate-800', 'text-white');
        btn.classList.add('text-slate-400');
    });

    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-400');
        activeBtn.classList.add('bg-slate-800', 'text-white');
    }

    if (tabId === 'characters') renderCharacters();
    else if (tabId === 'episodes') renderEpisodes();
    else if (tabId === 'board-editor') updateBoardTitle();
}
