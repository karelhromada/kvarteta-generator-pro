// ===== GENERATOR.JS (POKROČILÉ ROZVRŽENÍ SYMBOLŮ V2) ===== //

const SYMBOL_LAYOUTS = {
    '7': [
        { x: 20, y: 18 }, { x: 20, y: 48 }, { x: 20, y: 78 },
        { x: 80, y: 18 }, { x: 80, y: 48 }, { x: 80, y: 78 },
        { x: 50, y: 4.5 }
    ],
    '8': [
        { x: 20, y: 14 }, { x: 20, y: 36 }, { x: 20, y: 58 }, { x: 20, y: 80 },
        { x: 80, y: 14 }, { x: 80, y: 36 }, { x: 80, y: 58 }, { x: 80, y: 80 }
    ],
    '9': [
        { x: 20, y: 12 }, { x: 20, y: 36 }, { x: 20, y: 60 }, { x: 20, y: 84 },
        { x: 80, y: 12 }, { x: 80, y: 36 }, { x: 80, y: 60 }, { x: 80, y: 84 },
        { x: 50, y: 4.5 }
    ],
    '10': [
        { x: 20, y: 8 }, { x: 20, y: 27 }, { x: 20, y: 46 }, { x: 20, y: 65 }, { x: 20, y: 84 },
        { x: 80, y: 8 }, { x: 80, y: 27 }, { x: 80, y: 46 }, { x: 80, y: 65 }, { x: 80, y: 84 }
    ],
    'Eso': [ { x: 20, y: 4.5 }, { x: 80, y: 4.5 } ],
    'Král': [ { x: 20, y: 4.5 }, { x: 80, y: 4.5 } ],
    'Svršek': [ { x: 20, y: 4.5 } ],
    'Spodek': [ { x: 20, y: 82.5 } ],
    // Aliasy
    'A': [ { x: 20, y: 4.5 }, { x: 80, y: 4.5 } ],
    'K': [ { x: 20, y: 4.5 }, { x: 80, y: 4.5 } ],
    'Q': [ { x: 20, y: 4.5 } ],
    'J': [ { x: 20, y: 82.5 } ]
};

// --- POMOCNÉ FUNKCE PRO UI & VÝKON ---
function normalizedSuit(name) {
    if (!name) return name;
    return name.normalize('NFC');
}

const FIGURE_VALUES = ['Eso', 'Král', 'Svršek', 'Spodek'];
function isFigureCard(card) {
    if (!card || AppState.gameMode !== 'playing_cards') return false;
    const val = card.id.split('_')[1];
    return FIGURE_VALUES.includes(normalizedSuit(val));
}

// Tolerantní lookup barvy textu po suit jménu (řeší macOS NFD/NFC).
function getSuitTextColor(name) {
    if (!name || !AppState.textSuitColors) return null;
    const normName = normalizedSuit(name);
    if (AppState.textSuitColors[normName] != null) return AppState.textSuitColors[normName];
    for (const key in AppState.textSuitColors) {
        if (normalizedSuit(key) === normName && AppState.textSuitColors[key] != null) {
            return AppState.textSuitColors[key];
        }
    }
    return null;
}

// Vrací efektivní text config karty (sloučení globál → suit barva → per-karta override)
// nebo null pokud se text nemá vykreslit.
function resolveCardText(card) {
    if (!card) return null;
    const parts = card.id.split('_');
    const suit = parts[0];
    const val  = parts[1];

    const globalForValue = (AppState.gameMode === 'playing_cards' && AppState.textValueSettings)
        ? AppState.textValueSettings[normalizedSuit(val)] : null;

    const override = card.textOverlay; // sparse: jen ručně změněné klíče; null = bez override
    const overrideActive = override != null; // toggle „Lokální přepis" je zapnutý
    const globalEnabled = globalForValue && globalForValue.enabled;

    if (!globalEnabled && !overrideActive) return null;

    // Sestavíme efektivní config. Pokud globál existuje, použij ho jako základ;
    // jinak fallback default (umožní text i mimo playing_cards skrz override).
    const base = globalForValue || {
        text: '', font: "'Tangerine', cursive", size: 25, color: '#ffffff',
        bold: true, italic: false, x: 0, y: -158, align: 'center'
    };
    let cfg = { ...base };

    // Per-suit barva (jen pokud platí globál pro tuto hodnotu)
    if (globalEnabled) {
        const suitColor = getSuitTextColor(suit);
        if (suitColor) cfg.color = suitColor;
    }

    // Per-karta override (má nejvyšší prioritu)
    if (override) {
        cfg = { ...cfg, ...override };
    }

    if (!cfg.text) return null;
    return cfg;
}

// Bezpečné získání nastavení barvy (suit) - nezávislé na kódování klíčů
function getSuitConfig(name) {
    if (!name) return null;
    const normName = normalizedSuit(name);
    // 1. Přímý pokus
    if (AppState.suitSettings[normName]) return AppState.suitSettings[normName];
    // 2. Prohledání všech klíčů (případ, kdy jsou v jiném kódování)
    for (const key in AppState.suitSettings) {
        if (normalizedSuit(key) === normName) return AppState.suitSettings[key];
    }
    return null;
}

let renderRequested = false;
function requestRender() {
    if (renderRequested) return;
    renderRequested = true;
    requestAnimationFrame(() => {
        renderGrid();
        renderRequested = false;
    });
}

let saveTimeout = null;
function debouncedSaveState() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveState();
        saveTimeout = null;
    }, 500); // Uložíme až po 0.5s nečinnosti
}

function adjustSlider(id, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Zjistíme aktuální hodnotu a krok
    let val = parseFloat(el.value) || 0;
    let step = parseFloat(el.step) || 1;
    
    // Pokud je delta jen 1/-1, vynásobíme ji krokem pro přirozený posun
    const finalDelta = (Math.abs(delta) === 1) ? delta * step : delta;
    
    let newVal = val + finalDelta;
    
    // Ošetření min/max
    const min = parseFloat(el.min);
    const max = parseFloat(el.max);
    if (!isNaN(min) && newVal < min) newVal = min;
    if (!isNaN(max) && newVal > max) newVal = max;
    
    el.value = newVal;
    
    // Vyvoláme eventy, aby se spustila logika v generator.js
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
}

function updateValueBadge(id, value) {
    const badge = document.getElementById('val-' + id);
    if (badge) {
        // Formátování: Pokud je to měřítko/průhlednost v %, přidáme %, jinak mm nebo jen číslo
        let suffix = '';
        if (id.includes('scale') || id.includes('opacity') || id.includes('spacing') || id.includes('stretch') || id.includes('offset-x') || id.includes('offset-y')) suffix = '%';
        else if (id.includes('offsetX') || id.includes('offsetY') || id.includes('columnX') || id.includes('inset')) suffix = 'mm';
        else if (id.includes('borderWidth') || id.includes('border-width')) suffix = 'px';
        else if (id === 'ind-text-size') suffix = 'px';
        else if (/-x$|-y$/.test(id)) suffix = 'px'; // ind-text-x, ind-text-y, ind-cardlogo-x, ind-cardlogo-y
        else if (id.includes('size')) suffix = ''; // Generic size usually factor or px

        badge.innerText = value + suffix;
    }
}

function createCardElement(card) {
    const scaleUi = 3.8; 
    const cardEl = document.createElement('div');
    cardEl.className = 'preview-card';
    if (AppState.activeCardId === card.id) cardEl.classList.add('active');
    if (card.isLocked) cardEl.classList.add('is-locked');
    cardEl.id = 'card-el-' + card.id;
    cardEl.style.width = Math.round(AppState.cardWidth * scaleUi) + 'px';
    cardEl.style.height = Math.round(AppState.cardHeight * scaleUi) + 'px';
    cardEl.style.borderRadius = Math.round(AppState.cardRadius * scaleUi) + 'px';

    // VRSTVA 0: ILUSTRACE
    const bgLayer = document.createElement('div');
    bgLayer.className = 'card-bg';
    if (card.image) {
        const img = document.createElement('img');
        img.src = card.image;
        const c = card.crop;
        img.style.transform = `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px)) scale(${c.scale * c.stretchX}, ${c.scale * c.stretchY})`;
        bgLayer.appendChild(img);
    }
    cardEl.appendChild(bgLayer);

    // VRSTVA 1: GLOBÁLNÍ LOGO
    if (AppState.globalLogo.image) {
        const logo = document.createElement('div');
        logo.className = 'card-logo';
        logo.style.opacity = AppState.globalLogo.opacity;
        const l = AppState.globalLogo;
        logo.style.transform = `translate(calc(-50% + ${l.x}px), calc(-50% + ${l.y}px)) scale(${l.scale * l.stretchX}, ${l.scale * l.stretchY})`;
        const logoImg = document.createElement('img');
        logoImg.src = AppState.globalLogo.image;
        logoImg.alt = '';
        logo.appendChild(logoImg);
        cardEl.appendChild(logo);
    }

    // VRSTVA 1.5: PER-CARD LOGO (nezávislá vrstva navíc nad globálním logem)
    if (card.cardLogo && card.cardLogo.image) {
        const cl = card.cardLogo;
        const cardLogoEl = document.createElement('div');
        cardLogoEl.className = 'card-logo-individual';
        cardLogoEl.dataset.layer = 'cardLogo';
        cardLogoEl.style.opacity = (cl.opacity !== undefined) ? cl.opacity : 1;
        const sX = (cl.stretchX !== undefined) ? cl.stretchX : 1;
        const sY = (cl.stretchY !== undefined) ? cl.stretchY : 1;
        cardLogoEl.style.transform = `translate(calc(-50% + ${cl.x}px), calc(-50% + ${cl.y}px)) scale(${cl.scale * sX}, ${cl.scale * sY})`;
        const cardLogoImg = document.createElement('img');
        cardLogoImg.src = cl.image;
        cardLogoImg.alt = '';
        cardLogoEl.appendChild(cardLogoImg);
        cardEl.appendChild(cardLogoEl);
    }

    // VRSTVA 2: GLOBÁLNÍ RÁM
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    cardEl.appendChild(overlay); 
    
    const suit = normalizedSuit(card.id.split('_')[0]);
    const sS = getSuitConfig(suit);
    const gO = AppState.globalOverlay;
    
    // Použijeme nastavení barvy (suit) pokud existuje a má nastavenou šířku ohraničení > 0, jinak globální
    const activeBorderWidth = (sS && sS.borderWidth > 0) ? sS.borderWidth : gO.borderWidth;
    const activeBorderColor = (sS && sS.borderWidth > 0) ? sS.borderColor : gO.borderColor;
    const activeInset = (sS && sS.borderWidth > 0) ? sS.inset : gO.inset;
    const activeBorderRadius = (sS && sS.borderWidth > 0) ? sS.borderRadius : gO.borderRadius;
    
    overlay.style.opacity = gO.opacity;
    overlay.style.border = (activeBorderWidth > 0) ? `${activeBorderWidth * scaleUi}px solid ${activeBorderColor}` : 'none';
    overlay.style.boxSizing = 'border-box';

    const insetPx = activeInset * (scaleUi * 3.78);
    const brPx = activeBorderRadius * (scaleUi * 3.78);
    
    overlay.style.top = insetPx + 'px';
    overlay.style.left = insetPx + 'px';
    overlay.style.width = `calc(100% - ${2 * insetPx}px)`;
    overlay.style.height = `calc(100% - ${2 * insetPx}px)`;
    overlay.style.borderRadius = brPx + 'px';

    if (gO.image) {
        overlay.style.backgroundImage = `url(${gO.image})`;
        overlay.style.transform = `translate(${gO.x * scaleUi}px, ${gO.y * scaleUi}px) scale(${gO.scale * gO.stretchX}, ${gO.scale * gO.stretchY})`;
        overlay.style.transformOrigin = 'center';
    } else {
        overlay.style.backgroundImage = 'none';
    }
    
    // VRSTVA 3: DYNAMICKÉ SYMBOLY
    if (AppState.gameMode === 'quartet') {
        drawQuartetOverlay(cardEl, card);
    } else if (AppState.showSymbols) {
        drawSymbols(cardEl, card);
    }

    // VRSTVA 4.5: TEXT (globál po hodnotě + per-suit barva + per-karta override).
    // Dostupné na všech kartách, ne jen figurách.
    const t = resolveCardText(card);
    if (t) {
        const txt = document.createElement('div');
        txt.className = 'card-text-overlay';
        txt.dataset.layer = 'textOverlay';
        txt.innerText = t.text;
        txt.style.fontFamily = t.font || "'Cinzel', serif";
        // Velikost je v "px" v souřadnicích karty (ne mm) — škálujeme přes scaleUi
        txt.style.fontSize = ((t.size || 16) * scaleUi / 3.78) + 'px';
        txt.style.color = t.color || '#ffffff';
        txt.style.fontWeight = t.bold ? '700' : '400';
        txt.style.fontStyle = t.italic ? 'italic' : 'normal';
        txt.style.textAlign = t.align || 'center';
        // X/Y jsou v px náhledu (stejně jako logo/obrázek), aby drag fungoval konzistentně
        txt.style.left = `calc(50% + ${(t.x || 0)}px)`;
        txt.style.top = `calc(50% + ${(t.y || 0)}px)`;
        txt.style.transform = 'translate(-50%, -50%)';
        cardEl.appendChild(txt);
    }

    const label = document.createElement('div');
    label.className = 'card-label'; label.innerText = card.label;
    cardEl.appendChild(label);

    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone-overlay';
    cardEl.appendChild(dropZone);

    cardEl.addEventListener('mousedown', (e) => setActiveCard(card.id, e));
    cardEl.addEventListener('dragover', (e) => { e.preventDefault(); cardEl.classList.add('drag-over'); });
    cardEl.addEventListener('dragleave', () => cardEl.classList.remove('drag-over'));
    cardEl.addEventListener('drop', (e) => handleImageDrop(card.id, e));

    return cardEl;
}

