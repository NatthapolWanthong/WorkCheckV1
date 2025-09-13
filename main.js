// main.js

'use strict';

// Map page URLs to their scripts
const pageScriptMap = {
  'page/Attendance/Attendance.php': { src: 'page/Attendance/Attendance.js', module: true },
  'page/Report/Report.php':         { src: 'page/Report/Report.js', module: true },
  'page/History/History.php':       { src: 'page/History/History.js', module: true }
};

let currentPage = null;
let currentModule = null;

// --- Helpers ---

function resolvePageEntry(url) {
  if (!url) return null;
  if (pageScriptMap[url]) return pageScriptMap[url];
  if (url.startsWith('/')) {
    const t = url.slice(1);
    if (pageScriptMap[t]) return pageScriptMap[t];
  }
  const filename = url.split('/').pop();
  for (const k in pageScriptMap) {
    if (k.endsWith(filename)) return pageScriptMap[k];
  }
  const parts = url.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const last2 = parts.slice(-2).join('/');
    for (const k in pageScriptMap) {
      if (k.endsWith(last2)) return pageScriptMap[k];
    }
  }
  return null;
}

function resolveUrlRelative(src) {
  try { return new URL(src, window.location.href).href; }
  catch (e) { return src; }
}

// --- Cleanup before loading new page ---

function destroyBootstrapTables($container) {
  $container.find('[data-toggle="table"]').each(function () {
    try {
      const $t = $(this);
      if ($t.data('bootstrap.table')) $t.bootstrapTable('destroy');
    } catch (e) { console.warn('destroyBootstrapTables:', e); }
  });
}

function destroyFlatpickrs($container) {
  $container.find('input,textarea').each(function () {
    try { if (this._flatpickr) this._flatpickr.destroy(); } catch (e) { console.warn('destroyFlatpickrs:', e); }
  });
}

function cleanupPageContent() {
  const $c = $('#pageContent');
  destroyBootstrapTables($c);
  destroyFlatpickrs($c);
  try { $c.find('*').off(); } catch (e) { console.warn('cleanup off', e); }
  document.querySelectorAll('script[data-dyn-script]').forEach(s => s.remove());
}

// --- Load script for a page entry ---

function loadScriptForEntry(entry) {
  return new Promise(function (resolve) {
    if (!entry || !entry.src) return resolve(null);

    const resolved = resolveUrlRelative(entry.src);
    const cacheBusted = resolved + (resolved.includes('?') ? '&' : '?') + 't=' + Date.now();

    if (entry.module) {
      import(cacheBusted).then(mod => {
        try { if (mod && typeof mod.init === 'function') mod.init(); } catch (e) { console.warn('module.init error', e); }
        resolve(mod || null);
      }).catch(err => {
        console.warn('dynamic import failed, fallback to inject:', err);
        fallbackInjectScript(resolved).then(mod => resolve(mod));
      });
      return;
    }

    const s = document.createElement('script');
    s.src = cacheBusted;
    s.setAttribute('data-dyn-script', resolved);
    s.onload = function () { resolve(null); };
    s.onerror = function () {
      console.error('script load failed:', resolved);
      resolve(null);
    };
    document.body.appendChild(s);
  });
}

// Fallback: inject a wrapper module that imports the real script and attaches it to window
function fallbackInjectScript(resolvedUrl) {
  return new Promise(function (resolve) {
    const baseNameMatch = resolvedUrl.match(/\/([^\/\?#]+)\.js(?:[?#]|$)/);
    const base = baseNameMatch ? baseNameMatch[1] : 'Page';
    const globalName = base + 'Module';

    const cacheBusted = resolvedUrl + (resolvedUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    const wrapper = document.createElement('script');
    wrapper.type = 'module';
    wrapper.setAttribute('data-dyn-script', resolvedUrl);
    wrapper.textContent = `
      import('${cacheBusted}')
        .then(m => { try { window['${globalName}'] = m; } catch(e) { console.error(e); } })
        .catch(e => console.error('wrapper import failed', e));
    `;
    document.body.appendChild(wrapper);

    const start = Date.now();
    (function poll() {
      const obj = window[globalName];
      if (obj) return resolve(obj);
      if (Date.now() - start > 2000) return resolve(null);
      setTimeout(poll, 80);
    })();
  });
}

// --- Main function: load page and its script ---

function loadPage(url, $link) {
  if (!url) return;

  // If already on this page, try to refresh table
  if (url === currentPage) {
    const $existingTable = $('#pageContent').find('[data-toggle="table"]');
    if ($existingTable.length && $existingTable.data('bootstrap.table')) {
      try { $existingTable.bootstrapTable('refresh', { silent: true }); return; }
      catch (e) { console.warn('refresh failed, will reload', e); }
    }
  }

  // Destroy previous module if needed
  if (currentModule && typeof currentModule.destroy === 'function') {
    try { currentModule.destroy(); } catch (e) { console.warn('module destroy error', e); }
    currentModule = null;
  }

  cleanupPageContent();

  $('#pageContent').load(url, function (resp, status) {
    if (status === 'error') {
      $('#pageContent').html("<div class='alert alert-danger'>Failed to load content</div>");
      return;
    }

    const entry = resolvePageEntry(url);
    console.debug('loadPage: entry ->', entry ? entry.src : '(none)');

    if (entry && entry.src) {
      loadScriptForEntry(entry).then(mod => {
        currentModule = mod || (function () {
          const mNameMatch = (entry.src || '').match(/\/([^\/\?#]+)\.js(?:[?#]|$)/);
          const base = mNameMatch ? mNameMatch[1] : null;
          if (base) return window[base + 'Module'] || null;
          return null;
        })();

        if (currentModule && typeof currentModule.init === 'function') {
          try { currentModule.init(); } catch (e) { console.warn('init failed', e); }
        }
      }).catch(err => {
        console.error('loadScriptForEntry failed', err);
        $('#pageContent').prepend("<div class='alert alert-danger'>Failed to load page script</div>");
      });
    }

    currentPage = url;
    window.scrollTo(0, 0);
  });

  // Update nav link styles
  $('.header-center .nav-link').removeClass('active link-secondary').addClass('link-dark');
  if ($link && $link.length) $link.addClass('active link-secondary').removeClass('link-dark');
}

// --- Handle nav link clicks ---

$(document).on('click', '.header-center .nav-link', function (e) {
  e.preventDefault();
  const url = $(this).data('page');
  console.debug('nav click ->', url, $(this).text());
  loadPage(url, $(this));
});

// --- Initial page load (first menu item) ---

$(function () {
  const $first = $('.header-center .nav-link').first();
  if ($first.length) {
    console.debug('initial load ->', $first.data('page'));
    loadPage($first.data('page'), $first);
  }
});
