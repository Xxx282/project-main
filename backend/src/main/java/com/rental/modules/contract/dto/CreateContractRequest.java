package com.rental.modules.contract.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 创建合同请求
 */
@Data
public class CreateContractRequest {

    @NotNull(message = "房东ID不能为空")
    private Long landlordId;

    @NotNull(message = "房源ID不能为空")
    private Long propertyId;

    @NotNull(message = "月租金不能为空")
    @Positive(message = "月租金必须大于0")
    private BigDecimal monthlyRent;

    @NotNull(message = "押金不能为空")
    @Positive(message = "押金必须大于0")
    private BigDecimal deposit;

    @NotNull(message = "租期开始日期不能为空")
    private LocalDate leaseStart;

    @NotNull(message = "租期结束日期不能为空")
    private LocalDate leaseEnd;
}


