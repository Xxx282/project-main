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
    bedrooms INT UNSIGNED NOT NULL COMMENT '卧室数量',
    bathrooms DECIMAL(3,1) UNSIGNED NOT NULL COMMENT '卫生间数量（支持0.5个）',
    area DECIMAL(10,2) UNSIGNED NOT NULL COMMENT '房屋面积（平方米）',
    price DECIMAL(10,2) NOT NULL COMMENT '租金价格（元/月）',
    total_floors INT DEFAULT NULL COMMENT '总楼层数',
    orientation VARCHAR(20) DEFAULT NULL COMMENT '朝向: east(东) / south(南) / west(西) / north(北)',
    decoration VARCHAR(50) DEFAULT NULL COMMENT '装修情况: rough(毛坯) / simple(简装) / fine(精装) / luxury(豪华)',
    description TEXT DEFAULT NULL COMMENT '房源描述',
    status ENUM('available', 'rented', 'offline') NOT NULL DEFAULT 'available' COMMENT '房源状态: available(可租) / rented(已租) / offline(下架)',
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
-- 6. 租客偏好设置表 (tenant_preferences)
-- 用途: 存储租客的租房偏好设置（预算、区域、户型）
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_preferences (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '租客用户ID，外键关联users.id',
    budget INT UNSIGNED DEFAULT NULL COMMENT '预算（元/月）',
    region VARCHAR(100) DEFAULT NULL COMMENT '偏好区域',
    bedrooms TINYINT UNSIGNED DEFAULT NULL COMMENT '偏好卧室数量',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_id (user_id),
    CONSTRAINT fk_tenant_preferences_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='租客偏好设置表';

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

-- 收藏表 (favorites)
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '收藏主键ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID，外键关联users.id',
    property_id BIGINT UNSIGNED NOT NULL COMMENT '房源ID，外键关联properties.id',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_property (user_id, property_id),
    KEY idx_user_id (user_id),
    KEY idx_property_id (property_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_favorites_property FOREIGN KEY (property_id)
        REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';