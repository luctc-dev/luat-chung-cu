/* Sơ đồ "Bạn muốn thông tin gì?" — ứng dụng một trang (SPA).
   Lúc mở trang chỉ nạp data/tree.json (danh sách nhánh). Nội dung từng nhánh (các bước, nguyên văn
   điều luật, link văn bản gốc) nằm ở data/cases/<id>.json và chỉ được nạp khi người dùng mở nhánh đó.
   Mã nguồn: tools/flow_page/app.js — dựng bằng python3 -I tools/build_flow_page.py, không sửa bản trong static/. */
'use strict';
/* Dùng chung với các trang khác: assets/cite.js (esc, el, $, rich, openCite, DATA). */
Object.assign(DATA, { root: null, nodes: {} });
const state = { sel: {}, all: false, zoom: 1, failed: false };   // sel: đường dẫn nút → chỉ số lựa chọn
const TREE_URL = document.currentScript.dataset.tree;
const UI_VER = document.currentScript.dataset.ui;   // mã bản giao diện; dữ liệu nhánh ghi cùng mã

/* ---------- nạp dữ liệu ---------- */
const loading = {};          // id nhánh → Promise
const ready = new Set();     // nhánh đã nạp xong
let retryLast = null;

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}
function loadCase(id) {
  if (ready.has(id)) return Promise.resolve();
  const o = DATA.root.options.find(x => x.id === id);
  if (!o) return Promise.reject(new Error('Không có nhánh ' + id));
  return loading[id] || (loading[id] = getJSON(o.file).then(c => {
    // Dữ liệu thuộc bản giao diện khác (trang mở từ trước khi triển khai bản mới): tải lại trang một lần
    if (c.ui && UI_VER && c.ui !== UI_VER) {
      let tried = null;
      try { tried = sessionStorage.getItem('ui-reload'); sessionStorage.setItem('ui-reload', c.ui); } catch (e) { /* bị chặn */ }
      if (tried !== c.ui) { location.reload(); return new Promise(() => {}); }
    }
    for (const k of ['nodes', 'cites', 'articles', 'sources', 'terms']) Object.assign(DATA[k], c[k] || {});
    ready.add(id);
  }).finally(() => { delete loading[id]; }));
}
/* Bảo đảm các nhánh ids đã nạp rồi vẽ; trong lúc chờ thì vẽ ô "Đang tải…" */
async function ensure(ids, focusPath) {
  const run = async () => {
    state.failed = false;
    if (!ids.every(id => ready.has(id))) render();
    try { await Promise.all(ids.map(loadCase)); }
    catch (e) { console.error(e); state.failed = true; }
    render(state.failed ? undefined : focusPath);
  };
  retryLast = run;
  return run();
}
const allIds = () => DATA.root.options.map(o => o.id);

/* ---------- vẽ sơ đồ ---------- */
const resolve = n => (n && n.goto) ? DATA.nodes[n.goto] : n;
const ICON = { step: '›', info: 'i', warn: '!', end: '✓' };

function loadBox() {
  if (!state.failed) return el('<div class="loadbox" role="status">Đang tải nội dung…</div>');
  const b = el('<div class="loadbox err" role="alert">Không tải được nội dung. Kiểm tra kết nối mạng rồi thử lại.<br><button class="btn">Thử lại</button></div>');
  b.querySelector('button').onclick = () => retryLast && retryLast();
  return b;
}

