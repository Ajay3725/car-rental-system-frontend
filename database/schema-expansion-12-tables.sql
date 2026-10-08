-- ============================================================================
-- AK CARS / CAR RENTAL DATABASE SCHEMA EXPANSION (12 ADDITIONAL TABLES)
-- Database: car_rental
-- ============================================================================

USE car_rental;

-- ----------------------------------------------------------------------------
-- 1. CUSTOMER PROFILES (Detailed verification & contact info)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    driving_license_no VARCHAR(50) NOT NULL UNIQUE,
    license_expiry_date DATE NOT NULL,
    address TEXT,
    city VARCHAR(60) NOT NULL DEFAULT 'Chennai',
    state VARCHAR(60) NOT NULL DEFAULT 'Tamil Nadu',
    pincode VARCHAR(10),
    is_verified BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. CAR CATEGORIES (Sedan, SUV, Luxury, EV, Hatchback, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. CAR FEATURES (Vehicle equipment & amenities)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature_name VARCHAR(80) NOT NULL UNIQUE,
    icon VARCHAR(50) DEFAULT '🚗',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. CAR FEATURE MAPPINGS (Junction table linking cars to features)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_feature_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    car_id INT NOT NULL,
    feature_id INT NOT NULL,
    UNIQUE KEY unique_car_feature (car_id, feature_id),
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES car_features(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. RENTAL LOCATIONS (Branches, Hubs, Airport pick-up points)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    city VARCHAR(60) NOT NULL,
    full_address TEXT NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    operating_hours VARCHAR(80) DEFAULT '24/7 Open',
    is_airport_hub BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. CHAUFFEURS / DRIVERS (Optional driver service for customers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    experience_years INT NOT NULL DEFAULT 3,
    rating DECIMAL(2, 1) DEFAULT 4.8,
    daily_rate DECIMAL(8, 2) NOT NULL DEFAULT 800.00,
    status ENUM('available', 'on_trip', 'leave') DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. INSURANCE PLANS (Rental protection options)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(80) NOT NULL,
    coverage_type ENUM('Basic', 'Comprehensive', 'Zero-Depreciation') NOT NULL,
    daily_price DECIMAL(8, 2) NOT NULL,
    deductible_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. DISCOUNT COUPONS (Promotional codes & seasonal offers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discount_coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_code VARCHAR(30) NOT NULL UNIQUE,
    discount_percentage INT NOT NULL,
    max_discount_amount DECIMAL(8, 2) NOT NULL DEFAULT 2000.00,
    min_order_amount DECIMAL(8, 2) NOT NULL DEFAULT 1500.00,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. PAYMENTS (Detailed transaction ledger & gateway audit)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('UPI', 'Cash', 'Card', 'RuPay', 'Visa', 'Mastercard') NOT NULL,
    transaction_ref VARCHAR(100) UNIQUE,
    payment_status ENUM('completed', 'pending', 'failed', 'refunded') DEFAULT 'completed',
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. REVIEWS & RATINGS (Customer feedback on cars)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    car_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title VARCHAR(120),
    review_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. CAR MAINTENANCE (Fleet servicing & health logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS car_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    car_id INT NOT NULL,
    service_type ENUM('Periodic Service', 'Oil Change', 'Brake Inspection', 'Tire Replacement', 'Body Repair', 'General Checkup') NOT NULL,
    service_date DATE NOT NULL,
    odometer_reading INT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    service_center VARCHAR(120) NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed') DEFAULT 'completed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. VEHICLE DAMAGE & RETURN INSPECTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS damage_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    car_id INT NOT NULL,
    inspected_by VARCHAR(80) NOT NULL,
    damage_description TEXT,
    repair_cost DECIMAL(10, 2) DEFAULT 0.00,
    settlement_status ENUM('no_damage', 'pending_claim', 'resolved', 'deducted_from_deposit') DEFAULT 'no_damage',
    inspected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- SAMPLE DATA INSERTIONS FOR ALL 12 TABLES
-- ============================================================================

-- 1. Insert Categories
INSERT IGNORE INTO car_categories (id, category_name, description, security_deposit) VALUES
(1, 'Luxury Sedan', 'Premium sedans offering maximum comfort and executive prestige', 10000.00),
(2, 'Compact SUV', 'High ground clearance, versatile for city and road trips', 5000.00),
(3, 'Economy Hatchback', 'Fuel efficient, compact and easy city commuting', 3000.00),
(4, 'Electric Vehicle (EV)', 'Eco-friendly, instant torque and silent driving', 7000.00);

-- 2. Insert Features
INSERT IGNORE INTO car_features (id, feature_name, icon) VALUES
(1, 'Panoramic Sunroof', '☀️'),
(2, 'Automatic Transmission', '⚙️'),
(3, 'GPS Navigation System', '🗺️'),
(4, '360-Degree Camera', '📷'),
(5, 'Bluetooth & Apple CarPlay', '📱'),
(6, 'Ventilated Leather Seats', '💺'),
(7, 'Cruise Control', '🚀'),
(8, 'Keyless Push Start', '🔑');

-- 3. Insert Feature Mappings (Linking sample features to car ID 1, 2, 3...)
INSERT IGNORE INTO car_feature_mappings (car_id, feature_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 5), (1, 8),
(2, 2), (2, 3), (2, 5), (2, 7),
(3, 2), (3, 5), (3, 8);

-- 4. Insert Rental Locations
INSERT IGNORE INTO rental_locations (id, branch_name, city, full_address, contact_phone, is_airport_hub) VALUES
(1, 'AL Cars Chennai Central Hub', 'Chennai', 'No. 45, Anna Salai, Mount Road, Chennai - 600002', '+91 98765 43210', FALSE),
(2, 'AL Cars Chennai International Airport', 'Chennai', 'Arrival Terminal T2, Airport Road, Meenambakkam, Chennai - 600027', '+91 98765 43211', TRUE),
(3, 'AL Cars OMR IT Expressway', 'Chennai', 'Plot 12, Rajiv Gandhi Salai, Thoraipakkam, Chennai - 600097', '+91 98765 43212', FALSE);

-- 5. Insert Drivers
INSERT IGNORE INTO drivers (id, driver_name, phone_number, license_number, experience_years, rating, daily_rate, status) VALUES
(1, 'Ramesh Kumar', '+91 94441 23456', 'TN0120150001234', 8, 4.9, 850.00, 'available'),
(2, 'Senthil Nathan', '+91 94442 34567', 'TN0220170005678', 5, 4.8, 800.00, 'available'),
(3, 'Vigneshwaran M', '+91 94443 45678', 'TN0920190009012', 4, 4.7, 750.00, 'available');

-- 6. Insert Insurance Plans
INSERT IGNORE INTO insurance_plans (id, plan_name, coverage_type, daily_price, deductible_amount, description) VALUES
(1, 'Basic Protection', 'Basic', 299.00, 5000.00, 'Covers major mechanical breakdown & third-party liability'),
(2, 'Comprehensive Peace of Mind', 'Comprehensive', 599.00, 2000.00, 'Covers collision damage, roadside towing & scratches'),
(3, 'Zero-Depreciation Super Shield', 'Zero-Depreciation', 999.00, 0.00, '100% full coverage with zero customer liability for damages');

-- 7. Insert Discount Coupons
INSERT IGNORE INTO discount_coupons (id, coupon_code, discount_percentage, max_discount_amount, min_order_amount, valid_from, valid_until, is_active) VALUES
(1, 'ALFIRST', 20, 1500.00, 2000.00, '2026-01-01', '2026-12-31', TRUE),
(2, 'FESTIVE500', 10, 500.00, 1500.00, '2026-01-01', '2026-12-31', TRUE),
(3, 'LUXURYDRIVE', 25, 3000.00, 5000.00, '2026-01-01', '2026-12-31', TRUE);

-- 8. Insert Sample Customer Profile (for first user)
INSERT IGNORE INTO customer_profiles (user_id, full_name, email, phone_number, driving_license_no, license_expiry_date, address, city, state, pincode) VALUES
(1, 'Akash Kumar', 'akash.alcars@example.com', '+91 98400 12345', 'TN-01-2018-0044556', '2035-10-15', 'No. 22, Gandhi Road, T. Nagar', 'Chennai', 'Tamil Nadu', '600017');

-- 9. Insert Sample Maintenance Record
INSERT IGNORE INTO car_maintenance (car_id, service_type, service_date, odometer_reading, cost, service_center, status, notes) VALUES
(1, 'Periodic Service', '2026-09-15', 24500, 4800.00, 'Toyota Authorized Service Center, Chennai', 'completed', 'Oil replacement, air filter change and brake pad check complete.');

-- 10. Insert Sample Payments Record
INSERT IGNORE INTO payments (booking_id, user_id, amount, payment_method, transaction_ref, payment_status, paid_at) 
SELECT id, user_id, COALESCE(total_amount, 3500.00), 'UPI', CONCAT('TXN-UPI-', UNIX_TIMESTAMP()), 'completed', CURRENT_TIMESTAMP 
FROM bookings 
LIMIT 1;

-- 11. Insert Sample Reviews & Ratings
INSERT IGNORE INTO reviews_ratings (booking_id, user_id, car_id, rating, review_title, review_comment)
SELECT b.id, COALESCE(b.user_id, 1), 1, 5, 'Exceptional experience with AL Cars!', 'Car was super clean, smooth pickup process and great fuel economy. 10/10 recommended.'
FROM bookings b 
LIMIT 1;

-- 12. Insert Sample Damage Inspection
INSERT IGNORE INTO damage_reports (booking_id, car_id, inspected_by, damage_description, repair_cost, settlement_status)
SELECT b.id, 1, 'Supervisor Murugan S', 'Vehicle returned in pristine condition with full fuel tank. No scratches or dents.', 0.00, 'no_damage'
FROM bookings b
LIMIT 1;

-- ============================================================================
-- VERIFICATION SELECT STATEMENTS (RUN THESE TO VIEW ALL TABLES)
-- ============================================================================
-- SELECT * FROM customer_profiles;
-- SELECT * FROM car_categories;
-- SELECT * FROM car_features;
-- SELECT * FROM car_feature_mappings;
-- SELECT * FROM rental_locations;
-- SELECT * FROM drivers;
-- SELECT * FROM insurance_plans;
-- SELECT * FROM discount_coupons;
-- SELECT * FROM payments;
-- SELECT * FROM reviews_ratings;
-- SELECT * FROM car_maintenance;
-- SELECT * FROM damage_reports;

