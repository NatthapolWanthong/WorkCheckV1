<?php
header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

// sanitize incoming
$department_id = isset($_GET['department_id']) ? intval($_GET['department_id']) : 0;
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

function send_json_error($msg, $code = 500) {
    http_response_code($code);
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

$base_sql = "
    SELECT d.id, d.name, d.manager_user_id,
           CONCAT(u.first_name, ' ', u.last_name) AS manager_name,
           d.department_view, d.can_edit, d.can_view_history
    FROM departments d
    LEFT JOIN users u ON u.id = d.manager_user_id
";

$out = null;

if ($department_id > 0) {
    // single row (with LIMIT)
    $sql = $base_sql . " WHERE d.id = ? LIMIT 1";
    $stmt = mysqli_prepare($connection, $sql);
    if (!$stmt) {
        send_json_error("Prepare failed: " . mysqli_error($connection), 500);
    }

    if (!mysqli_stmt_bind_param($stmt, "i", $department_id)) {
        mysqli_stmt_close($stmt);
        send_json_error("Bind param failed: " . mysqli_error($connection), 500);
    }

    if (!mysqli_stmt_execute($stmt)) {
        mysqli_stmt_close($stmt);
        send_json_error("Execute failed: " . mysqli_stmt_error($stmt), 500);
    }

    $res = mysqli_stmt_get_result($stmt);
    if ($res === false) {
        mysqli_stmt_close($stmt);
        send_json_error("Getting result failed: " . mysqli_error($connection), 500);
    }

    $row = mysqli_fetch_assoc($res);
    mysqli_free_result($res);
    mysqli_stmt_close($stmt);

    if ($row) {
        // add is_manager if user_id provided
        $row['is_manager'] = ($user_id && intval($row['manager_user_id']) === $user_id) ? true : false;
        $out = $row;
        echo json_encode($out, JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        http_response_code(404);
        echo json_encode([], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    // list all departments
    $sql = $base_sql . " ORDER BY d.name ASC";
    $stmt = mysqli_prepare($connection, $sql);
    if (!$stmt) {
        send_json_error("Prepare failed: " . mysqli_error($connection), 500);
    }

    if (!mysqli_stmt_execute($stmt)) {
        mysqli_stmt_close($stmt);
        send_json_error("Execute failed: " . mysqli_stmt_error($stmt), 500);
    }

    $res = mysqli_stmt_get_result($stmt);
    if ($res === false) {
        mysqli_stmt_close($stmt);
        send_json_error("Getting result failed: " . mysqli_error($connection), 500);
    }

    $out = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $out[] = $r;
    }

    mysqli_free_result($res);
    mysqli_stmt_close($stmt);

    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}
