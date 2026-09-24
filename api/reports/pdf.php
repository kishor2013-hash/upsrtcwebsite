<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * PDF Duty Report Data & HTML Print View Generator
 */

require_once __DIR__ . '/../db.php';

$currentUser = requireAuth();

$startDate = trim($_GET['start_date'] ?? date('Y-m-01'));
$endDate = trim($_GET['end_date'] ?? date('Y-m-t'));
$monthName = date('F Y', strtotime($startDate));

try {
    $stmt = $pdo->prepare("SELECT 
        record_id,
        duty_date,
        duty_number,
        bus_number,
        route,
        shift,
        total_km,
        income,
        passenger_count,
        load_factor,
        trips_count,
        status,
        created_at
    FROM duty_records 
    WHERE user_id = ? AND duty_date BETWEEN ? AND ? AND deleted_at IS NULL
    ORDER BY duty_date ASC");

    $stmt->execute([$currentUser['id'], $startDate, $endDate]);
    $records = $stmt->fetchAll();

    $totalDuties = count($records);
    $totalKm = array_sum(array_column($records, 'total_km'));
    $totalIncome = array_sum(array_column($records, 'income'));
    $totalTrips = array_sum(array_column($records, 'trips_count'));
    $avgKm = $totalDuties > 0 ? round($totalKm / $totalDuties, 2) : 0;
    $avgIncome = $totalDuties > 0 ? round($totalIncome / $totalDuties, 2) : 0;
    $avgLoadFactor = $totalDuties > 0 ? round(array_sum(array_column($records, 'load_factor')) / $totalDuties, 2) : 0;

    $reportId = "UPSRCTC-REP-" . date('Ymd') . "-" . rand(1000, 9999);

    recordAuditLog($pdo, $currentUser['id'], $currentUser['emp_id'], 'GENERATE_REPORT', $reportId);

    jsonResponse([
        'success' => true,
        'report' => [
            'report_id' => $reportId,
            'generated_at' => date('d-m-Y H:i:s'),
            'date_range' => ['start_date' => $startDate, 'end_date' => $endDate, 'month' => $monthName],
            'employee' => [
                'name' => $currentUser['emp_name'],
                'emp_id' => $currentUser['emp_id'],
                'emp_type' => $currentUser['emp_type'],
                'depot' => $currentUser['depot_name']
            ],
            'summary' => [
                'total_duties' => $totalDuties,
                'total_km' => $totalKm,
                'total_income' => $totalIncome,
                'total_trips' => $totalTrips,
                'avg_km' => $avgKm,
                'avg_income' => $avgIncome,
                'avg_load_factor' => $avgLoadFactor
            ],
            'records' => $records
        ]
    ]);

} catch (PDOException $e) {
    jsonResponse(['success' => false, 'message' => 'Failed to generate report.'], 500);
}