/* Vẽ một chuỗi bắt đầu từ node, path là khoá trạng thái */
let seenGoto = new Set();   // chế độ "tất cả nhánh": bước dùng chung chỉ vẽ một lần
function renderChain(node, path, depth = 0) {
  const wrap = el('<div class="chain"></div>');
  let ref = node, n = resolve(node), p = path, guard = 0;
  if (!n) { wrap.append(loadBox()); return wrap; }   // nhánh chưa nạp xong
  while (n && guard++ < 60) {
    if (state.all && ref && ref.goto) {
      if (seenGoto.has(ref.goto)) {
        const b = el(`<button class="goto-ref">↪ Tiếp tục ở: <strong>${esc(n.title)}</strong></button>`);
        const id = ref.goto;
        b.onclick = () => { const t = document.querySelector(`[data-goto="${CSS.escape(id)}"]`); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); const c = t.matches('.card') ? t : t.querySelector('.card,.diamond'); if (c) { c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); } } };
        wrap.append(b);
        break;
      }
      seenGoto.add(ref.goto);
    }
    const anchor = (ref && ref.goto) ? ` data-goto="${esc(ref.goto)}"` : '';
    if (n.kind === 'question') { const qb = renderQuestion(n, p, depth); if (anchor) qb.firstChild.dataset.goto = ref.goto; wrap.append(qb); break; }
    const c = el(`<article class="card ${n.kind}" data-path="${esc(p)}"${anchor}>
      <h3><span class="ico" aria-hidden="true">${ICON[n.kind] || '›'}</span><span>${rich(n.title)}</span></h3>
      ${n.points ? '<ul>' + n.points.map(x => `<li>${rich(x)}</li>`).join('') + '</ul>' : ''}
    </article>`);
    if (n.jump) {
      const b = el(`<button class="jump">↪ ${esc(n.jump.label)}</button>`);
      b.onclick = () => jumpTo(n.jump.to);
      c.append(b);
    }
    wrap.append(c);
    if (!n.next) break;
    wrap.append(el('<div class="vline arrow" aria-hidden="true"></div>'));
    ref = n.next; n = resolve(n.next); p = p + '>';
  }
  return wrap;
}

function renderQuestion(n, path, depth) {
  const box = el('<div class="chain"></div>');
  const isRoot = path === 'r';
  const q = el(`<div class="q${isRoot ? ' root' : ''}" data-path="${esc(path)}">
     <div class="diamond" role="heading" aria-level="${isRoot ? 2 : 3}"><span>${esc(n.title)}</span></div>
     ${n.note ? `<div class="qnote">${rich(n.note)}</div>` : ''}
   </div>`);
  box.append(q);
  box.append(el('<div class="vline" aria-hidden="true"></div>'));
  const chosen = state.sel[path];

  if (state.all) {
    const row = el('<div class="branches"></div>');
    n.options.forEach((o, i) => {
      const br = el('<div class="branch"></div>');
      br.append(el('<div class="vline" aria-hidden="true"></div>'));
      const e = el(`<button class="edge">${esc(o.label)}</button>`);
      e.onclick = () => { state.all = false; selectOnly(path, i); };
      br.append(e, el('<div class="vline arrow" aria-hidden="true"></div>'), renderChain(o.node, `${path}.${i}`, depth + 1));
      row.append(br);
    });
    box.append(row);
    return box;
  }

  const choices = el(`<div class="choices" role="group" aria-label="${esc(n.title)}"></div>`);
  n.options.forEach((o, i) => {
    const b = el(`<button class="opt" aria-expanded="${chosen === i}"><span class="n">${i + 1}.</span> ${esc(o.label)}</button>`);
    b.onclick = () => {
      if (state.sel[path] === i) { clearBelow(path); delete state.sel[path]; render(`${path}.`); return; }
      clearBelow(path); state.sel[path] = i;
      if (isRoot) ensure([o.id], `${path}.${i}`); else render(`${path}.${i}`);
    };
    choices.append(b);
  });
  box.append(choices);
  if (chosen === undefined) {
    box.append(el(`<div class="hint">${isRoot ? 'Chọn một chủ đề để bắt đầu' : 'Chọn một trường hợp'}</div>`));
  } else {
    box.append(el('<div class="vline arrow" aria-hidden="true"></div>'));
    box.append(renderChain(n.options[chosen].node, `${path}.${chosen}`, depth + 1));
  }
  return box;
}

function clearBelow(path) { for (const k of Object.keys(state.sel)) if (k !== path && k.startsWith(path)) delete state.sel[k]; }
function selectOnly(path, i) { clearBelow(path); state.sel[path] = i; render(`${path}.${i}`); }

