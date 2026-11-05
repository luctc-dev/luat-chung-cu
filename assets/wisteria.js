/* Trang /wisteria — theo dõi công việc của Ban quản trị, dành cho cư dân.
   Ứng dụng một trang có định tuyến bằng # (mỗi mục một màn hình, không cuộn dài):
     #tinh-hinh (mặc định) · #viec · #viec-<id> (chi tiết một việc) · #hoi-dap · #van-ban
   Nút Back của trình duyệt quay lại màn hình trước và vị trí cuộn cũ.
   Nạp /wisteria/data.json; nội dung văn bản ở /wisteria/van-ban/NN.html (dựng từ Markdown, không đăng Markdown).
   Dùng chung assets/cite.js: DATA, $, esc, el, rich, openCite, addCites.
   Mã nguồn: tools/wisteria_page/wisteria.js — dựng bằng python3 -I tools/build_wisteria_page.py. */
'use strict';
const SRC = document.currentScript.dataset.src;
let W = null;
const TODAY = new Date(new Date().toDateString());

/* biểu tượng SVG (theo bộ Lucide), không dùng emoji */
const P = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  pause: '<circle cx="12" cy="12" r="10"/><path d="M10 15V9M14 15V9"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  /* nhận diện từng việc */
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
};
const ic = (n, label) => `<svg class="ic" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${P[n] || P.circle}</svg>`;
const ST = { done: 'Đã xong', doing: 'Đang làm', todo: 'Chưa làm', overdue: 'Quá hạn', unknown: 'Chưa rõ', blocked: 'Đang chờ' };
const ST_IC = { done: 'check', doing: 'clock', todo: 'circle', overdue: 'alert', unknown: 'help', blocked: 'pause' };
const WHO = { 'BQT': 'Ban quản trị', 'CĐT': 'Chủ đầu tư', 'UBND xã': 'UBND xã', 'Hội nghị': 'Hội nghị cư dân', 'Cư dân': 'Cư dân', 'Tổ chuyên gia': 'Tổ chuyên gia cư dân' };
const TABS = [['tinh-hinh', 'Tình hình', 'home'], ['viec', 'Việc cần làm', 'list'], ['hoi-dap', 'Hỏi đáp', 'chat'], ['van-ban', 'Văn bản', 'file']];

const fmt = d => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
const fmtShort = d => { const [, m, dd] = d.split('-'); return `${dd}/${m}`; };
const days = d => Math.round((new Date(d) - TODAY) / 864e5);
const docByKey = k => W.docs.find(d => d.key === k);
const taskById = id => W.tasks.find(t => t.id === id);
const pill = s => `<span class="w-pill ${s}">${ic(ST_IC[s])}${ST[s]}</span>`;
const badge = t => `<span class="w-badge tone-${t.tone}">${ic(t.icon)}</span>`;
const num = t => W.tasks.indexOf(t) + 1;
/* mục chưa xong mà đã qua hạn thì coi là quá hạn */
const realStatus = it => (!['done', 'overdue', 'unknown'].includes(it.status) && it.due && days(it.due) < 0) ? 'overdue' : it.status;

