package com.rental.modules.admin;

import com.rental.common.Result;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.service.PropertyService;
import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

/**
 * 管理员控制器
 */
@Slf4j
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "管理员", description = "管理员操作")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PropertyService propertyService;
    private final UserService userService;

    /**
     * 获取待审核的房源列表
     */
    @GetMapping("/listings")
    @Operation(summary = "获取待审核房源列表")
    public ResponseEntity<Result<List<Property>>> getPendingListings() {
        List<Property> listings = propertyService.findPendingListings();
        return ResponseEntity.ok(Result.success(listings));
    }

    /**
     * 审核房源
     */
    @PatchMapping("/listings/{id}")
    @Operation(summary = "审核房源", description = "通过设置状态为可租，拒绝设置状态为下架")
    public ResponseEntity<Result<Property>> reviewListing(
            @PathVariable Long id,
            @RequestParam boolean approved) {
        log.info("审核房源: id={}, approved={}", id, approved);
        Property property = propertyService.reviewListing(id, approved);
        return ResponseEntity.ok(Result.success(property));
    }

    /**
     * 获取所有用户列表
     */
    @GetMapping("/users")
    @Operation(summary = "获取所有用户列表")
    public ResponseEntity<Result<List<UserEntity>>> getAllUsers() {
        List<UserEntity> users = userService.findAll();
        return ResponseEntity.ok(Result.success(users));
    }

    /**
     * 启用/禁用用户
     */
    @PatchMapping("/users/{id}")
    @Operation(summary = "启用或禁用用户")
    public ResponseEntity<Result<UserEntity>> setUserEnabled(
            @PathVariable Long id,
            @RequestParam boolean enabled) {
        log.info("设置用户状态: id={}, enabled={}", id, enabled);
        UserEntity user = enabled ? userService.enableUser(id) : userService.disableUser(id);
        return ResponseEntity.ok(Result.success(user));
    }
}
