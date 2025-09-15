// main.js (updated) — use permissionsReady pattern + helpers

export let currentUser = (typeof window !== 'undefined') ? (window.user ?? null) : null;
export let departmentsList = [];
export let userPermissions = null;

const DEFAULT_MOCK_USER_PATH = './page/MockUser.js';
const DEFAULT_API_BASE = '../../connection';

let _resolvePermissionsPromise;
export const permissionsReady = new Promise(resolve => { _resolvePermissionsPromise = resolve; });

/* =====================
   Utility helpers
   ===================== */
export function parseAllowedIds(raw) {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '') return [];
    if (t === '0') return ['0'];
    if (t.startsWith('[') || t.startsWith('{')) {
      try { const j = JSON.parse(t); if (Array.isArray(j)) return j.map(String).map(s => s.trim()).filter(Boolean); } catch (e) { /* fallthrough */ }
    }
    return t.split(',').map(x => x.trim()).filter(Boolean);
  }
  return String(raw).split(',').map(x => x.trim()).filter(Boolean);
}

export function hasEditPermission(perms = {}, departments = [], selectedDeptId = '', user = currentUser) {
  if (!perms) return false;
  if (perms.can_edit !== null && perms.can_edit !== undefined) return Number(perms.can_edit) === 1;
  const deptId = (selectedDeptId && String(selectedDeptId).length) ? String(selectedDeptId) : String(perms.department_id ?? user?.department_id ?? '');
  const row = (departments || []).find(d => String(d.id) === deptId) || null;
  return !!(row && Number(row.can_edit || 0) === 1);
}

export function hasHistoryPermission(perms = {}, departments = [], selectedDeptId = '', user = currentUser) {
  if (!perms) return false;
  if (perms.can_view_history !== null && perms.can_view_history !== undefined) return Number(perms.can_view_history) === 1;
  const deptId = (selectedDeptId && String(selectedDeptId).length) ? String(selectedDeptId) : String(perms.department_id ?? user?.department_id ?? '');
  const row = (departments || []).find(d => String(d.id) === deptId) || null;
  return !!(row && Number(row.can_view_history || 0) === 1);
}


export function getCurrentUser() { return currentUser; }


export function whenPermissionsReady() { return permissionsReady; }

/* =====================
   Internal resolver & UI toggling
   ===================== */
function resolvePermissions(user = null, departments = []) {
  currentUser = user ?? currentUser ?? (typeof window !== 'undefined' ? window.user : null);
  departmentsList = Array.isArray(departments) ? departments : (departments?.departments || []);

  const matched = (departmentsList || []).find(d => String(d.id) === String(currentUser?.department_id)) || null;
  const pick = (obj, key, def) => (obj && Object.prototype.hasOwnProperty.call(obj, key)) ? obj[key] : def;

  // เป็น default permission จาก database (ตาราง departments) 
  const db_dept_view = pick(matched, 'department_view', null);
  const db_can_edit = Number(pick(matched, 'can_edit', 0)) || 0;
  const db_can_view_history = Number(pick(matched, 'can_view_history', 0)) || 0;

  // Mock / user-level overrides ดึงมจาก MockUser.js
  const user_dept_view = (currentUser?.department_view !== null && currentUser?.department_view !== undefined) ? currentUser.department_view : null;
  const user_can_edit = (currentUser?.can_edit !== null && currentUser?.can_edit !== undefined) ? Number(currentUser.can_edit) : null;
  const user_can_view_history = (currentUser?.can_view_history !== null && currentUser?.can_view_history !== undefined) ? Number(currentUser.can_view_history) : null;

  // Final resolved values (user overrides DB when present)
  const resolved_dept_view = (user_dept_view !== null) ? user_dept_view : db_dept_view;
  const resolved_can_edit = (user_can_edit !== null) ? user_can_edit : db_can_edit;
  const resolved_can_view_history = (user_can_view_history !== null) ? user_can_view_history : db_can_view_history;

  userPermissions = {
    department_id: matched?.id ?? currentUser?.department_id ?? null,
    department_name: matched?.name ?? null,
    department_view: (resolved_dept_view === undefined ? null : resolved_dept_view),
    can_edit: (resolved_can_edit === undefined || resolved_can_edit === null) ? 0 : Number(resolved_can_edit),
    can_view_history: (resolved_can_view_history === undefined || resolved_can_view_history === null) ? 0 : Number(resolved_can_view_history),
    _matched_row: matched || null
  };

  // Broadcast and return
  try { document.dispatchEvent(new CustomEvent('permissions:updated', { detail: { userPermissions, currentUser, departmentsList } })); } catch (e) { /* ignore */ }
  return userPermissions;
}

