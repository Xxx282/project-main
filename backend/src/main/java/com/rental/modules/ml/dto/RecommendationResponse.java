package com.rental.modules.ml.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 个性化推荐响应 DTO
 */
@Data
public class RecommendationResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<ListingRecommendation> recommendations;
    private Integer totalCount;
    private String modelVersion;

    @Data
    public static class ListingRecommendation implements Serializable {
        private Long listingId;
        private String title;
        private Double predictedMatchScore;  // 匹配分数
        private Double predictedRent;
        private String reason;              // 推荐理由
    }
}
