// === ROZVRŽENÍ JEDNÉ KARTY (kvarteta + mytologie) =========================
// Per-karta přepis velikosti a umístění označení (ID), názvu a popisku.
// Uloženo v card.quartetData[store] jako { klíč: číslo }; null = karta se řídí
// globálním nastavením režimu. Klíče jsou stejné jako v globálních settings,
// takže renderer jen sloučí { ...globál, ...override } (viz getCardLayout).

// Výběrová pole (místo posuvníku) — hodnota je text
const ALIGN_OPTIONS = [['left', 'Vlevo'], ['center', 'Na střed'], ['right', 'Vpravo'], ['justify', 'Do bloku']];

const CARD_LAYOUT_MODES = {
    quartet: {
        store: 'layoutOverride',
        settings: () => AppState.quartetSettings || {},
        fields: [
            { key: 'idBadgeSize',  label: 'Velikost označení (×)',  min: 0.5, max: 2.5, step: 0.05, def: 1.0 },
            { key: 'idOffsetX',    label: 'Označení X (%)',         min: 0,   max: 100, step: 1,    def: 50 },
            { key: 'idOffsetY',    label: 'Označení Y (%)',         min: 0,   max: 100, step: 1,    def: 2 },
            { key: 'nameFontSize', label: 'Velikost názvu (rem)',   min: 0.5, max: 3.0, step: 0.05, def: 1.3 },
            { key: 'nameOffsetX',  label: 'Název X (%)',            min: 0,   max: 100, step: 1,    def: 50, centerButton: 'name' },
            { key: 'nameOffsetY',  label: 'Název Y (%)',            min: 0,   max: 100, step: 1,    def: 12 },
            { key: 'nameWidth',    label: 'Název šířka (%)',        min: 10,  max: 100, step: 0.5,  def: 90 },
            { key: 'nameHeight',   label: 'Název výška (%, 0 = auto)', min: 0, max: 60, step: 0.5,  def: 0 },
            { key: 'nameAlign',    label: 'Zarovnání názvu',        options: ALIGN_OPTIONS,       def: 'left' },
            { key: 'descFontSize', label: 'Velikost popisku (rem)', min: 0.3, max: 2.0, step: 0.05, def: 0.6 },
            { key: 'descOffsetX',  label: 'Popisek X (%)',          min: 0,   max: 100, step: 1,    def: 50, centerButton: 'desc' },
            { key: 'descOffsetY',  label: 'Popisek Y (%)',          min: 0,   max: 100, step: 1,    def: 5 },
            { key: 'descWidth',    label: 'Popisek šířka (%)',      min: 10,  max: 100, step: 0.5,  def: 80 },
            { key: 'descHeight',   label: 'Popisek výška (%, 0 = auto)', min: 0, max: 60, step: 0.5, def: 0 },
            { key: 'descAlign',    label: 'Zarovnání popisku',      options: ALIGN_OPTIONS,       def: 'left' }
        ]
    },
    quartet_mythology: {
        store: 'mythLayoutOverride',
        settings: () => AppState.mythologySettings || {},
        fields: [
            { key: 'idBadgeSize',      label: 'Velikost označení (×)',       min: 0.5, max: 2.5, step: 0.05, def: 1.0 },
            { key: 'idBadgeOffsetX',   label: 'Označení — posun X (%)',      min: -15, max: 15,  step: 0.5,  def: 0 },
            { key: 'idBadgeOffsetY',   label: 'Označení — posun Y (%)',      min: -15, max: 15,  step: 0.5,  def: 0 },
            { key: 'nameFontSize',     label: 'Velikost jména (×)',          min: 0.5, max: 2.5, step: 0.05, def: 1.0 },
            { key: 'subtitleFontSize', label: 'Velikost podtitulu (×)',      min: 0.5, max: 2.5, step: 0.05, def: 1.0 },
            { key: 'namePatchOffsetX', label: 'Jméno + podtitul — posun X (%)', min: -30, max: 30, step: 0.5, def: 0 },
            { key: 'namePatchOffsetY', label: 'Jméno + podtitul — posun Y (%)', min: -30, max: 30, step: 0.5, def: 0 }
        ]
    }
};

function getCardLayoutMode() {
    return CARD_LAYOUT_MODES[AppState.gameMode] || null;
}

// Globální nastavení sloučené s přepisem karty — čtou ho drawQuartetOverlay / drawMythologyOverlay.
function getCardLayout(card) {
    const mode = getCardLayoutMode();
    if (!mode) return {};
    const base = mode.settings();
    const override = card && card.quartetData ? card.quartetData[mode.store] : null;
    return override ? { ...base, ...override } : base;
}

// Hodnota, kterou karta právě používá bez přepisu (výchozí hodnoty = renderer)
function globalLayoutValue(mode, field) {
    const s = mode.settings();
    if (field.options) return field.options.some(([v]) => v === s[field.key]) ? s[field.key] : field.def;
    // Mytologie: ID badge bez vlastní velikosti přebírá velikost origin badge
    const fallback = (field.key === 'idBadgeSize' && AppState.gameMode === 'quartet_mythology')
        ? (s.cornerBadgeSize ?? field.def)
        : field.def;
    const v = parseFloat(s[field.key]);
    return Number.isFinite(v) ? v : fallback;
}

function getActiveCard() {
    if (!AppState.activeCardId) return null;
    return AppState.cards.find(c => c.id === AppState.activeCardId) || null;
}

