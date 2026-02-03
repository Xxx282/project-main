package com.rental.modules.user.service;

import com.rental.modules.user.entity.UserEntity;
import java.util.List;
import java.util.Optional;

/**
 * 用户服务接口
 */
public interface UserService {
    Optional<UserEntity> findById(Long id);
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByEmail(String email);
    List<UserEntity> findByRole(UserEntity.UserRole role);
    List<UserEntity> findAll();
    List<UserEntity> findByIsActive(Boolean isActive);
    UserEntity updateUser(Long id, UserEntity userEntity);
    UserEntity disableUser(Long id);
    UserEntity enableUser(Long id);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
