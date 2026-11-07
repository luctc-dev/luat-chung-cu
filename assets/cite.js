/* Phần dùng chung giữa các trang: kho căn cứ (DATA.cites/articles/sources), chip căn cứ [[mã]],
   hộp thoại nguyên văn điều luật. Nạp trước app.js / wisteria.js.
   Mã nguồn: tools/flow_page/cite.js — dựng bằng python3 -I tools/build_flow_page.py. */
'use strict';
const DATA = { cites: {}, articles: {}, sources: {}, terms: {} };
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
function addCites(c) { for (const k of ['cites', 'articles', 'sources', 'terms']) Object.assign(DATA[k], c[k] || {}); }

function rich(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // {{t:id|nhãn}} → liên kết mở hộp thoại giải thích thuật ngữ (DATA.terms)
    .replace(/\{\{t:([a-z0-9-]+)\|([^{}|]+)\}\}/g, (m, id, label) =>
      DATA.terms[id] ? `<a href="#" role="button" class="term" data-term="${id}" title="Xem giải thích chi tiết">${label}</a>` : label)
    .replace(/\[\[([^\]\s]+)\]\]([.,;:])?/g, (m, code, punct) => {
      const c = DATA.cites[code];
      if (!c) return m;
      const chip = `<a href="#" role="button" class="cite" data-cite="${esc(code)}" title="Xem nguyên văn ${esc(c.ref)}, ${esc(c.doc)}">${esc(c.label)}</a>`;
      return punct ? `<span class="nw">${chip}${punct}</span>` : chip;   // dấu câu không rơi xuống dòng riêng
    });
}
/* ---------- hộp thoại căn cứ ---------- */
function lawHtml(text) {
  // tách "1. ", "2.1.1. ", "II. " (mục phụ lục), "a) " thành dòng riêng cho dễ đọc
  const parts = text.split(/(?<!Điều)\s(?=(?:\d{1,2}(?:\.\d{1,2})*[a-z]?\.\s)|(?:[IVX]{1,4}\.\s)|(?:[a-zđ]\)\s))/);
  return parts.map(s => /^[a-zđ]\)\s/.test(s) ? `<p class="pt">${esc(s)}</p>` : `<p>${esc(s)}</p>`).join('');
}
// bỏ dòng "Điều N. Tên điều" ở đầu, vì tiêu đề hộp thoại đã ghi
function body(text, heading) {
  let t = text.replace(/^Điều\s+\d+[a-zđ]?\.\s*/, '');
  if (heading && t.startsWith(heading)) t = t.slice(heading.length).trim();
  return t;
}
/* Hộp thoại đang mở thuật ngữ nào: bấm căn cứ trong thuật ngữ thì có nút quay lại */
let dlgTerm = null;
function backBtn(from) {
  const t = from && DATA.terms[from];
  return t ? `<button class="dlg-back" data-back="${esc(from)}">‹ Quay lại: ${esc(t.title)}</button>` : '';
}
function showDlg() {
  const d = $('#dlg');
  if (!d.open) d.showModal();
  $('#dlgBody').scrollTop = 0;
  d.scrollTop = 0;
}
function openTerm(id, from) {
  const t = DATA.terms[id];
  if (!t) return;
  dlgTerm = id;
  $('#dlgTitle').innerHTML = rich(t.title);
  let h = backBtn(from && from !== id ? from : null);
  if (t.summary) h += `<p class="term-sum">${rich(t.summary)}</p>`;
  h += t.sections.map(s => `<section class="term-sec"><h3>${rich(s.heading)}</h3><ul>${s.points.map(x => `<li>${rich(x)}</li>`).join('')}</ul></section>`).join('');
  h += `<p class="src">Bấm ô căn cứ màu xanh để đọc nguyên văn. Thông tin tham khảo, không thay thế tư vấn của luật sư.</p>`;
  $('#dlgBody').innerHTML = h;
  showDlg();
}
function openCite(code, from) {
  const c = DATA.cites[code];
  if (!c) return;
  dlgTerm = null;
  const ref = c.ref.charAt(0).toUpperCase() + c.ref.slice(1);
  $('#dlgTitle').innerHTML = `${esc(ref)}${c.heading ? '. ' + esc(c.heading) : ''}<span class="doc">${esc(c.doc)}</span>`;
  const st = /^(Còn hiệu lực|Đã hợp nhất)/.test(c.status) ? 'ok' : (c.status ? 'part' : '');
  let h = backBtn(from);
  h += c.status ? `<div><span class="badge ${st}" title="Tình trạng của cả văn bản, không riêng điều khoản này">Văn bản: ${esc(c.status.toLowerCase())}</span></div>` : '';
  h += `<div class="law">${lawHtml(c.level === 'dieu' ? body(c.text, c.heading) : c.text)}</div>`;
  const notes = [...c.notes, ...c.amended.map(a => 'Sửa đổi: ' + a), ...c.footnotes.map(f => 'Ghi chú trong văn bản hợp nhất: ' + f)];
  if (notes.length) h += `<div class="notes"><ul>${notes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  if (c.article && DATA.articles[c.article]) {
    const a = DATA.articles[c.article];
    h += `<details><summary>Xem toàn bộ Điều ${esc(a.dieu)}${a.heading ? '. ' + esc(a.heading) : ''}</summary><div class="law">${lawHtml(body(a.text, a.heading))}</div></details>`;
  }
  const links = DATA.sources[c.src] || [];
  if (links.length) h += `<div class="orig"><div class="orig-h">Văn bản gốc</div>${links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}<span aria-hidden="true"> ↗</span></a>`).join('')}</div>`;
  h += `<p class="src">Nguyên văn lấy từ văn bản pháp luật Việt Nam. Thông tin tham khảo, không thay thế tư vấn của luật sư.</p>`;
  $('#dlgBody').innerHTML = h;
  showDlg();
}

document.addEventListener('click', e => {
  const inDlg = !!e.target.closest('#dlg');
  const b = e.target.closest('.cite');
  if (b) { e.preventDefault(); openCite(b.dataset.cite, inDlg ? dlgTerm : null); return; }
  const t = e.target.closest('.term');
  if (t) { e.preventDefault(); openTerm(t.dataset.term, inDlg ? dlgTerm : null); return; }
  const k = e.target.closest('.dlg-back');
  if (k) openTerm(k.dataset.back);
});
document.addEventListener('DOMContentLoaded', () => {
  $('#dlgClose').onclick = () => $('#dlg').close();
  $('#dlg').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
});
