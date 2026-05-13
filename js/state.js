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
    // Default je pro režim 'playing_cards' (63×105). Při změně režimu se přepne dle MODE_CARD_SIZES.
    cardWidth: 63,
    cardHeight: 105,
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

    // Globální text po hodnotě karty (Eso/Král/Svršek/Spodek) — společné defaulty pro všechny 4 barvy.
    // Per karta lze přepsat sparse skrz card.textOverlay (jen klíče, které uživatel explicitně změnil).
    textValueSettings: {
        'Eso':    { enabled: false, text: 'A', font: "'Tangerine', cursive", size: 25, color: '#ffffff', bold: true, italic: false, x: 0, y: -158, align: 'center' },
        'Král':   { enabled: false, text: 'K', font: "'Tangerine', cursive", size: 25, color: '#ffffff', bold: true, italic: false, x: 0, y: -158, align: 'center' },
        'Svršek': { enabled: false, text: 'Q', font: "'Tangerine', cursive", size: 25, color: '#ffffff', bold: true, italic: false, x: 0, y: -158, align: 'center' },
        'Spodek': { enabled: false, text: 'J', font: "'Tangerine', cursive", size: 25, color: '#ffffff', bold: true, italic: false, x: 0, y: -158, align: 'center' }
    },

    // Per suit přepis barvy textu (null = bez override, použij globál)
    textSuitColors: {
        'Červené': null,
        'Zelené':  null,
        'Kule':    null,
        'Žaludy':  null
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
        'Červené': { image: null, opacity: 1, scale: 0.18, color: '#ff0000', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#ff0000', borderWidth: 0, inset: 0, borderRadius: 4 },
        'Zelené':  { image: null, opacity: 1, scale: 0.18, color: '#22cc22', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#22cc22', borderWidth: 0, inset: 0, borderRadius: 4 },
        'Kule':    { image: null, opacity: 1, scale: 0.18, color: '#8b4513', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#8b4513', borderWidth: 0, inset: 0, borderRadius: 4 },
        'Žaludy':  { image: null, opacity: 1, scale: 0.18, color: '#ffbb00', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#ffbb00', borderWidth: 0, inset: 0, borderRadius: 4 }
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

// Předvolené rozměry karet podle režimu (mm)
const MODE_CARD_SIZES = {
    'playing_cards': { width: 63, height: 105 },
    'quartet':       { width: 65, height: 95 },
    'pexeso':        { width: 50, height: 50 }
};

function initCardsByMode(mode) {
    // Pokud uživatel mění režim (ne pouhý reload), přepneme i rozměry karet
    const prevMode = AppState.gameMode;
    AppState.gameMode = mode;
    if (prevMode !== mode && MODE_CARD_SIZES[mode]) {
        AppState.cardWidth  = MODE_CARD_SIZES[mode].width;
        AppState.cardHeight = MODE_CARD_SIZES[mode].height;
    }
    AppState.cards = [];

    if (mode === 'playing_cards') {
        const suits = ['Červené', 'Zelené', 'Kule', 'Žaludy'];
        const values = ['7', '8', '9', '10', 'Spodek', 'Svršek', 'Král', 'Eso'];
        suits.forEach(suit => {
            values.forEach(val => {
                AppState.cards.push(createEmptyCard(`${suit}_${val}`, `${val} ${suit}`));
            });
        });
    } else if (mode === 'quartet') {
        for (let i = 1; i <= 8; i++) {
            ['A', 'B', 'C', 'D'].forEach(letter => {
                AppState.cards.push(createEmptyCard(`q_${i}${letter}`, `${i}${letter}`));
            });
        }
    } else if (mode === 'pexeso') {
        const count = AppState.pexesoCount || 16;
        for (let i = 1; i <= count; i++) {
            AppState.cards.push(createEmptyCard(`pex_${i}`, `Pexeso ${i}`));
        }
    }
    
    // UI Přepínač
    const qGlobalPanel = document.getElementById('quartet-global-panel');
    const symGlobalPanel = document.getElementById('symbols-global-panel');
    const layoutGlobalPanel = document.getElementById('layout-global-panel');
    const suitGlobalPanel = document.getElementById('suit-global-panel');
    const importBtn = document.getElementById('btn-import-json');
    const bulkBtn = document.getElementById('btn-bulk-import');
    const indQuartetControls = document.getElementById('individual-quartet-controls');
    const indLayoutControls = document.getElementById('individual-symbols-subgroup');
    const indPositionControls = document.getElementById('ind-position-subgroup');
    const showSymbolsRow = document.getElementById('show-symbols-row');
    
    if (qGlobalPanel) {
        if (mode === 'quartet') {
            qGlobalPanel.style.display = 'block';
            if (symGlobalPanel) symGlobalPanel.style.display = 'none';
            if (layoutGlobalPanel) layoutGlobalPanel.style.display = 'none';
            if (suitGlobalPanel) suitGlobalPanel.style.display = 'none';
            if (importBtn) importBtn.style.display = 'flex';
            if (bulkBtn) bulkBtn.style.display = 'flex';
            if (indQuartetControls) indQuartetControls.style.display = 'block';
            if (indLayoutControls) indLayoutControls.style.display = 'none';
            if (indPositionControls) indPositionControls.style.display = 'none';
            if (showSymbolsRow) showSymbolsRow.style.display = 'none';
        } else {
            qGlobalPanel.style.display = 'none';
            if (symGlobalPanel) symGlobalPanel.style.display = 'block';
            if (layoutGlobalPanel) layoutGlobalPanel.style.display = 'flex';
            if (suitGlobalPanel) suitGlobalPanel.style.display = 'block';
            if (importBtn) importBtn.style.display = 'none';
            if (bulkBtn) bulkBtn.style.display = 'none';
            if (indQuartetControls) indQuartetControls.style.display = 'none';
            if (indLayoutControls) indLayoutControls.style.display = 'block';
            if (indPositionControls) indPositionControls.style.display = 'block';
            if (showSymbolsRow) showSymbolsRow.style.display = 'flex';
        }
    }

    saveState();
    renderUIFromState();
}

function createEmptyCard(id, label) {
    return {
        id: id,
        label: label,
        image: null,
        crop: { x: 0, y: 0, scale: 1, stretchX: 1, stretchY: 1 },
        isLocked: false,
        symbolOverride: null, // Initial value
        textOverlay: null,    // null = vypnuto; jinak { text, font, size, color, bold, italic, x, y, align }
        cardLogo: null,       // null = vypnuto; jinak { image, opacity, scale, x, y, stretchX, stretchY }
        quartetData: {
            name: "",
            description: "",
            stats: ["", "", "", ""] // 4 default stats
        }
    };
}

// --- HISTORIE (UNDO / REDO) ---

// Maximální počet snapshotů v historii. Každý snapshot drží celý stav včetně
// base64 obrázků (32 karet × stovky kB). Nízký limit chrání paměť tabu.
const HISTORY_LIMIT = 5;

function saveState() {
    // Smažeme budoucí větve při nové akci
    if (AppState.historyIndex < AppState.history.length - 1) {
        AppState.history = AppState.history.slice(0, AppState.historyIndex + 1);
    }

    // Uložíme hlubokou kopii stavu — JSON.stringify může selhat při velkém
    // stavu (OOM, structured-clone limit). Při selhání jen logujeme a
    // historie zůstane beze změny; UI dál funguje.
    try {
        const stateCopy = JSON.parse(JSON.stringify({
            ...AppState,
            history: [],
            historyIndex: -1
        }));
        AppState.history.push(stateCopy);
        if (AppState.history.length > HISTORY_LIMIT) AppState.history.shift();
        AppState.historyIndex = AppState.history.length - 1;
    } catch (e) {
        console.error('saveState: deep clone selhal, snapshot přeskočen', e);
    }

    autosaveToLocalStorage();
}

function showAutosaveWarning(message) {
    let banner = document.getElementById('autosave-warning');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'autosave-warning';
        banner.style.cssText = 'position:fixed; top:10px; right:10px; z-index:9999; background:#b91c1c; color:#fff; padding:10px 14px; border-radius:6px; font-size:12px; max-width:320px; box-shadow:0 4px 12px rgba(0,0,0,0.4); cursor:pointer;';
        banner.addEventListener('click', () => banner.remove());
        document.body.appendChild(banner);
    }
    banner.textContent = '⚠️ ' + message + ' (klikni pro skrytí)';
}

function autosaveToLocalStorage() {
    const normalizeKeys = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const normalized = {};
        for (let key in obj) {
            const normKey = key.normalize('NFC');
            normalized[normKey] = obj[key];
        }
        return normalized;
    };

    // Vždy normalizujeme klíče barev při ukládání (ochrana proti Mac NFD)
    AppState.suitSettings = normalizeKeys(AppState.suitSettings);

    try {
        const stateToSave = { ...AppState, history: [], historyIndex: -1 };
        localStorage.setItem('cardgen_autosave', JSON.stringify(stateToSave));
    } catch (e) {
        // QuotaExceededError nebo serializační chyba → upozornit uživatele,
        // aby exportoval projekt přes "Uložit Projekt".
        const isQuota = e && (e.name === 'QuotaExceededError' || (e.code && e.code === 22));
        const msg = isQuota
            ? 'Autosave selhal — překročen limit localStorage. Exportuj projekt přes „Uložit Projekt".'
            : 'Autosave selhal: ' + (e && e.message ? e.message : 'neznámá chyba') + '. Exportuj projekt přes „Uložit Projekt".';
        showAutosaveWarning(msg);
        console.error('autosaveToLocalStorage:', e);
    }
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

    // Pokud existuje renderGrid v generator.js, zavoláme jej
    if (typeof renderGrid === 'function') {
        renderGrid();
    }
}

// Idempotentně doplní nová pole stavu, která nebyla v dříve uloženém autosave.
// Bez tohoto by starý projekt po nasazení nové verze padal kvůli `undefined`.
function migrateMissingState() {
    const defaultTextValue = (text) => ({
        enabled: false, text, font: "'Tangerine', cursive", size: 25, color: '#ffffff',
        bold: true, italic: false, x: 0, y: -158, align: 'center'
    });
    if (!AppState.textValueSettings || typeof AppState.textValueSettings !== 'object') {
        AppState.textValueSettings = {
            'Eso':    defaultTextValue('A'),
            'Král':   defaultTextValue('K'),
            'Svršek': defaultTextValue('Q'),
            'Spodek': defaultTextValue('J')
        };
    } else {
        ['Eso', 'Král', 'Svršek', 'Spodek'].forEach(val => {
            if (!AppState.textValueSettings[val]) {
                const fallback = { 'Eso': 'A', 'Král': 'K', 'Svršek': 'Q', 'Spodek': 'J' };
                AppState.textValueSettings[val] = defaultTextValue(fallback[val]);
            } else if (AppState.textValueSettings[val].font === "'Cinzel', serif") {
                // Předchozí default fontu (Cinzel) byl změněn na Tangerine.
                // Pokud uživatel font ručně nezměnil, doženeme to.
                AppState.textValueSettings[val].font = "'Tangerine', cursive";
            }
        });
    }
    if (!AppState.textSuitColors || typeof AppState.textSuitColors !== 'object') {
        AppState.textSuitColors = { 'Červené': null, 'Zelené': null, 'Kule': null, 'Žaludy': null };
    } else {
        ['Červené', 'Zelené', 'Kule', 'Žaludy'].forEach(s => {
            if (!(s in AppState.textSuitColors)) AppState.textSuitColors[s] = null;
        });
    }
}

// Spuštění po načtení
window.onload = () => {
    const normalizeKeys = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        const normalized = {};
        for (let key in obj) {
            const normKey = key.normalize('NFC');
            normalized[normKey] = obj[key];
        }
        return normalized;
    };

    const saved = localStorage.getItem('cardgen_autosave');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Normalizujeme klíče barev při načtení
            if (parsed.suitSettings) {
                parsed.suitSettings = normalizeKeys(parsed.suitSettings);
            }
            AppState = { ...AppState, ...parsed, history: [], historyIndex: -1 };
            migrateMissingState();
            saveState();
            initCardsByMode(AppState.gameMode || 'playing_cards');
            renderUIFromState();
            return;
        } catch(e) {}
    }
    if (AppState.cards.length === 0) {
        migrateMissingState();
        initCardsByMode('playing_cards');
    } else {
        // Normalizujeme i v případě, že karty už existují
        AppState.suitSettings = normalizeKeys(AppState.suitSettings);
        migrateMissingState();
        initCardsByMode(AppState.gameMode || 'playing_cards');
        renderUIFromState();
    }
};
