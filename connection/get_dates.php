<?php

// /connection/get_dates.php ห้ามลบบรรทัดนี้

header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

$sql = "SELECT att_date FROM attendance_days ORDER BY att_date DESC";
$res = mysqli_query($connection, $sql);
$out = [];
while ($r = mysqli_fetch_assoc($res)) {
    $out[] = $r['att_date'];
}
echo json_encode($out, JSON_UNESCAPED_UNICODE);
