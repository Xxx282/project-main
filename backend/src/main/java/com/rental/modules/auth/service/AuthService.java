package com.rental.modules.auth.service;

import com.rental.modules.auth.dto.LoginRequest;
import com.rental.modules.auth.dto.LoginResponse;
import com.rental.modules.auth.dto.RegisterRequest;

/**
 * 认证服务接口
 */
public interface AuthService {

    /**
     * 用户登录
     */
    LoginResponse login(LoginRequest request);

    /**
     * 用户注册
     */
    LoginResponse register(RegisterRequest request);

    /**
     * 获取当前用户信息
     */
    LoginResponse.UserInfo getCurrentUserInfo(Long userId);

    /**
     * 验证邮箱是否已存在
     */
    boolean isEmailExists(String email);

    /**
     * 验证用户名是否已存在
     */
    boolean isUsernameExists(String username);
}
