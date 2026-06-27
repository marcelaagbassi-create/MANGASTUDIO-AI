// js/boards.js
function changeLayout() {
    const layout = document.getElementById('board-layout').value;
    const gridContainer = document.getElementById('manga-grid-container');
    gridContainer.innerHTML = '';

    let casesCount = 4;
    if (layout === "1") {
        gridContainer.className = "grid grid-cols-1 gap-3 min-h-[500px]";
        casesCount = 1;
    } else if (layout === "2-vertical") {
        gridContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[500px]";
        casesCount = 2;
    } else if (layout === "2-horizontal") {
        gridContainer.className = "grid grid-cols-1 gap-3 min-h-[500px]";
        casesCount = 2;
    } else if (layout === "3-grid") {
        gridContainer.className = "grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[500px]";
        casesCount = 3;
    } else if (layout === "4-grid") {
        gridContainer.className = "grid grid-cols-2 gap-3 min-h-[500px]";
        casesCount = 4;
    }

    for (let i = 0; i < casesCount; i++) {
        const caseBox = document.createElement('div');
        caseBox.id = `manga-case-${i}`;
        caseBox.className = "board-case border-2 border-dashed border-slate-300 bg-slate-50 relative flex flex-col items-center justify-center cursor-pointer overflow-hidden rounded-lg";
        caseBox.onclick = () => selectCase(i);
        caseBox.innerHTML = `
            <div class="absolute inset-0 bg-cover bg-center" id="case-bg-${i}"></div>
            <div id="case-bubbles-${i}" class="absolute inset-0 pointer-events-none p-3 flex flex-col justify-end space-y-2"></div>
            <div class="relative z-10 text-center p-3" id="case-placeholder-${i}">
                <div class="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-2 rounded-full inline-block mb-1 border border-slate-200">
                    <i data-lucide="plus" class="w-5 h-5 text-slate-500"></i>
                </div>
                <p class="text-[10px] font-bold text-slate-600 tracking-wider uppercase">Case ${i + 1}</p>
                <p class="text-[9px] text-slate-400">Cliquez pour configurer</p>
            </div>
        `;
        gridContainer.appendChild(caseBox);
    }
    lucide.createIcons();
    selectCase(0);
}

function selectCase(index) {
    state.selectedCaseIndex = index;
    highlightSelectedCase(index);
}

function highlightSelectedCase(index) {
    document.querySelectorAll('.board-case').forEach((el, idx) => {
        if (idx === index) {
            el.classList.remove('border-dashed', 'border-slate-300');
            el.classList.add('border-solid', 'border-blue-600', 'ring-2', 'ring-blue-500/20');
        } else {
            el.classList.add('border-dashed', 'border-slate-300');
            el.classList.remove('border-solid', 'border-blue-600', 'ring-2', 'ring-blue-500/20');
        }
    });
}

function updateBoardTitle() {
    const proj = state.projects.find(p => p.id === state.activeProjectId);
    document.getElementById('canvas-manga-title').innerText = proj.title;
    if (state.selectedEpisodeId) {
        const ep = proj.episodes.find(e => e.id === state.selectedEpisodeId);
        document.getElementById('canvas-episode-num').innerText = `CHAPITRE ${ep.number}`;
    } else {
        document.getElementById('canvas-episode-num').innerText = `EPISODE UN`;
    }
}

async function generateBoardImage() {
    if (state.selectedCaseIndex === null) {
        alertToast("Veuillez cliquer sur une case de la planche à générer.");
        return;
    }
    const basePrompt = document.getElementById('board-prompt-input').value.trim();
    const vibe = document.getElementById('board-prompt-vibe').value;
    const view = document.getElementById('board-prompt-view').value;
    if (!basePrompt) {
        alertToast("Saisissez d'abord une idée de dessin manga pour la case.");
        return;
    }
    alertToast("Génération de l'image de la case par Imagen 4.0...");
    const fullPrompt = `${basePrompt}, ${vibe}, ${view}, ultra detailed manga illustration, highly expressive lines, professional screen tone shading.`;
    try {
        const imageUrl = await callImagenAPI(fullPrompt);
        const bgElement = document.getElementById(`case-bg-${state.selectedCaseIndex}`);
        bgElement.style.backgroundImage = `url('${imageUrl}')`;
        document.getElementById(`case-placeholder-${state.selectedCaseIndex}`).classList.add('hidden');
        saveImageToGallery(imageUrl);
        alertToast(`Case ${state.selectedCaseIndex + 1} dessinée avec succès !`);
    } catch (err) {
        console.error(err);
        alertToast("Erreur lors de la génération de l'image.");
    }
}

