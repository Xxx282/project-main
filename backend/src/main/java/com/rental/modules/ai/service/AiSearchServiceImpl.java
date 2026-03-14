package com.rental.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rental.modules.ai.config.AiConfig;
import com.rental.modules.ai.dto.*;
import com.rental.modules.ai.prompt.PromptTemplates;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.service.PropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

/**
 * AI 搜索服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiSearchServiceImpl implements AiSearchService {

    private final PropertyService propertyService;
    private final RestTemplate restTemplate;
    private final AiConfig aiConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public AiSearchResponse search(AiSearchRequest request) {
        log.info("AI 搜索请求: query={}", request.getQuery());

        // 判断是否使用 LLM：Ollama（本地免费）或 OpenAI/DeepSeek（需 API Key）
        boolean useLlm = aiConfig.isEnabled()
                && (aiConfig.isOllama() || (aiConfig.getApiKey() != null && !aiConfig.getApiKey().isEmpty()));

        if (!useLlm) {
            log.info("未启用 LLM，使用本地解析");
            return searchWithLocalParser(request);
        }

        try {
            // Step 1: 调用 LLM 解析查询条件
            SearchCriteria criteria = parseQueryToCriteria(request.getQuery());
            log.info("AI 解析条件: {}", criteria);

            // Step 2: 调用 PropertyService 查询房源
            List<Property> properties = searchProperties(criteria, request.getLimit());

            // Step 3: 调用 LLM 生成总结回答
            String aiAnswer = generateAiAnswer(request.getQuery(), properties, criteria);

            // Step 4: 返回结果
            return AiSearchResponse.builder()
                    .aiAnswer(aiAnswer)
                    .properties(properties)
                    .criteria(criteria)
                    .totalFound(properties.size())
                    .build();

        } catch (Exception e) {
            log.error("AI 搜索失败，使用本地解析: {}", e.getMessage());
            return searchWithLocalParser(request);
        }
    }

    @Override
    public String chat(String question) {
        boolean useLlm = aiConfig.isEnabled()
                && (aiConfig.isOllama() || (aiConfig.getApiKey() != null && !aiConfig.getApiKey().isEmpty()));
        if (!useLlm) {
            return "AI 问答功能暂时不可用，请配置 Ollama（本地）或 AI API Key 后使用。";
        }

        try {
            String prompt = PromptTemplates.buildChatPrompt(question);
            return callLlm(prompt);
        } catch (Exception e) {
            log.error("AI 问答失败: {}", e.getMessage());
            return "抱歉，处理您的问题时出现错误，请稍后重试。";
        }
    }

    @Override
    public String suggestReplyForConsultation(String listingTitle, String listingPrice, String listingDescription, String recentMessages) {
        boolean useLlm = aiConfig.isEnabled()
                && (aiConfig.isOllama() || (aiConfig.getApiKey() != null && !aiConfig.getApiKey().isEmpty()));
        if (!useLlm) {
            return "请问方便什么时候看房？以及付款方式如何？";
        }
        try {
            String prompt = PromptTemplates.buildConsultationReplyPrompt(listingTitle, listingPrice, listingDescription, recentMessages);
            return callLlm(prompt);
        } catch (Exception e) {
            log.error("AI 回复建议失败: {}", e.getMessage());
            return "请问方便约个时间看房吗？";
        }
    }

    /**
     * 使用本地正则解析（当未配置 LLM API 时使用）
     */
    private AiSearchResponse searchWithLocalParser(AiSearchRequest request) {
        String q = request.getQuery();

        // 本地解析城市
        List<String> knownCities = Arrays.asList("Kolkata", "Mumbai", "Bangalore", "Delhi", "Chennai", "Hyderabad");
        String city = null;
        for (String c : knownCities) {
            if (q.contains(c)) {
                city = c;
                break;
            }
        }

        // 本地解析卧室数（支持中文/英文：2室、2 BHK、二室、2 bedroom、2 bed）
        Integer bedrooms = null;
        java.util.regex.Pattern roomPattern = java.util.regex.Pattern.compile(
                "(\\d)\\s*室|(\\d)\\s*BHK|(一|两|二|三|四|五|六)室|(\\d+)\\s*bed(?:room)?s?",
                java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher roomMatcher = roomPattern.matcher(q);
        if (roomMatcher.find()) {
            String g1 = roomMatcher.group(1);
            String g2 = roomMatcher.group(2);
            String g3 = roomMatcher.group(3);
            String g4 = roomMatcher.group(4);
            if (g1 != null) bedrooms = Integer.parseInt(g1);
            else if (g2 != null) bedrooms = Integer.parseInt(g2);
            else if (g3 != null) {
                switch (g3) {
                    case "一": bedrooms = 1; break;
                    case "两": case "二": bedrooms = 2; break;
                    case "三": bedrooms = 3; break;
                    case "四": bedrooms = 4; break;
                    case "五": bedrooms = 5; break;
                    case "六": bedrooms = 6; break;
                }
            } else if (g4 != null) {
                bedrooms = Integer.parseInt(g4);
            }
        }

        // 本地解析价格
        BigDecimal maxPrice = null;
        java.util.regex.Pattern wanPattern = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*万|(\\d+)\\s*万\\s*以内|(?:一万|1万)\\s*以内");
        java.util.regex.Matcher wanMatcher = wanPattern.matcher(q);
        if (wanMatcher.find()) {
            try {
                if (wanMatcher.group(1) != null) {
                    double w = Double.parseDouble(wanMatcher.group(1));
                    maxPrice = BigDecimal.valueOf((long) (w * 10000));
                } else if (wanMatcher.group(2) != null) {
                    maxPrice = BigDecimal.valueOf(Long.parseLong(wanMatcher.group(2)) * 10000L);
                } else {
                    maxPrice = BigDecimal.valueOf(10000L);
                }
            } catch (Exception ignored) {}
        }

        // 构建搜索条件
        SearchCriteria criteria = SearchCriteria.builder()
                .city(city)
                .bedrooms(bedrooms)
                .maxPrice(maxPrice)
                .build();

        // 查询房源
        List<Property> properties = searchProperties(criteria, request.getLimit());

        // 生成简单的 AI 回答
        String aiAnswer = generateLocalAnswer(request.getQuery(), properties, criteria);

        return AiSearchResponse.builder()
                .aiAnswer(aiAnswer)
                .properties(properties)
                .criteria(criteria)
                .totalFound(properties.size())
                .build();
    }

    /**
     * 生成本地回答（当未配置 LLM API 时使用）
     */
    private String generateLocalAnswer(String query, List<Property> properties, SearchCriteria criteria) {
        if (properties.isEmpty()) {
            return "抱歉，没有找到符合条件的房源。建议您放宽搜索条件，例如调整价格范围或选择其他城市。";
        }

        StringBuilder answer = new StringBuilder();
        answer.append("为您找到 ").append(properties.size()).append(" 套符合条件的房源。");

        // 计算价格范围
        BigDecimal minPrice = properties.stream()
                .map(Property::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = properties.stream()
                .map(Property::getPrice)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        answer.append("价格范围：").append(minPrice).append(" - ").append(maxPrice).append(" 元/月。");

        // 显示前几条推荐
        int showCount = Math.min(3, properties.size());
        answer.append("\n\n为您推荐以下房源：\n");
        for (int i = 0; i < showCount; i++) {
            Property p = properties.get(i);
            answer.append(i + 1).append(". ")
                    .append(p.getTitle())
                    .append(" - ").append(p.getPrice()).append(" 元/月\n");
        }

        return answer.toString();
    }

    /**
     * 调用 LLM API 解析查询条件
     */
    private SearchCriteria parseQueryToCriteria(String query) {
        String prompt = PromptTemplates.buildParsePrompt(query);
        String llmResponse = callLlm(prompt);
        return parseLlmResponseToCriteria(llmResponse);
    }

    /**
     * 解析 LLM 返回的 JSON 为 SearchCriteria
     */
    private SearchCriteria parseLlmResponseToCriteria(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);

            SearchCriteria criteria = new SearchCriteria();

            if (root.has("city") && !root.get("city").isNull()) {
                criteria.setCity(root.get("city").asText());
            }
            if (root.has("region") && !root.get("region").isNull()) {
                criteria.setRegion(root.get("region").asText());
            }
            if (root.has("bedrooms") && !root.get("bedrooms").isNull()) {
                criteria.setBedrooms(root.get("bedrooms").asInt());
            }
            if (root.has("bathrooms") && !root.get("bathrooms").isNull()) {
                criteria.setBathrooms(root.get("bathrooms").asInt());
            }
            if (root.has("minPrice") && !root.get("minPrice").isNull()) {
                criteria.setMinPrice(new BigDecimal(root.get("minPrice").asText()));
            }
            if (root.has("maxPrice") && !root.get("maxPrice").isNull()) {
                criteria.setMaxPrice(new BigDecimal(root.get("maxPrice").asText()));
            }
            if (root.has("nearSubway") && !root.get("nearSubway").isNull()) {
                criteria.setNearSubway(root.get("nearSubway").asBoolean());
            }

            return criteria;
        } catch (Exception e) {
            log.error("解析 LLM 响应失败: {}", e.getMessage());
            // 解析失败时返回空条件
            return new SearchCriteria();
        }
    }

    /**
     * 调用 LLM 生成总结回答
     */
    private String generateAiAnswer(String query, List<Property> properties, SearchCriteria criteria) {
        if (properties.isEmpty()) {
            return "抱歉，没有找到符合条件的房源。建议您放宽搜索条件，例如调整价格范围或选择其他城市。";
        }

        String prompt = PromptTemplates.buildAnswerPrompt(query, properties);
        return callLlm(prompt);
    }

    /**
     * 调用 LLM API（根据 provider 分发到 Ollama 或 OpenAI）
     */
    private String callLlm(String prompt) {
        if (aiConfig.isOllama()) {
            return callOllama(prompt);
        }
        return callOpenAiCompatible(prompt);
    }

    /**
     * 调用 Ollama 本地 LLM（免费）
     */
    private String callOllama(String prompt) {
        String url = aiConfig.getOllamaUrl();
        if (url == null || url.isEmpty()) {
            url = "http://localhost:11434";
        }
        url = url.replaceAll("/$", "") + "/api/chat";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiConfig.getModel() != null ? aiConfig.getModel() : "qwen3:4b");
        requestBody.put("messages", List.of(Map.<String, String>of("role", "user", "content", prompt)));
        requestBody.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode message = root.get("message");
            if (message != null && message.has("content")) {
                return message.get("content").asText();
            }
            return "Ollama 响应解析失败";
        } catch (Exception e) {
            log.error("调用 Ollama 失败: {}", e.getMessage());
            throw new RuntimeException("Ollama 服务调用失败，请确保已安装并启动 Ollama: " + e.getMessage());
        }
    }

    /**
     * 调用 OpenAI 兼容 API（DeepSeek/OpenAI 等）
     */
    private String callOpenAiCompatible(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + (aiConfig.getApiKey() != null ? aiConfig.getApiKey() : ""));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiConfig.getModel());
        requestBody.put("messages", new Object[]{Map.of("role", "user", "content", prompt)});
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    aiConfig.getApiUrl(),
                    request,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                return choices.get(0).get("message").get("content").asText();
            }
            return "AI 响应解析失败";
        } catch (Exception e) {
            log.error("调用 LLM API 失败: {}", e.getMessage());
            throw new RuntimeException("AI 服务调用失败: " + e.getMessage());
        }
    }

    /**
     * 根据条件搜索房源
     */
    private List<Property> searchProperties(SearchCriteria criteria, Integer limit) {
        int pageSize = limit != null ? limit : 10;

        // 使用 PropertyService 的 findByFilters 方法
        var result = propertyService.findByFilters(
                criteria.getCity(),
                criteria.getRegion(),
                criteria.getMinPrice(),
                criteria.getMaxPrice(),
                criteria.getBedrooms(),
                Property.PropertyStatus.available,
                PageRequest.of(0, pageSize)
        );

        return result.getContent();
    }
}
