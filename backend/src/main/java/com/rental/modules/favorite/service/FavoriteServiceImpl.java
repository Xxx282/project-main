package com.rental.modules.favorite.service;

import com.rental.modules.favorite.entity.Favorite;
import com.rental.modules.favorite.repository.FavoriteRepository;
import com.rental.modules.property.service.PropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * 收藏 Service 实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PropertyService propertyService;

    @Override
    @Transactional
    public Favorite addFavorite(Long userId, Long propertyId) {
        // 检查房源是否存在
        propertyService.findByIdOrThrow(propertyId);

        // 检查是否已收藏
        if (favoriteRepository.existsByUserIdAndPropertyId(userId, propertyId)) {
            log.info("用户 {} 已收藏房源 {}", userId, propertyId);
            return favoriteRepository.findByUserIdAndPropertyId(userId, propertyId).orElseThrow();
        }

        Favorite favorite = Favorite.builder()
                .userId(userId)
                .propertyId(propertyId)
                .build();

        Favorite saved = favoriteRepository.save(favorite);
        log.info("用户 {} 收藏房源 {} 成功", userId, propertyId);
        return saved;
    }

    @Override
    @Transactional
    public void removeFavorite(Long userId, Long propertyId) {
        favoriteRepository.deleteByUserIdAndPropertyId(userId, propertyId);
        log.info("用户 {} 取消收藏房源 {} 成功", userId, propertyId);
    }

    @Override
    public List<Favorite> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public boolean isFavorited(Long userId, Long propertyId) {
        return favoriteRepository.existsByUserIdAndPropertyId(userId, propertyId);
    }
}
