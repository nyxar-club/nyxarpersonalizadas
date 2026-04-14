/* ==========================================
   NYXAR — script.js v3
   Precios: Oversize +$2, Boxy +$3
   Colores: Negro, Blanco, Beige
   DTF: Pequeño $3, Mediano $7, Grande $11
   Precio visible: Camisa (todo incluido) + Tamaño diseño + Envío gratis
   ========================================== */

'use strict';

// ==========================================
// DATOS
// ==========================================

const TALLAS_DATA = {
  XS: { ancho:52, largo:68, hombro:44, manga:20, precio:0  },
  S:  { ancho:54, largo:70, hombro:46, manga:21, precio:0  },
  M:  { ancho:57, largo:73, hombro:48, manga:22, precio:1  },
  L:  { ancho:60, largo:75, hombro:50, manga:23, precio:2  },
  XL: { ancho:63, largo:78, hombro:52, manga:24, precio:3  },
};

const CORTES_DATA = {
  regular:  { label:'Regular',   desc:'Silueta limpia, ajuste estándar ideal para uso diario.',               precio:0, dAncho:0,  dLargo:0,  dHombro:0  },
  oversize: { label:'Oversize',  desc:'Caída relajada, estilo streetwear moderno. +6cm ancho, +4cm largo.',  precio:2, dAncho:6,  dLargo:4,  dHombro:3  },
  boxy:     { label:'Boxy Fit',  desc:'Forma cuadrada estructurada. +5cm ancho, -3cm largo. Look fashion.',  precio:3, dAncho:5,  dLargo:-3, dHombro:2  },
};

// Precio base camisa
const BASE = 12;
// Ganancia fija (nunca se muestra, va incluida en "Camisa")
const GANANCIA = 9;
// Premium
const PREMIUM_PRICE = 2.99;

// DTF: precio según tamaño elegido
const DTF_PRECIO = { small:3, medium:7, large:11 };
// DTF: ancho en px sobre el canvas según tamaño
const DTF_PX = { small:65, medium:115, large:170 };

// Colores disponibles (sin gris)
const COLOR_NAMES = { black:'Negro', white:'Blanco', beige:'Beige' };

// Mapa de assets — convención: assets/shirt-{corte}-{color}-{lado}.png
const ASSET_MAP = {
  regular: {
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

// SVG fallback cuando no carga imagen
const SVG_SHIRT = (side) => `
<svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:155px;height:auto">
  <path d="M58 18L18 56l18 8-6 158h160l-6-158 18-8L142 18l-16 12Q100 38 74 30Z"
    fill="#1a1a2e" stroke="#4b0082" stroke-width="2.5"/>
  ${side === 'front'
    ? '<path d="M74 30Q100 38 126 30L130 54Q100 66 70 54Z" fill="#0d0d1a" stroke="#4b0082" stroke-width="1.5"/>'
    : '<path d="M58 18 Q100 8 142 18" fill="none" stroke="#4b0082" stroke-width="1.5"/>'}
  <line x1="100" y1="${side==='front'?'66':'18'}" x2="100" y2="222" stroke="#4b0082" stroke-width="0.7" opacity="0.12"/>
</svg>`;

// ==========================================
// ESTADO
// ==========================================
const S = {
  talla:   'S',
  corte:   'regular',
  color:   'black',
  premium: false,
  front: { hasDesign:false, size:'medium', location:'center', imgData:null, x:0, y:0, w:115, h:115, rot:0 },
  back:  { hasDesign:false, size:'medium',                    imgData:null, x:0, y:0, w:115, h:115, rot:0 },
};

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  updateShirtImages();
  updateMedidas();
  updatePrice();
  initIntersection();
});

// ==========================================
// SETTERS
// ==========================================
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
  updateCanvasBg(val);
}

function setDtfSize(side, val, btn) {
  S[side].size = val;
  const groupId = side === 'front' ? 'dtfSizeFront' : 'dtfSizeBack';
  activateChip(groupId, btn);
  if (S[side].hasDesign) {
    const ratio = S[side].h / S[side].w;
    S[side].w   = DTF_PX[val];
    S[side].h   = S[side].w * ratio;
    applyDesignTransform(side);
  }
  updatePrice();
}

