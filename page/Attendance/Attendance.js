// Attendance.js

// เปลี่ยนโครงสร้างเป็น module ที่ export init และ destroy
import user from "../MockUser.js";
import MultiEditorFactory from "./MultiEditor.js";

// -------------------- CENTRAL STATE --------------------
// ย้าย appState มาไว้ด้านนอกเพื่อให้ init/destroy เข้าถึงได้
const appState = {
  editMode: false,
  datesWithData: new Set(),
  fp: null,
  lastPickedDate: null,
  originalData: {},
  editedData: {},
  userPermissions: null,
  departmentsList: [],
  selectedRows: new Set(),
  multiEditor: null,
  multiEditorActive: false,
  navCaptureHandler: null
};

// -------------------- HELPER FUNCTIONS (ย้ายมาไว้ข้างนอก) --------------------
// ... (ฟังก์ชันขนาดเล็กเช่น getTodayIso, formatTimeCell, ฯลฯ) ...
function getTodayIso() { return new Date().toISOString().slice(0,10); }
function formatTimeCell(value) {
  if (!value && value !== 0) return '';
  const s = String(value).substring(0,5);
  return `<div class="text-center">${s} น.</div>`;
}
function formatDateTime(value) {
  if (!value) return '';
  return String(value).replace('T', ' ').substring(0, 16);
}
function formatDateKey(dateObj) {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
}
function normalizeDepartments(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.departments && Array.isArray(data.departments)) return data.departments;
  if (data.id !== undefined) return [data];
  try {
    const keys = Object.keys(data);
    if (keys.length && keys.every(k => !isNaN(k))) return Object.values(data);
  } catch (e) {}
  return [];
}
function parseAllowedIds(raw) {
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
function canEdit(permissions = {}, departments = [], selectedDeptId = '') {
  if (!permissions) return false;
  if (permissions.can_edit !== null && permissions.can_edit !== undefined) {
    return Number(permissions.can_edit) === 1;
  }
  if (!selectedDeptId) {
    selectedDeptId = String(permissions.department_id ?? user.department_id ?? '');
  }
  const deptRow = (departments || []).find(d => String(d.id) === String(selectedDeptId)) || null;
  return !!(deptRow && Number(deptRow.can_edit || 0) === 1);
}
function canViewHistory(permissions = {}, departments = [], selectedDeptId = '') {
  if (!permissions) return false;
  if (permissions.can_view_history !== null && permissions.can_view_history !== undefined) {
    return Number(permissions.can_view_history) === 1;
  }
  if (!selectedDeptId) {
    selectedDeptId = String(permissions.department_id ?? user.department_id ?? '');
  }
  const deptRow = (departments || []).find(d => String(d.id) === String(selectedDeptId)) || null;
  return !!(deptRow && Number(deptRow.can_view_history || 0) === 1);
}
function updateAppState(updates = {}, opts = {}) {
  try {
    Object.keys(updates).forEach(k => { appState[k] = updates[k]; });
  } catch (e) { console.warn('updateAppState merge failed', e); }
  if (!opts.skipUIUpdate) {
    try { updateUIButtons(); } catch (e) { console.warn('updateUIButtons failed', e); }
  }
  if (opts.refreshTable) {
    try { if ($table.data('bootstrap.table')) $table.bootstrapTable('refresh', { silent: true }); } catch (e) { console.warn('refresh table failed', e); }
  }
  if (opts.redrawDatepicker) {
    try { if (appState.fp && typeof appState.fp.redraw === 'function') appState.fp.redraw(); } catch (e) { console.warn('fp.redraw failed', e); }
  }
}
function updateUIButtons() {
  const $table = $('#attendanceTable');
  const $datePicker = $('#datePicker');
  const $departmentFilter = $('#departmentFilter');
  const $btnTogglePresent = $('#btnTogglePresent');
  const $btnMultiEditor = $('#btnMultiEditor');
  const $btnEdit = $('#btnEdit');
  const $btnSave = $('#btnSave');
  const $btnCancel = $('#btnCancel');

  if (appState.editMode) {
    $btnEdit.addClass('d-none').hide();
    $btnSave.removeClass('d-none').show();
    $btnCancel.removeClass('d-none').show();
    $btnTogglePresent.removeClass('d-none').show();
    $btnMultiEditor.removeClass('d-none').show();
    try {
      if ($table.data('bootstrap.table')) {
        if (appState.multiEditorActive) $table.bootstrapTable('showColumn', 'state');
        else $table.bootstrapTable('hideColumn', 'state');
      }
    } catch (e) {}
    return;
  }
  $btnSave.addClass('d-none').hide();
  $btnCancel.addClass('d-none').hide();
  $btnTogglePresent.addClass('d-none').hide();
  $btnMultiEditor.addClass('d-none').hide();
  if ($table.data('bootstrap.table')) try { $table.bootstrapTable('hideColumn', 'state'); } catch (e) {}
  if (!appState.userPermissions) {
    $btnEdit.addClass('d-none').hide();
    $('#navHistoryLink, a[data-page="page/History/History.php"]').addClass('d-none').hide();
    return;
  }
  const rawSelected = $departmentFilter.val();
  const selectedDeptId = (rawSelected && String(rawSelected).length) ? String(rawSelected) : String(appState.userPermissions.department_id ?? user.department_id ?? '');
  if (canEdit(appState.userPermissions, appState.departmentsList, selectedDeptId)) {
    $btnEdit.removeClass('d-none').show();
  } else {
    $btnEdit.addClass('d-none').hide();
  }
  if (canViewHistory(appState.userPermissions, appState.departmentsList, selectedDeptId)) {
    $('#navHistoryLink').removeClass('d-none').show();
    $('a[data-page="page/History/History.php"]').removeClass('d-none').show();
  } else {
    $('#navHistoryLink').addClass('d-none').hide();
    $('a[data-page="page/History/History.php"]').addClass('d-none').hide();
  }
  try { if ($table.data('bootstrap.table')) $table.bootstrapTable('refresh', { silent: true }); } catch(e) {}
}
function initFlatpickrForInputs($root) {
  const $table = $('#attendanceTable');
  $root = $root || $table;
  $root.find('.time-input, .ot-start, .ot-end').each(function () {
    const el = this;
    const $el = $(el);
    if (!$el.data('flat')) {
      try { flatpickr(el, { enableTime: true, noCalendar: true, dateFormat: 'H:i', time_24hr: true, allowInput: true }); } catch(e) {}
      $el.data('flat', true);
    }
  });
}
function ensureClearOtButtonsInitialized($root) {
  const $table = $('#attendanceTable');
  $root = $root || $table;
  $root.find('.ot-start, .ot-end').each(function () {
    const $input = $(this);
    if ($input.parent().find('.btn-clear-ot').length) return;
    if ($input.parent().hasClass('input-group')) {
      if ($input.parent().find('.btn-clear-ot').length) return;
      $input.after('<button type="button" class="btn btn-outline-secondary btn-clear-ot" aria-label="clear">&times;</button>');
      return;
    }
    $input.wrap('<div class="input-group"></div>').after('<button type="button" class="btn btn-outline-secondary btn-clear-ot" aria-label="clear">&times;</button>');
  });
}
function applyDraftsToDOM() {
  const $table = $('#attendanceTable');
  Object.entries(appState.editedData).forEach(([uid, fields]) => {
    Object.entries(fields).forEach(([field, val]) => {
      if (field === 'ot_result') {
        const name = `ot_result_${uid}`;
        $(`[name="${name}"]`).prop('checked', false);
        if (val === undefined || val === null) return;
        $(`[name="${name}"][value="${val}"]`).prop('checked', true);
      } else {
        const selector = `[data-user="${uid}"].${field}`;
        const $el = $(selector);
        if (!$el.length) return;
        if ($el.is(':checkbox')) $el.prop('checked', !!val);
        else $el.val(val);
      }
    });
  });
}
function applySelectedRowsToDOM() {
  const $table = $('#attendanceTable');
  try {
    const rowsData = $table.bootstrapTable('getData') || [];
    const selections = $table.bootstrapTable('getSelections') || [];
    const selSet = new Set((selections || []).map(r => String(r.user_id)));
    $table.find('.fixed-table-body table tbody tr').each(function () {
      const $tr = $(this);
      const index = $tr.data('index');
      const row = (typeof index !== 'undefined') ? rowsData[index] : null;
      const uid = row ? String(row.user_id) : null;
      if (!uid) return;
      if (selSet.has(uid)) $tr.addClass('multi-selected-row');
      else $tr.removeClass('multi-selected-row');
    });
  } catch (e) { console.warn('applySelectedRowsToDOM', e); }
}
function updateAllRowEnabledStates() {
  const $table = $('#attendanceTable');
  try {
    const rowsData = $table.bootstrapTable('getData') || [];
    $table.find('.fixed-table-body table tbody tr').each(function () {
      const $tr = $(this);
      const index = $tr.data('index');
      const row = (typeof index !== 'undefined') ? rowsData[index] : null;
      const uid = row ? String(row.user_id) : null;
      if (!uid) return;
      const draft = appState.editedData[uid] || {};
      const orig = appState.originalData[uid] || {};
      let effectivePresent = 1;
      if (draft.present !== undefined && draft.present !== null) effectivePresent = Number(draft.present);
      else if (orig.present !== undefined && orig.present !== null) effectivePresent = Number(orig.present);
      else effectivePresent = 1;
      const disable = (effectivePresent === 0);
      $tr.find('input, select, textarea').each(function () {
        const $el = $(this);
        if ($el.hasClass('present-checkbox')) { $el.prop('disabled', false); return; }
        if ($el.hasClass('notes-editor') || $el.hasClass('notes')) { $el.prop('disabled', false); return; }
        $el.prop('disabled', disable);
      });
    });
  } catch (e) { console.warn('updateAllRowEnabledStates', e); }
}
function setSelectionEnabled(enabled) {
  const $table = $('#attendanceTable');
  try {
    const $wrapper = $table.closest('.bootstrap-table');
    $wrapper.find('.fixed-table-body table tbody tr').css('cursor', enabled ? 'pointer' : 'default');
  } catch (e) { console.warn('setSelectionEnabled', e); }
}
function fixHeaderCheckboxBehavior() {
  const $table = $('#attendanceTable');
  try { $table.closest('.bootstrap-table').off('click.attendanceHeader'); } catch (e) {}
}
function updateTableUi(opts = {}) {
  const $table = $('#attendanceTable');
  try {
    if (opts.initFlatpickr !== false) initFlatpickrForInputs();
    if (opts.ensureClearButtons !== false) ensureClearOtButtonsInitialized();
    if (opts.applyDrafts !== false) applyDraftsToDOM();
    if (opts.applySelections !== false) applySelectedRowsToDOM();
    if (opts.updateEnabledStates !== false) updateAllRowEnabledStates();
    setSelectionEnabled(Boolean(appState.editMode && appState.multiEditorActive));
    try {
      if ($table.data('bootstrap.table')) {
        if (appState.editMode && appState.multiEditorActive) $table.bootstrapTable('showColumn', 'state');
        else $table.bootstrapTable('hideColumn', 'state');
      }
    } catch (e) {}
    fixHeaderCheckboxBehavior();
  } catch (e) { console.warn('updateTableUi failed', e); }
}
function isEmptyVal(v) { return v === '' || v === null || typeof v === 'undefined'; }
function validateOtFields(editedData, originalData) {
  const incomplete = [];
  const otFields = ['ot_start','ot_end','ot_minutes','product_count','ot_result'];
  const optionalFields = ['ot_task'];
  Object.entries(editedData || {}).forEach(([uid, fields]) => {
    const orig = originalData[uid] || {};
    let effectivePresent = 1;
    if (fields.present !== undefined && fields.present !== null) effectivePresent = Number(fields.present);
    else if (orig.present !== undefined && orig.present !== null) effectivePresent = Number(orig.present);
    else effectivePresent = 1;
    if (effectivePresent === 0) return;
    const anyFilled = [...otFields, ...optionalFields].some(f => {
      const v = (fields[f] !== undefined) ? fields[f] : orig[f];
      return !isEmptyVal(v);
    });
    if (anyFilled) {
      const allFilled = otFields.every(f => {
        const v = (fields[f] !== undefined) ? fields[f] : orig[f];
        return !isEmptyVal(v);
      });
      if (!allFilled) incomplete.push(uid);
    }
  });
  return Array.from(new Set(incomplete));
}
function collectChangedRecords(editedData, originalData) {
  const records = [];
  Object.entries(editedData || {}).forEach(([uid, fields]) => {
    const orig = originalData[uid] || {};
    const changed = Object.keys(fields).some(f => {
      const a = fields[f]; const b = orig[f];
      if (isEmptyVal(a) && isEmptyVal(b)) return false;
      return String(a) !== String(b);
    });
    if (changed) {
      const rec = { user_id: parseInt(uid, 10) };
      ['present','clock_in','clock_out','ot_start','ot_end','ot_minutes','ot_task','product_count','ot_result','notes']
        .forEach(k => { if (fields[k] !== undefined) rec[k] = fields[k]; });
      records.push(rec);
    }
  });
  return records;
}
function processResponseRows(resRows = []) {
  const $datePicker = $('#datePicker');
  const rows = (resRows || []).slice();
  rows.forEach(r => {
    r.date_work = $datePicker.val();
    r.present_text = (Number(r.present) === 1) ? 'มา' : '';
    r.ot_result_text = (r.ot_result === null || r.ot_result === undefined) ? '' : (Number(r.ot_result) === 1 ? 'ได้ตามเป้า' : 'ไม่ได้ตามเป้า');
    r.clock_in = r.clock_in ? String(r.clock_in).substring(0,5) : '08:00';
    r.clock_out = r.clock_out ? String(r.clock_out).substring(0,5) : '17:00';
    r.ot_start = r.ot_start ? String(r.ot_start).substring(0,5) : null;
    r.ot_end = r.ot_end ? String(r.ot_end).substring(0,5) : null;
  });
  const originalData = {};
  rows.forEach(r => {
    originalData[r.user_id] = {
      present: (r.present !== undefined && r.present !== null) ? Number(r.present) : null,
      clock_in: (r.clock_in !== undefined && r.clock_in !== null) ? String(r.clock_in) : null,
      clock_out: (r.clock_out !== undefined && r.clock_out !== null) ? String(r.clock_out) : null,
      ot_start: (r.ot_start !== undefined && r.ot_start !== null) ? String(r.ot_start) : null,
      ot_end: (r.ot_end !== undefined && r.ot_end !== null) ? String(r.ot_end) : null,
      ot_task: r.ot_task !== undefined ? (r.ot_task === null ? null : r.ot_task) : null,
      ot_result: (r.ot_result !== undefined && r.ot_result !== null) ? Number(r.ot_result) : null,
      ot_approver_id: r.ot_approver_id !== undefined && r.ot_approver_id !== null ? Number(r.ot_approver_id) : null,
      notes: r.notes !== undefined ? (r.notes === null ? null : r.notes) : null,
      ot_minutes: r.ot_minutes !== undefined ? (r.ot_minutes === null ? null : Number(r.ot_minutes)) : null,
      product_count: r.product_count !== undefined ? (r.product_count === null ? null : Number(r.product_count)) : null
    };
  });
  return { rows, originalData };
}

// -------------------- FORMATTERS (ต้องเป็น global) --------------------
// ... (ฟังก์ชัน formatter ทั้งหมด) ...
window.presentFormatter = function(value, row) {
  const uid = String(row.user_id);
  const draft = (appState.editedData[uid] && appState.editedData[uid].present !== undefined) ? appState.editedData[uid].present : value;
  const checked = Number(draft) === 1 ? 'checked' : '';
  const disabled = appState.editMode ? '' : 'disabled';
  return `<input type="checkbox" class="form-check-input present-checkbox present" data-user="${uid}" ${checked} ${disabled}>`;
};
window.clockInFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].clock_in !== undefined) ? appState.editedData[uid].clock_in : value;
  if (appState.editMode) {
    const v = val ? String(val).substring(0,5) : '08:00';
    return `<input type="text" class="form-control form-control-sm time-input clock_in" data-user="${uid}" value="${v}">`;
  }
  return formatTimeCell(val);
};
window.clockOutFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].clock_out !== undefined) ? appState.editedData[uid].clock_out : value;
  if (appState.editMode) {
    const v = val ? String(val).substring(0,5) : '17:00';
    return `<input type="text" class="form-control form-control-sm time-input clock_out" data-user="${uid}" value="${v}">`;
  }
  return formatTimeCell(val);
};
window.otStartFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].ot_start !== undefined) ? appState.editedData[uid].ot_start : value;
  if (appState.editMode) {
    const v = val ? String(val).substring(0,5) : '';
    return `<input type="text" class="form-control form-control-sm ot-input ot-start ot_start" data-user="${uid}" value="${v}">`;
  }
  return formatTimeCell(val);
};
window.otEndFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].ot_end !== undefined) ? appState.editedData[uid].ot_end : value;
  if (appState.editMode) {
    const v = val ? String(val).substring(0,5) : '';
    return `<input type="text" class="form-control form-control-sm ot-input ot-end ot_end" data-user="${uid}" value="${v}">`;
  }
  return formatTimeCell(val);
};
window.breakMinutesFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].ot_minutes !== undefined) ? appState.editedData[uid].ot_minutes : value;
  if (appState.editMode) {
    const v = (val === null || val === undefined) ? '' : val;
    return `<input type="number" min="0" class="form-control form-control-sm ot-input ot-minutes ot_minutes" data-user="${uid}" value="${v}">`;
  }
  return (val !== '' && val !== null && val !== undefined) ? `<div class="text-center">${val}</div>` : '';
};
window.otTaskFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].ot_task !== undefined) ? appState.editedData[uid].ot_task : (value || '');
  if (appState.editMode) {
    const escaped = $('<div>').text(val).html();
    return `<input type="text" class="form-control form-control-sm ot-input ot-task ot_task" data-user="${uid}" value="${escaped}">`;
  }
  return $('<div>').text(val).html();
};
window.productCountFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].product_count !== undefined) ? appState.editedData[uid].product_count : value;
  if (appState.editMode) {
    const v = (val === null || val === undefined) ? '' : val;
    return `<input type="number" min="0" class="form-control form-control-sm ot-input product-count product_count" data-user="${uid}" value="${v}">`;
  }
  return (val !== '' && val !== null && val !== undefined) ? `<div class="text-center">${val}</div>` : '';
};
window.otResultFormatter = function(value, row) {
  const uid = String(row.user_id);
  const draft = (appState.editedData[uid] && appState.editedData[uid].ot_result !== undefined) ? appState.editedData[uid].ot_result : value;
  if (appState.editMode) {
    const checkedYes = String(draft) === '1' ? 'checked' : '';
    const checkedNo  = String(draft) === '0' ? 'checked' : '';
    return `
      <div class="d-flex gap-2 justify-content-center align-items-center">
        <div class="form-check form-check-inline">
          <input class="form-check-input ot-result radio-yes" type="radio" name="ot_result_${uid}" value="1" data-user="${uid}" ${checkedYes}>
          <label class="form-check-label small">ได้ตามเป้า</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input ot-result radio-no" type="radio" name="ot_result_${uid}" value="0" data-user="${uid}" ${checkedNo}>
          <label class="form-check-label small">ไม่ได้ตามเป้า</label>
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary btn-clear-ot-result ms-1" data-user="${uid}" aria-label="เคลียร์สรุป">×</button>
      </div>`;
  } else {
    if (String(value) === '1') return 'ได้ตามเป้า';
    if (String(value) === '0') return 'ไม่ได้ตามเป้า';
    return '';
  }
};
window.notesFormatter = function(value, row) {
  const uid = String(row.user_id);
  const val = (appState.editedData[uid] && appState.editedData[uid].notes !== undefined) ? appState.editedData[uid].notes : (value || '');
  if (appState.editMode) {
    const escaped = $('<div>').text(val).html();
    return `<textarea class="notes-editor notes" data-user="${uid}">${escaped}</textarea>`;
  }
  return $('<div>').text(val).html();
};
window.dateModifiedFormatter = function(value) { return formatDateTime(value); };

