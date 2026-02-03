package com.rental.modules.user.controller;

import com.rental.common.Result;
import com.rental.common.ResultCode;
import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "用户信息管理")
public class UserController {
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取所有用户列表")
    public ResponseEntity<Result<List<UserEntity>>> getAllUsers() {
        List<UserEntity> users = userService.findAll();
        return ResponseEntity.ok(Result.success(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取用户信息")
    public ResponseEntity<Result<UserEntity>> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(user -> ResponseEntity.ok(Result.success(user)))
                .orElseGet(() -> ResponseEntity.ok(Result.error(ResultCode.USER_NOT_FOUND)));
    }

    @GetMapping("/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "根据角色获取用户列表")
    public ResponseEntity<Result<List<UserEntity>>> getUsersByRole(
            @PathVariable String role) {
        UserEntity.UserRole userRole = UserEntity.UserRole.valueOf(role.toLowerCase());
        List<UserEntity> users = userService.findByRole(userRole);
        return ResponseEntity.ok(Result.success(users));
    }

    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取已激活的用户列表")
    public ResponseEntity<Result<List<UserEntity>>> getActiveUsers() {
        List<UserEntity> users = userService.findByIsActive(true);
        return ResponseEntity.ok(Result.success(users));
    }

    @PutMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "禁用用户")
    public ResponseEntity<Result<UserEntity>> disableUser(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long currentUserId = (Long) request.getAttribute("userId");
        if (currentUserId.equals(id)) {
            return ResponseEntity.ok(Result.error("不能禁用当前登录用户"));
        }
        UserEntity user = userService.disableUser(id);
        return ResponseEntity.ok(Result.success(user));
    }

    @PutMapping("/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "启用用户")
    public ResponseEntity<Result<UserEntity>> enableUser(@PathVariable Long id) {
        UserEntity user = userService.enableUser(id);
        return ResponseEntity.ok(Result.success(user));
    }

    @GetMapping("/profile")
    @Operation(summary = "获取当前用户信息")
    public ResponseEntity<Result<UserEntity>> getCurrentUserProfile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return userService.findById(userId)
                .map(user -> ResponseEntity.ok(Result.success(user)))
                .orElseGet(() -> ResponseEntity.ok(Result.error(ResultCode.USER_NOT_FOUND)));
    }
}
