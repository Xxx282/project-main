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

        if (preferences.getBudget() != null) {
            existing.setBudget(preferences.getBudget());
        }
        if (preferences.getRegion() != null) {
            existing.setRegion(preferences.getRegion());
        }
        if (preferences.getBedrooms() != null) {
            existing.setBedrooms(preferences.getBedrooms());
        }

        return repository.save(existing);
    }
}
