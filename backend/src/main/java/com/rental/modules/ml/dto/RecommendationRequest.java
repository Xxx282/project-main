package com.rental.modules.ml.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 个性化推荐请求 DTO
 */
@Data
public class RecommendationRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long userId;                // 用户ID
    private Integer budgetMin;          // 预算下限
    private Integer budgetMax;          // 预算上限
    private List<String> preferredRegions;  // 偏好区域
    private Integer minBedrooms;        // 最少卧室数
    private Integer maxBedrooms;        // 最多卧室数
    private Double minArea;             // 最小面积
    private Double maxArea;             // 最大面积
    private List<String> propertyTypes; // 房屋类型偏好
    private Integer limit;             // 返回数量限制
    private List<Long> excludeListingIds; // 排除的房源ID
}
