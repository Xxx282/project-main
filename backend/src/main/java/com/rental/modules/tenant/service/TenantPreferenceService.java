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
     * 如果请求中包含某个字段（即使是 null），就更新它，允许清空字段
     * 前端会发送完整的偏好对象，包括要清空的字段（null值）
     */
    @Transactional
    public TenantPreference savePreferences(Long userId, TenantPreference preferences) {
        if (preferences == null) {
            throw new IllegalArgumentException("偏好设置不能为空");
        }

        TenantPreference existing = repository.findByUserId(userId)
                .orElseGet(() -> TenantPreference.builder().userId(userId).build());

        // 直接更新所有字段，允许设置为 null 来清空偏好
        // 前端会确保发送完整的偏好对象，包括要清空的字段（null值）
        existing.setBudget(preferences.getBudget());
        existing.setCity(preferences.getCity());
        existing.setRegion(preferences.getRegion());
        existing.setBedrooms(preferences.getBedrooms());
        existing.setBathrooms(preferences.getBathrooms());
        existing.setMinArea(preferences.getMinArea());
        existing.setMaxArea(preferences.getMaxArea());
        existing.setMinFloors(preferences.getMinFloors());
        existing.setMaxFloors(preferences.getMaxFloors());
        existing.setOrientation(preferences.getOrientation());
        existing.setDecoration(preferences.getDecoration());

        return repository.save(existing);
    }
}
