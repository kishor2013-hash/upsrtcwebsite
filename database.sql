-- ============================================================
-- UPSRCTC ROADWAYS - DIGITAL DUTY PORTAL V4.0
-- Database Schema for Hostinger MySQL (phpMyAdmin Importable)
-- Technology: PHP 8.x + PDO + MySQL
-- Partner: Grofasto Digital Solutions (www.grofasto.com)
-- NOTE: Contains ZERO demo employees or fake duty records.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+05:30";

-- --------------------------------------------------------
-- Table: `depots`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `depots` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `depot_code` VARCHAR(20) NOT NULL UNIQUE,
  `depot_name` VARCHAR(100) NOT NULL,
  `region` VARCHAR(100) DEFAULT 'Uttar Pradesh',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `emp_id` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `mobile` VARCHAR(20) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `emp_type` ENUM('DRIVER', 'CONDUCTOR', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'DRIVER',
  `depot_name` VARCHAR(100) NOT NULL,
  `depot_code` VARCHAR(50) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT 'Roadway Staff',
  `address` TEXT DEFAULT NULL,
  `joining_date` DATE DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `profile_photo` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('ACTIVE', 'SUSPENDED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
  `remember_token` VARCHAR(255) DEFAULT NULL,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `idx_emp_id` (`emp_id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_mobile` (`mobile`),
  INDEX `idx_depot` (`depot_name`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: `roles`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`role_name`, `description`) VALUES
('SUPER_ADMIN', 'Super Administrator with full system privileges'),
('ADMIN', 'Depot Administrator with staff management access'),
('DRIVER', 'Roadways Bus Driver'),
('CONDUCTOR', 'Roadways Bus Conductor'),
('VIEWER', 'Audit and Inspection Viewer')
ON DUPLICATE KEY UPDATE `role_name`=`role_name`;

-- --------------------------------------------------------
-- Table: `buses`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `buses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `bus_number` VARCHAR(50) NOT NULL UNIQUE,
  `registration_number` VARCHAR(50) NOT NULL,
  `depot_name` VARCHAR(100) NOT NULL,
  `bus_type` VARCHAR(50) DEFAULT 'Ordinary / Express',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: `routes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `routes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `route_number` VARCHAR(50) NOT NULL,
  `route_name` VARCHAR(150) NOT NULL,
  `start_point` VARCHAR(100) NOT NULL,
  `end_point` VARCHAR(100) NOT NULL,
  `distance_km` DECIMAL(8,2) DEFAULT 0.00,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_route_points` (`start_point`, `end_point`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: `duty_records`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `duty_records` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `record_id` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `emp_id` VARCHAR(50) NOT NULL,
  `emp_name` VARCHAR(150) NOT NULL,
  `emp_type` ENUM('DRIVER', 'CONDUCTOR') NOT NULL,
  `depot_name` VARCHAR(100) NOT NULL,
  `depot_code` VARCHAR(50) DEFAULT NULL,
  `duty_date` DATE NOT NULL,
  `duty_number` VARCHAR(50) NOT NULL,
  `bus_number` VARCHAR(50) NOT NULL,
  `bus_reg_number` VARCHAR(50) DEFAULT NULL,
  `route` VARCHAR(150) NOT NULL,
  `route_number` VARCHAR(50) DEFAULT NULL,
  `start_point` VARCHAR(100) NOT NULL,
  `end_point` VARCHAR(100) NOT NULL,
  `start_time` TIME DEFAULT NULL,
  `end_time` TIME DEFAULT NULL,
  `shift` VARCHAR(50) DEFAULT 'Morning',
  `total_km` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `income` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `passenger_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `load_factor` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `trips_count` INT UNSIGNED NOT NULL DEFAULT 1,
  `ticket_collection` DECIMAL(10,2) DEFAULT 0.00,
  `cash_collection` DECIMAL(10,2) DEFAULT 0.00,
  `remarks` TEXT DEFAULT NULL,
  `status` ENUM('SUBMITTED', 'DRAFT', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  `submission_ip` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `idx_duty_user` (`user_id`),
  INDEX `idx_duty_emp_id` (`emp_id`),
  INDEX `idx_duty_date` (`duty_date`),
  INDEX `idx_duty_bus` (`bus_number`),
  INDEX `idx_duty_route` (`route`),
  INDEX `idx_duty_status` (`status`),
  CONSTRAINT `fk_duty_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: `duty_drafts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `duty_drafts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `draft_id` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `emp_id` VARCHAR(50) NOT NULL,
  `duty_date` DATE NOT NULL,
  `draft_data` LONGTEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_draft_user` (`user_id`),
  INDEX `idx_draft_date` (`duty_date`),
  CONSTRAINT `fk_draft_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: `external_portal_links`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `external_portal_links` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `portal_key` VARCHAR(50) NOT NULL UNIQUE,
  `portal_name` VARCHAR(100) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `icon_name` VARCHAR(50) DEFAULT 'link',
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `external_portal_links` (`portal_key`, `portal_name`, `url`, `icon_name`, `description`) VALUES
('PAY_SLIP', 'Pay Slip Portal', 'https://payroll.mectoi.in/EmpLogin.aspx', 'file-text', 'UPSRCTC Employee Payroll & Monthly Slip Portal'),
('PF_PORTAL', 'PF Portal', 'https://passbook.epfindia.gov.in/MemberPassBook/login', 'shield', 'EPFO Unified Member Passbook & Provident Fund'),
('CHALLAN', 'Challan Portal', 'https://echallan.parivahan.gov.in/index/challan-print', 'alert-circle', 'eChallan Parivahan Portal for Traffic Challan Status & Print'),
('MANAV_SAMPADA', 'Manav Sampada', 'https://ehrms.upsdc.gov.in/', 'users', 'Uttar Pradesh Electronic Human Resource Management System')
ON DUPLICATE KEY UPDATE `portal_name`=`portal_name`;

-- --------------------------------------------------------
-- Table: `application_settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `application_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(50) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_settings` (`setting_key`, `setting_value`, `description`) VALUES
('app_title', 'UPSRCTC ROADWAYS', 'Main Application Header Title'),
('app_subtitle', 'DIGITAL DUTY PORTAL V4.0', 'Main Application Subtitle and Version'),
('partner_name', 'Grofasto Digital Solutions', 'Official Technology & Digital Solutions Partner'),
('partner_tagline', 'GROW | CONNECT | SUCCEED.', 'Partner Corporate Tagline'),
('partner_phone', '+91 9457690255', 'Partner Support Hotline'),
('partner_website', 'www.grofasto.com', 'Partner Official Website'),
('allow_registration', '1', 'Enable / Disable new employee sign ups')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;

-- --------------------------------------------------------
-- Table: `audit_logs`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `emp_id` VARCHAR(50) DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `record_id` VARCHAR(50) DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_log_user` (`user_id`),
  INDEX `idx_log_action` (`action`),
  INDEX `idx_log_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: `password_resets`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL,
  `emp_id` VARCHAR(50) NOT NULL,
  `token` VARCHAR(100) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reset_token` (`token`),
  INDEX `idx_reset_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- END OF SCHEMA (ZERO DEMO EMPLOYEES OR FAKE RECORDS INCLUDED)
