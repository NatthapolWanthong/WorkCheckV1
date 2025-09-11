export default function MultiEditorFactory() {
  let $container = null;
  let $table = null;
  let onApplyCallback = null;
  let visible = false;

  // local selection state (string keys)
  const selectedKeys = new Set();
  const selectionChangeCbs = new Set();

  // ------------------ Helpers ------------------
  const safe = fn => { try { return fn(); } catch (e) { /* ignore */ } };

  function getUniqueIdField() {
    try {
      const opts = $table.bootstrapTable('getOptions') || {};
      if (opts.uniqueId) return opts.uniqueId;
      if (opts.idField) return opts.idField;
    } catch (e) { /* ignore */ }
    return 'user_id';
  }

  function getRowKey(row) {
    if (!row) return undefined;
    const uidField = getUniqueIdField();
    if (Object.prototype.hasOwnProperty.call(row, uidField) && row[uidField] !== undefined && row[uidField] !== null) return String(row[uidField]);
    if (row.user_id !== undefined && row.user_id !== null) return String(row.user_id);
    if (row.id !== undefined && row.id !== null) return String(row.id);
    return undefined;
  }

  function getHeaderIndex(field) {
    if (!$table || !$table.length) return -1;
    try {
      const columns = $table.bootstrapTable('getVisibleColumns') || [];
      const idx = columns.findIndex(c => c.field === field);
      return idx >= 0 ? idx : -1;
    } catch (e) {
      // fallback DOM (use last header row)
      const $wrapper = $table.closest('.bootstrap-table');
      const $thead = $wrapper.find('.fixed-table-header table thead');
      if (!$thead.length) return -1;
      const $lastRow = $thead.find('tr').last();
      const $th = $lastRow.find(`th[data-field="${field}"]`);
      if ($th.length === 0) return -1;
      const $visibleTh = $lastRow.find('th:visible');
      return $visibleTh.index($th.first());
    }
  }

  function buildHtml() {
    // build tool markup (kept intentionally simple)
    return `
      <div id="multiEditorTool" class="container-fluid overflow-auto">
        <div class="multi-editor-row align-items-center flex-wrap gap-2">
          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_present_chk" class="form-check-input">
              <label for="me_present_chk" class="small mb-0">Present</label>
            </div>
            <select id="me_present" class="form-select form-select-sm" disabled>
              <option value="">--</option>
              <option value="1">มา</option>
              <option value="0">ไม่มา</option>
            </select>
          </div>

          <!-- split clock in / clock out -->
          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_clock_in_chk" class="form-check-input">
              <label for="me_clock_in_chk" class="small mb-0">เวลาเข้างาน</label>
            </div>
            <input type="text" id="me_clock_in" class="form-control form-control-sm" placeholder="08:00" disabled>
          </div>

          <div class="multi-editor-group">
            <div class="d-flex align-items-center gap-2">
              <input type="checkbox" id="me_clock_out_chk" class="form-check-input">
              <label for="me_clock_out_chk" class="small mb-0">เวลาเลิกงาน</label>
            </div>
            <input type="text" id="me_clock_out" class="form-control form-control-sm" placeholder="17:00" disabled>
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
            <span id="me_selected_count" class="badge bg-secondary">เลือก 0</span>
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

  function safeDisableFlatpickr(el, disable) {
    try {
      if (el && el._flatpickr && typeof el._flatpickr.set === 'function') {
        el._flatpickr.set('disable', !!disable);
      }
    } catch (e) { /* ignore */ }
  }

  function toggleInputs($chk, $inputs) {
    $chk.off('.multiEditorToggle').on('change.multiEditorToggle', () => {
      const on = !!$chk.prop('checked');
      $inputs.prop('disabled', !on);
      if (!on) {
        $inputs.each((i, el) => {
          if (!el) return;
          try {
            if (el.tagName && el.tagName.toUpperCase() === 'SELECT') el.value = '';
            else el.value = '';
          } catch (e) {}
          safeDisableFlatpickr(el, true);
          if (el._flatpickr && typeof el._flatpickr.clear === 'function') {
            try { el._flatpickr.clear(); } catch (e) {}
          }
        });
      } else {
        $inputs.each((i, el) => safeDisableFlatpickr(el, false));
      }
      applyHighlightPreview();
    });
  }

  function preventRowSelectOnInteractive() {
    if (!$table || !$table.length) return;
    const selector = 'input, select, textarea, .btn-clear-ot, .flatpickr-input, .time-input, .ot-input, label';
    const $wrapper = $table.closest('.bootstrap-table');
    $wrapper.off('.multiEditorPrevent', selector)
      .on('click.multiEditorPrevent', selector, e => e.stopPropagation())
      .on('mousedown.multiEditorPrevent', selector, e => e.stopPropagation())
      .on('dblclick.multiEditorPrevent', selector, e => e.stopPropagation());
  }

  function findHeaderCheckbox($wrapper) {
    let $hdr = $wrapper.find('input[name="btSelectAll"]');
    if (!$hdr.length) $hdr = $wrapper.find('th[data-field="state"] input[type="checkbox"]');
    if (!$hdr.length) $hdr = $wrapper.find('.fixed-table-header input[type="checkbox"]').first();
    return $hdr;
  }

  function updateHeaderCheckbox() {
    if (!$table || !$table.length) return;
    const $wrap = $table.closest('.bootstrap-table');
    const visible = $table.bootstrapTable('getData') || [];
    if (!visible.length) {
      const $hdr = findHeaderCheckbox($wrap);
      if ($hdr.length) { $hdr.prop('checked', false).prop('indeterminate', false); }
      return;
    }
    let some = false, all = true;
    for (const r of visible) {
      const k = getRowKey(r);
      const sel = k !== undefined && selectedKeys.has(String(k));
      some = some || sel;
      all = all && sel;
    }
    const $hdr = findHeaderCheckbox($wrap);
    if ($hdr.length) {
      $hdr.prop('checked', !!all);
      try { $hdr.prop('indeterminate', !all && some); } catch (e) {}
    }
  }

  function updateSelectedCount() { $('#me_selected_count').text(`เลือก ${selectedKeys.size}`); }

  // ------------------ Events & wiring ------------------
  function attachEvents() {
    // toggle inputs (note: clock_in and clock_out separated)
    toggleInputs($('#me_present_chk'), $('#me_present'));
    toggleInputs($('#me_clock_in_chk'), $('#me_clock_in'));
    toggleInputs($('#me_clock_out_chk'), $('#me_clock_out'));
    toggleInputs($('#me_ot_start_chk'), $('#me_ot_start'));
    toggleInputs($('#me_ot_end_chk'), $('#me_ot_end'));
    toggleInputs($('#me_breaks_chk'), $('#me_ot_minutes'));
    toggleInputs($('#me_task_chk'), $('#me_ot_task'));
    toggleInputs($('#me_prod_chk'), $('#me_product_count'));
    toggleInputs($('#me_result_chk'), $('#me_ot_result'));
    toggleInputs($('#me_notes_chk'), $('#me_notes'));

    // flatpickr for time inputs (safe)
    try {
      ['#me_clock_in', '#me_clock_out', '#me_ot_start', '#me_ot_end'].forEach(sel => {
        const el = document.querySelector(sel);
        if (el && !el._flatpickr) {
          try { flatpickr(el, { enableTime: true, noCalendar: true, dateFormat: 'H:i', time_24hr: true, allowInput: true }); } catch (e) {}
          safeDisableFlatpickr(el, true);
        }
      });
    } catch (e) {}

    preventRowSelectOnInteractive();

    if ($table && $table.length) {
      try {
        $table.bootstrapTable('refreshOptions', {
          ignoreClickToSelectOn: element => {
            if (!element || !element.tagName) return false;
            const tag = element.tagName.toUpperCase();
            return ['INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'BUTTON', 'A'].includes(tag);
          }
        });
      } catch (e) {}

      // selection events namespace `.multiEditor`
      $table.off('.multiEditor').on('check.bs.table.multiEditor', function (e, row) {
        const key = getRowKey(row);
        if (key !== undefined) {
          selectedKeys.add(String(key));
          updateSelectedCount();
          debouncedEmitSelectionChange();
          applyHighlightPreview();
        }
      });
      $table.on('uncheck.bs.table.multiEditor', function (e, row) {
        const key = getRowKey(row);
        if (key !== undefined) {
          selectedKeys.delete(String(key));
          updateSelectedCount();
          debouncedEmitSelectionChange();
          applyHighlightPreview();
        }
      });
      $table.on('check-all.bs.table.multiEditor', function (e, rows) {
        (rows || []).forEach(r => {
          const key = getRowKey(r);
          if (key !== undefined) selectedKeys.add(String(key));
        });
        updateSelectedCount();
        debouncedEmitSelectionChange();
        applyHighlightPreview();
      });
      $table.on('uncheck-all.bs.table.multiEditor', function (e, rows) {
        (rows || []).forEach(r => {
          const key = getRowKey(r);
          if (key !== undefined) selectedKeys.delete(String(key));
        });
        updateSelectedCount();
        debouncedEmitSelectionChange();
        applyHighlightPreview();
      });

      // redraw events -> reapply selections/highlights
      $table.on('load-success.bs.table.multiEditor post-body.bs.table.multiEditor load-error.bs.table.multiEditor', () => {
        reapplySelectionsToTable();
        preventRowSelectOnInteractive();
        applyHighlightPreview();
      });

      $table.on('sort.bs.table.multiEditor page-change.bs.table.multiEditor', () => {
        setTimeout(() => { reapplySelectionsToTable(); applyHighlightPreview(); }, 0);
      });

      const $wrapper = $table.closest('.bootstrap-table');
      const $hdr = findHeaderCheckbox($wrapper);
      $wrapper.off('.multiEditorHeader');
      if ($hdr && $hdr.length) {
        $hdr.off('change.multiEditorHeader').on('change.multiEditorHeader', function () {
          const checked = !!$(this).prop('checked');
          const visibleRows = $table.bootstrapTable('getData') || [];
          visibleRows.forEach(r => {
            const k = getRowKey(r);
            if (k === undefined) return;
            if (checked) selectedKeys.add(String(k));
            else selectedKeys.delete(String(k));
          });
          updateSelectedCount();
          debouncedEmitSelectionChange();
          setTimeout(() => { reapplySelectionsToTable(); applyHighlightPreview(); }, 0);
        });
      }
    }

    // Apply button
    $('#me_apply').off('.multiEditorApply').on('click.multiEditorApply', () => {
      const payload = {};
      if ($('#me_present_chk').prop('checked')) payload.present = $('#me_present').val() === '' ? null : Number($('#me_present').val());
      if ($('#me_clock_in_chk').prop('checked')) payload.clock_in = $('#me_clock_in').val() || null;
      if ($('#me_clock_out_chk').prop('checked')) payload.clock_out = $('#me_clock_out').val() || null;
      if ($('#me_ot_start_chk').prop('checked')) payload.ot_start = $('#me_ot_start').val() || null;
      if ($('#me_ot_end_chk').prop('checked')) payload.ot_end = $('#me_ot_end').val() || null;
      if ($('#me_breaks_chk').prop('checked')) payload.ot_minutes = $('#me_ot_minutes').val() === '' ? null : Number($('#me_ot_minutes').val());
      if ($('#me_task_chk').prop('checked')) payload.ot_task = $('#me_ot_task').val() || null;
      if ($('#me_prod_chk').prop('checked')) payload.product_count = $('#me_product_count').val() === '' ? null : Number($('#me_product_count').val());
      if ($('#me_result_chk').prop('checked')) payload.ot_result = $('#me_ot_result').val() === '' ? null : Number($('#me_ot_result').val());
      if ($('#me_notes_chk').prop('checked')) payload.notes = $('#me_notes').val() || null;

      if (Object.keys(payload).length === 0) { alert('กรุณาเลือกฟิลด์ที่จะเปลี่ยน'); return; }

      const data = $table.bootstrapTable('getData') || [];
      const records = [];
      data.forEach(row => {
        const key = getRowKey(row);
        if (key !== undefined && selectedKeys.has(String(key))) {
          const rec = Object.assign({ user_id: row.user_id }, payload);
          records.push(rec);
        }
      });

      if (records.length === 0) { alert('กรุณาเลือกแถวที่ต้องการ (หรือไปหน้าอื่นแล้วเลือกแถวก่อนไม่ได้)'); return; }

      if (typeof onApplyCallback === 'function') onApplyCallback(records);
      applyHighlightPreview();
    });

    // Clear button
    $('#me_clear').off('.multiEditorClear').on('click.multiEditorClear', () => {
      const $tool = $('#multiEditorTool');
      $tool.find("input:not([type='checkbox']), select, textarea").each((i, el) => {
        if (!el) return;
        try {
          if (el.tagName && el.tagName.toUpperCase() === 'SELECT') el.value = '';
          else el.value = '';
        } catch (e) {}
        safeDisableFlatpickr(el, true);
        if (el._flatpickr) { try { el._flatpickr.clear(); } catch (e) {} }
      });

      $tool.find("input[type='checkbox']").prop('checked', false);
      $tool.find('input:not([type="checkbox"]), select, textarea').prop('disabled', true);

      try {
        const visibleRows = $table.bootstrapTable('getData') || [];
        visibleRows.forEach(r => {
          const k = getRowKey(r);
          if (k !== undefined) selectedKeys.delete(String(k));
        });
        try { $table.bootstrapTable('uncheckAll'); } catch (e) { /* ignore */ }
      } catch (e) { /* ignore */ }

      updateSelectedCount();
      debouncedEmitSelectionChange();
      applyHighlightPreview();
    });

    // Close
    $('#me_close').off('.multiEditorClose').on('click.multiEditorClose', () => hide());
  }

  // ------------------ Lifecycle ------------------
  function init({ containerSelector, tableSelector, applyCallback }) {
    $container = $(containerSelector);
    $table = $(tableSelector);
    onApplyCallback = applyCallback;
    if (!$container.length || !$table.length) return;
    if ($('#multiEditorTool').length) return;
    $container.prepend(buildHtml());
    $('#multiEditorTool').hide();
    visible = false;

    // hide checkbox column by default
    try { $table.bootstrapTable('hideColumn', 'state'); } catch (e) { /* ignore */ }

    attachEvents();
  }

  function show() {
    $('#multiEditorTool').slideDown(120);
    visible = true;
    try {
      $table.bootstrapTable('refreshOptions', { clickToSelect: true });
      $table.bootstrapTable('showColumn', 'state');
    } catch (e) { /* ignore */ }
    preventRowSelectOnInteractive();
    reapplySelectionsToTable();
    applyHighlightPreview();
    $(document).trigger('multiEditor:shown');
  }

  function hide() {
    $('#multiEditorTool').slideUp(200);
    visible = false;
    try { $table.bootstrapTable('hideColumn', 'state'); } catch (e) { /* ignore */ }
    const $wrapper = $table.closest('.bootstrap-table');
    $wrapper.find('th, td').removeClass('multi-editor-col-highlight multi-editor-cell-highlight multi-editor-col-in-row');
    $wrapper.find('tbody tr').removeClass('multi-selected-row');
    $(document).trigger('multiEditor:hidden');
  }

  function destroy() {
    $('#multiEditorTool').remove();
    if ($table && $table.length) { $table.off('.multiEditor'); }
    const $wrapper = $table ? $table.closest('.bootstrap-table') : $([]);
    $wrapper.off('.multiEditorPrevent');
    $wrapper.off('.multiEditorHeader');
    $container = null; $table = null; onApplyCallback = null; visible = false;
    selectedKeys.clear(); selectionChangeCbs.clear();
  }

  // header -> fields cache to avoid recomputing and to map indexes reliably
  let _headerFields = null;
  function buildHeaderFields() {
    if (!$table || !$table.length) { _headerFields = []; return _headerFields; }
    try {
      const cols = $table.bootstrapTable('getVisibleColumns') || [];
      _headerFields = cols.map(c => (c && typeof c.field !== 'undefined') ? String(c.field) : null);
      return _headerFields;
    } catch (e) {
      const $wrapper = $table.closest('.bootstrap-table');
      const $lastHeaderRow = $wrapper.find('.fixed-table-header table thead tr').last();
      if (!$lastHeaderRow.length) { _headerFields = []; return _headerFields; }
      const fields = [];
      $lastHeaderRow.find('th').each((i, th) => {
        const f = th.getAttribute ? th.getAttribute('data-field') : null;
        fields.push(f === null ? null : String(f));
      });
      _headerFields = fields;
      return _headerFields;
    }
  }

  // compute header leaf fields (handles colspan/rowspan)
  function computeHeaderLeafFields($wrapper) {
    const $thead = $wrapper.find('.fixed-table-header table thead');
    if (!$thead.length) return [];
    const $rows = $thead.find('tr');
    const R = $rows.length; if (R === 0) return [];

    const grid = Array.from({ length: R }, () => []);
    function findNextFree(r) {
      let c = 0; while (grid[r][c] !== undefined) c++; return c;
    }

    $rows.each((rIdx, tr) => {
      const $ths = $(tr).find('th');
      $ths.each((i, th) => {
        const colspan = (th.colSpan && Number(th.colSpan) > 0) ? Number(th.colSpan) : 1;
        const rowspan = (th.rowSpan && Number(th.rowSpan) > 0) ? Number(th.rowSpan) : 1;
        const field = th.getAttribute ? th.getAttribute('data-field') : null;
        let c = findNextFree(rIdx);
        for (let rr = rIdx; rr < rIdx + rowspan; rr++) {
          for (let cc = c; cc < c + colspan; cc++) {
            if (!grid[rr]) grid[rr] = [];
            grid[rr][cc] = { field: field === null ? null : String(field) };
          }
        }
      });
    });

    const leaf = [];
    const lastRow = grid[R - 1] || [];
    for (let c = 0; c < lastRow.length; c++) {
      const cell = lastRow[c];
      leaf.push(cell && typeof cell.field !== 'undefined' ? cell.field : null);
    }
    return leaf;
  }

  // debounced emitter for selection change callbacks to avoid flood
  let _emitTimer = null;
  function debouncedEmitSelectionChange() {
    const arr = Array.from(selectedKeys);
    if (_emitTimer) clearTimeout(_emitTimer);
    _emitTimer = setTimeout(() => {
      selectionChangeCbs.forEach(cb => { try { cb(arr); } catch (e) { console.warn('selection cb error', e); } });
      _emitTimer = null;
    }, 40);
  }

  // ------------------ Selection helpers ------------------
  function reapplySelectionsToTable() {
    if (!$table || !$table.length) return;
    try {
      const uidField = getUniqueIdField();
      const visible = $table.bootstrapTable('getData') || [];
      const values = visible
        .map(r => getRowKey(r))
        .filter(k => k !== undefined && selectedKeys.has(String(k)))
        .map(k => (/^\d+$/.test(k) ? Number(k) : k));
      try { $table.bootstrapTable('uncheckAll'); } catch (e) {}
      if (values.length) { try { $table.bootstrapTable('checkBy', { field: uidField, values }); } catch (e) {} }
      updateHeaderCheckbox();
    } catch (e) { console.warn('reapplySelectionsToTable', e); }
  }

  // ------------------ Public API ------------------
  function getSelectedKeys() { return Array.from(selectedKeys); }
  function setSelectedKeys(arr) {
    selectedKeys.clear(); (arr || []).forEach(k => selectedKeys.add(String(k)));
    reapplySelectionsToTable(); applyHighlightPreview(); updateSelectedCount(); debouncedEmitSelectionChange();
  }
  function onSelectionChange(cb) { if (typeof cb === 'function') selectionChangeCbs.add(cb); return () => selectionChangeCbs.delete(cb); }

  // ------------------ Highlight ------------------
  function applyHighlightPreview() {
    if (!$table || !$table.length) return;
    const $wrapper = $table.closest('.bootstrap-table');

    // clear previous highlights
    $wrapper.find('th[data-field], td[data-field]').removeClass('multi-editor-col-highlight multi-editor-cell-highlight multi-editor-col-in-row');
    $wrapper.find('th, td').removeClass('multi-editor-col-highlight multi-editor-cell-highlight multi-editor-col-in-row');
    $wrapper.find('tbody tr').removeClass('multi-selected-row');

    if (!visible) { updateSelectedCount(); updateHeaderCheckbox(); return; }

    // build selected fields array
    const fields = [];
    if ($('#me_present_chk').prop('checked')) fields.push('present');
    if ($('#me_clock_in_chk').prop('checked')) fields.push('clock_in');
    if ($('#me_clock_out_chk').prop('checked')) fields.push('clock_out');
    if ($('#me_ot_start_chk').prop('checked')) fields.push('ot_start');
    if ($('#me_ot_end_chk').prop('checked')) fields.push('ot_end');
    if ($('#me_breaks_chk').prop('checked')) fields.push('ot_minutes');
    if ($('#me_task_chk').prop('checked')) fields.push('ot_task');
    if ($('#me_prod_chk').prop('checked')) fields.push('product_count');
    if ($('#me_result_chk').prop('checked')) fields.push('ot_result');
    if ($('#me_notes_chk').prop('checked')) fields.push('notes');

    const headerFields = buildHeaderFields();
    const data = $table.bootstrapTable('getData') || [];

    // header highlight
    fields.forEach(f => {
      const $ths = $wrapper.find(`th[data-field="${f}"]`);
      if ($ths.length) $ths.addClass('multi-editor-col-highlight');
      else {
        const idx = headerFields.indexOf(String(f));
        if (idx >= 0) {
          const $lastHeaderRow = $wrapper.find('.fixed-table-header table thead tr').last();
          $lastHeaderRow.find('th').eq(idx).addClass('multi-editor-col-highlight');
        }
      }
      $wrapper.find(`td[data-field="${f}"]`).addClass('multi-editor-col-highlight');
    });

    // body highlights (deferred to reduce reflow)
    window.requestAnimationFrame(() => {
      // selector map for finding controls inserted by formatters
      const fieldSelectorMap = {
        present: '.present-checkbox',
        clock_in: '.clock_in, .time-input',
        clock_out: '.clock_out, .time-input',
        ot_start: '.ot-start, .ot_start',
        ot_end: '.ot-end, .ot_end',
        ot_minutes: '.ot-minutes, .ot_minutes',
        ot_task: '.ot-task, .ot_task',
        product_count: '.product-count, .product_count',
        ot_result: '.ot-result, input[name^="ot_result_"]',
        notes: '.notes-editor, .notes'
      };

      // fallback mapping (header leaf -> td index)
      const leafFields = computeHeaderLeafFields($wrapper) || [];
      const fieldToIdx = {};
      leafFields.forEach((f, idx) => { if (f !== null && typeof f !== 'undefined') fieldToIdx[String(f)] = idx; });

      $wrapper.find('.fixed-table-body table tbody tr').each(function () {
        const $tr = $(this);
        const rowIndex = $tr.data('index');
        const rowData = (typeof rowIndex !== 'undefined') ? data[rowIndex] : null;
        if (!rowData) return;
        const key = getRowKey(rowData);
        if (key !== undefined && selectedKeys.has(String(key))) {
          $tr.addClass('multi-selected-row');
          const $allTds = $tr.children('td');

          fields.forEach(f => {
            // 1) td[data-field]
            const $tdByField = $tr.find(`td[data-field="${f}"]`);
            if ($tdByField.length) { $tdByField.addClass('multi-editor-cell-highlight multi-editor-col-in-row'); return; }

            // 2) find control inserted by formatter and pick its parent td
            const selector = fieldSelectorMap[f];
            if (selector) {
              const $found = $tr.find(selector).first();
              if ($found.length) { const $parentTd = $found.closest('td'); if ($parentTd.length) { $parentTd.addClass('multi-editor-cell-highlight multi-editor-col-in-row'); return; } }
            }

            // 3) fallback: header leaf mapping -> children('td').eq(idx)
            const idx = Object.prototype.hasOwnProperty.call(fieldToIdx, String(f)) ? fieldToIdx[String(f)] : -1;
            if (idx >= 0) { const $td = $allTds.eq(idx); if ($td.length) { $td.addClass('multi-editor-cell-highlight multi-editor-col-in-row'); return; } }

            // 4) final fallback: visible index via getHeaderIndex
            const visibleIdx = getHeaderIndex(f);
            if (visibleIdx >= 0) $tr.find('td:visible').eq(visibleIdx).addClass('multi-editor-cell-highlight multi-editor-col-in-row');
          });
        }
      });

      updateSelectedCount();
      updateHeaderCheckbox();
    });
  }

  // ------------------ Lifecycle helpers already above (init, show, hide, destroy) ------------------
  return { init, show, hide, destroy, getSelectedKeys, setSelectedKeys, onSelectionChange };
}