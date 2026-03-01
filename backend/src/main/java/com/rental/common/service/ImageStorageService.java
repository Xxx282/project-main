package com.rental.common.service;

import com.rental.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * 图片存储服务 - 本地文件系统存储
 */
@Slf4j
@Component
public class ImageStorageService {

    @Value("${upload.path:./uploads/properties}")
    private String uploadPath;

    @Value("${upload.allowed-extensions:jpg,jpeg,png,webp}")
    private String allowedExtensions;

    @Value("${upload.max-size:5242880}")
    private long maxSize; // 默认 5MB

    private static final List<String> DEFAULT_ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");

    /**
     * 保存图片文件
     * @param file 上传的文件
     * @param propertyId 房源ID
     * @return 保存后的访问URL
     */
    public String saveImage(MultipartFile file, Long propertyId) {
        // 1. 验证文件
        validateFile(file);

        // 2. 生成唯一文件名（防止文件名冲突）
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFileName = UUID.randomUUID().toString() + "." + extension;

        // 3. 创建目录
        Path propertyDir = Paths.get(uploadPath, propertyId.toString());
        try {
            Files.createDirectories(propertyDir);
        } catch (IOException e) {
            log.error("创建上传目录失败: {}", e.getMessage());
            throw new BusinessException("创建上传目录失败");
        }

        // 4. 保存文件
        Path filePath = propertyDir.resolve(newFileName);
        try {
            Files.copy(file.getInputStream(), filePath);
            log.info("图片保存成功: {}", filePath);
        } catch (IOException e) {
            log.error("保存图片失败: {}", e.getMessage());
            throw new BusinessException("保存图片失败");
        }

        // 5. 返回访问URL（相对于服务器）
        return "/uploads/properties/" + propertyId + "/" + newFileName;
    }

    /**
     * 删除图片文件
     * @param imageUrl 图片URL路径
     */
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return;
        }

        // 去掉前缀 /uploads/properties/
        String relativePath = imageUrl.replace("/uploads/properties/", "");
        Path filePath = Paths.get(uploadPath, relativePath);

        try {
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("图片删除成功: {}", filePath);
            }
        } catch (IOException e) {
            log.error("删除图片失败: {}", e.getMessage());
            // 删除失败不影响业务流程，只记录日志
        }
    }

    /**
     * 验证文件
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }

        if (file.getSize() > maxSize) {
            throw new BusinessException("文件大小不能超过 " + (maxSize / 1024 / 1024) + "MB");
        }

        String extension = getFileExtension(file.getOriginalFilename()).toLowerCase();
        List<String> allowed = DEFAULT_ALLOWED_EXTENSIONS;
        if (allowedExtensions != null && !allowedExtensions.isEmpty()) {
            allowed = Arrays.asList(allowedExtensions.split(","));
        }

        if (!allowed.contains(extension)) {
            throw new BusinessException("不支持的图片格式，允许的格式: " + String.join(", ", allowed));
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDot = filename.lastIndexOf(".");
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : "";
    }
}
