package com.rental.modules.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 签署合同请求
 */
@Data
public class SignContractRequest {

    @NotNull(message = "合同ID不能为空")
    private Long contractId;

    /**
     * 电子签名（Base64编码的PNG图片）
     */
    @NotBlank(message = "电子签名不能为空")
    private String signature;
}


