<?php
header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

date_default_timezone_set('UTC');

$date = $_GET['date'] ?? date('Y-m-d');
$department_id = isset($_GET['department_id']) && $_GET['department_id'] !== '' ? intval($_GET['department_id']) : null;
$allowed = $_GET['allowed_departments'] ?? "0";
$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'first_name';
$order = strtoupper($_GET['order'] ?? 'ASC');
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

/**
 * Helper: bind params to mysqli_stmt using references (call_user_func_array)
 */
function bind_stmt_params(mysqli_stmt $stmt, string $types, array $params) {
    if ($types === '' || count($params) === 0) return;
    // mysqli_stmt::bind_param requires references
    $bind_names = [];
    $bind_names[] = $types;
    for ($i = 0; $i < count($params); $i++) {
        // ensure each param is a variable (reference)
        $bind_names[] = &$params[$i];
    }
    call_user_func_array([$stmt, 'bind_param'], $bind_names);
}

/**
 * Build where clauses + types + params
 */
$where_clauses = [];
$types = "";
$params = [];

// ensure users active on date
$where_clauses[] = "(u.join_date IS NULL OR u.join_date <= ?)";
$types .= "s";
$params[] = $date;

$where_clauses[] = "(u.leave_date IS NULL OR u.leave_date >= ?)";
$types .= "s";
$params[] = $date;

// search
if ($search !== '') {
    $where_clauses[] = "(u.employee_code LIKE CONCAT('%',?,'%') OR u.first_name LIKE CONCAT('%',?,'%') OR u.last_name LIKE CONCAT('%',?,'%'))";
    $types .= "sss";
    $params[] = $search;
    $params[] = $search;
    $params[] = $search;
}

// filter department_id
if ($department_id) {
    $where_clauses[] = "u.department_id = ?";
    $types .= "i";
    $params[] = $department_id;
}

// allowed departments (comma list or "0")
if ($allowed !== "0") {
    $ids = array_values(array_filter(array_map('intval', explode(",", $allowed))));
    if (count($ids) > 0) {
        $placeholders = implode(",", array_fill(0, count($ids), "?"));
        $where_clauses[] = "u.department_id IN ($placeholders)";
        foreach ($ids as $id) {
            $types .= "i";
            $params[] = $id;
        }
    }
}

$where_sql = "";
if (count($where_clauses) > 0) {
    $where_sql = " AND " . implode(" AND ", $where_clauses);
}

// ---------- get day_id and dayCreatedAt ----------
$day_id = null;
$dayCreatedAt = null;
$stmt = mysqli_prepare($connection, "SELECT id, created_at FROM attendance_days WHERE att_date = ? LIMIT 1");
if ($stmt) {
    bind_stmt_params($stmt, "s", [$date]);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_bind_result($stmt, $did, $dcreated);
    if (mysqli_stmt_fetch($stmt)) {
        $day_id = $did;
        $dayCreatedAt = $dcreated;
    }
    mysqli_stmt_close($stmt);
}

// To unify SQL we will always LEFT JOIN attendance_records ON ar.day_id = ?
// If $day_id is null we bind 0 (no record has id 0) so LEFT JOIN yields no matches,
// and COALESCE() in SELECT provides defaults.
$day_param_for_bind = $day_id ?? 0;

// ---------- COUNT ----------
$count_sql = "SELECT COUNT(*) as total FROM users u WHERE 1=1 {$where_sql}";
$count_stmt = mysqli_prepare($connection, $count_sql);
$total = 0;
if ($count_stmt) {
    if ($types !== "") {
        // copy params because bind needs references and we may reuse $params later
        $count_params = $params;
        bind_stmt_params($count_stmt, $types, $count_params);
    }
    mysqli_stmt_execute($count_stmt);
    mysqli_stmt_bind_result($count_stmt, $total);
    mysqli_stmt_fetch($count_stmt);
    mysqli_stmt_close($count_stmt);
} else {
    // fallback to 0 if prepare failed
    $total = 0;
}

// ---------- BUILD MAIN QUERY (single unified block) ----------
$base_cols = "u.id as user_id, u.employee_code, u.first_name, u.last_name, 
         u.department_id, d.name as department_name, 
         CONCAT(m.first_name,' ',m.last_name) as manager_name";

$joins = " LEFT JOIN departments d ON d.id = u.department_id
           LEFT JOIN users m ON m.id = d.manager_user_id
           LEFT JOIN attendance_records ar ON ar.user_id = u.id AND ar.day_id = ?
           LEFT JOIN users a ON a.id = ar.ot_approver_id";

// unified columns: use COALESCE for time defaults; ot_result_text NULL when ar.ot_result IS NULL
$cols = $base_cols . ",
       COALESCE(ar.present, 1) AS present,
       COALESCE(ar.clock_in, '08:00:00') AS clock_in,
       COALESCE(ar.clock_out, '17:00:00') AS clock_out,
       ar.ot_start, ar.ot_end, ar.ot_minutes, ar.ot_task, ar.product_count, ar.ot_result,
       ar.ot_approver_id,
       ar.notes, ar.updated_at AS date_modified,
       CONCAT(a.first_name,' ',a.last_name) AS ot_approver,
       CASE WHEN ar.ot_result IS NULL THEN NULL WHEN ar.ot_result = 1 THEN 'ได้ตามเป้า' ELSE 'ไม่ได้ตามเป้า' END AS ot_result_text";

$allowed_sorts = ['employee_code','first_name','last_name','department_name','present','ot_start','ot_end','date_modified','clock_in','clock_out'];
// if no day (day_id == null) we restrict allowed sorts to subset to avoid sorting by non-existing columns
if ($day_id === null) {
    $allowed_sorts = ['employee_code','first_name','last_name','department_name'];
}

// sanitize sort
if (!in_array($sort, $allowed_sorts)) $sort = 'first_name';
$order_by = ($sort === 'department_name') ? 'd.name' : $sort;

$sql = "SELECT {$cols} FROM users u {$joins} WHERE 1=1 {$where_sql} ORDER BY {$order_by} {$order} LIMIT ? OFFSET ?";

$stmt = mysqli_prepare($connection, $sql);
if (!$stmt) {
    // prepare failed: return minimal error response (production-friendly)
    http_response_code(500);
    echo json_encode(['error' => 'Database prepare failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

// bind parameters: day_param first, then where params, then limit & offset
$main_bind_params = array_merge([$day_param_for_bind], $params, [$limit, $offset]);
$main_types = "i" . $types . "ii";

// bind and execute
bind_stmt_params($stmt, $main_types, $main_bind_params);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

// ---------- output processing ----------
$rows = [];
while ($r = mysqli_fetch_assoc($res)) {
    $r['full_name'] = trim($r['first_name'] . ' ' . $r['last_name']);
    $r['present'] = isset($r['present']) ? intval($r['present']) : 0;
    if (isset($r['ot_minutes']) && $r['ot_minutes'] !== null) $r['ot_minutes'] = intval($r['ot_minutes']);
    if (isset($r['product_count']) && $r['product_count'] !== null) $r['product_count'] = intval($r['product_count']);
    // fallback date_modified to dayCreatedAt if null or empty
    if ((empty($r['date_modified']) || $r['date_modified'] === null) && !empty($dayCreatedAt)) {
        $r['date_modified'] = $dayCreatedAt;
    }
    $rows[] = $r;
}

// ensure numeric total
$total = intval($total);

echo json_encode([
    'total' => $total,
    'rows' => $rows
], JSON_UNESCAPED_UNICODE);
