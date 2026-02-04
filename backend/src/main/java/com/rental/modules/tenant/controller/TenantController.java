package com.rental.modules.tenant.controller;

import com.rental.common.Result;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.repository.PropertyRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 租客控制器
 */
@Slf4j
@RestController
@RequestMapping("/tenant")
@RequiredArgsConstructor
@Tag(name = "租客服务", description = "租客相关功能")
public class TenantController {

    private final PropertyRepository propertyRepository;

    /**
     * 获取个性化推荐
     */
    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(summary = "获取个性化推荐", description = "根据用户偏好推荐房源")
    public ResponseEntity<Result<List<Property>>> getRecommendations(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        log.info("获取推荐: userId={}", userId);

        // TODO: 后续可集成 ML 服务获取智能推荐
        // 目前基于基础条件筛选：可租房源 + 排序
        List<Property> listings = propertyRepository.findByStatus(Property.PropertyStatus.available);

        // 简单返回可租房源列表（可后续接入 ML 推荐）
        return ResponseEntity.ok(Result.success(listings));
    }

    /**
     * 获取用户偏好
     */
    @GetMapping("/preferences")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(summary = "获取用户偏好")
    public ResponseEntity<Result<TenantPreferences>> getPreferences() {
        // TODO: 后续可实现完整的偏好存储
        TenantPreferences preferences = new TenantPreferences();
        return ResponseEntity.ok(Result.success(preferences));
    }

    /**
     * 保存用户偏好
     */
    @PutMapping("/preferences")
    @PreAuthorize("hasRole('TENANT')")
    @Operation(summary = "保存用户偏好")
    public ResponseEntity<Result<TenantPreferences>> savePreferences(@RequestBody TenantPreferences preferences) {
        // TODO: 后续可实现完整的偏好存储
        return ResponseEntity.ok(Result.success(preferences));
    }

    /**
     * 租客偏好设置
     */
    public static class TenantPreferences {
        private Integer budgetMin;
        private Integer budgetMax;
        private List<String> preferredRegions = new ArrayList<>();
        private Integer minBedrooms;
        private Integer maxBedrooms;
        private Double minArea;
        private Double maxArea;
        private List<String> propertyTypes = new ArrayList<>();

        // Getters and Setters
        public Integer getBudgetMin() {
            return budgetMin;
        }

        public void setBudgetMin(Integer budgetMin) {
            this.budgetMin = budgetMin;
        }

        public Integer getBudgetMax() {
            return budgetMax;
        }

        public void setBudgetMax(Integer budgetMax) {
            this.budgetMax = budgetMax;
        }

        public List<String> getPreferredRegions() {
            return preferredRegions;
        }

        public void setPreferredRegions(List<String> preferredRegions) {
            this.preferredRegions = preferredRegions;
        }

        public Integer getMinBedrooms() {
            return minBedrooms;
        }

        public void setMinBedrooms(Integer minBedrooms) {
            this.minBedrooms = minBedrooms;
        }

        public Integer getMaxBedrooms() {
            return maxBedrooms;
        }

        public void setMaxBedrooms(Integer maxBedrooms) {
            this.maxBedrooms = maxBedrooms;
        }

        public Double getMinArea() {
            return minArea;
        }

        public void setMinArea(Double minArea) {
            this.minArea = minArea;
        }

        public Double getMaxArea() {
            return maxArea;
        }

        public void setMaxArea(Double maxArea) {
            this.maxArea = maxArea;
        }

        public List<String> getPropertyTypes() {
            return propertyTypes;
        }

        public void setPropertyTypes(List<String> propertyTypes) {
            this.propertyTypes = propertyTypes;
        }
    }
}
