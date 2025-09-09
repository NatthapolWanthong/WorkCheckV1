<?php

// /connection/save_attendance.php ห้ามลบบรรทัดนี้

header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

/**
 * Helper: bind params to mysqli_stmt using call_user_func_array (needs references)
 */
function bind_stmt_params($stmt, $types, $params) {
    if ($params === []) {
        return true;
    }
    $bind_names[] = $types;
    for ($i=0; $i<count($params); $i++) {
        // make sure each param is a variable (reference)
        $bind_name = 'bind' . $i;
        $$bind_name = $params[$i];
        $bind_names[] = &$$bind_name;
    }
    return call_user_func_array(array($stmt, 'bind_param'), $bind_names);
}

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
    // --- ensure attendance day exists ---
    $stmt = mysqli_prepare($connection, "SELECT id FROM attendance_days WHERE att_date = ?");
    if (!$stmt) throw new Exception("Prepare failed (day select): " . mysqli_error($connection));
    mysqli_stmt_bind_param($stmt, "s", $date);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_bind_result($stmt, $day_id);
    if (!mysqli_stmt_fetch($stmt)) {
        mysqli_stmt_close($stmt);
        $ins = mysqli_prepare($connection, "INSERT INTO attendance_days (att_date) VALUES (?)");
        if (!$ins) throw new Exception("Prepare failed (day insert): " . mysqli_error($connection));
        mysqli_stmt_bind_param($ins, "s", $date);
        mysqli_stmt_execute($ins);
        $day_id = mysqli_insert_id($connection);
        mysqli_stmt_close($ins);
    } else {
        mysqli_stmt_close($stmt);
    }

    // set @current_user_id for triggers
    session_start();
    $user_id = $_SESSION['user_id'] ?? null;
    if ($user_id !== null) {
        mysqli_query($connection, "SET @current_user_id = " . intval($user_id));
    } else {
        mysqli_query($connection, "SET @current_user_id = NULL");
    }

    // prepare check existence statement
    $checkStmt = mysqli_prepare($connection, "SELECT id FROM attendance_records WHERE day_id = ? AND user_id = ? LIMIT 1");
    if (!$checkStmt) throw new Exception("Prepare failed (check): " . mysqli_error($connection));

    // We'll prepare generic statements inside loop as needed (UPDATE/INSERT will be dynamic per-record)
    foreach ($records as $rec) {
        $uid = isset($rec['user_id']) ? intval($rec['user_id']) : 0;
        if ($uid <= 0) continue;

        // normalize time strings (if hh:mm -> hh:mm:00)
        $normalize_time = function($t) {
            if ($t === null) return null;
            $t = trim($t);
            if ($t === '') return null;
            if (strlen($t) === 5) return $t . ':00';
            return $t;
        };

        // First check existence
        mysqli_stmt_bind_param($checkStmt, "ii", $day_id, $uid);
        mysqli_stmt_execute($checkStmt);
        mysqli_stmt_bind_result($checkStmt, $existing_id);
        $hasExisting = false;
        if (mysqli_stmt_fetch($checkStmt)) {
            $hasExisting = true;
        }
        // reset result buffer
        mysqli_stmt_free_result($checkStmt);

        if ($hasExisting) {
            // --- UPDATE only columns present in $rec ---
            $sets = [];
            $types = '';
            $params = [];

            if (array_key_exists('present', $rec)) {
                $sets[] = "present = ?";
                $types .= 'i';
                $params[] = intval($rec['present']);
            }
            if (array_key_exists('clock_in', $rec)) {
                $sets[] = "clock_in = ?";
                $types .= 's';
                $params[] = $normalize_time($rec['clock_in']);
            }
            if (array_key_exists('clock_out', $rec)) {
                $sets[] = "clock_out = ?";
                $types .= 's';
                $params[] = $normalize_time($rec['clock_out']);
            }
            if (array_key_exists('ot_start', $rec)) {
                $sets[] = "ot_start = ?";
                $types .= 's';
                $params[] = $normalize_time($rec['ot_start']);
            }
            if (array_key_exists('ot_end', $rec)) {
                $sets[] = "ot_end = ?";
                $types .= 's';
                $params[] = $normalize_time($rec['ot_end']);
            }
            if (array_key_exists('ot_minutes', $rec)) {
                $sets[] = "ot_minutes = ?";
                $types .= 'i';
                $params[] = $rec['ot_minutes'] === '' ? null : intval($rec['ot_minutes']);
            }
            if (array_key_exists('ot_task', $rec)) {
                $sets[] = "ot_task = ?";
                $types .= 's';
                $params[] = $rec['ot_task'] === '' ? null : $rec['ot_task'];
            }
            if (array_key_exists('product_count', $rec)) {
                $sets[] = "product_count = ?";
                $types .= 'i';
                $params[] = $rec['product_count'] === '' ? null : intval($rec['product_count']);
            }
            if (array_key_exists('ot_result', $rec)) {
                $sets[] = "ot_result = ?";
                $types .= 'i';
                $params[] = intval($rec['ot_result']);
            }
            if (array_key_exists('notes', $rec)) {
                $sets[] = "notes = ?";
                $types .= 's';
                $params[] = $rec['notes'] === '' ? null : $rec['notes'];
            }

            // if any of OT-related fields changed, update ot_approver_id to current user
            $otFields = ['ot_start','ot_end','ot_minutes','ot_task','product_count','ot_result'];
            $otChanged = false;
            foreach ($otFields as $f) {
                if (array_key_exists($f, $rec)) { $otChanged = true; break; }
            }
            if ($otChanged && $user_id !== null) {
                $sets[] = "ot_approver_id = ?";
                $types .= 'i';
                $params[] = intval($user_id);
            }

            if (count($sets) === 0) {
                // nothing to update for this record
                continue;
            }

            // always update updated_at
            $sets[] = "updated_at = CURRENT_TIMESTAMP";

            $sql = "UPDATE attendance_records SET " . implode(", ", $sets) . " WHERE day_id = ? AND user_id = ?";
            $types .= "ii";
            $params[] = $day_id;
            $params[] = $uid;

            $upd = mysqli_prepare($connection, $sql);
            if (!$upd) throw new Exception("Prepare failed (update): " . mysqli_error($connection));

            if (!bind_stmt_params($upd, $types, $params)) {
                throw new Exception("Bind params failed (update): " . mysqli_error($connection));
            }
            $ok = mysqli_stmt_execute($upd);
            if (!$ok) {
                throw new Exception("Execute failed (update): " . mysqli_stmt_error($upd));
            }
            mysqli_stmt_close($upd);

        } else {
            // --- INSERT: build columns & values, use provided values or defaults ---
            $cols = ['day_id','user_id','present','clock_in','clock_out','ot_start','ot_end','ot_minutes','ot_task','product_count','ot_result','ot_approver_id','notes'];
            $placeholders = [];
            $types = '';
            $params = [];

            // day_id, user_id
            $placeholders[] = '?'; $types .= 'i'; $params[] = $day_id;
            $placeholders[] = '?'; $types .= 'i'; $params[] = $uid;

            // present
            if (array_key_exists('present', $rec)) {
                $placeholders[] = '?'; $types .= 'i'; $params[] = intval($rec['present']);
            } else {
                $placeholders[] = '?'; $types .= 'i'; $params[] = 1; // default present=1
            }

            // clock_in
            if (array_key_exists('clock_in', $rec)) {
                $placeholders[] = '?'; $types .= 's'; $params[] = $normalize_time($rec['clock_in']);
            } else {
                $placeholders[] = '?'; $types .= 's'; $params[] = '08:00:00';
            }

            // clock_out
            if (array_key_exists('clock_out', $rec)) {
                $placeholders[] = '?'; $types .= 's'; $params[] = $normalize_time($rec['clock_out']);
            } else {
                $placeholders[] = '?'; $types .= 's'; $params[] = '17:00:00';
            }

            // ot_start
            if (array_key_exists('ot_start', $rec)) {
                $placeholders[] = '?'; $types .= 's'; $params[] = $normalize_time($rec['ot_start']);
            } else {
                $placeholders[] = '?'; $types .= 's'; $params[] = null;
            }

            // ot_end
            if (array_key_exists('ot_end', $rec)) {
                $placeholders[] = '?'; $types .= 's'; $params[] = $normalize_time($rec['ot_end']);
            } else {
                $placeholders[] = '?'; $types .= 's'; $params[] = null;
            }

            // ot_minutes
            if (array_key_exists('ot_minutes', $rec)) {
                $placeholders[] = '?'; $types .= 'i'; $params[] = $rec['ot_minutes'] === '' ? null : intval($rec['ot_minutes']);
            } else {
                $placeholders[] = '?'; $types .= 'i'; $params[] = null;
            }

            // ot_task
            if (array_key_exists('ot_task', $rec)) {
                $placeholders[] = '?'; $types .= 's'; $params[] = $rec['ot_task'] === '' ? null : $rec['ot_task'];
            } else {
                $placeholders[] = '?'; $types .= 's'; $params[] = null;
            }

            // product_count
            if (array_key_exists('product_count', $rec)) {
                $placeholders[] = '?'; $types .= 'i'; $params[] = $rec['product_count'] === '' ? null : intval($rec['product_count']);
            } else {
                $placeholders[] = '?'; $types .= 'i'; $params[] = null;
            }

            // ot_result
            if (array_key_exists('ot_result', $rec)) {
                $placeholders[] = '?'; $types .= 'i'; $params[] = intval($rec['ot_result']);
            } else {
                $placeholders[] = '?'; $types .= 'i'; $params[] = 0;
            }

            // ot_approver_id -> set to current user if available
            if ($user_id !== null) {
                $placeholders[] = '?'; $types .= 'i'; $params[] = intval($user_id);
            } else {
                $placeholders[] = '?'; $types .= 'i'; $params[] = null;
            }

            // notes
            if (array_key_exists('notes', $rec)) {
                $placeholders[] = '?'; $types .= 's'; $params[] = $rec['notes'] === '' ? null : $rec['notes'];
            } else {
                $placeholders[] = '?'; $types .= 's'; $params[] = null;
            }

            $sql = "INSERT INTO attendance_records (" . implode(',', $cols) . ") VALUES (" . implode(',', $placeholders) . ")";
            $ins = mysqli_prepare($connection, $sql);
            if (!$ins) throw new Exception("Prepare failed (insert): " . mysqli_error($connection));

            if (!bind_stmt_params($ins, $types, $params)) {
                throw new Exception("Bind params failed (insert): " . mysqli_error($connection));
            }
            $ok = mysqli_stmt_execute($ins);
            if (!$ok) {
                throw new Exception("Execute failed (insert): " . mysqli_stmt_error($ins));
            }
            mysqli_stmt_close($ins);
        }
    }

    mysqli_stmt_close($checkStmt);
    mysqli_commit($connection);
    echo json_encode(['status'=>'ok','message'=>'Saved']);
} catch (Exception $e) {
    mysqli_rollback($connection);
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>$e->getMessage()]);
}
