package com.rental.modules.property.controller;

import com.rental.common.Result;
import com.rental.common.ResultCode;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.service.PropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 房源控制器
 */
@Slf4j
@RestController
@RequestMapping("/listings")
@RequiredArgsConstructor
@Tag(name = "房源管理", description = "房源信息管理")
public class PropertyController {

    private final PropertyService propertyService;

    /**
     * 获取房源列表（支持筛选）
     */
    @GetMapping
    @Operation(summary = "获取房源列表", description = "支持城市、区域、价格、卧室数等条件筛选")
    public ResponseEntity<Result<List<Property>>> getListings(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) BigDecimal minRent,
            @RequestParam(required = false) BigDecimal maxRent,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Property.PropertyStatus propertyStatus = null;
        if (status != null && !status.isEmpty()) {
            propertyStatus = Property.PropertyStatus.valueOf(status);
        }

        Page<Property> listings = propertyService.findByFilters(
                city, region, minRent, maxRent, bedrooms, propertyStatus, pageable);

        return ResponseEntity.ok(Result.success(listings.getContent()));
    }

    /**
     * 获取房源详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取房源详情")
    public ResponseEntity<Result<Property>> getListingById(
            @PathVariable Long id,
            HttpServletRequest request) {
        log.info("查看房源详情: id={}", id);
        // 增加浏览次数
        propertyService.incrementViewCount(id);
        return propertyService.findById(id)
                .map(property -> ResponseEntity.ok(Result.success(property)))
                .orElseGet(() -> ResponseEntity.ok(Result.error(ResultCode.PROPERTY_NOT_FOUND)));
    }

    /**
     * 获取当前房东的房源列表
     */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('LANDLORD')")
    @Operation(summary = "获取我的房源列表")
    public ResponseEntity<Result<List<Property>>> getMyListings(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<Property> listings = propertyService.findByLandlordId(userId);
        return ResponseEntity.ok(Result.success(listings));
    }

    /**
     * 创建房源
     */
    @PostMapping
    @PreAuthorize("hasRole('LANDLORD')")
    @Operation(summary = "创建房源")
    public ResponseEntity<Result<Property>> createListing(
            @Valid @RequestBody CreatePropertyRequest request,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("创建房源: landlordId={}, title={}", userId, request.getTitle());

        Property property = Property.builder()
                .landlordId(userId)
                .title(request.getTitle())
                .city(request.getCity())
                .region(request.getRegion())
                .bedrooms(request.getBedrooms())
                .bathrooms(request.getBathrooms())
                .area(request.getArea())
                .price(request.getPrice())
                .totalFloors(request.getTotalFloors())
                .orientation(request.getOrientation() != null ? Property.Orientation.valueOf(request.getOrientation()) : null)
                .decoration(request.getDecoration() != null ? Property.Decoration.valueOf(request.getDecoration()) : null)
                .description(request.getDescription())
                .status(Property.PropertyStatus.available)
                .build();

        Property saved = propertyService.createProperty(property);
        return ResponseEntity.status(HttpStatus.CREATED).body(Result.success(saved));
    }

    /**
     * 更新房源
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LANDLORD')")
    @Operation(summary = "更新房源")
    public ResponseEntity<Result<Property>> updateListing(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePropertyRequest request,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("更新房源: id={}, userId={}", id, userId);

        Property existing = propertyService.findByIdOrThrow(id);
        if (!existing.getLandlordId().equals(userId)) {
            return ResponseEntity.ok(Result.error("无权操作此房源"));
        }

        // 更新字段
        existing.setTitle(request.getTitle());
        existing.setCity(request.getCity());
        existing.setRegion(request.getRegion());
        existing.setBedrooms(request.getBedrooms());
        existing.setBathrooms(request.getBathrooms());
        existing.setArea(request.getArea());
        existing.setPrice(request.getPrice());
        existing.setTotalFloors(request.getTotalFloors());
        if (request.getOrientation() != null) {
            existing.setOrientation(Property.Orientation.valueOf(request.getOrientation()));
        }
        if (request.getDecoration() != null) {
            existing.setDecoration(Property.Decoration.valueOf(request.getDecoration()));
        }
        existing.setDescription(request.getDescription());

        Property saved = propertyService.updateProperty(existing);
        return ResponseEntity.ok(Result.success(saved));
    }

    /**
     * 删除房源
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LANDLORD')")
    @Operation(summary = "删除房源")
    public ResponseEntity<Result<Void>> deleteListing(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("删除房源: id={}, userId={}", id, userId);

        Property property = propertyService.findByIdOrThrow(id);
        if (!property.getLandlordId().equals(userId)) {
            return ResponseEntity.ok(Result.error("无权操作此房源"));
        }

        propertyService.deleteProperty(id);
        return ResponseEntity.ok(Result.success());
    }

    /**
     * 更新房源状态
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('LANDLORD')")
    @Operation(summary = "更新房源状态")
    public ResponseEntity<Result<Property>> updateListingStatus(
            @PathVariable Long id,
            @RequestParam String status,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");

        Property property = propertyService.findByIdOrThrow(id);
        if (!property.getLandlordId().equals(userId)) {
            return ResponseEntity.ok(Result.error("无权操作此房源"));
        }

        Property.PropertyStatus newStatus = Property.PropertyStatus.valueOf(status);
        Property saved = propertyService.updateStatus(id, newStatus);
        return ResponseEntity.ok(Result.success(saved));
    }

    /**
     * 获取可租房源列表
     */
    @GetMapping("/available")
    @Operation(summary = "获取可租房源列表")
    public ResponseEntity<Result<List<Property>>> getAvailableListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Property> listings = propertyService.findByStatus(Property.PropertyStatus.available, pageable);
        return ResponseEntity.ok(Result.success(listings.getContent()));
    }

    /**
     * 请求类
     */
    @Data
    public static class CreatePropertyRequest {
        private String title;
        private String city;
        private String region;
        private Integer bedrooms;
        private Double bathrooms;
        private BigDecimal area;
        private BigDecimal price;
        private Integer totalFloors;
        private String orientation;
        private String decoration;
        private String description;
    }

    @Data
    public static class UpdatePropertyRequest {
        private String title;
        private String city;
        private String region;
        private Integer bedrooms;
        private Double bathrooms;
        private BigDecimal area;
        private BigDecimal price;
        private Integer totalFloors;
        private String orientation;
        private String decoration;
        private String description;
    }
}
