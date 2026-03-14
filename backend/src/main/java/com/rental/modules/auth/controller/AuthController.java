package com.rental.modules.auth.controller;

import com.rental.common.Result;
import com.rental.modules.auth.dto.LoginRequest;
import com.rental.modules.auth.dto.LoginResponse;
import com.rental.modules.auth.dto.RegisterRequest;
import com.rental.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证控制器
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "认证管理", description = "用户登录、注册、Token管理")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "用户登录")
    public ResponseEntity<Result<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        log.info("登录请求: usernameOrEmail={}", request.getUsernameOrEmail());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(Result.success(response));
    }

    @PostMapping("/register")
    @Operation(summary = "用户注册")
    public ResponseEntity<Result<LoginResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        log.info("注册请求: email={}, username={}, role={}",
                request.getEmail(), request.getUsername(), request.getRole());
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Result.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息")
    public ResponseEntity<Result<LoginResponse.UserInfo>> getCurrentUserInfo(
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        log.info("获取当前用户信息: userId={}", userId);
        LoginResponse.UserInfo userInfo = authService.getCurrentUserInfo(userId);
        return ResponseEntity.ok(Result.success(userInfo));
    }

    @GetMapping("/check-email")
    @Operation(summary = "检查邮箱是否已注册")
    public ResponseEntity<Result<Map<String, Boolean>>> checkEmailExists(
            @RequestParam String email) {
        boolean exists = authService.isEmailExists(email);
        return ResponseEntity.ok(Result.success(Map.of("exists", exists)));
    }

    @GetMapping("/check-username")
    @Operation(summary = "检查用户名是否已存在")
    public ResponseEntity<Result<Map<String, Boolean>>> checkUsernameExists(
            @RequestParam String username) {
        boolean exists = authService.isUsernameExists(username);
        return ResponseEntity.ok(Result.success(Map.of("exists", exists)));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "忘记密码：发送重置链接到邮箱")
    public ResponseEntity<Result<Map<String, String>>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Result.error("请填写邮箱"));
        }
        authService.requestPasswordReset(email.trim());
        return ResponseEntity.ok(Result.success(Map.of("message", "重置链接已发送至您的邮箱，请查收")));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "根据链接中的 token 重置密码")
    public ResponseEntity<Result<Map<String, String>>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (email == null || email.isBlank() || token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            return ResponseEntity.badRequest().body(Result.error("请填写完整信息"));
        }
        authService.resetPassword(email.trim(), token.trim(), newPassword);
        return ResponseEntity.ok(Result.success(Map.of("message", "密码已重置，请使用新密码登录")));
    }
}
