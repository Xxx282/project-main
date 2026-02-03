package com.rental.modules.ml.client;

import com.rental.modules.ml.dto.PricePredictionRequest;
import com.rental.modules.ml.dto.PricePredictionResponse;
import com.rental.modules.ml.dto.RecommendationRequest;
import com.rental.modules.ml.dto.RecommendationResponse;

/**
 * ML 服务客户端接口
 */
public interface MlServiceClient {
    /**
     * 租金价格预测
     */
    PricePredictionResponse predictPrice(PricePredictionRequest request);
    /**
     * 获取个性化房源推荐
     */
    RecommendationResponse getRecommendations(RecommendationRequest request);
    /**
     * 健康检查
     */
    boolean healthCheck();
}