// -------------------- MAIN LOGIC: init() & destroy() --------------------

/**
 * Initialization function, called by main.js when this page is loaded.
 */
function init() {
  const API_BASE = 'connection';
  const $table = $('#attendanceTable');
  const $datePicker = $('#datePicker');
  const $departmentFilter = $('#departmentFilter');
  const $btnTogglePresent = $('#btnTogglePresent');
  const $btnMultiEditor = $('#btnMultiEditor');
  const $btnEdit = $('#btnEdit');
  const $btnSave = $('#btnSave');
  const $btnCancel = $('#btnCancel');

  // Set up initial UI state
  $btnEdit.hide(); $btnSave.hide(); $btnCancel.hide();
  $('#navHistoryLink, a[data-page="page/History/History.php"]').hide();

  // Guard against navigation when editing
  appState.navCaptureHandler = function(ev) {
    if (!appState.editMode) return;
    const el = ev.target && ev.target.closest ? ev.target.closest('.header-center .nav-link') : null;
    if (!el) return;
    ev.stopPropagation(); ev.preventDefault();
    if (confirm('ยังไม่ได้บันทึกการเปลี่ยนแปลง ต้องการออกโดยไม่บันทึกหรือไม่?')) {
      // Clear the state and re-trigger navigation
      appState.editMode = false;
      appState.editedData = {};
      document.removeEventListener('click', appState.navCaptureHandler, true);
      setTimeout(() => el.click(), 10);
    }
  };
  document.addEventListener('click', appState.navCaptureHandler, true);

  // Delegated input handlers
  $(document).on('click.attendance', '.btn-clear-ot', function () {
    const $input = $(this).siblings('input');
    if ($input[0] && $input[0]._flatpickr) $input[0]._flatpickr.clear();
    $input.val('').trigger('change');
  });

  $(document).on('click.attendance', '.btn-clear-ot-result', function (e) {
    e.preventDefault();
    try {
      const uid = String($(this).data('user'));
      if (!uid) return;
      const name = `ot_result_${uid}`;
      $(`[name="${name}"]`).prop('checked', false).trigger('change');
      if (!appState.editedData[uid]) appState.editedData[uid] = {};
      appState.editedData[uid].ot_result = null;
      updateTableUi({ applyDrafts: true, updateEnabledStates: true });
    } catch (err) { console.warn('clear ot_result failed', err); }
  });

  $(document).on('input.attendance change.attendance', '#attendanceTable input, #attendanceTable textarea', function () {
    const $self = $(this);
    const uid = String($self.data('user'));
    if (!uid) return;
    const classes = (this.className || '').split(/\s+/);
    const candidates = ['present','clock_in','clock_out','ot_start','ot_end','ot_task','ot_result','notes','ot_minutes','product_count'];
    let field = null;
    for (let i=0;i<classes.length;i++) {
      if (candidates.indexOf(classes[i]) !== -1) { field = classes[i]; break; }
    }
    if (!field && $self.is(':radio') && ($self.attr('name') || '').startsWith('ot_result_')) field = 'ot_result';
    if (!field) return;
    let val;
    if ($self.is(':checkbox')) {
      if ($self.hasClass('present-checkbox')) val = $self.prop('checked') ? 1 : 0;
      else return;
    } else if ($self.is(':radio')) {
      val = $self.val(); if (val !== undefined) val = Number(val);
    } else val = $self.val();
    if (!appState.editedData[uid]) appState.editedData[uid] = {};
    appState.editedData[uid][field] = val;
    if (field === 'present') updateAllRowEnabledStates();
  });
  
  $(document).on('change.attendance', '#attendanceTable .present-checkbox', function () {
    const uid = String($(this).data('user'));
    if (!uid) return;
    if (!appState.editedData[uid]) appState.editedData[uid] = {};
    appState.editedData[uid].present = $(this).prop('checked') ? 1 : 0;
    updateAllRowEnabledStates();
  });

  // Load data and initialize everything
  $.getJSON(`${API_BASE}/get_departments.php`)
    .done(function (data) {
      const deps = normalizeDepartments(data);
      appState.departmentsList = deps;
      const matched = deps.find(d => String(d.id) === String(user.department_id)) || null;
      function pick(row, key, def) { return (row && Object.prototype.hasOwnProperty.call(row, key)) ? row[key] : def; }
      const db_department_view = pick(matched, 'department_view', null);
      const db_can_edit = Number(pick(matched, 'can_edit', 0)) || 0;
      const db_can_view_history = Number(pick(matched, 'can_view_history', 0)) || 0;
      const mock_department_view = (user.department_view !== null && user.department_view !== undefined) ? user.department_view : null;
      const mock_can_edit = (user.can_edit !== null && user.can_edit !== undefined) ? Number(user.can_edit) : null;
      const mock_can_view_history = (user.can_view_history !== null && user.can_view_history !== undefined) ? Number(user.can_view_history) : null;
      const resolved_department_view = mock_department_view !== null ? mock_department_view : db_department_view;
      const resolved_can_edit = mock_can_edit !== null ? mock_can_edit : db_can_edit;
      const resolved_can_view_history = mock_can_view_history !== null ? mock_can_view_history : db_can_view_history;
      appState.userPermissions = {
        department_id: matched?.id ?? user.department_id ?? null,
        department_name: matched?.name ?? null,
        department_view: (resolved_department_view === undefined ? null : resolved_department_view),
        can_edit: (resolved_can_edit === undefined || resolved_can_edit === null) ? 0 : Number(resolved_can_edit),
        can_view_history: (resolved_can_view_history === undefined || resolved_can_view_history === null) ? 0 : Number(resolved_can_view_history),
        _matched_row: matched || null
      };
    })
    .fail(function () {
      appState.userPermissions = {};
      appState.departmentsList = [];
    })
    .always(function () {
      $.getJSON(`${API_BASE}/get_dates.php`)
        .done(function(list){ appState.datesWithData = new Set((list||[]).map(String)); })
        .fail(function(){ appState.datesWithData = new Set(); })
        .always(function(){
          $.getJSON(`${API_BASE}/get_departments.php`)
            .done(function(data){
              appState.departmentsList = normalizeDepartments(data);
              const allowedRaw = appState.userPermissions?.department_view;
              const parsed = parseAllowedIds(allowedRaw);
              let visibleDeps = [];
              if (parsed === null) {
                visibleDeps = appState.departmentsList.filter(d => String(d.id) === String(user.department_id));
              } else if (parsed.length === 1 && parsed[0] === '0') {
                visibleDeps = appState.departmentsList.slice();
              } else if (parsed.length === 0) {
                visibleDeps = appState.departmentsList.filter(d => String(d.id) === String(user.department_id));
              } else {
                const ids = new Set(parsed.map(String));
                visibleDeps = appState.departmentsList.filter(d => ids.has(String(d.id)));
              }
              $departmentFilter.empty();
              if (visibleDeps.length > 1) $departmentFilter.append(`<option value="">ทุกแผนก</option>`);
              visibleDeps.forEach(dep => $departmentFilter.append(`<option value="${dep.id}">${dep.name}</option>`));
              if (visibleDeps.length > 1) $departmentFilter.val('');
              else if (visibleDeps.length === 1) $departmentFilter.val(String(visibleDeps[0].id));
              else $departmentFilter.val(String(user.department_id || ''));
            })
            .fail(function(){
              $departmentFilter.html('<option value="">ทุกแผนก</option>');
              appState.departmentsList = [];
            })
            .always(function(){
              if (!$datePicker.val()) $datePicker.val(getTodayIso());
              try { if (appState.fp && appState.fp.destroy) appState.fp.destroy(); } catch(e){}
              appState.lastPickedDate = $datePicker.val() || getTodayIso();

              try {
                appState.fp = flatpickr('#datePicker', {
                  dateFormat: 'Y-m-d',
                  locale: 'th',
                  defaultDate: appState.lastPickedDate,
                  maxDate: new Date(),
                  onChange: function (selectedDates, dateStr, instance) {
                    if (appState.editMode) {
                      if (!confirm('ยังไม่ได้บันทึกการเปลี่ยนแปลง ต้องการเปลี่ยนวันที่โดยไม่บันทึกหรือไม่?')) {
                        try { instance.setDate(appState.lastPickedDate, false); } catch (e) { $datePicker.val(appState.lastPickedDate); }
                        return;
                      }
                    }
                    updateAppState({ lastPickedDate: dateStr || appState.lastPickedDate, editMode: false, editedData: {}, multiEditorActive: false }, { refreshTable: true });
                    if (appState.multiEditor) try { appState.multiEditor.hide(); } catch (e) {}
                  },
                  onDayCreate: function (_, __, ___, dayElement) {
                    try { if (appState.datesWithData.has(formatDateKey(dayElement.dateObj))) dayElement.classList.add('has-data'); } catch (e) {}
                  }
                });
              } catch (e) { /* ignore fp errors */ }
              if (appState.fp && appState.fp.redraw) appState.fp.redraw();

              // Initialize/refresh table
              try { $table.off('.attendance'); } catch(e){}
              $table.bootstrapTable('destroy');
              $table.bootstrapTable({
                url: `${API_BASE}/get_attendance.php`,
                sidePagination: 'server',
                pagination: true,
                pageSize: 10,
                pageList: [5, 10, 25, 1, 50, 1, 100, 'All'],
                search: true,
                clickToSelect: true,
                showColumns: true,
                showExport: true,
                exportTypes: ['excel','csv','txt'],
                toolbar: '#customToolbar',
                maintainSelected: true,
                queryParams: function (p) {
                  return { ...p, date: $datePicker.val(), department_id: $departmentFilter.val(), allowed_departments: appState.userPermissions?.department_view || "0" };
                },
                responseHandler: function (res) {
                  const rows = (res && res.rows) ? res.rows : [];
                  const processed = processResponseRows(rows);
                  appState.originalData = processed.originalData;
                  return { ...res, rows: processed.rows };
                },
                rowStyle: function () { return { classes: 'employee-row' }; },
                onPostBody: function () {
                  if (appState.editMode) {
                    initFlatpickrForInputs();
                    ensureClearOtButtonsInitialized();
                    applyDraftsToDOM();
                    applySelectedRowsToDOM();
                    updateAllRowEnabledStates();
                  } else {
                    $table.find('input,textarea').off('input change');
                  }
                  setSelectionEnabled(Boolean(appState.editMode && appState.multiEditorActive));
                  fixHeaderCheckboxBehavior();
                }
              });

              $table.on('check.bs.table.attendance uncheck.bs.table.attendance check-all.bs.table.attendance uncheck-all.bs.table.attendance', function () {
                try { updateAllRowEnabledStates(); applySelectedRowsToDOM(); } catch (err) { console.warn(err); }
              });
              $table.on('load-success.bs.table.attendance', function () {
                try {
                  if (appState.editMode && appState.multiEditorActive) $table.bootstrapTable('showColumn', 'state');
                  else $table.bootstrapTable('hideColumn', 'state');
                } catch (e) {}
              });
              $table.on('post-body.bs.table.attendance', function () {
                if (appState.editMode) {
                  initFlatpickrForInputs();
                  ensureClearOtButtonsInitialized();
                  applyDraftsToDOM();
                  applySelectedRowsToDOM();
                  updateAllRowEnabledStates();
                } else {
                  $table.find('input,textarea').off('input change');
                }
                fixHeaderCheckboxBehavior();
              });

              updateUIButtons();

              // MultiEditor init & sync
              try {
                if (!appState.multiEditor) {
                  appState.multiEditor = MultiEditorFactory();
                  appState.multiEditor.init({ containerSelector: '#pageContent', tableSelector: '#attendanceTable', applyCallback: function(records){
                    records.forEach(r => {
                      const uid = String(r.user_id);
                      if (!appState.editedData[uid]) appState.editedData[uid] = {};
                      ['present','clock_in','clock_out','ot_start','ot_end','ot_minutes','ot_task','product_count','ot_result','notes']
                        .forEach(k => { if (r.hasOwnProperty(k)) appState.editedData[uid][k] = r[k]; });
                      appState.selectedRows.add(Number(uid));
                    });
                    updateTableUi();
                    try { if (appState.multiEditor && typeof appState.multiEditor.setSelectedKeys === 'function') appState.multiEditor.setSelectedKeys(Array.from(appState.selectedRows).map(String)); } catch(e){console.warn(e);}
                  }});
                }

                if (appState.multiEditor && typeof appState.multiEditor.onSelectionChange === 'function') {
                  let _selChangeTimer = null;
                  appState.multiEditor.onSelectionChange(function (keys) {
                    if (_selChangeTimer) clearTimeout(_selChangeTimer);
                    _selChangeTimer = setTimeout(function () {
                      _selChangeTimer = null;
                      try { applySelectedRowsToDOM(); } catch(e){ console.warn('applySelectedRowsToDOM failed', e); }
                    }, 40);
                  });
                }

                $(document).on('multiEditor:shown', function () {
                  if (typeof appState.multiEditor.setSelectedKeys === 'function') {
                    setTimeout(function () {
                      try { appState.multiEditor.setSelectedKeys(Array.from(appState.selectedRows).map(x => String(x))); } catch (e) {}
                    }, 50);
                  }
                  try { if ($table.data('bootstrap.table')) $table.bootstrapTable('showColumn', 'state'); } catch(e){}
                });

              } catch (e) { console.warn('MultiEditor init failed', e); }

              $(document).on('multiEditor:hidden', function () {
                updateAppState({ multiEditorActive: false }, { skipUIUpdate: false });
                $btnMultiEditor.removeClass('active');
                try { if ($table.data('bootstrap.table')) $table.bootstrapTable('hideColumn', 'state'); } catch(e){}
                setSelectionEnabled(false);
              });
              $(document).on('multiEditor:shown', function () {
                updateAppState({ multiEditorActive: true }, { skipUIUpdate: false });
                setSelectionEnabled(Boolean(appState.editMode && appState.multiEditorActive));
              });

              $(document).on('click.attendance', '.export .dropdown-menu a', function () {
                setTimeout(function () {
                  try { $table.bootstrapTable('hideColumn', 'ot_result'); $table.bootstrapTable('hideColumn', 'ot_result_text'); } catch (e) {}
                }, 250);
              });

            }); // end departments
        }); // end dates always
    }); // end permissions always
  
  // Button handlers
  $btnEdit.on('click.attendance', function () { enterEditMode(); });
  $btnCancel.on('click.attendance', function () { exitEditMode({ clearDrafts: true, hideMultiEditor: true, refreshTable: true }); });
  $btnSave.on('click.attendance', function () {
    const incomplete = validateOtFields(appState.editedData, appState.originalData);
    if (incomplete.length) {
      const rowsData = $table.bootstrapTable ? ($table.bootstrapTable('getData') || []) : [];
      const rowMap = {}; rowsData.forEach(r => { rowMap[String(r.user_id)] = r; });
      const names = incomplete.map(uid => {
        const r = rowMap[uid] || {};
        const display = (r.full_name && String(r.full_name).trim()) ||
                        ((r.first_name || r.last_name) ? `${r.first_name || ''} ${r.last_name || ''}`.trim() : '') ||
                        (r.name && String(r.name).trim()) ||
                        `ID ${uid}`;
        return display;
      });
      alert(
        'พบการกรอก OT ไม่ครบสำหรับผู้ใช้:\n- ' + Array.from(new Set(names)).join('\n- ') +
        '\n\nโปรดกรอก OT ให้ครบ ("OT (เริ่ม)", "OT (สิ้นสุด)", "เวลาพัก(นาที)", "ผลลัพธ์", "จำนวนผลผลิต") หรือเคลียร์ค่า OT ก่อนบันทึก\n(หมายเหตุ: "ผลลัพธ์" จะใส่หรือไม่ก็ได้)'
      );
      return;
    }
    const records = collectChangedRecords(appState.editedData, appState.originalData);
    if (!records.length) {
      alert('ไม่มีการเปลี่ยนแปลง');
      exitEditMode({ clearDrafts: true, hideMultiEditor: true, refreshTable: true });
      return;
    }
    $.ajax({
      url: `${API_BASE}/save_attendance.php`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ date: $datePicker.val(), records }),
      success: function (resp) {
        if (resp && resp.status === 'ok') {
          exitEditMode({ clearDrafts: true, hideMultiEditor: true, refreshTable: true });
          $.getJSON(`${API_BASE}/get_dates.php`).always(function () { if (appState.fp && appState.fp.redraw) appState.fp.redraw(); });
          alert('บันทึกเรียบร้อย');
        } else alert('เกิดข้อผิดพลาด: ' + (resp && resp.message ? resp.message : 'ไม่ทราบสาเหตุ'));
      },
      error: function () { alert('บันทึกไม่สำเร็จ'); }
    });
  });
  $btnTogglePresent.on('click.attendance', function () {
    if (!appState.editMode) return;
    const $all = $table.find('.present-checkbox');
    const checkedCount = $all.filter(':checked').length;
    const allChecked = ($all.length && checkedCount === $all.length);
    $all.prop('checked', !allChecked).trigger('change');
  });
  $btnMultiEditor.on('click.attendance', function () {
    if (!appState.editMode) return;
    const want = !appState.multiEditorActive;
    updateAppState({ multiEditorActive: want }, { refreshTable: true });
    if (want) {
      if (appState.multiEditor) try { appState.multiEditor.show(); } catch (e) {}
      $btnMultiEditor.addClass('active');
    } else {
      if (appState.multiEditor) try { appState.multiEditor.hide(); } catch (e) {}
      $btnMultiEditor.removeClass('active');
    }
    setSelectionEnabled(Boolean(appState.editMode && appState.multiEditorActive));
  });
  $('#btnDownload').on('click.attendance', function () {
    const url = `${API_BASE}/export_attendance.php?date=${encodeURIComponent($datePicker.val())}` + ($departmentFilter.val() ? `&department_id=${$departmentFilter.val()}` : '');
    window.location.href = url;
  });
  $departmentFilter.on('change.attendance', function () {
    if ($table.data('bootstrap.table')) $table.bootstrapTable('refresh', { silent: true });
    updateUIButtons();
  });

  // Small helpers
  function enterEditMode() { updateAppState({ editMode: true }, { refreshTable: true }); updateTableUi(); }
  function exitEditMode(opts = { clearDrafts: true, hideMultiEditor: true, refreshTable: true }) {
    const updates = { editMode: false, multiEditorActive: false };
    if (opts.clearDrafts) updates.editedData = {};
    updateAppState(updates, { refreshTable: !!opts.refreshTable });
    if (opts.hideMultiEditor && appState.multiEditor) {
      try { appState.multiEditor.hide(); } catch (e) {}
      $btnMultiEditor.removeClass('active');
    }
  }

  // Expose appState to global for easier access from main.js
  window.appState = appState;
}

/**
 * Cleanup function, called by main.js when leaving this page.
 */
function destroy() {
  const $table = $('#attendanceTable');
  const $datePicker = $('#datePicker');
  const $departmentFilter = $('#departmentFilter');
  // Destroy plugins and event listeners
  try { if (appState.fp) appState.fp.destroy(); } catch(e){}
  try { if ($table.data('bootstrap.table')) $table.bootstrapTable('destroy'); } catch(e){}
  try { if (appState.multiEditor) appState.multiEditor.destroy(); } catch(e){}
  $(document).off('.attendance');
  window.appState = null;
  if (appState.navCaptureHandler) {
    document.removeEventListener('click', appState.navCaptureHandler, true);
  }
}

// Export the functions to be called by main.js
export { init, destroy };