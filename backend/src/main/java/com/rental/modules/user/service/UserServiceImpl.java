package com.rental.modules.user.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.ResultCode;
import com.rental.common.service.EmailService;
import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

/**
 * 用户服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    public Optional<UserEntity> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<UserEntity> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public Optional<UserEntity> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public List<UserEntity> findByRole(UserEntity.UserRole role) {
        return userRepository.findByRole(role);
    }

    @Override
    public List<UserEntity> findAll() {
        return userRepository.findAll();
    }

    @Override
    public List<UserEntity> findByIsActive(Boolean isActive) {
        return userRepository.findByIsActive(isActive);
    }

    @Override
    @Transactional
    public UserEntity updateUser(Long id, UserEntity userEntity) {
        if (!userRepository.existsById(id)) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        userEntity.setId(id);
        return userRepository.save(userEntity);
    }

    @Override
    @Transactional
    public UserEntity disableUser(Long id) {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));
        userEntity.setIsActive(false);
        log.info("禁用用户: userId={}", id);
        return userRepository.save(userEntity);
    }

    @Override
    @Transactional
    public UserEntity enableUser(Long id) {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));
        userEntity.setIsActive(true);
        log.info("启用用户: userId={}", id);
        return userRepository.save(userEntity);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public long count() {
        return userRepository.count();
    }

    @Override
    @Transactional
    public UserEntity updateProfile(Long id, String username, String phone, String realName) {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // Check if username is already taken by another user
        if (username != null && !username.equals(userEntity.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new BusinessException("用户名已被使用");
            }
            userEntity.setUsername(username);
        }

        if (phone != null) {
            userEntity.setPhone(phone);
        }

        if (realName != null) {
            userEntity.setRealName(realName);
        }

        log.info("更新用户资料: userId={}, username={}, phone={}, realName={}",
                id, username, phone, realName);
        return userRepository.save(userEntity);
    }

    @Override
    @Transactional
    public UserEntity requestEmailChange(Long id, String newEmail) {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // Check if new email is already in use (but not by this user)
        if (!newEmail.equals(userEntity.getEmail()) && userRepository.existsByEmail(newEmail)) {
            throw new BusinessException("该邮箱已被使用");
        }

        // Generate verification code
        String verificationCode = String.format("%06d", new Random().nextInt(999999));

        // Store the pending email
        userEntity.setPendingEmail(newEmail);
        userEntity.setVerificationCode(verificationCode);
        userEntity.setVerificationCodeExpiredAt(LocalDateTime.now().plusMinutes(10));

        userRepository.save(userEntity);

        // Send verification code to new email
        try {
            emailService.sendVerificationEmail(
                newEmail,
                userEntity.getUsername(),
                verificationCode
            );
            log.info("邮箱更改验证码已发送: userId={}, newEmail={}", id, newEmail);
        } catch (Exception e) {
            log.error("发送邮箱更改验证码失败: userId={}, error={}", id, e.getMessage());
            throw new BusinessException("邮件发送失败，请稍后重试");
        }

        return userEntity;
    }

    @Override
    @Transactional
    public UserEntity confirmEmailChange(Long id, String verificationCode) {
        UserEntity userEntity = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        String pendingEmail = userEntity.getPendingEmail();
        if (pendingEmail == null || pendingEmail.isBlank()) {
            throw new BusinessException("没有待确认的邮箱更改");
        }

        if (verificationCode == null || !verificationCode.equals(userEntity.getVerificationCode())) {
            throw new BusinessException("验证码错误");
        }

        if (userEntity.getVerificationCodeExpiredAt() == null ||
            userEntity.getVerificationCodeExpiredAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("验证码已过期");
        }

        // Update email
        userEntity.setEmail(pendingEmail);
        userEntity.setPendingEmail(null);
        userEntity.setVerificationCode(null);
        userEntity.setVerificationCodeExpiredAt(null);
        userEntity.setEmailVerified(true);

        log.info("邮箱更改确认成功: userId={}, newEmail={}", id, pendingEmail);
        return userRepository.save(userEntity);
    }
}
