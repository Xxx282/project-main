package com.rental.modules.favorite.controller;

import com.rental.modules.favorite.entity.Favorite;
import com.rental.modules.favorite.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 收藏 Controller
 */
@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * 获取当前用户的收藏列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyFavorites(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<Favorite> favorites = favoriteService.getUserFavorites(userId);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "获取成功");
        result.put("success", true);
        result.put("timestamp", System.currentTimeMillis());
        Map<String, Object> data = new HashMap<>();
        data.put("favorites", favorites);
        data.put("total", favorites.size());
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    /**
     * 添加收藏
     */
    @PostMapping("/{propertyId}")
    public ResponseEntity<Map<String, Object>> addFavorite(
            @PathVariable Long propertyId,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Favorite favorite = favoriteService.addFavorite(userId, propertyId);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "收藏成功");
        result.put("success", true);
        result.put("timestamp", System.currentTimeMillis());
        Map<String, Object> data = new HashMap<>();
        data.put("message", "收藏成功");
        data.put("favorite", favorite);
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    /**
     * 取消收藏
     */
    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @PathVariable Long propertyId,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        favoriteService.removeFavorite(userId, propertyId);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "取消收藏成功");
        result.put("success", true);
        result.put("timestamp", System.currentTimeMillis());
        Map<String, Object> data = new HashMap<>();
        data.put("message", "取消收藏成功");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    /**
     * 检查是否已收藏
     */
    @GetMapping("/check/{propertyId}")
    public ResponseEntity<Map<String, Object>> checkFavorite(
            @PathVariable Long propertyId,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        boolean favorited = favoriteService.isFavorited(userId, propertyId);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "查询成功");
        result.put("success", true);
        result.put("timestamp", System.currentTimeMillis());
        Map<String, Object> data = new HashMap<>();
        data.put("propertyId", propertyId);
        data.put("favorited", favorited);
        result.put("data", data);

        return ResponseEntity.ok(result);
    }
}