function toggleCardLayoutOverride(enabled) {
    const card = getActiveCard();
    const mode = getCardLayoutMode();
    if (!card || !mode) return;
    if (!card.quartetData) card.quartetData = { name: "", description: "", stats: ["", "", "", ""], subtitle: "", badgeOverride: null };

    // Zapnutí = snapshot aktuálních globálních hodnot, aby karta neposkočila
    card.quartetData[mode.store] = enabled
        ? Object.fromEntries(mode.fields.map(f => [f.key, globalLayoutValue(mode, f)]))
        : null;

    saveState();
    syncCardLayoutControls(card);
    requestCardRender(card.id);
}

function updateCardLayoutField(key, value) {
    const card = getActiveCard();
    const mode = getCardLayoutMode();
    const field = mode && mode.fields.find(f => f.key === key);
    if (!card || !field || !card.quartetData || !card.quartetData[mode.store]) return;
    const v = field.options ? value : parseFloat(value);
    const valid = field.options ? field.options.some(([o]) => o === v) : Number.isFinite(v);
    if (!valid) return;
    card.quartetData[mode.store] = { ...card.quartetData[mode.store], [key]: v };
    debouncedSaveState();
    requestCardRender(card.id);
}

// Posuvníky se staví z CARD_LAYOUT_MODES — jen při změně režimu
function buildCardLayoutSliders(body, mode) {
    body.innerHTML = '';
    mode.fields.forEach(f => {
        if (f.options) { body.appendChild(buildCardLayoutSelect(f)); return; }
        const group = document.createElement('div');
        group.className = 'control-group';
        group.innerHTML = `
            <div class="control-header">
                <label>${f.label}</label>
                <span class="value-badge" id="val-ind-layout-${f.key}"></span>
            </div>
            <input type="range" id="ind-layout-${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" style="width:100%;">`;
        const input = group.querySelector('input');
        const badge = group.querySelector('.value-badge');
        input.addEventListener('input', () => {
            badge.innerText = input.value;
            updateCardLayoutField(f.key, input.value);
        });
        if (f.centerButton) group.appendChild(buildCardCenterButton(f));
        body.appendChild(group);
    });
    body.dataset.mode = AppState.gameMode;
}

// „Na střed karty“ pod posuvníkem X (střed pole na střed karty + text na střed)
function buildCardCenterButton(f) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-btn center-card-btn';
    btn.style.marginTop = '4px';
    btn.innerText = '⇔ Na střed karty';
    btn.addEventListener('click', () => {
        const card = getActiveCard();
        const mode = getCardLayoutMode();
        if (!card || !mode || !card.quartetData || !card.quartetData[mode.store]) return;
        // Jednorázové kliknutí = jeden krok historie hned (ne debounce jako u posuvníku)
        card.quartetData[mode.store] = { ...card.quartetData[mode.store], ...cardCenterValues(f.centerButton) };
        saveState();
        syncCardLayoutControls(card); // posuvník X + výběr zarovnání
        requestCardRender(card.id);
    });
    return btn;
}

function buildCardLayoutSelect(f) {
    const row = document.createElement('div');
    row.className = 'control-row';
    const label = document.createElement('label');
    label.innerText = f.label;
    const select = document.createElement('select');
    select.id = `ind-layout-${f.key}`;
    select.className = 'dropdown';
    f.options.forEach(([value, text]) => select.appendChild(new Option(text, value)));
    select.addEventListener('change', () => updateCardLayoutField(f.key, select.value));
    row.append(label, select);
    return row;
}

function syncCardLayoutControls(card) {
    const section = document.getElementById('ind-card-layout');
    const body = document.getElementById('ind-layout-body');
    const toggle = document.getElementById('ind-layout-toggle');
    const mode = getCardLayoutMode();
    if (!section || !body || !toggle) return;
    if (!mode || !card) { section.style.display = 'none'; return; }
    section.style.display = 'block';

    if (body.dataset.mode !== AppState.gameMode) buildCardLayoutSliders(body, mode);

    const override = card.quartetData ? card.quartetData[mode.store] : null;
    const actions = document.getElementById('ind-layout-actions');
    toggle.checked = !!override;
    body.style.display = override ? 'block' : 'none';
    if (actions) actions.style.display = override ? 'block' : 'none';
    if (!override) return;

    mode.fields.forEach(f => {
        const value = override[f.key] ?? globalLayoutValue(mode, f);
        const input = document.getElementById(`ind-layout-${f.key}`);
        const badge = document.getElementById(`val-ind-layout-${f.key}`);
        if (input) input.value = value;
        if (badge) badge.innerText = value;
    });
}

// Rozvržení aktivní karty se stane globálním nastavením celé sady;
// vlastní rozvržení všech karet se zruší (dál se ladí globálními posuvníky).
function applyCardLayoutToAll() {
    const card = getActiveCard();
    const mode = getCardLayoutMode();
    const override = card && mode && card.quartetData ? card.quartetData[mode.store] : null;
    if (!override) {
        alert('Tato karta nemá vlastní rozvržení. Zapni „Vlastní velikost a umístění“ a nastav ho.');
        return;
    }
    const others = AppState.cards.filter(c => c.id !== card.id && c.quartetData && c.quartetData[mode.store]).length;
    const warning = others ? ` Vlastní rozvržení na ${others} dalších kartách se zruší.` : '';
    if (!confirm(`Použít rozvržení karty „${card.label}" na všechny karty sady?${warning} (Lze vrátit tlačítkem Zpět.)`)) {
        return;
    }

    const settingsKey = AppState.gameMode === 'quartet' ? 'quartetSettings' : 'mythologySettings';
    AppState[settingsKey] = { ...AppState[settingsKey], ...override };
    AppState.cards = AppState.cards.map(c => (c.quartetData && c.quartetData[mode.store])
        ? { ...c, quartetData: { ...c.quartetData, [mode.store]: null } }
        : c);

    saveState();
    renderUIFromState();
}
