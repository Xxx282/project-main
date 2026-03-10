package com.rental.modules.ml.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 租金预测响应 DTO
 */
@Data
public class PricePredictionResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Double predictedPrice;      // 预测租金
    private String currency;            // 货币单位
    private Double confidence;          // 置信度 (0-1)
    private Double lowerBound;          // 价格下限
    private Double upperBound;          // 价格上限
    private String modelVersion;        // 模型版本
    private String algorithmName;       // 算法名称
    private List<FeatureImportance> featureImportance;  // 特征重要性
    private Long responseTimeMs;        // 响应时间

    @Data
    public static class FeatureImportance implements Serializable {
        private String feature;
        private Double importance;
    }
}
