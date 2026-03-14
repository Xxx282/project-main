package com.rental.modules.ai.controller;

import com.rental.common.Result;
import com.rental.modules.ai.dto.AiSearchRequest;
import com.rental.modules.ai.dto.AiSearchResponse;
import com.rental.modules.ai.service.AiSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI 服务控制器
 */
@Slf4j
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI 服务", description = "AI 智能搜索与问答")
public class AiController {

    private final AiSearchService aiSearchService;

    /**
     * AI 智能搜索
     * POST /api/ai/search
     */
    @PostMapping("/search")
    @Operation(summary = "AI 智能搜索", description = "输入自然语言，AI 解析条件并搜索房源")
    public ResponseEntity<Result<AiSearchResponse>> aiSearch(
            @Valid @RequestBody AiSearchRequest request) {
        
        log.info("AI 搜索请求: query={}", request.getQuery());
        
        AiSearchResponse response = aiSearchService.search(request);
        
        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * AI 问答
     * POST /api/ai/chat
     */
    @PostMapping("/chat")
    @Operation(summary = "AI 问答", description = "关于房源的智能问答")
    public ResponseEntity<Result<String>> aiChat(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        log.info("AI 问答请求: question={}", question);
        
        String answer = aiSearchService.chat(question);
        
        return ResponseEntity.ok(Result.success(answer));
    }

    /**
     * 咨询场景下为租客生成回复建议
     * POST /api/ai/chat/suggest
     */
    @PostMapping("/chat/suggest")
    @Operation(summary = "AI 智能回复建议", description = "根据当前咨询对话为租客生成一条回复建议")
    public ResponseEntity<Result<String>> suggestReply(@RequestBody Map<String, String> request) {
        String listingTitle = request.get("listingTitle");
        String listingPrice = request.get("listingPrice");
        String listingDescription = request.get("listingDescription");
        String recentMessages = request.get("recentMessages");
        log.info("AI 回复建议: listing={}", listingTitle);

        String suggestion = aiSearchService.suggestReplyForConsultation(listingTitle, listingPrice, listingDescription, recentMessages);

        return ResponseEntity.ok(Result.success(suggestion));
    }
}
