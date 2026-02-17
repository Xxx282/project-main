package com.rental.modules.ml.client;

import com.rental.modules.ml.dto.PricePredictionRequest;
import com.rental.modules.ml.dto.PricePredictionResponse;
import com.rental.modules.ml.dto.RecommendationRequest;
import com.rental.modules.ml.dto.RecommendationResponse;
import com.rental.modules.ml.exception.MlServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import java.util.List;

/**
 * ML 服务客户端实现
 */
@Slf4j
@Component
public class MlServiceClientImpl implements MlServiceClient {

    private final RestTemplate mlRestTemplate;
    private final String mlServiceUrl;

    private static final String PREDICT_ENDPOINT = "/api/v1/predict";
    private static final String RECOMMEND_ENDPOINT = "/api/v1/recommend";
    private static final String HEALTH_ENDPOINT = "/api/v1/health";

    public MlServiceClientImpl(
            RestTemplate mlRestTemplate,
            @Qualifier("mlServiceUrl") String mlServiceUrl) {
        this.mlRestTemplate = mlRestTemplate;
        this.mlServiceUrl = mlServiceUrl;
    }

    @Override
    public PricePredictionResponse predictPrice(PricePredictionRequest request) {
        String url = mlServiceUrl + PREDICT_ENDPOINT;
        log.info("调用 ML 预测服务: {}", url);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PricePredictionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<PricePredictionResponse> response =
                mlRestTemplate.postForEntity(url, entity, PricePredictionResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("预测成功: predictedPrice={}", response.getBody().getPredictedPrice());
                return response.getBody();
            }

            throw new MlServiceException("ML 服务返回异常状态: " + response.getStatusCode());

        } catch (RestClientException e) {
            log.error("ML 预测服务调用失败: {}", e.getMessage());
            throw new MlServiceException("ML 服务不可用: " + e.getMessage());
        }
    }

    @Override
    public RecommendationResponse getRecommendations(RecommendationRequest request) {
        String url = mlServiceUrl + RECOMMEND_ENDPOINT;
        log.info("调用 ML 推荐服务: {}", url);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<RecommendationRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<RecommendationResponse> response =
                mlRestTemplate.postForEntity(url, entity, RecommendationResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("推荐成功: count={}", response.getBody().getTotalCount());
                return response.getBody();
            }

            throw new MlServiceException("ML 服务返回异常状态: " + response.getStatusCode());

        } catch (RestClientException e) {
            log.error("ML 推荐服务调用失败: {}", e.getMessage());
            throw new MlServiceException("ML 服务不可用: " + e.getMessage());
        }
    }

    @Override
    public boolean healthCheck() {
        String url = mlServiceUrl + HEALTH_ENDPOINT;
        log.info("ML 服务健康检查: {}", url);

        try {
            ResponseEntity<String> response = mlRestTemplate.getForEntity(url, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("ML 服务健康检查失败: {}", e.getMessage());
            return false;
        }
    }
}
