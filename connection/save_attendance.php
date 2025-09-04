<?php

// /connection/save_attendance.php

header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Invalid JSON']);
    exit;
}
$date = $input['date'] ?? date('Y-m-d');
$records = $input['records'] ?? [];

mysqli_begin_transaction($connection);

try {
    $stmt = mysqli_prepare($connection, "SELECT id FROM attendance_days WHERE att_date = ?");
    mysqli_stmt_bind_param($stmt, "s", $date);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_bind_result($stmt, $day_id);
    if (!mysqli_stmt_fetch($stmt)) {
        // insert
        mysqli_stmt_close($stmt);
        $ins = mysqli_prepare($connection, "INSERT INTO attendance_days (att_date) VALUES (?)");
        mysqli_stmt_bind_param($ins, "s", $date);
        mysqli_stmt_execute($ins);
        $day_id = mysqli_insert_id($connection);
        mysqli_stmt_close($ins);
    } else {
        mysqli_stmt_close($stmt);
    }

    $upsert_sql = "
    INSERT INTO attendance_records (day_id, user_id, present, ot_start, ot_end, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE present = VALUES(present), ot_start = VALUES(ot_start), ot_end = VALUES(ot_end), notes = VALUES(notes), updated_at = CURRENT_TIMESTAMP
    ";
    $upsert = mysqli_prepare($connection, $upsert_sql);
    foreach ($records as $rec) {
        $uid = intval($rec['user_id']);
        $present = intval($rec['present'] ?? 0);
        $ot_start = $rec['ot_start'] ?? null;
        $ot_end = $rec['ot_end'] ?? null;
        $notes = $rec['notes'] ?? null;

        // normalize empty string to null
        if ($ot_start === '') $ot_start = null;
        if ($ot_end === '') $ot_end = null;

        mysqli_stmt_bind_param($upsert, "iiisss", $day_id, $uid, $present, $ot_start, $ot_end, $notes);
        mysqli_stmt_execute($upsert);
    }
    mysqli_stmt_close($upsert);

    mysqli_commit($connection);
    echo json_encode(['status'=>'ok','message'=>'Saved']);
} catch (Exception $e) {
    mysqli_rollback($connection);
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>$e->getMessage()]);
}
