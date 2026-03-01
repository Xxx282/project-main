package com.rental.modules.tenant.service;

import com.rental.modules.tenant.entity.TenantPreference;
import com.rental.modules.tenant.repository.TenantPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 租客偏好设置服务
 */
@Service
@RequiredArgsConstructor
public class TenantPreferenceService {

    private final TenantPreferenceRepository repository;

    /**
     * 获取用户偏好设置
     */
    public TenantPreference getPreferences(Long userId) {
        return repository.findByUserId(userId)
                .orElse(TenantPreference.builder().userId(userId).build());
    }

    /**
     * 保存用户偏好设置
     */
    @Transactional
    public TenantPreference savePreferences(Long userId, TenantPreference preferences) {
        TenantPreference existing = repository.findByUserId(userId)
                .orElseGet(() -> TenantPreference.builder().userId(userId).build());

        // 预算
        if (preferences.getBudget() != null) {
            existing.setBudget(preferences.getBudget());
        }
        // 城市
        if (preferences.getCity() != null) {
            existing.setCity(preferences.getCity());
        }
        // 区域
        if (preferences.getRegion() != null) {
            existing.setRegion(preferences.getRegion());
        }
        // 卧室数
        if (preferences.getBedrooms() != null) {
            existing.setBedrooms(preferences.getBedrooms());
        }
        // 卫生间数
        if (preferences.getBathrooms() != null) {
            existing.setBathrooms(preferences.getBathrooms());
        }
        // 最小面积
        if (preferences.getMinArea() != null) {
            existing.setMinArea(preferences.getMinArea());
        }
        // 最大面积
        if (preferences.getMaxArea() != null) {
            existing.setMaxArea(preferences.getMaxArea());
        }
        // 最低楼层
        if (preferences.getMinFloors() != null) {
            existing.setMinFloors(preferences.getMinFloors());
        }
        // 最高楼层
        if (preferences.getMaxFloors() != null) {
            existing.setMaxFloors(preferences.getMaxFloors());
        }
        // 朝向
        if (preferences.getOrientation() != null) {
            existing.setOrientation(preferences.getOrientation());
        }
        // 装修
        if (preferences.getDecoration() != null) {
            existing.setDecoration(preferences.getDecoration());
        }

        return repository.save(existing);
    }
}
