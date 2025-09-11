<?php
// /connection/get_departments.php ห้ามลบบรรทัดนี้
header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

// sanitize incoming
$department_id = isset($_GET['department_id']) ? intval($_GET['department_id']) : 0;
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($department_id > 0) {
    // Return the full department row for the requested id.
    // Also include an is_manager flag if user_id provided (compare to manager_user_id).
    $sql = "SELECT d.id, d.name, d.manager_user_id,
                   CONCAT(u.first_name, ' ', u.last_name) AS manager_name,
                   d.department_view, d.can_edit, d.can_view_history
            FROM departments d
            LEFT JOIN users u ON u.id = d.manager_user_id
            WHERE d.id = ?
            LIMIT 1";
    $stmt = mysqli_prepare($connection, $sql);
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "i", $department_id);
        mysqli_stmt_execute($stmt);
        $res = mysqli_stmt_get_result($stmt);
        $out = mysqli_fetch_assoc($res) ?: [];
        mysqli_stmt_close($stmt);

        // add is_manager if user_id provided
        if (!empty($out)) {
            $out['is_manager'] = ($user_id && intval($out['manager_user_id']) === $user_id) ? true : false;
        }

        echo json_encode($out, JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        // fallback error
        echo json_encode([], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    // Return all departments (list)
    $sql = "
    SELECT d.id, d.name,
           d.manager_user_id,
           CONCAT(u.first_name, ' ', u.last_name) AS manager_name,
           d.department_view,
           d.can_edit,
           d.can_view_history
    FROM departments d
    LEFT JOIN users u ON u.id = d.manager_user_id
    ORDER BY d.name ASC
    ";
    $res = mysqli_query($connection, $sql);
    $out = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $out[] = $r;
    }
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}
