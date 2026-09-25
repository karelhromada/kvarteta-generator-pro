// === ÚPRAVA TEXTOVÝCH POLÍ PŘÍMO NA KARTĚ (klasické kvarteto) ===============
// Klik na název / popisek pole vybere: obrys, 8 úchytů a lišta A− / A+.
// Tažení uprostřed = posun, úchyty = šířka / výška (výška 0 = auto podle textu).
// Změna jde do globálního nastavení sady, nebo do vlastního rozvržení karty,
// pokud ho karta má zapnuté (js/card-layout.js).
// Ovládací prvky nesou data-html2canvas-ignore → nejsou v Export ZIP.

const TEXT_FIELD_MIN = { w: 10, h: 3 };      // % karty
const TEXT_FIELD_FONT_STEP = 0.1; // rem; meze písma = TEXT_FIELDS[field].fontRange (jako posuvníky)
const TEXT_FIELD_HANDLES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

let textSelection = null; // { cardId, field }
let textDrag = null;

const round1 = v => Math.round(v * 10) / 10;

// Aktuální hodnoty pole (globál + případné vlastní rozvržení karty)
function textFieldValues(card, field) {
    const k = TEXT_FIELDS[field];
    const lay = getCardLayout(card);
    const num = (key, def) => { const v = parseFloat(lay[key]); return Number.isFinite(v) ? v : def; };
    return { x: num(k.x, k.defaults.x), y: num(k.y, k.defaults.y), w: num(k.w, k.defaults.w),
             h: num(k.h, k.defaults.h), font: num(k.font, k.defaults.font) };
}

// Zápis: do vlastního rozvržení karty, jinak do globálního nastavení sady
function writeTextFieldValues(cardId, values) {
    const card = AppState.cards.find(c => c.id === cardId);
    const override = card && card.quartetData ? card.quartetData.layoutOverride : null;
    if (override) {
        AppState.cards = AppState.cards.map(c => c.id === cardId
            ? { ...c, quartetData: { ...c.quartetData, layoutOverride: { ...override, ...values } } }
            : c);
    } else {
        AppState.quartetSettings = { ...AppState.quartetSettings, ...values };
    }
}

// Nový projekt / změna režimu / Zpět: starý výběr by se jinak přichytil ke kartě se stejným id
function resetTextSelection() {
    textSelection = null;
    if (textDrag && textDrag.frame) cancelAnimationFrame(textDrag.frame);
    textDrag = null;
}

function hasTextSelection(cardId) {
    return !!textSelection && textSelection.cardId === cardId;
}

function isTextFieldSelected(cardId, field) {
    return !!textSelection && textSelection.cardId === cardId && textSelection.field === field;
}

// Volá drawQuartetOverlay pro každé pole — označí ho a vybranému přidá ovládání
function decorateTextField(el, cardId, field) {
    el.dataset.textField = field;
    el.dataset.cardId = cardId;
    if (!isTextFieldSelected(cardId, field)) return;

    el.classList.add('tf-selected');
    const outline = document.createElement('div');
    outline.className = 'tf-outline';
    outline.setAttribute('data-html2canvas-ignore', '');
    el.appendChild(outline);

    TEXT_FIELD_HANDLES.forEach(dir => {
        const handle = document.createElement('div');
        handle.className = `tf-handle tf-${dir}`;
        handle.dataset.dir = dir;
        handle.setAttribute('data-html2canvas-ignore', '');
        el.appendChild(handle);
    });

    const toolbar = document.createElement('div');
    toolbar.className = 'tf-toolbar';
    toolbar.setAttribute('data-html2canvas-ignore', '');
    // Kam změna půjde: vlastní rozvržení karty, nebo celá sada
    const card = AppState.cards.find(c => c.id === cardId);
    const scope = document.createElement('span');
    scope.className = 'tf-scope';
    scope.innerText = card && card.quartetData && card.quartetData.layoutOverride ? 'Jen tato karta' : 'Celá sada';
    toolbar.appendChild(scope);
    [['A−', -1, 'Menší písmo'], ['A+', 1, 'Větší písmo']].forEach(([label, dir, title]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerText = label;
        btn.title = title;
        btn.dataset.fontStep = String(dir);
        toolbar.appendChild(btn);
    });
    el.appendChild(toolbar);
}

function selectTextField(cardId, field) {
    const prev = textSelection;
    textSelection = { cardId, field };
    if (prev && prev.cardId !== cardId) renderCard(prev.cardId);
    renderCard(cardId);
}

function clearTextSelection() {
    if (!textSelection) return;
    const prev = textSelection;
    textSelection = null;
    renderCard(prev.cardId);
}

