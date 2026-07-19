/* ============================================================
   Front-End Master Book — script.js
   جميع التفاعلات المشتركة بين صفحات الموقع
   ============================================================ */
(function () {
  'use strict';

  /* ---------- بيانات الجلسات (تُستخدم في الشريط الجانبي والصفحة الرئيسية) ---------- */
  const SESSIONS = [
    { id: '01', emoji: '🌐', title: 'مقدمة إلى HTML وأدوات التطوير', href: 'lesson-01.html', ready: true },
    { id: '02', emoji: '🌐', title: 'HTML المتقدم', href: 'lesson-02.html', ready: true },
    { id: '03', emoji: '🎨', title: 'مقدمة إلى CSS', href: 'lesson-03.html', ready: false },
    { id: '04', emoji: '🧩', title: 'CSS Flexbox', href: 'lesson-04.html', ready: false },
    { id: '05', emoji: '🗂️', title: 'CSS Grid', href: 'lesson-05.html', ready: false },
    { id: '06', emoji: '📱', title: 'التصميم المتجاوب', href: 'lesson-06.html', ready: false },
    { id: '07', emoji: '🎬', title: 'CSS Animations', href: 'lesson-07.html', ready: false },
    { id: '08', emoji: '🏆', title: 'المشروع الشامل', href: 'lesson-08.html', ready: false },
  ];
  window.FEMB_SESSIONS = SESSIONS;

  const STORE_KEY = 'femb_progress_v1';
  const THEME_KEY = 'femb_theme';

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function setDone(id, val) {
    const p = getProgress();
    if (val) p[id] = true; else delete p[id];
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
  }
  window.FEMB_PROGRESS = { get: getProgress, setDone };

  /* ---------- الوضع الليلي / النهاري ---------- */
  function initTheme() {
    let theme = 'light';
    try { theme = localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) {}
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    });
  }

  /* ---------- قائمة الجوال ---------- */
  function initMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }

  /* ---------- الشريط الجانبي (صفحات الدروس) ---------- */
  function initSidebar() {
    const toggleBtn = document.querySelector('.sidebar-toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
    const list = document.querySelector('[data-sidebar-list]');
    if (!list) return;
    const currentId = document.body.getAttribute('data-lesson-id');
    const progress = getProgress();
    let doneCount = 0;
    list.innerHTML = SESSIONS.map(s => {
      const isActive = s.id === currentId;
      const isDone = !!progress[s.id];
      if (isDone) doneCount++;
      const classes = ['side-item'];
      if (isActive) classes.push('active');
      if (!s.ready) classes.push('side-locked');
      if (isDone) classes.push('side-done');
      const inner = `
        <span class="side-emoji">${s.emoji}</span>
        <span class="side-txt"><b>الجلسة ${s.id}</b><small>${s.title}</small></span>
        ${!s.ready ? '<span class="side-lock">🔒</span>' : ''}`;
      return s.ready
        ? `<a class="${classes.join(' ')}" href="${s.href}">${inner}</a>`
        : `<div class="${classes.join(' ')}" title="قريباً">${inner}</div>`;
    }).join('');

    const track = document.querySelector('.sidebar-progress .fill');
    const label = document.querySelector('.sidebar-progress span');
    if (track && label) {
      const pct = Math.round((doneCount / SESSIONS.length) * 100);
      track.style.width = pct + '%';
      label.textContent = `أكملت ${doneCount} من ${SESSIONS.length} جلسات (${pct}%)`;
    }
  }

  /* ---------- زر "أكملت هذا الدرس" ---------- */
  function initCompleteButton() {
    const btn = document.querySelector('[data-complete-btn]');
    if (!btn) return;
    const id = document.body.getAttribute('data-lesson-id');
    const progress = getProgress();
    const render = () => {
      const done = !!getProgress()[id];
      btn.textContent = done ? '✓ تم إكمال هذا الدرس' : 'أكملت هذا الدرس';
      btn.classList.toggle('btn-primary', !done);
      btn.classList.toggle('btn-ghost', done);
    };
    render();
    btn.addEventListener('click', () => {
      const done = !!getProgress()[id];
      setDone(id, !done);
      render();
      initSidebar();
    });
  }

  /* ---------- مُلوِّن الأكواد (Syntax Highlighter) — بدون مكتبات خارجية ---------- */
  const JS_KEYWORDS = new Set(['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','class','extends','super','new','this','typeof','instanceof','in','of','true','false','null','undefined','async','await','try','catch','finally','throw','import','export','default','static','get','set','delete','void','yield','from','as']);

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightJS(code) {
    const tokenRe = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`)|('(?:\\.|[^'\\])*')|("(?:\\.|[^"\\])*")|(\b\d+(?:_\d+)*\.?\d*n?\b)|([A-Za-z_$][\w$]*)/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = tokenRe.exec(code)) !== null) {
      out += escapeHtml(code.slice(last, m.index));
      const [full, comment1, comment2, template, single, double, number, word] = m;
      if (comment1 || comment2) {
        out += `<span class="tok-com">${escapeHtml(full)}</span>`;
      } else if (template || single || double) {
        out += `<span class="tok-str">${escapeHtml(full)}</span>`;
      } else if (number) {
        out += `<span class="tok-num">${escapeHtml(full)}</span>`;
      } else if (word) {
        if (JS_KEYWORDS.has(word)) {
          out += `<span class="tok-kw">${escapeHtml(full)}</span>`;
        } else {
          const nextCh = code.slice(tokenRe.lastIndex, tokenRe.lastIndex + 1);
          out += (nextCh === '(') ? `<span class="tok-fn">${escapeHtml(full)}</span>` : escapeHtml(full);
        }
      } else {
        out += escapeHtml(full);
      }
      last = tokenRe.lastIndex;
    }
    out += escapeHtml(code.slice(last));
    return out;
  }

  function highlightHTML(code) {
    // تلوين مبسّط لِـ HTML: الوسوم بلون الكلمات المفتاحية، والنصوص بين علامات الاقتباس كسلاسل
    return escapeHtml(code).replace(/(&lt;\/?[a-zA-Z0-9!-]+)/g, '<span class="tok-kw">$1</span>')
      .replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="tok-str">$1</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-com">$1</span>');
  }

  function initCodeBlocks() {
    document.querySelectorAll('.code-block').forEach(block => {
      const codeEl = block.querySelector('code');
      if (!codeEl) return;
      const lang = block.getAttribute('data-lang') || 'html';
      const raw = codeEl.textContent;
      if (lang === 'html') {
        codeEl.innerHTML = highlightHTML(raw);
      } else if (lang === 'css') {
        codeEl.innerHTML = highlightCSS(raw);
      } else if (lang === 'javascript') {
        codeEl.innerHTML = highlightJS(raw);
      } else {
        codeEl.innerHTML = escapeHtml(raw);
      }

      const copyBtn = block.querySelector('.copy-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(raw).then(() => {
            const original = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ تم النسخ';
            copyBtn.classList.add('copied');
            showToast('تم نسخ الكود إلى الحافظة');
            setTimeout(() => { copyBtn.innerHTML = original; copyBtn.classList.remove('copied'); }, 1800);
          }).catch(() => showToast('تعذّر النسخ — انسخ يدوياً'));
        });
      }
    });
    initPreviewButtons();
  }

  /* ---------- تلوين CSS (بدون مكتبات خارجية) ---------- */
  function highlightCSS(code) {
    let out = escapeHtml(code);
    out = out.replace(/\/\*[\s\S]*?\*\//g, m => `<span class="tok-com">${m}</span>`);
    out = out.replace(/(&quot;(?:\\.|[^&"\\])*&quot;|&#39;(?:\\.|[^&'\\])*&#39;)/g, m => `<span class="tok-str">${m}</span>`);
    out = out.replace(/#[0-9a-fA-F]{3,8}\b/g, m => `<span class="tok-num">${m}</span>`);
    out = out.replace(/@[a-zA-Z-]+/g, m => `<span class="tok-kw">${m}</span>`);
    out = out.replace(/([a-zA-Z-]+)(\s*:)(?!:)/g, (m, p1, p2) => `<span class="tok-fn">${p1}</span>${p2}`);
    out = out.replace(/([.#]?[a-zA-Z_][\w-]*(?:\s*[,>+~]?\s*[.#:]?[a-zA-Z_][\w-]*)*)(\s*\{)/g, (m, p1, p2) => {
      if (/<span/.test(p1)) return m;
      return `<span class="tok-kw">${p1}</span>${p2}`;
    });
    out = out.replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|fr|deg|s|ms|vmin|vmax)?\b/g, (m, num, unit) => `<span class="tok-num">${num}${unit || ''}</span>`);
    return out;
  }

  /* ---------- المعاينة الحيّة لـ HTML/CSS ---------- */
  function buildPreviewDoc(htmlCode, cssCode) {
    const hasDoc = /<!DOCTYPE/i.test(htmlCode) || /<html[\s>]/i.test(htmlCode);
    if (hasDoc) {
      if (cssCode && /<\/head>/i.test(htmlCode)) return htmlCode.replace(/<\/head>/i, `<style>${cssCode}</style></head>`);
      if (cssCode) return `<style>${cssCode}</style>` + htmlCode;
      return htmlCode;
    }
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
      <style>body{font-family:'IBM Plex Sans Arabic',sans-serif;margin:16px;color:#1a1a1a;line-height:1.7;}
      ${cssCode || ''}</style></head><body>${htmlCode}</body></html>`;
  }

  function initPreviewButtons() {
    document.querySelectorAll('.preview-group').forEach(group => {
      const btn = group.querySelector('.preview-btn');
      const wrap = group.querySelector('.live-preview-wrap');
      const frame = group.querySelector('.live-preview-frame');
      const closeBtn = group.querySelector('.live-preview-close');
      if (!btn || !wrap || !frame) return;
      btn.addEventListener('click', () => {
        const htmlCode = group.querySelector('[data-role="html-code"]')?.textContent || '';
        const cssCode = group.querySelector('[data-role="css-code"]')?.textContent || '';
        frame.srcdoc = buildPreviewDoc(htmlCode, cssCode);
        wrap.classList.add('show');
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      if (closeBtn) closeBtn.addEventListener('click', () => wrap.classList.remove('show'));
    });
  }

  /* ---------- شارة "تم النسخ" ---------- */
  let toastTimer = null;
  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ---------- طرفية البطل المتحركة (Hero Terminal) ---------- */
  function initHeroTerminal() {
    const el = document.querySelector('[data-hero-code]');
    const frame = document.querySelector('[data-hero-frame]');
    if (!el) return;
    const htmlLines = [
      '<div class="card">',
      '  <img src="avatar.jpg" class="avatar">',
      '  <h3>ريم حسن</h3>',
      '  <p>مطوّرة Front-End 🚀</p>',
      '</div>',
    ];
    const cssLines = [
      '.card {',
      '  text-align: center;',
      '  padding: 24px;',
      '  border-radius: 16px;',
      '  background: linear-gradient(135deg,#eef4ff,#fff);',
      '  box-shadow: 0 10px 30px rgba(20,40,80,.12);',
      '}',
      '.avatar {',
      '  width: 64px; height: 64px;',
      '  border-radius: 50%;',
      '}',
    ];
    const full = htmlLines.join('\n') + '\n\n' + cssLines.join('\n');
    const cssOnly = cssLines.join('\n');
    const htmlOnly = htmlLines.join('\n');
    let i = 0;
    const cursor = '<span class="terminal-cursor"></span>';

    function tick() {
      if (i <= full.length) {
        el.innerHTML = highlightHTML(full.slice(0, Math.min(i, htmlOnly.length))) +
          (i > htmlOnly.length ? '\n\n' + highlightCSS(full.slice(htmlOnly.length + 2, i)) : '') + cursor;
        i += 3;
        setTimeout(tick, 16);
      } else {
        if (frame) {
          frame.srcdoc = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>
            body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;
            font-family:'IBM Plex Sans Arabic',sans-serif;background:#fafcff;}
            .avatar{background:#c7d6f5 url() center/cover;}
            h3{margin:12px 0 4px;color:#101826;} p{color:#6b7280;font-size:13px;margin:0;}
            ${cssOnly}</style></head><body>${htmlOnly}</body></html>`;
        }
        setTimeout(() => { i = 0; tick(); }, 3200);
      }
    }
    tick();
  }

  /* ---------- بناء شبكة الدروس في الصفحة الرئيسية ---------- */
  function initLessonsGrid() {
    const grid = document.querySelector('[data-lessons-grid]');
    if (!grid) return;
    const progress = getProgress();
    const topics = {
      '01': 'كيف يعمل الويب • أدوات VS Code • أول صفحة HTML • العناصر الأساسية',
      '02': 'الجداول • النماذج • Semantic HTML • الوسائط',
      '03': 'المحددات • الألوان • الخطوط • نموذج الصندوق (Box Model)',
      '04': 'المحاور • justify-content • align-items • أنماط تخطيط شائعة',
      '05': 'الأعمدة والصفوف • fr وrepeat وminmax • grid-template-areas',
      '06': 'Media Queries • Mobile-First • الوحدات المرنة',
      '07': 'Transitions • Keyframes • Transform',
      '08': 'مشروع شامل يجمع HTML وCSS معاً',
    };
    grid.innerHTML = SESSIONS.map(s => {
      const done = !!progress[s.id];
      const classes = ['lesson-card'];
      if (!s.ready) classes.push('locked');
      if (done) classes.push('done');
      const statusBadge = s.ready
        ? (done ? '<span class="badge-live">تم الإكمال ✓</span>' : '<span class="badge-live">متاح الآن</span>')
        : '<span class="badge-soon">قريباً</span>';
      const cta = s.ready
        ? `<a href="${s.href}" class="btn btn-ghost btn-sm">${done ? 'مراجعة الدرس' : 'ابدأ الدرس'} ←</a>`
        : `<span class="btn btn-ghost btn-sm is-disabled">قريباً</span>`;
      const wrapTag = s.ready ? 'a' : 'div';
      const hrefAttr = s.ready ? `href="${s.href}"` : '';
      return `
      <div class="${classes.join(' ')}">
        <span class="lesson-check">✓</span>
        <div class="lesson-card-top">
          <span class="lesson-emoji">${s.emoji}</span>
          <span class="lesson-num">SESSION ${s.id}</span>
        </div>
        <h3>${s.title}</h3>
        <p class="lesson-tags">${topics[s.id] || ''}</p>
        <div class="lesson-meta">
          <span class="lesson-duration">⏱ 3 ساعات</span>
          ${statusBadge}
        </div>
        ${cta}
      </div>`;
    }).join('');
  }

  /* ---------- تفعيل رابط التنقل النشط ---------- */
  function markActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initSidebar();
    initCompleteButton();
    initCodeBlocks();
    initHeroTerminal();
    initLessonsGrid();
    markActiveNav();

    /* أزرار السابق/التالي المعطّلة لا تتفاعل */
    document.querySelectorAll('.nav-arrow.is-disabled').forEach(a => a.addEventListener('click', e => e.preventDefault()));
  });
})();