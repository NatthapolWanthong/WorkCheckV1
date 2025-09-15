<?php
header('Content-Type: application/json; charset=utf-8');
include "dbconfig.php";
include "dbconnect.php";

/**
 * helper: bind params (สร้าง refs ให้ mysqli_stmt_bind_param)
 */
function bind_params_refs(mysqli_stmt $stmt, string $types, array $params) {
    if ($types === '' || empty($params)) return true;
    // mysqli requires references
    $refs = [];
    foreach ($params as $k => $v) {
        $refs[$k] = &$params[$k];
    }
    array_unshift($refs, $types);
    return call_user_func_array([$stmt, 'bind_param'], $refs);
}

/**
 * normalize helpers
 */
function normalize_time($t) {
    if ($t === null) return null;
    $t = trim($t);
    if ($t === '') return null;
    if (strlen($t) === 5) return $t . ':00';
    return $t;
}

/* read input */
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Invalid JSON']);
    exit;
}
$date = $input['date'] ?? date('Y-m-d');
$records = $input['records'] ?? [];

/* session early (for authoritative user id) */
session_start();
$user_id = $_SESSION['user_id'] ?? null;

mysqli_begin_transaction($connection);

try {
    // ensure attendance day exists (fetch or insert)
    $stmt = mysqli_prepare($connection, "SELECT id FROM attendance_days WHERE att_date = ?");
    if (!$stmt) throw new Exception("Prepare failed (day select): " . mysqli_error($connection));
    mysqli_stmt_bind_param($stmt, "s", $date);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_store_result($stmt);
    mysqli_stmt_bind_result($stmt, $day_id);
    if (mysqli_stmt_num_rows($stmt) === 0) {
        mysqli_stmt_close($stmt);
        $ins = mysqli_prepare($connection, "INSERT INTO attendance_days (att_date) VALUES (?)");
        if (!$ins) throw new Exception("Prepare failed (day insert): " . mysqli_error($connection));
        mysqli_stmt_bind_param($ins, "s", $date);
        mysqli_stmt_execute($ins);
        $day_id = mysqli_insert_id($connection);
        mysqli_stmt_close($ins);
    } else {
        mysqli_stmt_fetch($stmt);
        mysqli_stmt_close($stmt);
    }

    // set @current_user_id for triggers (best-effort)
    if ($user_id !== null) {
        mysqli_query($connection, "SET @current_user_id = " . intval($user_id));
    } else {
        mysqli_query($connection, "SET @current_user_id = NULL");
    }

    // prepare existence check stmt once
    $checkStmt = mysqli_prepare($connection, "SELECT id FROM attendance_records WHERE day_id = ? AND user_id = ? LIMIT 1");
    if (!$checkStmt) throw new Exception("Prepare failed (check): " . mysqli_error($connection));

    // -- field map: key = incoming JSON key
    // each entry: column name, type for bind, insert_default (literal) or null, normalize callable optional, allow_null literal behavior for insert (if true and not provided -> insert NULL)
    $map = [
        'present' => ['col'=>'present','type'=>'i','insert_default'=>1,'normalize'=>function($v){ return intval($v); }, 'nullable'=>false],
        'clock_in' => ['col'=>'clock_in','type'=>'s','insert_default'=>'08:00:00','normalize'=>function($v){ return normalize_time($v); }, 'nullable'=>true],
        'clock_out' => ['col'=>'clock_out','type'=>'s','insert_default'=>'17:00:00','normalize'=>function($v){ return normalize_time($v); }, 'nullable'=>true],
        'ot_start' => ['col'=>'ot_start','type'=>'s','insert_default'=>null,'normalize'=>function($v){ return normalize_time($v); }, 'nullable'=>true],
        'ot_end' => ['col'=>'ot_end','type'=>'s','insert_default'=>null,'normalize'=>function($v){ return normalize_time($v); }, 'nullable'=>true],
        'ot_minutes' => ['col'=>'ot_minutes','type'=>'i','insert_default'=>null,'normalize'=>function($v){ return ($v === '' || $v === null) ? null : intval($v); }, 'nullable'=>true],
        'ot_task' => ['col'=>'ot_task','type'=>'s','insert_default'=>null,'normalize'=>function($v){ return ($v === '' || $v === null) ? null : $v; }, 'nullable'=>true],
        'product_count' => ['col'=>'product_count','type'=>'i','insert_default'=>null,'normalize'=>function($v){ return ($v === '' || $v === null) ? null : intval($v); }, 'nullable'=>true],
        // ot_result special: treat empty/null as NULL literal on insert; when provided and not empty => bind int
        'ot_result' => ['col'=>'ot_result','type'=>'i','insert_default'=>null,'normalize'=>function($v){ return ($v === '' || $v === null) ? null : intval($v); }, 'nullable'=>true, 'allow_null_literal'=>true],
        'notes' => ['col'=>'notes','type'=>'s','insert_default'=>null,'normalize'=>function($v){ return ($v === '' || $v === null) ? null : $v; }, 'nullable'=>true],
    ];

    $updated = []; $inserted = []; $ot_changed = [];

    foreach ($records as $rec) {
        $uid = isset($rec['user_id']) ? intval($rec['user_id']) : 0;
        if ($uid <= 0) continue;

        // existence check
        mysqli_stmt_bind_param($checkStmt, "ii", $day_id, $uid);
        mysqli_stmt_execute($checkStmt);
        mysqli_stmt_store_result($checkStmt);
        $hasExisting = (mysqli_stmt_num_rows($checkStmt) > 0);
        $existing_id = null;
        if ($hasExisting) {
            mysqli_stmt_bind_result($checkStmt, $existing_id);
            mysqli_stmt_fetch($checkStmt);
        }
        mysqli_stmt_free_result($checkStmt);

        if ($hasExisting) {
            // build update sets & params by walking map
            $sets = []; $types = ''; $params = [];
            $otChangedFlag = false;

            foreach ($map as $key => $def) {
                if (!array_key_exists($key, $rec)) continue;
                // special ot_result: if null/empty -> set literal NULL, not bind
                if ($key === 'ot_result') {
                    if ($rec[$key] === '' || $rec[$key] === null) {
                        $sets[] = $def['col'] . " = NULL";
                    } else {
                        $sets[] = $def['col'] . " = ?";
                        $types .= $def['type'];
                        $params[] = $def['normalize']($rec[$key]);
                    }
                    $otChangedFlag = true;
                    continue;
                }
                // normal fields
                $sets[] = $def['col'] . " = ?";
                $types .= $def['type'];
                $params[] = $def['normalize']($rec[$key]);
                if (strpos($def['col'], 'ot_') === 0 || $def['col'] === 'product_count') $otChangedFlag = true;
            }

            // notes handled in map already

            // if OT changed, set ot_approver_id (server authoritative)
            if ($otChangedFlag) {
                if ($user_id !== null) {
                    $sets[] = "ot_approver_id = ?";
                    $types .= 'i';
                    $params[] = intval($user_id);
                } else {
                    $sets[] = "ot_approver_id = NULL";
                }
            }

            if (empty($sets)) {
                continue; // nothing to update
            }

            // updated_at always
            $sets[] = "updated_at = CURRENT_TIMESTAMP";

            // WHERE params
            $types .= "ii";
            $params[] = $day_id;
            $params[] = $uid;

            $sql = "UPDATE attendance_records SET " . implode(", ", $sets) . " WHERE day_id = ? AND user_id = ?";
            $upd = mysqli_prepare($connection, $sql);
            if (!$upd) throw new Exception("Prepare failed (update): " . mysqli_error($connection));

            if (!bind_params_refs($upd, $types, $params)) throw new Exception("Bind failed (update): " . mysqli_error($connection));
            if (!mysqli_stmt_execute($upd)) throw new Exception("Execute failed (update): " . mysqli_stmt_error($upd));
            mysqli_stmt_close($upd);

            $updated[] = $uid;
            if ($otChangedFlag) $ot_changed[] = $uid;

        } else {
            // INSERT: build cols/placeholders by walking map
            $cols = ['day_id','user_id']; $placeholders = ['?','?']; $types = 'ii'; $params = [$day_id, $uid];
            $otPresentInInsert = false;

            foreach ($map as $key => $def) {
                // ot_result has special null literal behavior
                if ($key === 'ot_result') {
                    if (array_key_exists($key, $rec)) {
                        if ($rec[$key] === '' || $rec[$key] === null) {
                            $cols[] = $def['col'];
                            $placeholders[] = 'NULL';
                        } else {
                            $cols[] = $def['col'];
                            $placeholders[] = '?';
                            $types .= $def['type'];
                            $params[] = $def['normalize']($rec[$key]);
                        }
                        $otPresentInInsert = true;
                    } else {
                        // not provided -> insert NULL literal
                        $cols[] = $def['col'];
                        $placeholders[] = 'NULL';
                    }
                    continue;
                }

                if (array_key_exists($key, $rec)) {
                    $cols[] = $def['col'];
                    $placeholders[] = '?';
                    $types .= $def['type'];
                    $params[] = $def['normalize']($rec[$key]);
                    if (strpos($def['col'], 'ot_') === 0 || $def['col'] === 'product_count') $otPresentInInsert = true;
                } else {
                    // use insert_default (may be literal or null)
                    $cols[] = $def['col'];
                    if ($def['insert_default'] === null) {
                        $placeholders[] = 'NULL';
                    } else {
                        $placeholders[] = '?';
                        $types .= $def['type'];
                        $params[] = $def['insert_default'];
                    }
                }
            }

            // ot_approver_id: server authoritative or NULL literal
            if ($user_id !== null) {
                $cols[] = 'ot_approver_id';
                $placeholders[] = '?';
                $types .= 'i';
                $params[] = intval($user_id);
            } else {
                $cols[] = 'ot_approver_id';
                $placeholders[] = 'NULL';
            }

            $sql = "INSERT INTO attendance_records (" . implode(',', $cols) . ") VALUES (" . implode(',', $placeholders) . ")";
            $ins = mysqli_prepare($connection, $sql);
            if (!$ins) throw new Exception("Prepare failed (insert): " . mysqli_error($connection));

            if (!bind_params_refs($ins, $types, $params)) throw new Exception("Bind failed (insert): " . mysqli_error($connection));
            if (!mysqli_stmt_execute($ins)) throw new Exception("Execute failed (insert): " . mysqli_stmt_error($ins));
            mysqli_stmt_close($ins);

            $inserted[] = $uid;
            if ($otPresentInInsert) $ot_changed[] = $uid;
        }
    }

    mysqli_stmt_close($checkStmt);
    mysqli_commit($connection);

    echo json_encode([
        'status'=>'ok',
        'message'=>'Saved',
        'updated'=>array_values(array_unique($updated)),
        'inserted'=>array_values(array_unique($inserted)),
        'ot_changed'=>array_values(array_unique($ot_changed))
    ]);

} catch (Exception $e) {
    mysqli_rollback($connection);
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>$e->getMessage()]);
}