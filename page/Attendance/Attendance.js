// /page/Attendance/Attendance.js
import user from "../MockUser.js"; // ใช้ absolute path เพื่อความชัวร์

// module-scope state
let editMode = false;
let datesWithData = new Set();
let fp = null;
let originalData = {};
let editedData = {};
let userPermissions = null;
const API_BASE = 'connection';

function today() { return new Date().toISOString().slice(0,10); }
function formatDateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function formatTimeCell(v) { if (!v) return ''; const hhmm = String(v).substring(0,5); return `<div class="text-center">${hhmm} น.</div>`; }
function formatDateTimeCell(v) { if (!v) return ''; return String(v).replace('T',' ').substring(0,16); }

// register global formatters used by bootstrap-table
function registerFormatters() {
  window.presentFormatter = (v, row) => {
    const checked = (editedData[row.user_id]?.present ?? v) == 1 ? 'checked' : '';
    return `<input type="checkbox" class="form-check-input present-checkbox present" data-user="${row.user_id}" ${checked} ${editMode?'':'disabled'}>`;
  };
  window.otStartFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_start ?? v?.substring(0,5) ?? '';
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-start ot_start" data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };
  window.otEndFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_end ?? v?.substring(0,5) ?? '';
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-end ot_end" data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };
  window.otTaskFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_task ?? v ?? '';
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-task ot_task" data-user="${row.user_id}" value="${value}">`
      : $('<div>').text(value).html();
  };
  window.otResultFormatter = (v,row) => {
    const checked = (editedData[row.user_id]?.ot_result ?? v) == 1 ? 'checked' : '';
    return `<input type="checkbox" class="form-check-input ot-result ot_result" data-user="${row.user_id}" ${checked} ${editMode?'':'disabled'}>`;
  };
  window.notesFormatter = (v,row) => {
    const value = editedData[row.user_id]?.notes ?? v ?? '';
    return editMode
      ? `<textarea class="notes-editor notes" data-user="${row.user_id}">${value}</textarea>`
      : $('<div>').text(value).html();
  };
  window.dateModifiedFormatter = (v)=> formatDateTimeCell(v);
}
function unregisterFormatters() {
  delete window.presentFormatter;
  delete window.otStartFormatter;
  delete window.otEndFormatter;
  delete window.otTaskFormatter;
  delete window.otResultFormatter;
  delete window.notesFormatter;
  delete window.dateModifiedFormatter;
}

// widget helpers
function destroyBootstrapTables($container) {
  $container.find('[data-toggle="table"]').each(function () {
    try { const $t = $(this); if ($t.data('bootstrap.table')) $t.bootstrapTable('destroy'); } catch(e){console.warn(e);}
  });
}
function destroyFlatpickrs($container) {
  $container.find('input,textarea').each(function () { try { if (this._flatpickr) this._flatpickr.destroy(); } catch(e){console.warn(e);} });
}

function normalizeDateString(raw) {
  if (!raw) return null;
  // ถ้าเป็น Date object
  if (raw instanceof Date) {
    return formatDateKey(raw);
  }
  // ถ้าส่งมาเป็น "2025-09-03T00:00:00" หรือ "2025-9-3" หรือ "2025/09/03"
  const m = String(raw).match(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/);
  if (m) {
    const y = m[1], mo = String(m[2]).padStart(2,'0'), d = String(m[3]).padStart(2,'0');
    return `${y}-${mo}-${d}`;
  }
  // fallback: ถ้ามี 'T' ให้ตัดก่อน T
  if (String(raw).includes('T')) return String(raw).split('T')[0];
  return String(raw);
}
// preload data
function loadDatesWithData() {
  return $.getJSON(`${API_BASE}/get_dates.php`, list => {
    // normalize ทุกค่า เป็น YYYY-MM-DD แล้วเก็บเป็น Set
    const arr = (list || []).map(normalizeDateString).filter(Boolean);
    datesWithData = new Set(arr);
    console.debug('[Attendance] datesWithData loaded:', arr);
  }).fail((jq, status, err) => {
    console.warn('[Attendance] loadDatesWithData failed', status, err);
    datesWithData = new Set();
  });
}
function loadUserPermissions() {
  return $.getJSON(`${API_BASE}/get_departments.php?department_id=${user.department_id}`, data => { userPermissions = data || {}; });
}
function loadDepartments() {
  return $.getJSON(`${API_BASE}/get_departments.php`, data => {
    const $departmentFilter = $('#departmentFilter');
    $departmentFilter.empty();
    if (!userPermissions) return;
    let allowed = userPermissions.department_view;
    let visibleDeps = [];
    if (allowed === "0") visibleDeps = data || [];
    else {
      const ids = allowed.split(",").map(x => x.trim());
      visibleDeps = (data || []).filter(dep => ids.includes(String(dep.id)));
    }
    if (visibleDeps.length > 1) $departmentFilter.append(`<option value="">ทุกแผนก</option>`);
    visibleDeps.forEach(dep => $departmentFilter.append(`<option value="${dep.id}">${dep.name}</option>`));
  });
}

