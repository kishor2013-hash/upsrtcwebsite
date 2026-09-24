<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Submit New Duty Record
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$currentUser = requireAuth();
$input = getJsonInput();

// Required Fields
$dutyDate = trim($input['duty_date'] ?? '');
$dutyNumber = trim($input['duty_number'] ?? 'Duty 1');
$busNumber = strtoupper(trim($input['bus_number'] ?? ''));
$route = trim($input['route'] ?? '');
$startPoint = trim($input['start_point'] ?? '');
$endPoint = trim($input['end_point'] ?? '');
$totalKm = floatval($input['total_km'] ?? 0);
$income = floatval($input['income'] ?? 0);

if (empty($dutyDate)) {
    jsonResponse(['success' => false, 'message' => 'Duty Date is required.'], 422);
}
if (empty($busNumber)) {
    jsonResponse(['success' => false, 'message' => 'Bus Number is required.'], 422);
}
if (empty($route)) {
    jsonResponse(['success' => false, 'message' => 'Route details are required.'], 422);
}
if ($totalKm <= 0) {
    jsonResponse(['success' => false, 'message' => 'Total KM must be greater than 0.'], 422);
}

// Optional Fields
$busRegNumber = trim($input['bus_reg_number'] ?? '');
$routeNumber = trim($input['route_number'] ?? '');
$startTime = !empty($input['start_time']) ? trim($input['start_time']) : null;
$endTime = !empty($input['end_time']) ? trim($input['end_time']) : null;
$shift = trim($input['shift'] ?? 'Morning');
$passengerCount = intval($input['passenger_count'] ?? 0);
$loadFactor = floatval($input['load_factor'] ?? 0);
$tripsCount = max(1, intval($input['trips_count'] ?? 1));
$ticketCollection = floatval($input['ticket_collection'] ?? $income);
$cashCollection = floatval($input['cash_collection'] ?? 0);
$remarks = trim($input['remarks'] ?? '');

try {
    // Duplicate submission protection: check if submitted within last 3 minutes with same date & bus
    $dupCheck = $pdo->prepare("SELECT id, record_id, created_at FROM duty_records 
        WHERE user_id = ? AND duty_date = ? AND duty_number = ? AND bus_number = ? AND status = 'SUBMITTED' AND created_at > (NOW() - INTERVAL 3 MINUTE)
        LIMIT 1");
    $dupCheck->execute([$currentUser['id'], $dutyDate, $dutyNumber, $busNumber]);
    if ($existing = $dupCheck->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => 'Duplicate submission detected. A duty with this number and bus was already recorded recently (' . $existing['record_id'] . ').'
        ], 409);
    }

    // Generate Unique Record ID
    $datePart = date('Ymd', strtotime($dutyDate));
    $randomPart = strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    $recordId = sprintf("UP-DUTY-%s-%s", $datePart, $randomPart);

    $sql = "INSERT INTO duty_records 
        (record_id, user_id, emp_id, emp_name, emp_type, depot_name, depot_code, duty_date, duty_number, 
         bus_number, bus_reg_number, route, route_number, start_point, end_point, start_time, end_time, 
         shift, total_km, income, passenger_count, load_factor, trips_count, ticket_collection, cash_collection, 
         remarks, status, submission_ip)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)";

    $stmt = $pdo->prepare($sql);
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    $stmt->execute([
        $recordId,
        $currentUser['id'],
        $currentUser['emp_id'],
        $currentUser['emp_name'],
        $currentUser['emp_type'],
        $currentUser['depot_name'],
        $currentUser['depot_code'] ?? null,
        $dutyDate,
        $dutyNumber,
        $busNumber,
        $busRegNumber,
        $route,
        $routeNumber,
        $startPoint,
        $endPoint,
        $startTime,
        $endTime,
        $shift,
        $totalKm,
        $income,
        $passengerCount,
        $loadFactor,
        $tripsCount,
        $ticketCollection,
        $cashCollection,
        $remarks,
        $ip
    ]);

    $insertedId = (int)$pdo->lastInsertId();

    // If draft exists for this date, delete or update it
    if (!empty($input['draft_id'])) {
        $delDraft = $pdo->prepare("DELETE FROM duty_drafts WHERE draft_id = ? AND user_id = ?");
        $delDraft->execute([$input['draft_id'], $currentUser['id']]);
    }

    recordAuditLog($pdo, $currentUser['id'], $currentUser['emp_id'], 'CREATE_DUTY', $recordId, [
        'duty_date' => $dutyDate,
        'bus_number' => $busNumber,
        'total_km' => $totalKm,
        'income' => $income
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Duty record submitted successfully.',
        'record_id' => $recordId,
        'id' => $insertedId,
        'duty_date' => $dutyDate
    ], 201);

} catch (PDOException $e) {
    error_log("Duty submission failed: " . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Failed to save duty record into database. Please try again.'], 500);
}
