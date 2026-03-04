package com.rental.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * ML 服务配置
 */
@Configuration
public class MlServiceConfig {

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    @Value("${ml.service.timeout:30000}")
    private Integer mlServiceTimeout;

    @Bean
    public RestTemplate mlRestTemplate() {
        return new RestTemplate();
    }

    @Bean
    public String mlServiceUrl() {
        return mlServiceUrl;
    }

    @Bean
    public Integer mlServiceTimeout() {
        return mlServiceTimeout;
    }
}