function getSelectedDepartmentFromDom() {
  try {
    if (typeof $ !== 'undefined' && $('#departmentFilter').length) return String($('#departmentFilter').val() || '');
    const el = document.querySelector('#departmentFilter'); return el ? String(el.value || '') : '';
  } catch (e) { return ''; }
}

function applyUiVisibility(permsOverride = null) {
  const perms = permsOverride ?? userPermissions;
  if (!perms) {
    if (typeof $ !== 'undefined') {
      $('#btnEdit').addClass('d-none').hide();
      $('#navHistoryLink').addClass('d-none').hide();
      $('a[data-page="page/History/History.php"]').addClass('d-none').hide();
    } else {
      const be = document.querySelector('#btnEdit'); if (be) be.classList.add('d-none');
      const nh = document.querySelector('#navHistoryLink'); if (nh) nh.classList.add('d-none');
      document.querySelectorAll('a[data-page="page/History/History.php"]').forEach(a => a.classList.add('d-none'));
    }
    return;
  }

  const selectedDeptVal = getSelectedDepartmentFromDom();
  const useDept = (selectedDeptVal && String(selectedDeptVal).length) ? String(selectedDeptVal) : String(perms.department_id ?? currentUser?.department_id ?? '');

  const okEdit = hasEditPermission(perms, departmentsList, useDept, currentUser);
  const okHist = hasHistoryPermission(perms, departmentsList, useDept, currentUser);

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

/* =====================
   Initialization: fetch departments, optional mock user, resolve perms, apply UI
   ===================== */

export async function initPermissions({ autoLoadMockUser = true, mockUserPath = DEFAULT_MOCK_USER_PATH, apiBase = DEFAULT_API_BASE } = {}) {
  // assign quick fallback from window.user synchronously (so consumers reading sync may get immediate value if available)
  currentUser = (typeof window !== 'undefined') ? (window.user ?? currentUser) : currentUser;

  if (autoLoadMockUser) {
    try {
      const mod = await import(mockUserPath);
      currentUser = mod?.default ?? mod?.user ?? currentUser;
    } catch (e) {
      // keep currentUser as window.user (already set)
      currentUser = currentUser;
    }
  } else {
    // already assigned above
  }

  try {
    const res = await fetch(`${apiBase}/get_departments.php`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.departments && Array.isArray(json.departments)) departmentsList = json.departments;
      else if (Array.isArray(json)) departmentsList = json;
      else departmentsList = [];
    } else {
      departmentsList = [];
    }
  } catch (e) {
    departmentsList = [];
  }

  resolvePermissions(currentUser, departmentsList);
  applyUiVisibility(userPermissions);
  _resolvePermissionsPromise?.(userPermissions);
  return userPermissions;
}

/* =====================
   DOM hooks: keep separate for clarity
   ===================== */
function attachDepartmentChangeListener() {
  try {
    if (typeof $ !== 'undefined') {
      $(document).on('change.main', '#departmentFilter', function () { applyUiVisibility(); });
    } else {
      const sel = document.querySelector('#departmentFilter');
      if (sel) sel.addEventListener('change', () => applyUiVisibility());
    }
  } catch (e) { /* ignore */ }
}

function scheduleDomUiToggle() {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    applyUiVisibility(userPermissions);
    attachDepartmentChangeListener();
  } else {
    document.addEventListener('DOMContentLoaded', function () { applyUiVisibility(userPermissions); attachDepartmentChangeListener(); });
  }
}

(async function autoInit() {
  try {
    await initPermissions({ autoLoadMockUser: true, mockUserPath: DEFAULT_MOCK_USER_PATH, apiBase: DEFAULT_API_BASE });
  } catch (e) {
    _resolvePermissionsPromise?.(null);
    console.warn('main.js: initPermissions failed', e);
  } finally {
    scheduleDomUiToggle();
  }
})();
