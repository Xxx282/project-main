package com.rental.modules.tenant.controller;

import com.rental.common.Result;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.service.PropertyService;
import com.rental.modules.tenant.entity.TenantPreference;
import com.rental.modules.tenant.service.TenantPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 租客控制器 - 提供推荐等功能
 */
@Slf4j
@RestController
@RequestMapping("/tenant")
@RequiredArgsConstructor
@Tag(name = "租客服务", description = "租客相关服务")
public class TenantController {

    private final TenantPreferenceService preferenceService;
    private final PropertyService propertyService;

    /**
     * 获取个性化推荐房源
     * 根据用户偏好设置返回符合条件的房源
     */
    @GetMapping("/recommendations")
    @Operation(summary = "获取个性化推荐", description = "根据用户偏好推荐房源")
    public ResponseEntity<Result<List<Property>>> getRecommendations(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        log.info("获取用户 {} 的个性化推荐", userId);

        // 获取用户偏好设置
        TenantPreference preferences = preferenceService.getPreferences(userId);

        // 根据偏好构建查询条件
        List<Property> allListings = propertyService.findAllAvailable();

        // 过滤符合条件的房源
        List<Property> recommendations = filterByPreferences(allListings, preferences);

        // 如果没有偏好设置，返回所有可租房源
        if (recommendations.isEmpty()) {
            recommendations = allListings;
        }

        // 限制返回数量
        if (recommendations.size() > 20) {
            recommendations = recommendations.subList(0, 20);
        }

        return ResponseEntity.ok(Result.success(recommendations));
    }

    /**
     * 根据偏好设置过滤房源
     * 匹配规则：
     * 1. 房源租金不超过预算
     * 2. 城市、区域、户型（卧室数）、卫生间、朝向、装修相同
     * 3. 面积范围和楼层范围
     * 
     * 如果偏好对象存在但所有字段都是 null/空，则返回所有房源
     */
    private List<Property> filterByPreferences(List<Property> listings, TenantPreference preferences) {
        if (preferences == null) {
            return listings;
        }

        // 检查是否有任何有效的筛选条件
        boolean hasAnyFilter = preferences.getBudget() != null
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

        // 如果没有任何筛选条件，返回所有房源
        if (!hasAnyFilter) {
            return listings;
        }

        List<Property> filtered = new ArrayList<>();

        for (Property property : listings) {
            boolean matches = true;

            // 1. 预算匹配：房源租金不超过预算
            if (preferences.getBudget() != null) {
                BigDecimal maxBudget = new BigDecimal(preferences.getBudget());
                if (property.getPrice().compareTo(maxBudget) > 0) {
                    matches = false;
                }
            }

            // 2. 城市匹配：必须相同
            if (matches && preferences.getCity() != null && !preferences.getCity().isEmpty()) {
                if (!preferences.getCity().equals(property.getCity())) {
                    matches = false;
                }
            }

            // 3. 区域匹配：必须相同
            if (matches && preferences.getRegion() != null && !preferences.getRegion().isEmpty()) {
                if (property.getRegion() == null || !preferences.getRegion().equals(property.getRegion())) {
                    matches = false;
                }
            }

            // 4. 户型（卧室数）匹配：必须相同
            if (matches && preferences.getBedrooms() != null) {
                if (!property.getBedrooms().equals(preferences.getBedrooms())) {
                    matches = false;
                }
            }

            // 5. 卫生间数匹配：必须相同
            if (matches && preferences.getBathrooms() != null) {
                if (property.getBathrooms() == null || !property.getBathrooms().equals(preferences.getBathrooms())) {
                    matches = false;
                }
            }

            // 6. 面积范围匹配：在偏好范围内
            if (matches && preferences.getMinArea() != null) {
                if (property.getArea().compareTo(preferences.getMinArea()) < 0) {
                    matches = false;
                }
            }
            if (matches && preferences.getMaxArea() != null) {
                if (property.getArea().compareTo(preferences.getMaxArea()) > 0) {
                    matches = false;
                }
            }

            // 7. 楼层范围匹配：在偏好范围内
            if (matches && preferences.getMinFloors() != null) {
                if (property.getTotalFloors() == null ||
                    property.getTotalFloors() < preferences.getMinFloors()) {
                    matches = false;
                }
            }
            if (matches && preferences.getMaxFloors() != null) {
                if (property.getTotalFloors() == null ||
                    property.getTotalFloors() > preferences.getMaxFloors()) {
                    matches = false;
                }
            }

            // 8. 朝向匹配：必须相同
            // 注意：如果偏好中朝向为 null 或空（即设为"无"），则不进行朝向过滤，返回所有朝向的房源
            if (matches && preferences.getOrientation() != null && !preferences.getOrientation().isEmpty()) {
                if (property.getOrientation() == null ||
                    !property.getOrientation().name().equals(preferences.getOrientation())) {
                    matches = false;
                }
            }

            // 9. 装修匹配：必须相同
            // 注意：如果偏好中装修为 null 或空（即设为"无"），则不进行装修过滤，返回所有装修的房源
            if (matches && preferences.getDecoration() != null && !preferences.getDecoration().isEmpty()) {
                if (property.getDecoration() == null ||
                    !property.getDecoration().name().equals(preferences.getDecoration())) {
                    matches = false;
                }
            }

            if (matches) {
                filtered.add(property);
            }
        }

        return filtered;
    }
}
