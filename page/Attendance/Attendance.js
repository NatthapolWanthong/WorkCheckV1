// /page/Attendance/Attendance.js
import user from "../../page/MockUser.js";

(function ($) {
  'use strict';

  const API_BASE = 'connection';

  // ---------- DOM ----------
  const $table = $('#attendanceTable');
  const $datePicker = $('#datePicker');
  const $departmentFilter = $('#departmentFilter');
  const $btnTogglePresent = $('#btnTogglePresent');

  // ---------- state ----------
  let editMode = false;
  let datesWithData = new Set();
  let fp = null;
  let originalData = {};
  let editedData = {};
  let userPermissions = null;

  // ---------- utils ----------
  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function formatDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function formatTimeCell(v) {
    if (!v) return '';
    const hhmm = String(v).substring(0,5);
    return `<div class="text-center">${hhmm} น.</div>`;
  }
  function formatDateTimeCell(v) {
    if (!v) return '';
    return String(v).replace('T',' ').substring(0,16);
  }

  // ---------- preload ----------
  function loadDatesWithData() {
    return $.getJSON(`${API_BASE}/get_dates.php`, list => {
      datesWithData = new Set(list || []);
    });
  }

  function loadUserPermissions() {
    return $.getJSON(`${API_BASE}/get_departments.php?department_id=${user.department_id}`, data => {
      userPermissions = data || {};
    });
  }

  function loadDepartments() {
    return $.getJSON(`${API_BASE}/get_departments.php`, data => {
      $departmentFilter.empty();

      if (!userPermissions) return;

      let allowed = userPermissions.department_view;
      let visibleDeps = [];

      if (allowed === "0") {
        // HR → เห็นทุกแผนก
        visibleDeps = data || [];
      } else {
        const ids = allowed.split(",").map(x => x.trim());
        visibleDeps = (data || []).filter(dep => ids.includes(String(dep.id)));
      }

      if (visibleDeps.length > 1) {
        $departmentFilter.append(`<option value="">ทุกแผนก</option>`);
      }

      visibleDeps.forEach(dep => {
        $departmentFilter.append(`<option value="${dep.id}">${dep.name}</option>`);
      });
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
        updateButtons();
        loadAttendance();
      },
      onDayCreate: (_, __, ___, dayElem) => {
        if (datesWithData.has(formatDateKey(dayElem.dateObj))) {
          dayElem.classList.add('has-data');
        }
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
        const $el = $(`[data-user="${uid}"].${field}`);
        if ($el.is(':checkbox')) {
          $el.prop('checked', !!val);
        } else {
          $el.val(val);
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

  window.otStartFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.ot_start ?? v?.substring(0,5) ?? '';
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-start ot_start"
              data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };

  window.otEndFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.ot_end ?? v?.substring(0,5) ?? '';
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-end ot_end"
              data-user="${row.user_id}" value="${value}">`
      : formatTimeCell(value);
  };

  window.otTaskFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.ot_task ?? v ?? '';
    return editMode
      ? `<input type="text" class="form-control form-control-sm ot-input ot-task ot_task"
              data-user="${row.user_id}" value="${value}">`
      : $('<div>').text(value).html();
  };

  window.otResultFormatter = (v,row)=> {
    const checked = (editedData[row.user_id]?.ot_result ?? v) == 1 ? 'checked' : '';
    return `<input type="checkbox" class="form-check-input ot-result ot_result"
            data-user="${row.user_id}" ${checked} ${editMode?'':'disabled'}>`;
  };

  window.notesFormatter = (v,row)=> {
    const value = editedData[row.user_id]?.notes ?? v ?? '';
    return editMode
      ? `<textarea class="notes-editor notes" data-user="${row.user_id}">${value}</textarea>`
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
    onPostBody: () => { 
      if (editMode) {
        initOTInputs();
        applyDrafts();
      }
    }
  };

  // ---------- table init / refresh ----------
  function initTable() {
    if (!$table.data('bootstrap.table')) {
      $table.bootstrapTable(tableOptions);
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
    $('.ot-start,.ot-end').each(function () {
      if (!$(this).data('flat')) {
        $(this)
          .wrap('<div class="input-group"></div>')
          .after('<button type="button" class="btn btn-outline-secondary btn-clear-ot" aria-label="clear">&times;</button>');
        flatpickr(this, { enableTime:true, noCalendar:true, dateFormat:'H:i', time_24hr:true });
        $(this).data('flat', true);
      }
    });

    $('.btn-clear-ot').off('click').on('click', function() {
      const $i = $(this).siblings('input');
      if ($i[0]._flatpickr) $i[0]._flatpickr.clear();
    });

    // ✅ track changes
    $table.find('input,textarea').off('input change').on('input change', function() {
      const uid = $(this).data('user');
      const field = this.className.split(' ').find(c => ['present','ot_start','ot_end','ot_task','ot_result','notes'].includes(c));
      let val;
      if ($(this).is(':checkbox')) {
        val = $(this).prop('checked') ? 1 : 0;
      } else {
        val = $(this).val();
      }
      saveDraft(uid, field, val);
    });
  }

  // ---------- UI buttons ----------
  function updateButtons() {
    $('#btnEdit').toggleClass('d-none', editMode);
    $('#btnSave, #btnCancel').toggleClass('d-none', !editMode);
    $btnTogglePresent.toggleClass('d-none', !editMode);
    if ($table.data('bootstrap.table')) {
      $table.bootstrapTable('refresh', { silent: true });
    }
  }

  function applyPermissions() {
    const allowEdit = user.can_edit && (userPermissions?.can_edit ?? true);
    const allowHistory = user.can_view_history && (userPermissions?.can_view_history ?? true);

    if (!allowEdit) {
      $("#btnEdit, #btnSave, #btnCancel").hide();
    }
    if (!allowHistory) {
      $('a[href="../History/History.php"]').hide();
    }
  }

  // ---------- events ----------
  $('#btnEdit').on('click', () => { editMode = true; updateButtons(); });
  $('#btnCancel').on('click', () => { editMode = false; editedData = {}; updateButtons(); loadAttendance(); });
  $('#btnSave').on('click', saveAttendance);

  $btnTogglePresent.on('click', () => {
    if (!editMode) return;
    const $c = $('.present-checkbox');
    const allChecked = $c.length && $c.filter(':checked').length === $c.length;
    $c.prop('checked', !allChecked).trigger('change');
  });

  $('#btnDownload').on('click', () => {
    const url = `${API_BASE}/export_attendance.php?date=${encodeURIComponent($datePicker.val())}`
      + ($departmentFilter.val() ? `&department_id=${$departmentFilter.val()}` : '');
    window.location.href = url;
  });

  $departmentFilter.on('change', () => loadAttendance());

  // ---------- save ----------
  function saveAttendance() {
    const date = $datePicker.val();
    const records = [];

    Object.entries(editedData).forEach(([uid, fields]) => {
      const orig = originalData[uid] || {};
      const changed = Object.keys(fields).some(f => fields[f] != orig[f]);
      if (changed) {
        records.push({ user_id: uid, ...fields });
      }
    });

    if (records.length === 0) {
      alert('ไม่มีการเปลี่ยนแปลง');
      editMode = false;
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

  // ---------- boot ----------
  $(function () {
    $.when(loadUserPermissions()).then(() => {
      $.when(loadDatesWithData(), loadDepartments()).always(() => {
        if (!$datePicker.val()) $datePicker.val(today());
        initDatePicker(); 
        initTable(); 
        applyPermissions();
      });
    });
  });

})(jQuery);
