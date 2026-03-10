package com.rental.modules.favorite.repository;

import com.rental.modules.favorite.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * 收藏 Repository
 */
@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    /**
     * 查询用户的收藏列表
     */
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 查询用户是否已收藏某房源
     */
    Optional<Favorite> findByUserIdAndPropertyId(Long userId, Long propertyId);

    /**
     * 检查用户是否已收藏某房源
     */
    boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);

    /**
     * 删除用户的某个收藏
     */
    void deleteByUserIdAndPropertyId(Long userId, Long propertyId);

    /**
     * 统计用户收藏数量
     */
    long countByUserId(Long userId);
}
