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
    @Column(nullable = false, length = 255)
    private String address;
    @Column(name = "bedrooms", nullable = false)
    private Integer bedrooms;
    @Column(name = "bathrooms", nullable = false)
    private Double bathrooms;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal area;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    @Column(precision = 10, scale = 2)
    private BigDecimal deposit;
    @Column(name = "property_type", length = 50)
    private String propertyType;
    private Integer floor;
    @Column(name = "total_floors")
    private Integer totalFloors;
    @Column(length = 20)
    private String orientation;
    @Column(length = 50)
    private String decoration;
    @Column(columnDefinition = "JSON")
    private String facilities;
    @Lob
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.available;
    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;
    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;
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
}