/* ((ghi chú kỹ thuật)): không hiện trên trang, chỉ giữ trong attribute data-dev-note cho developer */
const RE_DEV = /\s*\(\((.*?)\)\)/g;
const devNote = n => `<span class="dev-note" data-dev-note="${n}" hidden></span>`;
/* chữ: **đậm**, [[căn cứ]] → ô bấm được (cite.js), {{NN}} → tên văn bản bấm được, ((…)) → attribute ẩn */
function txt(s) {
  return rich(s).replace(RE_DEV, (m, n) => devNote(n)).replace(/\{\{(\d\d)\}\}/g, (m, k) => {
    const d = docByKey(k);
    return d ? `<button class="w-link" data-doc="${k}">${ic('file')}${esc(d.short || d.so_hieu)}</button>` : '';
  });
}
/* tách căn cứ ra khỏi câu chữ: câu đọc trơn, căn cứ để dòng riêng */
const stripCites = s => s.replace(/\s*\[\[[^\]\s]+\]\]/g, '').replace(/\s+([.,;:])/g, '$1');
const noDev = s => s.replace(RE_DEV, '');
const plain = s => esc(noDev(stripCites(s)).replace(/\*\*/g, '').replace(/\{\{\d\d\}\}/g, ''));
const citesOf = s => (s.match(/\[\[[^\]\s]+\]\]/g) || []);
function lawRow(...texts) {
  const cs = [...new Set(texts.filter(Boolean).flatMap(citesOf))];
  return cs.length ? `<div class="w-law"><span>Căn cứ:</span> ${cs.map(c => rich(c)).join(' ')}</div>` : '';
}
function dueHtml(it) {
  const s = realStatus(it);
  if (s === 'done') return it.date ? `<span class="w-date">${fmt(it.date)}</span>` : '';
  if (!it.due) return it.date ? `<span class="w-date">${fmt(it.date)}</span>` : '';
  const n = days(it.due);
  if (n < 0) return `<span class="w-date bad">Hạn ${fmt(it.due)}, đã quá ${-n} ngày</span>`;
  if (n === 0) return `<span class="w-date bad">Hạn hôm nay</span>`;
  return `<span class="w-date">Hạn ${fmt(it.due)}, còn ${n} ngày</span>`;
}
const progress = t => {
  const done = t.items.filter(it => it.status === 'done').length;
  return `<div class="w-prog"><div class="w-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${t.items.length}" aria-valuenow="${done}" aria-label="Số bước đã xong"><i style="width:${Math.round(100 * done / t.items.length)}%"></i></div><span>${done}/${t.items.length} bước xong</span></div>`;
};

/* ---------- Màn hình: Tình hình ---------- */
function viewSituation() {
  const all = W.tasks.flatMap(t => t.items);
  const soon = all.filter(it => it.due && it.status !== 'done' && days(it.due) >= 0)
    .sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
  return `<h2 class="w-h">Tình hình hôm nay</h2>
    <p class="w-lead">Theo các văn bản đến ngày ${fmt(W.site.updated)}. Chọn một việc để xem chi tiết.</p>
    <ul class="w-tasklist">${W.tasks.map(t => `<li><a class="w-trow tone-${t.tone}" href="#viec-${t.id}">
      ${badge(t)}<span class="body"><span class="k">Việc ${num(t)}</span><span class="t">${esc(t.title)}</span>
      <span class="h">${plain(t.headline)}</span>${pill(t.status)}</span><span class="go">${ic('right')}</span></a></li>`).join('')}</ul>
    ${soon.length ? `<div class="w-card w-cal"><h3>${ic('cal')}Sắp tới</h3><ul>${soon.map(it => {
      const t = W.tasks.find(x => x.items.includes(it));
      return `<li><time>${fmtShort(it.due)}</time><a href="#viec-${t.id}"><span>${plain(it.text)}</span>
        <span class="far">${days(it.due) === 0 ? 'Hôm nay' : `Còn ${days(it.due)} ngày`} · ${esc(WHO[it.who] || it.who)}</span></a></li>`;
    }).join('')}</ul></div>` : ''}`;
}

/* ---------- Màn hình: danh sách việc ---------- */
function viewTasks() {
  return `<h2 class="w-h">Việc cần làm</h2>
    <p class="w-lead">${W.tasks.length} việc, việc gấp ở trên. Chọn một việc để xem từng bước, ai làm, hạn và văn bản mẫu.</p>
    <ul class="w-cards">${W.tasks.map(t => {
      const nx = t.items[t.next];
      return `<li><a class="w-tcard tone-${t.tone}" href="#viec-${t.id}">
        <span class="top">${badge(t)}<span><span class="k">Việc ${num(t)}</span><span class="t">${esc(t.title)}</span></span></span>
        ${pill(t.status)}<span class="h">${plain(t.headline)}</span>${progress(t)}
        ${nx ? `<span class="nx"><b>Bước tiếp theo:</b> ${plain(nx.text)}</span>` : ''}
        <span class="open">Xem chi tiết ${ic('right')}</span></a></li>`;
    }).join('')}</ul>`;
}

