/* ==========================================
   NYXAR — script.js  Configurador v4
   - Drag libre con touch y mouse
   - Resize proporcional desde esquina
   - Rotate libre desde handle
   - Precio en tiempo real por tamaño + talla
   ========================================== */
'use strict';

// ── DATOS ──────────────────────────────────
const TALLAS_DATA = {
  XS: { ancho:52, largo:68, hombro:44, manga:20, precio:0 },
  S:  { ancho:54, largo:70, hombro:46, manga:21, precio:0 },
  M:  { ancho:57, largo:73, hombro:48, manga:22, precio:1 },
  L:  { ancho:60, largo:75, hombro:50, manga:23, precio:2 },
  XL: { ancho:63, largo:78, hombro:52, manga:24, precio:3 },
};

const CORTES_DATA = {
  regular:  { label:'Regular',  desc:'Silueta limpia, ajuste estándar.',           precio:0, dAncho:0, dLargo:0,  dHombro:0 },
  oversize: { label:'Oversize', desc:'Caída relajada, estilo streetwear moderno.', precio:2, dAncho:6, dLargo:4,  dHombro:3 },
  boxy:     { label:'Boxy Fit', desc:'Forma cuadrada estructurada. Look fashion.', precio:3, dAncho:5, dLargo:-3, dHombro:2 },
};

const BASE        = 12;
const GANANCIA    = 9;
const PREMIUM_PRICE = 3.99;
const DTF_PRECIO  = { small:3, medium:7, large:11 };
const DTF_PX      = { small:60, medium:110, large:165 };
const COLOR_NAMES = { black:'Negro', white:'Blanco', beige:'Beige' };

const ASSET_MAP = {
  regular:  {
    black: { front:'assets/shirt-regular-black-front.png', back:'assets/shirt-regular-black-back.png' },
    white: { front:'assets/shirt-regular-white-front.png', back:'assets/shirt-regular-white-back.png' },
    beige: { front:'assets/shirt-regular-beige-front.png', back:'assets/shirt-regular-beige-back.png' },
  },
  oversize: {
    black: { front:'assets/shirt-oversize-black-front.png', back:'assets/shirt-oversize-black-back.png' },
    white: { front:'assets/shirt-oversize-white-front.png', back:'assets/shirt-oversize-white-back.png' },
    beige: { front:'assets/shirt-oversize-beige-front.png', back:'assets/shirt-oversize-beige-back.png' },
  },
  boxy: {
    black: { front:'assets/shirt-boxy-black-front.png', back:'assets/shirt-boxy-black-back.png' },
    white: { front:'assets/shirt-boxy-white-front.png', back:'assets/shirt-boxy-white-back.png' },
    beige: { front:'assets/shirt-boxy-beige-front.png', back:'assets/shirt-boxy-beige-back.png' },
  },
};

const SVG_SHIRT = (side, color) => {
  const fill   = color === 'white' ? '#e8e8e8' : color === 'beige' ? '#c8b090' : '#1a1a2e';
  const stroke = '#4b0082';
  return `<svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:160px;height:auto">
    <path d="M58 18L18 56l18 8-6 158h160l-6-158 18-8L142 18l-16 12Q100 38 74 30Z"
      fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    ${side==='front'
      ? `<path d="M74 30Q100 38 126 30L130 54Q100 66 70 54Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
      : `<path d="M58 18 Q100 8 142 18" fill="none" stroke="${stroke}" stroke-width="1.5"/>`}
  </svg>`;
};

// ── ESTADO ─────────────────────────────────
const S = {
  talla: 'S', corte: 'regular', color: 'black', premium: false,
  front: { hasDesign:false, size:'medium', x:0, y:0, w:110, h:110, rot:0 },
  back:  { hasDesign:false, size:'medium', x:0, y:0, w:110, h:110, rot:0 },
};

// ── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateShirtImages();
  updateMedidas();
  updatePrice();
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
});

// ── SETTERS ─────────────────────────────────
function setTalla(val, btn) {
  S.talla = val;
  activateChip('grupTalla', btn);
  updateMedidas();
  updatePrice();
}

function setCorte(val, btn) {
  S.corte = val;
  activateChip('grupCorte', btn);
  document.getElementById('corteDesc').textContent = CORTES_DATA[val].desc;
  updateMedidas();
  updateShirtImages();
  updatePrice();
}

function setColor(val, btn) {
  S.color = val;
  document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('colorName').textContent = COLOR_NAMES[val];
  updateShirtImages();
}

function setDtfSize(side, val, btn) {
  S[side].size = val;
  activateChip(side === 'front' ? 'dtfSizeFront' : 'dtfSizeBack', btn);
  if (S[side].hasDesign) {
    const ratio = S[side].h / S[side].w;
    S[side].w = DTF_PX[val];
    S[side].h = S[side].w * ratio;
    applyTransform(side);
  }
  updatePrice();
}

function activateChip(groupId, btn) {
  document.querySelectorAll(`#${groupId} .chip, #${groupId} .chip-xs`)
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── MEDIDAS ─────────────────────────────────
function updateMedidas() {
  const t = TALLAS_DATA[S.talla];
  const c = CORTES_DATA[S.corte];
  document.getElementById('mAncho').textContent  = (t.ancho  + c.dAncho)  + 'cm';
  document.getElementById('mLargo').textContent  = (t.largo  + c.dLargo)  + 'cm';
  document.getElementById('mHombro').textContent = (t.hombro + c.dHombro) + 'cm';
  document.getElementById('mManga').textContent  = t.manga + 'cm';
}

