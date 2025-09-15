// main.js — auto-init permissions + UI toggle (ES module)
// ปรับ DYN_MOCKUSER_PATH และ DEFAULT_API_BASE ถ้าจำเป็น
export let currentUser = null;
export let departmentsList = [];
export let userPermissions = null;

const DYN_MOCKUSER_PATH = './page/MockUser.js'; // ถ้า main.js อยู่ที่ root และ MockUser.js อยู่ที่ /page/MockUser.js
const DEFAULT_API_BASE = '../../connection';    // ปรับตามโครงโปรเจกต์ของคุณ

let _permissionsReadyResolve;
export const permissionsReady = new Promise(resolve => { _permissionsReadyResolve = resolve; });

/* ---------------- utilities ---------------- */
export function parseAllowedIds(raw) {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) return raw.map(String).map(s=>s.trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '') return [];
    if (t === '0') return ['0'];
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const j = JSON.parse(t);
        if (Array.isArray(j)) return j.map(String).map(s=>s.trim()).filter(Boolean);
      } catch (e) {}
    }
    return t.split(',').map(x=>x.trim()).filter(Boolean);
  }
  return String(raw).split(',').map(x=>x.trim()).filter(Boolean);
}
export function canEdit(perms = {}, departments = [], selectedDeptId = '', user = currentUser) {
  if (!perms) return false;
  if (perms.can_edit !== null && perms.can_edit !== undefined) return Number(perms.can_edit) === 1;
  if (!selectedDeptId) selectedDeptId = String(perms.department_id ?? user?.department_id ?? '');
  const deptRow = (departments || []).find(d => String(d.id) === String(selectedDeptId)) || null;
  return !!(deptRow && Number(deptRow.can_edit || 0) === 1);
}
export function canViewHistory(perms = {}, departments = [], selectedDeptId = '', user = currentUser) {
  if (!perms) return false;
  if (perms.can_view_history !== null && perms.can_view_history !== undefined) return Number(perms.can_view_history) === 1;
  if (!selectedDeptId) selectedDeptId = String(perms.department_id ?? user?.department_id ?? '');
  const deptRow = (departments || []).find(d => String(d.id) === String(selectedDeptId)) || null;
  return !!(deptRow && Number(deptRow.can_view_history || 0) === 1);
}

/* ---------------- resolver ---------------- */
function _resolvePermissions(user = null, departments = []) {
  currentUser = user ?? currentUser ?? (typeof window !== 'undefined' ? window.user : null);
  departmentsList = Array.isArray(departments) ? departments : (departments?.departments || []);
  const matched = (departmentsList || []).find(d => String(d.id) === String(currentUser?.department_id)) || null;

  function pick(row, key, def) { return (row && Object.prototype.hasOwnProperty.call(row, key)) ? row[key] : def; }
  const db_department_view = pick(matched, 'department_view', null);
  const db_can_edit = Number(pick(matched, 'can_edit', 0)) || 0;
  const db_can_view_history = Number(pick(matched, 'can_view_history', 0)) || 0;

  const mock_department_view = (currentUser?.department_view !== null && currentUser?.department_view !== undefined) ? currentUser.department_view : null;
  const mock_can_edit = (currentUser?.can_edit !== null && currentUser?.can_edit !== undefined) ? Number(currentUser.can_edit) : null;
  const mock_can_view_history = (currentUser?.can_view_history !== null && currentUser?.can_view_history !== undefined) ? Number(currentUser.can_view_history) : null;

  const resolved_department_view = mock_department_view !== null ? mock_department_view : db_department_view;
  const resolved_can_edit = mock_can_edit !== null ? mock_can_edit : db_can_edit;
  const resolved_can_view_history = mock_can_view_history !== null ? mock_can_view_history : db_can_view_history;

  userPermissions = {
    department_id: matched?.id ?? currentUser?.department_id ?? null,
    department_name: matched?.name ?? null,
    department_view: (resolved_department_view === undefined ? null : resolved_department_view),
    can_edit: (resolved_can_edit === undefined || resolved_can_edit === null) ? 0 : Number(resolved_can_edit),
    can_view_history: (resolved_can_view_history === undefined || resolved_can_view_history === null) ? 0 : Number(resolved_can_view_history),
    _matched_row: matched || null
  };

  // notify
  try { document.dispatchEvent(new CustomEvent('permissions:updated', { detail: { userPermissions, currentUser, departmentsList } })); } catch (e) {}
  return userPermissions;
}

/* ---------------- UI toggle (auto) ---------------- */
function _domQuery(sel) {
  if (typeof $ !== 'undefined') return $(sel);
  const el = document.querySelectorAll(sel);
  return { length: el.length, get: i => el[i], each: (fn) => Array.from(el).forEach((el, i) => fn(i, el)), addClass(selClass){ el.forEach(e=>e.classList.add(selClass)); }, removeClass(selClass){ el.forEach(e=>e.classList.remove(selClass)); } };
}

