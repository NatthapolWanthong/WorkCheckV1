// Attendance.js ห้ามลบบรรทัดนี้
import user from "../MockUser.js";
import MultiEditorFactory from "./MultiEditor.js";

(function ($) {
  'use strict';

  const API_BASE = 'connection';

  // ---------- DOM ----------
  const $table = $('#attendanceTable');
  const $datePicker = $('#datePicker');
  const $departmentFilter = $('#departmentFilter');
  const $btnTogglePresent = $('#btnTogglePresent');
  const $btnMultiEditor = $('#btnMultiEditor');

  // ---------- state ----------
  let editMode = false;
  let datesWithData = new Set();
  let fp = null;
  let originalData = {};
  let editedData = {};
  let userPermissions = null;
  let departmentsList = [];
  let selectedRows = new Set();
  let multiEditor = null;
  let multiEditorActive = false;

  // ---------- small utils ----------
  const today = () => new Date().toISOString().slice(0, 10);
  const formatDateKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const formatTimeCell = v => v ? `<div class="text-center">${String(v).substring(0,5)} น.</div>` : '';
  const formatDateTimeCell = v => v ? String(v).replace('T',' ').substring(0,16) : '';

  // normalize department response (various server shapes)
  function normalizeDepartments(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.departments && Array.isArray(data.departments)) return data.departments;
    if (data.id !== undefined) return [data];
    try {
      const numericKeys = Object.keys(data).every(k => !isNaN(k));
      return numericKeys ? Object.values(data) : [];
    } catch (e) {
      return [];
    }
  }

  // ---------- selection control ----------
  function setSelectionEnabled(enabled) {
    try {
      const $wrapper = $table.closest('.bootstrap-table');
      $wrapper.find('input[name="btSelectItem"], input[name="btSelectAll"]').prop('disabled', !enabled);
      $wrapper.find('.fixed-table-body table tbody tr').css('cursor', enabled ? 'pointer' : 'default');
      if (!enabled) { try { $table.bootstrapTable('uncheckAll'); } catch(e) {} selectedRows.clear(); }
    } catch (e) { console.warn('setSelectionEnabled', e); }
  }

  // ---------- preload ----------
  function loadDatesWithData() {
    return $.getJSON(`${API_BASE}/get_dates.php`, list => {
      datesWithData = new Set((list || []).map(String));
    }).fail(() => { datesWithData = new Set(); });
  }

  /**
   * loadUserPermissions
   * - ดึง departments, match กับ MockUser.department_id
   * - merge: MockUser field ถ้าไม่ null ให้ override DB
   * - เก็บผลลัพธ์ไว้ใน userPermissions
   */
  function loadUserPermissions() {
    return $.getJSON(`${API_BASE}/get_departments.php`, data => {
      departmentsList = normalizeDepartments(data);
      const match = departmentsList.find(d => String(d.id) === String(user.department_id)) || null;

      const pick = (row, key, def) => (row && Object.prototype.hasOwnProperty.call(row, key) ? row[key] : def);

      const db_department_view = pick(match, 'department_view', null);
      const db_can_edit = Number(pick(match, 'can_edit', 0)) || 0;
      const db_can_view_history = Number(pick(match, 'can_view_history', 0)) || 0;

      const mock_department_view = (user.department_view !== null && user.department_view !== undefined) ? user.department_view : null;
      const mock_can_edit = (user.can_edit !== null && user.can_edit !== undefined) ? Number(user.can_edit) : null;
      const mock_can_view_history = (user.can_view_history !== null && user.can_view_history !== undefined) ? Number(user.can_view_history) : null;

      const resolved_department_view = mock_department_view !== null ? mock_department_view : db_department_view;
      const resolved_can_edit = mock_can_edit !== null ? mock_can_edit : db_can_edit;
      const resolved_can_view_history = mock_can_view_history !== null ? mock_can_view_history : db_can_view_history;

      userPermissions = {
        department_id: match?.id ?? user.department_id ?? null,
        department_name: match?.name ?? null,
        department_view: (resolved_department_view === undefined ? null : resolved_department_view),
        can_edit: (resolved_can_edit === undefined || resolved_can_edit === null) ? 0 : Number(resolved_can_edit),
        can_view_history: (resolved_can_view_history === undefined || resolved_can_view_history === null) ? 0 : Number(resolved_can_view_history),
        _matched_row: match || null
      };

      console.debug('[Attendance] loadUserPermissions ->', userPermissions);
    }).fail(() => {
      console.warn('[Attendance] loadUserPermissions failed — fallback to empty permissions');
      userPermissions = {};
      departmentsList = [];
    });
  }

  // ---------- parseAllowedIds ----------
  function parseAllowedIds(raw) {
    if (raw === null || raw === undefined) return null;
    if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);

    try {
      const maybe = typeof raw === 'string' ? raw.trim() : raw;
      if (typeof maybe === 'string' && (maybe.startsWith('[') || maybe.startsWith('{'))) {
        const parsedJson = JSON.parse(maybe);
        if (Array.isArray(parsedJson)) return parsedJson.map(String).map(s => s.trim()).filter(Boolean);
      }
    } catch (e) { /* ignore invalid JSON */ }

    const s = String(raw).trim();
    if (s === '') return [];
    if (s === '0') return ['0'];
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }

  // ---------- departments UI ----------
  function loadDepartments() {
    return $.getJSON(`${API_BASE}/get_departments.php`, data => {
      departmentsList = normalizeDepartments(data);
      console.debug('[Attendance] loadDepartments ->', departmentsList);

      const allowedRaw = userPermissions?.department_view;
      const parsed = parseAllowedIds(allowedRaw);
      console.debug('[Attendance] department_view raw/parsing ->', allowedRaw, parsed);

      let visibleDeps = [];
      if (parsed === null) {
        console.warn('[Attendance] department_view unknown -> fallback to user.department_id');
        visibleDeps = departmentsList.filter(d => String(d.id) === String(user.department_id));
      } else if (parsed.length === 1 && parsed[0] === '0') {
        visibleDeps = departmentsList.slice();
      } else if (parsed.length === 0) {
        visibleDeps = departmentsList.filter(d => String(d.id) === String(user.department_id));
      } else {
        const ids = new Set(parsed.map(String));
        visibleDeps = departmentsList.filter(d => ids.has(String(d.id)));
      }

      $departmentFilter.empty();
      if (visibleDeps.length > 1) $departmentFilter.append(`<option value="">ทุกแผนก</option>`);
      visibleDeps.forEach(dep => $departmentFilter.append(`<option value="${dep.id}">${dep.name}</option>`));
      if (visibleDeps.length > 1) $departmentFilter.val('');
      else if (visibleDeps.length === 1) $departmentFilter.val(String(visibleDeps[0].id));
      else $departmentFilter.val(String(user.department_id || ''));
    }).fail(() => {
      $departmentFilter.html('<option value="">ทุกแผนก</option>');
      departmentsList = [];
    });
  }

  // ---------- date picker ----------
  function initDatePicker() {
    if (fp && fp.destroy) fp.destroy();
    fp = flatpickr('#datePicker', {
      dateFormat: 'Y-m-d',
      locale: 'th',
      defaultDate: today(),
      maxDate: new Date(),
      onChange: () => {
        editMode = false;
        if (multiEditor) { try { multiEditor.hide(); } catch(e){} }
        multiEditorActive = false;
        updateButtons();
        loadAttendance();
      },
      onDayCreate: (_, __, ___, dayElem) => {
        try {
          if (datesWithData.has(formatDateKey(dayElem.dateObj))) dayElem.classList.add('has-data');
        } catch (e) { console.warn('onDayCreate', e); }
      }
    });
  }

  // ---------- draft helpers ----------
  function saveDraft(userId, field, value) {
    if (!editedData[userId]) editedData[userId] = {};
    editedData[userId][field] = value;
  }
  function applyDrafts() {
    Object.entries(editedData).forEach(([uid, fields]) => {
      Object.entries(fields).forEach(([field, val]) => {
        if (field === 'ot_result') {
          const name = `ot_result_${uid}`;
          $(`[name="${name}"]`).prop('checked', false);
          if (val === undefined || val === null) return;
          $(`[name="${name}"][value="${val}"]`).prop('checked', true);
        } else {
          const $el = $(`[data-user="${uid}"].${field}`);
          if ($el.length && $el.is(':checkbox')) $el.prop('checked', !!val);
          else if ($el.length) $el.val(val);
        }
      });
    });
  }

  // ---------- formatters (exposed on window) ----------
  window.presentFormatter = (v, row) => {
    const checked = (editedData[row.user_id]?.present ?? v) == 1 ? 'checked' : '';
    return `<input type="checkbox" class="form-check-input present-checkbox present" data-user="${row.user_id}" ${checked} ${editMode ? '' : 'disabled'}>`;
  };
  window.clockInFormatter = (v,row) => {
    const value = editedData[row.user_id]?.clock_in ?? (v ? String(v).substring(0,5) : '08:00');
    return editMode ? `<input type="text" class="form-control form-control-sm time-input clock_in" data-user="${row.user_id}" value="${value}">` : formatTimeCell(value);
  };
  window.clockOutFormatter = (v,row) => {
    const value = editedData[row.user_id]?.clock_out ?? (v ? String(v).substring(0,5) : '17:00');
    return editMode ? `<input type="text" class="form-control form-control-sm time-input clock_out" data-user="${row.user_id}" value="${value}">` : formatTimeCell(value);
  };
  window.otStartFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_start ?? (v ? String(v).substring(0,5) : '');
    return editMode ? `<input type="text" class="form-control form-control-sm ot-input ot-start ot_start" data-user="${row.user_id}" value="${value}">` : formatTimeCell(value);
  };
  window.otEndFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_end ?? (v ? String(v).substring(0,5) : '');
    return editMode ? `<input type="text" class="form-control form-control-sm ot-input ot-end ot_end" data-user="${row.user_id}" value="${value}">` : formatTimeCell(value);
  };
  window.breakMinutesFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_minutes ?? (v ?? '');
    return editMode ? `<input type="number" min="0" class="form-control form-control-sm ot-input ot-minutes ot_minutes" data-user="${row.user_id}" value="${value}">` : (value !== '' && value !== null ? `<div class="text-center">${value}</div>` : '');
  };
  window.otTaskFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_task ?? v ?? '';
    return editMode ? `<input type="text" class="form-control form-control-sm ot-input ot-task ot_task" data-user="${row.user_id}" value="${$('<div>').text(value).html()}">` : $('<div>').text(value).html();
  };
  window.productCountFormatter = (v,row) => {
    const value = editedData[row.user_id]?.product_count ?? (v ?? '');
    return editMode ? `<input type="number" min="0" class="form-control form-control-sm ot-input product-count product_count" data-user="${row.user_id}" value="${value}">` : (value !== '' && value !== null ? `<div class="text-center">${value}</div>` : '');
  };
  window.otResultFormatter = (v,row) => {
    const cur = (editedData[row.user_id]?.ot_result ?? (v === null || v === undefined ? '' : String(v)));
    if (editMode) {
      const uid = row.user_id;
      const val1 = cur === '1' ? 'checked' : '';
      const val0 = cur === '0' ? 'checked' : '';
      return `<div class="d-flex gap-2 justify-content-center">
        <div class="form-check form-check-inline">
          <input class="form-check-input ot-result radio-yes" type="radio" name="ot_result_${uid}" value="1" data-user="${uid}" ${val1}>
          <label class="form-check-label small">ได้ตามเป้า</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input ot-result radio-no" type="radio" name="ot_result_${uid}" value="0" data-user="${uid}" ${val0}>
          <label class="form-check-label small">ไม่ได้ตามเป้า</label>
        </div>
      </div>`;
    } else {
      if (String(v) === '1') return 'ได้ตามเป้า';
      if (String(v) === '0') return 'ไม่ได้ตามเป้า';
      return '';
    }
  };
  window.notesFormatter = (v,row) => {
    const value = editedData[row.user_id]?.notes ?? v ?? '';
    return editMode ? `<textarea class="notes-editor notes" data-user="${row.user_id}">${$('<div>').text(value).html()}</textarea>` : $('<div>').text(value).html();
  };
  window.dateModifiedFormatter = v => formatDateTimeCell(v);

  // ---------- bootstrap-table options ----------
  const tableOptions = {
    url: `${API_BASE}/get_attendance.php`,
    sidePagination: 'server',
    pagination: true,
    pageSize: 10,
    search: true,
    clickToSelect: true,
    showColumns: true,
    showExport: true,
    exportTypes: ['excel','csv','txt'],
    toolbar: '#customToolbar',
    maintainSelected: true,
    queryParams: p => ({ ...p, date: $datePicker.val(), department_id: $departmentFilter.val(), allowed_departments: userPermissions?.department_view || "0" }),
    responseHandler: res => {
      (res.rows || []).forEach(r => {
        r.date_work = $datePicker.val();
        r.present_text = (Number(r.present) === 1) ? 'มา' : '';
        r.ot_result_text = (r.ot_result === null || r.ot_result === undefined) ? '' : (Number(r.ot_result) === 1 ? 'ได้ตามเป้า' : 'ไม่ได้ตามเป้า');
        r.clock_in = r.clock_in ? String(r.clock_in).substring(0,5) : null;
        r.clock_out = r.clock_out ? String(r.clock_out).substring(0,5) : null;
        r.ot_start = r.ot_start ? String(r.ot_start).substring(0,5) : null;
        r.ot_end = r.ot_end ? String(r.ot_end).substring(0,5) : null;
      });

      // build originalData preserving nulls
      originalData = {};
      (res.rows || []).forEach(r => {
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

      return res;
    },
    rowStyle: () => ({ classes: 'employee-row' }),
    onPostBody: () => {
      if (editMode) {
        initOTInputs();
        applyDrafts();
        applySelections();
      } else {
        $table.find('input,textarea').off('input change');
      }
      setSelectionEnabled(!!(editMode && multiEditorActive));
    }
  };

  // ---------- table init / refresh ----------
  function initTable() {
    try { $table.off('.attendance'); } catch(e){}
    if (!$table.data('bootstrap.table')) {
      $table.bootstrapTable(tableOptions);

      // selection handlers (namespaced)
      $table.on('check.bs.table.attendance', (e, row) => {
        if (!multiEditorActive) {
          try {
            if (row && row.user_id !== undefined) $table.bootstrapTable('uncheckBy', { field: 'user_id', values: [row.user_id] });
            else $table.bootstrapTable('uncheckAll');
          } catch(e){}
          return;
        }
        if (row && row.user_id) selectedRows.add(Number(row.user_id));
      });
      $table.on('uncheck.bs.table.attendance', (e, row) => { if (!multiEditorActive) return; if (row && row.user_id) selectedRows.delete(Number(row.user_id)); });
      $table.on('check-all.bs.table.attendance', (e, rows) => {
        if (!multiEditorActive) { try { $table.bootstrapTable('uncheckAll'); } catch(e){}; return; }
        (rows || []).forEach(r => { if (r && r.user_id) selectedRows.add(Number(r.user_id)); });
      });
      $table.on('uncheck-all.bs.table.attendance', (e, rows) => { if (!multiEditorActive) return; (rows || []).forEach(r => { if (r && r.user_id) selectedRows.delete(Number(r.user_id)); }); });

      $table.on('load-success.bs.table.attendance', () => {
        try { if (editMode) $table.bootstrapTable('showColumn', 'state'); else $table.bootstrapTable('hideColumn', 'state'); } catch (e) {}
      });
    } else {
      $table.bootstrapTable('refreshOptions', tableOptions);
    }
  }
  function loadAttendance() {
    if ($table.data('bootstrap.table')) $table.bootstrapTable('refresh', { silent: true });
    else initTable();
  }

  // ---------- in-row editors ----------
  function initOTInputs() {
    $('.time-input, .ot-start, .ot-end').each(function () {
      if (!$(this).data('flat')) {
        try { flatpickr(this, { enableTime:true, noCalendar:true, dateFormat:'H:i', time_24hr:true }); } catch(e) {}
        $(this).data('flat', true);
      }
    });

    $('.ot-start,.ot-end').each(function () {
      if (!$(this).parent().find('.btn-clear-ot').length) {
        $(this).wrap('<div class="input-group"></div>')
          .after('<button type="button" class="btn btn-outline-secondary btn-clear-ot" aria-label="clear">&times;</button>');
      }
    });

    $('.btn-clear-ot').off('click').on('click', function() {
      const $i = $(this).siblings('input');
      if ($i[0] && $i[0]._flatpickr) $i[0]._flatpickr.clear();
      $i.val('');
      $i.trigger('change');
    });

    $table.find('input,textarea').off('input.changeKey').on('input.changeKey change.changeKey', function() {
      const uid = $(this).data('user');
      const classes = (this.className || '').split(' ');
      let field = classes.find(c => ['present','clock_in','clock_out','ot_start','ot_end','ot_task','ot_result','notes','ot_minutes','product_count'].includes(c));
      if (!field && $(this).is(':radio') && (this.name || '').startsWith('ot_result_')) field = 'ot_result';
      if (!field) return;
      let val;
      if ($(this).is(':checkbox')) {
        if ($(this).hasClass('present-checkbox')) val = $(this).prop('checked') ? 1 : 0;
        else return;
      } else if ($(this).is(':radio')) {
        val = $(this).val(); if (val !== undefined) val = Number(val);
      } else val = $(this).val();
      saveDraft(uid, field, val);
    });
  }

  function applySelections() {
    try {
      const vals = Array.from(selectedRows);
      if (!vals.length) { $table.bootstrapTable('uncheckAll'); return; }
      $table.bootstrapTable('uncheckAll');
      $table.bootstrapTable('checkBy', { field: 'user_id', values: vals });
    } catch (e) { console.warn('applySelections failed', e); }
  }

  // ---------- UI buttons ----------
  function updateButtons() {
    try {
      if (editMode) {
        $('#btnEdit').addClass('d-none').hide();
        $('#btnSave, #btnCancel').removeClass('d-none').show();
        $btnTogglePresent.removeClass('d-none').show();
        $btnMultiEditor.removeClass('d-none').show();
        if ($table.data('bootstrap.table')) try { $table.bootstrapTable('showColumn', 'state'); } catch (e) {}
      } else {
        $('#btnSave, #btnCancel').addClass('d-none').hide();
        $btnTogglePresent.addClass('d-none').hide();
        $btnMultiEditor.addClass('d-none').hide();
        if ($table.data('bootstrap.table')) try { $table.bootstrapTable('hideColumn', 'state'); } catch (e) {}
        applyPermissions();
      }
      if ($table.data('bootstrap.table')) try { $table.bootstrapTable('refresh', { silent: true }); } catch(e) {}
    } catch (e) { console.warn('updateButtons failed', e); }
  }

  // ---------- permissions (single implementation) ----------
  function applyPermissions() {
    if (!userPermissions) {
      console.warn('[Attendance] applyPermissions: userPermissions undefined -> hiding controls by default');
      $('#btnEdit').addClass('d-none').hide();
      $('#navHistoryLink, a[data-page="page/History/History.php"]').addClass('d-none').hide();
      return;
    }

    const canEditUser = Number(userPermissions.can_edit || 0) === 1;
    const canViewHistoryUser = Number(userPermissions.can_view_history || 0) === 1;

    const rawSelected = $departmentFilter.val();
    const selectedDeptId = (rawSelected && String(rawSelected).length) ? String(rawSelected) : String(userPermissions.department_id ?? user.department_id ?? '');
    const deptRow = departmentsList.find(d => String(d.id) === String(selectedDeptId)) || null;

    const selectedDeptCanEdit = !!(deptRow && Number(deptRow.can_edit || 0) === 1);
    const selectedDeptCanViewHistory = !!(deptRow && Number(deptRow.can_view_history || 0) === 1);

    const allowEdit = canEditUser || selectedDeptCanEdit;
    const allowHistory = canViewHistoryUser || selectedDeptCanViewHistory;

    console.debug('[Attendance] applyPermissions ->', { userPermissions, selectedDeptId, deptRow, allowEdit, allowHistory });

    if (allowEdit) $('#btnEdit').removeClass('d-none').show();
    else { $('#btnEdit').addClass('d-none').hide(); if (editMode) { editMode = false; updateButtons(); } }

    const $historyById = $('#navHistoryLink');
    const $historyByAttr = $('a[data-page="page/History/History.php"]');
    if (allowHistory) { if ($historyById.length) $historyById.removeClass('d-none').show(); if ($historyByAttr.length) $historyByAttr.removeClass('d-none').show(); }
    else { if ($historyById.length) $historyById.addClass('d-none').hide(); if ($historyByAttr.length) $historyByAttr.addClass('d-none').hide(); }
  }

  // default hide (on boot)
  $('#btnEdit').addClass('d-none').hide();
  $('#btnSave, #btnCancel').addClass('d-none').hide();
  $('#navHistoryLink, a[data-page="page/History/History.php"]').addClass('d-none').hide();

  // ---------- events ----------
  $('#btnEdit').on('click', () => { editMode = true; updateButtons(); initOTInputs(); applyDrafts(); applySelections(); });
  $('#btnCancel').on('click', () => {
    editMode = false; editedData = {}; multiEditorActive = false;
    if (multiEditor) try { multiEditor.hide(); } catch(e){}
    $btnMultiEditor.removeClass('active'); updateButtons(); loadAttendance();
  });
  $('#btnSave').on('click', saveAttendance);

  $btnTogglePresent.on('click', () => {
    if (!editMode) return;
    const $c = $('.present-checkbox');
    const allChecked = $c.length && $c.filter(':checked').length === $c.length;
    $c.prop('checked', !allChecked).trigger('change');
  });

  $btnMultiEditor.on('click', () => {
    if (!editMode) return;
    multiEditorActive = !multiEditorActive;
    if (multiEditorActive) { try { if (multiEditor) multiEditor.show(); } catch(e){} $btnMultiEditor.addClass('active'); }
    else { try { if (multiEditor) multiEditor.hide(); } catch(e){} $btnMultiEditor.removeClass('active'); }
    setSelectionEnabled(!!(editMode && multiEditorActive));
  });

  $('#btnDownload').on('click', () => {
    const url = `${API_BASE}/export_attendance.php?date=${encodeURIComponent($datePicker.val())}` + ($departmentFilter.val() ? `&department_id=${$departmentFilter.val()}` : '');
    window.location.href = url;
  });

  $departmentFilter.on('change', () => { loadAttendance(); applyPermissions(); });

  // ---------- save ----------
  function saveAttendance() {
    const date = $datePicker.val();
    const records = [];

    Object.entries(editedData).forEach(([uid, fields]) => {
      const orig = originalData[uid] || {};
      const changed = Object.keys(fields).some(f => {
        const a = fields[f]; const b = orig[f];
        if ((a === '' || a === null || a === undefined) && (b === '' || b === null || b === undefined)) return false;
        return String(a) !== String(b);
      });
      if (changed) {
        const rec = { user_id: parseInt(uid,10) };
        ['present','clock_in','clock_out','ot_start','ot_end','ot_minutes','ot_task','product_count','ot_result','notes'].forEach(k => {
          if (fields[k] !== undefined) rec[k] = fields[k];
        });
        records.push(rec);
      }
    });

    if (records.length === 0) {
      alert('ไม่มีการเปลี่ยนแปลง');
      editMode = false; multiEditorActive = false;
      if (multiEditor) try { multiEditor.hide(); } catch(e){}
      $btnMultiEditor.removeClass('active'); updateButtons();
      return;
    }

    $.ajax({
      url: `${API_BASE}/save_attendance.php`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ date, records }),
      success: resp => {
        if (resp.status === 'ok') {
          editMode = false; editedData = {}; multiEditorActive = false;
          if (multiEditor) try { multiEditor.hide(); } catch(e){}
          $btnMultiEditor.removeClass('active'); updateButtons(); loadAttendance();
          loadDatesWithData().always(() => { if (fp && fp.redraw) fp.redraw(); });
          alert('บันทึกเรียบร้อย');
        } else alert('เกิดข้อผิดพลาด: ' + (resp.message || 'ไม่ทราบสาเหตุ'));
      },
      error: () => alert('บันทึกไม่สำเร็จ')
    });
  }

  // ---------- MultiEditor callback ----------
  function handleMultiEditorApply(records) {
    records.forEach(rec => {
      const uid = String(rec.user_id);
      if (!editedData[uid]) editedData[uid] = {};
      ['present','clock_in','clock_out','ot_start','ot_end','ot_minutes','ot_task','product_count','ot_result','notes'].forEach(k => {
        if (rec.hasOwnProperty(k)) editedData[uid][k] = rec[k];
      });
      selectedRows.add(Number(uid));
    });
    applyDrafts(); initOTInputs(); applySelections();
  }

  // ---------- boot ----------
  $(function () {
    console.debug('[Attendance] user loaded (from MockUser):', user);
    $('#btnEdit, #btnSave, #btnCancel').hide();
    $('a[data-page="page/History/History.php"]').hide();

    window._debug_permissions = function() {
      console.debug('[Attendance] DEBUG -> mock user:', user);
      console.debug('[Attendance] DEBUG -> userPermissions:', userPermissions);
      console.debug('[Attendance] DEBUG -> departmentsList:', departmentsList);
      console.debug('[Attendance] DEBUG -> selectedRows:', Array.from(selectedRows));
    };

    $.when(loadUserPermissions()).then(() => {
      $.when(loadDatesWithData(), loadDepartments()).always(() => {
        if (!$datePicker.val()) $datePicker.val(today());
        initDatePicker(); initTable(); applyPermissions();

        // init MultiEditor
        try {
          multiEditor = MultiEditorFactory();
          multiEditor.init({ containerSelector: '#pageContent', tableSelector: '#attendanceTable', applyCallback: handleMultiEditorApply });

          if (multiEditor && typeof multiEditor.onSelectionChange === 'function') {
            let _selChangeTimer = null;
            multiEditor.onSelectionChange(keys => {
              selectedRows = new Set((keys || []).map(k => Number(k)));
              if (_selChangeTimer) clearTimeout(_selChangeTimer);
              _selChangeTimer = setTimeout(() => { _selChangeTimer = null; try { applySelections(); } catch(e){ console.warn('applySelections failed', e); } }, 40);
            });
          }

          // when multiEditor shown, sync keys back
          $(document).on('multiEditor:shown', () => {
            if (typeof multiEditor.setSelectedKeys === 'function') {
              setTimeout(() => {
                try { multiEditor.setSelectedKeys(Array.from(selectedRows).map(x => String(x))); }
                catch(e){ console.warn('setSelectedKeys failed', e); }
              }, 50);
            }
          });

        } catch(e) { console.warn('MultiEditor init failed', e); }

        // external hide/show handlers
        $(document).on('multiEditor:hidden', () => {
          multiEditorActive = false; $btnMultiEditor.removeClass('active'); setSelectionEnabled(false);
        });
        $(document).on('multiEditor:shown', () => setSelectionEnabled(!!(editMode && multiEditorActive)));

      });
    });
  });

  // expose cleanup
  try {
    window._attendance_cleanup = function() {
      if (multiEditor) { try { multiEditor.hide(); } catch(e){} }
      try { $table.off('.attendance'); } catch(e){}
      $(document).off('multiEditor:hidden multiEditor:shown');
    };
  } catch(e){}

})(jQuery);