function renderCard(cardId) {
    const card = AppState.cards.find(c => c.id === cardId);
    if (!card) return;
    const oldCardEl = document.getElementById('card-el-' + cardId);
    if (oldCardEl) {
        const newCardEl = createCardElement(card);
        oldCardEl.replaceWith(newCardEl);
    }
}

let cardRenderRequests = new Set();
function requestCardRender(cardId) {
    cardRenderRequests.add(cardId);
    requestAnimationFrame(() => {
        if (cardRenderRequests.size === 0) return;
        cardRenderRequests.forEach(id => renderCard(id));
        cardRenderRequests.clear();
    });
}

function renderGrid() {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;
    
    const fragment = document.createDocumentFragment();
    AppState.cards.forEach(card => {
        fragment.appendChild(createCardElement(card));
    });
    
    grid.innerHTML = '';
    grid.appendChild(fragment);
}

function drawSymbols(cardEl, card) {
    const symbolsCont = document.createElement('div');
    symbolsCont.className = 'card-symbols';
    
    const parts = card.id.split('_');
    const suit = normalizedSuit(parts[0]);
    const val = parts[1];
    
    // Konfigurace Barvy (Suit) - Vždy získáme aktuální objekt ze stavu
    const suitCfg = getSuitConfig(suit) || { opacity: 1, scale: 0.18, color: '#ff0000', offsetY:0, spacingY:1, columnX:0 };
    
    // Konfigurace Hodnoty (Value) - Globální nebo Individuální
    let valCfg = AppState.valueSettings[val] || { offsetY:0, spacingY:1, columnX:0 };
    if (card.symbolOverride) valCfg = card.symbolOverride;

    const layout = SYMBOL_LAYOUTS[val] || [];
    if (layout.length === 0) console.warn("No layout for val:", val, "cardId:", card.id);

    layout.forEach(pos => {
        const symbol = document.createElement('div');
        symbol.className = 'symbol-instance';
        symbol.style.position = 'absolute';
        
        // KOMBINACE TRANSFORMACÍ (Global + Value + Suit) nebo Individuální Override
        let fScale, fOpacity, fOffsetX, fOffsetY, fSpacingY, fColumnX;
        const gS = AppState.globalSymbolSettings;

        if (card.symbolOverride) {
            // TOTÁLNÍ IZOLACE: Pokud existuje override (zámek/vlastní), ignorujeme suit-level posuny
            fScale    = card.symbolOverride.scale;
            fOpacity  = card.symbolOverride.opacity;
            fOffsetX  = card.symbolOverride.offsetX || 0;
            fOffsetY  = card.symbolOverride.offsetY;
            fSpacingY = card.symbolOverride.spacingY;
            fColumnX  = card.symbolOverride.columnX;
        } else {
            // STANDARDNÍ KOMBINACE: Globální * (Hodnota + Barva)
            // Scale a Opacity jsou multiplikativní: Suit * Global (Value scale je prioritní pokud existuje)
            const baseScale = (valCfg.scale !== null && valCfg.scale !== undefined) ? valCfg.scale : (suitCfg.scale || 0.18);
            fScale = baseScale * (gS.scale || 1);
            
            const baseOpacity = (valCfg.opacity !== null && valCfg.opacity !== undefined) ? valCfg.opacity : (suitCfg.opacity !== undefined ? suitCfg.opacity : 1);
            fOpacity = baseOpacity * (gS.opacity !== undefined ? gS.opacity : 1);

            // Offsety jsou aditivní
            fOffsetX  = (valCfg.offsetX || 0) + (suitCfg.offsetX || 0) + gS.offsetX;
            fOffsetY  = (valCfg.offsetY || 0) + (suitCfg.offsetY || 0) + gS.offsetY;
            
            // Spacing je multiplikativní
            fSpacingY = (valCfg.spacingY !== undefined ? valCfg.spacingY : 1) * (suitCfg.spacingY !== undefined ? suitCfg.spacingY : 1) * gS.spacingY;
            
            // Kolony jsou aditivní
            fColumnX  = (valCfg.columnX || 0) + (suitCfg.columnX || 0) + gS.columnX;
        }

        // --- VÝPOČET FINÁLNÍ POZICE ---
        // Y: Relativně k polovině karty (50%)
        let finalY = 50 + (pos.y - 50) * fSpacingY + (fOffsetY / AppState.cardHeight * 100);
        
        // X: Relativně k šířce karty
        let finalX = pos.x + (fOffsetX / AppState.cardWidth * 100);
        
        // X: Výpočet symetrie kolem 50% (pro vícesloupcové rozvržení)
        if (pos.x < 45) finalX -= (fColumnX / AppState.cardWidth * 100);
        else if (pos.x > 55) finalX += (fColumnX / AppState.cardWidth * 100);

        symbol.style.left = finalX + '%';
        symbol.style.top = finalY + '%';
        symbol.style.transform = 'translate(-50%, -50%)'; // Klíč k dokonalému centrování
        
        symbol.style.opacity = fOpacity;
        
        if (suitCfg.image) {
            const img = document.createElement('img');
            img.src = suitCfg.image;
            img.style.width = (fScale * 600) + 'px'; 
            symbol.appendChild(img);
        } else {
            const iconMap = { 
                'Červené': '♥', 
                'Zelené':  '🍃', 
                'Kule':    '●', 
                'Žaludy':  '🌰',
                'Srdce':   '♥', 
                'Piky':    '♠' 
            };
            // Pro jistotu normalizujeme i klíče v mapě (při runtime to sjednotí na NFC)
            const nIconMap = {};
            for(let key in iconMap) nIconMap[normalizedSuit(key)] = iconMap[key];

            symbol.innerText = nIconMap[suit] || nIconMap[suit.toLowerCase()] || '';
            symbol.style.color = suitCfg.color || '#ff0000';
            symbol.style.fontSize = (fScale * 300) + 'px';
        }
        symbolsCont.appendChild(symbol);
    });

    cardEl.appendChild(symbolsCont);
}