function _toggleUI(perms = null) {
  const permsUse = perms ?? userPermissions;
  if (!permsUse) {
    // hide safe
    if (typeof $ !== 'undefined') {
      $('#btnEdit').addClass('d-none').hide();
      $('#navHistoryLink').addClass('d-none').hide();
      $('a[data-page="page/History/History.php"]').addClass('d-none').hide();
    } else {
      const be = document.querySelector('#btnEdit'); if (be) be.classList.add('d-none');
      const nh = document.querySelector('#navHistoryLink'); if (nh) nh.classList.add('d-none');
      document.querySelectorAll('a[data-page="page/History/History.php"]').forEach(a=>a.classList.add('d-none'));
    }
    return;
  }

  // read selected dept if present
  let selectedDeptVal = '';
  try {
    if (typeof $ !== 'undefined' && $('#departmentFilter').length) selectedDeptVal = $('#departmentFilter').val();
    else {
      const s = document.querySelector('#departmentFilter');
      selectedDeptVal = s ? s.value : '';
    }
  } catch (e) { selectedDeptVal = ''; }

  const selDept = (selectedDeptVal && String(selectedDeptVal).length) ? String(selectedDeptVal) : String(permsUse.department_id ?? currentUser?.department_id ?? '');

  // toggle edit
  const okEdit = canEdit(permsUse, departmentsList, selDept, currentUser);
  const okHist = canViewHistory(permsUse, departmentsList, selDept, currentUser);

  if (typeof $ !== 'undefined') {
    if (okEdit) $('#btnEdit').removeClass('d-none').show(); else $('#btnEdit').addClass('d-none').hide();
    if (okHist) {
      $('#navHistoryLink').removeClass('d-none').show();
      $('a[data-page="page/History/History.php"]').removeClass('d-none').show();
    } else {
      $('#navHistoryLink').addClass('d-none').hide();
      $('a[data-page="page/History/History.php"]').addClass('d-none').hide();
    }
  } else {
    const be = document.querySelector('#btnEdit'); if (be) { if (okEdit) be.classList.remove('d-none'); else be.classList.add('d-none'); }
    const nh = document.querySelector('#navHistoryLink'); if (nh) { if (okHist) nh.classList.remove('d-none'); else nh.classList.add('d-none'); }
    document.querySelectorAll('a[data-page="page/History/History.php"]').forEach(a => { if (okHist) a.classList.remove('d-none'); else a.classList.add('d-none'); });
  }
}

/* ---------------- init permissions (auto) ---------------- */
async function _init({ tryLoadMockUser = true, mockUserPath = DYN_MOCKUSER_PATH, apiBase = DEFAULT_API_BASE } = {}) {
  // load mock user dynamic if requested
  if (tryLoadMockUser) {
    try {
      const mod = await import(mockUserPath);
      currentUser = mod?.default ?? mod?.user ?? (typeof window !== 'undefined' ? window.user : null);
    } catch (e) {
      currentUser = (typeof window !== 'undefined') ? window.user : null;
      // console.debug('main.js: dynamic import mockuser failed', e);
    }
  } else {
    currentUser = (typeof window !== 'undefined') ? window.user : null;
  }

  // try fetch departments (best-effort)
  try {
    const res = await fetch(`${apiBase}/get_departments.php`, { cache: 'no-store' });
    let json = null;
    if (res.ok) json = await res.json();
    if (json && json.departments && Array.isArray(json.departments)) departmentsList = json.departments;
    else if (Array.isArray(json)) departmentsList = json;
    else departmentsList = [];
  } catch (e) {
    departmentsList = [];
    // console.warn('main.js: fetch departments failed', e);
  }

  _resolvePermissions(currentUser, departmentsList);
  _toggleUI(userPermissions);
  _permissionsReadyResolve?.(userPermissions);
  // fire again if DOM wasn't ready earlier (see listener below)
  return userPermissions;
}

/* ---------------- DOM hooks ---------------- */
// run toggle when department filter changes
function _attachDomListeners() {
  try {
    if (typeof $ !== 'undefined') {
      $(document).on('change.main', '#departmentFilter', function () { _toggleUI(); });
    } else {
      const sel = document.querySelector('#departmentFilter');
      if (sel) sel.addEventListener('change', () => _toggleUI());
    }
  } catch (e) {}
}

// if DOMContentLoaded hasn't fired yet, wait then toggle; otherwise toggle immediately
function _domReadyToggle() {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    _toggleUI(userPermissions);
    _attachDomListeners();
  } else {
    document.addEventListener('DOMContentLoaded', function () { _toggleUI(userPermissions); _attachDomListeners(); });
  }
}

/* ---------------- auto-init on load ---------------- */
(async function autoInit() {
  try {
    await _init({ tryLoadMockUser: true, mockUserPath: DYN_MOCKUSER_PATH, apiBase: DEFAULT_API_BASE });
  } catch (e) {
    // ignore init failure but still resolve
    _permissionsReadyResolve?.(null);
    console.warn('main.js: init failed', e);
  } finally {
    _domReadyToggle();
  }
})();
