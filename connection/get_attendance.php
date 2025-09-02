<?php
header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

/*
Expected GET params (bootstrap-table defaults):
- date (YYYY-MM-DD)  [required]
- department_id (optional)
- search (optional) -- bootstrap-table sends 'search'
- sort (column) optional
- order ('asc'/'desc') optional
- limit (page size)
- offset (start)
*/

$date = $_GET['date'] ?? date('Y-m-d');
$department_id = isset($_GET['department_id']) && $_GET['department_id'] !== '' ? intval($_GET['department_id']) : null;
$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'first_name';
$order = strtoupper($_GET['order'] ?? 'ASC');
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

// find or create day (we will not create here; just check)
$day_id = null;
$stmt = mysqli_prepare($connection, "SELECT id FROM attendance_days WHERE att_date = ?");
mysqli_stmt_bind_param($stmt, "s", $date);
mysqli_stmt_execute($stmt);
mysqli_stmt_bind_result($stmt, $did);
if (mysqli_stmt_fetch($stmt)) { $day_id = $did; }
mysqli_stmt_close($stmt);

// Build base query: left join attendance_records if day exists
$params = [];
$where_clauses = [];
$search_sql = "";
if ($search !== '') {
    // search on employee_code OR name
    $search_sql = " AND (u.employee_code LIKE CONCAT('%',?,'%') OR u.first_name LIKE CONCAT('%',?,'%') OR u.last_name LIKE CONCAT('%',?,'%')) ";
    $params[] = $search;
    $params[] = $search;
    $params[] = $search;
}

if ($department_id) {
    $where_clauses[] = " u.department_id = ? ";
    $params[] = $department_id;
}

$where_sql = "";
if (count($where_clauses) > 0) {
    $where_sql = " AND " . implode(" AND ", $where_clauses);
}

// count total
$count_sql = "SELECT COUNT(*) as total FROM users u WHERE 1=1 {$where_sql}";
$count_stmt = mysqli_prepare($connection, $count_sql);
if ($count_stmt) {
    // bind department param only (search not in count here for simplicity)
    if ($department_id) {
        mysqli_stmt_bind_param($count_stmt, "i", $department_id);
    }
    mysqli_stmt_execute($count_stmt);
    mysqli_stmt_bind_result($count_stmt, $total);
    mysqli_stmt_fetch($count_stmt);
    mysqli_stmt_close($count_stmt);
} else {
    $total = 0;
}

// Build data query
// If day_id exists -> left join attendance_records ar on day_id
// else -> return users with present=1 default
$cols = "u.id as user_id, u.employee_code, u.first_name, u.last_name, u.department_id, d.name as department_name, CONCAT(m.first_name,' ',m.last_name) as manager_name";

if ($day_id) {
    $cols .= ", COALESCE(ar.present,1) as present, ar.ot_start, ar.ot_end, ar.notes";
    $sql = "SELECT {$cols}
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN users m ON m.id = d.manager_user_id
    LEFT JOIN attendance_records ar ON ar.user_id = u.id AND ar.day_id = ?
    WHERE 1=1 {$where_sql} {$search_sql}
    ";
    // Sorting safe map
    $allowed_sorts = ['employee_code','first_name','last_name','department_name','present','ot_start','ot_end'];
    if (!in_array($sort, $allowed_sorts)) $sort = 'first_name';
    $sql .= " ORDER BY {$sort} {$order} LIMIT ? OFFSET ?";

    $stmt = mysqli_prepare($connection, $sql);
    // bind params: day_id first, then where params, then search params, then limit offset
    // We'll construct types dynamically
    $types = "i"; // day_id
    $bind_values = [$day_id];

    // where params (department)
    if ($department_id) { $types .= "i"; $bind_values[] = $department_id; }

    // search params
    if ($search !== '') { $types .= "sss"; $bind_values[] = $search; $bind_values[] = $search; $bind_values[] = $search; }

    $types .= "ii";
    $bind_values[] = $limit;
    $bind_values[] = $offset;

    // Prepare bind
    mysqli_stmt_bind_param($stmt, $types, ...$bind_values);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
} else {
    // day doesn't exist -> return users default present = 1, ot null
    $cols .= ", 1 as present, NULL as ot_start, NULL as ot_end, NULL as notes";
    $sql = "SELECT {$cols}
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    LEFT JOIN users m ON m.id = d.manager_user_id
    WHERE 1=1 {$where_sql} {$search_sql}
    ";
    $allowed_sorts = ['employee_code','first_name','last_name','department_name'];
    if (!in_array($sort, $allowed_sorts)) $sort = 'first_name';
    $sql .= " ORDER BY {$sort} {$order} LIMIT ? OFFSET ?";

    $stmt = mysqli_prepare($connection, $sql);

    // build types
    $types = "";
    $bind_values = [];
    if ($department_id) { $types .= "i"; $bind_values[] = $department_id; }
    if ($search !== '') { $types .= "sss"; $bind_values[] = $search; $bind_values[] = $search; $bind_values[] = $search; }
    $types .= "ii";
    $bind_values[] = $limit;
    $bind_values[] = $offset;

    // bind params if any
    if ($types !== "") {
        mysqli_stmt_bind_param($stmt, $types, ...$bind_values);
    }
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
}

// fetch rows
$rows = [];
while ($r = mysqli_fetch_assoc($res)) {
    $r['full_name'] = $r['first_name'] . ' ' . $r['last_name'];
    // coerce present to int
    $r['present'] = intval($r['present']);
    $rows[] = $r;
}

echo json_encode([
    'total' => intval($total),
    'rows' => $rows
], JSON_UNESCAPED_UNICODE);