/* ---------- Màn hình: chi tiết một việc ---------- */
function stepLi(it, i, t) {
  const s = realStatus(it), isNext = i === t.next;
  if (s === 'done') {   // bước đã xong: gọn một dòng, bấm để xem văn bản và căn cứ
    const more = (it.note ? `<p class="note">${txt(stripCites(it.note))}</p>` : '') +
      ((it.docs || []).length ? `<div class="docs">${it.docs.map(k => txt(`{{${k}}}`)).join('')}</div>` : '') + lawRow(it.text, it.cite, it.note);
    return `<li class="st-done"><span class="n" aria-hidden="true">${ic('check')}</span>
      <details class="c"><summary><span class="txt">${txt(stripCites(it.text))}</span>
        <span class="w-row"><span class="w-who">${ic('user')}${esc(WHO[it.who] || it.who)}</span><span class="w-date">Đã xong${it.date ? ' ' + fmt(it.date) : ''}</span>${more ? `<span class="more">Chi tiết ${ic('chev')}</span>` : ''}</span></summary>${more}</details></li>`;
  }
  return `<li class="st-${s}${isNext ? ' is-next' : ''}">
    <span class="n" aria-hidden="true">${s === 'done' ? ic('check') : i + 1}</span>
    <div class="c">${isNext ? '<span class="w-nexttag">Bước tiếp theo</span>' : ''}
      <div class="txt">${txt(stripCites(it.text))}</div>
      <div class="w-row"><span class="w-who">${ic('user')}${esc(WHO[it.who] || it.who)}</span>${pill(s)}${dueHtml(it)}</div>
      ${it.note ? `<p class="note">${txt(stripCites(it.note))}</p>` : ''}
      ${(it.docs || []).length ? `<div class="docs">${it.docs.map(k => txt(`{{${k}}}`)).join('')}</div>` : ''}
      ${it.template ? `<button class="w-btn${isNext ? ' primary' : ''}" data-tpl="${esc(it.template)}">${ic('pen')}Soạn văn bản mẫu</button>` : ''}
      ${lawRow(it.text, it.cite, it.note)}</div></li>`;
}
function viewTask(t) {
  const i = W.tasks.indexOf(t), prev = W.tasks[i - 1], next = W.tasks[i + 1];
  const docs = W.docs.filter(d => d.tasks.includes(t.id)).reverse();
  const flows = [t.case, t.related_case].filter(Boolean);
  return `<article class="w-detail tone-${t.tone}">
    <header class="w-dhead">${badge(t)}<div><span class="k">Việc ${num(t)}/${W.tasks.length}</span><h2>${esc(t.title)}</h2>${pill(t.status)}</div></header>
    <p class="w-sum">${txt(stripCites(t.summary))}</p>${progress(t)}
    ${lawRow(t.summary)}
    <section class="w-block"><h3>Các bước</h3><ol class="w-stepper">${t.items.map((it, k) => stepLi(it, k, t)).join('')}</ol></section>
    ${t.analysis ? `<details class="w-block w-why"><summary>${esc(t.analysis_title)} ${ic('chev')}</summary><div class="in">${t.analysis.map(p => `<p>${txt(p)}</p>`).join('')}</div></details>` : ''}
    ${t.templates.length ? `<section class="w-block"><h3>Văn bản mẫu</h3>${t.templates.map(id => `<button class="w-btn" data-tpl="${esc(id)}">${ic('pen')}${esc(W.templates[id].title)}</button>`).join('')}</section>` : ''}
    ${docs.length ? `<section class="w-block"><h3>Văn bản liên quan</h3><ul class="w-docs w-card">${docs.map(docRow).join('')}</ul></section>` : ''}
    ${flows.length ? `<section class="w-block"><h3>Thủ tục theo luật</h3>${flows.map(c => `<a class="w-btn" href="/#${c}">${ic('map')}Sơ đồ: ${esc(W.cases[c])}</a>`).join('')}</section>` : ''}
    <nav class="w-pager" aria-label="Chuyển việc">
      ${prev ? `<a href="#viec-${prev.id}">${ic('left')}<span><small>Việc ${num(prev)}</small>${esc(prev.title)}</span></a>` : '<span></span>'}
      ${next ? `<a class="nx" href="#viec-${next.id}"><span><small>Việc ${num(next)}</small>${esc(next.title)}</span>${ic('right')}</a>` : '<span></span>'}
    </nav>
  </article>`;
}

