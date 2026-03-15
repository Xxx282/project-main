package com.rental.modules.tenant.controller;

import com.rental.common.Result;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.service.PropertyService;
import com.rental.modules.region.entity.Region;
import com.rental.modules.region.repository.RegionRepository;
import com.rental.modules.tenant.entity.TenantPreference;
import com.rental.modules.tenant.service.TenantPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 租客控制器 - 提供推荐等功能
 */
@Slf4j
@RestController
@RequestMapping("/tenant")
@RequiredArgsConstructor
@Tag(name = "租客服务", description = "租客相关服务")
public class TenantController {

    // 相似度评分权重配置
    private static final double WEIGHT_BUDGET = 20.0;      // 预算权重
    private static final double WEIGHT_CITY = 20.0;        // 城市权重
    private static final double WEIGHT_REGION = 15.0;       // 区域权重
    private static final double WEIGHT_BEDROOMS = 10.0;     // 卧室数权重
    private static final double WEIGHT_BATHROOMS = 8.0;     // 卫生间数权重
    private static final double WEIGHT_AREA = 10.0;        // 面积权重
    private static final double WEIGHT_FLOORS = 4.0;       // 楼层权重
    private static final double WEIGHT_ORIENTATION = 1.5;    // 朝向权重
    private static final double WEIGHT_DECORATION = 1.5;    // 装修权重

    // 预算差异容忍度（超过此差异得0分）
    private static final int BUDGET_TOLERANCE = 500;

    // 城市间最大距离（公里），超过此距离得0分
    private static final int CITY_MAX_DISTANCE = 500;

    // 区域间最大距离（公里），超过此距离得0分
    private static final int REGION_MAX_DISTANCE = 50;

    // 高德地图API配置
    @Value("${amap.key:5ea5ff6504753ba6e4cce1132a876451}")
    private String amapKey;

    // 城市坐标缓存
    private final Map<String, double[]> cityCoordinateCache = new ConcurrentHashMap<>();

    // 区域坐标缓存：key为"城市_区域"，value为[经度, 纬度]
    private final Map<String, double[]> regionCoordinateCache = new ConcurrentHashMap<>();