function setLocation(side, val) {
  S[side].location = val;
  if (S[side].hasDesign) positionByLocation(side);
}

function activateChip(groupId, activeBtn) {
  document.querySelectorAll(`#${groupId} .chip, #${groupId} .chip-xs`).forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

// ==========================================
// MEDIDAS
// ==========================================
function updateMedidas() {
  const t = TALLAS_DATA[S.talla];
  const c = CORTES_DATA[S.corte];
  document.getElementById('mAncho').textContent  = (t.ancho  + c.dAncho)  + 'cm';
  document.getElementById('mLargo').textContent  = (t.largo  + c.dLargo)  + 'cm';
  document.getElementById('mHombro').textContent = (t.hombro + c.dHombro) + 'cm';
  document.getElementById('mManga').textContent  = t.manga + 'cm';
}

// ==========================================
// IMÁGENES
// ==========================================
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
  const canvasEl = document.getElementById(side === 'front' ? 'canvasFront' : 'canvasBack');
  if (canvasEl.querySelector('.svg-fallback')) return;
  const div = document.createElement('div');
  div.className = 'svg-fallback';
  div.innerHTML = SVG_SHIRT(side);
  canvasEl.appendChild(div);
}

function removeSvgFallback(side) {
  const canvasEl = document.getElementById(side === 'front' ? 'canvasFront' : 'canvasBack');
  const fb = canvasEl.querySelector('.svg-fallback');
  if (fb) fb.remove();
}

function updateCanvasBg(color) {
  ['canvasFront','canvasBack'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('white-bg','beige-bg');
    if (color === 'white') el.classList.add('white-bg');
    if (color === 'beige') el.classList.add('beige-bg');
  });
}

// ==========================================
// PRECIO
// Visible: "Camisa" = BASE + talla + corte + GANANCIA
// "Tamaño del diseño" = dtfF + dtfB
// Total = todo + premium (si aplica)
// ==========================================
function updatePrice() {
  const tPrecio  = TALLAS_DATA[S.talla].precio;
  const cPrecio  = CORTES_DATA[S.corte].precio;
  const camisaSubtotal = BASE + tPrecio + cPrecio + GANANCIA;

  const dtfF = S.front.hasDesign ? DTF_PRECIO[S.front.size] : 0;
  const dtfB = S.back.hasDesign  ? DTF_PRECIO[S.back.size]  : 0;
  const totalDiseno = dtfF + dtfB;

  const premium   = S.premium ? PREMIUM_PRICE : 0;
  const rawTotal  = camisaSubtotal + totalDiseno + premium;
  const total     = Math.max(rawTotal, 25.99);

  document.getElementById('pCamisa').textContent  = `$${camisaSubtotal}`;

  const rowDiseno = document.getElementById('pDiseno').parentElement;
  if (totalDiseno > 0) {
    rowDiseno.style.display = '';
    document.getElementById('pDiseno').textContent = `+$${totalDiseno}`;
  } else {
    rowDiseno.style.display = 'none';
  }

  const totalEl = document.getElementById('pTotal');
  totalEl.textContent = `$${total.toFixed(2).replace('.00', '')}`;
  totalEl.classList.remove('total-pop');
  void totalEl.offsetWidth;
  totalEl.classList.add('total-pop');
}

// ==========================================
// PREMIUM
// ==========================================
function togglePremium() {
  S.premium = !S.premium;
  const btn = document.getElementById('btnUpgrade');
  if (S.premium) {
    btn.textContent = '✓ Activo';
    btn.classList.add('active');
    showToast('✦ Paquete Premium activado');
  } else {
    btn.textContent = '+ $2.99';
    btn.classList.remove('active');
  }
  updatePrice();
}