// table options
let tableOptions = null;
function buildTableOptions() {
  const $datePicker = $('#datePicker');
  const $departmentFilter = $('#departmentFilter');
  tableOptions = {
    url: `${API_BASE}/get_attendance.php`,
    sidePagination: 'server',
    pagination: true,
    pageSize: 10,
    search: true,
    showColumns: true,
    showExport: true,
    exportTypes: ['excel','csv','txt'],
    toolbar: '#customToolbar',
    queryParams: p => ({
      ...p,
      date: $datePicker.val(),
      department_id: $departmentFilter.val(),
      allowed_departments: userPermissions?.department_view || "0"
    }),
    responseHandler: res => {
      (res.rows || []).forEach(r => {
        r.date_work = $('#datePicker').val();
        r.present_text = (Number(r.present) === 1) ? 'มา' : '';
        r.ot_result_text = (Number(r.ot_result) === 1) ? 'สำเร็จ' : '';
      });
      originalData = {};
      (res.rows || []).forEach(r => {
        originalData[r.user_id] = {
          present: Number(r.present ?? 0),
          ot_start: r.ot_start ? r.ot_start.substring(0,5) : null,
          ot_end:   r.ot_end   ? r.ot_end.substring(0,5)   : null,
          ot_task: r.ot_task || null,
          ot_result: Number(r.ot_result ?? 0),
          ot_approver_id: r.ot_approver_id ? Number(r.ot_approver_id) : null,
          notes: r.notes || null
        };
      });
      return res;
    },
    rowStyle: () => ({ classes: 'employee-row' }),
    onPostBody: () => { if (editMode) { initOTInputs(); applyDrafts(); } }
  };
}
function initTable() {
  const $table = $('#attendanceTable');
  if (!$table.length) return;
  if (!$table.data('bootstrap.table')) $table.bootstrapTable(tableOptions);
  else $table.bootstrapTable('refreshOptions', tableOptions);
}
function loadAttendance() {
  const $table = $('#attendanceTable');
  if ($table.length && $table.data('bootstrap.table')) $table.bootstrapTable('refresh', { silent: true });
  else initTable();
}

// OT inputs + events (namespaced .att)
function initOTInputs() {
  $('.ot-start,.ot-end').each(function () {
    if (!$(this).data('flat')) {
      $(this).wrap('<div class="input-group"></div>').after('<button type="button" class="btn btn-outline-secondary btn-clear-ot" aria-label="clear">&times;</button>');
      flatpickr(this, { enableTime:true, noCalendar:true, dateFormat:'H:i', time_24hr:true });
      $(this).data('flat', true);
    }
  });
  $('.btn-clear-ot').off('click.att').on('click.att', function() {
    const $i = $(this).siblings('input');
    if ($i[0]._flatpickr) $i[0]._flatpickr.clear();
  });
  $('#pageContent').find('input,textarea').off('input.att change.att').on('input.att change.att', function() {
    const uid = $(this).data('user');
    const field = this.className.split(' ').find(c => ['present','ot_start','ot_end','ot_task','ot_result','notes'].includes(c));
    let val;
    if ($(this).is(':checkbox')) val = $(this).prop('checked') ? 1 : 0;
    else val = $(this).val();
    saveDraft(uid, field, val);
  });
}

function saveDraft(userId, field, value) {
  if (!editedData[userId]) editedData[userId] = {};
  editedData[userId][field] = value;
}
function applyDrafts() {
  Object.entries(editedData).forEach(([uid, fields]) => {
    Object.entries(fields).forEach(([field, val]) => {
      const $el = $(`[data-user="${uid}"].${field}`);
      if ($el.is(':checkbox')) $el.prop('checked', !!val);
      else $el.val(val);
    });
  });
}

