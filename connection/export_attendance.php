<?php

// /connection/get_departments.php ห้ามลบบรรทัดนี้

include "dbconfig.php";
include "dbconnect.php";

$date = $_GET['date'] ?? date('Y-m-d');
$department_id = isset($_GET['department_id']) && $_GET['department_id'] !== '' ? intval($_GET['department_id']) : null;

$day_id = null;
$stmt = mysqli_prepare($connection, "SELECT id FROM attendance_days WHERE att_date = ?");
mysqli_stmt_bind_param($stmt, "s", $date);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $did);
if (mysqli_stmt_fetch($stmt)) { $day_id = $did; }
mysqli_stmt_close($stmt);

$cols = "u.employee_code, CONCAT(u.first_name,' ',u.last_name) AS full_name, d.name AS department_name, CONCAT(m.first_name,' ',m.last_name) AS manager_name";

if ($day_id) {
    $cols .= ", COALESCE(ar.present,1) as present, ar.ot_start, ar.ot_end, ar.notes";
    $sql = "SELECT {$cols}
            FROM users u
            LEFT JOIN departments d ON d.id = u.department_id
            LEFT JOIN users m ON m.id = d.manager_user_id
            LEFT JOIN attendance_records ar ON ar.user_id = u.id AND ar.day_id = ?
            WHERE 1=1";
    $types = "i";
    $params = [$day_id];
} else {
    $cols .= ", 1 as present, NULL as ot_start, NULL as ot_end, NULL as notes";
    $sql = "SELECT {$cols}
            FROM users u
            LEFT JOIN departments d ON d.id = u.department_id
            LEFT JOIN users m ON m.id = d.manager_user_id
            WHERE 1=1";
    $types = "";
    $params = [];
}

if ($department_id) {
    $sql .= " AND u.department_id = ?";
    $types .= "i";
    $params[] = $department_id;
}
$sql .= " ORDER BY d.name, u.first_name, u.last_name";

$stmt = mysqli_prepare($connection, $sql);
if ($types !== "") {
    mysqli_stmt_bind_param($stmt, $types, ...$params);
}
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

$filename = "attendance_{$date}.csv";
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="'.$filename.'";');
$output = fopen('php://output', 'w');

// BOM for Excel
fwrite($output, "\xEF\xBB\xBF");

// Header
fputcsv($output, ['Employee Code','Full Name','Department','Manager','Present','OT Start','OT End','Notes']);

// Rows
while ($row = mysqli_fetch_assoc($res)) {
    $presentText = (intval($row['present']) === 1) ? 'มา' : '';

    // ถ้า null/ค่าว่าง ให้เป็น '' (ไม่มี '-')
    $otStart = isset($row['ot_start']) && $row['ot_start'] !== null ? substr($row['ot_start'],0,5) : '';
    $otEnd   = isset($row['ot_end'])   && $row['ot_end']   !== null ? substr($row['ot_end'],0,5) : '';
    $notes   = $row['notes'] ?? '';

    fputcsv($output, [
        $row['employee_code'] ?? '',
        $row['full_name'] ?? '',
        $row['department_name'] ?? '',
        $row['manager_name'] ?? '',
        $presentText,
        $otStart,
        $otEnd,
        $notes,
    ]);
}
fclose($output);
exit;
