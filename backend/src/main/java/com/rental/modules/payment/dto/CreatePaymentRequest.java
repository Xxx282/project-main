package com.rental.modules.payment.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * 创建支付订单请求
 */
@Data
public class CreatePaymentRequest {

    /**
     * 收款者（房东）ID
     */
    @NotNull(message = "收款人ID不能为空")
    private Long payeeId;

    /**
     * 关联房源ID
     */
    @NotNull(message = "房源ID不能为空")
    private Long propertyId;

    /**
     * 支付类型：DEPOSIT（押金）、RENT（月租）
     */
    @NotNull(message = "支付类型不能为空")
    private String paymentType;

    /**
     * 金额
     */
    @NotNull(message = "金额不能为空")
    @Positive(message = "金额必须大于0")
    private BigDecimal amount;

    /**
     * 支付方式：WECHAT（微信）、ALIPAY（支付宝）
     */
    @NotNull(message = "支付方式不能为空")
    private String paymentChannel;
}
