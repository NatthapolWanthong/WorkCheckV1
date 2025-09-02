// Attendance.js — client-side grouping (no treegrid)
const API_BASE = './connection';
const $table = $('#attendanceTable');

let editMode = false;
let datesWithData = new Set();

// flatpickr init (Thai)
const fp = flatpickr('#datePicker', {
  dateFormat: 'Y-m-d',
  locale: 'th',
  defaultDate: new Date().toISOString().slice(0,10),
  onChange: function(dates, dateStr){ editMode=false; updateButtons(); loadAttendance(dateStr); },
  onDayCreate: function(selectedDates, dateStr, instance, dayElem) {
    try {
      const dateObj = dayElem.dateObj; // flatpickr สร้าง property dateObj ไว้ที่ dayElem
      if (!dateObj) return;

      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;

      if (datesWithData.has(key)) {
        dayElem.classList.add('has-data');   // highlight วันนั้น
        dayElem.setAttribute('title','มีข้อมูลในวันนี้');
      }
    } catch(e) {
      console.warn('onDayCreate error', e);
    }
  }
});

// load dates list
function loadDatesWithData(){ return $.getJSON(`${API_BASE}/get_dates.php`).done(list=>datesWithData=new Set(list||[])).fail(()=>datesWithData=new Set()); }

// load departments
function loadDepartments(){ return $.getJSON(`${API_BASE}/get_departments.php`).done(data=>{ const $d=$('#departmentFilter'); $d.html('<option value="">ทุกแผนก</option>'); data.forEach(dep=>$d.append(`<option value="${dep.id}">${dep.name}</option>`)); }); }

// formatters
function formatTimeView(v){ if(!v) return `<div class="ot-empty">-</div>`; const hhmm=v.substring(0,5); return `<div class="text-center">${hhmm} น.</div>`; }
window.presentFormatter = function(value,row){ const disabled = editMode ? '' : 'disabled'; return `<div class="form-check"><input class="form-check-input present-checkbox" type="checkbox" data-user="${row.user_id}" ${value==1?'checked':''} ${disabled}></div>`; };
window.otStartFormatter = function(v,row){ return editMode? `<input type="text" class="form-control form-control-sm ot-input ot-start" data-user="${row.user_id}" value="${v?v.substring(0,5):''}" placeholder="">` : formatTimeView(v); };
window.otEndFormatter = function(v,row){ return editMode? `<input type="text" class="form-control form-control-sm ot-input ot-end" data-user="${row.user_id}" value="${v?v.substring(0,5):''}" placeholder="">` : formatTimeView(v); };
window.notesFormatter = function(v,row){ return editMode? `<textarea class="notes-editor" data-user="${row.user_id}">${v||''}</textarea>` : $('<div>').text(v||'').html(); };

// grouping (client-side) — create synthetic group header rows
function groupingResponseHandler(res){
  if (!$('#groupByDept').prop('checked')) return res;
  const rows = res.rows || [];
  const map = {};
  rows.forEach(r=>{ const dept=r.department_name||'ไม่มีแผนก'; if(!map[dept]) map[dept]={manager:r.manager_name||'', items:[]}; map[dept].items.push(r); });
  const grouped=[];
  Object.keys(map).sort().forEach(deptName=>{
    grouped.push({ __is_group:true, full_name: deptName, department_name: deptName, manager_name: map[deptName].manager, employee_code:'', notes:'' });
    map[deptName].items.forEach(it => { it.__is_group=false; grouped.push(it); });
  });
  return { total: grouped.length, rows: grouped };
}

// row style: group header vs employee
function rowStyle(row){ if(row.__is_group) return { classes: 'group-row' }; return { classes:'employee-row' }; }

