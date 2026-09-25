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
}
