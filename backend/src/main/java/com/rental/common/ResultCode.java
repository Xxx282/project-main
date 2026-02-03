package com.rental.common;

import lombok.Getter;

/**
 * 响应状态码枚举
 */
@Getter
public enum ResultCode {

    SUCCESS(200, "操作成功"),
    ERROR(500, "操作失败"),

    // 认证相关 1001-1010
    UNAUTHORIZED(1001, "未登录或Token已过期"),
    TOKEN_INVALID(1002, "Token无效"),
    TOKEN_EXPIRED(1003, "Token已过期"),
    ACCESS_DENIED(1004, "没有操作权限"),
    USER_DISABLED(1005, "用户已被禁用"),

    // 用户相关 2001-2020
    USER_NOT_FOUND(2001, "用户不存在"),
    USER_EXISTS(2002, "用户已存在"),
    USER_PASSWORD_ERROR(2003, "密码错误"),
    USER_REGISTER_ERROR(2004, "注册失败"),
    USER_LOGIN_ERROR(2005, "登录失败"),

    // 房源相关 3001-3020
    PROPERTY_NOT_FOUND(3001, "房源不存在"),
    PROPERTY_CREATE_ERROR(3002, "房源创建失败"),
    PROPERTY_UPDATE_ERROR(3003, "房源更新失败"),
    PROPERTY_DELETE_ERROR(3004, "房源删除失败"),
    PROPERTY_STATUS_ERROR(3005, "房源状态异常"),

    // 咨询相关 4001-4020
    INQUIRY_NOT_FOUND(4001, "咨询不存在"),
    INQUIRY_CREATE_ERROR(4002, "咨询提交失败"),
    INQUIRY_REPLY_ERROR(4003, "咨询回复失败"),

    // ML 服务相关 5001-5010
    ML_SERVICE_UNAVAILABLE(5001, "ML服务不可用"),
    ML_PREDICTION_ERROR(5002, "预测服务异常");

    private final Integer code;
    private final String message;

    ResultCode(Integer code, String message) {
        this.code = code;
        this.message = message;
    }
}