// table options (server-side fetch, but grouping client-side)
const tableOptions = {
  url: `${API_BASE}/get_attendance.php`,
  method: 'get',
  sidePagination: 'server',
  pagination: true,
  pageSize: 25,
  pageList: [10, 25, 50, 100],
  search: true,
  responseHandler: groupingResponseHandler,
  queryParams: function (p) {
    const group = $('#groupByDept').prop('checked');
    const limit = group ? 10000 : p.limit || 25;
    return Object.assign({}, p, {
      date: $('#datePicker').val(),
      department_id: $('#departmentFilter').val(),
      limit: limit,
      offset: p.offset || 0
    });
  },

  // 🔥 ฟีเจอร์ใหม่
  showColumns: true,          // dropdown เลือกซ่อน/แสดง column
  showExport: true,           // ปุ่ม export
  exportDataType: 'all',      // 'all' = export ทุกหน้า, 'basic' = เฉพาะหน้า, 'selected' = เฉพาะ row ที่เลือก
  exportTypes: ['excel','csv','txt'], // เลือกได้
  reorderableColumns: true,   // drag สลับ column ได้
  maintainMetaData: true,     // export ตาม order + visible state
  toolbar: '#toolbar',        // ต้องมี div toolbar ในหน้า html

  onPostBody: function () {
    // ... โค้ดเดิมของคุณ (flatpickr init, group row decorate) ...
  },

  rowStyle: rowStyle
};


function initTableSafely(){ if (!$table.data('bootstrap.table')) $table.bootstrapTable(tableOptions); else $table.bootstrapTable('refreshOptions', tableOptions); }
function refreshTable(){ loadDatesWithData().always(()=>{ if($table.data('bootstrap.table')) $table.bootstrapTable('refresh',{silent:true}); else initTableSafely(); }); }

function loadAttendance(date){ if($table.data('bootstrap.table')) $table.bootstrapTable('refresh',{silent:true}); else initTableSafely(); $('#btnDownload').attr('href', `${API_BASE}/export_attendance.php?date=${encodeURIComponent(date)}${$('#departmentFilter').val() ? '&department_id='+$('#departmentFilter').val() : ''}`); }

function updateButtons(){ if(editMode){ $('#btnEdit').addClass('d-none'); $('#btnSave').removeClass('d-none'); $('#btnCancel').removeClass('d-none'); } else { $('#btnEdit').removeClass('d-none'); $('#btnSave').addClass('d-none'); $('#btnCancel').addClass('d-none'); } if($table.data('bootstrap.table')) $table.bootstrapTable('refresh',{silent:true}); }

$('#btnEdit').on('click', ()=>{ editMode=true; updateButtons(); });
$('#btnCancel').on('click', ()=>{ editMode=false; updateButtons(); loadAttendance($('#datePicker').val()); });
$('#btnSave').on('click', ()=>{
  const date = $('#datePicker').val();
  const rows = $table.bootstrapTable('getData',{useCurrentPage:false});
  const records = [];
  rows.forEach(r=>{ if(r.__is_group) return; const uid=r.user_id; const presentEl=$(`.present-checkbox[data-user="${uid}"]`); const present = presentEl.length ? (presentEl.prop('checked')?1:0) : (r.present||1); const otStart = $(`.ot-start[data-user="${uid}"]`).val()||null; const otEnd = $(`.ot-end[data-user="${uid}"]`).val()||null; const notes = $(`.notes-editor[data-user="${uid}"]`).val()||r.notes||null; records.push({ user_id: uid, present, ot_start: otStart, ot_end: otEnd, notes }); });
  $.ajax({ url:`${API_BASE}/save_attendance.php`, method:'POST', contentType:'application/json', data: JSON.stringify({ date, records }), success(resp){ if(resp.status==='ok'){ editMode=false; updateButtons(); loadAttendance(date); loadDatesWithData().always(()=>fp.redraw && fp.redraw()); alert('บันทึกเรียบร้อย'); } else alert('เกิดข้อผิดพลาด: '+resp.message); }, error(xhr){ console.error(xhr); alert('บันทึกไม่สำเร็จ'); } });
});

$('#departmentFilter').on('change', refreshTable);
$('#groupByDept,#showManagersRed').on('change', refreshTable);

$(function(){ $.when(loadDatesWithData(), loadDepartments()).always(()=>{ initTableSafely(); }); });
