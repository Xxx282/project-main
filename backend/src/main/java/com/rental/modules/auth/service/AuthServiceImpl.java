package com.rental.modules.auth.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.service.EmailService;
import com.rental.common.util.JwtUtil;
import com.rental.modules.auth.dto.LoginRequest;
import com.rental.modules.auth.dto.LoginResponse;
import com.rental.modules.auth.dto.RegisterRequest;
import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

/**
 * 认证服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.jwt.expiration}")
    private Long jwtExpiration;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Override
    public LoginResponse login(LoginRequest request) {
        String usernameOrEmail = request.getUsernameOrEmail();
        log.info("用户登录: usernameOrEmail={}", usernameOrEmail);

        try {
            // 认证
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(usernameOrEmail, request.getPassword())
            );

            // 获取认证后的用户（支持用户名或邮箱查找）
            UserEntity userEntity = findUserByUsernameOrEmail(usernameOrEmail);

            // 生成 JWT Token
            String token = jwtUtil.generateToken(userEntity.getId(), userEntity.getUsername(), userEntity.getRole().name());

            log.info("用户登录成功: userId={}", userEntity.getId());

            return LoginResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .expiresIn(jwtExpiration / 1000)
                    .user(LoginResponse.UserInfo.builder()
                            .id(userEntity.getId())
                            .username(userEntity.getUsername())
                            .email(userEntity.getEmail())
                            .role(userEntity.getRole().name())
                            .build())
                    .build();

        } catch (AuthenticationException e) {
            log.error("用户登录失败: usernameOrEmail={}, reason={}", usernameOrEmail, e.getMessage());
            throw new BusinessException("账号或密码错误");
        }
    }

    /**
     * 通过用户名或邮箱查找用户
     */
    private UserEntity findUserByUsernameOrEmail(String usernameOrEmail) {
        // 先按用户名查找
        return userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> {
                    // 如果用户名没找到，按邮箱查找
                    return userRepository.findByEmail(usernameOrEmail)
                            .orElseThrow(() -> new BusinessException("用户不存在"));
                });
    }

    @Override
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        log.info("用户注册: email={}, username={}, role={}", request.getEmail(), request.getUsername(), request.getRole());

        // 验证邮箱是否已存在
        if (isEmailExists(request.getEmail())) {
            throw new BusinessException("该邮箱已被注册");
        }

        // 验证用户名是否已存在
        if (isUsernameExists(request.getUsername())) {
            throw new BusinessException("用户名已被使用");
        }

        // 验证角色
        String role = validateAndNormalizeRole(request.getRole());

        // 生成验证码
        String verificationCode = generateVerificationCode();

        // 创建用户（默认未激活，需要邮箱验证）
        UserEntity userEntity = UserEntity.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserEntity.UserRole.valueOf(role))
                .phone(request.getPhone())
                .realName(request.getRealName())
                .isActive(false)  // 需要邮箱验证后才能登录
                .emailVerified(false)
                .verificationCode(verificationCode)
                .verificationCodeExpiredAt(LocalDateTime.now().plusMinutes(10))
                .build();

        userEntity = userRepository.save(userEntity);
        log.info("用户注册成功(待验证): userId={}", userEntity.getId());

        // 发送验证邮件
        try {
            emailService.sendVerificationEmail(
                userEntity.getEmail(), 
                userEntity.getUsername(), 
                verificationCode
            );
            log.info("验证邮件已发送: email={}", userEntity.getEmail());
        } catch (Exception e) {
            log.warn("发送验证邮件失败，但用户已创建: userId={}, error={}", userEntity.getId(), e.getMessage());
        }

        // 返回注册成功信息（不返回 token，需要先验证邮箱）
        return LoginResponse.builder()
                .message("注册成功，请前往邮箱验证后登录")
                .user(LoginResponse.UserInfo.builder()
                        .id(userEntity.getId())
                        .username(userEntity.getUsername())
                        .email(userEntity.getEmail())
                        .role(userEntity.getRole().name())
                        .build())
                .build();
    }

    /**
     * 生成6位数字验证码
     */
    private String generateVerificationCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    @Override
    public LoginResponse.UserInfo getCurrentUserInfo(Long userId) {
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        UserEntity userEntity = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        return LoginResponse.UserInfo.builder()
                .id(userEntity.getId())
                .username(userEntity.getUsername())
                .email(userEntity.getEmail())
                .role(userEntity.getRole().name())
                .build();
    }

    @Override
    public boolean isEmailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean isUsernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("该邮箱未注册"));
        String token = UUID.randomUUID().toString().replace("-", "");
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiredAt(LocalDateTime.now().plusHours(1));
        userRepository.save(user);
        String resetLink = baseUrl + "/reset-password?token=" + token + "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8);
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetLink);
        log.info("密码重置邮件已发送: email={}", email);
    }

    @Override
    @Transactional
    public void resetPassword(String email, String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("重置链接无效");
        }
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        if (user.getPasswordResetToken() == null || !user.getPasswordResetToken().equals(token)) {
            throw new BusinessException("重置链接无效或已失效");
        }
        if (user.getPasswordResetTokenExpiredAt() == null || user.getPasswordResetTokenExpiredAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("重置链接已过期，请重新申请");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiredAt(null);
        userRepository.save(user);
        log.info("密码重置成功: email={}", email);
    }

    /**
     * 验证并标准化角色
     */
    private String validateAndNormalizeRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            return "tenant"; // 默认角色
        }

        String normalizedRole = role.toLowerCase().trim();
        if (!normalizedRole.equals("tenant") && !normalizedRole.equals("landlord") && !normalizedRole.equals("admin")) {
            throw new BusinessException("无效的角色类型");
        }
        return normalizedRole;
    }
}
