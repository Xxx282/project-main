package com.rental.modules.auth.controller;

import com.rental.common.Result;
import com.rental.common.exception.BusinessException;
import com.rental.common.service.EmailService;
import com.rental.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

/**
 * 邮箱验证控制器
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "邮箱验证", description = "邮箱验证码验证与重新发送")
public class VerificationController {

    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * 验证邮箱验证码
     */
    @PostMapping("/verify-email")
    @Operation(summary = "验证邮箱验证码")
    public ResponseEntity<Result<Map<String, String>>> verifyEmail(@RequestBody VerifyEmailRequest request) {
        log.info("邮箱验证请求: email={}", request.getEmail());

        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    // 验证码为空或未获取过
                    if (user.getVerificationCode() == null || user.getVerificationCode().isEmpty()) {
                        throw new BusinessException("请先获取验证码");
                    }
                    // 验证码已过期
                    if (user.getVerificationCodeExpiredAt() != null && 
                        user.getVerificationCodeExpiredAt().isBefore(LocalDateTime.now())) {
                        throw new BusinessException("验证码已过期，请重新获取");
                    }
                    // 验证码不匹配
                    if (!user.getVerificationCode().equals(request.getCode())) {
                        throw new BusinessException("验证码错误");
                    }

                    // 验证成功，更新用户状态
                    user.setEmailVerified(true);
                    user.setIsActive(true);
                    user.setVerificationCode(null); // 清除验证码
                    user.setVerificationCodeExpiredAt(null);
                    userRepository.save(user);

                    log.info("邮箱验证成功: email={}", request.getEmail());
                    return ResponseEntity.ok(Result.success(Map.of("message", "邮箱验证成功，请登录")));
                })
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    /**
     * 重新发送验证码
     */
    @PostMapping("/resend-code")
    @Operation(summary = "重新发送验证码")
    public ResponseEntity<Result<Map<String, String>>> resendCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        log.info("重新发送验证码: email={}", email);

        return userRepository.findByEmail(email)
                .map(user -> {
                    if (user.getEmailVerified() != null && user.getEmailVerified()) {
                        throw new BusinessException("该邮箱已验证，无需重新发送");
                    }
                    // 生成新验证码
                    String code = generateVerificationCode();
                    user.setVerificationCode(code);
                    user.setVerificationCodeExpiredAt(LocalDateTime.now().plusMinutes(10));
                    userRepository.save(user);

                    // 重新发送邮件
                    try {
                        emailService.sendVerificationEmail(email, user.getUsername(), code);
                        log.info("验证码重新发送成功: email={}", email);
                    } catch (Exception e) {
                        log.error("验证码重新发送失败: email={}, error={}", email, e.getMessage());
                        throw new BusinessException("邮件发送失败，请稍后重试");
                    }

                    return ResponseEntity.ok(Result.success(Map.of("message", "验证码已重新发送")));
                })
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    /**
     * 检查邮箱是否已验证
     */
    @GetMapping("/check-email-verified")
    @Operation(summary = "检查邮箱是否已验证")
    public ResponseEntity<Result<Map<String, Boolean>>> checkEmailVerified(@RequestParam String email) {
        boolean verified = userRepository.findByEmail(email)
                .map(user -> user.getEmailVerified() != null && user.getEmailVerified())
                .orElse(false);
        return ResponseEntity.ok(Result.success(Map.of("verified", verified)));
    }

    /**
     * 生成6位数字验证码
     */
    private String generateVerificationCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    /**
     * 验证请求体
     */
    @Data
    public static class VerifyEmailRequest {
        private String email;
        private String code;
    }
}
