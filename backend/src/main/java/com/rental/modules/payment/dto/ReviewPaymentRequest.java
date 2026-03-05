package com.rental.modules.payment.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

/**
 * 审核支付订单请求
 */
@Data
public class ReviewPaymentRequest {

    /**
     * 订单ID
     */
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    /**
     * 审核操作：APPROVE（同意）、REJECT（拒绝）、REFUND（退款）
     */
    @NotNull(message = "审核操作不能为空")
    private String action;

    /**
     * 审核备注
     */
    private String note;
}
