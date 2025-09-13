// MultiEditor.js

export default function MultiEditorFactory() {
  // ----- state -----
  let $container = null;
  let $table = null;
  let onApplyCallback = null;
  let visible = false;
  const selectionChangeCbs = new Set();
  let _headerFields = null;
  let _emitTimer = null;

  // ----- helpers (small, single purpose) -----
  const isTableReady = () => Boolean($table && $table.length);

  function getBootstrapOptionsSafe() {
    if (!isTableReady()) return {};
    try {
      return $table.bootstrapTable('getOptions') || {};
    } catch (err) {
      console.warn('bootstrap getOptions failed', err);
      return {};
    }
  }

  function getUniqueIdField() {
    const opts = getBootstrapOptionsSafe();
    return opts.uniqueId || opts.idField || 'user_id';
  }

  function getRowKey(row) {
    if (!row) return undefined;
    const uidField = getUniqueIdField();
    if (Object.prototype.hasOwnProperty.call(row, uidField) && row[uidField] != null) return String(row[uidField]);
    if (row.user_id != null) return String(row.user_id);
    if (row.id != null) return String(row.id);
    return undefined;
  }

  function buildHeaderFields() {
    if (!isTableReady()) return (_headerFields = []);
    if (Array.isArray(_headerFields) && _headerFields.length) return _headerFields;

    // First try bootstrap columns (safe)
    const cols = getBootstrapOptionsSafe().columns || (function () {
      try { return $table.bootstrapTable('getVisibleColumns') || []; } catch (e) { return []; }
    })();

    if (cols && cols.length) {
      _headerFields = cols.map(c => (c && typeof c.field !== 'undefined') ? String(c.field) : null);
      return _headerFields;
    }

    // fallback: read thead data-field
    const $wrap = $table.closest('.bootstrap-table');
    const $lastRow = $wrap.find('.fixed-table-header table thead tr').last();
    if (!$lastRow.length) return (_headerFields = []);
    const fields = [];
    $lastRow.find('th').each((i, th) => fields.push(th.getAttribute ? th.getAttribute('data-field') : null));
    _headerFields = fields.map(f => f === null ? null : String(f));
    return _headerFields;
  }

  // Debounced selection notify
  function emitSelectionChange() {
    if (_emitTimer) clearTimeout(_emitTimer);
    _emitTimer = setTimeout(() => {
      if (!isTableReady()) { _emitTimer = null; return; }
      const sels = $table.bootstrapTable('getSelections') || [];
      const keys = sels.map(r => getRowKey(r)).filter(Boolean).map(String);
      selectionChangeCbs.forEach(cb => {
        try { cb(keys); } catch (e) { console.warn('selection cb error', e); }
      });
      _emitTimer = null;
    }, 40);
  }

  // Combined UI update used everywhere
  function updateAllViews() {
    applyHighlightPreview();
    emitSelectionChange();
  }

  // ----- DOM template (single responsibility) -----
  function buildHtml() {
    return `
      <div id="multiEditorTool" class="container-fluid overflow-auto">
        <div class="multi-editor-row align-items-center flex-wrap gap-2" style="display:flex; align-items:center;">
          <!-- controls (kept explicit for readability) -->
          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_present_chk" class="form-check-input">
              <label for="me_present_chk" class="small mb-0">Present</label>
            </div>
            <select id="me_present" class="form-select form-select-sm" disabled>
              <option value="">--</option><option value="1">มา</option><option value="0">ไม่มา</option>
            </select>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_clock_in_chk" class="form-check-input">
              <label for="me_clock_in_chk" class="small mb-0">เวลาเข้างาน</label>
            </div>
            <input type="text" id="me_clock_in" class="form-control form-control-sm" placeholder="08:00" disabled>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_clock_out_chk" class="form-check-input">
              <label for="me_clock_out_chk" class="small mb-0">เวลาเลิกงาน</label>
            </div>
            <input type="text" id="me_clock_out" class="form-control form-control-sm" placeholder="17:00" disabled>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_ot_start_chk" class="form-check-input">
              <label for="me_ot_start_chk" class="small mb-0">OT (เริ่ม)</label>
            </div>
            <input type="text" id="me_ot_start" class="form-control form-control-sm" placeholder="18:00" disabled>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_ot_end_chk" class="form-check-input">
              <label for="me_ot_end_chk" class="small mb-0">OT (สิ้นสุด)</label>
            </div>
            <input type="text" id="me_ot_end" class="form-control form-control-sm" placeholder="20:00" disabled>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_breaks_chk" class="form-check-input">
              <label for="me_breaks_chk" class="small mb-0">เวลาพัก(นาที)</label>
            </div>
            <input type="number" id="me_ot_minutes" class="form-control form-control-sm" placeholder="0" min="0" disabled>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_task_chk" class="form-check-input">
              <label for="me_task_chk" class="small mb-0">ผลลัพธ์</label>
            </div>
            <input type="text" id="me_ot_task" class="form-control form-control-sm" placeholder="งาน" disabled>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_prod_chk" class="form-check-input">
              <label for="me_prod_chk" class="small mb-0">จำนวนผลลัพธ์</label>
            </div>
            <input type="number" id="me_product_count" class="form-control form-control-sm" placeholder="0" min="0" disabled>
          </div>

          <div class="multi-editor-group">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_result_chk" class="form-check-input">
              <label for="me_result_chk" class="small mb-0">สรุป</label>
            </div>
            <select id="me_ot_result" class="form-select form-select-sm" disabled>
              <option value="">--</option><option value="1">ได้ตามเป้า</option><option value="0">ไม่ได้ตามเป้า</option>
            </select>
          </div>

          <div class="multi-editor-group notes-group" style="min-width:160px;">
            <div style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="me_notes_chk" class="form-check-input">
              <label for="me_notes_chk" class="small mb-0">หมายเหตุ</label>
            </div>
            <input type="text" id="me_notes" class="form-control form-control-sm" placeholder="หมายเหตุ" disabled>
          </div>

          <div class="multi-editor-actions ms-auto" style="margin-left:auto;display:flex;gap:8px;">
            <button id="me_apply" class="btn btn-sm btn-primary">Apply to selected</button>
            <button id="me_clear" class="btn btn-sm btn-outline-secondary">Clear</button>
            <button id="me_close" class="btn btn-sm btn-link">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  // ----- tool helpers -----
  function togglePair(checkSel, inputSel) {
    const $chk = $(checkSel);
    const $inputs = $(inputSel);
    $chk.off('.meToggle').on('change.meToggle', () => {
      const on = !!$chk.prop('checked');
      $inputs.prop('disabled', !on);
      if (!on) {
        $inputs.each((i, el) => {
          if (!el) return;
          if (el.tagName && el.tagName.toUpperCase() === 'SELECT') el.value = '';
          else el.value = '';
          if (el._flatpickr && el._flatpickr.clear) try { el._flatpickr.clear(); } catch (e) { /* ignore */ }
        });
      }
      applyHighlightPreview();
    });
  }

  function initFlatpickrForTool() {
    const ids = ['#me_clock_in', '#me_clock_out', '#me_ot_start', '#me_ot_end'];
    ids.forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      if (!el._flatpickr) {
        try { flatpickr(el, { enableTime: true, noCalendar: true, dateFormat: 'H:i', time_24hr: true, allowInput: true }); } catch (e) { console.warn('flatpickr init failed', e); }
      }
      try { if (el._flatpickr) el._flatpickr.set('disable', true); } catch (e) { /* ignore */ }
    });
  }

  function preventRowSelectOnInteractive() {
    if (!isTableReady()) return;
    const selector = 'input, select, textarea, .btn-clear-ot, .flatpickr-input';
    const $wrapper = $table.closest('.bootstrap-table');
    $wrapper.off('.multiEditorPrevent', selector)
      .on('click.multiEditorPrevent', selector, e => e.stopPropagation())
      .on('mousedown.multiEditorPrevent', selector, e => e.stopPropagation())
      .on('dblclick.multiEditorPrevent', selector, e => e.stopPropagation());
  }

  // ----- highlight preview (reads state, marks DOM) -----
  function applyHighlightPreview() {
    if (!isTableReady()) return;
    const $wrap = $table.closest('.bootstrap-table');

    // clear
    $wrap.find('th, td').removeClass('multi-editor-col-highlight multi-editor-cell-highlight multi-editor-col-in-row');
    $wrap.find('tbody tr').removeClass('multi-selected-row');

    if (!visible) return;

    const fields = [
      $('#me_present_chk').prop('checked') && 'present',
      $('#me_clock_in_chk').prop('checked') && 'clock_in',
      $('#me_clock_out_chk').prop('checked') && 'clock_out',
      $('#me_ot_start_chk').prop('checked') && 'ot_start',
      $('#me_ot_end_chk').prop('checked') && 'ot_end',
      $('#me_breaks_chk').prop('checked') && 'ot_minutes',
      $('#me_task_chk').prop('checked') && 'ot_task',
      $('#me_prod_chk').prop('checked') && 'product_count',
      $('#me_result_chk').prop('checked') && 'ot_result',
      $('#me_notes_chk').prop('checked') && 'notes'
    ].filter(Boolean);

    if (!fields.length) return;

    const headerFields = buildHeaderFields();
    const data = $table.bootstrapTable('getData') || [];
    const selectorMap = {
      present: '.present-checkbox',
      clock_in: '.clock_in',
      clock_out: '.clock_out',
      ot_start: '.ot-start, .ot_start',
      ot_end: '.ot-end, .ot_end',
      ot_minutes: '.ot-minutes, .ot_minutes',
      ot_task: '.ot-task, .ot_task',
      product_count: '.product-count, .product_count',
      ot_result: '.ot-result, input[name^="ot_result_"]',
      notes: '.notes-editor, .notes'
    };

    // header highlights (by data-field or fallback index)
    fields.forEach(f => {
      const $ths = $wrap.find(`th[data-field="${f}"]`);
      if ($ths.length) $ths.addClass('multi-editor-col-highlight');
      else {
        const idx = headerFields.indexOf(String(f));
        if (idx >= 0) $wrap.find('.fixed-table-header table thead tr').last().find('th').eq(idx).addClass('multi-editor-col-highlight');
      }
      $wrap.find(`td[data-field="${f}"]`).addClass('multi-editor-col-highlight');
    });

    const selections = ($table.bootstrapTable('getSelections') || []).map(r => getRowKey(r)).filter(Boolean).map(String);
    const selSet = new Set(selections);

    window.requestAnimationFrame(() => {
      $wrap.find('.fixed-table-body table tbody tr').each(function () {
        const $tr = $(this);
        const idx = $tr.data('index');
        const row = (typeof idx !== 'undefined') ? data[idx] : null;
        if (!row) return;
        const key = getRowKey(row);
        if (!key || !selSet.has(String(key))) return;

        $tr.addClass('multi-selected-row');
        fields.forEach(f => {
          const $td = $tr.find(`td[data-field="${f}"]`);
          if ($td.length) { $td.addClass('multi-editor-cell-highlight multi-editor-col-in-row'); return; }
          const selector = selectorMap[f];
          if (selector) {
            const $found = $tr.find(selector).first();
            if ($found.length) {
              const $p = $found.closest('td');
              if ($p.length) { $p.addClass('multi-editor-cell-highlight multi-editor-col-in-row'); return; }
            }
          }
          const idxField = headerFields.indexOf(String(f));
          if (idxField >= 0) {
            const $tds = $tr.children('td');
            const $fallbackTd = $tds.eq(idxField);
            if ($fallbackTd && $fallbackTd.length) $fallbackTd.addClass('multi-editor-cell-highlight multi-editor-col-in-row');
          }
        });
      });
    });
  }

  // ----- attach event handlers (only binds events) -----
  function attachEvents() {
    // toggles for enabling inputs
    togglePair('#me_present_chk', '#me_present');
    togglePair('#me_clock_in_chk', '#me_clock_in');
    togglePair('#me_clock_out_chk', '#me_clock_out');
    togglePair('#me_ot_start_chk', '#me_ot_start');
    togglePair('#me_ot_end_chk', '#me_ot_end');
    togglePair('#me_breaks_chk', '#me_ot_minutes');
    togglePair('#me_task_chk', '#me_ot_task');
    togglePair('#me_prod_chk', '#me_product_count');
    togglePair('#me_result_chk', '#me_ot_result');
    togglePair('#me_notes_chk', '#me_notes');

    if (!isTableReady()) return;

    // avoid table toggling selection when interacting with form inputs
    try {
      $table.bootstrapTable('refreshOptions', {
        ignoreClickToSelectOn: element => {
          if (!element || !element.tagName) return false;
          const tag = element.tagName.toUpperCase();
          return ['INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'BUTTON', 'A'].includes(tag);
        }
      });
    } catch (e) { console.warn('refreshOptions failed', e); }

    // selection & lifecycle events -> unified view update
    $table.off('.multiEditor')
      .on('check.bs.table.multiEditor uncheck.bs.table.multiEditor check-all.bs.table.multiEditor uncheck-all.bs.table.multiEditor', () => updateAllViews())
      .on('load-success.bs.table.multiEditor post-body.bs.table.multiEditor load-error.bs.table.multiEditor', () => updateAllViews())
      .on('sort.bs.table.multiEditor page-change.bs.table.multiEditor', () => setTimeout(updateAllViews, 0));

    // apply
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

      if (!Object.keys(payload).length) { alert('กรุณาเลือกฟิลด์ที่จะเปลี่ยน'); return; }
      const selections = ($table.bootstrapTable('getSelections') || []);
      if (!selections.length) { alert('กรุณาเลือกแถวที่ต้องการ'); return; }

      const selectedKeys = selections.map(r => getRowKey(r)).filter(Boolean).map(String);
      const records = selections.map(row => Object.assign({ user_id: row.user_id }, payload));

      if (typeof onApplyCallback === 'function') onApplyCallback(records);

      // try to recheck after possible refresh
      try {
        const uidField = getUniqueIdField();
        const values = selectedKeys.map(v => (/^\d+$/.test(v) ? Number(v) : v));
        if (values.length) {
          try { $table.bootstrapTable('checkBy', { field: uidField, values }); } catch (e) { /* ignore */ }
          const reapply = () => { try { $table.bootstrapTable('checkBy', { field: uidField, values }); } catch (e) {} };
          $table.off('load-success.bs.table.multiEditorPreserve').on('load-success.bs.table.multiEditorPreserve', reapply);
          setTimeout(() => { $table.off('load-success.bs.table.multiEditorPreserve', reapply); }, 3000);
        }
      } catch (e) { console.warn('re-check failed', e); }

      updateAllViews();
    });

    // clear
    $('#me_clear').off('.multiEditorClear').on('click.multiEditorClear', () => {
      const $tool = $('#multiEditorTool');
      $tool.find("input:not([type='checkbox']), select, textarea").each((i, el) => {
        if (!el) return;
        try { if (el.tagName && el.tagName.toUpperCase() === 'SELECT') el.value = ''; else el.value = ''; } catch (e) {}
        if (el._flatpickr) try { el._flatpickr.clear(); } catch (e) {}
      });
      $tool.find("input[type='checkbox']").prop('checked', false);
      $tool.find('input:not([type="checkbox"]), select, textarea').prop('disabled', true);
      try { $table.bootstrapTable('uncheckAll'); } catch (e) { /* ignore */ }
      updateAllViews();
    });

    // close
    $('#me_close').off('.multiEditorClose').on('click.multiEditorClose', () => hide());
  }

  // ----- lifecycle -----
  function init({ containerSelector, tableSelector, applyCallback }) {
    $container = $(containerSelector || '');
    $table = $(tableSelector || '');
    onApplyCallback = applyCallback;

    if (!$container.length || !$table.length) return;
    if ($('#multiEditorTool').length) return;

    // add DOM once
    $container.prepend(buildHtml());
    $('#multiEditorTool').hide();
    visible = false;

    // Prepare UI (flatpickr and prevent selection on interactive elements) — run once here
    initFlatpickrForTool();
    preventRowSelectOnInteractive();

    // hide state column by default
    try { $table.bootstrapTable('hideColumn', 'state'); } catch (e) { /* ignore if missing */ }

    // then bind events
    attachEvents();
  }

  function show() {
    $('#multiEditorTool').slideDown(120);
    visible = true;
    try { $table.bootstrapTable('showColumn', 'state'); } catch (e) { /* ignore */ }
    updateAllViews();
    $(document).trigger('multiEditor:shown');
  }

  function hide() {
    $('#multiEditorTool').slideUp(200);
    visible = false;
    try { $table.bootstrapTable('hideColumn', 'state'); } catch (e) { /* ignore */ }
    try { $table.bootstrapTable('uncheckAll'); } catch (e) { /* ignore */ }
    updateAllViews();
    $(document).trigger('multiEditor:hidden');
  }

  function destroy() {
    $('#multiEditorTool').remove();
    if (isTableReady()) $table.off('.multiEditor');
    const $wrapper = $table ? $table.closest('.bootstrap-table') : $([]);
    $wrapper.off('.multiEditorPrevent');
    $wrapper.off('.multiEditorHeader');
    $container = null; $table = null; onApplyCallback = null; visible = false;
    selectionChangeCbs.clear();
  }

  function getSelectedKeys() {
    if (!isTableReady()) return [];
    const sels = $table.bootstrapTable('getSelections') || [];
    return sels.map(r => getRowKey(r)).filter(Boolean).map(String);
  }

  function setSelectedKeys(arr) {
    if (!isTableReady()) return;
    try {
      const uidField = getUniqueIdField();
      const values = (arr || []).map(String).map(v => (/^\d+$/.test(v) ? Number(v) : v));
      if (!values.length) return; // no-op: do not clear selection if empty list provided
      try { $table.bootstrapTable('checkBy', { field: uidField, values }); } catch (e) { console.warn('checkBy failed', e); }
      updateAllViews();
    } catch (e) { console.warn('setSelectedKeys failed', e); }
  }

  function onSelectionChange(cb) {
    if (typeof cb === 'function') selectionChangeCbs.add(cb);
    return () => selectionChangeCbs.delete(cb);
  }

  return {
    init,
    show,
    hide,
    destroy,
    getSelectedKeys,
    setSelectedKeys,
    onSelectionChange
  };
}