function updateButtons() {
  $('#btnEdit').toggleClass('d-none', editMode);
  $('#btnSave, #btnCancel').toggleClass('d-none', !editMode);
  $('#btnTogglePresent').toggleClass('d-none', !editMode);
  const $table = $('#attendanceTable');
  if ($table.length && $table.data('bootstrap.table')) $table.bootstrapTable('refresh', { silent: true });
}

function applyPermissions() {
  const allowEdit = user.can_edit && (userPermissions?.can_edit ?? true);
  const allowHistory = user.can_view_history && (userPermissions?.can_view_history ?? true);
  if (!allowEdit) $("#btnEdit, #btnSave, #btnCancel").hide();
  if (!allowHistory) $('a[href="../History/History.php"]').hide();
}

function bindUIEvents() {
  $('#btnEdit').on('click.att', () => { editMode = true; updateButtons(); });
  $('#btnCancel').on('click.att', () => { editMode = false; editedData = {}; updateButtons(); loadAttendance(); });
  $('#btnSave').on('click.att', saveAttendance);
  $('#btnTogglePresent').on('click.att', () => {
    if (!editMode) return;
    const $c = $('.present-checkbox');
    const allChecked = $c.length && $c.filter(':checked').length === $c.length;
    $c.prop('checked', !allChecked).trigger('change');
  });
  $('#btnDownload').on('click.att', () => {
    const url = `${API_BASE}/export_attendance.php?date=${encodeURIComponent($('#datePicker').val())}` + ($('#departmentFilter').val() ? `&department_id=${$('#departmentFilter').val()}` : '');
    window.location.href = url;
  });
  $('#departmentFilter').on('change.att', () => loadAttendance());
}
function unbindUIEvents() {
  $('#pageContent').find('*').off('.att');
  $('#btnEdit, #btnCancel, #btnSave, #btnTogglePresent, #btnDownload, #departmentFilter').off('.att');
}

function saveAttendance() {
  const date = $('#datePicker').val();
  const records = [];
  Object.entries(editedData).forEach(([uid, fields]) => {
    const orig = originalData[uid] || {};
    const changed = Object.keys(fields).some(f => fields[f] != orig[f]);
    if (changed) records.push({ user_id: uid, ...fields });
  });
  if (records.length === 0) {
    alert('ไม่มีการเปลี่ยนแปลง'); editMode = false; updateButtons(); return;
  }
  $.ajax({
    url: `${API_BASE}/save_attendance.php`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ date, records }),
    success: resp => {
      if (resp.status === 'ok') {
        editMode = false; editedData = {}; updateButtons(); loadAttendance();
        loadDatesWithData().always(() => { if (fp && fp.redraw) fp.redraw(); });
        alert('บันทึกเรียบร้อย');
      } else alert('เกิดข้อผิดพลาด: ' + (resp.message || 'ไม่ทราบสาเหตุ'));
    },
    error: () => alert('บันทึกไม่สำเร็จ')
  });
}

function initDatePicker() {
  if (fp && fp.destroy) fp.destroy();
  fp = flatpickr('#datePicker', {
    dateFormat: 'Y-m-d', locale: 'th', defaultDate: today(), maxDate: new Date(),
    onChange: () => { editMode = false; updateButtons(); loadAttendance(); },
    onDayCreate: (dObj, dStr, fpInstance, dayElem) => {
      try {
        const key = dayElem && dayElem.dateObj ? formatDateKey(dayElem.dateObj) : null;
        const has = key ? datesWithData.has(key) : false;
        if (has) dayElem.classList.add('has-data');
        // debug — ถ้าไม่เห็น highlight ให้ดู log นี้
        // จะเห็น key และ has boolean
        console.debug('[Attendance] onDayCreate', key, 'hasData=', has, dayElem.classList.contains('has-data'));
      } catch (e) {
        console.warn('[Attendance] onDayCreate error', e);
      }
    }
  });
}

// lifecycle
export async function init() {
  registerFormatters();
  buildTableOptions();
  bindUIEvents();
  await loadUserPermissions();
  await Promise.all([loadDatesWithData(), loadDepartments()]);
  if (!$('#datePicker').val()) $('#datePicker').val(today());
  initDatePicker();
  initTable();
  applyPermissions();
}

export function destroy() {
  editMode = false; editedData = {}; originalData = {}; userPermissions = null;
  const $c = $('#pageContent');
  destroyBootstrapTables($c);
  destroyFlatpickrs($c);
  unbindUIEvents();
  unregisterFormatters();
}

// expose fallback global so script-injection fallback can call init/destroy
window.AttendanceModule = { init, destroy };
