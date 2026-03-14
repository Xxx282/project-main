package com.rental.modules.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * AI 解析出的结构化搜索条件 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchCriteria {

    private String city;          // 城市，如 "上海"

    private String region;       // 区域，如 "浦东"

    private Integer bedrooms;    // 卧室数，如 1

    private Integer bathrooms;   // 卫生间数

    private BigDecimal minPrice; // 最低租金

    private BigDecimal maxPrice; // 最高租金

    private Integer area;        // 面积

    private Boolean nearSubway;  // 是否近地铁

    private String decoration;   // 装修类型

    private String orientation; // 朝向
}