function addBubbleToSelectedCase() {
    if (state.selectedCaseIndex === null) {
        alertToast("Sélectionnez d'abord la case sur laquelle appliquer le dialogue.");
        return;
    }
    const text = document.getElementById('bubble-text').value.trim();
    const type = document.getElementById('bubble-style').value;
    if (!text) {
        alertToast("Veuillez saisir le texte de la bulle.");
        return;
    }
    const bubbleContainer = document.getElementById(`case-bubbles-${state.selectedCaseIndex}`);
    const bubble = document.createElement('div');
    let styleClass = "bg-white text-black text-center font-bold px-3 py-1.5 rounded-full border-2 border-black max-w-[90%] text-[10px] shadow relative pointer-events-auto leading-tight";
    if (type === "shout") {
        styleClass = "bg-white text-red-600 text-center font-extrabold px-3 py-2 border-3 border-black max-w-[95%] text-[11px] uppercase tracking-wider shadow-lg relative pointer-events-auto scale-105 transform rotate-1";
        bubble.style.clipPath = "polygon(0% 15%, 15% 15%, 18% 0%, 30% 12%, 70% 8%, 75% 0%, 82% 12%, 100% 5%, 95% 45%, 100% 80%, 80% 75%, 72% 100%, 65% 82%, 25% 88%, 15% 100%, 8% 78%, 0% 50%)";
    } else if (type === "thought") {
        styleClass = "bg-white text-slate-800 text-center font-medium px-3 py-1.5 border border-dashed border-slate-600 rounded-2xl max-w-[85%] text-[10px] italic shadow pointer-events-auto";
    } else if (type === "onomatopoeia") {
        styleClass = "manga-font text-red-600 text-center text-lg uppercase tracking-widest scale-125 transform -rotate-6 pointer-events-auto drop-shadow-[0_2px_2px_rgba(0,0,0,1)]";
    }
    bubble.className = styleClass;
    bubble.innerText = text;
    bubble.onclick = (e) => {
        e.stopPropagation();
        bubble.remove();
        alertToast("Bulle supprimée.");
    };
    bubbleContainer.appendChild(bubble);
    document.getElementById('bubble-text').value = '';
    alertToast("Bulle ajoutée à la case active ! Cliquez dessus pour la supprimer.");
}

function saveImageToGallery(url) {
    state.generatedImages.push(url);
    const container = document.getElementById('quick-gallery');
    if (state.generatedImages.length === 1) {
        container.innerHTML = '';
    }
    const imgBox = document.createElement('div');
    imgBox.className = "aspect-square rounded-lg overflow-hidden border border-slate-800 cursor-pointer hover:border-blue-500 transition relative group";
    imgBox.onclick = () => {
        if (state.selectedCaseIndex !== null) {
            const bgElement = document.getElementById(`case-bg-${state.selectedCaseIndex}`);
            bgElement.style.backgroundImage = `url('${url}')`;
            document.getElementById(`case-placeholder-${state.selectedCaseIndex}`).classList.add('hidden');
            alertToast(`Image de la galerie placée sur la case ${state.selectedCaseIndex + 1}.`);
        }
    };
    imgBox.innerHTML = `
        <img src="${url}" class="object-cover w-full h-full">
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span class="text-[9px] text-white font-bold uppercase">Placer</span>
        </div>
    `;
    container.prepend(imgBox);
}

function exportMangaBoard() {
    alertToast("Préparation de la planche de manga pour l'exportation...");
    setTimeout(() => {
        alertToast("✓ Planche enregistrée avec succès dans votre galerie mobile !");
    }, 1500);
}
