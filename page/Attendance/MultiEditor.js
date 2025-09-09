// /page/Attendance/MultiEditor.js
export default function MultiEditorFactory() {
  let $container = null;
  let $table = null;
  let onApplyCallback = null;
  let visible = false;

  // Helper: find header index (visible header) for a data-field reliably
  function getHeaderIndex(field) {
    if (!$table || !$table.length) return -1;
    const $wrapper = $table.closest('.bootstrap-table');
    const $thead = $wrapper.find('.fixed-table-header table thead');
    if (!$thead.length) return -1;
    // Try direct selector first
    let $th = $thead.find(`th[data-field="${field}"]`);
    if ($th.length === 0) {
      // fallback to last header row
      $th = $thead.find('tr').last().find(`th[data-field="${field}"]`);
    }
    if ($th.length === 0) return -1;
    // Compute index among visible header cells
    const $visibleTh = $thead.find('th:visible');
    return $visibleTh.index($th.first());
  }

  function buildHtml() {
    return `
      <div id="multiEditorTool" class="container-fluid">
        <div class="multi-editor-row align-items-center">
          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_present_chk" class="form-check-input">
              <label for="me_present_chk" class="small mb-0">Present</label>
            </div>
            <select id="me_present" class="form-select form-select-sm" disabled>
              <option value="0">ไม่มา</option>
              <option value="1">มา</option>
            </select>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_clock_chk" class="form-check-input">
              <label for="me_clock_chk" class="small mb-0">เวลาเข้างาน / เวลาเลิกงาน</label>
            </div>
            <div class="d-flex gap-1">
              <input type="text" id="me_clock_in" class="form-control form-control-sm" placeholder="08:00" disabled>
              <input type="text" id="me_clock_out" class="form-control form-control-sm" placeholder="17:00" disabled>
            </div>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_ot_start_chk" class="form-check-input">
              <label for="me_ot_start_chk" class="small mb-0">OT (เริ่ม)</label>
            </div>
            <input type="text" id="me_ot_start" class="form-control form-control-sm" placeholder="18:00" disabled>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_ot_end_chk" class="form-check-input">
              <label for="me_ot_end_chk" class="small mb-0">OT (สิ้นสุด)</label>
            </div>
            <input type="text" id="me_ot_end" class="form-control form-control-sm" placeholder="20:00" disabled>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_breaks_chk" class="form-check-input">
              <label for="me_breaks_chk" class="small mb-0">เวลาพัก(นาที)</label>
            </div>
            <input type="number" id="me_ot_minutes" class="form-control form-control-sm" placeholder="0" min="0" disabled>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_task_chk" class="form-check-input">
              <label for="me_task_chk" class="small mb-0">คีย์อิสระ</label>
            </div>
            <input type="text" id="me_ot_task" class="form-control form-control-sm" placeholder="งาน" disabled>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_prod_chk" class="form-check-input">
              <label for="me_prod_chk" class="small mb-0">จำนวนผลผลิต</label>
            </div>
            <input type="number" id="me_product_count" class="form-control form-control-sm" placeholder="0" min="0" disabled>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_result_chk" class="form-check-input">
              <label for="me_result_chk" class="small mb-0">ผลลัพธ์</label>
            </div>
            <select id="me_ot_result" class="form-select form-select-sm" disabled>
              <option value="">--</option>
              <option value="1">ได้ตามเป้า</option>
              <option value="0">ไม่ได้ตามเป้า</option>
            </select>
          </div>

          <div class="multi-editor-group notes-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_notes_chk" class="form-check-input">
              <label for="me_notes_chk" class="small mb-0">หมายเหตุ</label>
            </div>
            <input type="text" id="me_notes" class="form-control form-control-sm" placeholder="หมายเหตุ" disabled>
          </div>

          <div class="multi-editor-selected ms-2">
            <span id="me_selected_count" class="badge">เลือก 0</span>
          </div>

          <div class="multi-editor-actions ms-auto d-flex gap-2">
            <button id="me_apply" class="btn btn-sm btn-primary">Apply to selected</button>
            <button id="me_clear" class="btn btn-sm btn-outline-secondary">Clear</button>
            <button id="me_close" class="btn btn-sm btn-link">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  // Toggle inputs when checkbox changes
  function toggleInputs($chk, $inputs) {
    $chk.on('change', () => {
      const on = !!$chk.prop('checked');
      $inputs.prop('disabled', !on);
      if (!on) {
        $inputs.each((i, el) => {
          if (!el) return;
          if (el.tagName === 'SELECT') el.selectedIndex = 0;
          else el.value = '';
          if (el._flatpickr) el._flatpickr.clear();
        });
      }
      applyHighlightPreview();
    });
  }

  // Main highlight logic
  function applyHighlightPreview() {
    if (!$table || !$table.length) return;
    const $wrapper = $table.closest('.bootstrap-table');

    // clear previous
    $wrapper.find('th, td').removeClass('multi-editor-col-highlight multi-editor-cell-highlight multi-editor-col-in-row');
    $wrapper.find('tbody tr').removeClass('multi-selected-row');

    if (!visible) return;

    // chosen fields
    const fields = [];
    if ($('#me_present_chk').prop('checked')) fields.push('present');
    if ($('#me_clock_chk').prop('checked')) { fields.push('clock_in'); fields.push('clock_out'); }
    if ($('#me_ot_start_chk').prop('checked')) fields.push('ot_start');
    if ($('#me_ot_end_chk').prop('checked')) fields.push('ot_end');
    if ($('#me_breaks_chk').prop('checked')) fields.push('ot_minutes');
    if ($('#me_task_chk').prop('checked')) fields.push('ot_task');
    if ($('#me_prod_chk').prop('checked')) fields.push('product_count');
    if ($('#me_result_chk').prop('checked')) fields.push('ot_result');
    if ($('#me_notes_chk').prop('checked')) fields.push('notes');

    // highlight full column (header + column cells)
    const colIndexes = {};
    fields.forEach(f => {
      const idx = getHeaderIndex(f);
      colIndexes[f] = idx;
      const $thead = $wrapper.find('.fixed-table-header table thead');
      if (idx >= 0) {
        const $visibleTh = $thead.find('th:visible');
        const th = $visibleTh.eq(idx);
        if (th && th.length) th.addClass('multi-editor-col-highlight');
        // highlight body by index (all rows)
        $wrapper.find('.fixed-table-body table tbody tr').each(function () {
          $(this).children().eq(idx).addClass('multi-editor-col-highlight');
        });
      } else {
        // fallback selectors (if td[data-field] present)
        $wrapper.find(`th[data-field="${f}"]`).addClass('multi-editor-col-highlight');
        $wrapper.find(`td[data-field="${f}"]`).addClass('multi-editor-col-highlight');
      }
    });

    // selected rows: stronger highlight on chosen fields AND mark column-cells inside that row
    const selections = $table.bootstrapTable('getSelections') || [];
    const selectedIds = new Set((selections || []).map(s => s.user_id));
    const data = $table.bootstrapTable('getData') || [];

    $wrapper.find('.fixed-table-body table tbody tr').each(function (rowIndex) {
      const rowData = data[rowIndex];
      if (!rowData) return;
      if (selectedIds.has(rowData.user_id)) {
        $(this).addClass('multi-selected-row');

        // for each chosen field highlight the exact cell in this row strongly and also add col-in-row class
        fields.forEach(f => {
          const idx = colIndexes[f];
          if (idx >= 0) {
            const $cell = $(this).children().eq(idx);
            $cell.addClass('multi-editor-cell-highlight multi-editor-col-in-row');
          } else {
            const $td = $(this).find(`td[data-field="${f}"]`);
            if ($td.length) $td.addClass('multi-editor-cell-highlight multi-editor-col-in-row');
          }
        });
      }
    });

    // update selected count badge
    $('#me_selected_count').text(`เลือก ${selectedIds.size}`);
  }

  function attachEvents() {
    toggleInputs($('#me_present_chk'), $('#me_present'));
    toggleInputs($('#me_clock_chk'), $('#me_clock_in, #me_clock_out'));
    toggleInputs($('#me_ot_start_chk'), $('#me_ot_start'));
    toggleInputs($('#me_ot_end_chk'), $('#me_ot_end'));
    toggleInputs($('#me_breaks_chk'), $('#me_ot_minutes'));
    toggleInputs($('#me_task_chk'), $('#me_ot_task'));
    toggleInputs($('#me_prod_chk'), $('#me_product_count'));
    toggleInputs($('#me_result_chk'), $('#me_ot_result'));
    toggleInputs($('#me_notes_chk'), $('#me_notes'));

    // attach flatpickr for time inputs (if available)
    try {
      ['#me_clock_in','#me_clock_out','#me_ot_start','#me_ot_end'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el && !el._flatpickr) flatpickr(el, { enableTime:true, noCalendar:true, dateFormat:'H:i', time_24hr:true });
      });
    } catch(e){}

    // apply
    $('#me_apply').on('click', () => {
      const payload = {};
      if ($('#me_present_chk').prop('checked')) payload.present = Number($('#me_present').val());
      if ($('#me_clock_chk').prop('checked')) { payload.clock_in = $('#me_clock_in').val() || null; payload.clock_out = $('#me_clock_out').val() || null; }
      if ($('#me_ot_start_chk').prop('checked')) payload.ot_start = $('#me_ot_start').val() || null;
      if ($('#me_ot_end_chk').prop('checked')) payload.ot_end = $('#me_ot_end').val() || null;
      if ($('#me_breaks_chk').prop('checked')) payload.ot_minutes = $('#me_ot_minutes').val() === '' ? null : Number($('#me_ot_minutes').val());
      if ($('#me_task_chk').prop('checked')) payload.ot_task = $('#me_ot_task').val() || null;
      if ($('#me_prod_chk').prop('checked')) payload.product_count = $('#me_product_count').val() === '' ? null : Number($('#me_product_count').val());
      if ($('#me_result_chk').prop('checked')) { const v = $('#me_ot_result').val(); if (v !== '') payload.ot_result = Number(v); }
      if ($('#me_notes_chk').prop('checked')) payload.notes = $('#me_notes').val() || null;

      if (Object.keys(payload).length === 0) { alert('กรุณาเลือกฟิลด์ที่จะเปลี่ยน'); return; }

      const selections = $table.bootstrapTable('getSelections') || [];
      if (!selections.length) { alert('กรุณาเลือกแถวที่ต้องการ (click-to-select)'); return; }

      const records = selections.map(r => Object.assign({ user_id: r.user_id }, payload));
      if (typeof onApplyCallback === 'function') onApplyCallback(records);

      applyHighlightPreview();
    });

    // Clear: fix bug where checkboxes were disabled after clear -> do NOT disable checkboxes
    $('#me_clear').on('click', () => {
      const $tool = $('#multiEditorTool');

      // clear non-checkbox inputs and flatpickr values
      $tool.find('input:not([type="checkbox"]), select, textarea').each((i, el) => {
        if (!el) return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
        if (el._flatpickr) el._flatpickr.clear();
      });

      // uncheck checkboxes and trigger change so toggleInputs runs
      $tool.find('input[type="checkbox"]').prop('checked', false).trigger('change');

      // ensure non-checkbox inputs disabled (checkboxes remain enabled so user can re-enable)
      $tool.find('input:not([type="checkbox"]), select, textarea').prop('disabled', true);

      // unselect all rows safely
      try { $table.bootstrapTable('uncheckAll'); } catch(e){}

      $('#me_selected_count').text('เลือก 0');
      applyHighlightPreview();
    });

    $('#me_close').on('click', () => hide());

    if ($table && $table.length) {
      // update highlight when user selects/unselects rows or table redraws
      $table.on('check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table load-success.bs.table post-body.bs.table', () => {
        applyHighlightPreview();
      });

      // when sorting: clear selection to avoid accidental select-all behavior while in multi editor
      $table.on('sort.bs.table', () => {
        if (!visible) return;
        try { $table.bootstrapTable('uncheckAll'); } catch(e){}
        $('#me_selected_count').text('เลือก 0');
        applyHighlightPreview();
      });
    }
  }

  function init({ containerSelector, tableSelector, applyCallback }) {
    $container = $(containerSelector);
    $table = $(tableSelector);
    onApplyCallback = applyCallback;
    if (!$container.length || !$table.length) return;
    if ($('#multiEditorTool').length) return;
    $container.prepend(buildHtml());
    $('#multiEditorTool').hide();
    visible = false;

    // ensure checkbox column hidden by default
    try { $table.bootstrapTable('hideColumn','state'); } catch(e){}

    attachEvents();
  }

  function show() {
    $('#multiEditorTool').slideDown(120);
    visible = true;
    // show checkbox column only while multi editor visible
    try { $table.bootstrapTable('showColumn','state'); } catch(e){}
    applyHighlightPreview();
    $(document).trigger('multiEditor:shown');
  }

  function hide() {
    $('#multiEditorTool').slideUp(120);
    visible = false;
    try { $table.bootstrapTable('hideColumn','state'); } catch(e){}
    const $wrapper = $table.closest('.bootstrap-table');
    $wrapper.find('th, td').removeClass('multi-editor-col-highlight multi-editor-cell-highlight multi-editor-col-in-row');
    $wrapper.find('tbody tr').removeClass('multi-selected-row');
    $(document).trigger('multiEditor:hidden');
  }

  function destroy() { $('#multiEditorTool').remove(); $container = null; $table = null; onApplyCallback = null; visible = false; }

  return { init, show, hide, destroy };
}
