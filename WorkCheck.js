// script.js — logic for bootstrap-table
(function () {
  // sample data
  const tableData = [
    { id: 1, name: "Product A", price: 199, category: "Gadget", stock: 120, rating: 4.5 },
    { id: 2, name: "Product B", price: 299, category: "Accessory", stock: 85, rating: 4.1 },
    { id: 3, name: "Product C", price: 129, category: "Gadget", stock: 210, rating: 4.8 },
    { id: 4, name: "Product D", price: 499, category: "Pro", stock: 10, rating: 4.9 },
    { id: 5, name: "Product E", price: 59,  category: "Accessory", stock: 540, rating: 4.0 },
    { id: 6, name: "Product F", price: 349, category: "Gadget", stock: 34, rating: 4.6 },
    { id: 7, name: "Product G", price: 89,  category: "Accessory", stock: 400, rating: 3.9 },
    { id: 8, name: "Product H", price: 219, category: "Gadget", stock: 78, rating: 4.2 },
    { id: 9, name: "Product I", price: 999, category: "Pro", stock: 3, rating: 4.95 },
    { id: 10, name: "Product J", price: 29, category: "Accessory", stock: 999, rating: 3.6 },
  ];

  // expose detailFormatter in global scope because bootstrap-table will call it by name
  window.detailFormatter = function (index, row) {
    return `
      <div class="detail-row">
        <div class="row">
          <div class="col-md-6"><strong>ชื่อ:</strong> ${escapeHtml(row.name)}</div>
          <div class="col-md-3"><strong>ราคา:</strong> ฿${row.price}</div>
          <div class="col-md-3"><strong>สต็อก:</strong> ${row.stock}</div>
        </div>
        <div class="row mt-2">
          <div class="col-md-6"><strong>หมวด:</strong> ${escapeHtml(row.category)}</div>
          <div class="col-md-6"><strong>Rating:</strong> ${row.rating} ⭐</div>
        </div>
      </div>
    `;
  };

  // initialize table
  $(function () {
    $('#table').bootstrapTable({
      data: tableData,
      locale: 'th-TH',
      iconsPrefix: 'bi',
      icons: {
        paginationSwitchDown: 'bi-chevron-bar-down',
        paginationSwitchUp: 'bi-chevron-bar-up',
        refresh: 'bi-arrow-clockwise',
        toggleOff: 'bi-toggle2-off',
        toggleOn: 'bi-toggle2-on',
        columns: 'bi-columns-gap',
        detailOpen: 'bi-caret-down',
        detailClose: 'bi-caret-up'
      },
      // custom row style example
      rowStyle: function (row, index) {
        if (row.stock <= 5) {
          return { classes: 'table-danger' };
        }
        return {};
      }
    });

    // toolbar buttons
    $('#addRow').on('click', addRow);
    $('#removeSelected').on('click', removeSelected);
    $('#refreshTable').on('click', refreshTable);

    $('#toggleCompact').on('change', function () {
      const compact = $(this).prop('checked');
      if (compact) {
        $('#table').addClass('table-compact');
      } else {
        $('#table').removeClass('table-compact');
      }
    });

    // docs / repo buttons (just demo)
    $('#docsBtn').on('click', (e) => { e.preventDefault(); alert('เปิดเอกสารตัวอย่าง (จำลอง)'); });
    $('#githubBtn').on('click', (e) => { e.preventDefault(); alert('เปิด repo (จำลอง)'); });
  });

  // helpers
  function addRow() {
    const nextId = Math.max(...$('#table').bootstrapTable('getData').map(d => d.id)) + 1;
    const newRow = {
      id: nextId,
      name: `Product ${String.fromCharCode(64 + (nextId % 26 || 26))}`,
      price: Math.floor(Math.random() * 900) + 20,
      category: ['Gadget', 'Accessory', 'Pro'][Math.floor(Math.random() * 3)],
      stock: Math.floor(Math.random() * 500),
      rating: (Math.random() * 2 + 3).toFixed(2)
    };
    $('#table').bootstrapTable('append', newRow);
    flashRow(nextId);
  }

  function removeSelected() {
    const ids = $.map($('#table').bootstrapTable('getSelections'), function (row) { return row.id; });
    if (!ids.length) {
      alert('เลือกแถวที่จะลบก่อนนะ 😉');
      return;
    }
    if (!confirm(`ลบ ${ids.length} แถวจริงมั้ย?`)) return;
    $('#table').bootstrapTable('remove', {
      field: 'id',
      values: ids
    });
  }

  function refreshTable() {
    // simple demo refresh: shuffle data a bit
    const data = $('#table').bootstrapTable('getData');
    const shuffled = data.sort(() => Math.random() - 0.5);
    $('#table').bootstrapTable('load', shuffled);
  }

  function flashRow(id) {
    const $rows = $('#table').find('tr[data-index]');
    $rows.each(function () {
      const idx = $(this).data('index');
      const row = $('#table').bootstrapTable('getData')[idx];
      if (row && row.id === id) {
        $(this).addClass('table-success');
        setTimeout(() => $(this).removeClass('table-success'), 900);
      }
    });
  }

  // minimal XSS escape for demo
  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
