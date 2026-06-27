// js/api.js
async function callGeminiAPI(prompt, systemInstruction = "", useJson = false) {
    const apiKey = state.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    if (useJson) payload.generationConfig = { responseMimeType: "application/json" };

    let delay = 1000;
    for (let i = 0; i < 5; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
    }
    throw new Error("Impossible de joindre l'IA Gemini.");
}

async function callImagenAPI(promptText) {
    const apiKey = state.apiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    const payload = {
        instances: { prompt: promptText },
        parameters: { sampleCount: 1 }
    };

    let delay = 1000;
    for (let i = 0; i < 5; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json();
                const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;
                if (base64Bytes) {
                    return `data:image/png;base64,${base64Bytes}`;
                }
            }
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
    }
    // Fallback image
    return `https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80`;
}

function alertToast(message) {
    const toast = document.createElement('div');
    toast.className = "fixed bottom-5 right-5 bg-indigo-900 border-2 border-indigo-500/80 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-2xl z-50 animate-bounce flex items-center gap-2 max-w-sm";
    toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-indigo-300 shrink-0"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition', 'duration-500');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}