// ==========================================
// UPLOAD DISEÑO
// ==========================================
function uploadDesign(side, event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    S[side].imgData = e.target.result;
    const imgId  = side === 'front' ? 'designFront' : 'designBack';
    const wrapId = side === 'front' ? 'wrapFront' : 'wrapBack';
    const img    = document.getElementById(imgId);
    img.src = e.target.result;
    img.onload = () => {
      const px    = DTF_PX[S[side].size];
      const ratio = img.naturalHeight / img.naturalWidth;
      S[side].w   = px;
      S[side].h   = px * ratio;
      S[side].rot = 0;
      S[side].x   = 0;
      S[side].y   = 0;
      document.getElementById(wrapId).style.display = 'block';
      S[side].hasDesign = true;
      if (side === 'front') positionByLocation('front');
      applyDesignTransform(side);
      initDragResize(side);
      updatePrice();
      showToast(`Diseño ${side === 'front' ? 'frente' : 'atrás'} cargado ✦`);
    };
  };
  reader.readAsDataURL(file);
}

function clearDesign(side) {
  S[side].hasDesign = false;
  S[side].imgData   = null;
  S[side].x = S[side].y = S[side].rot = 0;
  S[side].w = S[side].h = DTF_PX[S[side].size];
  const wrapId  = side === 'front' ? 'wrapFront' : 'wrapBack';
  const inputId = side === 'front' ? 'fileFront'  : 'fileBack';
  document.getElementById(wrapId).style.display  = 'none';
  document.getElementById(inputId).value         = '';
  updatePrice();
  showToast('Diseño eliminado');
}

// ==========================================
// POSICIÓN POR UBICACIÓN (solo frente)
// ==========================================
function positionByLocation(side) {
  if (side !== 'front') return;
  const canvas = document.getElementById('canvasFront');
  const cW = canvas.offsetWidth  || 300;
  const cH = canvas.offsetHeight || 300;
  const loc = S.front.location;
  switch (loc) {
    case 'center': S.front.x = 0;         S.front.y = -cH * 0.04; break;
    case 'left':   S.front.x = -cW * 0.2; S.front.y = -cH * 0.2;
                   S.front.w = DTF_PX[S.front.size] * 0.5; S.front.h = S.front.w; break;
    case 'right':  S.front.x =  cW * 0.2; S.front.y = -cH * 0.2;
                   S.front.w = DTF_PX[S.front.size] * 0.5; S.front.h = S.front.w; break;
    case 'full':   S.front.x = 0; S.front.y = 0;
                   S.front.w = DTF_PX[S.front.size] * 1.45; S.front.h = S.front.w; break;
    default:       S.front.x = 0; S.front.y = 0;
  }
  applyDesignTransform('front');
}

// ==========================================
// TRANSFORM
// ==========================================
function applyDesignTransform(side) {
  const wrapId = side === 'front' ? 'wrapFront' : 'wrapBack';
  const imgId  = side === 'front' ? 'designFront' : 'designBack';
  const wrap   = document.getElementById(wrapId);
  const img    = document.getElementById(imgId);
  const d      = S[side];
  wrap.style.left      = `calc(50% + ${d.x}px)`;
  wrap.style.top       = `calc(50% + ${d.y}px)`;
  wrap.style.transform = `translate(-50%,-50%) rotate(${d.rot}deg)`;
  wrap.style.width     = d.w + 'px';
  img.style.width      = d.w + 'px';
  img.style.height     = d.h + 'px';
}