function drawQuartetOverlay(cardEl, card) {
    const data = card.quartetData || { name: "", description: "", stats: ["", "", "", ""] };
    const parts = card.id.split('_'); // e.g. 'q_1A'
    const subStr = parts.length > 1 ? parts[1] : '1A';
    const group = subStr[0] || '1';
    
    // Group settings
    const groupSettings = AppState.quartetSettings.sets[group] || { color: '#ff4444' };
    const cssColor = groupSettings.color;

    const borderSettings = AppState.quartetSettings.border || { width: 0, inset: 0, radius: 4 };

    // Optional Border
    if (borderSettings.width && borderSettings.width > 0) {
        const borderEl = document.createElement('div');
        borderEl.className = 'kvarteta-border';
        borderEl.style.position = 'absolute';
        borderEl.style.pointerEvents = 'none';
        borderEl.style.boxSizing = 'border-box';
        const inset = borderSettings.inset || 0;
        borderEl.style.left = `${inset}mm`;
        borderEl.style.right = `${inset}mm`;
        borderEl.style.top = `${inset}mm`;
        borderEl.style.bottom = `${inset}mm`;
        borderEl.style.border = `${borderSettings.width}mm solid ${cssColor}`;
        borderEl.style.borderRadius = `${borderSettings.radius !== undefined ? borderSettings.radius : 4}mm`;
        borderEl.style.zIndex = 10;
        cardEl.appendChild(borderEl);
    }

    // Overlay Bottom
    const overlayBottom = document.createElement('div');
    overlayBottom.className = 'kvarteta-overlay-bottom';
    cardEl.appendChild(overlayBottom);

    // ID Badge
    const idBadge = document.createElement('div');
    idBadge.className = 'kvarteta-id-badge';
    idBadge.style.color = cssColor;
    const useSetColorId = AppState.quartetSettings.useSetColorId || false;
    const useSetColorName = AppState.quartetSettings.useSetColorName !== false;
    const useSetColorDesc = AppState.quartetSettings.useSetColorDesc || false;
    const useSetColorStatName = AppState.quartetSettings.useSetColorStatName || false;
    const useSetColorStatValue = AppState.quartetSettings.useSetColorStatValue || false;
    const useSetColorStatBorder = AppState.quartetSettings.useSetColorStatBorder || false;
    const idOffsetX = AppState.quartetSettings.idOffsetX ?? 50;
    const idOffsetY = AppState.quartetSettings.idOffsetY ?? 2;
    const nameOffsetX = AppState.quartetSettings.nameOffsetX ?? 50;
    const nameOffsetY = AppState.quartetSettings.nameOffsetY ?? 12;
    const descOffsetX = AppState.quartetSettings.descOffsetX ?? 50;
    const descOffsetY = AppState.quartetSettings.descOffsetY ?? 5;

    idBadge.style.borderColor = cssColor;
    idBadge.style.color = useSetColorId ? cssColor : '#fff';
    idBadge.style.left = `${idOffsetX}%`;
    idBadge.style.top = `${idOffsetY}%`;
    idBadge.innerText = subStr;
    cardEl.appendChild(idBadge);

    // Layout configuration
    const lOut = AppState.quartetSettings.layout || { offsetX: 2, offsetY: 2 };
    const offX = lOut.offsetX;
    const offY = lOut.offsetY;
    
    // Typografie a herní prvky
    const hideStats = AppState.quartetSettings.hideStats || false;
    const fontFamily = AppState.quartetSettings.fontFamily || "'Cinzel', serif";
    const statShape = AppState.quartetSettings.statShape || 'hexagon';
    const statLayout = AppState.quartetSettings.statLayout || 'corners';
    
    // Nové detaily
    const statSize = AppState.quartetSettings.statSize || 1.0;
    const fontSizeValue = AppState.quartetSettings.fontSizeValue || 1.2;
    const fontSizeLabel = AppState.quartetSettings.fontSizeLabel || 0.4;
    const statValueOffset = AppState.quartetSettings.statValueOffset || 0;
    const statLabelOffset = AppState.quartetSettings.statLabelOffset || 0;
    const statBgColor = AppState.quartetSettings.statBgColor || '#000000';
    const statOpacity = AppState.quartetSettings.statOpacity || 0.4;
    const statSpacing = AppState.quartetSettings.statSpacing || 5;
    
    idBadge.style.fontFamily = fontFamily;

    // 4 Stats in Hexagons
    if (!hideStats) {
        const positions = ['pos-tl', 'pos-tr', 'pos-bl', 'pos-br'];
        const attrNames = AppState.quartetSettings.attributeNames || ["Výška", "Váha", "Věk", "Síla"];
        
        const statsWrapper = document.createElement('div');
        statsWrapper.className = `layout-wrapper-${statLayout}`;
        
        if (statLayout === 'bottom-row' || statLayout === 'left-column' || statLayout === 'right-column') {
            statsWrapper.style.gap = `${statSpacing}px`;
        }
        statsWrapper.style.textRendering = 'optimizeLegibility';

        for(let i=0; i<4; i++) {
            const hexContainer = document.createElement('div');
            let posClass = '';
            if (statLayout === 'corners') posClass = positions[i];
            
            hexContainer.className = `hex-container shape-${statShape} ${posClass}`;
            
            // Apply scale via dimensions to avoid transform blur
            // Sjednocené rozměry napříč všemi rozvrženími pro zachování tvaru a poměru stran
            const baseW = 22; 
            const baseH = 16.5; 

            hexContainer.style.width = `${baseW * statSize}%`;
            hexContainer.style.height = `${baseH * statSize}%`;
            
            // Apply shape and border coloring
            if (statShape !== 'golden-hexagon') {
                const hex = statBgColor.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                hexContainer.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${statOpacity})`;
                if (useSetColorStatBorder) {
                    hexContainer.style.borderColor = cssColor;
                }
            }
            
            // Apply inline layout offsets ONLY for corners
            if (statLayout === 'corners') {
                if (i === 0) { hexContainer.style.left = `${offX}%`; hexContainer.style.top = `${offY}%`; }
                if (i === 1) { hexContainer.style.right = `${offX}%`; hexContainer.style.top = `${offY}%`; }
                if (i === 2) { hexContainer.style.left = `${offX}%`; hexContainer.style.bottom = `${offY + 5}%`; }
                if (i === 3) { hexContainer.style.right = `${offX}%`; hexContainer.style.bottom = `${offY + 5}%`; }
            }
            
            const statHex = document.createElement('div');
            statHex.className = 'stat-hex';

            const statValue = document.createElement('div');
            statValue.className = 'stat-value';
            statValue.innerText = data.stats[i] || '-';
            statValue.style.fontFamily = fontFamily;
            statValue.style.fontSize = `${fontSizeValue}rem`;
            // Using margin instead of translate avoids sub-pixel fuzziness
            statValue.style.marginTop = `${statValueOffset}px`;
            statValue.style.color = useSetColorStatValue ? cssColor : '#fff';

            const statLabel = document.createElement('div');
            statLabel.className = 'stat-label';
            statLabel.innerText = attrNames[i] || `Atribut ${i+1}`;
            statLabel.style.fontFamily = fontFamily;
            statLabel.style.fontSize = `${fontSizeLabel}rem`;
            statLabel.style.marginTop = `${statLabelOffset}px`;
            statLabel.style.color = useSetColorStatName ? cssColor : '#fff';

            statHex.appendChild(statValue);
            statHex.appendChild(statLabel);
            hexContainer.appendChild(statHex);
            
            // Golden hex needs custom color injection
            if (statShape === 'golden-hexagon') {
                statLabel.style.color = '#fff';
            }
            
            statsWrapper.appendChild(hexContainer);
        }
        cardEl.appendChild(statsWrapper);
    }

    // Name and Description
    const cardName = document.createElement('h1');
    cardName.className = 'kvarteta-card-name';
    cardName.style.position = 'absolute';
    cardName.style.left = `${nameOffsetX}%`;
    cardName.style.bottom = `${nameOffsetY}%`;
    cardName.style.transform = 'translateX(-50%)';
    cardName.style.width = '90%';
    cardName.style.color = useSetColorName ? cssColor : '#fff';
    cardName.innerText = data.name || `Karta ${subStr}`;
    cardName.style.fontFamily = fontFamily;
    cardEl.appendChild(cardName);
    
    const cardDesc = document.createElement('p');
    cardDesc.className = 'kvarteta-card-desc';
    cardDesc.style.position = 'absolute';
    cardDesc.style.left = `${descOffsetX}%`;
    cardDesc.style.bottom = `${descOffsetY}%`;
    cardDesc.style.transform = 'translateX(-50%)';
    cardDesc.style.width = '80%';
    cardDesc.style.margin = '0';
    cardDesc.innerText = data.description || '';
    cardDesc.style.fontFamily = fontFamily;
    cardDesc.style.color = useSetColorDesc ? cssColor : '#ddd';
    cardEl.appendChild(cardDesc);
}

// --- LAYOUT HANDLERS ---

function handleLayoutValueChange() {
    renderUIFromState(); // Načte hodnoty ze stavu do sliderů pro nově vybranou hodnotu
}

function updateLayoutParam(param, value) {
    const valSelect = document.getElementById('layout-value-select');
    if(!valSelect) return;
    const val = valSelect.value;
    const cfg = AppState.valueSettings[val];
    if (!cfg) return;
    
    const v = parseFloat(value);
    if (param === 'offsetX') cfg.offsetX = v;
    else if (param === 'offsetY') cfg.offsetY = v;
    else if (param === 'spacingY') cfg.spacingY = v / 100;
    else if (param === 'columnX') cfg.columnX = v;
    
    debouncedSaveState();
    requestRender();
}

function toggleIndividualOverride(enabled) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card) return;

    if (enabled) {
        const parts = card.id.split('_');
        const suit = normalizedSuit(parts[0]);
        const val = parts[1] || '7';
        
        const globalVal = AppState.valueSettings[val] || {offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0};
        const suitCfg = getSuitConfig(suit) || {scale: 0.18, opacity: 1, offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#ff0000', borderWidth: 0, inset: 0, borderRadius: 4};
        const gS = AppState.globalSymbolSettings;

        // SNAPSHOT MUSÍ OBSAHOVAT I GLOBÁLNÍ VLIVY, ABY SE ROZVRŽENÍ NEZMĚNILO
        const baseScale = (globalVal.scale !== null && globalVal.scale !== undefined) ? globalVal.scale : (suitCfg.scale || 0.18);
        const baseOpacity = (globalVal.opacity !== null && globalVal.opacity !== undefined) ? globalVal.opacity : (suitCfg.opacity !== undefined ? suitCfg.opacity : 1);

        card.symbolOverride = {
            scale:    baseScale * (gS.scale || 1),
            opacity:  baseOpacity * (gS.opacity !== undefined ? gS.opacity : 1),
            offsetX:  (globalVal.offsetX || 0) + (suitCfg.offsetX || 0) + gS.offsetX,
            offsetY:  (globalVal.offsetY || 0) + (suitCfg.offsetY || 0) + gS.offsetY,
            spacingY: (globalVal.spacingY !== undefined ? globalVal.spacingY : 1) * (suitCfg.spacingY !== undefined ? suitCfg.spacingY : 1) * gS.spacingY,
            columnX:  (globalVal.columnX || 0) + (suitCfg.columnX || 0) + gS.columnX
        }; 
    } else {
        card.symbolOverride = null;
    }
    saveState();
    renderUIFromState();
    requestRender();
}

function updateIndividualParam(param, value) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card || !card.symbolOverride) return;

    const val = parseFloat(value);
    if (param === 'scale') card.symbolOverride.scale = val / 100;
    else if (param === 'opacity') card.symbolOverride.opacity = val / 100;
    else if (param === 'spacingY') card.symbolOverride.spacingY = val / 100;
    else if (['offsetX', 'offsetY', 'columnX'].includes(param)) card.symbolOverride[param] = val;
    
    debouncedSaveState();
    requestCardRender(card.id);
}

function resetIndividualLayout() {
    toggleIndividualOverride(false);
}

// --- SUIT HANDLERS ---

function handleSuitUpload(suit, event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { AppState.suitSettings[suit].image = e.target.result; saveState(); renderGrid(); };
        reader.readAsDataURL(file);
    }
}

function updateSuitParam(suitRaw, param, value) {
    const suit = normalizedSuit(suitRaw);
    let sS = getSuitConfig(suit);
    
    if (!sS) {
        console.warn("Suit settings not found for:", suit, "Creating new entry.");
        AppState.suitSettings[suit] = { image: null, opacity: 1, scale: 0.18, color: '#ff0000', offsetX: 0, offsetY: 0, spacingY: 1, columnX: 0, borderColor: '#ff0000', borderWidth: 0, inset: 0, borderRadius: 4 };
        sS = AppState.suitSettings[suit];
    }

    if (param === 'scale') {
        sS.scale = parseFloat(value) / 100;
    } else if (param === 'opacity') {
        sS.opacity = parseFloat(value) / 100;
    } else if (param === 'spacingY') {
        sS.spacingY = parseFloat(value) / 100;
    } else if (['borderColor'].includes(param)) {
        sS[param] = value;
    } else if (['offsetX', 'offsetY', 'columnX', 'borderWidth', 'inset', 'borderRadius'].includes(param)) {
        sS[param] = parseFloat(value);
    }
    debouncedSaveState();
    requestRender();
}

function updateGlobalSymbolParam(param, value) {
    const gs = AppState.globalSymbolSettings;
    if (param === 'scale' || param === 'opacity' || param === 'spacingY') {
        gs[param] = parseFloat(value) / 100;
    } else {
        gs[param] = parseFloat(value);
    }
    debouncedSaveState();
    requestRender();
}

// --- STANDARD HANDLERS ---

function handleOverlayUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { AppState.globalOverlay.image = e.target.result; renderGrid(); };
        reader.readAsDataURL(file);
    }
}

function updateOverlay() {
    AppState.globalOverlay.opacity = (parseFloat(document.getElementById('overlay-opacity').value) || 0) / 100;
    AppState.globalOverlay.x = parseFloat(document.getElementById('overlay-x').value) || 0;
    AppState.globalOverlay.y = parseFloat(document.getElementById('overlay-y').value) || 0;
    AppState.globalOverlay.scale = (parseFloat(document.getElementById('overlay-scale').value) || 100) / 100;
    debouncedSaveState(); requestRender();
}

function updateGlobalOverlayParam(param, value) {
    if (param === 'opacity') {
        AppState.globalOverlay.opacity = parseFloat(value) / 100;
    } else if (param === 'scale') {
        AppState.globalOverlay.scale = parseFloat(value) / 100;
    } else if (param === 'borderWidth' || param === 'inset' || param === 'borderRadius') {
        AppState.globalOverlay[param] = parseFloat(value);
    } else if (param === 'borderColor') {
        AppState.globalOverlay[param] = value;
    } else { // For x, y, stretchX, stretchY
        AppState.globalOverlay[param] = parseFloat(value);
    }
    debouncedSaveState(); 
    requestRender();
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => { AppState.globalLogo.image = e.target.result; requestRender(); };
        reader.readAsDataURL(file);
    }
}

function updateLogo() {
    const l = AppState.globalLogo;
    l.opacity = document.getElementById('logo-opacity').value / 100;
    l.x = parseFloat(document.getElementById('logo-x').value) || 0;
    l.y = parseFloat(document.getElementById('logo-y').value) || 0;
    l.scale = (parseFloat(document.getElementById('logo-zoom').value) || 30) / 100;
    requestRender();
}

function toggleSymbols(show) { AppState.showSymbols = show; requestRender(); }

function fillActiveCard() {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card || !card.image) return;
    const img = new Image();
    img.src = card.image;
    img.onload = () => {
        const targetW = AppState.cardWidth; const targetH = AppState.cardHeight;
        const ratioImg = img.naturalWidth / img.naturalHeight;
        const ratioTarget = targetW / targetH;
        let finalScale = (ratioImg > ratioTarget) ? (targetH * 3.8 / img.naturalHeight) : (targetW * 3.8 / img.naturalWidth);
        card.crop.scale = finalScale; card.crop.x = 0; card.crop.y = 0;
        debouncedSaveState(); renderUIFromState();
    };
}

function updateGlobalDimensions() {
    AppState.cardWidth = parseFloat(document.getElementById('card-width').value) || 63;
    AppState.cardHeight = parseFloat(document.getElementById('card-height').value) || 88;
    AppState.cardRadius = parseFloat(document.getElementById('card-radius').value) || 4;
    debouncedSaveState(); requestRender();
}

function toggleCardLock(locked) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (card) {
        card.isLocked = locked;
        // Pokud zamykáme a karta nemá vlastní override, vytvoříme snapshot globálního nastavení,
        // aby byla chráněna před budoucími hromadnými změnami.
        if (locked && !card.symbolOverride) {
            const parts = card.id.split('_');
            const suit = parts[0];
            const val = parts[1] || '7';
            const vS = AppState.valueSettings[val] || {offsetY:0, spacingY:1, columnX:0};
            const sS = AppState.suitSettings[suit] || {scale: 0.18, opacity: 1, offsetY:0, spacingY:1, columnX:0};
            
            // Snapshot musí být kombinací obou (Value + Suit) pro zachování aktuálního vzhledu
            card.symbolOverride = {
                 offsetY: vS.offsetY + sS.offsetY,
                 spacingY: vS.spacingY * sS.spacingY,
                 columnX: vS.columnX + sS.columnX,
                 scale: (vS.scale !== null && vS.scale !== undefined) ? vS.scale : sS.scale,
                 opacity: (vS.opacity !== null && vS.opacity !== undefined) ? vS.opacity : sS.opacity
            };
        }
        debouncedSaveState();
        renderUIFromState();
    }
}

async function downloadAllAsZip() {
    const cards = AppState.cards;
    const zip = new JSZip();
    const overlay = document.getElementById('progress-overlay');
    const barFill = document.getElementById('progress-bar-fill');
    const status = document.getElementById('progress-status');
    const total = cards.length;

    if (!overlay || !barFill || !status) return;

    overlay.style.display = 'flex';
    
    try {
        for (let i = 0; i < total; i++) {
            const card = cards[i];
            
            // Aktualizace statusu
            status.innerText = `Zpracovávám kartu ${i + 1} / ${total} (${card.label})`;
            barFill.style.width = `${((i + 1) / total) * 100}%`;

            const cardId = 'card-el-' + card.id;
            let cardEl = document.getElementById(cardId);
            
            if (!cardEl) {
                console.warn("Card element not found in grid:", card.id);
                continue;
            }

            try {
                // Renderování pomocí html2canvas (scale 3 je bezpečnější pro paměť)
                const canvas = await html2canvas(cardEl, {
                    scale: 3, 
                    backgroundColor: null,
                    useCORS: true,
                    logging: false,
                    allowTaint: true
                });

                // Convert to blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                
                if (blob) {
                    // Povolíme diakritiku v názvu souboru karty
                    const fileName = `${card.id}.png`;
                    zip.file(fileName, blob);
                }
            } catch (cardErr) {
                console.error(`Chyba při renderu karty ${card.id}:`, cardErr);
            }

            // Malá pauza pro prohlížeč, aby nezamrzlo UI
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Generování ZIPu
        if (Object.keys(zip.files).length === 0) {
            throw new Error("Žádné karty nebyly úspěšně vyrenderovány.");
        }

        status.innerText = "Generuji ZIP archiv...";
        const content = await zip.generateAsync({ 
            type: "blob",
            compression: "STORE"
        });
        
        // Vyčištění názvu projektu pro bezpečný název souboru (zachováme diakritiku)
        const safeProjectName = (AppState.projectName || 'karetni_sada')
            .trim()
            .replace(/[\s/\\?%*:|"<>]/g, '_');

        // Stažení
        const fileName = `${safeProjectName}.zip`;
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Úklid po krátké prodlevě
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        status.innerText = `Archiv "${fileName}" byl odeslán ke stažení.`;

    } catch (err) {
        console.error("Chyba při exportu:", err);
        alert("Při exportu došlo k chybě. Zkuste to prosím znovu.");
    } finally {
        overlay.style.display = 'none';
        barFill.style.width = '0%';
    }
}

async function exportSingleCard() {
    if (!AppState.activeCardId) return;
    const cardEl = document.getElementById('card-el-' + AppState.activeCardId);
    if (!cardEl) return;

    try {
        // html2canvas bere element a vytvoří z něj canvas
        const canvas = await html2canvas(cardEl, {
            backgroundColor: null,
            scale: 4, // Vysoká kvalita pro tisk
            useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `karta_${AppState.activeCardId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error("Export selhal:", err);
        alert("Při exportu karty došlo k chybě.");
    }
}

function exportPrintSheets() {
    window.print();
}

function setActiveCard(id, e) {
    AppState.activeCardId = id;
    document.querySelectorAll('.preview-card').forEach(el => el.classList.remove('active'));
    document.getElementById('card-el-' + id).classList.add('active');
    renderUIFromState(); 
}

function handleImageDrop(cardId, e) {
    e.preventDefault();
    const card = AppState.cards.find(c => c.id === cardId);
    if (!card || card.isLocked) {
        if (card && card.isLocked) alert("Tato karta je zamčená. Pro změnu obrázku ji nejdříve odemkněte.");
        return;
    }
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            card.image = ev.target.result; 
            card.crop = { x: 0, y: 0, scale: 1, stretchX: 1, stretchY: 1 }; 
            AppState.activeCardId = cardId; // Nastavíme jako aktivní, aby se UI chytlo
            debouncedSaveState(); 
            renderUIFromState(); 
        };
        reader.readAsDataURL(file);
    }
}

