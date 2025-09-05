<?php

// /connection/get_departments.php ห้ามลบบรรทัดนี้

header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

$sql = "
SELECT d.id, d.name,
       d.manager_user_id,
       CONCAT(u.first_name, ' ', u.last_name) AS manager_name
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
