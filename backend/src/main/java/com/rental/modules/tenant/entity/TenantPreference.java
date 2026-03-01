package com.rental.modules.tenant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 租客偏好设置实体
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tenant_preferences")
public class TenantPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "budget")
    private Integer budget;

    @Column(name = "city", length = 50)
    private String city;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "bedrooms")
    private Integer bedrooms;

    @Column(name = "bathrooms")
    private Integer bathrooms;

    @Column(name = "min_area", precision = 10, scale = 2)
    private BigDecimal minArea;

    @Column(name = "max_area", precision = 10, scale = 2)
    private BigDecimal maxArea;

    @Column(name = "min_floors")
    private Integer minFloors;

    @Column(name = "max_floors")
    private Integer maxFloors;

    @Column(name = "orientation", length = 10)
    private String orientation;

    @Column(name = "decoration", length = 20)
    private String decoration;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