function changeTextFieldFont(step) {
    if (!textSelection) return;
    const card = AppState.cards.find(c => c.id === textSelection.cardId);
    if (!card) return;
    const k = TEXT_FIELDS[textSelection.field];
    const current = textFieldValues(card, textSelection.field).font;
    const [min, max] = k.fontRange;
    const next = Math.min(max, Math.max(min, round1(current + step * TEXT_FIELD_FONT_STEP)));
    writeTextFieldValues(card.id, { [k.font]: next });
    saveState();
    renderUIFromState();
}

// Nové hodnoty pole podle tažení (dx, dy v % karty)
function draggedTextFieldValues(start, dir, dx, dy) {
    let { x, y, w, h } = start;
    if (dir === 'move') return { x: x + dx, y: y - dy, w, h };
    if (dir.includes('e')) { w = Math.max(TEXT_FIELD_MIN.w, start.w + dx); x = start.x + (w - start.w) / 2; }
    if (dir.includes('w')) { w = Math.max(TEXT_FIELD_MIN.w, start.w - dx); x = start.x - (w - start.w) / 2; }
    if (dir.includes('n')) { h = Math.max(TEXT_FIELD_MIN.h, start.h - dy); }
    if (dir.includes('s')) { h = Math.max(TEXT_FIELD_MIN.h, start.h + dy); y = start.y - (h - start.h); }
    return { x, y, w, h };
}

function startTextFieldDrag(e, fieldEl, dir) {
    const cardId = fieldEl.dataset.cardId;
    const field = fieldEl.dataset.textField;
    const card = AppState.cards.find(c => c.id === cardId);
    const cardEl = document.getElementById('card-el-' + cardId);
    if (!card || !cardEl) return;
    const cardRect = cardEl.getBoundingClientRect();
    const start = textFieldValues(card, field);
    // Výška „auto“ + tažení svisle → začni od skutečné výšky pole
    if (!start.h && /[ns]/.test(dir)) start.h = round1(fieldEl.getBoundingClientRect().height / cardRect.height * 100);
    textDrag = { cardId, field, dir, start, startX: e.clientX, startY: e.clientY,
                 cardW: cardRect.width, cardH: cardRect.height, moved: false, pending: null, frame: null };
}

// Zápis + překreslení karty nejvýš jednou za snímek
function applyTextDragFrame() {
    if (!textDrag) return;
    textDrag.frame = null;
    if (!textDrag.pending) return;
    writeTextFieldValues(textDrag.cardId, textDrag.pending);
    textDrag.pending = null;
    renderCard(textDrag.cardId); // ostatní karty se překreslí po puštění
}

document.addEventListener('mousedown', (e) => {
    if (AppState.gameMode !== 'quartet' || e.button !== 0) return;
    const fieldEl = e.target.closest('[data-text-field]');

    if (!fieldEl || !fieldEl.closest('.preview-card')) {
        // Klik jinam do mřížky karet výběr zruší (panel vlevo ho nechá být)
        if (textSelection && e.target.closest('#cards-grid')) clearTextSelection();
        return;
    }
    // Pole má přednost před posunem ilustrace (cropper.js)
    e.stopPropagation();
    e.preventDefault();

    const fontBtn = e.target.closest('[data-font-step]');
    if (fontBtn) { changeTextFieldFont(parseInt(fontBtn.dataset.fontStep, 10)); return; }

    const cardId = fieldEl.dataset.cardId;
    const field = fieldEl.dataset.textField;
    if (!isTextFieldSelected(cardId, field)) {
        if (AppState.activeCardId !== cardId) setActiveCard(cardId);
        selectTextField(cardId, field);
    }
    const handle = e.target.closest('.tf-handle');
    startTextFieldDrag(e, fieldEl, handle ? handle.dataset.dir : 'move');
}, true);

document.addEventListener('mousemove', (e) => {
    if (!textDrag) return;
    const dx = (e.clientX - textDrag.startX) / textDrag.cardW * 100;
    const dy = (e.clientY - textDrag.startY) / textDrag.cardH * 100;
    if (!textDrag.moved && Math.abs(dx) + Math.abs(dy) < 0.3) return; // jen klik = výběr
    textDrag.moved = true;

    const v = draggedTextFieldValues(textDrag.start, textDrag.dir, dx, dy);
    const k = TEXT_FIELDS[textDrag.field];
    const values = { [k.x]: round1(v.x), [k.y]: round1(v.y), [k.w]: round1(v.w) };
    if (v.h) values[k.h] = round1(v.h);
    textDrag.pending = values;
    if (!textDrag.frame) textDrag.frame = requestAnimationFrame(applyTextDragFrame);
});

document.addEventListener('mouseup', () => {
    if (!textDrag) return;
    if (textDrag.frame) cancelAnimationFrame(textDrag.frame);
    if (textDrag.pending) writeTextFieldValues(textDrag.cardId, textDrag.pending); // poslední pohyb
    const moved = textDrag.moved;
    textDrag = null;
    if (!moved) return;
    saveState();
    renderUIFromState(); // posuvníky + překreslení celé sady
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && textSelection) clearTextSelection();
});
