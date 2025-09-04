<!-- /page/Attendance/Attendance.php -->

<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>ระบบลงเวลาทำงาน</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Bootstrap & Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

  <!-- Plugins -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-table@1.24.2/dist/bootstrap-table.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-treegrid@0.3.0/css/jquery.treegrid.css">

  <!-- Custom -->
  <link rel="stylesheet" href="Attendance.css">
  
  <!-- Header -->
   <link rel="stylesheet" href="../../components/header.css">

</head>
<body class="bg-light">
  <!-- Header -->
  <?php include('../../components/header.html'); ?>

<div class="container table-container py-3">

  <!-- Toolbar -->
  <div id="customToolbar" class="mb-2 d-flex flex-wrap gap-2 align-items-center">
    <div class="d-flex align-items-center">
      <label for="departmentFilter" class="form-label mb-0 small text-muted me-2">แผนก</label>
      <select id="departmentFilter" class="form-select form-select-sm" style="width:180px">
        <option value="">ทุกแผนก</option>
      </select>
    </div>
    <button id="btnTogglePresent" class="btn btn-outline-warning btn-sm">เลือก/ยกเลิกทั้งหมด</button>
  </div>

  <!-- Table -->
  <table id="attendanceTable" 
         class="table table-striped"
         data-toggle="table"
         data-url="../../connection/get_attendance.php"
         data-pagination="true"
         data-page-size="25"
         data-search="true"
         data-show-columns="true"
         data-show-export="true"
         data-side-pagination="server"
         data-locale="th-TH"
         data-toolbar="#customToolbar">
    <thead>
      <tr>
        <th rowspan="2" data-field="date_work" data-sortable="true">วันที่ทำงาน</th>
        <th rowspan="2" data-field="present" data-formatter="presentFormatter">Present</th>
        <th rowspan="2" data-field="employee_code" data-sortable="true">รหัส</th>
        <th rowspan="2" data-field="full_name" data-sortable="true">ชื่อ - นามสกุล</th>
        <th rowspan="2" data-field="department_name" data-sortable="true">แผนก</th>
        <th rowspan="2" data-field="manager_name" data-sortable="true">หัวหน้า</th>
        <th colspan="2" class="text-center">OT</th>
        <th rowspan="2" data-field="notes" data-formatter="notesFormatter">หมายเหตุ</th>
        <th rowspan="2" data-field="date_modified" data-sortable="true">วันที่แก้ไข</th>
      </tr>
      <tr>
        <th data-field="ot_start" data-formatter="otStartFormatter">OT (เริ่ม)</th>
        <th data-field="ot_end" data-formatter="otEndFormatter">OT (สิ้นสุด)</th>
      </tr>
    </thead>
  </table>
</div>

<!-- Scripts -->
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jquery-treegrid@0.3.0/js/jquery.treegrid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/tableexport.jquery.plugin@1.29.0/tableExport.min.js"></script>
<script src="https://unpkg.com/bootstrap-table@1.24.2/dist/bootstrap-table.min.js"></script>
<script src="https://unpkg.com/bootstrap-table@1.24.2/dist/extensions/treegrid/bootstrap-table-treegrid.min.js"></script>
<script src="https://unpkg.com/bootstrap-table@1.24.2/dist/extensions/export/bootstrap-table-export.min.js"></script>
<script src="https://unpkg.com/bootstrap-table@1.24.2/dist/locale/bootstrap-table-th-TH.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/th.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
<script src="Attendance.js"></script>
</body>
</html>
