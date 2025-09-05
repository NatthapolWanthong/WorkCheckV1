<?php

include __DIR__ . "/connection/dbconfig.php";
include __DIR__ . "/connection/dbconnect.php";

// ============ MOCK USER ============
$UserID = 1;

// ============ LOAD USER ============
$sql = "
    SELECT u.*,
           d.name as department_name,
           d.CanView, d.CanEditor, d.CanViewHistory, d.CanExport, d.CanApproveOT, d.DepartmentView
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
";
$stmt = mysqli_prepare($connection, $sql);
mysqli_stmt_bind_param($stmt, "i", $UserID);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$currentUser = mysqli_fetch_assoc($res);
mysqli_stmt_close($stmt);

// ============ HELPER ============
function hasPermission($perm) {
    global $currentUser;
    if (!$currentUser) return false;

    // ถ้ามี is_manager และต้องการให้ manager ได้สิทธิพิเศษ
    if (!empty($currentUser['is_manager']) && $perm === 'CanApproveOT') {
        return true; 
    }

    return !empty($currentUser[$perm]) && $currentUser[$perm] == 1;
}
