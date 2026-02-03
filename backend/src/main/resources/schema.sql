-- 智能房屋租赁系统 - 数据库初始化脚本
-- Database: MySQL 8.x
-- 执行前请确保已创建数据库: CREATE DATABASE house_rental_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE house_rental_system;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户主键ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名，唯一标识',
    password VARCHAR(255) NOT NULL COMMENT '加密后的密码字符串',
    role ENUM('tenant', 'landlord', 'admin') NOT NULL DEFAULT 'tenant' COMMENT '用户角色: tenant(租客) / landlord(房东) / admin(管理员)',
    email VARCHAR(100) NOT NULL COMMENT '用户邮箱',
    phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    real_name VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '账户创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '账户更新时间',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '账户状态: 1-激活, 0-禁用',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email),
    KEY idx_role (role),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 房源表 (properties)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '房源主键ID',
    landlord_id BIGINT UNSIGNED NOT NULL COMMENT '房东ID，外键关联users.id',
    title VARCHAR(200) NOT NULL COMMENT '房源标题',
    city VARCHAR(50) NOT NULL COMMENT '所在城市',
    region VARCHAR(100) NOT NULL COMMENT '所在区域/行政区',
    address VARCHAR(255) NOT NULL COMMENT '详细地址',
    bedrooms INT UNSIGNED NOT NULL COMMENT '卧室数量',
    bathrooms DECIMAL(3,1) UNSIGNED NOT NULL COMMENT '卫生间数量（支持0.5个）',
    area DECIMAL(10,2) UNSIGNED NOT NULL COMMENT '房屋面积（平方米）',
    price DECIMAL(10,2) NOT NULL COMMENT '租金价格（元/月）',
    deposit DECIMAL(10,2) DEFAULT NULL COMMENT '押金（元）',
    property_type VARCHAR(50) DEFAULT NULL COMMENT '房屋类型: apartment(公寓) / house(别墅) / studio(单间)',
    floor INT DEFAULT NULL COMMENT '所在楼层',
    total_floors INT DEFAULT NULL COMMENT '总楼层数',
    orientation VARCHAR(20) DEFAULT NULL COMMENT '朝向: east(东) / south(南) / west(西) / north(北)',
    decoration VARCHAR(50) DEFAULT NULL COMMENT '装修情况: rough(毛坯) / simple(简装) / fine(精装) / luxury(豪华)',
    facilities JSON DEFAULT NULL COMMENT '配套设施（JSON格式）: 如 {"parking": true, "elevator": true}',
    description TEXT DEFAULT NULL COMMENT '房源描述',
    status ENUM('available', 'rented', 'offline') NOT NULL DEFAULT 'available' COMMENT '房源状态: available(可租) / rented(已租) / offline(下架)',
    longitude DECIMAL(10,7) DEFAULT NULL COMMENT '经度（用于地图定位）',
    latitude DECIMAL(10,7) DEFAULT NULL COMMENT '纬度（用于地图定位）',
    view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览次数',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '房源发布时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '房源更新时间',
    PRIMARY KEY (id),
    KEY idx_landlord_id (landlord_id),
    KEY idx_city_region (city, region),
    KEY idx_price (price),
    KEY idx_status (status),
    KEY idx_bedrooms_area (bedrooms, area),
    KEY idx_created_at (created_at),
    KEY idx_location (longitude, latitude),
    CONSTRAINT fk_properties_landlord FOREIGN KEY (landlord_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='房源信息表';

-- ============================================
-- 3. 咨询表 (inquiries)
-- ============================================
CREATE TABLE IF NOT EXISTS inquiries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '咨询主键ID',
    listing_id BIGINT UNSIGNED NOT NULL COMMENT '房源ID',
    tenant_id BIGINT UNSIGNED NOT NULL COMMENT '租客ID',
    landlord_id BIGINT UNSIGNED NOT NULL COMMENT '房东ID',
    message TEXT NOT NULL COMMENT '咨询内容',
    reply TEXT DEFAULT NULL COMMENT '回复内容',
    status ENUM('pending', 'replied', 'closed') NOT NULL DEFAULT 'pending' COMMENT '咨询状态: pending(待回复) / replied(已回复) / closed(已关闭)',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '咨询时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_listing_id (listing_id),
    KEY idx_tenant_id (tenant_id),
    KEY idx_landlord_id (landlord_id),
    KEY idx_status (status),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='咨询表';

-- ============================================
-- 4. 租金预测结果表 (rent_predictions)
-- 用途: 存储机器学习模型生成的租金预测结果
-- ============================================
CREATE TABLE IF NOT EXISTS rent_predictions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '预测记录主键ID',
    property_id BIGINT UNSIGNED NOT NULL COMMENT '房源ID，外键关联properties.id',
    predicted_price DECIMAL(10,2) NOT NULL COMMENT '机器学习模型预测的租金价格（元/月）',
    actual_price DECIMAL(10,2) DEFAULT NULL COMMENT '实际租金价格（成交后填入，用于模型评估）',
    model_version VARCHAR(50) NOT NULL COMMENT '模型版本号，如: v1.0 / v2.1_20240901',
    algorithm_name VARCHAR(100) DEFAULT NULL COMMENT '使用的算法名称，如: RandomForest / XGBoost / NeuralNetwork',
    features_snapshot JSON NOT NULL COMMENT '特征快照（JSON格式），存储预测时使用的特征数据',
    prediction_confidence DECIMAL(5,4) DEFAULT NULL COMMENT '预测置信度（0-1之间）',
    prediction_error DECIMAL(10,2) DEFAULT NULL COMMENT '预测误差（|predicted_price - actual_price|）',
    model_metadata JSON DEFAULT NULL COMMENT '模型元数据（JSON格式），如: 训练时间、特征重要性等',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '预测生成时间',
    PRIMARY KEY (id),
    KEY idx_property_id (property_id),
    KEY idx_model_version (model_version),
    KEY idx_created_at (created_at),
    KEY idx_prediction_accuracy (prediction_error),
    CONSTRAINT fk_rent_predictions_property FOREIGN KEY (property_id)
        REFERENCES properties(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租金预测结果表';

-- ============================================
-- 5. 租赁成交表 (lease_transactions)
-- 用途: 存储最终成交的租赁记录
-- ============================================
CREATE TABLE IF NOT EXISTS lease_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成交记录主键ID',
    property_id BIGINT UNSIGNED NOT NULL COMMENT '房源ID，外键关联properties.id',
    tenant_id BIGINT UNSIGNED NOT NULL COMMENT '租客ID，外键关联users.id',
    landlord_id BIGINT UNSIGNED NOT NULL COMMENT '房东ID，外键关联users.id（冗余字段，便于查询）',
    final_price DECIMAL(10,2) NOT NULL COMMENT '最终成交租金（元/月）',
    deposit_amount DECIMAL(10,2) DEFAULT NULL COMMENT '实际押金金额（元）',
    start_date DATE NOT NULL COMMENT '租赁开始日期',
    end_date DATE NOT NULL COMMENT '租赁结束日期',
    lease_months INT UNSIGNED NOT NULL COMMENT '租赁月数',
    transaction_status ENUM('pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '交易状态: pending(待确认) / active(进行中) / completed(已完成) / cancelled(已取消)',
    contract_number VARCHAR(100) DEFAULT NULL COMMENT '合同编号',
    signed_at TIMESTAMP DEFAULT NULL COMMENT '合同签署时间',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '成交记录创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '记录更新时间',
    PRIMARY KEY (id),
    KEY idx_property_id (property_id),
    KEY idx_tenant_id (tenant_id),
    KEY idx_landlord_id (landlord_id),
    KEY idx_start_date (start_date),
    KEY idx_end_date (end_date),
    KEY idx_transaction_status (transaction_status),
    KEY idx_created_at (created_at),
    CONSTRAINT fk_lease_transactions_property FOREIGN KEY (property_id)
        REFERENCES properties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_lease_transactions_tenant FOREIGN KEY (tenant_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_lease_transactions_landlord FOREIGN KEY (landlord_id)
        REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_lease_dates CHECK (end_date > start_date),
    CONSTRAINT chk_lease_price CHECK (final_price > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租赁成交记录表';

-- ============================================
-- 7. 索引优化
-- ============================================

-- 为用户表添加复合索引
ALTER TABLE users ADD INDEX idx_role_active (role, is_active);

-- 为房源表添加复合索引（常用查询场景）
ALTER TABLE properties ADD INDEX idx_city_status_price (city, status, price);
ALTER TABLE properties ADD INDEX idx_landlord_status (landlord_id, status);

-- 为咨询表添加复合索引
ALTER TABLE inquiries ADD INDEX idx_tenant_created (tenant_id, created_at);
ALTER TABLE inquiries ADD INDEX idx_landlord_status_created (landlord_id, status, created_at);

-- 为租赁成交表添加复合索引（统计分析场景）
ALTER TABLE lease_transactions ADD INDEX idx_status_dates (transaction_status, start_date, end_date);
ALTER TABLE lease_transactions ADD INDEX idx_property_tenant (property_id, tenant_id);

-- 为租金预测表添加复合索引（模型评估场景）
ALTER TABLE rent_predictions ADD INDEX idx_property_version (property_id, model_version);
ALTER TABLE rent_predictions ADD INDEX idx_model_created (model_version, created_at);

-- ============================================
-- 7. 示例数据
-- ============================================

-- 插入测试用户 (密码: password - BCrypt加密)
INSERT INTO users (username, password, role, email, phone, real_name, is_active) VALUES
('landlord001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'landlord', 'landlord001@example.com', '13800138001', 'Zhang', 1),
('landlord002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'landlord', 'landlord002@example.com', '13800138002', 'Li', 1),
('tenant001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tenant', 'tenant001@example.com', '13900139001', 'Wang', 1),
('tenant002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tenant', 'tenant002@example.com', '13900139002', 'Zhao', 1),
('admin001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'admin001@example.com', '13700137001', 'Admin', 1);

-- 插入示例房源
INSERT INTO properties (
    landlord_id, title, city, region, address, bedrooms, bathrooms, area,
    price, deposit, property_type, floor, total_floors, orientation,
    decoration, facilities, description, status, longitude, latitude, view_count
) VALUES
(1, 'Renovated 2BR Apartment Near Subway', 'Beijing', 'Chaoyang', '123 Chaoyang Rd Sunshine Community Bldg 3 Unit 501',
 2, 1.5, 85.50, 5500.00, 11000.00, 'apartment', 5, 12, 'south',
 'fine', '{"parking": true, "elevator": true, "balcony": true, "air_conditioning": true}',
 'Renovated, south-facing, good lighting, convenient transport, near subway station', 'available', 116.407526, 39.904200, 156),

(1, 'Cozy 1BR Perfect for Singles/Couples', 'Beijing', 'Haidian', '456 Zhongguan Cun St Tech Park Bldg 1 Unit 301',
 1, 1.0, 45.00, 3800.00, 7600.00, 'apartment', 3, 10, 'east',
 'simple', '{"parking": false, "elevator": true, "balcony": true, "air_conditioning": true}',
 'Simple renovation, affordable price, suitable for young graduates', 'available', 116.316833, 39.959066, 89),

(2, 'Luxury 3BR Near City Center', 'Shanghai', 'Huangpu', '789 Nanjing E Rd Jinmao Tower A Suite 2001',
 3, 2.0, 120.00, 12000.00, 24000.00, 'apartment', 20, 30, 'south',
 'luxury', '{"parking": true, "elevator": true, "balcony": true, "air_conditioning": true, "gym": true, "swimming_pool": true}',
 'Luxury renovation, river view, complete facilities, professional property management', 'available', 121.473701, 31.230416, 234),

(2, 'Comfortable 2BR School District', 'Shanghai', 'Xuhui', '321 Huaihai Middle Rd Academic Community Bldg 5 Unit 102',
 2, 1.5, 78.00, 6800.00, 13600.00, 'apartment', 1, 6, 'south',
 'fine', '{"parking": true, "elevator": false, "balcony": true, "air_conditioning": true}',
 'Renovated, school district, rich educational resources, suitable for families', 'rented', 121.445299, 31.201771, 312);

-- 插入咨询数据
INSERT INTO inquiries (listing_id, tenant_id, landlord_id, message, reply, status) VALUES
(1, 3, 1, 'How far is this listing from the subway station? How long to walk?', NULL, 'pending'),
(1, 4, 1, 'Can I rent for short term (3 months)?', 'Yes, but the price will be slightly higher.', 'replied'),
(2, 3, 1, 'Does the rent include property management and heating fees?', 'No, property management fee is 200 RMB per month additional.', 'replied'),
(3, 3, 2, 'When can I schedule a viewing?', 'Available on weekends, please make appointment in advance for weekdays.', 'replied');

-- 插入租金预测数据
INSERT INTO rent_predictions (
    property_id, predicted_price, actual_price, model_version, algorithm_name,
    features_snapshot, prediction_confidence, prediction_error, model_metadata
) VALUES
(1, 5400.00, 5500.00, 'v2.1_20240901', 'RandomForest',
 '{"bedrooms": 2, "bathrooms": 1.5, "area": 85.5, "city": "Beijing", "region": "Chaoyang", "decoration": "fine", "floor": 5, "total_floors": 12, "orientation": "south"}',
 0.92, 100.00,
 '{"training_date": "2024-09-01", "feature_importance": {"area": 0.25, "city": 0.20, "bedrooms": 0.18, "decoration": 0.15, "region": 0.12}, "rmse": 350.50}'),

(2, 3700.00, 3800.00, 'v2.1_20240901', 'RandomForest',
 '{"bedrooms": 1, "bathrooms": 1.0, "area": 45.0, "city": "Beijing", "region": "Haidian", "decoration": "simple", "floor": 3, "total_floors": 10, "orientation": "east"}',
 0.88, 100.00,
 '{"training_date": "2024-09-01", "feature_importance": {"area": 0.28, "city": 0.22, "bedrooms": 0.16, "decoration": 0.14, "region": 0.11}, "rmse": 320.00}'),

(3, 11800.00, NULL, 'v2.1_20240901', 'XGBoost',
 '{"bedrooms": 3, "bathrooms": 2.0, "area": 120.0, "city": "Shanghai", "region": "Huangpu", "decoration": "luxury", "floor": 20, "total_floors": 30, "orientation": "south"}',
 0.95, NULL,
 '{"training_date": "2024-09-01", "feature_importance": {"area": 0.30, "city": 0.25, "decoration": 0.20, "bedrooms": 0.15, "region": 0.10}, "rmse": 450.00}'),

(4, 6600.00, 6800.00, 'v2.1_20240901', 'RandomForest',
 '{"bedrooms": 2, "bathrooms": 1.5, "area": 78.0, "city": "Shanghai", "region": "Xuhui", "decoration": "fine", "floor": 1, "total_floors": 6, "orientation": "south"}',
 0.90, 200.00,
 '{"training_date": "2024-09-01", "feature_importance": {"area": 0.26, "city": 0.24, "bedrooms": 0.17, "decoration": 0.16, "region": 0.11}, "rmse": 380.00}');

-- 插入租赁成交数据
INSERT INTO lease_transactions (
    property_id, tenant_id, landlord_id, final_price, deposit_amount,
    start_date, end_date, lease_months, transaction_status, contract_number, signed_at
) VALUES
(4, 3, 2, 6800.00, 13600.00,
 '2024-01-15', '2025-01-14', 12, 'active', 'LEASE-2024-001', '2024-01-10 14:30:00'),

(1, 4, 1, 5500.00, 11000.00,
 '2024-02-01', '2025-01-31', 12, 'pending', NULL, NULL);

-- ============================================
-- 数据统计
-- ============================================
-- - 用户信息：5条（2位房东，2位租客，1位管理员）
-- - 房源信息：4条
-- - 咨询记录：4条
-- - 租金预测：4条
-- - 租赁成交：2条
