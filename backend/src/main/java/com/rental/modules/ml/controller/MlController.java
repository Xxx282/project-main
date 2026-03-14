package com.rental.modules.ml.controller;

import com.rental.common.Result;
import com.rental.modules.ml.dto.PricePredictionRequest;
import com.rental.modules.ml.dto.PricePredictionResponse;
import com.rental.modules.ml.dto.RecommendationRequest;
import com.rental.modules.ml.dto.RecommendationResponse;
import com.rental.modules.ml.service.MlService;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.service.PropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * ML 服务控制器 - 预留接口供 ML 服务调用
 */
@Slf4j
@RestController
@RequestMapping("/ml")
@RequiredArgsConstructor
@Tag(name = "ML 服务", description = "机器学习服务接口")
public class MlController {

    private final MlService mlService;
    private final PropertyService propertyService;

    /**
     * 租金预测接口
     */
    @PostMapping("/predict")
    @PreAuthorize("hasAnyRole('tenant', 'landlord', 'admin')")
    @Operation(summary = "租金预测", description = "基于房源特征预测租金价格")
    public ResponseEntity<Result<PricePredictionResponse>> predictPrice(
            @RequestBody PricePredictionRequest request) {
        log.info("收到租金预测请求: bedrooms={}, area={}, city={}",
                request.getBedrooms(), request.getArea(), request.getCity());

        PricePredictionResponse response = mlService.predictPrice(request);

        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * 个性化推荐接口
     */
    @PostMapping("/recommend")
    @PreAuthorize("hasAnyRole('tenant', 'landlord', 'admin')")
    @Operation(summary = "个性化推荐", description = "基于用户偏好推荐房源")
    public ResponseEntity<Result<RecommendationResponse>> getRecommendations(
            @RequestBody RecommendationRequest request) {
        log.info("收到推荐请求: userId={}, budgetMin={}, budgetMax={}",
                request.getUserId(), request.getBudgetMin(), request.getBudgetMax());

        RecommendationResponse response = mlService.getRecommendations(request);

        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * ML 服务状态检查
     */
    @GetMapping("/status")
    @Operation(summary = "ML 服务状态", description = "检查 ML 服务是否可用")
    public ResponseEntity<Result<Map<String, Object>>> getMlServiceStatus() {
        boolean available = mlService.isMlServiceAvailable();

        return ResponseEntity.ok(Result.success(Map.of(
            "status", available ? "available" : "unavailable",
            "timestamp", System.currentTimeMillis()
        )));
    }

    /**
     * 查询相似房源（用于价格参考）
     */
    @GetMapping("/similar")
    @PreAuthorize("hasAnyRole('tenant', 'landlord', 'admin')")
    @Operation(summary = "查询相似房源", description = "根据城市、区域、户型查询相似房源作为定价参考")
    public ResponseEntity<Result<List<Map<String, Object>>>> getSimilarProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(defaultValue = "10") int limit) {

        List<Property> properties = propertyService.findSimilarProperties(city, region, bedrooms, limit);

        // 转换为简单对象返回（空值安全）
        List<Map<String, Object>> result = properties.stream().map(p -> {
            Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", p.getId());
            item.put("title", p.getTitle() != null ? p.getTitle() : "");
            item.put("city", p.getCity() != null ? p.getCity() : "");
            item.put("region", p.getRegion() != null ? p.getRegion() : "");
            item.put("bedrooms", p.getBedrooms());
            item.put("bathrooms", p.getBathrooms() != null ? p.getBathrooms() : 1);
            item.put("area", p.getArea());
            item.put("price", p.getPrice());
            item.put("decoration", p.getDecoration() != null ? p.getDecoration().name() : "");
            return item;
        }).toList();

        return ResponseEntity.ok(Result.success(result));
    }

    /**
     * 查询最接近的房源（返回数据库中最匹配的一个，用于定价参考）
     */
    @GetMapping("/closest")
    @Operation(summary = "查询最接近房源", description = "根据输入条件返回数据库中最接近的房源完整信息")
    public ResponseEntity<Result<Map<String, Object>>> getClosestProperty(
            @RequestParam String city,
            @RequestParam Integer bedrooms,
            @RequestParam Integer area) {

        Property property = propertyService.findClosestProperty(city, bedrooms, area);

        if (property == null) {
            return ResponseEntity.ok(Result.success(null));
        }

        // 返回完整信息（空值安全）
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", property.getId());
        result.put("title", property.getTitle() != null ? property.getTitle() : "");
        result.put("city", property.getCity() != null ? property.getCity() : "");
        result.put("region", property.getRegion() != null ? property.getRegion() : "");
        result.put("address", property.getAddress() != null ? property.getAddress() : "");
        result.put("bedrooms", property.getBedrooms());
        result.put("bathrooms", property.getBathrooms() != null ? property.getBathrooms() : 1);
        result.put("area", property.getArea());
        result.put("price", property.getPrice());
        result.put("totalFloors", property.getTotalFloors());
        result.put("decoration", property.getDecoration() != null ? property.getDecoration().name() : "");
        result.put("description", property.getDescription());
        result.put("status", property.getStatus() != null ? property.getStatus().name() : "");
        result.put("viewCount", property.getViewCount() != null ? property.getViewCount() : 0);
        result.put("landlordUsername", property.getLandlordUsername());

        return ResponseEntity.ok(Result.success(result));
    }
}
