// === TVARY BOXŮ VLASTNOSTÍ (klasické kvarteto) ==============================
// Šestiúhelník a štít byly dřív oříznuté přes CSS clip-path. html2canvas (Export ZIP)
// clip-path neumí, takže se v PNG vykreslily jako obdélníky. Proto je kreslíme jako
// SVG polygon pod obsahem boxu — stejně v editoru i v exportu.
// Kruh a zaoblený čtverec zůstávají v CSS (border-radius html2canvas zvládá).

const SVG_NS = 'http://www.w3.org/2000/svg';

const SVG_STAT_SHAPES = {
    'hexagon': {
        points: '50,0 100,25 100,75 50,100 0,75 0,25',
        // Hrany, na kterých byl po oříznutí vidět 1px CSS rámeček (zachováváme vzhled)
        borderEdges: 'M0,25 L0,75 M100,25 L100,75',
        borderColor: 'rgba(255,255,255,0.4)'
    },
    'golden-hexagon': {
        points: '50,0 100,25 100,75 50,100 0,75 0,25',
        borderEdges: 'M0,25 L0,75 M100,25 L100,75',
        borderColor: '#ffd700',
        gradient: ['rgba(212,175,55,0.7)', 'rgba(138,110,30,0.8)'],
        insetShadow: 'rgba(0,0,0,0.5)'   // náhrada CSS box-shadow: inset 0 0 10px
    },
    'shield': {
        points: '0,0 100,0 100,75 50,100 0,75',
        borderEdges: 'M0,75 L0,0 L100,0 L100,75',
        borderColor: 'rgba(255,255,255,0.5)'
    }
};

let svgStatShapeSeq = 0; // unikátní id gradientů v dokumentu

function isSvgStatShape(shape) {
    return Object.prototype.hasOwnProperty.call(SVG_STAT_SHAPES, shape);
}

// Vloží SVG tvar do boxu vlastnosti a zruší CSS pozadí/rámeček/ořez kontejneru.
// fill = barva pozadí (u zlatého šestiúhelníku se ignoruje), borderColor = null → výchozí tvaru.
function applySvgStatShape(hexContainer, shape, fill, borderColor) {
    const cfg = SVG_STAT_SHAPES[shape];
    if (!cfg) return;

    hexContainer.style.background = 'transparent';
    hexContainer.style.border = 'none';
    hexContainer.style.clipPath = 'none';
    hexContainer.style.boxShadow = 'none';
    // SVG je absolutně pozicované → .hex-container musí být pozicovaný. Zajišťují to pravidla
    // .layout-wrapper-* .hex-container v css/editor.css (absolute / relative) — při úpravě hlídat.

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none;';

    const uid = ++svgStatShapeSeq;
    const defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);

    let fillValue = fill;
    if (cfg.gradient) {
        const id = `stat-shape-grad-${uid}`;
        const grad = document.createElementNS(SVG_NS, 'linearGradient');
        grad.setAttribute('id', id);
        grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
        grad.setAttribute('x2', '1'); grad.setAttribute('y2', '1');
        cfg.gradient.forEach((color, i) => {
            const stop = document.createElementNS(SVG_NS, 'stop');
            stop.setAttribute('offset', i === 0 ? '0' : '1');
            stop.setAttribute('stop-color', color);
            grad.appendChild(stop);
        });
        defs.appendChild(grad);
        fillValue = `url(#${id})`;
    }

    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', cfg.points);
    polygon.setAttribute('fill', fillValue);
    svg.appendChild(polygon);

    if (cfg.insetShadow) appendInsetShadow(svg, defs, cfg, uid);

    // Rámeček: 2px tah vystředěný na hraně → uvnitř boxu zůstane 1px jako dřív
    const edges = document.createElementNS(SVG_NS, 'path');
    edges.setAttribute('d', cfg.borderEdges);
    edges.setAttribute('fill', 'none');
    edges.setAttribute('stroke', borderColor || cfg.borderColor);
    edges.setAttribute('stroke-width', '2');
    edges.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(edges);

    hexContainer.insertBefore(svg, hexContainer.firstChild);
}

// Vnitřní stín: rozmazaný tmavý obrys ořezaný na tvar (SVG obdoba box-shadow: inset)
function appendInsetShadow(svg, defs, cfg, uid) {
    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.setAttribute('id', `stat-shape-clip-${uid}`);
    const clipShape = document.createElementNS(SVG_NS, 'polygon');
    clipShape.setAttribute('points', cfg.points);
    clip.appendChild(clipShape);

    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', `stat-shape-blur-${uid}`);
    const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '4');
    filter.appendChild(blur);
    defs.appendChild(clip);
    defs.appendChild(filter);

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('clip-path', `url(#stat-shape-clip-${uid})`);
    const shadow = document.createElementNS(SVG_NS, 'polygon');
    shadow.setAttribute('points', cfg.points);
    shadow.setAttribute('fill', 'none');
    shadow.setAttribute('stroke', cfg.insetShadow);
    shadow.setAttribute('stroke-width', '14');
    shadow.setAttribute('filter', `url(#stat-shape-blur-${uid})`);
    group.appendChild(shadow);
    svg.appendChild(group);
}
