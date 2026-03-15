-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 区域表：存储区域的中英文名称和经纬度坐标
DROP TABLE IF EXISTS `regions`;
CREATE TABLE `regions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT '区域名称（中文）',
    `name_en` VARCHAR(100) DEFAULT NULL COMMENT '区域英文名',
    `city` VARCHAR(50) NOT NULL COMMENT '所属城市（中文）',
    `city_en` VARCHAR(50) DEFAULT NULL COMMENT '所属城市英文名',
    `longitude` DECIMAL(10,7) NOT NULL COMMENT '经度',
    `latitude` DECIMAL(10,7) NOT NULL COMMENT '纬度',
    PRIMARY KEY (`id`),
    INDEX `idx_city` (`city`),
    INDEX `idx_city_en` (`city_en`),
    INDEX `idx_city_name` (`city`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='区域表';

-- 插入北京区域数据
INSERT INTO `regions` (`name`, `name_en`, `city`, `city_en`, `longitude`, `latitude`) VALUES
('朝阳', 'Chaoyang', '北京', 'Beijing', 116.4436, 39.9219),
('海淀', 'Haidian', '北京', 'Beijing', 116.3107, 39.9561),
('东城', 'Dongcheng', '北京', 'Beijing', 116.4164, 39.9286),
('西城', 'Xicheng', '北京', 'Beijing', 116.3733, 39.9165),
('丰台', 'Fengtai', '北京', 'Beijing', 116.2869, 39.8586),
('石景山', 'Shijingshan', '北京', 'Beijing', 116.2229, 39.9061),
('通州', 'Tongzhou', '北京', 'Beijing', 116.6564, 39.9098),
('顺义', 'Shunyi', '北京', 'Beijing', 116.6545, 40.1299),
('大兴', 'Daxing', '北京', 'Beijing', 116.3490, 39.7269),
('房山', 'Fangshan', '北京', 'Beijing', 116.1434, 39.7474),
('昌平', 'Changping', '北京', 'Beijing', 116.2312, 40.2187),
('门头沟', 'Mentougou', '北京', 'Beijing', 116.1020, 39.9374),
('怀柔', 'Huairou', '北京', 'Beijing', 116.6377, 40.3240),
('平谷', 'Pinggu', '北京', 'Beijing', 117.1123, 40.1459),
('密云', 'Miyun', '北京', 'Beijing', 116.9435, 40.3771),
('延庆', 'Yanqing', '北京', 'Beijing', 115.9850, 40.4651);

-- 插入上海区域数据
INSERT INTO `regions` (`name`, `name_en`, `city`, `city_en`, `longitude`, `latitude`) VALUES
('浦东', 'Pudong', '上海', 'Shanghai', 121.5449, 31.2206),
('黄浦', 'Huangpu', '上海', 'Shanghai', 121.4903, 31.2226),
('静安', 'Jingan', '上海', 'Shanghai', 121.4445, 31.2286),
('徐汇', 'Xuhui', '上海', 'Shanghai', 121.4333, 31.1883),
('长宁', 'Changning', '上海', 'Shanghai', 121.4246, 31.2209),
('普陀', 'Putuo', '上海', 'Shanghai', 121.3952, 31.2486),
('虹口', 'Hongkou', '上海', 'Shanghai', 121.4918, 31.2607),
('杨浦', 'Yangpu', '上海', 'Shanghai', 121.5254, 31.2596),
('闵行', 'Minhang', '上海', 'Shanghai', 121.3894, 31.1128),
('宝山', 'Baoshan', '上海', 'Shanghai', 121.4891, 31.3793),
('嘉定', 'Jiading', '上海', 'Shanghai', 121.2654, 31.3754),
('金山', 'Jinshan', '上海', 'Shanghai', 121.3472, 30.7351),
('松江', 'Songjiang', '上海', 'Shanghai', 121.2265, 31.0325),
('青浦', 'Qingpu', '上海', 'Shanghai', 121.1244, 31.1433),
('奉贤', 'Fengxian', '上海', 'Shanghai', 121.5580, 30.9122),
('崇明', 'Chongming', '上海', 'Shanghai', 121.5122, 31.6227);

-- 插入广州区域数据
INSERT INTO `regions` (`name`, `name_en`, `city`, `city_en`, `longitude`, `latitude`) VALUES
('天河', 'Tianhe', '广州', 'Guangzhou', 113.3611, 23.1291),
('越秀', 'Yuexiu', '广州', 'Guangzhou', 113.2665, 23.1287),
('海珠', 'Haizhu', '广州', 'Guangzhou', 113.2584, 23.0830),
('荔湾', 'Liwan', '广州', 'Guangzhou', 113.2448, 23.1282),
('白云', 'Baiyun', '广州', 'Guangzhou', 113.2730, 23.2140),
('番禺', 'Panyu', '广州', 'Guangzhou', 113.3646, 22.9380),
('黄埔', 'Huangpu', '广州', 'Guangzhou', 113.4808, 23.1819),
('花都', 'Huadu', '广州', 'Guangzhou', 113.3106, 23.3920),
('南沙', 'Nansha', '广州', 'Guangzhou', 113.5245, 22.7941),
('从化', 'Conghua', '广州', 'Guangzhou', 113.5866, 23.5453),
('增城', 'Zengcheng', '广州', 'Guangzhou', 113.8295, 23.2907);

-- 插入深圳区域数据
INSERT INTO `regions` (`name`, `name_en`, `city`, `city_en`, `longitude`, `latitude`) VALUES
('南山', 'Nanshan', '深圳', 'Shenzhen', 113.9305, 22.5330),
('福田', 'Futian', '深圳', 'Shenzhen', 114.0559, 22.5215),
('罗湖', 'Luohu', '深圳', 'Shenzhen', 114.1315, 22.5482),
('宝安', 'Baoan', '深圳', 'Shenzhen', 113.8284, 22.7574),
('龙岗', 'Longgang', '深圳', 'Shenzhen', 114.2471, 22.7205),
('龙华', 'Longhua', '深圳', 'Shenzhen', 114.0473, 22.6997),
('盐田', 'Yantian', '深圳', 'Shenzhen', 114.2379, 22.5559),
('坪山', 'Pingshan', '深圳', 'Shenzhen', 114.3492, 22.6951),
('光明', 'Guangming', '深圳', 'Shenzhen', 113.9361, 22.7787);

-- 插入杭州区域数据
INSERT INTO `regions` (`name`, `name_en`, `city`, `city_en`, `longitude`, `latitude`) VALUES
('西湖', 'Xihu', '杭州', 'Hangzhou', 120.1303, 30.2591),
('上城', 'Shangcheng', '杭州', 'Hangzhou', 120.1719, 30.2477),
('拱墅', 'Gongshu', '杭州', 'Hangzhou', 120.1315, 30.3104),
('江干', 'Jianggan', '杭州', 'Hangzhou', 120.2026, 30.2650),
('滨江', 'Binjiang', '杭州', 'Hangzhou', 120.2170, 30.2333),
('萧山', 'Xiaoshan', '杭州', 'Hangzhou', 120.2711, 30.1634),
('余杭', 'Yuhang', '杭州', 'Hangzhou', 119.9533, 30.4201),
('富阳', 'Fuyang', '杭州', 'Hangzhou', 119.9571, 30.0507),
('临安', 'Linan', '杭州', 'Hangzhou', 119.7245, 30.2349),
('临平', 'Linping', '杭州', 'Hangzhou', 120.3061, 30.4190),
('钱塘', 'Qiantang', '杭州', 'Hangzhou', 120.4919, 30.4228);

SET FOREIGN_KEY_CHECKS = 1;
