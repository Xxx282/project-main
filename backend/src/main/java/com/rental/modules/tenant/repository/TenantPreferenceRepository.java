package com.rental.modules.tenant.repository;

import com.rental.modules.tenant.entity.TenantPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TenantPreferenceRepository extends JpaRepository<TenantPreference, Long> {
    Optional<TenantPreference> findByUserId(Long userId);
}
