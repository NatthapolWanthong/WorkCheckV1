<!-- /page/Attendance/Attendance.php ห้ามลบบรรทัดนี้ -->
<!-- Table -->
<table id="attendanceTable"
class="table table-striped"
data-toggle="table"
data-url="connection/get_attendance.php"
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
<th rowspan="2" data-field="employee_code" data-sortable="true" data-halign="center">รหัส</th>
<th rowspan="2" data-field="full_name" data-sortable="true" data-halign="center">ชื่อ - นามสกุล</th>
<th rowspan="2" data-field="department_name" data-sortable="true" data-halign="center">แผนก</th>
<th rowspan="2" data-field="manager_name" data-sortable="true" data-halign="center">หัวหน้า</th>


<th colspan="6" class="text-center">OT</th>


<th rowspan="2" data-field="notes" data-formatter="notesFormatter" data-halign="center">หมายเหตุ</th>
<th rowspan="2" data-field="date_modified" data-formatter="dateModifiedFormatter" data-sortable="true" data-halign="center">วันที่แก้ไข</th>
</tr>
<tr>
<th data-field="ot_start" data-formatter="otStartFormatter" data-sortable="true" data-align="center" data-halign="center">OT (เริ่ม)</th>
<th data-field="ot_end" data-formatter="otEndFormatter" data-sortable="true" data-align="center" data-halign="center">OT (สิ้นสุด)</th>
<th data-field="ot_task" data-formatter="otTaskFormatter" data-align="center">งานที่ปฏิบัติ</th>
<th data-field="ot_result_text"
data-visible="false"
data-force-export="true"
data-switchable="false">OT ผลลัพธ์ (Export)</th>
<th data-field="ot_result"
data-formatter="otResultFormatter"
data-align="center"
data-halign="center"
data-sortable="true"
data-force-hide="true">ผลลัพธ์</th>
<th data-field="ot_approver" data-align="center" data-sortable="true">ผู้อนุมัติ</th>
</tr>
</thead>
</table>