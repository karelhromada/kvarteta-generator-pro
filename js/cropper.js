// ===== CROPPER.JS (REFAKTOR PRO MŘÍŽKU) ===== //

let isDragging = false;
let startX, startY;

// Registrace globálních událostí pro manipulaci s aktivní kartou
document.addEventListener('mousedown', (e) => {
    // Ověříme, zda klikáme do workspace
    if (e.target.closest('.preview-card')) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // SHIFT + Drag -> Panning Globálního RÁMU (Layer 2)
    if (e.shiftKey) {
        AppState.globalOverlay.x += dx;
        AppState.globalOverlay.y += dy;
        renderGrid();
    } 
    // ALT + Drag -> Panning Globálního LOGA (Layer 1)
    else if (e.altKey) {
        AppState.globalLogo.x += dx;
        AppState.globalLogo.y += dy;
        renderGrid();
    }
    // Normální Drag -> Panning ilustrace aktivní karty (Layer 0)
    else if (AppState.activeCardId) {
        const card = AppState.cards.find(c => c.id === AppState.activeCardId);
        if (card && !card.isLocked) {
            card.crop.x += dx;
            card.crop.y += dy;
            updateCardTransform(card);
            
            // Sync s UI 
            const slX = document.getElementById('ind-img-x');
            const slY = document.getElementById('ind-img-y');
            if (slX) slX.value = card.crop.x;
            if (slY) slY.value = card.crop.y;
        }
    }

    startX = e.clientX;
    startY = e.clientY;
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        saveState(); // Uložíme finální pozici do historie
    }
});

// Zoomování pomocí kolečka myši (nad aktivní kartou)
document.addEventListener('wheel', (e) => {
    const cardEl = e.target.closest('.preview-card');
    if (!cardEl) return;
    
    e.preventDefault();
    
    // Podpora pro Mac Pinch-to-zoom (ctrlKey) a standardní kolečko
    let delta = e.deltaY;
    if (e.ctrlKey) delta *= 2; // Pinch-to-zoom bývá citlivější
    
    const zoomSpeed = 0.001;

    // SHIFT + Wheel -> Zoom Globálního RÁMU
    if (e.shiftKey) {
        AppState.globalOverlay.scale -= delta * zoomSpeed;
        if (AppState.globalOverlay.scale < 0.1) AppState.globalOverlay.scale = 0.1;
        renderGrid();
    } 
    // ALT + Wheel -> Zoom Globálního LOGA
    else if (e.altKey) {
        AppState.globalLogo.scale -= delta * zoomSpeed;
        if (AppState.globalLogo.scale < 0.05) AppState.globalLogo.scale = 0.05;
        renderGrid();
    }
    // Normální Wheel -> Zoom ilustrace konkrétní karty
    else {
        const id = cardEl.id.replace('card-el-', '');
        const card = AppState.cards.find(c => c.id === id);
        if (card && !card.isLocked) {
            card.crop.scale -= delta * zoomSpeed;
            if (card.crop.scale < 0.01) card.crop.scale = 0.01;
            updateCardTransform(card);
            
            // Sync s UI pokud je to aktivní karta
            if (AppState.activeCardId === id) {
                const slider = document.getElementById('ind-img-scale');
                if (slider) slider.value = Math.round(card.crop.scale * 100);
            }
        }
    }
    
    // Throttlované uložení stavu
    clearTimeout(window.zoomSaveTimeout);
    window.zoomSaveTimeout = setTimeout(() => saveState(), 500);
}, { passive: false });

// Pomocná funkce pro fyzický update transformace v DOMu
function updateCardTransform(card) {
    const cardEl = document.getElementById('card-el-' + card.id);
    if (!cardEl) return;
    
    const img = cardEl.querySelector('.card-bg img');
    if (img) {
        const c = card.crop;
        img.style.transform = `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px)) scale(${c.scale * (c.stretchX || 1)}, ${c.scale * (c.stretchY || 1)})`;
    }
}

// Reset ořezu aktivní karty
function resetCropZoom() {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (card) {
        card.crop = { x: 0, y: 0, scale: 1, stretchX: 1, stretchY: 1 };
        saveState();
        renderGrid();
    }
}

// --- HELPERS (STEPPER) ---

function stepValue(inputId, delta) {
    const input = document.getElementById(inputId);
    let val = parseFloat(input.value) || 0;
    val += delta;
    
    // Rozlišujeme globální vs lokální (budoucí) hodnoty
    if (val < 0 && !inputId.includes('crop')) val = 0;
    
    input.value = (Math.round(val * 10) / 10).toString();
    
    // Trigger onchange
    if (typeof input.onchange === 'function') {
        input.onchange({ target: input });
    } else {
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
