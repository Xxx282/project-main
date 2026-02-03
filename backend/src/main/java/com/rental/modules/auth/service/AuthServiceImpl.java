package com.rental.modules.auth.service;

import com.rental.common.exception.BusinessException;
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

    @Value("${app.jwt.expiration}")
    private Long jwtExpiration;

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

        // 创建用户
        UserEntity userEntity = UserEntity.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserEntity.UserRole.valueOf(role))
                .phone(request.getPhone())
                .realName(request.getRealName())
                .isActive(true)
                .build();

        userEntity = userRepository.save(userEntity);
        log.info("用户注册成功: userId={}", userEntity.getId());

        // 生成 JWT Token
        String token = jwtUtil.generateToken(userEntity.getId(), userEntity.getUsername(), userEntity.getRole().name());

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
