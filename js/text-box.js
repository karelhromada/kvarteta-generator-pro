// === TEXTOVÁ POLE NÁZVU / POPISKU (klasické kvarteto) ======================
// Pole = absolutně umístěný element (šířka/výška v % karty), uvnitř .kvarteta-text-inner.
//  - Rámeček: volitelné poloprůhledné pozadí, které obtéká text. Odsazení a zaoblení
//    jsou v em → rezerva roste s písmem. Jen background + border-radius → stejné
//    i v Export ZIP (html2canvas).
//  - Přizpůsobení: když se text do pole nevejde, písmo se zmenší (nastavená
//    velikost je maximum); zalomený rámeček se zúží na nejdelší řádek.

const TEXT_BOX_DEFAULTS = { color: '#000000', opacity: 50 }; // opacity v %
const TEXT_FIELD_MIN_FONT_PX = 4;

// Klíče v quartetSettings / layoutOverride a výchozí hodnoty (= původní vzhled).
// x = střed pole, y = spodní hrana od spodku karty, w/h = rozměr; vše v % karty; h 0 = auto.
const TEXT_FIELDS = {
    name: { x: 'nameOffsetX', y: 'nameOffsetY', w: 'nameWidth', h: 'nameHeight', font: 'nameFontSize', align: 'nameAlign',
            defaults: { x: 50, y: 12, w: 90, h: 0, font: 1.3 }, fontRange: [0.5, 3.0] },
    desc: { x: 'descOffsetX', y: 'descOffsetY', w: 'descWidth', h: 'descHeight', font: 'descFontSize', align: 'descAlign',
            defaults: { x: 50, y: 5, w: 80, h: 0, font: 0.6 }, fontRange: [0.3, 2.0] }
};

// „Na střed karty“: střed pole na střed karty (x v % šířky karty) + text zarovnaný na střed.
// Samotný posun pole nestačí — text zarovnaný vlevo by uskočil a každý název je jinak dlouhý.
const TEXT_FIELD_CARD_CENTER = 50;

function cardCenterValues(field) {
    const k = TEXT_FIELDS[field];
    return { [k.x]: TEXT_FIELD_CARD_CENTER, [k.align]: 'center' };
}

// Zarovnání textu jako ve Wordu; bez nastavení = vlevo (původní vzhled)
const TEXT_ALIGNS = ['left', 'center', 'right', 'justify'];
const TEXT_ALIGN_DEFAULT = 'left';

function textFieldAlign(lay, field) {
    const v = lay[TEXT_FIELDS[field].align];
    return TEXT_ALIGNS.includes(v) ? v : TEXT_ALIGN_DEFAULT;
}

// Vytvoří pole názvu / popisku (element + vnitřek s textem, případně rámečkem)
function buildTextField({ tag, className, field, cardId, text, lay, fontFamily, color, boxed = true }) {
    const k = TEXT_FIELDS[field];
    const num = (key, def) => { const v = parseFloat(lay[key]); return Number.isFinite(v) ? v : def; };
    const d = k.defaults;
    const height = num(k.h, d.h);
    const fontSize = `${num(k.font, d.font) || d.font}rem`;

    const el = document.createElement(tag);
    el.className = className;
    el.style.position = 'absolute';
    el.style.left = `${num(k.x, d.x)}%`;
    el.style.bottom = `${num(k.y, d.y)}%`;
    el.style.transform = 'translateX(-50%)';
    el.style.margin = '0'; // <p>/<h1> bez výchozích okrajů prohlížeče
    el.style.width = `${num(k.w, d.w)}%`;
    if (height > 0) el.style.height = `${height}%`;
    el.style.color = color;
    el.style.fontFamily = fontFamily;
    el.style.fontSize = fontSize;
    el.dataset.baseFontSize = fontSize;
    const align = lay[k.align];
    if (TEXT_ALIGNS.includes(align)) el.style.textAlign = align; // jinak zděděné (vlevo)

    const inner = document.createElement('div');
    inner.className = 'kvarteta-text-inner';
    setTextWithBox(inner, text, lay, field, boxed);
    el.appendChild(inner);

    decorateTextField(el, cardId, field);
    scheduleTextFieldFit(el);
    return el;
}

