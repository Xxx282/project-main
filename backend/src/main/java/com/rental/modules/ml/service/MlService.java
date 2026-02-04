package com.rental.modules.ml.service;

import com.rental.modules.ml.client.MlServiceClient;
import com.rental.modules.ml.dto.PricePredictionRequest;
import com.rental.modules.ml.dto.PricePredictionResponse;
import com.rental.modules.ml.dto.RecommendationRequest;
import com.rental.modules.ml.dto.RecommendationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * ML 服务包装层
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MlService {

    private final MlServiceClient mlServiceClient;

    /**
     * 预测房源租金
     */
    public PricePredictionResponse predictPrice(PricePredictionRequest request) {
        // 参数校验
        validatePredictionRequest(request);

        // 调用 ML 服务
        PricePredictionResponse response = mlServiceClient.predictPrice(request);

        log.debug("租金预测完成: predictedPrice={}, confidence={}",
                response.getPredictedPrice(), response.getConfidence());

        return response;
    }

    /**
     * 获取个性化推荐
     */
    public RecommendationResponse getRecommendations(RecommendationRequest request) {
        // 设置默认值
        if (request.getLimit() == null) {
            request.setLimit(10);
        }

        // 调用 ML 服务
        RecommendationResponse response = mlServiceClient.getRecommendations(request);

        log.debug("推荐完成: count={}", response.getTotalCount());

        return response;
    }

    /**
     * 检查 ML 服务状态
     */
    public boolean isMlServiceAvailable() {
        return mlServiceClient.healthCheck();
    }

    private void validatePredictionRequest(PricePredictionRequest request) {
        if (request.getBedrooms() == null) {
            throw new IllegalArgumentException("卧室数量不能为空");
        }
        if (request.getArea() == null || request.getArea() <= 0) {
            throw new IllegalArgumentException("面积必须大于0");
        }
        if (request.getCity() == null || request.getCity().isEmpty()) {
            throw new IllegalArgumentException("城市不能为空");
        }
    }
}
