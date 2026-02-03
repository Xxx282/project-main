package com.rental.modules.ml.controller;

import com.rental.common.Result;
import com.rental.modules.ml.dto.PricePredictionRequest;
import com.rental.modules.ml.dto.PricePredictionResponse;
import com.rental.modules.ml.dto.RecommendationRequest;
import com.rental.modules.ml.dto.RecommendationResponse;
import com.rental.modules.ml.service.MlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * ML 服务控制器 - 预留接口供 ML 服务调用
 */
@Slf4j
@RestController
@RequestMapping("/ml")
@RequiredArgsConstructor
@Tag(name = "ML 服务", description = "机器学习服务接口")
public class MlController {

    private final MlService mlService;

    /**
     * 租金预测接口
     */
    @PostMapping("/predict")
    @PreAuthorize("hasAnyRole('TENANT', 'LANDLORD', 'ADMIN')")
    @Operation(summary = "租金预测", description = "基于房源特征预测租金价格")
    public ResponseEntity<Result<PricePredictionResponse>> predictPrice(
            @RequestBody PricePredictionRequest request) {
        log.info("收到租金预测请求: bedrooms={}, area={}, city={}",
                request.getBedrooms(), request.getArea(), request.getCity());

        PricePredictionResponse response = mlService.predictPrice(request);

        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * 个性化推荐接口
     */
    @PostMapping("/recommend")
    @PreAuthorize("hasAnyRole('TENANT', 'LANDLORD', 'ADMIN')")
    @Operation(summary = "个性化推荐", description = "基于用户偏好推荐房源")
    public ResponseEntity<Result<RecommendationResponse>> getRecommendations(
            @RequestBody RecommendationRequest request) {
        log.info("收到推荐请求: userId={}, budgetMin={}, budgetMax={}",
                request.getUserId(), request.getBudgetMin(), request.getBudgetMax());

        RecommendationResponse response = mlService.getRecommendations(request);

        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * ML 服务状态检查
     */
    @GetMapping("/status")
    @Operation(summary = "ML 服务状态", description = "检查 ML 服务是否可用")
    public ResponseEntity<Result<Map<String, Object>>> getMlServiceStatus() {
        boolean available = mlService.isMlServiceAvailable();

        return ResponseEntity.ok(Result.success(Map.of(
            "status", available ? "available" : "unavailable",
            "timestamp", System.currentTimeMillis()
        )));
    }
}
