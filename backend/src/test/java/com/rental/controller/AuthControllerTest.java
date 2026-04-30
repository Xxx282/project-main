package com.rental.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rental.modules.auth.dto.LoginRequest;
import com.rental.modules.auth.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 认证模块 API 测试（04-开发与质量保证 - 测试用例/报告用）
 * 运行方式：在 backend 目录执行 mvn test -Dtest=AuthControllerTest
 * 结果截图：对 IDE 测试结果或 target/surefire-reports 报告截图
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("TC-AUTH-001: 用户登录-正确账号密码（先注册再登录）")
    void login_withValidCredentials_returns200AndToken() throws Exception {
        String email = "login_test_" + System.currentTimeMillis() + "@example.com";
        String username = "login_test_" + System.currentTimeMillis();
        String password = "TestPassword123";
        RegisterRequest reg = new RegisterRequest();
        reg.setEmail(email);
        reg.setUsername(username);
        reg.setPassword(password);
        reg.setRole("TENANT");
        reg.setPhone("13800138000");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail(email);
        request.setPassword(password);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.user").exists());
    }

    @Test
    @DisplayName("TC-AUTH-002: 用户登录-错误密码返回4xx")
    void login_withWrongPassword_returns4xx() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsernameOrEmail("test@example.com");
        request.setPassword("WrongPassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-AUTH-003: 用户注册-合法参数返回201")
    void register_withValidData_returns201() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser_" + System.currentTimeMillis() + "@example.com");
        request.setUsername("newuser_" + System.currentTimeMillis());
        request.setPassword("TestPassword123");
        request.setRole("TENANT");
        request.setPhone("13800138000");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.user").exists());
    }

    @Test
    @DisplayName("TC-AUTH-004: 检查邮箱是否已注册")
    void checkEmail_exists_returns200WithExists() throws Exception {
        mockMvc.perform(get("/api/auth/check-email").param("email", "existing@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.exists").isBoolean());
    }

    @Test
    @DisplayName("检查用户名是否已存在")
    void checkUsername_returns200WithExists() throws Exception {
        mockMvc.perform(get("/api/auth/check-username").param("username", "testuser"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.exists").isBoolean());
    }
}
