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

  // selection set (user_id numbers)
  let selectedRows = new Set();

  // MultiEditor
  let multiEditor = null;
  let multiEditorActive = false;

  // ---------- utils ----------
  function today() { return new Date().toISOString().slice(0, 10); }
  function formatDateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function formatTimeCell(v) { if (!v) return ''; const hhmm = String(v).substring(0,5); return `<div class="text-center">${hhmm} น.</div>`; }
  function formatDateTimeCell(v) { if (!v) return ''; return String(v).replace('T',' ').substring(0,16); }

  // ---------- selection control ----------
  function setSelectionEnabled(enabled) {
    // enable/disable header & row checkboxes used by bootstrap-table
    try {
      const $wrapper = $table.closest('.bootstrap-table');
      $wrapper.find('input[name="btSelectItem"], input[name="btSelectAll"]').prop('disabled', !enabled);
      // visual cursor
      $wrapper.find('.fixed-table-body table tbody tr').css('cursor', enabled ? 'pointer' : 'default');

      if (!enabled) {
        try { $table.bootstrapTable('uncheckAll'); } catch(e) {}
        selectedRows.clear();
      }
    } catch(e) { console.warn('setSelectionEnabled', e); }
  }

  // ---------- preload ----------
  function loadDatesWithData() {
    return $.getJSON(`${API_BASE}/get_dates.php`, list => {
      datesWithData = new Set((list || []).map(s => String(s)));
    }).fail(() => { datesWithData = new Set(); });
  }

  function loadUserPermissions() {
    return $.getJSON(`${API_BASE}/get_departments.php?department_id=${user.department_id}`, data => {
      userPermissions = data || {};
      console.debug('[Attendance] loaded userPermissions', userPermissions);
    }).fail(() => { userPermissions = {}; });
  }

  function parseAllowedIds(raw) {
    if (raw === null || raw === undefined) return null;
    const s = String(raw).trim();
    if (s === '') return [];
    if (s === '0') return ['0'];
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }

  function loadDepartments() {
    return $.getJSON(`${API_BASE}/get_departments.php`, data => {
      departmentsList = data || [];

      const allowedRaw = userPermissions?.department_view;
      const parsed = parseAllowedIds(allowedRaw);
      console.debug('[Attendance] department_view raw/parsing:', allowedRaw, parsed);

      let visibleDeps = [];

      if (parsed === null) {
        visibleDeps = departmentsList.filter(d => String(d.id) === String(user.department_id));
        console.warn('[Attendance] department_view missing, default to user department:', user.department_id);
      } else if (parsed.length === 1 && parsed[0] === '0') {
        visibleDeps = departmentsList.slice();
      } else if (parsed.length === 0) {
        visibleDeps = departmentsList.filter(d => String(d.id) === String(user.department_id));
        console.warn('[Attendance] department_view empty array, default to user department');
      } else {
        const ids = new Set(parsed.map(String));
        visibleDeps = departmentsList.filter(d => ids.has(String(d.id)));
      }

      $departmentFilter.empty();
      if (visibleDeps.length > 1) {
        $departmentFilter.append(`<option value="">ทุกแผนก</option>`);
      }
      visibleDeps.forEach(dep => {
        $departmentFilter.append(`<option value="${dep.id}">${dep.name}</option>`);
      });

      const hasUserDept = visibleDeps.some(d => String(d.id) === String(user.department_id));
      if (hasUserDept) {
        $departmentFilter.val(String(user.department_id));
      } else if (visibleDeps.length === 1) {
        $departmentFilter.val(String(visibleDeps[0].id));
      }

    }).fail(() => {
      $departmentFilter.html('<option value="">ทุกแผนก</option>');
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
        // hide multiEditor when changing date
        if (multiEditor) { try { multiEditor.hide(); } catch(e){} }
        multiEditorActive = false;
        updateButtons();
        loadAttendance();
      },
      onDayCreate: (_, __, ___, dayElem) => {
        try {
          if (datesWithData.has(formatDateKey(dayElem.dateObj))) {
            dayElem.classList.add('has-data');
          }
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
        // radio group special-case
        if (field === 'ot_result') {
          const name = `ot_result_${uid}`;
          $(`[name="${name}"]`).prop('checked', false);
          if (val === undefined || val === null) return;
          $(`[name="${name}"][value="${val}"]`).prop('checked', true);
        } else {
          const $el = $(`[data-user="${uid}"].${field}`);
          if ($el.length && $el.is(':checkbox')) {
            $el.prop('checked', !!val);
          } else if ($el.length) {
            $el.val(val);
          }
        }
      });
    });
  }

  // ---------- formatters ----------
  window.presentFormatter = (v, row) => {
    const checked = (editedData[row.user_id]?.present ?? v) == 1 ? 'checked' : '';
    return `<input type="checkbox" class="form-check-input present-checkbox present"
            data-user="${row.user_id}" ${checked} ${editMode?'':'disabled'}>`;
  };

  window.clockInFormatter = (v,row) => {
    const value = editedData[row.user_id]?.clock_in ?? (v ? v.substring(0,5) : '08:00');
    return editMode
      ? `<input type="text" class="form-control form-control-sm time-input clock_in"
                data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };

  window.clockOutFormatter = (v,row) => {
    const value = editedData[row.user_id]?.clock_out ?? (v ? v.substring(0,5) : '17:00');
    return editMode
      ? `<input type="text" class="form-control form-control-sm time-input clock_out"
                data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };

  window.otStartFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.ot_start ?? (v ? v.substring(0,5) : '');
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-start ot_start"
              data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };

  window.otEndFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.ot_end ?? (v ? v.substring(0,5) : '');
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-end ot_end"
              data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };

  window.breakMinutesFormatter = (v,row) => {
    const value = editedData[row.user_id]?.ot_minutes ?? (v ?? '');
    return editMode
      ? `<input type="number" min="0" class="form-control form-control-sm ot-input ot-minutes ot_minutes"
             data-user="${row.user_id}" value="${value}">`
      : (value !== '' && value !== null ? `<div class="text-center">${value}</div>` : '');
  };

  window.otTaskFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.ot_task ?? v ?? '';
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-task ot_task"
              data-user="${row.user_id}" value="${value}">`
      : $('<div>').text(value).html();
  };

  window.productCountFormatter = (v,row) => {
    const value = editedData[row.user_id]?.product_count ?? (v ?? '');
    return editMode
      ? `<input type="number" min="0" class="form-control form-control-sm ot-input product-count product_count"
             data-user="${row.user_id}" value="${value}">`
      : (value !== '' && value !== null ? `<div class="text-center">${value}</div>` : '');
  };

  window.otResultFormatter = (v,row) => {
    const cur = (editedData[row.user_id]?.ot_result ?? (v === null || v === undefined ? '' : String(v)));
    const checkedVal = (cur === '' || cur === null) ? null : String(cur);
    if (editMode) {
      const uid = row.user_id;
      const val1 = checkedVal === '1' ? 'checked' : '';
      const val0 = checkedVal === '0' ? 'checked' : '';
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

  window.notesFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.notes ?? v ?? '';
    return editMode
      ? `<textarea class="notes-editor notes" data-user="${row.user_id}">${$('<div>').text(value).html()}</textarea>`
      : $('<div>').text(value).html();
  };

  window.dateModifiedFormatter = (v)=> formatDateTimeCell(v);

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
    queryParams: p => ({
      ...p,
      date: $datePicker.val(),
      department_id: $departmentFilter.val(),
      allowed_departments: userPermissions?.department_view || "0"
    }),
    responseHandler: res => {
      (res.rows || []).forEach(r => {
        r.date_work = $datePicker.val();
        r.present_text = (Number(r.present) === 1) ? 'มา' : '';
        r.ot_result_text = (Number(r.ot_result) === 1) ? 'ได้ตามเป้า' : 'ไม่ได้ตามเป้า';
        r.clock_in = r.clock_in ? String(r.clock_in).substring(0,5) : '08:00';
        r.clock_out = r.clock_out ? String(r.clock_out).substring(0,5) : '17:00';
        r.ot_start = r.ot_start ? String(r.ot_start).substring(0,5) : null;
        r.ot_end = r.ot_end ? String(r.ot_end).substring(0,5) : null;
      });

      originalData = {};
      (res.rows || []).forEach(r => {
        originalData[r.user_id] = {
          present: Number(r.present ?? 0),
          clock_in: r.clock_in ? String(r.clock_in) : null,
          clock_out: r.clock_out ? String(r.clock_out) : null,
          ot_start: r.ot_start ? String(r.ot_start) : null,
          ot_end:   r.ot_end   ? String(r.ot_end)   : null,
          ot_task: r.ot_task || null,
          ot_result: Number(r.ot_result ?? 0),
          ot_approver_id: r.ot_approver_id ? Number(r.ot_approver_id) : null,
          notes: r.notes || null,
          ot_minutes: r.ot_minutes !== undefined ? (r.ot_minutes === null ? null : Number(r.ot_minutes)) : null,
          product_count: r.product_count !== undefined ? (r.product_count === null ? null : Number(r.product_count)) : null
        };
      });

      return res;
    },
    rowStyle: () => ({ classes: 'employee-row' }),
    onPostBody: () => {
      // initialize editors when in editmode
      if (editMode) {
        initOTInputs();
        applyDrafts();
        applySelections();
      } else {
        $table.find('input,textarea').off('input change');
      }
      // ensure checkboxes enabled/disabled according to MultiEditor state
      setSelectionEnabled(!!(editMode && multiEditorActive));
    }
  };

  // ---------- table init / refresh ----------
  function initTable() {
    if (!$table.data('bootstrap.table')) {
      $table.bootstrapTable(tableOptions);

      // attach selection events (bootstrap-table events)
      $table.on('check.bs.table', function (e, row) {
        if (!multiEditorActive) {
          // prevent selection if multi editor not active
          try { $table.bootstrapTable('uncheck', row); } catch(e) {}
          return;
        }
        if (row && row.user_id) selectedRows.add(Number(row.user_id));
      });
      $table.on('uncheck.bs.table', function (e, row) {
        if (!multiEditorActive) return;
        if (row && row.user_id) selectedRows.delete(Number(row.user_id));
      });
      $table.on('check-all.bs.table', function (e, rows) {
        if (!multiEditorActive) {
          try { $table.bootstrapTable('uncheckAll'); } catch(e) {}
          return;
        }
        (rows || []).forEach(r => { if (r && r.user_id) selectedRows.add(Number(r.user_id)); });
      });
      $table.on('uncheck-all.bs.table', function (e, rows) {
        if (!multiEditorActive) return;
        (rows || []).forEach(r => { if (r && r.user_id) selectedRows.delete(Number(r.user_id)); });
      });

      // after initial load, ensure column visibility according to editMode
      $table.on('load-success.bs.table', function () {
        try {
          if (editMode) $table.bootstrapTable('showColumn', 'state');
          else $table.bootstrapTable('hideColumn', 'state');
        } catch (e) { /* ignore */ }
      });

    } else {
      $table.bootstrapTable('refreshOptions', tableOptions);
    }
  }
  function loadAttendance() {
    if ($table.data('bootstrap.table')) {
      $table.bootstrapTable('refresh', { silent: true });
    } else {
      initTable();
    }
  }

  // ---------- in-row editors ----------
  function initOTInputs() {
    // time pickers: clock_in, clock_out, ot-start, ot-end
    $('.time-input, .ot-start, .ot-end').each(function () {
      if (!$(this).data('flat')) {
        try {
          flatpickr(this, { enableTime:true, noCalendar:true, dateFormat:'H:i', time_24hr:true });
        } catch(e) { /* ignore */ }
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

    // change event tracking (including radio)
    $table.find('input,textarea').off('input change').on('input change', function() {
      const uid = $(this).data('user');
      // detect field class
      const classes = (this.className || '').split(' ');
      let field = classes.find(c => ['present','clock_in','clock_out','ot_start','ot_end','ot_task','ot_result','notes','ot_minutes','product_count'].includes(c));
      // radio inputs fallback
      if (!field && $(this).is(':radio') && (this.name || '').startsWith('ot_result_')) {
        field = 'ot_result';
      }
      if (!field) return;
      let val;
      if ($(this).is(':checkbox')) {
        if ($(this).hasClass('present-checkbox')) {
          val = $(this).prop('checked') ? 1 : 0;
        } else {
          return;
        }
      } else if ($(this).is(':radio')) {
        val = $(this).val();
        if (val !== undefined) val = Number(val);
      } else {
        val = $(this).val();
      }
      saveDraft(uid, field, val);
    });
  }

  // apply selections (programmatically check rows whose user_id in selectedRows)
  function applySelections() {
    try {
      const vals = Array.from(selectedRows);
      if (!vals.length) {
        $table.bootstrapTable('uncheckAll');
        return;
      }
      $table.bootstrapTable('uncheckAll');
      $table.bootstrapTable('checkBy', { field: 'user_id', values: vals });
    } catch (e) {
      console.warn('applySelections failed', e);
    }
  }

  // ---------- UI buttons ----------
  function updateButtons() {
    $('#btnEdit').toggleClass('d-none', editMode);
    $('#btnSave, #btnCancel').toggleClass('d-none', !editMode);
    $btnTogglePresent.toggleClass('d-none', !editMode);
    $btnMultiEditor.toggleClass('d-none', !editMode);

    if (!editMode) {
      // hide multiEditor when leaving edit mode
      multiEditorActive = false;
      if (multiEditor) try { multiEditor.hide(); } catch(e){}
      $btnMultiEditor.removeClass('active');
      setSelectionEnabled(false);
    }

    if ($table.data('bootstrap.table')) {
      try {
        if (editMode) {
          $table.bootstrapTable('showColumn', 'state');
        } else {
          $table.bootstrapTable('hideColumn', 'state');
        }
      } catch (e) {
        console.warn('show/hide column failed', e);
      }
      $table.bootstrapTable('refresh', { silent: true });
    }
  }

  // ---------- role / permission ----------
  function applyPermissions() {
    const permDeptCanEdit = !!(userPermissions && (String(userPermissions.can_edit) === '1' || Number(userPermissions.can_edit) === 1 || userPermissions.can_edit === true));
    const permDeptCanViewHistory = !!(userPermissions && (String(userPermissions.can_view_history) === '1' || Number(userPermissions.can_view_history) === 1 || userPermissions.can_view_history === true));

    const isAdmin = !!(user && (String(user.is_admin) === '1' || user.is_admin === true));
    const isManager = !!(user && (String(user.is_manager) === '1' || user.is_manager === true));
    const userCanEdit = !!(user && (String(user.can_edit) === '1' || user.can_edit === true));
    const userCanViewHistory = !!(user && (String(user.can_view_history) === '1' || user.can_view_history === true));

    const selectedDeptId = $departmentFilter.val();
    const deptRow = departmentsList.find(d => String(d.id) === String(selectedDeptId)) || null;
    const selectedDeptCanEdit = !!(deptRow && (String(deptRow.can_edit) === '1' || Number(deptRow.can_edit) === 1 || deptRow.can_edit === true));
    const selectedDeptCanViewHistory = !!(deptRow && (String(deptRow.can_view_history) === '1' || Number(deptRow.can_view_history) === 1 || deptRow.can_view_history === true));

    const managerOfSelected = isManager && selectedDeptId && String(user.department_id) === String(selectedDeptId);

    const allowEdit = isAdmin || userCanEdit || permDeptCanEdit || selectedDeptCanEdit || managerOfSelected;
    const allowHistory = isAdmin || userCanViewHistory || permDeptCanViewHistory || selectedDeptCanViewHistory;

    if (allowEdit) {
      $('#btnEdit, #btnSave, #btnCancel').show();
    } else {
      $('#btnEdit, #btnSave, #btnCancel').hide();
    }

    if (allowHistory) $('a[href="../History/History.php"]').show(); else $('a[href="../History/History.php"]').hide();

    console.debug('[Attendance] permission eval', { user, userPermissions, selectedDeptId, selectedDeptCanEdit, allowEdit, allowHistory, managerOfSelected });
  }

  // ---------- events ----------
  $('#btnEdit').on('click', () => {
    editMode = true;
    updateButtons();
    initOTInputs();
    applyDrafts();
    applySelections();
  });
  $('#btnCancel').on('click', () => {
    editMode = false;
    editedData = {};
    // hide multi editor when cancelling
    multiEditorActive = false;
    if (multiEditor) try { multiEditor.hide(); } catch(e){}
    $btnMultiEditor.removeClass('active');
    updateButtons();
    loadAttendance();
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
    if (multiEditorActive) {
      try { if (multiEditor) multiEditor.show(); } catch(e){}
      $btnMultiEditor.addClass('active');
    } else {
      try { if (multiEditor) multiEditor.hide(); } catch(e){}
      $btnMultiEditor.removeClass('active');
    }
    // enable/disable checkboxes based on multiEditor state
    setSelectionEnabled(!!(editMode && multiEditorActive));
  });

  $('#btnDownload').on('click', () => {
    const url = `${API_BASE}/export_attendance.php?date=${encodeURIComponent($datePicker.val())}` + ($departmentFilter.val() ? `&department_id=${$departmentFilter.val()}` : '');
    window.location.href = url;
  });

  $departmentFilter.on('change', () => {
    loadAttendance();
    applyPermissions();
  });

  // ---------- save ----------
  function saveAttendance() {
    const date = $datePicker.val();
    const records = [];

    Object.entries(editedData).forEach(([uid, fields]) => {
      const orig = originalData[uid] || {};
      const changed = Object.keys(fields).some(f => {
        const a = fields[f];
        const b = orig[f];
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
      editMode = false;
      // hide multi editor when save finishes with no change
      multiEditorActive = false;
      if (multiEditor) try { multiEditor.hide(); } catch(e){}
      $btnMultiEditor.removeClass('active');
      updateButtons();
      return;
    }

    $.ajax({
      url: `${API_BASE}/save_attendance.php`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ date, records }),
      success: resp => {
        if (resp.status === 'ok') {
          editMode = false;
          editedData = {};
          // hide multi editor after save
          multiEditorActive = false;
          if (multiEditor) try { multiEditor.hide(); } catch(e){}
          $btnMultiEditor.removeClass('active');
          updateButtons();
          loadAttendance();
          loadDatesWithData().always(() => { if (fp && fp.redraw) fp.redraw(); });
          alert('บันทึกเรียบร้อย');
        } else {
          alert('เกิดข้อผิดพลาด: ' + (resp.message || 'ไม่ทราบสาเหตุ'));
        }
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
      // mark row selected for visual feedback
      selectedRows.add(Number(uid));
    });

    applyDrafts();
    initOTInputs();
    applySelections();
  }

  // ---------- boot ----------
  $(function () {
    console.debug('[Attendance] user loaded (from MockUser):', user);
    $.when(loadUserPermissions()).then(() => {
      $.when(loadDatesWithData(), loadDepartments()).always(() => {
        if (!$datePicker.val()) $datePicker.val(today());
        initDatePicker();
        initTable();
        applyPermissions();

        // init MultiEditor instance
        try {
          multiEditor = MultiEditorFactory();
          multiEditor.init({ containerSelector: '#pageContent', tableSelector: '#attendanceTable', applyCallback: handleMultiEditorApply });
        } catch(e) { console.warn('MultiEditor init failed', e); }

        // hide multieditor when external hide event or when clearing edit mode
        $(document).on('multiEditor:hidden', () => {
          multiEditorActive = false;
          $btnMultiEditor.removeClass('active');
          setSelectionEnabled(false);
        });
        $(document).on('multiEditor:shown', () => {
          setSelectionEnabled(!!(editMode && multiEditorActive));
        });

      });
    });
  });

  // expose cleanup
  try {
    window._attendance_cleanup = function() {
      if (multiEditor) { try { multiEditor.hide(); } catch(e){} }
    };
  } catch(e){}

})(jQuery);