function updateGlobalStretch() {
    const sx = (parseFloat(document.getElementById('global-stretch-x').value) || 100) / 100;
    const sy = (parseFloat(document.getElementById('global-stretch-y').value) || 100) / 100;
    AppState.cards.forEach(card => { 
        if (!card.isLocked) {
           card.crop.stretchX = sx; card.crop.stretchY = sy; 
        }
    });
    debouncedSaveState(); requestRender();
}

function updateGlobalZoom() {
    const zoom = (parseFloat(document.getElementById('global-zoom').value) || 100) / 100;
    AppState.cards.forEach(card => { 
        if (!card.isLocked) {
            card.crop.scale = zoom; 
        }
    });
    debouncedSaveState(); requestRender();
}

function handleIndividualImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/') && AppState.activeCardId) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const card = AppState.cards.find(c => c.id === AppState.activeCardId);
            if (card) {
                card.image = e.target.result;
                card.crop = { x: 0, y: 0, scale: 1, stretchX: 1, stretchY: 1 };
                debouncedSaveState();
                renderUIFromState();
            }
        };
        reader.readAsDataURL(file);
    }
}

function updateIndividualImageParam(param, value) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card || !card.image) return;
    
    let val = parseFloat(value);
    if (param === 'scale') card.crop.scale = val / 100;
    if (param === 'stretchX') card.crop.stretchX = val / 100;
    if (param === 'stretchY') card.crop.stretchY = val / 100;
    if (param === 'x') card.crop.x = val;
    if (param === 'y') card.crop.y = val;
    
    debouncedSaveState();
    requestCardRender(card.id);
}

