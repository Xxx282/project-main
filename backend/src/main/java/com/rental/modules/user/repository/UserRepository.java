package com.rental.modules.user.repository;

import com.rental.modules.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 用户仓储接口
 */
@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    /**
     * 根据用户名查找用户
     */
    Optional<UserEntity> findByUsername(String username);

    /**
     * 根据邮箱查找用户
     */
    Optional<UserEntity> findByEmail(String email);

    /**
     * 判断邮箱是否存在
     */
    boolean existsByEmail(String email);

    /**
     * 判断用户名是否存在
     */
    boolean existsByUsername(String username);

    /**
     * 根据角色查找用户
     */
    List<UserEntity> findByRole(UserEntity.UserRole role);

    /**
     * 根据状态查找用户
     */
    List<UserEntity> findByIsActive(Boolean isActive);

    /**
     * 根据角色和状态查找用户
     */
    List<UserEntity> findByRoleAndIsActive(UserEntity.UserRole role, Boolean isActive);
}