// ── IMÁGENES ─────────────────────────────────
function updateShirtImages() {
  ['front', 'back'].forEach(side => {
    const paths = ASSET_MAP[S.corte]?.[S.color];
    const imgEl = document.getElementById(side === 'front' ? 'shirtImgFront' : 'shirtImgBack');
    removeSvgFallback(side);
    if (paths && paths[side]) {
      imgEl.style.display = '';
      imgEl.src = paths[side];
      imgEl.onerror = () => { imgEl.style.display = 'none'; insertSvgFallback(side); };
    } else {
      imgEl.style.display = 'none';
      insertSvgFallback(side);
    }
  });
}

function insertSvgFallback(side) {
  const canvas = document.getElementById(side === 'front' ? 'canvasFront' : 'canvasBack');
  if (canvas.querySelector('.svg-fallback')) return;
  const div = document.createElement('div');
  div.className = 'svg-fallback';
  div.innerHTML = SVG_SHIRT(side, S.color);
  canvas.appendChild(div);
}

function removeSvgFallback(side) {
  const fb = document.getElementById(side === 'front' ? 'canvasFront' : 'canvasBack')
    .querySelector('.svg-fallback');
  if (fb) fb.remove();
}

// ── PRECIO ───────────────────────────────────
function updatePrice() {
  const camisaBase = BASE + TALLAS_DATA[S.talla].precio + CORTES_DATA[S.corte].precio + GANANCIA;
  const dtfF = S.front.hasDesign ? DTF_PRECIO[S.front.size] : 0;
  const dtfB = S.back.hasDesign  ? DTF_PRECIO[S.back.size]  : 0;
  const premium = S.premium ? PREMIUM_PRICE : 0;
  const total   = Math.max(camisaBase + dtfF + dtfB + premium, 25.99);

  document.getElementById('pCamisa').textContent = '$' + camisaBase;

  const rowF = document.getElementById('rowDisenoF');
  const rowB = document.getElementById('rowDisenoB');
  rowF.style.display = dtfF > 0 ? '' : 'none';
  rowB.style.display = dtfB > 0 ? '' : 'none';
  document.getElementById('pDisenoF').textContent = '+$' + dtfF;
  document.getElementById('pDisenoB').textContent = '+$' + dtfB;

  const el = document.getElementById('pTotal');
  el.textContent = '$' + total.toFixed(2).replace('.00', '');
  el.classList.remove('total-pop');
  void el.offsetWidth;
  el.classList.add('total-pop');
}

// ── PREMIUM ──────────────────────────────────
function togglePremium() {
  S.premium = !S.premium;
  const btn = document.getElementById('btnUpgrade');
  btn.textContent = S.premium ? '✓ Activo' : '+ $3.99';
  btn.classList.toggle('active', S.premium);
  if (S.premium) showToast('✦ Experiencia premium activada');
  updatePrice();
}

// ── UPLOAD ───────────────────────────────────
function uploadDesign(side, event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgEl  = document.getElementById(side === 'front' ? 'designFront'  : 'designBack');
    const wrapEl = document.getElementById(side === 'front' ? 'wrapFront'    : 'wrapBack');
    imgEl.src = e.target.result;
    imgEl.onload = () => {
      const ratio = imgEl.naturalHeight / imgEl.naturalWidth;
      S[side].w   = DTF_PX[S[side].size];
      S[side].h   = S[side].w * ratio;
      S[side].x   = 0;
      S[side].y   = 0;
      S[side].rot = 0;
      S[side].hasDesign = true;
      wrapEl.style.display = 'block';
      applyTransform(side);
      initInteraction(side);
      updatePrice();
      showToast('Diseño cargado — arrástralo y ajústalo ✦');
    };
  };
  reader.readAsDataURL(file);
}

function clearDesign(side) {
  S[side].hasDesign = false;
  S[side].x = S[side].y = S[side].rot = 0;
  S[side].w = S[side].h = DTF_PX[S[side].size];
  const wrapId  = side === 'front' ? 'wrapFront' : 'wrapBack';
  const inputId = side === 'front' ? 'fileFront'  : 'fileBack';
  document.getElementById(wrapId).style.display = 'none';
  document.getElementById(inputId).value = '';
  updatePrice();
  showToast('Diseño eliminado');
}

