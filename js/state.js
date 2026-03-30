/**
 * STATE.JS 
 * Centrální správa stavu pro Unifikovaný Mřížkový Editor.
 * Každá karta v sadě má svůj vlastní stav ořezu.
 */

let AppState = {
    projectName: "Nová Karetní Sada",
    gameMode: 'playing_cards', // 'playing_cards' | 'quartet' | 'pexeso'
    
    // Kvarteta Nastavení
    quartetSettings: {
        attributeNames: ["Výška", "Váha", "Věk", "Síla"],
        hideStats: false,
        fontFamily: "'Cinzel', serif",
        statShape: "hexagon",
        statLayout: "corners",
        statSize: 1.0,
        fontSizeValue: 1.2,
        fontSizeLabel: 0.4,
        statValueOffset: 0,
        statLabelOffset: 0,
        statBgColor: "#000000",
        statOpacity: 0.4,
        statSpacing: 5,
        useSetColorId: false,
        useSetColorName: true,
        useSetColorDesc: false,
        useSetColorStatName: false,
        useSetColorStatValue: false,
        useSetColorStatBorder: false,
        idOffsetX: 50, idOffsetY: 2,
        nameOffsetX: 50, nameOffsetY: 12,
        descOffsetX: 50, descOffsetY: 5,
        layout: { offsetX: 2, offsetY: 2 },
        border: { width: 0, inset: 0, radius: 4 },
        sets: {
             "1": { color: "#ff4444" },
             "2": { color: "#4488ff" },
             "3": { color: "#44ff44" },
             "4": { color: "#ffff44" },
             "5": { color: "#ff88ff" },
             "6": { color: "#88ffff" },
             "7": { color: "#888888" },
             "8": { color: "#aa5500" }
        }
    },
    
    // Globální nastavení rozměrů (pro všechny karty stejné)
    cardWidth: 63,
    cardHeight: 88,
    cardRadius: 4,
    
    // Globální vrstva (Vrstva 2) - společná pro všechny karty
    globalOverlay: {
        image: null,
        opacity: 0.8,
        scale: 1,
        x: 0,
        y: 0,
        stretchX: 1,
        stretchY: 1,
        borderColor: '#000000',
        borderWidth: 0,
        inset: 0,
        borderRadius: 4
    },

    // Globální Logo (Vrstva 1)
    globalLogo: {
        image: null,
        opacity: 1,
        scale: 0.3,
        x: 0,
        y: 0,
        stretchX: 1,
        stretchY: 1
    },
    
    // Globální nastavení pro symboly (ovlivňuje všechny barvy a hodnoty)
    globalSymbolSettings: {
        scale: 1,
        opacity: 1,
        offsetX: 0,
        offsetY: 0,
        spacingY: 1,
        columnX: 0
    },

    // --- REŽIM PEXESO (v1.0) ---
    pexesoSettings: {
        pairsCount: 16,
        showName: true,
        showDesc: false,
        nameOffsetX: 50, nameOffsetY: 10,
        descOffsetX: 50, descOffsetY: 5,
        fontFamily: "'Roboto', sans-serif"
    },

    // --- REŽIM KVARTETA (v1.5) ---
    quartetSettings: {
        attributeNames: ["Výška", "Váha", "Věk", "Síla"], // Výchozí názvy
        globalText: {
            name: { font: 'Inter', size: 14, color: '#ffffff', x: 31.5, y: 72, align: 'center', weight: '700' },
            description: { font: 'Inter', size: 9, color: '#cccccc', x: 31.5, y: 78, align: 'center', italic: true },
            idBadge: { font: 'Inter', size: 12, color: '#ffffff', x: 5, y: 7, align: 'left', weight: '700' },
            attrLabel: { font: 'Inter', size: 8, color: '#aaaaaa' },
            attrValue: { font: 'Inter', size: 10, color: '#ffffff', weight: '600' }
        },
        sets: {
            "1": { color: "#ff4444", label: "SADA 1", borderWidth: 0, inset: 0, borderRadius: 4 },
            "2": { color: "#4444ff", label: "SADA 2", borderWidth: 0, inset: 0, borderRadius: 4 },
            "3": { color: "#ffaa00", label: "SADA 3", borderWidth: 0, inset: 0, borderRadius: 4 },
            "4": { color: "#22cc22", label: "SADA 4", borderWidth: 0, inset: 0, borderRadius: 4 },
            "5": { color: "#ff44ff", label: "SADA 5", borderWidth: 0, inset: 0, borderRadius: 4 },
            "6": { color: "#00ffff", label: "SADA 6", borderWidth: 0, inset: 0, borderRadius: 4 },
            "7": { color: "#ffffff", label: "SADA 7", borderWidth: 0, inset: 0, borderRadius: 4 },
            "8": { color: "#888888", label: "SADA 8", borderWidth: 0, inset: 0, borderRadius: 4 }
        }
    },

    showSymbols: true,

    // Nastavení symbolů pro každou barvu (značku)
    suitSettings: {
        'Srdce':  { image: null, opacity: 1, scale: 0.18, color: '#ff4444', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#ff4444', borderWidth: 0, inset: 0, borderRadius: 4 },
        'Piky':   { image: null, opacity: 1, scale: 0.18, color: '#4444ff', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#4444ff', borderWidth: 0, inset: 0, borderRadius: 4 },
        'Kule':   { image: null, opacity: 1, scale: 0.18, color: '#ffbb00', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#ffbb00', borderWidth: 0, inset: 0, borderRadius: 4 },
        'Žaludy': { image: null, opacity: 1, scale: 0.18, color: '#44ff44', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#44ff44', borderWidth: 0, inset: 0, borderRadius: 4 }
    },

    // Globální nastavení rozvržení dle hodnoty (7-Eso)
    valueSettings: {
        '7':      { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 },
        '8':      { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 },
        '9':      { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 },
        '10':     { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 },
        'Eso':    { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 },
        'Král':   { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 },
        'Svršek': { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 },
        'Spodek': { offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0 }
    },

    // HLAVNÍ DATA - Pole všech karet v mřížce
    cards: [], // { id, label, image, crop: {...}, symbolOverride: null }
    
    // Aktuálně vybraná karta pro manipulaci myší/kolečkem
    activeCardId: null,

    // Historie pro Undo/Redo (ukládáme kopie AppState bez historie)
    history: [],
    historyIndex: -1
};

// --- INICIALIZACE SADY ---

function initCardsByMode(mode, forceReset = false) {
    // Pokud už karty máme a nemáme vynucený reset, jen aktualizujeme UI a končíme
    if (!forceReset && AppState.cards && AppState.cards.length > 0 && AppState.gameMode === mode) {
        syncUIPanels(mode);
        renderUIFromState();
        return;
    }

    AppState.gameMode = mode;
    AppState.cards = [];
    
    if (mode === 'playing_cards') {
        // Hrací karty a kvarteta mají defaultně 63x105 mm
        AppState.cardWidth = 63;
        AppState.cardHeight = 105;
        
        const suits = ['Srdce', 'Piky', 'Kule', 'Žaludy'];
        const values = ['7', '8', '9', '10', 'Spodek', 'Svršek', 'Král', 'Eso'];
        suits.forEach(suit => {
            values.forEach(val => {
                AppState.cards.push(createEmptyCard(`${suit}_${val}`, `${val} ${suit}`));
            });
        });
    } else if (mode === 'quartet') {
        // Hrací karty a kvarteta mají defaultně 63x105 mm
        AppState.cardWidth = 63;
        AppState.cardHeight = 105;

        for (let i = 1; i <= 8; i++) {
            ['A', 'B', 'C', 'D'].forEach(letter => {
                AppState.cards.push(createEmptyCard(`q_${i}${letter}`, `${i}${letter}`));
            });
        }
    } else if (mode === 'pexeso') {
        if (!AppState.pexesoSettings) {
             AppState.pexesoSettings = {
                pairsCount: 16,
                showName: true,
                showDesc: false,
                nameOffsetX: 50, nameOffsetY: 10,
                descOffsetX: 50, descOffsetY: 5,
                fontFamily: "'Roboto', sans-serif"
            };
        }
        const pairs = AppState.pexesoSettings.pairsCount || 16;
        
        // Pexeso zůstává čtvercové
        AppState.cardWidth = 60;
        AppState.cardHeight = 60;
        AppState.cardRadius = 4;

        for (let i = 1; i <= pairs; i++) {
            AppState.cards.push(createEmptyCard(`pex_${i}A`, `${i}A`));
            AppState.cards.push(createEmptyCard(`pex_${i}B`, `${i}B`));
        }
    }
    
    syncUIPanels(mode);

    saveState();
    renderUIFromState();
}

function syncUIPanels(mode) {
    const qGlobalPanel = document.getElementById('quartet-global-panel');
    const symGlobalPanel = document.getElementById('symbols-global-panel');
    const layoutGlobalPanel = document.getElementById('layout-global-panel');
    const suitGlobalPanel = document.getElementById('suit-global-panel');
    const importBtn = document.getElementById('btn-import-json');
    const indQuartetControls = document.getElementById('individual-quartet-controls');
    const indLayoutControls = document.getElementById('individual-symbols-subgroup');
    const indPositionControls = document.getElementById('ind-position-subgroup');
    const pexGlobalPanel = document.getElementById('pexeso-global-panel');
    const showSymbolsRow = document.getElementById('show-symbols-row');
    
    if (qGlobalPanel) {
        if (mode === 'quartet') {
            qGlobalPanel.style.display = 'block';
            if (pexGlobalPanel) pexGlobalPanel.style.display = 'none';
            if (symGlobalPanel) symGlobalPanel.style.display = 'none';
            if (layoutGlobalPanel) layoutGlobalPanel.style.display = 'none';
            if (suitGlobalPanel) suitGlobalPanel.style.display = 'none';
            if (importBtn) importBtn.style.display = 'flex';
            if (indQuartetControls) indQuartetControls.style.display = 'block';
            if (indLayoutControls) indLayoutControls.style.display = 'none';
            if (indPositionControls) indPositionControls.style.display = 'none';
            if (showSymbolsRow) showSymbolsRow.style.display = 'none';
        } else if (mode === 'pexeso') {
            qGlobalPanel.style.display = 'none';
            if (pexGlobalPanel) pexGlobalPanel.style.display = 'block';
            if (symGlobalPanel) symGlobalPanel.style.display = 'none';
            if (layoutGlobalPanel) layoutGlobalPanel.style.display = 'none';
            if (suitGlobalPanel) suitGlobalPanel.style.display = 'none';
            if (importBtn) importBtn.style.display = 'none';
            if (indQuartetControls) indQuartetControls.style.display = 'none';
            if (indLayoutControls) indLayoutControls.style.display = 'none';
            if (indPositionControls) indPositionControls.style.display = 'none';
            if (showSymbolsRow) showSymbolsRow.style.display = 'none';
        } else {
            qGlobalPanel.style.display = 'none';
            if (pexGlobalPanel) pexGlobalPanel.style.display = 'none';
            if (symGlobalPanel) symGlobalPanel.style.display = 'block';
            if (layoutGlobalPanel) layoutGlobalPanel.style.display = 'flex';
            if (suitGlobalPanel) suitGlobalPanel.style.display = 'block';
            if (importBtn) importBtn.style.display = 'none';
            if (indQuartetControls) indQuartetControls.style.display = 'none';
            if (indLayoutControls) indLayoutControls.style.display = 'block';
            if (indPositionControls) indPositionControls.style.display = 'block';
            if (showSymbolsRow) showSymbolsRow.style.display = 'flex';
        }
    }
}

function createEmptyCard(id, label) {
    return {
        id: id,
        label: label,
        image: null,
        crop: { x: 0, y: 0, scale: 1, stretchX: 1, stretchY: 1 },
        isLocked: false,
        symbolOverride: null, // Initial value
        quartetData: {
            name: "",
            description: "",
            stats: ["", "", "", ""] // 4 default stats
        }
    };
}

// --- HISTORIE (UNDO / REDO) ---

function saveState() {
    // Smažeme budoucí větve při nové akci
    if (AppState.historyIndex < AppState.history.length - 1) {
        AppState.history = AppState.history.slice(0, AppState.historyIndex + 1);
    }
    
    // Uložíme hlubokou kopii stavu
    const stateCopy = JSON.parse(JSON.stringify({
        ...AppState,
        history: [],
        historyIndex: -1
    }));
    
    AppState.history.push(stateCopy);
    if (AppState.history.length > 50) AppState.history.shift();
    AppState.historyIndex = AppState.history.length - 1;

    autosaveToLocalStorage();
    console.log("State Saved. Index:", AppState.historyIndex);
}

function autosaveToLocalStorage() {
    try {
        const data = JSON.stringify({ ...AppState, history: [], historyIndex: -1 });
        localStorage.setItem('cardgen_autosave', data);
    } catch(e) { /* ignorovat - např. private mode */ }
}

function undo() {
    if (AppState.historyIndex > 0) {
        AppState.historyIndex--;
        restoreFromHistory();
    }
}

function redo() {
    if (AppState.historyIndex < AppState.history.length - 1) {
        AppState.historyIndex++;
        restoreFromHistory();
    }
}

function restoreFromHistory() {
    const historicalState = JSON.parse(JSON.stringify(AppState.history[AppState.historyIndex]));
    const currentHistory = AppState.history;
    const currentHistoryIndex = AppState.historyIndex;
    
    AppState = historicalState;
    AppState.history = currentHistory;
    AppState.historyIndex = currentHistoryIndex;
    
    renderUIFromState();
}

// --- PROJECT MANAGEMENT (API S SERVEREM) ---

function updateProjectName() {
    AppState.projectName = document.getElementById('project-name').value;
    saveState();
}

async function exportProject() {
    const projectData = {
        name: AppState.projectName,
        date: new Date().toISOString(),
        state: {
            ...AppState,
            history: [],
            historyIndex: -1
        }
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${AppState.projectName.replace(/\s+/g, '_')}.json`;
    a.click();
}

function loadProject(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const newState = data.state || data; // Tolerance pro různé formáty
            
            // Vyčistíme historii při načtení nového projektu
            AppState = newState;
            AppState.history = [];
            AppState.historyIndex = -1;
            
            saveState();
            renderUIFromState();
            alert(`Projekt '${AppState.projectName}' byl úspěšně načten.`);
        } catch(err) {
            alert("Chyba při parsování JSONu projektu.");
        }
    };
    reader.readAsText(file);
}

// --- UI SYNC ---

function renderUIFromState() {
    // Základní inputy v sidebaru
    const pn = document.getElementById('project-name');
    if(pn) pn.value = AppState.projectName;
    
    const ms = document.getElementById('game-mode-select');
    if(ms) ms.value = AppState.gameMode;
    
    const cw = document.getElementById('card-width');
    if(cw) cw.value = AppState.cardWidth;

    const ch = document.getElementById('card-height');
    if(ch) ch.value = AppState.cardHeight;

    const cr = document.getElementById('card-radius');
    if(cr) cr.value = AppState.cardRadius;

    // Pexeso UI Sync
    if (AppState.gameMode === 'pexeso' && AppState.pexesoSettings) {
        const ps = AppState.pexesoSettings;
        const p_pairs = document.getElementById('pexeso-pairs-select');
        if(p_pairs) p_pairs.value = ps.pairsCount;

        const p_name = document.getElementById('pexeso-show-name');
        if(p_name) p_name.checked = ps.showName;

        const p_desc = document.getElementById('pexeso-show-desc');
        if(p_desc) p_desc.checked = ps.showDesc;

        const p_font = document.getElementById('pexeso-font-family');
        if(p_font) p_font.value = ps.fontFamily;

        const p_nx = document.getElementById('pexeso-name-x');
        if(p_nx) p_nx.value = ps.nameOffsetX;
        const p_ny = document.getElementById('pexeso-name-y');
        if(p_ny) p_ny.value = ps.nameOffsetY;
        const p_dx = document.getElementById('pexeso-desc-x');
        if(p_dx) p_dx.value = ps.descOffsetX;
        const p_dy = document.getElementById('pexeso-desc-y');
        if(p_dy) p_dy.value = ps.descOffsetY;
    }

    // Pokud existuje renderGrid v generator.js, zavoláme jej
    if (typeof renderGrid === 'function') {
        renderGrid();
    }
}

// Spuštění po načtení
window.onload = () => {
    const saved = localStorage.getItem('cardgen_autosave');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            AppState = { ...AppState, ...parsed, history: [], historyIndex: -1 };
            saveState();
            // Tady NEVOLÁME initCardsByMode, pokud už v AppState karty jsou!
            if (!AppState.cards || AppState.cards.length === 0) {
                initCardsByMode(AppState.gameMode || 'playing_cards');
            } else {
                syncUIPanels(AppState.gameMode);
                renderUIFromState();
            }
            return;
        } catch(e) {}
    }
    if (AppState.cards.length === 0) {
        initCardsByMode('playing_cards');
    } else {
        syncUIPanels(AppState.gameMode);
        renderUIFromState();
    }
};
