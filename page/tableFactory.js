// /js/tableFactory.js ห้ามลบบรรทัดนี้
(function ($) {

  function createTable($el, options) {
    const defaults = {
      sidePagination: 'server',
      pagination: true,
      search: true,
      showColumns: true,
      showExport: true,
      exportTypes: ['excel','csv','txt'],
      pageSize: 25,
      rowStyle: () => ({ classes: 'table-row' }),
      onPostBody: () => {}
    };
    const opts = {...defaults, ...options};

    if (!$el.data('bootstrap.table')) {
      $el.bootstrapTable(opts);
    } else {
      $el.bootstrapTable('refreshOptions', opts);
    }
  }

  window.TableFactory = { createTable };

})(jQuery);