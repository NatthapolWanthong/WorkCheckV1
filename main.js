// main.js

'use strict';

// Map page URLs to their scripts and provide a name for each page.
// The name is used to find the corresponding module's destroy/init functions.
const pageMap = {
  'page/Attendance/Attendance.php': {
    script: 'page/Attendance/Attendance.js',
    moduleName: 'AttendanceModule'
  },
  'page/Report/Report.php': {
    script: 'page/Report/Report.js',
    moduleName: 'ReportModule'
  },
  'page/History/History.php': {
    script: 'page/History/History.js',
    moduleName: 'HistoryModule'
  }
};

let currentPageUrl = null;
let currentPageModule = null;

// --- Helper Functions ---

/**
 * Loads a JavaScript module dynamically and returns its exported object.
 * @param {string} src The URL of the script.
 * @returns {Promise<Object|null>}
 */
function loadModule(src) {
  return new Promise((resolve, reject) => {
    // Check for a script with the same src, ensuring it hasn't been added yet.
    if (document.querySelector(`script[src="${src}"]`)) {
        return resolve(null);
    }
    const script = document.createElement('script');
    script.src = src;
    script.type = 'module';
    script.setAttribute('data-loaded-page', src);
    script.onload = () => {
      // Find the module object by checking a globally exposed name if needed.
      const moduleName = Object.values(pageMap).find(p => p.script === src)?.moduleName;
      resolve(moduleName ? window[moduleName] : null);
    };
    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.body.appendChild(script);
  });
}

/**
 * Cleans up the previous page's content, including any attached events or plugins.
 */
function cleanupPreviousPage() {
  const $content = $('#pageContent');
  
  // Call the module's destroy function if it exists.
  if (currentPageModule && typeof currentPageModule.destroy === 'function') {
    try {
      currentPageModule.destroy();
      console.log(`[Nav] Cleaned up module for ${currentPageUrl}`);
    } catch (e) {
      console.warn(`[Nav] Module destroy failed for ${currentPageUrl}`, e);
    }
  }

  // Use jQuery to remove all events from the main content container.
  $content.find('*').off();
  $content.empty();
  
  // Remove dynamically loaded page scripts to prevent memory leaks.
  document.querySelectorAll('script[data-loaded-page]').forEach(s => s.remove());
}

/**
 * Loads a new page and its associated script.
 * @param {string} url The URL of the page to load.
 */
async function loadPage(url) {
  if (!url || currentPageUrl === url) {
    return;
  }

  // Before loading new page, clean up old one.
  cleanupPreviousPage();

  // Show a loading message
  $('#pageContent').html('<div class="text-center text-muted">กำลังโหลด...</div>');

  try {
    const pageEntry = pageMap[url];
    if (!pageEntry) {
      throw new Error('Page not found in map.');
    }

    // Load the HTML content
    const html = await $.get(url);
    $('#pageContent').html(html);

    // Load the corresponding JS module
    const scriptSrc = pageEntry.script;
    const module = await import(`./${scriptSrc}`); // Use dynamic import for a cleaner approach
    currentPageModule = module;

    // Check if the module has an init function and call it
    if (currentPageModule && typeof currentPageModule.init === 'function') {
      currentPageModule.init();
    }

    currentPageUrl = url;
    window.scrollTo(0, 0);

  } catch (err) {
    console.error(`[Nav] Failed to load page: ${url}`, err);
    $('#pageContent').html('<div class="alert alert-danger">ไม่สามารถโหลดเนื้อหาหน้านี้ได้</div>');
    currentPageUrl = null;
    currentPageModule = null;
  }
}

// --- Event Handlers & Initial Load ---

// Handle all navigation clicks
$(document).on('click', '.header-center .nav-link', function (e) {
  e.preventDefault();
  const url = $(this).data('page');
  const isEditing = window.appState && window.appState.editMode; // Check for edit mode
  
  // Guard against navigation while in edit mode
  if (isEditing) {
    if (confirm('ยังไม่ได้บันทึกการเปลี่ยนแปลง ต้องการเปลี่ยนหน้าโดยไม่บันทึกหรือไม่?')) {
      loadPage(url);
      $('.header-center .nav-link').removeClass('active link-secondary').addClass('link-dark');
      $(this).addClass('active link-secondary').removeClass('link-dark');
    }
  } else {
    loadPage(url);
    $('.header-center .nav-link').removeClass('active link-secondary').addClass('link-dark');
    $(this).addClass('active link-secondary').removeClass('link-dark');
  }
});

// Initial page load
$(function () {
  const $firstLink = $('.header-center .nav-link').first();
  if ($firstLink.length) {
    $firstLink.addClass('active link-secondary').removeClass('link-dark');
    loadPage($firstLink.data('page'));
  }
});

// Expose a global object for external communication (optional)
window.pageLoader = {
  loadPage
};