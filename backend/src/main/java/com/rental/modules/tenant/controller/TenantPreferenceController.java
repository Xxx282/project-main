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
    @Operation(summary = "保存租客偏好设置")
    public ResponseEntity<Result<TenantPreference>> savePreferences(
            @RequestBody TenantPreference preferences,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        log.info("保存用户 {} 的偏好设置: {}", userId, preferences);
        TenantPreference saved = preferenceService.savePreferences(userId, preferences);
        return ResponseEntity.ok(Result.success(saved));
    }
}