// ── TRANSFORM ────────────────────────────────
function applyTransform(side) {
  const wrap = document.getElementById(side === 'front' ? 'wrapFront' : 'wrapBack');
  const img  = document.getElementById(side === 'front' ? 'designFront' : 'designBack');
  const d    = S[side];
  wrap.style.left      = `calc(50% + ${d.x}px)`;
  wrap.style.top       = `calc(50% + ${d.y}px)`;
  wrap.style.transform = `translate(-50%,-50%) rotate(${d.rot}deg)`;
  wrap.style.width     = d.w + 'px';
  img.style.width      = d.w + 'px';
  img.style.height     = d.h + 'px';
}

// ── INTERACCIÓN: DRAG + RESIZE + ROTATE ──────
function initInteraction(side) {
  const wrapId   = side === 'front' ? 'wrapFront'   : 'wrapBack';
  const resizeId = side === 'front' ? 'resizeFront'  : 'resizeBack';
  const rotateId = side === 'front' ? 'rotateFront'  : 'rotateBack';

  // Clonar para limpiar listeners anteriores
  const oldWrap = document.getElementById(wrapId);
  const newWrap = oldWrap.cloneNode(true);
  oldWrap.parentNode.replaceChild(newWrap, oldWrap);

  const resizeH = newWrap.querySelector('#' + resizeId);
  const rotateH = newWrap.querySelector('#' + rotateId);

  let mode = null, sx, sy, sw, sh, startRot, startAngle;

  function xy(e) {
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX, y: src.clientY };
  }

  function angle(e) {
    const rect = newWrap.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const p  = xy(e);
    return Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI;
  }

  function down(e) {
    const p = xy(e);
    if (e.target === resizeH || e.target.closest('#' + resizeId)) {
      mode = 'resize'; sx = p.x; sy = p.y; sw = S[side].w; sh = S[side].h;
    } else if (e.target === rotateH || e.target.closest('#' + rotateId)) {
      mode = 'rotate'; startAngle = angle(e); startRot = S[side].rot;
    } else {
      mode = 'drag'; sx = p.x - S[side].x; sy = p.y - S[side].y;
    }
    e.preventDefault(); e.stopPropagation();
  }

  function move(e) {
    if (!mode) return;
    const p = xy(e);
    if (mode === 'drag') {
      S[side].x = p.x - sx;
      S[side].y = p.y - sy;
    } else if (mode === 'resize') {
      const dx  = p.x - sx;
      S[side].w = Math.max(35, sw + dx);
      S[side].h = Math.max(35, sh + dx * (sh / sw));
    } else if (mode === 'rotate') {
      S[side].rot = startRot + (angle(e) - startAngle);
    }
    applyTransform(side);
    if (mode === 'resize') updatePrice();
    e.preventDefault();
  }

  function up() { mode = null; }

  newWrap.addEventListener('mousedown',  down);
  newWrap.addEventListener('touchstart', down, { passive: false });
  document.addEventListener('mousemove',  move);
  document.addEventListener('touchmove',  move, { passive: false });
  document.addEventListener('mouseup',    up);
  document.addEventListener('touchend',   up);
}

// ── FINALIZAR → WhatsApp ─────────────────────
function finalizarPedido() {
  const camisaBase = BASE + TALLAS_DATA[S.talla].precio + CORTES_DATA[S.corte].precio + GANANCIA;
  const dtfF  = S.front.hasDesign ? DTF_PRECIO[S.front.size] : 0;
  const dtfB  = S.back.hasDesign  ? DTF_PRECIO[S.back.size]  : 0;
  const prem  = S.premium ? PREMIUM_PRICE : 0;
  const total = Math.max(camisaBase + dtfF + dtfB + prem, 25.99);

  const sizeL = { small:'Pequeño', medium:'Mediano', large:'Grande' };

  const lines = [
    '🖤 *Pedido NYXAR Personalizado*', '',
    `📦 Camisa ${CORTES_DATA[S.corte].label}`,
    `📏 Talla: ${S.talla}`,
    `🎨 Color: ${COLOR_NAMES[S.color]}`,
    S.front.hasDesign ? `✅ Diseño frente: ${sizeL[S.front.size]} (+$${dtfF})` : '⬜ Sin diseño en frente',
    S.back.hasDesign  ? `✅ Diseño atrás:  ${sizeL[S.back.size]} (+$${dtfB})`  : '⬜ Sin diseño en atrás',
    S.premium         ? `✦ Experiencia premium (+$${PREMIUM_PRICE})` : '',
    '', '🚚 Envío: GRATIS',
    `💰 *Total: $${total.toFixed(2).replace('.00','')}*`,
    '', 'Adjuntaré las imágenes de mi diseño. ¿Cómo continúo?'
  ].filter(Boolean).join('\n');

  // Número de WhatsApp — cámbialo en la línea de abajo
  const WA = '50376925839';
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines)}`, '_blank');
}

// ── TOAST ─────────────────────────────────────
let _tt;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('show'), 2600);
}
