package com.rental.modules.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * AI 搜索请求 DTO
 */
@Data
public class AiSearchRequest {

    @NotBlank(message = "查询不能为空")
    private String query;  // 用户自然语言输入，如 "浦东2000以内的一室一厅"

    private Integer limit;  // 返回结果数量限制，默认 10
}