function resetIndividualImage() {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (card) {
        card.image = null;
        debouncedSaveState();
        renderUIFromState();
    }
}

// ===== TEXT NA KARTĚ ===== //
// Model: globál po hodnotě (AppState.textValueSettings) + per-suit barva
// (AppState.textSuitColors) + per-karta sparse override (card.textOverlay).
// Sparse override znamená, že card.textOverlay drží JEN klíče, které uživatel
// explicitně přepsal — chybějící se přebírají z globálu. Díky tomu změna
// globálního Y propíše i na karty, které si Y neoverridovaly.

// Zapnout/vypnout per-karta override. Prázdný objekt = "mám vlastní text,
// ale zatím nic neoverriduji" → resolver vrátí null jen pokud i globál
// neaktivní (jinak globál vykreslí).
function toggleCardText(enabled) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card) return;
    card.textOverlay = enabled ? (card.textOverlay || {}) : null;
    debouncedSaveState();
    renderUIFromState();
}

function updateCardText(param, value) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card) return;
    if (!card.textOverlay) card.textOverlay = {};

    if (param === 'text' || param === 'font' || param === 'color' || param === 'align') {
        card.textOverlay[param] = value;
    } else if (param === 'bold' || param === 'italic') {
        card.textOverlay[param] = !!value;
    } else if (param === 'size' || param === 'x' || param === 'y') {
        card.textOverlay[param] = parseFloat(value) || 0;
    }
    debouncedSaveState();
    requestCardRender(card.id);
}

// Smaže per-karta override (karta se vrátí k čistému globálu).
function resetCardText() {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card) return;
    card.textOverlay = null;
    debouncedSaveState();
    renderUIFromState();
}

// ===== GLOBÁLNÍ TEXT PO HODNOTĚ ===== //

function updateValueText(valueKey, param, value) {
    const vs = AppState.textValueSettings && AppState.textValueSettings[valueKey];
    if (!vs) return;
    if (param === 'enabled' || param === 'bold' || param === 'italic') {
        vs[param] = !!value;
    } else if (param === 'size' || param === 'x' || param === 'y') {
        vs[param] = parseFloat(value) || 0;
    } else if (param === 'text' || param === 'font' || param === 'color' || param === 'align') {
        vs[param] = value;
    }
    debouncedSaveState();
    requestRender();
}

function updateSuitTextColor(suit, color) {
    if (!AppState.textSuitColors) return;
    const norm = normalizedSuit(suit);
    AppState.textSuitColors[norm] = color || null; // prázdný řetězec = null
    debouncedSaveState();
    requestRender();
}

function clearSuitTextColor(suit) {
    if (!AppState.textSuitColors) return;
    const norm = normalizedSuit(suit);
    AppState.textSuitColors[norm] = null;
    debouncedSaveState();
    renderUIFromState();
}

// ===== PER-CARD LOGO (nezávislá vrstva navíc) ===== //

function defaultCardLogo(image) {
    return {
        image: image,
        opacity: 1,
        scale: 0.3,
        x: 0,
        y: 0,
        stretchX: 1,
        stretchY: 1
    };
}

function handleCardLogoUpload(event) {
    const file = event.target.files[0];
    // Zachytíme aktivní kartu hned (kdyby se mezitím přepnula)
    const cardId = AppState.activeCardId;
    // Reset hodnoty inputu okamžitě — bez toho by browser nezavolal onchange
    // při výběru stejného souboru na jinou kartu (známé chování <input type="file">).
    event.target.value = '';
    if (!file || !file.type.startsWith('image/') || !cardId) {
        if (!cardId) alert('Nejprve klikni na kartu, na kterou chceš logo nahrát.');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const card = AppState.cards.find(c => c.id === cardId);
        if (!card) return;
        card.cardLogo = defaultCardLogo(e.target.result);
        saveState();
        renderUIFromState();
    };
    reader.readAsDataURL(file);
}

function updateCardLogo(param, value) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card || !card.cardLogo) return;

    let val = parseFloat(value);
    if (param === 'opacity') card.cardLogo.opacity = val / 100;
    else if (param === 'scale') card.cardLogo.scale = val / 100;
    else if (param === 'stretchX') card.cardLogo.stretchX = val / 100;
    else if (param === 'stretchY') card.cardLogo.stretchY = val / 100;
    else if (param === 'x') card.cardLogo.x = val;
    else if (param === 'y') card.cardLogo.y = val;

    debouncedSaveState();
    requestCardRender(card.id);
}

function resetCardLogo() {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card) return;
    card.cardLogo = null;
    debouncedSaveState();
    renderUIFromState();
}

// Aplikuje cardLogo aktivní karty (vč. obrázku, polohy, scale, opacity) do všech karet sady.
// Cíl: uživatel vyladí logo na nejlépe vyhovující kartě a tlačítkem ho rozkopíruje na zbytek.
function applyCardLogoToAll() {
    if (!AppState.activeCardId) {
        alert('Nejprve vyber kartu, jejíž logo chceš zkopírovat na ostatní.');
        return;
    }
    const source = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!source || !source.cardLogo || !source.cardLogo.image) {
        alert('Aktivní karta nemá nahrané logo karty. Nahraj logo a vyladi ho, pak ho aplikuj na všechny.');
        return;
    }
    const total = AppState.cards.length;
    if (!confirm(`Zkopírovat logo karty z „${source.label}" do všech ${total} karet sady? Existující per-card logo na ostatních kartách bude přepsáno.`)) {
        return;
    }
    AppState.cards.forEach(c => {
        if (c.id === source.id) return;
        // Hluboká kopie přes JSON — bezpečně přenese i image dataURL
        c.cardLogo = JSON.parse(JSON.stringify(source.cardLogo));
    });
    saveState();
    renderUIFromState();
}

