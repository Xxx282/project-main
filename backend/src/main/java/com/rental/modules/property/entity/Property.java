package com.rental.modules.property.entity;

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
 * 房源实体
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "properties")
public class Property {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "landlord_id", nullable = false)
    private Long landlordId;
    @Column(nullable = false, length = 200)
    private String title;
    @Column(nullable = false, length = 50)
    private String city;
    @Column(nullable = false, length = 100)
    private String region;
    @Column(name = "bedrooms", nullable = false)
    private Integer bedrooms;
    @Column(name = "bathrooms", nullable = false)
    private Double bathrooms;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal area;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    @Column(name = "total_floors")
    private Integer totalFloors;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Orientation orientation;
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private Decoration decoration;
    @Lob
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.available;
    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    /**
     * 房源状态枚举
     */
    public enum PropertyStatus {
        available,  // 可租
        rented,      // 已租
        offline      // 下架
    }

    /**
     * 朝向枚举
     */
    public enum Orientation {
        east,   // 东
        south,  // 南
        west,   // 西
        north   // 北
    }

    /**
     * 装修情况枚举
     */
    public enum Decoration {
        rough,   // 毛坯
        simple,  // 简装
        fine,    // 精装
        luxury   // 豪华
    }
}