/* Đường đang xem: đi từ gốc theo các lựa chọn */
function crumbs() {
  const out = [{ t: DATA.root.title, p: 'r' }];
  let n = DATA.root, p = 'r', g = 0;
  while (n && g++ < 80) {
    if (n.kind === 'question') {
      const i = state.sel[p];
      if (i === undefined) break;
      out.push({ t: n.options[i].label, p: `${p}.${i}` });
      n = resolve(n.options[i].node); p = `${p}.${i}`;
    } else { if (!n.next) break; n = resolve(n.next); p = p + '>'; }
  }
  const nav = $('#crumbs');
  nav.innerHTML = state.all ? '<span>Đang hiện tất cả nhánh. Bấm nhãn nhánh để chỉ xem nhánh đó.</span>' : '<span>Đang xem:</span>';
  if (state.all) { nav.scrollLeft = 0; nav.style.whiteSpace = 'normal'; return; }
  nav.style.whiteSpace = '';
  out.forEach((c, k) => {
    if (k) nav.append(el('<span class="sep" aria-hidden="true">›</span>'));
    const b = el(`<button>${esc(c.t)}</button>`);
    b.onclick = () => scrollToPath(c.p, true);
    nav.append(b);
  });
  nav.scrollLeft = nav.scrollWidth;   // điện thoại: luôn thấy bước cuối
}

function scrollToPath(p, flash) {
  const node = document.querySelector(`[data-path="${CSS.escape(p)}"]`) || document.querySelector(`[data-path^="${CSS.escape(p)}"]`);
  if (!node) return;
  node.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  const card = node.classList.contains('card') ? node : node.querySelector('.card');
  if (flash && card) { card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); }
}

function render(focusPath) {
  const cv = $('#canvas');
  seenGoto = new Set();
  cv.classList.toggle('all', state.all);
  cv.replaceChildren(renderChain(DATA.root, 'r'));
  cv.style.zoom = state.zoom;
  $('#btnAll').setAttribute('aria-pressed', state.all);
  crumbs();
  const top = state.sel['r'];
  const id = top === undefined ? '' : DATA.root.options[top].id;
  if (('#' + id) !== location.hash && !(id === '' && location.hash === '')) {
    try { history.replaceState(null, '', id ? '#' + id : location.pathname + location.search); } catch (e) { /* trang mở dạng data:/sandbox */ }
  }
  if (focusPath) requestAnimationFrame(() => scrollToPath(focusPath, false));
}

function jumpTo(id) {
  const i = DATA.root.options.findIndex(o => o.id === id);
  if (i < 0) return;
  state.all = false; state.sel = { r: i }; ensure([id], `r.${i}`);
}

/* ---------- khởi động ---------- */
function bindUi() {
  $('#btnAll').onclick = () => { state.all = !state.all; if (state.all) ensure(allIds()); else render(); };
  $('#btnReset').onclick = () => { state.all = false; state.sel = {}; state.zoom = 1; render(); scrollTo({ top: 0 }); };
  $('#zoomIn').onclick = () => { state.zoom = Math.min(1.4, +(state.zoom + .1).toFixed(2)); render(); };
  $('#zoomOut').onclick = () => { state.zoom = Math.max(.4, +(state.zoom - .1).toFixed(2)); render(); };
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id) jumpTo(id); });
}

async function start() {
  try {
    DATA.root = (await getJSON(TREE_URL)).root;
  } catch (e) {
    // giữ dàn ý tĩnh trong #canvas, chỉ báo lỗi
    console.error(e);
    $('#crumbs').innerHTML = '<span>Không tải được sơ đồ. Tải lại trang để thử lại.</span>';
    return;
  }
  bindUi();
  const i = DATA.root.options.findIndex(o => o.id === location.hash.slice(1));
  if (i >= 0) { state.sel.r = i; ensure([DATA.root.options[i].id], `r.${i}`); }
  else render();
}
start();
