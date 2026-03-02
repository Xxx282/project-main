package com.rental.modules.tenant.controller;

import com.rental.common.Result;
import com.rental.modules.tenant.entity.TenantPreference;
import com.rental.modules.tenant.service.TenantPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/tenant")
@RequiredArgsConstructor
@Tag(name = "租客偏好设置", description = "租客偏好设置管理")
public class TenantPreferenceController {

    private final TenantPreferenceService preferenceService;

    @GetMapping("/preferences")
    @Operation(summary = "获取租客偏好设置")
    public ResponseEntity<Result<TenantPreference>> getPreferences(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        log.info("获取用户 {} 的偏好设置", userId);
        TenantPreference preferences = preferenceService.getPreferences(userId);
        return ResponseEntity.ok(Result.success(preferences));
    }

    @PutMapping("/preferences")
    @Operation(summary = "保存租客偏好设置", description = "保存或更新租客偏好设置，支持将字段设置为 null 来清空偏好")
    public ResponseEntity<Result<TenantPreference>> savePreferences(
            @RequestBody TenantPreference preferences,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        log.info("保存用户 {} 的偏好设置: {}", userId, preferences);
        try {
            TenantPreference saved = preferenceService.savePreferences(userId, preferences);
            log.info("用户 {} 的偏好设置保存成功", userId);
            return ResponseEntity.ok(Result.success(saved));
        } catch (IllegalArgumentException e) {
            log.warn("保存用户 {} 的偏好设置失败: {}", userId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Result.error(400, e.getMessage()));
        }
    }
}
