package com.rental.modules.user.dto;

import lombok.Data;

/**
 * 更新用户资料请求
 */
@Data
public class UpdateProfileRequest {
    private String username;
    private String phone;
    private String realName;
}
