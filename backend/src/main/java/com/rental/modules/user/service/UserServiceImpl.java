package com.rental.modules.user.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.ResultCode;
import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * 用户服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;

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
}
