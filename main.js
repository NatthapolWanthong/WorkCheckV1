// main.js (แก้ไข: resolve path ให้ถูกต้องก่อน import/inject)
'use strict';

/*
  main.fixed.js
  - More robust page script loader for the attendance app
  - Features:
    * Flexible pageScriptMap lookup (handles leading slashes, filename-only, last-2 segments)
    * Robust dynamic import with cache-bust in dev
    * Reliable fallback loader that imports the module inside an inline wrapper and attaches it to window
    * Better cleanup and debug logging
*/

const pageScriptMap = {
  'page/Attendance/Attendance.php': { src: 'page/Attendance/Attendance.js', module: true },
  'page/Report/Report.php':         { src: 'page/Report/Report.js', module: true },
  'page/History/History.php':       { src: 'page/History/History.js', module: true }
};

let currentPage = null;
let currentModule = null;

function destroyBootstrapTables($container) {
  $container.find('[data-toggle="table"]').each(function () {
    try { const $t = $(this); if ($t.data('bootstrap.table')) $t.bootstrapTable('destroy'); } catch (e) { console.warn(e); }
  });
}
function destroyFlatpickrs($container) {
  $container.find('input,textarea').each(function () { try { if (this._flatpickr) this._flatpickr.destroy(); } catch(e){console.warn(e);} });
}
function cleanupPageContent() {
  const $c = $('#pageContent');
  destroyBootstrapTables($c);
  destroyFlatpickrs($c);
  try { $c.find('*').off(); } catch(e){ console.warn(e); }
  document.querySelectorAll('script[data-dyn-script]').forEach(s => s.remove());
}

// Improved fallback: inline wrapper module that dynamic-imports the real module and attaches it to window
function injectModuleScriptWithOnload(resolvedUrl, globalName) {
  return new Promise((resolve, reject) => {
    try {
      const cacheBusted = resolvedUrl + (resolvedUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      const wrapper = document.createElement('script');
      wrapper.type = 'module';
      // the wrapper imports the real module and exposes it on window[globalName]
      wrapper.textContent = `
        import('${cacheBusted}')
          .then(m => {
            try { window['${globalName}'] = m; }
            catch(e) { console.error('attach global failed', e); }
            if (m && typeof m.init === 'function') {
              try { m.init(); }
              catch(e){ console.error('module.init() error', e); }
            }
          })
          .catch(e => { console.error('wrapper import failed', e); });
      `;
      wrapper.setAttribute('data-dyn-script', resolvedUrl);

      // append and wait a little for import to happen. We cannot reliably trap the internal import promise,
      // so we resolve after a short delay and return whatever was attached to window[globalName]
      wrapper.onload = () => setTimeout(() => {
        const m = window[globalName];
        if (m) return resolve(m);
        // if not attached, still resolve with null so caller can handle
        return resolve(null);
      }, 60);
      wrapper.onerror = () => reject(new Error('Wrapper script injection error: ' + resolvedUrl));

      document.body.appendChild(wrapper);
    } catch (err) { reject(err); }
  });
}

// Helper: try several strategies to resolve pageScriptMap entry for a given url
function resolvePageEntry(url) {
  if (!url) return null;
  // exact
  let entry = pageScriptMap[url];
  if (entry) return entry;

  // trimmed leading slash
  if (url.startsWith('/')) {
    const trimmed = url.slice(1);
    entry = pageScriptMap[trimmed];
    if (entry) return entry;
  }

  // match by filename
  const filename = url.split('/').pop();
  for (const k of Object.keys(pageScriptMap)) {
    if (k.endsWith(filename)) { entry = pageScriptMap[k]; break; }
  }
  if (entry) return entry;

  // match by last two segments
  const parts = url.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const last2 = parts.slice(-2).join('/');
    for (const k of Object.keys(pageScriptMap)) {
      if (k.endsWith(last2)) { entry = pageScriptMap[k]; break; }
    }
  }
  return entry || null;
}

async function loadPage(url, $link) {
  if (!url) return;

  if (url === currentPage) {
    const $existingTable = $('#pageContent').find('[data-toggle="table"]');
    if ($existingTable.length && $existingTable.data('bootstrap.table')) {
      try { $existingTable.bootstrapTable('refresh', { silent: true }); return; }
      catch (e) { console.warn('refresh failed, will reload', e); }
    }
  }

  if (currentModule && typeof currentModule.destroy === 'function') {
    try { await currentModule.destroy(); } catch (e) { console.warn('module destroy error', e); }
    currentModule = null;
  }

  cleanupPageContent();

  $('#pageContent').load(url, async function (resp, status) {
    if (status === 'error') {
      $('#pageContent').html("<div class='alert alert-danger'>โหลดเนื้อหาไม่สำเร็จ</div>");
      return;
    }

    const entry = resolvePageEntry(url);
    console.debug('main.loadPage: resolved entry for', url, entry ? entry.src : '(not found)');

    if (entry && entry.module && entry.src) {
      // RESOLVE CORRECT URL RELATIVE TO current document
      let resolvedUrl;
      try { resolvedUrl = new URL(entry.src, window.location.href).href; } catch (e) { resolvedUrl = entry.src; }
      console.debug('Resolved module URL for', entry.src, '=>', resolvedUrl);

      // try dynamic import first
      try {
        const mod = await import(resolvedUrl + `?t=${Date.now()}`);
        currentModule = mod;
        if (mod && typeof mod.init === 'function') {
          await mod.init();
        } else {
          console.warn('imported module has no init() export:', resolvedUrl);
        }
      } catch (err) {
        console.warn('dynamic import failed, trying script-inject fallback:', err);
        // fallback global name heuristic: basename + 'Module' e.g. Attendance -> AttendanceModule
        const matches = resolvedUrl.match(/\/([^\/\?#]+)\.js(?:[?#]|$)/);
        const base = matches ? matches[1] : 'Page';
        const globalName = base + 'Module';
        try {
          const modGlobal = await injectModuleScriptWithOnload(resolvedUrl, globalName);
          currentModule = modGlobal || window[globalName] || null;
          if (currentModule && typeof currentModule.init === 'function') {
            // init was probably already called by wrapper, but if not, call it
            try { await currentModule.init(); } catch(e){ console.warn('init after fallback failed', e); }
          }
        } catch (err2) {
          console.error('fallback script injection failed:', err2);
          $('#pageContent').prepend("<div class='alert alert-danger'>โหลดสคริปต์หน้านี้ไม่สำเร็จ</div>");
        }
      }

    } else if (entry && entry.src) {
      // legacy: inject non-module script (resolve path)
      let resolved = entry.src;
      try { resolved = new URL(entry.src, window.location.href).href; } catch(e){}
      const s = document.createElement('script');
      s.src = resolved;
      s.setAttribute('data-dyn-script', resolved);
      document.body.appendChild(s);
    }

    currentPage = url;
    window.scrollTo({ top: 0, behavior: 'instant' });
  });

  $('.header-center .nav-link').removeClass('active link-secondary').addClass('link-dark');
  if ($link && $link.length) $link.addClass('active link-secondary').removeClass('link-dark');
}

// debug: log data-page when nav clicked
$(document).on('click', '.header-center .nav-link', function (e) {
  e.preventDefault();
  const url = $(this).data('page');
  console.debug('nav click -> data-page:', url, 'text:', $(this).text());
  loadPage(url, $(this));
});

$(function () {
  const $first = $('.header-center .nav-link').first();
  if ($first.length) {
    console.debug('initial load ->', $first.data('page'));
    loadPage($first.data('page'), $first);
  }
});
