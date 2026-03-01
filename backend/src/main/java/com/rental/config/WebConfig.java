package com.rental.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;
import lombok.extern.slf4j.Slf4j;

/**
 * Web 配置类
 */
@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.path:./uploads/properties}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // 绝对路径转换
        String absolutePath = uploadPath;
        if (absolutePath.startsWith("./")) {
            // 获取当前工作目录并构建绝对路径
            String userDir = System.getProperty("user.dir");
            // 去掉 ./ 前缀，替换为当前工作目录
            absolutePath = Paths.get(userDir, absolutePath.substring(2)).toString();
        }

        // 确保路径使用正斜杠（Windows兼容）
        absolutePath = absolutePath.replace("\\", "/");

        log.info("静态资源映射 - 上传路径: {}", absolutePath);

        // /uploads/** 映射到 uploadPath 目录
        // 例如: /uploads/properties/7/xxx.png -> C:/.../backend/uploads/properties/properties/7/xxx.png
        // 这会导致路径重复，所以我们需要把 /uploads/** 映射到 uploadPath 的父目录
        String parentPath = Paths.get(absolutePath).getParent() != null 
            ? Paths.get(absolutePath).getParent().toString() 
            : absolutePath;
        parentPath = parentPath.replace("\\", "/");
        
        log.info("静态资源映射 - /uploads/** -> file:{}/", parentPath);
        log.info("静态资源映射 - /api/uploads/** -> file:{}/", parentPath);

        // 不带 /api 前缀的映射 - 映射到 uploads 目录
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + parentPath + "/");
        
        // 带 /api 前缀的映射 - 同样映射到 uploads 目录
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + parentPath + "/");
    }
}
