package com.rental.modules.ai.dto;

import com.rental.modules.property.entity.Property;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * AI 搜索响应 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSearchResponse {

    private String aiAnswer;           // AI 总结回答

    private List<Property> properties; // 房源列表

    private SearchCriteria criteria;   // 解析出的搜索条件（用于调试/展示）

    private Integer totalFound;        // 找到的房源总数
}
