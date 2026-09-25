// === RÁMEČEK ZA NÁZVEM / POPISKEM (klasické kvarteto) ======================
// Volitelné poloprůhledné pozadí, které obtéká text. Odsazení a zaoblení jsou
// v em → rezerva kolem textu roste a klesá s velikostí písma.
// Jen background + border-radius (bez clip-path apod.) → stejné i v Export ZIP (html2canvas).

const TEXT_BOX_DEFAULTS = { color: '#000000', opacity: 50 }; // opacity v %

function hexToRgba(hex, alpha) {
    const h = String(hex || '#000000').replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Vloží text do elementu; při enabled ho obalí rámečkem. prefix = 'name' | 'desc'.
function setTextWithBox(el, text, settings, prefix) {
    const enabled = !!settings[`${prefix}BoxEnabled`];
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
    scheduleTextBoxFit(box);
}

// --- Víceřádkový text ---------------------------------------------------------
// Zalomený inline-block si CSS vždy roztáhne na celou dostupnou šířku. Po vložení
// do stránky proto změříme nejdelší skutečný řádek a rámeček zúžíme přesně na něj.

const pendingTextBoxes = new Set();

function scheduleTextBoxFit(box) {
    pendingTextBoxes.add(box);
    if (pendingTextBoxes.size > 1) return; // snímek už je naplánovaný
    requestAnimationFrame(() => {
        const boxes = [...pendingTextBoxes];
        pendingTextBoxes.clear();
        boxes.forEach(fitTextBox);
    });
}

// Šířky řádků textu v px layoutu (bez vlivu CSS transformací náhledu)
function measureTextLines(box) {
    const range = document.createRange();
    range.selectNodeContents(box);
    const lines = new Map(); // top řádku → [left, right]
    [...range.getClientRects()].forEach(r => {
        if (r.width === 0) return;
        const key = Math.round(r.top);
        const [l, rt] = lines.get(key) || [r.left, r.right];
        lines.set(key, [Math.min(l, r.left), Math.max(rt, r.right)]);
    });
    const scale = box.offsetWidth / (box.getBoundingClientRect().width || 1);
    return [...lines.values()].map(([l, r]) => (r - l) * scale);
}

function fitTextBox(box) {
    if (!box.isConnected) return;
    box.style.width = '';
    const lines = measureTextLines(box);
    if (lines.length <= 1) return; // jeden řádek obtéká inline-block sám

    const cs = getComputedStyle(box);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    let width = Math.ceil(Math.max(...lines) + padX) + 1;
    // Pojistka: užší rámeček nesmí přidat řádek (zaokrouhlení subpixelů)
    for (let i = 0; i < 4; i++) {
        box.style.width = `${width}px`;
        if (measureTextLines(box).length <= lines.length) return;
        width += 2;
    }
    box.style.width = '';
}

// Po dotažení webových fontů se šířky řádků změní → přeměřit všechny rámečky
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => document.querySelectorAll('.kvarteta-text-box').forEach(fitTextBox));
    document.fonts.addEventListener?.('loadingdone', () =>
        document.querySelectorAll('.kvarteta-text-box').forEach(fitTextBox));
}
