<?php

// /connection/save_attendance.php ห้ามลบบรรทัดนี้

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

    session_start();
    $user_id = $_SESSION['user_id'] ?? null;

    $upsert_sql = "
    INSERT INTO attendance_records 
    (day_id, user_id, present, ot_start, ot_end, ot_task, ot_result, ot_approver_id, notes)
    VALUES (?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
    present=VALUES(present),
    ot_start=VALUES(ot_start),
    ot_end=VALUES(ot_end),
    ot_task=VALUES(ot_task),
    ot_result=VALUES(ot_result),
    ot_approver_id=VALUES(ot_approver_id),
    notes=VALUES(notes),
    updated_at=CURRENT_TIMESTAMP";
    $upsert = mysqli_prepare($connection, $upsert_sql);
    // (ภายใน foreach ของ $records)
foreach ($records as $rec) {
    $uid = isset($rec['user_id']) ? intval($rec['user_id']) : 0;
    $present = isset($rec['present']) ? intval($rec['present']) : 0;

    // ถ้า key ไม่มี หรือ เป็น empty string => เก็บเป็น NULL (เพื่อให้ DB ได้ค่า NULL)
    $ot_start  = (isset($rec['ot_start']) && $rec['ot_start'] !== '') ? $rec['ot_start'] : null;
    $ot_end    = (isset($rec['ot_end'])   && $rec['ot_end']   !== '') ? $rec['ot_end']   : null;
    $ot_task   = (isset($rec['ot_task'])  && $rec['ot_task']  !== '') ? $rec['ot_task']  : null;
    $ot_result = isset($rec['ot_result']) ? intval($rec['ot_result']) : 0;
    $notes     = (isset($rec['notes'])    && $rec['notes']    !== '') ? $rec['notes']    : null;

    mysqli_stmt_bind_param($upsert,"iiisssiss",
        $day_id, $uid, $present, $ot_start, $ot_end, $ot_task, $ot_result, $user_id, $notes);
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