/* ---------- Màn hình: Hỏi đáp ---------- */
function viewFaq() {
  const people = () => `<ul class="w-people">${W.building.bqt.members.map(m => `<li><b>${esc(m.name)} · ${esc(m.role)}</b><span>${esc(m.duty)}</span></li>`).join('')}</ul>`;
  return `<h2 class="w-h">Hỏi đáp</h2><p class="w-lead">Câu hỏi cư dân hay hỏi về toà nhà. Bấm câu hỏi để xem trả lời.</p>
    <div class="w-faq">${W.faq.map(f => `<details class="w-card"><summary>${esc(f.q)}${ic('chev')}</summary>
      <div class="ans">${txt(f.a)}${f.members ? people() : ''}</div></details>`).join('')}</div>`;
}

/* ---------- Màn hình: Văn bản ---------- */
const docRow = d => `<li><button data-doc="${d.key}"><time>${fmt(d.date)}</time><span class="t">${esc(d.short)}</span><span class="go">${ic('right')}</span>
  <span class="d">${esc(d.dir)} · ${esc(d.loai.split(' (')[0])} ${esc(d.so_hieu)}</span></button></li>`;
function viewDocs() {
  return `<h2 class="w-h">Văn bản</h2>
    <p class="w-lead">${W.docs.length} văn bản của Ban quản trị, UBND xã và Chủ đầu tư, mới nhất ở trên. Bấm để đọc.</p>
    <ul class="w-docs w-card">${[...W.docs].reverse().map(docRow).join('')}</ul>`;
}

