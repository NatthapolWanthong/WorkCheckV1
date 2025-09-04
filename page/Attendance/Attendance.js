(function ($) {
  const API_BASE = '../../connection';
  const $table = $('#attendanceTable');
  const $datePicker = $('#datePicker');
  const $departmentFilter = $('#departmentFilter');

  let editMode = false;
  let datesWithData = new Set();
  let fp = null;

  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function formatDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function loadDatesWithData() {
    return $.getJSON(`${API_BASE}/get_dates.php`, list => {
      datesWithData = new Set(list || []);
    });
  }
  function loadDepartments() {
    return $.getJSON(`${API_BASE}/get_departments.php`, data => {
      $departmentFilter.html('<option value="">ทุกแผนก</option>');
      data.forEach(dep => $departmentFilter.append(`<option value="${dep.id}">${dep.name}</option>`));
    });
  }

  function initDatePicker() {
    fp = flatpickr('#datePicker', {
      dateFormat: 'Y-m-d',
      locale: 'th',
      defaultDate: today(),
      maxDate: new Date(),
      onChange: () => { editMode = false; updateButtons(); loadAttendance(); },
      onDayCreate: (_, __, ___, dayElem) => {
        if (datesWithData.has(formatDateKey(dayElem.dateObj))) dayElem.classList.add('has-data');
      }
    });
  }

  // formatters
  function formatTime(v) {
    return v ? `<div class="text-center">${v.substring(0,5)} น.</div>` : `<div class="ot-empty">-</div>`;
  }
  window.presentFormatter = (v, row) =>
    `<input type="checkbox" class="form-check-input present-checkbox" data-user="${row.user_id}" ${v==1?'checked':''} ${editMode?'':'disabled'}>`;
  window.otStartFormatter = (v,row)=> editMode
    ? `<input type="text" class="form-control form-control-sm ot-input ot-start" data-user="${row.user_id}" value="${v?.substring(0,5)||''}">`
    : formatTime(v);
  window.otEndFormatter = (v,row)=> editMode
    ? `<input type="text" class="form-control form-control-sm ot-input ot-end" data-user="${row.user_id}" value="${v?.substring(0,5)||''}">`
    : formatTime(v);
  window.notesFormatter = (v,row)=> editMode
    ? `<textarea class="notes-editor" data-user="${row.user_id}">${v||''}</textarea>`
    : $('<div>').text(v||'').html();

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
    queryParams: p => ({...p, date:$datePicker.val(), department_id:$departmentFilter.val()}),
    responseHandler: res => {
      (res.rows||[]).forEach(r => r.date_work=$datePicker.val());
      return res;
    },
    rowStyle: ()=>({classes:'employee-row'}),
    onPostBody: ()=> { if (editMode) initOTInputs(); }
  };

  function initTable() {
    if (!$table.data('bootstrap.table')) $table.bootstrapTable(tableOptions);
    else $table.bootstrapTable('refreshOptions', tableOptions);
  }
  function loadAttendance() {
    if ($table.data('bootstrap.table')) $table.bootstrapTable('refresh',{silent:true});
    else initTable();
  }

  function initOTInputs() {
    $('.ot-start,.ot-end').each(function () {
      if (!$(this).data('flat')) {
        $(this).wrap('<div class="input-group"></div>')
          .after('<button type="button" class="btn btn-outline-secondary btn-clear-ot">&times;</button>');
        flatpickr(this,{enableTime:true,noCalendar:true,dateFormat:"H:i",time_24hr:true});
        $(this).data('flat',true);
      }
    });
    $('.btn-clear-ot').off('click').on('click',function(){
      const $i=$(this).siblings('input'); if ($i[0]._flatpickr) $i[0]._flatpickr.clear();
    });
  }

  function updateButtons() {
    $('#btnEdit').toggleClass('d-none',editMode);
    $('#btnSave,#btnCancel').toggleClass('d-none',!editMode);
    $table.bootstrapTable('refresh',{silent:true});
  }

  // events
  $('#btnEdit').on('click',()=>{editMode=true;updateButtons();});
  $('#btnCancel').on('click',()=>{editMode=false;updateButtons();loadAttendance();});
  $('#btnSave').on('click',saveAttendance);
  $('#btnTogglePresent').on('click',()=>{
    const $c=$('.present-checkbox'); 
    const all=$c.length && $c.filter(':checked').length===$c.length;
    $c.prop('checked',!all);
  });
  $('#btnDownload').on('click',()=>{
    const url=`${API_BASE}/export_attendance.php?date=${encodeURIComponent($datePicker.val())}${$departmentFilter.val()?`&department_id=${$departmentFilter.val()}`:''}`;
    window.location.href=url;
  });
  $departmentFilter.on('change',()=>loadAttendance());

  function saveAttendance() {
    const date=$datePicker.val();
    const rows=$table.bootstrapTable('getData',{useCurrentPage:false});
    const records=rows.map(r=>({
      user_id:r.user_id,
      present:$(`.present-checkbox[data-user="${r.user_id}"]`).prop('checked')?1:0,
      ot_start:$(`.ot-start[data-user="${r.user_id}"]`).val()||null,
      ot_end:$(`.ot-end[data-user="${r.user_id}"]`).val()||null,
      notes:$(`.notes-editor[data-user="${r.user_id}"]`).val()||r.notes||null
    }));
    $.ajax({
      url:`${API_BASE}/save_attendance.php`,
      method:'POST',
      contentType:'application/json',
      data:JSON.stringify({date,records}),
      success:resp=>{
        if(resp.status==='ok'){ editMode=false;updateButtons();loadAttendance();loadDatesWithData().always(()=>fp.redraw&&fp.redraw());alert('บันทึกเรียบร้อย');}
        else alert('เกิดข้อผิดพลาด: '+resp.message);
      },
      error:()=>alert('บันทึกไม่สำเร็จ')
    });
  }

  $(function(){
    $.when(loadDatesWithData(),loadDepartments()).always(()=>{
      initDatePicker(); initTable();
    });
  });
})(jQuery);
