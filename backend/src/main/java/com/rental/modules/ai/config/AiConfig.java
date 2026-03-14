package com.rental.modules.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * AI 服务配置类
 * 支持：ollama（本地免费）、openai/deepseek（云 API，需付费）
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.ai")
public class AiConfig {

    /**
     * 服务类型：ollama（本地免费）| openai（云 API）
     */
    private String provider = "ollama";

    private Api api = new Api();

    @Data
    public static class Api {
        private String key;
        private String url = "https://api.deepseek.com/v1/chat/completions";
    }

    /**
     * Ollama 服务地址（provider=ollama 时用）
     */
    private String ollamaUrl = "http://localhost:11434";

    /**
     * AI 模型名称（ollama 如 qwen3:8b/gemma3:4b，openai 如 gpt-4）
     */
    private String model = "qwen3:4b";

    /**
     * 是否启用 AI 功能
     */
    private boolean enabled = true;

    /**
     * 是否使用 Ollama（本地免费 LLM）
     */
    public boolean isOllama() {
        return "ollama".equalsIgnoreCase(provider);
    }

    public String getApiKey() {
        return api != null ? api.getKey() : null;
    }

    public String getApiUrl() {
        return api != null && api.getUrl() != null ? api.getUrl() : "https://api.deepseek.com/v1/chat/completions";
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
