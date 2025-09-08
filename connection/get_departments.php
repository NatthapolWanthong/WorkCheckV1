<?php

// /connection/get_departments.php

header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

$department_id = isset($_GET['department_id']) ? intval($_GET['department_id']) : 0;

if ($department_id > 0) {

    $sql = "SELECT department_view, can_edit, can_view_history
            FROM departments
            WHERE id = ?";
    $stmt = mysqli_prepare($connection, $sql);
    mysqli_stmt_bind_param($stmt, "i", $department_id);
    mysqli_stmt_execute($stmt);
    $res = mysqli_stmt_get_result($stmt);
    $out = mysqli_fetch_assoc($res) ?: [];
    mysqli_stmt_close($stmt);
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
} else {

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
}
