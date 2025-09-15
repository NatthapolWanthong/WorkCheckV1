<?php

$cur = strtolower(basename(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: $_SERVER['PHP_SELF']));
?>
<header class="d-flex ...">
  <!-- Left -->
  <div class="header-left d-flex flex-column justify-content-center">
    <h4 class="mb-0 text-primary kanit-semibold">ระบบลงเวลาทำงาน</h4>
  </div>

  <!-- center nav (short form) -->
  <ul class="header-center nav position-absolute top-50 start-50 translate-middle">
    <li>
      <a href="../Attendance/Attendance.php"
         class="nav-link px-3 fw-semibold <?= $cur === 'attendance.php' ? 'active' : '' ?>"
         <?= $cur === 'attendance.php' ? 'aria-current="page"' : '' ?>>
         ลงเวลา
      </a>
    </li>

    <li>
      <a href="../Report/Report.php"
         class="nav-link px-3 fw-semibold <?= $cur === 'report.php' ? 'active' : '' ?>"
         <?= $cur === 'report.php' ? 'aria-current="page"' : '' ?>>
         สรุป
      </a>
    </li>

    <li>
      <a href="../History/History.php" id="navHistoryLink"
         class="nav-link px-3 fw-semibold <?= $cur === 'history.php' ? 'active' : '' ?>"
         <?= $cur === 'history.php' ? 'aria-current="page"' : '' ?>>
         ประวัติ
      </a>
    </li>
  </ul>

  <!-- Right -->
  <div class="header-right d-flex gap-2">
    <div class="d-flex align-items-center gap-2">
      <label class="me-2 mb-0">เลือกวันที่:</label>
      <input id="datePicker" class="form-control flatpickr-input" style="width:160px" type="text" readonly>
      <button id="btnCreate" class="btn btn-outline-success btn-sm d-none">สร้างใหม่</button>
      <button id="btnEdit" class="btn btn-outline-primary btn-sm d-none">แก้ไข</button>
      <button id="btnCancel" class="btn btn-outline-secondary btn-sm d-none">ยกเลิก</button>
      <button id="btnSave" class="btn btn-primary btn-sm d-none">บันทึก</button>
    </div>
  </div>
</header>
