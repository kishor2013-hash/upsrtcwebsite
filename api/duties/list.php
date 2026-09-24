<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Show Data: Paginated Duty Records & Real Database Calculations
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$currentUser = requireAuth();
$isAdmin = in_array($currentUser['emp_type'], ['ADMIN', 'SUPER_ADMIN'], true);

// Query parameters
$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(100, max(5, intval($_GET['limit'] ?? 15)));
$offset = ($page - 1) * $limit;

$month = !empty($_GET['month']) ? intval($_GET['month']) : null;
$year = !empty($_GET['year']) ? intval($_GET['year']) : null;
$startDate = !empty($_GET['start_date']) ? trim($_GET['start_date']) : null;
$endDate = !empty($_GET['end_date']) ? trim($_GET['end_date']) : null;
$bus = !empty($_GET['bus']) ? trim($_GET['bus']) : null;
$route = !empty($_GET['route']) ? trim($_GET['route']) : null;
$status = !empty($_GET['status']) ? trim($_GET['status']) : null;
$search = !empty($_GET['search']) ? trim($_GET['search']) : null;

// Target employee filter (Admins can view specific employee; Drivers/Conductors strictly view only their own)
$whereClauses = ["deleted_at IS NULL"];
$params = [];

if (!$isAdmin) {
    $whereClauses[] = "user_id = ?";
    $params[] = $currentUser['id'];
} else if (!empty($_GET['user_id'])) {
    $whereClauses[] = "user_id = ?";
    $params[] = intval($_GET['user_id']);
}

// Date filtering
if (!empty($startDate) && !empty($endDate)) {
    $whereClauses[] = "duty_date BETWEEN ? AND ?";
    $params[] = $startDate;
    $params[] = $endDate;
} else if (!empty($month) && !empty($year)) {
    $whereClauses[] = "MONTH(duty_date) = ? AND YEAR(duty_date) = ?";
    $params[] = $month;
    $params[] = $year;
} else if (!empty($year)) {
    $whereClauses[] = "YEAR(duty_date) = ?";
    $params[] = $year;
}

if (!empty($bus)) {
    $whereClauses[] = "bus_number LIKE ?";
    $params[] = "%$bus%";
}

if (!empty($route)) {
    $whereClauses[] = "route LIKE ?";
    $params[] = "%$route%";
}

if (!empty($status)) {
    $whereClauses[] = "status = ?";
    $params[] = $status;
}

if (!empty($search)) {
    $term = "%$search%";
    $whereClauses[] = "(record_id LIKE ? OR bus_number LIKE ? OR route LIKE ? OR emp_name LIKE ? OR emp_id LIKE ?)";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

$whereSql = implode(" AND ", $whereClauses);

try {
    // 1. Calculate Aggregates (Real MySQL calculations - strictly no hard-coded or fake statistics)
    $statsSql = "SELECT 
        COUNT(*) AS total_duties,
        COALESCE(SUM(total_km), 0) AS total_km,
        COALESCE(SUM(income), 0) AS total_income,
        COALESCE(SUM(trips_count), 0) AS total_trips,
        COALESCE(AVG(total_km), 0) AS avg_km,
        COALESCE(AVG(income), 0) AS avg_income,
        COALESCE(AVG(load_factor), 0) AS avg_load_factor
    FROM duty_records 
    WHERE $whereSql";

    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute($params);
    $stats = $statsStmt->fetch();

    $totalDuties = intval($stats['total_duties'] ?? 0);
    $totalKm = round(floatval($stats['total_km'] ?? 0), 2);
    $totalIncome = round(floatval($stats['total_income'] ?? 0), 2);
    $totalTrips = intval($stats['total_trips'] ?? 0);
    $avgKm = round(floatval($stats['avg_km'] ?? 0), 2);
    $avgIncome = round(floatval($stats['avg_income'] ?? 0), 2);
    $avgLoadFactor = round(floatval($stats['avg_load_factor'] ?? 0), 2);

    // 2. Fetch Paginated Records
    $recordsSql = "SELECT 
        id,
        record_id,
        user_id,
        emp_id,
        emp_name,
        emp_type,
        depot_name,
        duty_date,
        duty_number,
        bus_number,
        bus_reg_number,
        route,
        route_number,
        start_point,
        end_point,
        start_time,
        end_time,
        shift,
        total_km,
        income,
        passenger_count,
        load_factor,
        trips_count,
        ticket_collection,
        cash_collection,
        remarks,
        status,
        created_at
    FROM duty_records
    WHERE $whereSql
    ORDER BY duty_date DESC, id DESC
    LIMIT ? OFFSET ?";

    $paginatedParams = $params;
    $paginatedParams[] = $limit;
    $paginatedParams[] = $offset;

    $recordsStmt = $pdo->prepare($recordsSql);
    $recordsStmt->execute($paginatedParams);
    $records = $recordsStmt->fetchAll();

    jsonResponse([
        'success' => true,
        'records' => $records,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_records' => $totalDuties,
            'total_pages' => ceil($totalDuties / $limit)
        ],
        'summary' => [
            'total_duties' => $totalDuties,
            'total_km' => $totalKm,
            'total_income' => $totalIncome,
            'total_trips' => $totalTrips,
            'avg_km' => $avgKm,
            'avg_income' => $avgIncome,
            'avg_load_factor' => $avgLoadFactor
        ]
    ]);

} catch (PDOException $e) {
    error_log("Show data query error: " . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Failed to fetch duty records.'], 500);
}