function hexToRgba(hex, alpha) {
    let h = String(hex || '#000000').replace('#', '');
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join(''); // #fff → #ffffff
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Vloží text do elementu; při enabled ho obalí rámečkem. prefix = 'name' | 'desc'.
// allowBox = false → bez rámečku (zástupný text nevyplněného názvu)
function setTextWithBox(el, text, settings, prefix, allowBox = true) {
    const enabled = allowBox && !!settings[`${prefix}BoxEnabled`];
    if (!enabled || !text) {
        el.innerText = text;
        return;
    }
    const color = settings[`${prefix}BoxColor`] || TEXT_BOX_DEFAULTS.color;
    const opacityPct = parseFloat(settings[`${prefix}BoxOpacity`]);
    const alpha = (Number.isFinite(opacityPct) ? opacityPct : TEXT_BOX_DEFAULTS.opacity) / 100;

    const box = document.createElement('span');
    box.className = 'kvarteta-text-box';
    box.style.background = hexToRgba(color, alpha);
    box.innerText = text;
    el.replaceChildren(box);
}

// --- Přizpůsobení po vykreslení ----------------------------------------------
// Měřit jde až ve stránce → pole se zařadí a přizpůsobí v dalším snímku.

const pendingTextFields = new Set();

function scheduleTextFieldFit(field) {
    pendingTextFields.add(field);
    if (pendingTextFields.size > 1) return; // snímek už je naplánovaný
    requestAnimationFrame(() => {
        const fields = [...pendingTextFields];
        pendingTextFields.clear();
        fields.forEach(fitTextField);
    });
}

// Dokončí naplánovaná přizpůsobení hned — před exportem (html2canvas nesmí vyfotit
// kartu dřív, než se písmo a rámeček přizpůsobí)
function flushTextFieldFits() {
    const fields = [...pendingTextFields];
    pendingTextFields.clear();
    fields.forEach(fitTextField);
}

// Obdélníky řádků textu (jen textové uzly, bez rámečků prvků), v souřadnicích okna
function textLineRects(root) {
    const lines = new Map(); // top řádku → {left, right, top, bottom}
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        range.selectNodeContents(node);
        [...range.getClientRects()].forEach(r => {
            if (r.width === 0) return;
            const key = Math.round(r.top);
            const cur = lines.get(key);
            lines.set(key, cur
                ? { left: Math.min(cur.left, r.left), right: Math.max(cur.right, r.right), top: cur.top, bottom: Math.max(cur.bottom, r.bottom) }
                : { left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        });
    }
    return [...lines.values()];
}

// Přeteče text z pole? (vodorovně vždy, svisle jen při pevné výšce)
function textFieldOverflows(field) {
    const inner = field.querySelector('.kvarteta-text-inner');
    const lines = inner ? textLineRects(inner) : [];
    if (!lines.length) return false;
    const f = field.getBoundingClientRect();
    const tol = 1;
    const horizontal = lines.some(l => l.left < f.left - tol || l.right > f.right + tol);
    if (horizontal) return true;
    if (!field.style.height) return false;
    const top = Math.min(...lines.map(l => l.top));
    const bottom = Math.max(...lines.map(l => l.bottom));
    return (bottom - top) > f.height + tol;
}

// Zmenší písmo pole, dokud se text nevejde (binární hledání v px)
function shrinkTextFieldToFit(field) {
    const base = field.dataset.baseFontSize;
    if (!base) return;
    field.style.fontSize = base;
    if (!textFieldOverflows(field)) return;

    let hi = parseFloat(getComputedStyle(field).fontSize);
    let lo = TEXT_FIELD_MIN_FONT_PX;
    for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        field.style.fontSize = `${mid}px`;
        if (textFieldOverflows(field)) hi = mid; else lo = mid;
    }
    field.style.fontSize = `${lo}px`;
}

function fitTextField(field) {
    if (!field.isConnected) return;
    shrinkTextFieldToFit(field);
    field.querySelectorAll('.kvarteta-text-box').forEach(fitTextBox);
}

// Zalomený inline-block si CSS roztáhne na celou šířku → zúžit na nejdelší řádek
function fitTextBox(box) {
    box.style.width = '';
    const lines = textLineRects(box);
    if (lines.length <= 1) return; // jeden řádek obtéká inline-block sám

    const scale = box.offsetWidth / (box.getBoundingClientRect().width || 1); // px layoutu vs. okna
    const longest = Math.max(...lines.map(l => l.right - l.left)) * scale;
    const cs = getComputedStyle(box);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    let width = Math.ceil(longest + padX) + 1;
    // Pojistka: užší rámeček nesmí přidat řádek (zaokrouhlení subpixelů)
    for (let i = 0; i < 4; i++) {
        box.style.width = `${width}px`;
        if (textLineRects(box).length <= lines.length) return;
        width += 2;
    }
    box.style.width = '';
}

// Po dotažení webových fontů se šířky řádků změní → přizpůsobit všechna pole znovu
if (document.fonts && document.fonts.ready) {
    const refitAll = () => document.querySelectorAll('[data-text-field]').forEach(fitTextField);
    document.fonts.ready.then(refitAll);
    document.fonts.addEventListener?.('loadingdone', refitAll);
}
