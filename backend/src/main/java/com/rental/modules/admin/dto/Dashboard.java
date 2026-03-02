package com.rental.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 数据看板 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dashboard {
    /**
     * 用户总数
     */
    private long users;

    /**
     * 房源总数
     */
    private long listings;

    /**
     * 今日咨询数
     */
    private long inquiriesToday;

    /**
     * 待审核房源数
     */
    private long pendingListings;
}