    // 配置 RestTemplate 超时时间，避免长时间等待外部 API
    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);  // 连接超时 3 秒
        factory.setReadTimeout(3000);     // 读取超时 3 秒
        return new RestTemplate(factory);
    }

    // 中国主要城市坐标（作为后备）
    private static final java.util.Map<String, double[]> FALLBACK_CITY_COORDINATES = java.util.Map.ofEntries(
        // 中文城市名
        java.util.Map.entry("北京", new double[]{116.4074, 39.9042}),
        java.util.Map.entry("上海", new double[]{121.4737, 31.2304}),
        java.util.Map.entry("广州", new double[]{113.2644, 23.1291}),
        java.util.Map.entry("深圳", new double[]{114.0579, 22.5431}),
        java.util.Map.entry("杭州", new double[]{120.1551, 30.2741}),
        java.util.Map.entry("成都", new double[]{104.0657, 30.6598}),
        java.util.Map.entry("武汉", new double[]{114.3055, 30.5928}),
        java.util.Map.entry("西安", new double[]{108.9398, 34.3416}),
        java.util.Map.entry("南京", new double[]{118.7969, 32.0603}),
        java.util.Map.entry("重庆", new double[]{106.5516, 29.5630}),
        java.util.Map.entry("天津", new double[]{117.2010, 39.0842}),
        java.util.Map.entry("苏州", new double[]{120.5853, 31.2989}),
        java.util.Map.entry("郑州", new double[]{113.6254, 34.7466}),
        java.util.Map.entry("长沙", new double[]{112.9388, 28.2282}),
        java.util.Map.entry("青岛", new double[]{120.3826, 36.0671}),
        java.util.Map.entry("沈阳", new double[]{123.4315, 41.8057}),
        java.util.Map.entry("大连", new double[]{121.6147, 38.9140}),
        java.util.Map.entry("厦门", new double[]{118.0894, 24.4798}),
        java.util.Map.entry("昆明", new double[]{102.8329, 24.8801}),
        java.util.Map.entry("哈尔滨", new double[]{126.5340, 45.8038}),
        // 英文城市名
        java.util.Map.entry("Beijing", new double[]{116.4074, 39.9042}),
        java.util.Map.entry("Shanghai", new double[]{121.4737, 31.2304}),
        java.util.Map.entry("Guangzhou", new double[]{113.2644, 23.1291}),
        java.util.Map.entry("Shenzhen", new double[]{114.0579, 22.5431}),
        java.util.Map.entry("Hangzhou", new double[]{120.1551, 30.2741}),
        java.util.Map.entry("Chengdu", new double[]{104.0657, 30.6598}),
        java.util.Map.entry("Wuhan", new double[]{114.3055, 30.5928}),
        java.util.Map.entry("Xi'an", new double[]{108.9398, 34.3416}),
        java.util.Map.entry("Xian", new double[]{108.9398, 34.3416}),
        java.util.Map.entry("Nanjing", new double[]{118.7969, 32.0603}),
        java.util.Map.entry("Chongqing", new double[]{106.5516, 29.5630}),
        java.util.Map.entry("Tianjin", new double[]{117.2010, 39.0842}),
        java.util.Map.entry("Suzhou", new double[]{120.5853, 31.2989}),
        java.util.Map.entry("Zhengzhou", new double[]{113.6254, 34.7466}),
        java.util.Map.entry("Changsha", new double[]{112.9388, 28.2282}),
        java.util.Map.entry("Qingdao", new double[]{120.3826, 36.0671}),
        java.util.Map.entry("Shenyang", new double[]{123.4315, 41.8057}),
        java.util.Map.entry("Dalian", new double[]{121.6147, 38.9140}),
        java.util.Map.entry("Xiamen", new double[]{118.0894, 24.4798}),
        java.util.Map.entry("Kunming", new double[]{102.8329, 24.8801}),
        java.util.Map.entry("Harbin", new double[]{126.5340, 45.8038})
    );

    @PostConstruct
    public void init() {
        // 初始化时将后备坐标加载到缓存
        cityCoordinateCache.putAll(FALLBACK_CITY_COORDINATES);
        log.info("城市坐标缓存已初始化，后备坐标数量: {}", FALLBACK_CITY_COORDINATES.size());
    }

    /**
     * 通过高德API获取城市坐标
     */
    private double[] getCityCoordinates(String cityName) {
        if (cityName == null || cityName.isEmpty()) {
            return null;
        }

        // 先从缓存获取
        if (cityCoordinateCache.containsKey(cityName)) {
            log.debug("从缓存获取城市 {} 坐标", cityName);
            return cityCoordinateCache.get(cityName);
        }

        log.info("调用高德API获取城市 {} 的坐标...", cityName);
        try {
            // 调用高德API
            String url = String.format(
                "https://restapi.amap.com/v3/geocode/geo?address=%s&key=%s",
                java.net.URLEncoder.encode(cityName, "UTF-8"),
                amapKey
            );

            String response = restTemplate.getForObject(url, String.class);
            log.info("高德API响应: {}", response);

            // 解析响应
            if (response != null && response.contains("\"status\":\"1\"")) {
                // 提取坐标
                int geocodesIndex = response.indexOf("\"geocodes\"");
                if (geocodesIndex > 0) {
                    int locationStart = response.indexOf("\"location\":\"", geocodesIndex);
                    if (locationStart > 0) {
                        int locationEnd = response.indexOf("\"", locationStart + 12);
                        if (locationEnd > locationStart) {
                            String location = response.substring(locationStart + 12, locationEnd);
                            String[] parts = location.split(",");
                            if (parts.length == 2) {
                                double lon = Double.parseDouble(parts[0]);
                                double lat = Double.parseDouble(parts[1]);
                                double[] coords = {lon, lat};
                                cityCoordinateCache.put(cityName, coords);
                                log.info("通过高德API获取城市 {} 坐标: {}, {}", cityName, lon, lat);
                                return coords;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("获取城市 {} 坐标失败: {}", cityName, e.getMessage());
        }

        return null;
    }

    private final TenantPreferenceService preferenceService;
    private final PropertyService propertyService;
    private final RegionRepository regionRepository;

    /**
     * 计算两点之间的球面距离（公里）
     */
    private double calculateDistance(double lon1, double lat1, double lon2, double lat2) {
        final double R = 6371; // 地球半径（公里）
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 根据城市和区域名称获取坐标
     * 优先从Region表获取，其次从缓存获取
     */
    private double[] getRegionCoordinates(String city, String region) {
        if (city == null || region == null || city.isEmpty() || region.isEmpty()) {
            return null;
        }

        String cacheKey = city + "_" + region;

        // 先从内存缓存获取
        if (regionCoordinateCache.containsKey(cacheKey)) {
            return regionCoordinateCache.get(cacheKey);
        }

        // 从数据库Region表获取
        try {
            java.util.Optional<Region> regionOpt = regionRepository.findByCityAndNameAny(city, region);
            if (regionOpt.isPresent()) {
                Region r = regionOpt.get();
                double[] coords = {r.getLongitude().doubleValue(), r.getLatitude().doubleValue()};
                regionCoordinateCache.put(cacheKey, coords);
                log.debug("从数据库获取区域坐标: {}_{} -> {}, {}", city, region, coords[0], coords[1]);
                return coords;
            }
        } catch (Exception e) {
            log.warn("从数据库查询区域 {} 坐标失败: {}", cacheKey, e.getMessage());
        }

        // 尝试通过高德API获取
        try {
            String address = city + region;
            double[] coords = getCoordinatesFromAmap(address);
            if (coords != null) {
                regionCoordinateCache.put(cacheKey, coords);
                log.debug("从高德API获取区域坐标: {}_{} -> {}, {}", city, region, coords[0], coords[1]);
                return coords;
            }
        } catch (Exception e) {
            log.warn("从高德API获取区域 {} 坐标失败: {}", cacheKey, e.getMessage());
        }

        return null;
    }

    /**
     * 从高德API获取坐标
     */
    private double[] getCoordinatesFromAmap(String address) {
        log.info("调用高德API获取地址 {} 的坐标...", address);
        try {
            String url = String.format(
                "https://restapi.amap.com/v3/geocode/geo?address=%s&key=%s",
                java.net.URLEncoder.encode(address, "UTF-8"),
                amapKey
            );

            String response = restTemplate.getForObject(url, String.class);
            log.info("高德API响应: {}", response);

            if (response != null && response.contains("\"status\":\"1\"")) {
                int geocodesIndex = response.indexOf("\"geocodes\"");
                if (geocodesIndex > 0) {
                    int locationStart = response.indexOf("\"location\":\"", geocodesIndex);
                    if (locationStart > 0) {
                        int locationEnd = response.indexOf("\"", locationStart + 12);
                        if (locationEnd > locationStart) {
                            String location = response.substring(locationStart + 12, locationEnd);
                            String[] parts = location.split(",");
                            if (parts.length == 2) {
                                double lon = Double.parseDouble(parts[0]);
                                double lat = Double.parseDouble(parts[1]);
                                log.info("高德API成功获取地址 {} 的坐标: 经度={}, 纬度={}", address, lon, lat);
                                return new double[]{lon, lat};
                            }
                        }
                    }
                }
            }
            log.warn("高德API未能解析地址 {} 的坐标", address);
        } catch (Exception e) {
            log.warn("高德API调用失败: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 根据距离计算相似度评分
     */
    private double calculateDistanceScore(double distance, double maxDistance) {
        if (distance == 0) {
            return 100;
        } else if (distance <= maxDistance) {
            return 100 * (1 - distance / maxDistance);
        } else {
            return 0;
        }
    }

    /**
     * 获取个性化推荐房源
     * 根据用户偏好设置计算相似度，返回最相似的房源
     */
    @GetMapping("/recommendations")
    @Operation(summary = "获取个性化推荐", description = "根据用户偏好推荐相似度最高的房源")
    public ResponseEntity<Result<List<Property>>> getRecommendations(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        log.info("获取用户 {} 的个性化推荐", userId);

        try {
            // 获取用户偏好设置
            TenantPreference preferences = preferenceService.getPreferences(userId);

            // 获取所有可租房源
            List<Property> allListings = propertyService.findAllAvailable();

            // 如果没有偏好设置，返回所有可租房源
            if (!hasAnyPreference(preferences)) {
                log.info("用户 {} 没有设置偏好，返回所有可租房源", userId);
                List<Property> result = allListings.size() > 20
                    ? allListings.subList(0, 20)
                    : allListings;
                return ResponseEntity.ok(Result.success(result));
            }

            // 计算每个房源的相似度评分，并按评分排序
            // 先计算分数并保存
            List<java.util.AbstractMap.SimpleEntry<Property, Double>> scoredList = new java.util.ArrayList<>();
            for (Property p : allListings) {
                double score = calculateSimilarity(p, preferences);
                scoredList.add(new java.util.AbstractMap.SimpleEntry<>(p, score));
            }

            // 按分数降序排序
            scoredList.sort((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()));

            // 取前20条
            List<Property> result = scoredList.stream()
                    .limit(20)
                    .map(java.util.AbstractMap.SimpleEntry::getKey)
                    .toList();

            // 输出返回给前端的房源详细相似度
            log.info("===== 推荐结果详情 =====");
            for (int i = 0; i < scoredList.size() && i < 20; i++) {
                Property p = scoredList.get(i).getKey();
                double score = scoredList.get(i).getValue();
                log.info("推荐#{}. 房源ID={}, 城市={}, 区域={}, 价格={}, 卧室={}, 卫生间={}, 面积={}㎡, 相似度={}",
                        i + 1, p.getId(), p.getCity(), p.getRegion(), p.getPrice(),
                        p.getBedrooms(), p.getBathrooms(), p.getArea(), String.format("%.2f", score));
            }
            log.info("=======================");

            log.info("用户 {} 的推荐结果：共 {} 条房源", userId, result.size());
            return ResponseEntity.ok(Result.success(result));
        } catch (Exception e) {
            log.error("获取用户 {} 的推荐房源失败", userId, e);
            return ResponseEntity.status(500).body(Result.error(500, "获取推荐房源失败: " + e.getMessage()));
        }
    }

    /**
     * 检查是否有任何有效的偏好设置
     */
    private boolean hasAnyPreference(TenantPreference preferences) {
        if (preferences == null) {
            return false;
        }
        return preferences.getBudget() != null
                || (preferences.getCity() != null && !preferences.getCity().isEmpty())
                || (preferences.getRegion() != null && !preferences.getRegion().isEmpty())
                || preferences.getBedrooms() != null
                || preferences.getBathrooms() != null
                || preferences.getMinArea() != null
                || preferences.getMaxArea() != null
                || preferences.getMinFloors() != null
                || preferences.getMaxFloors() != null
                || (preferences.getOrientation() != null && !preferences.getOrientation().isEmpty())
                || (preferences.getDecoration() != null && !preferences.getDecoration().isEmpty());
    }

    /**
     * 计算单个房源与偏好的相似度评分
     * 如果城市不同，直接返回0（不推荐不同城市的房源）
     */
    private double calculateSimilarity(Property property, TenantPreference preferences) {
        double totalScore = 0.0;
        double totalWeight = 0.0;

        // 各维度得分
        double budgetScore = 0;
        double cityScore = 0;
        double regionScore = 0;
        double bedroomsScore = 0;
        double bathroomsScore = 0;
        double areaScore = 0;
        double floorsScore = 0;
        double orientationScore = 0;
        double decorationScore = 0;

        // 0. 城市过滤：如果用户设置了城市偏好，但房源城市不同，直接返回0
        if (preferences.getCity() != null && !preferences.getCity().isEmpty()) {
            String prefCity = preferences.getCity();
            String propCity = property.getCity();
            if (propCity == null || !isSameCity(prefCity, propCity)) {
                log.debug("城市不匹配，排除房源: {} vs {}", prefCity, propCity);
                return 0;
            }
        }

        // 1. 预算相似度：低于或等于预算得满分，超过预算按比例扣分
        if (preferences.getBudget() != null) {
            int propPrice = property.getPrice().intValue();
            int budget = preferences.getBudget();
            if (propPrice <= budget) {
                // 低于或等于预算，得满分100分，越低分数越高
                budgetScore = 100;
            } else {
                // 超过预算，按超出比例扣分
                int overBudget = propPrice - budget;
                if (overBudget <= BUDGET_TOLERANCE) {
                    budgetScore = 100 * (1 - (double) overBudget / BUDGET_TOLERANCE);
                } else {
                    budgetScore = Math.max(0, 100 * (1 - (double) overBudget / (BUDGET_TOLERANCE * 4)));
                }
            }
            totalScore += budgetScore * WEIGHT_BUDGET;
            totalWeight += WEIGHT_BUDGET;
        }

        // 2. 城市相似度：城市相同得100分（不同城市在上面已过滤）
        if (preferences.getCity() != null && !preferences.getCity().isEmpty()) {
            cityScore = 100;
            totalScore += cityScore * WEIGHT_CITY;
            totalWeight += WEIGHT_CITY;
        }

        // 3. 区域相似度：根据区域距离算分
        if (preferences.getRegion() != null && !preferences.getRegion().isEmpty()) {
            regionScore = calculateRegionScore(preferences.getCity(), preferences.getRegion(), property.getRegion());
            totalScore += regionScore * WEIGHT_REGION;
            totalWeight += WEIGHT_REGION;
        }

        // 4. 卧室数相似度：相同得满分，不同得0分
        if (preferences.getBedrooms() != null) {
            bedroomsScore = preferences.getBedrooms().equals(property.getBedrooms()) ? 100 : 0;
            totalScore += bedroomsScore * WEIGHT_BEDROOMS;
            totalWeight += WEIGHT_BEDROOMS;
        }

        // 5. 卫生间数相似度：相同得满分，不同得0分
        if (preferences.getBathrooms() != null) {
            bathroomsScore = (property.getBathrooms() != null
                    && preferences.getBathrooms().equals(property.getBathrooms())) ? 100 : 0;
            totalScore += bathroomsScore * WEIGHT_BATHROOMS;
            totalWeight += WEIGHT_BATHROOMS;
        }

        // 6. 面积相似度：在偏好范围内得满分，范围外按差异扣分
        if (preferences.getMinArea() != null || preferences.getMaxArea() != null) {
            BigDecimal area = property.getArea();

            BigDecimal minPref = preferences.getMinArea() != null ? preferences.getMinArea() : BigDecimal.ZERO;
            BigDecimal maxPref = preferences.getMaxArea() != null ? preferences.getMaxArea() : new BigDecimal("1000");

            if (area.compareTo(minPref) >= 0 && area.compareTo(maxPref) <= 0) {
                BigDecimal range = maxPref.subtract(minPref);
                if (range.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal mid = minPref.add(maxPref).divide(new BigDecimal("2"));
                    BigDecimal diff = area.subtract(mid).abs();
                    areaScore = 100 * (1 - diff.divide(range, 4, java.math.RoundingMode.HALF_UP).doubleValue());
                } else {
                    areaScore = 100;
                }
            } else {
                if (area.compareTo(minPref) < 0) {
                    BigDecimal diff = minPref.subtract(area);
                    areaScore = Math.max(0, 100 - diff.doubleValue());
                } else {
                    BigDecimal diff = area.subtract(maxPref);
                    areaScore = Math.max(0, 100 - diff.doubleValue());
                }
            }
            totalScore += areaScore * WEIGHT_AREA;
            totalWeight += WEIGHT_AREA;
        }

        // 7. 楼层相似度：相同得满分，不同得0分
        if (preferences.getMinFloors() != null || preferences.getMaxFloors() != null) {
            Integer totalFloors = property.getTotalFloors();
            if (totalFloors != null) {
                int minPref = preferences.getMinFloors() != null ? preferences.getMinFloors() : 1;
                int maxPref = preferences.getMaxFloors() != null ? preferences.getMaxFloors() : 100;
                if (totalFloors >= minPref && totalFloors <= maxPref) {
                    floorsScore = 100;
                }
            }
            totalScore += floorsScore * WEIGHT_FLOORS;
            totalWeight += WEIGHT_FLOORS;
        }

        // 8. 朝向相似度：相同得满分，不同得0分
        if (preferences.getOrientation() != null && !preferences.getOrientation().isEmpty()) {
            orientationScore = (property.getOrientation() != null
                    && preferences.getOrientation().equals(property.getOrientation().name())) ? 100 : 0;
            totalScore += orientationScore * WEIGHT_ORIENTATION;
            totalWeight += WEIGHT_ORIENTATION;
        }

        // 9. 装修相似度：相同得满分，不同得0分
        if (preferences.getDecoration() != null && !preferences.getDecoration().isEmpty()) {
            decorationScore = (property.getDecoration() != null
                    && preferences.getDecoration().equals(property.getDecoration().name())) ? 100 : 0;
            totalScore += decorationScore * WEIGHT_DECORATION;
            totalWeight += WEIGHT_DECORATION;
        }

        // 计算加权平均分
        double finalScore = totalWeight > 0 ? totalScore / totalWeight : 0.0;

        return finalScore;
    }

    /**
     * 判断两个城市名是否相同（兼容中英文）
     */
    private boolean isSameCity(String city1, String city2) {
        if (city1 == null || city2 == null) {
            return false;
        }
        // 直接比较
        if (city1.equalsIgnoreCase(city2)) {
            return true;
        }
        // 检查是否有映射关系
        return getCityAlias(city1).equalsIgnoreCase(getCityAlias(city2));
    }

    /**
     * 获取城市名的标准别名（用于中英文匹配）
     */
    private String getCityAlias(String city) {
        if (city == null) {
            return null;
        }
        // 英文别名映射
        java.util.Map<String, String> cityAliasMap = java.util.Map.ofEntries(
            java.util.Map.entry("Beijing", "北京"),
            java.util.Map.entry("Shanghai", "上海"),
            java.util.Map.entry("Guangzhou", "广州"),
            java.util.Map.entry("Shenzhen", "深圳"),
            java.util.Map.entry("Hangzhou", "杭州"),
            java.util.Map.entry("Chengdu", "成都"),
            java.util.Map.entry("Wuhan", "武汉"),
            java.util.Map.entry("Xi'an", "西安"),
            java.util.Map.entry("Xian", "西安"),
            java.util.Map.entry("Nanjing", "南京"),
            java.util.Map.entry("Chongqing", "重庆"),
            java.util.Map.entry("Tianjin", "天津"),
            java.util.Map.entry("Suzhou", "苏州"),
            java.util.Map.entry("Zhengzhou", "郑州"),
            java.util.Map.entry("Changsha", "长沙"),
            java.util.Map.entry("Qingdao", "青岛"),
            java.util.Map.entry("Shenyang", "沈阳"),
            java.util.Map.entry("Dalian", "大连"),
            java.util.Map.entry("Xiamen", "厦门"),
            java.util.Map.entry("Kunming", "昆明"),
            java.util.Map.entry("Harbin", "哈尔滨")
        );

        // 如果是纯中文，直接返回
        if (!city.matches(".*[a-zA-Z].*")) {
            return city;
        }
        // 如果是英文，检查是否有对应的中文别名
        String chineseName = cityAliasMap.get(city);
        return chineseName != null ? chineseName : city;
    }

    /**
     * 计算区域相似度得分
     * 根据区域经纬度坐标计算距离，距离越近分数越高
     */
    private double calculateRegionScore(String city, String prefRegion, String propRegion) {
        if (prefRegion == null || propRegion == null) {
            return 0;
        }
        // 完全相同
        if (prefRegion.equalsIgnoreCase(propRegion)) {
            return 100;
        }

        // 获取偏好区域和房源区域的坐标
        double[] prefCoords = getRegionCoordinates(city, prefRegion);
        double[] propCoords = getRegionCoordinates(city, propRegion);

        // 如果无法获取坐标，回退到原来的简单匹配逻辑
        if (prefCoords == null || propCoords == null) {
            log.debug("无法获取区域坐标，回退到字符串匹配: {} vs {}", prefRegion, propRegion);
            return 30;
        }

        // 计算球面距离
        double distance = calculateDistance(prefCoords[0], prefCoords[1], propCoords[0], propCoords[1]);

        // 根据距离计算得分
        return calculateDistanceScore(distance, REGION_MAX_DISTANCE);
    }
}
