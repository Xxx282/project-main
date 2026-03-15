package com.rental.modules.user.dto;

import lombok.Data;

/**
 * 邮箱更改请求
 */
@Data
public class EmailChangeRequest {
    private String newEmail;
}
