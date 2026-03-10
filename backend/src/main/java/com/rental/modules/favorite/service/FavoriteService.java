package com.rental.modules.favorite.service;

import com.rental.modules.favorite.entity.Favorite;
import java.util.List;

/**
 * 收藏 Service 接口
 */
public interface FavoriteService {

    /**
     * 添加收藏
     */
    Favorite addFavorite(Long userId, Long propertyId);

    /**
     * 取消收藏
     */
    void removeFavorite(Long userId, Long propertyId);

    /**
     * 获取用户的收藏列表
     */
    List<Favorite> getUserFavorites(Long userId);

    /**
     * 检查是否已收藏
     */
    boolean isFavorited(Long userId, Long propertyId);
}
