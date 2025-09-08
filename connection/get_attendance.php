<?php

// /connection/get_attendance.php ห้ามลบบรรทัดนี้

header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

$date = $_GET['date'] ?? date('Y-m-d');
$department_id = isset($_GET['department_id']) && $_GET['department_id'] !== '' ? intval($_GET['department_id']) : null;
$allowed = $_GET['allowed_departments'] ?? "0";
$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'first_name';
$order = strtoupper($_GET['order'] ?? 'ASC');
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

// ---------- หา day_id ----------
$day_id = null;
$stmt = mysqli_prepare($connection, "SELECT id FROM attendance_days WHERE att_date = ?");
mysqli_stmt_bind_param($stmt, "s", $date);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $did);
if (mysqli_stmt_fetch($stmt)) { $day_id = $did; }
mysqli_stmt_close($stmt);

// ---------- where clauses ----------
$params = [];
$where_clauses = [];
$types = "";

// search
$search_sql = "";
if ($search !== '') {
    $where_clauses[] = "(u.employee_code LIKE CONCAT('%',?,'%') OR u.first_name LIKE CONCAT('%',?,'%') OR u.last_name LIKE CONCAT('%',?,'%'))";
    $params[] = $search;
    $params[] = $search;
    $params[] = $search;
    $types .= "sss";
}

// filter department_id
if ($department_id) {
    $where_clauses[] = "u.department_id = ?";
    $params[] = $department_id;
    $types .= "i";
}

// filter ตามสิทธิ์ allowed_departments
if ($allowed !== "0") {
    $ids = array_map('intval', explode(",", $allowed));
    if (count($ids) > 0) {
        $placeholders = implode(",", array_fill(0, count($ids), "?"));
        $where_clauses[] = "u.department_id IN ($placeholders)";
        foreach ($ids as $id) {
            $params[] = $id;
            $types .= "i";
        }
    }
}

$where_sql = "";
if (count($where_clauses) > 0) {
    $where_sql = " AND " . implode(" AND ", $where_clauses);
}

// ---------- นับจำนวน ----------
$count_sql = "SELECT COUNT(*) as total FROM users u WHERE 1=1 {$where_sql}";
$count_stmt = mysqli_prepare($connection, $count_sql);
if ($count_stmt) {
    if ($types !== "") {
        mysqli_stmt_bind_param($count_stmt, $types, ...$params);
    }
    mysqli_stmt_execute($count_stmt);
    mysqli_stmt_bind_result($count_stmt, $total);
    mysqli_stmt_fetch($count_stmt);
    mysqli_stmt_close($count_stmt);
} else {
    $total = 0;
}

// ---------- main query ----------
$cols = "u.id as user_id, u.employee_code, u.first_name, u.last_name, 
         u.department_id, d.name as department_name, 
         CONCAT(m.first_name,' ',m.last_name) as manager_name";

if ($day_id) {
    $cols .= ", COALESCE(ar.present,1) as present,
           ar.ot_start, ar.ot_end, 
           ar.ot_task, ar.ot_result,
           ar.ot_approver_id,
           ar.notes, ar.updated_at as date_modified,
           CONCAT(a.first_name,' ',a.last_name) as ot_approver,
           CASE WHEN ar.ot_result=1 THEN '✔ ผ่าน' ELSE '' END as ot_result_text";
    $sql = "SELECT {$cols}
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN users m ON m.id = d.manager_user_id
    LEFT JOIN attendance_records ar ON ar.user_id=u.id AND ar.day_id=?
    LEFT JOIN users a ON ar.ot_approver_id=a.id
    WHERE 1=1 {$where_sql} {$search_sql}";

    $allowed_sorts = ['employee_code','first_name','last_name','department_name','present','ot_start','ot_end','date_modified'];
    if (!in_array($sort, $allowed_sorts)) $sort = 'first_name';
    $sql .= " ORDER BY {$sort} {$order} LIMIT ? OFFSET ?";

    $stmt = mysqli_prepare($connection, $sql);

    $types2 = "i" . $types . "ii";
    $bind_values = array_merge([$day_id], $params, [$limit, $offset]);

    mysqli_stmt_bind_param($stmt, $types2, ...$bind_values);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);

} else {
    $cols .= ", 1 as present, NULL as ot_start, NULL as ot_end, NULL as notes, NULL as date_modified";
    $sql = "SELECT {$cols}
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN users m ON m.id = d.manager_user_id
    WHERE 1=1 {$where_sql} {$search_sql}";

    $allowed_sorts = ['employee_code','first_name','last_name','department_name'];
    if (!in_array($sort, $allowed_sorts)) $sort = 'first_name';
    $sql .= " ORDER BY {$sort} {$order} LIMIT ? OFFSET ?";

    $stmt = mysqli_prepare($connection, $sql);

    $types2 = $types . "ii";
    $bind_values = array_merge($params, [$limit, $offset]);

    if ($types2 !== "") {
        mysqli_stmt_bind_param($stmt, $types2, ...$bind_values);
    } else {
        mysqli_stmt_bind_param($stmt, "ii", $limit, $offset);
    }

    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
}

// ---------- output ----------
$rows = [];
while ($r = mysqli_fetch_assoc($res)) {
    $r['full_name'] = $r['first_name'] . ' ' . $r['last_name'];
    $r['present'] = intval($r['present']);
    $rows[] = $r;
}

echo json_encode([
    'total' => intval($total),
    'rows' => $rows
], JSON_UNESCAPED_UNICODE);
