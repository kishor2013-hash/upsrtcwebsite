<?php
/**
 * UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
 * Employee Registration Endpoint
 */

require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$input = getJsonInput();

// Required Fields Validation
$required = ['full_name', 'email', 'mobile', 'emp_id', 'emp_type', 'depot_name', 'password', 'confirm_password'];
foreach ($required as $field) {
    if (empty(trim($input[$field] ?? ''))) {
        jsonResponse(['success' => false, 'message' => "Field '$field' is required."], 422);
    }
}

$fullName = trim($input['full_name']);
$email = strtolower(trim($input['email']));
$mobile = preg_replace('/[^0-9]/', '', trim($input['mobile']));
$empId = strtoupper(trim($input['emp_id']));
$empType = strtoupper(trim($input['emp_type']));
$depotName = trim($input['depot_name']);
$depotCode = trim($input['depot_code'] ?? '');
$designation = trim($input['designation'] ?? ($empType === 'DRIVER' ? 'Roadways Driver' : 'Roadways Conductor'));
$address = trim($input['address'] ?? '');
$dob = !empty($input['dob']) ? trim($input['dob']) : null;
$joiningDate = !empty($input['joining_date']) ? trim($input['joining_date']) : null;
$password = $input['password'];
$confirmPassword = $input['confirm_password'];

// Validations
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['success' => false, 'message' => 'Please provide a valid email address.'], 422);
}

if (strlen($mobile) !== 10) {
    jsonResponse(['success' => false, 'message' => 'Mobile number must be exactly 10 digits.'], 422);
}

if (!in_array($empType, ['DRIVER', 'CONDUCTOR', 'ADMIN', 'SUPER_ADMIN'], true)) {
    jsonResponse(['success' => false, 'message' => 'Invalid employee type selected.'], 422);
}

if (strlen($password) < 6) {
    jsonResponse(['success' => false, 'message' => 'Password must be at least 6 characters long.'], 422);
}

if ($password !== $confirmPassword) {
    jsonResponse(['success' => false, 'message' => 'Passwords do not match.'], 422);
}

try {
    // Check duplicates
    $checkStmt = $pdo->prepare("SELECT email, mobile, emp_id FROM users WHERE email = ? OR mobile = ? OR emp_id = ? LIMIT 1");
    $checkStmt->execute([$email, $mobile, $empId]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        if ($existing['email'] === $email) {
            jsonResponse(['success' => false, 'message' => 'This email is already registered. Please login.'], 409);
        }
        if ($existing['mobile'] === $mobile) {
            jsonResponse(['success' => false, 'message' => 'This mobile number is already registered.'], 409);
        }
        if ($existing['emp_id'] === $empId) {
            jsonResponse(['success' => false, 'message' => 'This Employee ID / CND is already registered.'], 409);
        }
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

    $insertStmt = $pdo->prepare("INSERT INTO users 
        (emp_id, full_name, email, mobile, password_hash, emp_type, depot_name, depot_code, designation, address, dob, joining_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')");

    $insertStmt->execute([
        $empId,
        $fullName,
        $email,
        $mobile,
        $passwordHash,
        $empType,
        $depotName,
        $depotCode,
        $designation,
        $address,
        $dob,
        $joiningDate
    ]);

    $newUserId = (int)$pdo->lastInsertId();

    recordAuditLog($pdo, $newUserId, $empId, 'SIGNUP', (string)$newUserId, [
        'full_name' => $fullName,
        'emp_type' => $empType,
        'depot' => $depotName
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Account created successfully. Please login to continue.'
    ], 201);

} catch (PDOException $e) {
    error_log("Registration failed: " . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Database error during registration. Please try again.'], 500);
}
