<!-- /page/Attendance/Attendance.php ห้ามลบบรรทัดนี้ -->

<!-- Toolbar -->
<div id="customToolbar" class="mb-2 d-flex flex-wrap gap-2 align-items-center">
<div class="d-flex align-items-center">
    <label for="departmentFilter" class="form-label mb-0 small text-muted me-2">แผนก</label>
    <select id="departmentFilter" class="form-select form-select-sm" style="width:180px">
    <option value="">ทุกแผนก</option>
    </select>
</div>
<!-- ปุ่มนี้โผล่เฉพาะตอน Edit mode -->
<button id="btnTogglePresent" class="btn btn-outline-warning btn-sm d-none">เลือก/ยกเลิกทั้งหมด</button>
<button id="btnMultiEditor" class="btn btn-outline-secondary btn-sm d-none">Multi Editor</button>
</div>

<!-- Table -->
<table id="attendanceTable"
  class="table table-bordered table-hover table-sm"
  data-toggle="table"
  data-url="connection/get_attendance.php"
  data-pagination="true"
  data-page-size="25"
  data-search="true"
  data-show-columns="true"
  data-show-export="true"
  data-side-pagination="server"
  data-locale="th-TH"
  data-toolbar="#customToolbar"
  data-click-to-select="true">
  
  
  <thead>
    <tr>
      <th rowspan="2" data-field="state" data-checkbox="true"></th>
      <th rowspan="2" data-field="date_work" data-halign="center">วันที่ทำงาน</th>

      <th rowspan="2"
        data-field="present"
        data-formatter="presentFormatter"
        data-align="center"
        data-halign="center"
        data-sortable="true"
        data-force-hide="true">
        Present
      </th>
      <th rowspan="2"
        data-field="present_text"
        data-visible="false"
        data-force-export="true"
        data-switchable="false">
        Present (Export)
      </th>

      <!-- เวลาเข้างาน / เวลาเลิกงาน -->
      <th rowspan="2" data-field="clock_in" data-formatter="clockInFormatter" data-sortable="true" data-align="center" data-halign="center">เวลาเข้างาน</th>
      <th rowspan="2" data-field="clock_out" data-formatter="clockOutFormatter" data-sortable="true" data-align="center" data-halign="center">เวลาเลิกงาน</th>

      <th rowspan="2" data-field="employee_code" data-sortable="true" data-halign="center">รหัส</th>
      <th rowspan="2" data-field="full_name" data-sortable="true" data-halign="center">ชื่อ - นามสกุล</th>
      <th rowspan="2" data-field="department_name" data-sortable="true" data-halign="center">แผนก</th>
      <th rowspan="2" data-field="manager_name" data-sortable="true" data-halign="center">หัวหน้า</th>

      <!-- เปลี่ยน colspan เป็น 8 เพื่อให้ผู้อนุมัติอยู่ในกลุ่ม OT -->
      <th colspan="8" class="text-center">OT</th>

      <th rowspan="2" data-field="notes" data-formatter="notesFormatter" data-halign="center">หมายเหตุ</th>
      <th rowspan="2" data-field="date_modified" data-formatter="dateModifiedFormatter" data-sortable="true" data-halign="center">วันที่แก้ไข</th>
    </tr>

    <!-- =============================== OT =============================== -->
    <tr>
      <th data-field="ot_start" data-formatter="otStartFormatter" data-sortable="true" data-align="center" data-halign="center">OT (เริ่ม)</th>
      <th data-field="ot_end" data-formatter="otEndFormatter" data-sortable="true" data-align="center" data-halign="center">OT (สิ้นสุด)</th>
      <th data-field="ot_minutes" data-formatter="breakMinutesFormatter" data-align="center">เวลาพัก(นาที)</th>
      <th data-field="ot_task" data-formatter="otTaskFormatter" data-align="center">ผลลัพธ์</th>
      <th data-field="product_count" data-formatter="productCountFormatter" data-align="center">จำนวนผลลัพธ์</th>

      <!-- เก็บผลลัพธ์สำหรับ export (text) แต่ซ่อนในตารางปกติ -->
      <th data-field="ot_result_text"
          data-visible="false"
          data-force-export="true"
          data-switchable="false">OT ผลลัพธ์ (Export)</th>

      <th data-field="ot_result"
          data-formatter="otResultFormatter"
          data-align="center"
          data-halign="center"
          data-sortable="true"
          data-force-hide="true">สรุป</th>

      <th data-field="ot_approver" data-align="center" data-sortable="true">ผู้อนุมัติ</th>
    </tr>
    <!-- ================================================================== -->
  </thead>
</table>
