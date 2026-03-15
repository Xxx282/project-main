package com.rental.modules.region.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 区域实体 - 存储区域的中英文名称和经纬度坐标
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "regions")
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 区域名称（中文）
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 区域英文名
     */
    @Column(name = "name_en", length = 100)
    private String nameEn;

    /**
     * 所属城市（中文）
     */
    @Column(nullable = false, length = 50)
    private String city;

    /**
     * 所属城市英文名
     */
    @Column(name = "city_en", length = 50)
    private String cityEn;

    /**
     * 经度
     */
    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    /**
     * 纬度
     */
    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;
}
