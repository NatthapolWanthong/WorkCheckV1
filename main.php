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
</head>
<body class="bg-light">

  <!-- Header -->
  <?php include('components/header.html'); ?>

  <!-- Content -->
  <main id="pageContent" class="container-fluid">
    <div class="text-center text-muted">กำลังโหลด...</div>
  </main>


  <!-- Scripts -->
  <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="main.js"></script>
</body>
</html>
