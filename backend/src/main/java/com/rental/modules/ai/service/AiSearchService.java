package com.rental.modules.ai.service;

import com.rental.modules.ai.dto.AiSearchRequest;
import com.rental.modules.ai.dto.AiSearchResponse;

/**
 * AI 搜索服务接口
 */
public interface AiSearchService {

    /**
     * AI 智能搜索
     * @param request 搜索请求
     * @return 搜索结果（含 AI 回答和房源列表）
     */
    AiSearchResponse search(AiSearchRequest request);

    /**
     * AI 问答
     * @param question 用户问题
     * @return AI 回答
     */
    String chat(String question);

    /**
     * 咨询场景下为租客生成回复建议
     * @param listingTitle 房源标题
     * @param listingPrice 租金（展示用）
     * @param listingDescription 房源描述
     * @param recentMessages 最近对话内容（如 "租客: xxx\n房东: xxx"）
     * @return 建议回复文案
     */
    String suggestReplyForConsultation(String listingTitle, String listingPrice, String listingDescription, String recentMessages);
}
