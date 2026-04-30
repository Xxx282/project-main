package com.rental.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 房源模块 API 测试（04-开发与质量保证 - 测试用例/报告用）
 * 运行方式：在 backend 目录执行 mvn test -Dtest=PropertyControllerTest
 * 结果截图：对 IDE 测试结果或 target/surefire-reports 报告截图
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PropertyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("TC-PROP-001: 分页查询房源列表")
    void getListings_withPagination_returns200AndList() throws Exception {
        mockMvc.perform(get("/api/listings")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("TC-PROP-002: 带筛选条件查询房源")
    void getListings_withFilters_returns200() throws Exception {
        mockMvc.perform(get("/api/listings")
                        .param("city", "北京")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("根据ID查询房源详情-返回200或404")
    void getListingById_returns200Or404() throws Exception {
        mockMvc.perform(get("/api/listings/1"))
                .andExpect(result -> {
                    int code = result.getResponse().getStatus();
                    if (code != 200 && code != 404)
                        throw new AssertionError("expected 200 or 404, got " + code);
                });
    }
}