function renderUIFromState() {
    // 1. ZÁKLADNÍ NASTAVENÍ PROJEKTU
    const setVal = (id, val) => { 
        const el = document.getElementById(id); 
        if (el) {
            el.value = val; 
            updateValueBadge(id, val);
        }
    };
    const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    setVal('project-name', AppState.projectName);
    setVal('game-mode-select', AppState.gameMode);
    setChecked('show-symbols', AppState.showSymbols);
    setVal('card-width', AppState.cardWidth);
    setVal('card-height', AppState.cardHeight);
    setVal('card-radius', AppState.cardRadius);

    // 1b. GLOBÁLNÍ SYMBOLY
    const gS = AppState.globalSymbolSettings;
    setVal('global-sym-scale', Math.round(gS.scale * 100));
    setVal('global-sym-opacity', Math.round(gS.opacity * 100));
    setVal('global-sym-offsetX', gS.offsetX);
    setVal('global-sym-offsetY', gS.offsetY);
    setVal('global-sym-spacingY', Math.round(gS.spacingY * 100));
    setVal('global-sym-columnX', gS.columnX);

    // 2. GLOBÁLNÍ OVERLAY (VRSTVA 2)
    const gO = AppState.globalOverlay;
    setVal('overlay-opacity', Math.round(gO.opacity * 100));
    setVal('overlay-x', gO.x);
    setVal('overlay-y', gO.y);
    setVal('overlay-scale', Math.round(gO.scale * 100));
    setVal('overlay-border-color', gO.borderColor);
    setVal('overlay-border-width', gO.borderWidth);
    setVal('overlay-inset', gO.inset);
    setVal('overlay-border-radius', gO.borderRadius);

    // 3. GLOBÁLNÍ LOGO (VRSTVA 1)
    const gL = AppState.globalLogo;
    setVal('logo-opacity', Math.round(gL.opacity * 100));

    // 4. PER-SUIT NASTAVENÍ    // Přechod na české barvy
    ['Červené', 'Zelené', 'Kule', 'Žaludy'].forEach(suit => {
        const pane = document.getElementById('suit-tab-' + suit);
        if (!pane) return;
        const s = AppState.suitSettings[suit];
        if (!s) return;
        const p = `suit-${suit}-`;
        setVal(p + 'scale', Math.round(s.scale * 100));
        setVal(p + 'opacity', Math.round(s.opacity * 100));
        setVal(p + 'offsetX', s.offsetX);
        setVal(p + 'offsetY', s.offsetY);
        setVal(p + 'spacingY', s.spacingY * 100);
        setVal(p + 'columnX', s.columnX);
        setVal(p + 'borderColor', s.borderColor);
        setVal(p + 'borderWidth', s.borderWidth);
        setVal(p + 'inset', s.inset);
        setVal(p + 'borderRadius', s.borderRadius);
    });

    // 5. GLOBÁLNÍ ROZVRŽENÍ HODNOT
    const valSelect = document.getElementById('layout-value-select');
    if (valSelect) {
        const v = AppState.valueSettings[valSelect.value];
        if (v) {
            setVal('layout-offset-x', v.offsetX);
            setVal('layout-offset-y', v.offsetY);
            setVal('layout-spacing-y', Math.round(v.spacingY * 100));
            setVal('layout-column-x', v.columnX);
        }
    }

    // 6. INDIVIDUÁLNÍ NASTAVENÍ KARTY
    const indPanel = document.getElementById('individual-layout-panel');
    if (AppState.activeCardId) {
        const card = AppState.cards.find(c => c.id === AppState.activeCardId);
        if (card) {
            indPanel.style.display = 'block';
            const labelEl = document.getElementById('active-card-label');
            if (labelEl) labelEl.innerText = card.label;
            
            const lockBtn = document.getElementById('card-lock-btn');
            if (lockBtn) {
                lockBtn.classList.toggle('locked', card.isLocked);
                lockBtn.innerText = card.isLocked ? '🔒 Odemknout kartu' : '🔓 Zamknout kartu';
            }

            setChecked('individual-override-toggle', !!card.symbolOverride);
            const overrideToggle = document.getElementById('individual-override-toggle');
            if (overrideToggle) overrideToggle.disabled = card.isLocked;

            const uploadBtn = document.querySelector('#individual-card-image-section .upload-btn');
            if (uploadBtn) {
                uploadBtn.style.opacity = card.isLocked ? 0.3 : 1;
                uploadBtn.style.pointerEvents = card.isLocked ? 'none' : 'auto';
            }

            const ctrls = document.getElementById('individual-layout-controls');
            if (ctrls) {
                ctrls.style.opacity = (card.symbolOverride && !card.isLocked) ? 1 : 0.5;
                ctrls.style.pointerEvents = (card.symbolOverride && !card.isLocked) ? 'auto' : 'none';
            }

            if (card.symbolOverride) {
                setVal('ind-scale', Math.round(card.symbolOverride.scale * 100));
                setVal('ind-offset-x', card.symbolOverride.offsetX);
                setVal('ind-offset-y', card.symbolOverride.offsetY);
                setVal('ind-spacing-y', Math.round(card.symbolOverride.spacingY * 100));
                setVal('ind-column-x', card.symbolOverride.columnX);
                setVal('ind-opacity', Math.round(card.symbolOverride.opacity * 100));
            }

            // Sync individuální ilustrace
            const imgControls = document.getElementById('ind-img-controls');
            if (imgControls) {
                imgControls.style.display = card.image ? 'block' : 'none';
                if (card.image) {
                    setVal('ind-img-scale', Math.round(card.crop.scale * 100));
                    setVal('ind-img-stretchX', Math.round((card.crop.stretchX !== undefined ? card.crop.stretchX : 1) * 100));
                    setVal('ind-img-stretchY', Math.round((card.crop.stretchY !== undefined ? card.crop.stretchY : 1) * 100));
                    setVal('ind-img-x', card.crop.x);
                    setVal('ind-img-y', card.crop.y);
                    imgControls.style.opacity = card.isLocked ? 0.5 : 1;
                    imgControls.style.pointerEvents = card.isLocked ? 'none' : 'auto';
                }
            }

            // Sync Kvarteta data if mode is quartet
            if (AppState.gameMode === 'quartet') {
                const qd = card.quartetData || { name: "", description: "", stats: ["", "", "", ""] };
                setVal('ind-q-name', qd.name);
                setVal('ind-q-desc', qd.description);
                for(let i=0; i<4; i++) {
                    setVal(`ind-q-stat${i}`, qd.stats[i] || '');
                }
            }

            // Sync sekce VLASTNÍ TEXT (per-karta override) — viditelná na všech kartách.
            // Hodnoty v polích zobrazujeme jako EFEKTIVNÍ (globál → suit barva → override),
            // aby uživatel viděl, co reálně na kartě je, i když nemá lokální override.
            const textSection = document.getElementById('individual-text-section');
            if (textSection) {
                textSection.style.display = 'block';
                const enabled = !!card.textOverlay; // má per-karta override?
                setChecked('ind-text-enabled', enabled);
                const textCtrls = document.getElementById('ind-text-controls');
                if (textCtrls) {
                    textCtrls.style.opacity = enabled ? 1 : 0.55;
                    textCtrls.style.pointerEvents = enabled ? 'auto' : 'none';
                }
                // Vždy zobrazíme efektivní hodnoty (fallback na globál pro hodnotu, jinak default).
                const effective = resolveCardText(card) || (() => {
                    const valKey = normalizedSuit(card.id.split('_')[1]);
                    const g = AppState.textValueSettings && AppState.textValueSettings[valKey];
                    return g ? { ...g } : {
                        text: '', font: "'Tangerine', cursive", size: 25, color: '#ffffff',
                        bold: true, italic: false, x: 0, y: -158, align: 'center'
                    };
                })();
                setVal('ind-text-content', effective.text || '');
                setVal('ind-text-font', effective.font || "'Tangerine', cursive");
                setVal('ind-text-size', effective.size);
                setVal('ind-text-color', effective.color || '#ffffff');
                setChecked('ind-text-bold', !!effective.bold);
                setChecked('ind-text-italic', !!effective.italic);
                setVal('ind-text-align', effective.align || 'center');
                setVal('ind-text-x', effective.x || 0);
                setVal('ind-text-y', effective.y || 0);
            }

            // Sync sekce LOGO KARTY — viditelná u všech karet
            const logoCtrls = document.getElementById('ind-cardlogo-controls');
            if (logoCtrls) {
                const has = !!(card.cardLogo && card.cardLogo.image);
                logoCtrls.style.display = has ? 'block' : 'none';
                if (has) {
                    const cl = card.cardLogo;
                    setVal('ind-cardlogo-opacity', Math.round((cl.opacity !== undefined ? cl.opacity : 1) * 100));
                    setVal('ind-cardlogo-scale', Math.round(cl.scale * 100));
                    setVal('ind-cardlogo-stretchX', Math.round((cl.stretchX !== undefined ? cl.stretchX : 1) * 100));
                    setVal('ind-cardlogo-stretchY', Math.round((cl.stretchY !== undefined ? cl.stretchY : 1) * 100));
                    setVal('ind-cardlogo-x', cl.x);
                    setVal('ind-cardlogo-y', cl.y);
                }
            }
        }
    } else {
        indPanel.style.display = 'none';
    }

    // 7. GLOBÁLNÍ DEFORMACE (SAMPLE Z PRVNÍ KARTY)
    if (AppState.cards.length > 0) {
        const sample = AppState.cards[0].crop;
        setVal('global-stretch-x', Math.round(sample.stretchX * 100));
        setVal('global-stretch-y', Math.round(sample.stretchY * 100));
        setVal('global-zoom', Math.round(sample.scale * 100));
    }

    // 8. KVARTETA GLOBAL UI
    if (AppState.gameMode === 'quartet') {
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        for(let i=0; i<4; i++) {
            setVal(`quartet-attr-${i}`, AppState.quartetSettings.attributeNames[i] || '');
        }
        setVal('quartet-layout-x', AppState.quartetSettings.layout?.offsetX ?? 2);
        setVal('quartet-layout-y', AppState.quartetSettings.layout?.offsetY ?? 2);
        
        if (AppState.quartetSettings.hideStats !== undefined) {
             const chk = document.getElementById('quartet-hide-stats');
             if (chk) chk.checked = AppState.quartetSettings.hideStats;
        }
        setVal('quartet-font-family', AppState.quartetSettings.fontFamily || "'Cinzel', serif");
        setVal('quartet-stat-shape', AppState.quartetSettings.statShape || 'hexagon');
        setVal('quartet-stat-layout', AppState.quartetSettings.statLayout || 'corners');
        
        // Detailní styl
        setVal('quartet-stat-size', AppState.quartetSettings.statSize || 1.0);
        setVal('quartet-font-size-value', AppState.quartetSettings.fontSizeValue || 1.2);
        setVal('quartet-font-size-label', AppState.quartetSettings.fontSizeLabel || 0.4);
        setVal('quartet-stat-value-offset', AppState.quartetSettings.statValueOffset || 0);
        setVal('quartet-stat-label-offset', AppState.quartetSettings.statLabelOffset || 0);
        setVal('quartet-stat-bg-color', AppState.quartetSettings.statBgColor || '#000000');
        setVal('quartet-stat-opacity', (AppState.quartetSettings.statOpacity || 0.4) * 100);
        
        updateQuartetGroupColorUI();
    }

    // 9. GLOBÁLNÍ TEXT PO HODNOTĚ (jen pro režim hracích karet, jinak panel skrýt)
    syncTextValuePanel(setVal, setChecked);
    syncSuitTextColorPanel(setVal);

    requestRender();
}

// Synchronizace panelu „GLOBÁLNÍ TEXT PO HODNOTĚ".
// Edituje se vždy jedna vybraná hodnota (Eso/Král/Svršek/Spodek) podle
// `#text-value-select`. Změny se promítnou do AppState.textValueSettings[value].
function syncTextValuePanel(setVal, setChecked) {
    const panel = document.getElementById('text-value-panel');
    if (!panel) return;
    panel.style.display = (AppState.gameMode === 'playing_cards') ? 'block' : 'none';

    const select = document.getElementById('text-value-select');
    if (!select || !AppState.textValueSettings) return;
    const selected = select.value || 'Eso';
    const cfg = AppState.textValueSettings[selected];
    if (!cfg) return;

    setChecked('text-value-enabled', !!cfg.enabled);
    setVal('text-value-content', cfg.text || '');
    setVal('text-value-font', cfg.font || "'Tangerine', cursive");
    setVal('text-value-size', cfg.size != null ? cfg.size : 25);
    setVal('text-value-color', cfg.color || '#ffffff');
    setChecked('text-value-bold', !!cfg.bold);
    setChecked('text-value-italic', !!cfg.italic);
    setVal('text-value-align', cfg.align || 'center');
    setVal('text-value-x', cfg.x != null ? cfg.x : 0);
    setVal('text-value-y', cfg.y != null ? cfg.y : -158);
}

// Synchronizace 4 color pickerů „BARVA TEXTU PO BARVĚ".
function syncSuitTextColorPanel(setVal) {
    const panel = document.getElementById('text-suit-color-panel');
    if (!panel) return;
    panel.style.display = (AppState.gameMode === 'playing_cards') ? 'block' : 'none';
    if (!AppState.textSuitColors) return;
    const map = { 'Červené': 'text-suit-color-cervene', 'Zelené': 'text-suit-color-zelene', 'Kule': 'text-suit-color-kule', 'Žaludy': 'text-suit-color-zaludy' };
    Object.entries(map).forEach(([suit, id]) => {
        const v = AppState.textSuitColors[suit];
        // Color picker neumí null → zobrazíme bílou jako vizuální fallback,
        // ale interně si pamatujeme null (žádný override).
        setVal(id, v || '#ffffff');
        const chk = document.getElementById(id + '-enabled');
        if (chk) chk.checked = !!v;
    });
}

// Obsluha přepínače „aktivní hodnoty" v globálním panelu (volá HTML onchange).
function switchTextValueTarget() {
    renderUIFromState();
}

// Helper pro HTML — edituje právě vybranou hodnotu (Eso/Král/Svršek/Spodek).
function updateSelectedValueText(param, value) {
    const select = document.getElementById('text-value-select');
    const key = select ? select.value : 'Eso';
    updateValueText(key, param, value);
}

// Helper pro per-suit barvy z HTML — řeší zapnutí/vypnutí (null = bez override).
function toggleSuitTextColor(suit, enabled) {
    if (!AppState.textSuitColors) return;
    const norm = normalizedSuit(suit);
    if (!enabled) {
        AppState.textSuitColors[norm] = null;
    } else {
        // Při zapnutí převezmeme aktuální hodnotu z pickeru (HTML element).
        const map = { 'Červené': 'text-suit-color-cervene', 'Zelené': 'text-suit-color-zelene', 'Kule': 'text-suit-color-kule', 'Žaludy': 'text-suit-color-zaludy' };
        const el = document.getElementById(map[norm]);
        AppState.textSuitColors[norm] = (el && el.value) ? el.value : '#ffffff';
    }
    debouncedSaveState();
    requestRender();
}

// --- KVARTETA SPECIFIC LOGIC ---

function importKvartetaJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!Array.isArray(parsed)) throw new Error("JSON musí být pole objektů");
            
            let cardIndex = 0;
            // Iterate over all active cards and populate data sequentially
            AppState.cards.forEach(card => {
                if (cardIndex < parsed.length && card.id.startsWith('q_')) {
                    const row = parsed[cardIndex];
                    if (!card.quartetData) {
                        card.quartetData = {name: "", description: "", stats: ["", "", "", ""]};
                    }
                    
                    card.quartetData.name = row['Jméno'] || row['Name'] || '';
                    card.quartetData.description = row['Český popis'] || row['Popis'] || row['Description'] || '';
                    
                    // Fetch up to 4 arbitrary numerical stats from the object depending on the keys
                    let sidx = 0;
                    for (const [key, value] of Object.entries(row)) {
                        if (key !== 'Jméno' && key !== 'Name' && key !== 'Český popis' && key !== 'Popis' && key !== 'Description' && key !== 'Skupina' && key !== 'Group' && key !== '#') {
                             if (sidx < 4) {
                                  card.quartetData.stats[sidx] = value;
                                  // Update general attribute names if they haven't been customized fully yet (optional enhancement)
                                  if (cardIndex === 0 && document.getElementById(`quartet-attr-${sidx}`)) {
                                      AppState.quartetSettings.attributeNames[sidx] = key;
                                  }
                                  sidx++;
                             }
                        }
                    }
                    cardIndex++;
                }
            });
            
            debouncedSaveState();
            renderUIFromState();
            alert(`Úspěšně naimportováno ${cardIndex} karet z JSON.`);
        } catch (err) {
            console.error(err);
            alert("Chyba při čtení JSON. Zkontrolujte formát souboru.");
        }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = null;
}

function updateQuartetConfig(prop, value) {
    if (prop === 'statOpacity') value = parseFloat(value) / 100;
    AppState.quartetSettings[prop] = value;
    debouncedSaveState();
    requestRender();
}

function updateQuartetGroupColorUI() {
    const groupSelect = document.getElementById('quartet-group-select');
    const colorPicker = document.getElementById('quartet-color-picker');
    const widthSlider = document.getElementById('quartet-border-width');
    const insetSlider = document.getElementById('quartet-border-inset');
    const radiusSlider = document.getElementById('quartet-border-radius');
    
    if (groupSelect && colorPicker) {
        const group = groupSelect.value;
        const settings = AppState.quartetSettings.sets[group] || { color: '#ffffff' };
        colorPicker.value = settings.color;
    }
    
    const border = AppState.quartetSettings.border || { width: 0, inset: 0, radius: 4 };
    if (widthSlider) widthSlider.value = border.width || 0;
    if (insetSlider) insetSlider.value = border.inset || 0;
    if (radiusSlider) radiusSlider.value = border.radius !== undefined ? border.radius : 4;
}

function updateQuartetColor(color) {
    const groupSelect = document.getElementById('quartet-group-select');
    if (!groupSelect) return;
    const group = groupSelect.value;
    if (!AppState.quartetSettings.sets[group]) {
         AppState.quartetSettings.sets[group] = { color: '#ffffff', borderWidth: 0, inset: 0, borderRadius: 4 };
    }
    AppState.quartetSettings.sets[group].color = color;
    debouncedSaveState();
    requestRender();
}

function updateQuartetBorder(prop, value) {
    if (!AppState.quartetSettings.border) {
         AppState.quartetSettings.border = { width: 0, inset: 0, radius: 4 };
    }
    let mappedProp = prop;
    if (prop === 'borderWidth') mappedProp = 'width';
    if (prop === 'borderRadius') mappedProp = 'radius';

    AppState.quartetSettings.border[mappedProp] = parseFloat(value);
    debouncedSaveState();
    requestRender();
}

function updateQuartetLayout(prop, value) {
    if (!AppState.quartetSettings.layout) AppState.quartetSettings.layout = { offsetX: 2, offsetY: 2 };
    AppState.quartetSettings.layout[prop] = parseFloat(value);
    debouncedSaveState();
    requestRender();
}

function updateQuartetAttr(index, value) {
    AppState.quartetSettings.attributeNames[index] = value;
    debouncedSaveState();
    requestRender();
}

function updateActiveQuartetData(field, value, statIndex = 0) {
    if (!AppState.activeCardId) return;
    const card = AppState.cards.find(c => c.id === AppState.activeCardId);
    if (!card) return;
    if (!card.quartetData) card.quartetData = { name: "", description: "", stats: ["", "", "", ""] };
    
    if (field === 'stats') {
         card.quartetData.stats[statIndex] = value;
    } else {
         card.quartetData[field] = value;
    }
    
    debouncedSaveState();
    requestCardRender(card.id);
}

// Globální listener pro aktualizaci všech badge při interakci se slidery
document.addEventListener('input', (e) => {
    if (e.target.type === 'range') {
        updateValueBadge(e.target.id, e.target.value);
    }
});

// --- HROMADNÝ IMPORT (CSV + obrázky) ---

let bulkState = { csv: null, images: [] };

function openBulkImportDialog() {
    bulkState = { csv: null, images: [] };
    const csvIn = document.getElementById('bulk-csv-input');
    const imgIn = document.getElementById('bulk-img-input');
    const csvStatus = document.getElementById('bulk-csv-status');
    const imgStatus = document.getElementById('bulk-img-status');
    const summary = document.getElementById('bulk-import-summary');
    const runBtn = document.getElementById('bulk-import-run');
    const modal = document.getElementById('bulk-import-modal');
    if (csvIn) csvIn.value = '';
    if (imgIn) imgIn.value = '';
    if (csvStatus) csvStatus.textContent = 'žádný soubor';
    if (imgStatus) imgStatus.textContent = '0 souborů';
    if (summary) summary.textContent = '';
    if (runBtn) runBtn.disabled = true;
    if (modal) modal.style.display = 'flex';
}

function closeBulkImportDialog() {
    const modal = document.getElementById('bulk-import-modal');
    if (modal) modal.style.display = 'none';
}

function refreshBulkRunButton() {
    const ready = !!bulkState.csv || bulkState.images.length > 0;
    const runBtn = document.getElementById('bulk-import-run');
    if (runBtn) runBtn.disabled = !ready;
}

document.addEventListener('DOMContentLoaded', () => {
    const csvIn = document.getElementById('bulk-csv-input');
    const imgIn = document.getElementById('bulk-img-input');
    const modal = document.getElementById('bulk-import-modal');

    if (csvIn) {
        csvIn.addEventListener('change', (e) => {
            bulkState.csv = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            const status = document.getElementById('bulk-csv-status');
            if (status) status.textContent = bulkState.csv ? bulkState.csv.name : 'žádný soubor';
            refreshBulkRunButton();
        });
    }
    if (imgIn) {
        imgIn.addEventListener('change', (e) => {
            bulkState.images = Array.from(e.target.files || []);
            const status = document.getElementById('bulk-img-status');
            if (status) status.textContent = `${bulkState.images.length} souborů`;
            refreshBulkRunButton();
        });
    }
    // Klik mimo dialog ho zavře
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeBulkImportDialog();
        });
    }
});

/**
 * Lite RFC 4180 CSV parser:
 * - podporuje uvozovky (escapované zdvojením "")
 * - oddělovač: čárka i středník (Excel CZ)
 * - odstraňuje BOM
 * Vrací pole objektů (řádky) klíčované hlavičkou.
 */
function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (c === '"') {
                inQuotes = false;
            } else {
                field += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ',' || c === ';') {
                row.push(field);
                field = '';
            } else if (c === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else if (c === '\r') {
                // skip
            } else {
                field += c;
            }
        }
    }
    if (field.length || row.length) {
        row.push(field);
        rows.push(row);
    }
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1)
        .filter(r => r.some(c => (c || '').trim() !== ''))
        .map(r => {
            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = (r[i] !== undefined ? r[i] : '').trim();
            });
            return obj;
        });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('FileReader error'));
        reader.readAsDataURL(file);
    });
}

