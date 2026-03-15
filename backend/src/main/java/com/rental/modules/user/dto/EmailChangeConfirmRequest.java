package com.rental.modules.user.dto;

import lombok.Data;

/**
 * 邮箱更改确认请求
 */
@Data
public class EmailChangeConfirmRequest {
    private String newEmail;
    private String verificationCode;
}