// ==========================================
// DRAG / RESIZE / ROTATE
// ==========================================
function initDragResize(side) {
  const wrapId   = side === 'front' ? 'wrapFront'   : 'wrapBack';
  const resizeId = side === 'front' ? 'resizeFront'  : 'resizeBack';
  const rotateId = side === 'front' ? 'rotateFront'  : 'rotateBack';
  const wrap     = document.getElementById(wrapId);
  const resizeH  = document.getElementById(resizeId);
  const rotateH  = document.getElementById(rotateId);

  // Evitar listeners duplicados
  const newWrap = wrap.cloneNode(true);
  wrap.parentNode.replaceChild(newWrap, wrap);
  const newResize = newWrap.querySelector(`#${resizeId}`);
  const newRotate = newWrap.querySelector(`#${rotateId}`);

  let mode = null, sx, sy, sw, sh, startRot, startAngle;

  function clientXY(e) {
    return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                     : { x: e.clientX,             y: e.clientY };
  }

  function getAngle(e) {
    const rect = newWrap.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const { x, y } = clientXY(e);
    return Math.atan2(y - cy, x - cx) * (180 / Math.PI);
  }

  function onDown(e) {
    const { x, y } = clientXY(e);
    if (e.target === newResize) {
      mode = 'resize'; sx = x; sy = y; sw = S[side].w; sh = S[side].h;
    } else if (e.target === newRotate) {
      mode = 'rotate'; startAngle = getAngle(e); startRot = S[side].rot;
    } else {
      mode = 'drag'; sx = x - S[side].x; sy = y - S[side].y;
    }
    e.preventDefault(); e.stopPropagation();
  }

  function onMove(e) {
    if (!mode) return;
    const { x, y } = clientXY(e);
    if (mode === 'drag') {
      S[side].x = x - sx;
      S[side].y = y - sy;
    } else if (mode === 'resize') {
      const dx   = x - sx;
      S[side].w  = Math.max(30, sw + dx);
      S[side].h  = Math.max(30, sh + dx * (sh / sw));
    } else if (mode === 'rotate') {
      S[side].rot = startRot + (getAngle(e) - startAngle);
    }
    applyDesignTransform(side);
    if (mode === 'resize') updatePrice();
    e.preventDefault();
  }

  function onUp() { mode = null; }

  newWrap.addEventListener('mousedown',  onDown);
  newWrap.addEventListener('touchstart', onDown, { passive:false });
  document.addEventListener('mousemove',  onMove);
  document.addEventListener('touchmove',  onMove, { passive:false });
  document.addEventListener('mouseup',    onUp);
  document.addEventListener('touchend',   onUp);
}

// ==========================================
// FINALIZAR PEDIDO → WhatsApp
// ==========================================
function finalizarPedido() {
  const tPrecio = TALLAS_DATA[S.talla].precio;
  const cPrecio = CORTES_DATA[S.corte].precio;
  const camisaSubtotal = BASE + tPrecio + cPrecio + GANANCIA;
  const dtfF    = S.front.hasDesign ? DTF_PRECIO[S.front.size] : 0;
  const dtfB    = S.back.hasDesign  ? DTF_PRECIO[S.back.size]  : 0;
  const premium  = S.premium ? PREMIUM_PRICE : 0;
  const rawTotal = camisaSubtotal + dtfF + dtfB + premium;
  const total    = Math.max(rawTotal, 25.99);

  const ubicLabel = { center:'Centro del pecho', left:'Pecho izquierdo', right:'Pecho derecho', full:'Toda la superficie' };
  const sizeLabel = { small:'Pequeño', medium:'Mediano', large:'Grande' };

  const lines = [
    `🖤 *Pedido NYXAR*`,
    ``,
    `📦 Camisa ${CORTES_DATA[S.corte].label}`,
    `📏 Talla: ${S.talla}`,
    `🎨 Color: ${COLOR_NAMES[S.color]}`,
    S.front.hasDesign ? `✅ Diseño frente: ${sizeLabel[S.front.size]} · ${ubicLabel[S.front.location]}` : `⬜ Sin diseño en frente`,
    S.back.hasDesign  ? `✅ Diseño atrás:  ${sizeLabel[S.back.size]}` : `⬜ Sin diseño en atrás`,
    S.premium ? `✦ Paquete Premium (+$2.99)` : '',
    ``,
    `🚚 Envío: GRATIS`,
    `💰 *Total: $${total.toFixed(2).replace('.00','')}*`,
    ``,
    `Quiero confirmar mi pedido. ¿Cómo continúo?`
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
}

// ==========================================
// TOAST
// ==========================================
let _tt;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 2500);
}

// ==========================================
// INTERSECTION OBSERVER
// ==========================================
function initIntersection() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section').forEach(s => obs.observe(s));
}
