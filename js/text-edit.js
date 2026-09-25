// === ÚPRAVA TEXTOVÝCH POLÍ PŘÍMO NA KARTĚ (klasické kvarteto) ===============
// Klik na název / popisek pole vybere: obrys, 8 úchytů a lišta A− / A+.
// Tažení uprostřed = posun, úchyty = šířka / výška (výška 0 = auto podle textu).
// Změna jde do globálního nastavení sady, nebo do vlastního rozvržení karty,
// pokud ho karta má zapnuté (js/card-layout.js).
// Ovládací prvky nesou data-html2canvas-ignore → nejsou v Export ZIP.

const TEXT_FIELD_MIN = { w: 10, h: 3 };      // % karty
const TEXT_FIELD_FONT_STEP = 0.1; // rem; meze písma = TEXT_FIELDS[field].fontRange (jako posuvníky)
const TEXT_FIELD_HANDLES = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
// Ikony zarovnání (4 čáry jako ve Wordu): [x1, x2] každé čáry v 16px mřížce
const TEXT_ALIGN_ICONS = {
    left:    { title: 'Zarovnat vlevo',   lines: [[2, 14], [2, 10], [2, 14], [2, 9]] },
    center:  { title: 'Zarovnat na střed', lines: [[2, 14], [4, 12], [2, 14], [5, 11]] },
    right:   { title: 'Zarovnat vpravo',  lines: [[2, 14], [6, 14], [2, 14], [7, 14]] },
    justify: { title: 'Do bloku',          lines: [[2, 14], [2, 14], [2, 14], [2, 9]] }
};

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
    // Popisek bývá pod názvem → jeho lišta jde dolů, aby nezakryla název (a naopak)
    toolbar.className = field === 'desc' ? 'tf-toolbar tf-toolbar-below' : 'tf-toolbar';
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
    const current = card ? textFieldAlign(getCardLayout(card), field) : TEXT_ALIGN_DEFAULT;
    const sep = document.createElement('span');
    sep.className = 'tf-sep';
    toolbar.appendChild(sep);
    TEXT_ALIGNS.forEach(align => toolbar.appendChild(buildAlignButton(align, align === current)));
    const sep2 = document.createElement('span');
    sep2.className = 'tf-sep';
    toolbar.appendChild(sep2);
    toolbar.appendChild(buildCenterOnCardButton());
    el.appendChild(toolbar);
}

// Ikona „na střed karty“: rámeček karty, svislá osa a pole na ní
function buildCenterOnCardButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Na střed karty';
    btn.dataset.centerCard = '';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '13');
    svg.setAttribute('height', '13');
    const shapes = [
        ['rect', { x: 1.5, y: 1.5, width: 13, height: 13, rx: 2, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.3 }],
        ['line', { x1: 8, y1: 0, x2: 8, y2: 16, stroke: 'currentColor', 'stroke-width': 1, 'stroke-dasharray': '1.5 1.5' }],
        ['rect', { x: 4.5, y: 6, width: 7, height: 4, rx: 1, fill: 'currentColor' }]
    ];
    shapes.forEach(([tag, attrs]) => {
        const node = document.createElementNS(ns, tag);
        Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
        svg.appendChild(node);
    });
    btn.appendChild(svg);
    return btn;
}

// Vybrané pole na střed karty (sada, nebo karta s vlastním rozvržením)
function centerTextFieldOnCard() {
    if (!textSelection) return;
    const card = AppState.cards.find(c => c.id === textSelection.cardId);
    if (!card) return;
    writeTextFieldValues(card.id, { [TEXT_FIELDS[textSelection.field].x]: TEXT_FIELD_CARD_CENTER });
    saveState();
    renderUIFromState();
}

// Tlačítko v globálním panelu: pole na střed karty pro celou sadu
function centerQuartetFieldOnCard(field) {
    if (!TEXT_FIELDS[field]) return;
    AppState.quartetSettings = { ...AppState.quartetSettings, [TEXT_FIELDS[field].x]: TEXT_FIELD_CARD_CENTER };
    saveState();
    renderUIFromState();
}

function buildAlignButton(align, active) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = TEXT_ALIGN_ICONS[align].title;
    btn.dataset.align = align;
    if (active) btn.classList.add('active');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '13');
    svg.setAttribute('height', '13');
    TEXT_ALIGN_ICONS[align].lines.forEach(([x1, x2], i) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1); line.setAttribute('x2', x2);
        line.setAttribute('y1', 3 + i * 3.4); line.setAttribute('y2', 3 + i * 3.4);
        line.setAttribute('stroke', 'currentColor');
        line.setAttribute('stroke-width', '1.6');
        line.setAttribute('stroke-linecap', 'round');
        svg.appendChild(line);
    });
    btn.appendChild(svg);
    return btn;
}

function changeTextFieldAlign(align) {
    if (!textSelection || !TEXT_ALIGNS.includes(align)) return;
    const card = AppState.cards.find(c => c.id === textSelection.cardId);
    if (!card) return;
    writeTextFieldValues(card.id, { [TEXT_FIELDS[textSelection.field].align]: align });
    saveState();
    renderUIFromState();
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
    const alignBtn = e.target.closest('[data-align]');
    if (alignBtn) { changeTextFieldAlign(alignBtn.dataset.align); return; }
    if (e.target.closest('[data-center-card]')) { centerTextFieldOnCard(); return; }

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