async function performBulkImport() {
    const summaryEl = document.getElementById('bulk-import-summary');
    const runBtn = document.getElementById('bulk-import-run');
    if (runBtn) runBtn.disabled = true;
    if (summaryEl) summaryEl.textContent = 'Zpracovávám…';

    try {
        // 1) CSV → řádky
        let rows = [];
        if (bulkState.csv) {
            const text = await bulkState.csv.text();
            rows = parseCSV(text.normalize('NFC'));
        }

        // 2) Obrázky → Map<ID, base64>
        const imageMap = new Map();
        for (const file of bulkState.images) {
            const id = file.name.replace(/\.(png|jpe?g|webp)$/i, '').toUpperCase().trim();
            if (!id) continue;
            try {
                const base64 = await readFileAsDataURL(file);
                imageMap.set(id, base64);
            } catch (e) {
                console.error('Selhal čtení souboru', file.name, e);
            }
        }

        // 3) Aplikovat na karty
        const reserved = new Set([
            'ID', 'Id', 'id',
            'Jméno', 'Name',
            'Popis', 'Český popis', 'Description',
            'Skupina', 'Group', '#'
        ]);

        let csvMatched = 0;
        const csvUnmatched = [];

        rows.forEach((row, rowIdx) => {
            const rawId = (row.ID || row.Id || row.id || '').toString().toUpperCase().trim();
            if (!rawId) return;
            const card = AppState.cards.find(c => c.id === `q_${rawId}`);
            if (!card) {
                csvUnmatched.push(rawId);
                return;
            }
            if (!card.quartetData) {
                card.quartetData = { name: '', description: '', stats: ['', '', '', ''] };
            }
            if (row['Jméno'] || row['Name']) {
                card.quartetData.name = row['Jméno'] || row['Name'];
            }
            if (row['Popis'] || row['Český popis'] || row['Description']) {
                card.quartetData.description = row['Popis'] || row['Český popis'] || row['Description'];
            }

            let sidx = 0;
            for (const [key, value] of Object.entries(row)) {
                if (reserved.has(key)) continue;
                if (sidx < 4) {
                    card.quartetData.stats[sidx] = value;
                    if (rowIdx === 0) {
                        AppState.quartetSettings.attributeNames[sidx] = key;
                    }
                    sidx++;
                }
            }
            csvMatched++;
        });

        let imgMatched = 0;
        const imgUnmatched = [];
        for (const [id, b64] of imageMap.entries()) {
            const card = AppState.cards.find(c => c.id === `q_${id}`);
            if (card) {
                card.image = b64;
                // Reset oříznutí na default, aby nový obrázek byl viditelný
                card.crop = { x: 0, y: 0, scale: 1, stretchX: 1, stretchY: 1 };
                imgMatched++;
            } else {
                imgUnmatched.push(id);
            }
        }

        // 4) Uložit + re-render
        let storageWarning = '';
        try {
            saveState();
        } catch (e) {
            console.error('saveState failed', e);
            storageWarning = ' ⚠️ Autosave selhal (localStorage limit) — exportujte projekt!';
        }
        renderUIFromState();

        // 5) Summary
        const parts = [];
        if (bulkState.csv) {
            parts.push(`Tabulka: ${csvMatched} řádků` + (csvUnmatched.length ? `, neznámé ID: ${csvUnmatched.join(', ')}` : ''));
        }
        if (bulkState.images.length) {
            parts.push(`Obrázky: ${imgMatched}/${bulkState.images.length} přiřazeno` + (imgUnmatched.length ? `, bez karty: ${imgUnmatched.join(', ')}` : ''));
        }
        if (!parts.length) parts.push('Nebyl vybrán žádný soubor.');
        if (summaryEl) summaryEl.textContent = parts.join(' • ') + storageWarning;

        // Zavřít modal po krátké pauze, aby si uživatel přečetl summary
        if (csvMatched > 0 || imgMatched > 0) {
            setTimeout(() => {
                closeBulkImportDialog();
            }, 1800);
        } else if (runBtn) {
            runBtn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        if (summaryEl) summaryEl.textContent = 'Chyba: ' + (err.message || err);
        if (runBtn) runBtn.disabled = false;
    }
}

// =====================================================================
// Načítání hotových sad z adresáře finalni_karty/ (všechny režimy)
// =====================================================================

const FINISHED_SET_VALUE_MAP = {
    '7': '7', 'sedm': '7', 'sedmicka': '7',
    '8': '8', 'osm': '8', 'osmicka': '8',
    '9': '9', 'devet': '9', 'devitka': '9',
    '10': '10', 'deset': '10', 'desitka': '10',
    'spodek': 'Spodek', 'kluk': 'Spodek', 'jack': 'Spodek',
    'svrsek': 'Svršek', 'kralovna': 'Svršek', 'queen': 'Svršek', 'dama': 'Svršek',
    'kral': 'Král', 'king': 'Král',
    'eso': 'Eso', 'ace': 'Eso'
};

const FINISHED_SET_SUIT_MAP = {
    'cervene': 'Červené', 'srdce': 'Červené', 'srdcove': 'Červené', 'hearts': 'Červené',
    'zelene': 'Zelené', 'listy': 'Zelené', 'leaves': 'Zelené', 'spades': 'Zelené',
    'kule': 'Kule', 'kary': 'Kule', 'koule': 'Kule', 'diamonds': 'Kule', 'bells': 'Kule',
    'zaludy': 'Žaludy', 'zalude': 'Žaludy', 'acorns': 'Žaludy', 'clubs': 'Žaludy'
};

function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function stripDiacritics(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function tokenizeName(baseName) {
    return stripDiacritics(baseName.toLowerCase())
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
}

async function loadFinishedSet(event) {
    const input = event.target;
    const files = Array.from(input.files || [])
        .filter(f => /\.(png|jpe?g|webp)$/i.test(f.name));

    // Reset, ať jde tatáž složka znovu vybrat
    input.value = '';

    if (!files.length) {
        alert('Ve složce nejsou žádné obrázky (PNG/JPEG/WebP).');
        return;
    }

    let loaded;
    try {
        loaded = await Promise.all(files.map(async f => {
            // macOS HFS+/APFS dává filenames v NFD; sloty v state.js jsou v NFC.
            const nfcName = f.name.normalize('NFC');
            const dataURL = await readFileAsDataURL(f);
            const dims = await getImageNaturalSize(dataURL);
            return {
                name: nfcName,
                baseName: nfcName.replace(/\.(png|jpe?g|webp)$/i, ''),
                dataURL,
                naturalW: dims.w,
                naturalH: dims.h
            };
        }));
    } catch (e) {
        console.error('Načtení souborů selhalo', e);
        alert('Některé soubory se nepodařilo načíst: ' + (e.message || e));
        return;
    }

    // Hotová karta = celý design je už zapečen v obrázku.
    // Vypneme dynamické symboly (jinak by se kreslily přes obrázek)
    // a u kvarteta i statový overlay.
    AppState.showSymbols = false;
    if (AppState.quartetSettings) {
        AppState.quartetSettings.hideStats = true;
    }

    const result = assignImagesToCards(loaded, AppState.gameMode);

    // Slot v UI px = cardWidth_mm * scaleUi (3.8 v createCardElement).
    const SCALE_UI = 3.8;
    const slotW = AppState.cardWidth  * SCALE_UI;
    const slotH = AppState.cardHeight * SCALE_UI;

    result.assignments.forEach(({ cardId, item }) => {
        const card = AppState.cards.find(c => c.id === cardId);
        if (!card) return;
        card.image = item.dataURL;

        // Auto-fit "fill": vyplní celý slot. Pokud poměr stran sedí (typicky
        // ano u finalni_karty), výsledek je pixel-perfect bez deformace.
        // Jinak se nepatrně roztáhne — uživatel vidí kompletní hotový design.
        const fitX = (item.naturalW > 0) ? slotW / item.naturalW : 1;
        const fitY = (item.naturalH > 0) ? slotH / item.naturalH : 1;
        const baseScale = Math.min(fitX, fitY);
        card.crop = {
            x: 0,
            y: 0,
            scale: baseScale,
            stretchX: (baseScale > 0) ? fitX / baseScale : 1,
            stretchY: (baseScale > 0) ? fitY / baseScale : 1
        };
    });

    let storageWarning = '';
    try {
        saveState();
    } catch (e) {
        console.error('saveState failed', e);
        storageWarning = '⚠️ Autosave selhal (limit localStorage). Exportujte projekt přes "Uložit Projekt".';
    }
    renderUIFromState();

    showFinishedSetSummary({
        total: loaded.length,
        matched: result.assignments.length,
        unmatched: result.unmatched,
        strategy: result.strategy
    }, storageWarning);
}

function getImageNaturalSize(dataURL) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = dataURL;
    });
}

function assignImagesToCards(loaded, mode) {
    if (mode === 'playing_cards') return assignPlayingCards(loaded);
    if (mode === 'quartet')       return assignQuartet(loaded);
    if (mode === 'pexeso')        return assignPexeso(loaded);
    return { assignments: [], unmatched: loaded.map(l => l.name), strategy: 'neznámý režim' };
}

function assignPlayingCards(loaded) {
    const assignments = [];
    const unmatched = [];
    const usedSlots = new Set();
    const cardIds = new Set(AppState.cards.map(c => c.id));

    let directHits = 0;
    let translatedHits = 0;
    const remaining = [];

    // 1) Přímý ID match (např. "Červené_7")
    for (const item of loaded) {
        if (cardIds.has(item.baseName) && !usedSlots.has(item.baseName)) {
            assignments.push({ cardId: item.baseName, item });
            usedSlots.add(item.baseName);
            directHits++;
        } else {
            remaining.push(item);
        }
    }

    // 2) Český překlad: hledáme value+suit token v libovolném pořadí
    const stillRemaining = [];
    for (const item of remaining) {
        const tokens = tokenizeName(item.baseName);
        let matchedValue = null;
        let matchedSuit = null;
        for (const t of tokens) {
            if (!matchedValue && FINISHED_SET_VALUE_MAP[t]) matchedValue = FINISHED_SET_VALUE_MAP[t];
            if (!matchedSuit  && FINISHED_SET_SUIT_MAP[t])  matchedSuit  = FINISHED_SET_SUIT_MAP[t];
        }
        if (matchedValue && matchedSuit) {
            const id = `${matchedSuit}_${matchedValue}`;
            if (cardIds.has(id) && !usedSlots.has(id)) {
                assignments.push({ cardId: id, item });
                usedSlots.add(id);
                translatedHits++;
                continue;
            }
        }
        stillRemaining.push(item);
    }

    // 3) Abecední fallback do volných slotů
    let orderHits = 0;
    if (stillRemaining.length) {
        stillRemaining.sort((a, b) => naturalSort(a.baseName, b.baseName));
        const freeSlots = AppState.cards.filter(c => !usedSlots.has(c.id));
        let i = 0;
        for (const item of stillRemaining) {
            if (i >= freeSlots.length) {
                unmatched.push(item.name);
                continue;
            }
            assignments.push({ cardId: freeSlots[i].id, item });
            usedSlots.add(freeSlots[i].id);
            i++;
            orderHits++;
        }
    }

    const parts = [];
    if (directHits)     parts.push(`${directHits}× přímý ID match`);
    if (translatedHits) parts.push(`${translatedHits}× český překlad`);
    if (orderHits)      parts.push(`${orderHits}× abecední fallback`);
    return { assignments, unmatched, strategy: parts.join(' + ') || 'žádný match' };
}

function assignQuartet(loaded) {
    const sorted = [...loaded].sort((a, b) => naturalSort(a.baseName, b.baseName));
    const assignments = [];
    const unmatched = [];
    const slotIds = AppState.cards.map(c => c.id); // očekáváme q_1A..q_8D v tomto pořadí

    sorted.forEach((item, idx) => {
        if (idx < slotIds.length) {
            assignments.push({ cardId: slotIds[idx], item });
        } else {
            unmatched.push(item.name);
        }
    });

    return {
        assignments,
        unmatched,
        strategy: `abecední pořadí → ${assignments.length}/${slotIds.length} slotů`
    };
}

function assignPexeso(loaded) {
    const sorted = [...loaded].sort((a, b) => naturalSort(a.baseName, b.baseName));

    // Auto-resize: nastavíme počet a re-init slotů.
    if (sorted.length !== AppState.cards.length) {
        AppState.pexesoCount = sorted.length;
        initCardsByMode('pexeso'); // přepíše AppState.cards na pex_1..pex_N
    }

    const assignments = [];
    const slotIds = AppState.cards.map(c => c.id);
    sorted.forEach((item, idx) => {
        if (idx < slotIds.length) {
            assignments.push({ cardId: slotIds[idx], item });
        }
    });

    return {
        assignments,
        unmatched: [],
        strategy: `pexeso auto-resize → ${assignments.length} slotů`
    };
}

function showFinishedSetSummary(info, storageWarning) {
    const modal = document.getElementById('finished-set-modal');
    const stats = document.getElementById('finished-set-stats');
    const strategy = document.getElementById('finished-set-strategy');
    const warning = document.getElementById('finished-set-warning');
    const wrap = document.getElementById('finished-set-unmatched-wrap');
    const list = document.getElementById('finished-set-unmatched');
    if (!modal) return;

    if (stats) stats.textContent = `Načteno ${info.matched}/${info.total} obrázků do slotů.`;
    if (strategy) strategy.textContent = `Strategie: ${info.strategy}`;

    if (warning) {
        if (storageWarning) {
            warning.textContent = storageWarning;
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
            warning.textContent = '';
        }
    }

    if (wrap && list) {
        list.innerHTML = '';
        if (info.unmatched && info.unmatched.length) {
            info.unmatched.forEach(name => {
                const li = document.createElement('li');
                li.textContent = name;
                list.appendChild(li);
            });
            wrap.style.display = 'block';
        } else {
            wrap.style.display = 'none';
        }
    }

    modal.style.display = 'flex';
}

function closeFinishedSetSummary() {
    const modal = document.getElementById('finished-set-modal');
    if (modal) modal.style.display = 'none';
}
