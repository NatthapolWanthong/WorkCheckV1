<!-- main.php ห้ามลบบรรทัดนี้ -->
<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>ระบบลงเวลาทำงาน</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Bootstrap & Icons -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">

  <!-- Plugins (สำหรับหน้าใน) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-table@1.24.2/dist/bootstrap-table.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery-treegrid@0.3.0/css/jquery.treegrid.css">

  <!-- Custom -->
  <link rel="stylesheet" href="main.css">
  <link rel="stylesheet" href="components/header.css">

  <!-- MultiEditor styles (page-specific) -->
  <link rel="stylesheet" href="page/Attendance/MultiEditor.css">
</head>
<body class="bg-light">

  <!-- Header -->
  <?php include('components/header.html'); ?>

  <!-- Content -->
  <main id="pageContent" class="container-fluid">
    <div class="text-center text-muted">กำลังโหลด...</div>
  </main>

  <!-- Shared scripts (วางก่อนปิด body) -->
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

  <!-- bootstrap-table + extensions -->
  <script src="https://cdn.jsdelivr.net/npm/jquery-treegrid@0.3.0/js/jquery.treegrid.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tableexport.jquery.plugin@1.29.0/tableExport.min.js"></script>
  <script src="https://unpkg.com/bootstrap-table@1.24.2/dist/bootstrap-table.min.js"></script>
  <script src="https://unpkg.com/bootstrap-table@1.24.2/dist/extensions/treegrid/bootstrap-table-treegrid.min.js"></script>
  <script src="https://unpkg.com/bootstrap-table@1.24.2/dist/extensions/export/bootstrap-table-export.min.js"></script>
  <script src="https://unpkg.com/bootstrap-table@1.24.2/dist/locale/bootstrap-table-th-TH.min.js"></script>

  <!-- flatpickr -->
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
  <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/th.js"></script>

  <!-- xlsx (export) -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>

  <!-- main loader (ทับไฟล์ main.js ปัจจุบันด้วยโค้ด loader ที่ผมเตรียม) -->
  <script type="module" src="main.js"></script>
</body>
</html>