/* ---------- định tuyến ---------- */
const scrollMemo = {};
let current = '';
function route() {
  const h = decodeURIComponent(location.hash.slice(1)) || 'tinh-hinh';
  if (current) scrollMemo[current] = scrollY;
  let html, tab = h, ctx = '';
  if (h.startsWith('viec-') && taskById(h.slice(5))) {
    const t = taskById(h.slice(5)); tab = 'viec'; html = viewTask(t);
    ctx = `<div class="w-ctx tone-${t.tone}"><a href="#viec" class="back" aria-label="Về danh sách việc">${ic('left')}</a>${badge(t)}<span class="t"><small>Việc ${num(t)}/${W.tasks.length}</small>${esc(t.title)}</span>${pill(t.status)}</div>`;
  } else if (h === 'viec') html = viewTasks();
  else if (h === 'hoi-dap') html = viewFaq();
  else if (h === 'van-ban') html = viewDocs();
  else { tab = 'tinh-hinh'; html = viewSituation(); }
  $('#app').innerHTML = `<div class="w-view" data-view="${esc(h)}">${html}</div>`;
  $('#ctx').innerHTML = ctx;
  watchHead();
  document.querySelectorAll('.w-tabs a').forEach(a => a.toggleAttribute('aria-current', a.dataset.tab === tab));
  document.title = (h.startsWith('viec-') && taskById(h.slice(5)) ? taskById(h.slice(5)).title + ' · ' : '') + W.site.title;
  /* về đầu màn hình mới; quay lại (Back) thì trả về vị trí cuộn cũ */
  const back = scrollMemo[h] !== undefined && navType === 'pop';
  window.scrollTo(0, back ? scrollMemo[h] : 0);
  current = h; navType = 'pop';
}
let navType = 'pop';
/* thanh ngữ cảnh (tên việc đang xem) chỉ hiện khi phần đầu của việc đã cuộn khuất */
let headObs = null;
function watchHead() {
  if (headObs) headObs.disconnect();
  const head = $('.w-dhead'), bar = $('.w-ctx');
  if (!head || !bar) return;
  bar.hidden = true;
  const top = () => $('header.top').getBoundingClientRect().bottom;
  headObs = new IntersectionObserver(([e]) => { bar.hidden = e.isIntersecting || e.boundingClientRect.top > top(); },
    { rootMargin: `-${Math.round($('header.top').offsetHeight)}px 0px 0px 0px` });
  headObs.observe(head);
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (a) navType = 'push';
  const d = e.target.closest('[data-doc]'); if (d) { openDoc(d.dataset.doc); return; }
  const t = e.target.closest('[data-tpl]'); if (t) openTpl(t.dataset.tpl);
});
window.addEventListener('hashchange', route);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* ---------- hộp thoại ---------- */
function showDialog(title, html) {
  $('#dlgTitle').innerHTML = title;
  $('#dlgBody').innerHTML = html;
  const d = $('#dlg'); if (!d.open) d.showModal();
  $('#dlgBody').scrollTop = 0;
}
async function openDoc(k) {
  const d = docByKey(k); if (!d) return;
  showDialog(`${esc(d.short)}<span class="doc">${esc(d.loai.split(' (')[0])} số ${esc(d.so_hieu)}, ngày ${fmt(d.date)}</span>`, '<p>Đang tải…</p>');
  try {
    const r = await fetch(`/wisteria/van-ban/${k}.html`);
    if (!r.ok) throw new Error(r.status);
    $('#dlgBody').innerHTML = `<p class="w-dmeta">${esc(d.dir)}</p><p class="w-mean"><b>Nội dung chính:</b> ${txt(stripCites(d.meaning))}</p>
      <div class="w-doc">${await r.text()}</div>
      <p class="w-note-ocr">Bản chép lại từ văn bản giấy để dễ đọc; có thể còn lỗi chính tả nhỏ. Thông tin cá nhân (số căn cước, số điện thoại) đã được ẩn.</p>`;
  } catch (e) {
    $('#dlgBody').innerHTML = '<p>Không tải được văn bản. Kiểm tra kết nối mạng rồi thử lại.</p>';
  }
}
const plainTpl = s => s.replace(/\*\*(.+?)\*\*/g, '$1');
function openTpl(id) {
  const t = W.templates[id]; if (!t) return;
  showDialog(`Văn bản mẫu<span class="doc">${esc(t.title)}</span>`,
    `<p class="w-hint">Gửi: <b>${esc(WHO[t.to] || t.to)}</b>. Điền các chỗ trong ngoặc vuông [ ] rồi in, ký, đóng dấu. Mẫu chưa được luật sư xem.</p>
     <div><button class="w-btn primary" id="tplDoc">${ic('down')}Tải về để mở bằng Word</button><button class="w-btn" id="tplCopy">${ic('copy')}<span>Sao chép chữ</span></button></div>
     <pre class="w-tpl">${esc(plainTpl(t.text))}</pre>
     ${t.cites.length ? `<p class="w-hint">Bấm để đọc điều luật dùng trong mẫu: ${t.cites.map(c => rich(`[[${c}]]`)).join(' ')}</p>` : ''}`);
  $('#tplCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(plainTpl(t.text)); $('#tplCopy').lastChild.textContent = 'Đã sao chép'; }
    catch (e) { $('#tplCopy').lastChild.textContent = 'Không sao chép được, hãy bôi đen để chép'; }
  };
  $('#tplDoc').onclick = () => {
    const body = t.text.split('\n').map(l => `<p>${esc(l).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') || '&nbsp;'}</p>`).join('');
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:'Times New Roman';font-size:13pt;line-height:1.4}p{margin:0 0 4pt}</style></head><body>${body}</body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿', html], { type: 'application/msword' }));
    a.download = `${id}.doc`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
}

/* ---------- khởi động ---------- */
(async () => {
  try {
    const r = await fetch(SRC); if (!r.ok) throw new Error(r.status);
    W = await r.json();
    addCites(W);
    $('.w-tabs').innerHTML = TABS.map(([id, label, icon]) => `<a href="#${id}" data-tab="${id}">${ic(icon)}<span>${label}</span></a>`).join('');
    route();
  } catch (e) {
    console.error(e);
    $('#app').insertAdjacentHTML('afterbegin', '<p class="w-card" style="padding:14px">Không tải được dữ liệu. Tải lại trang để thử lại.</p>');
  }
})();
