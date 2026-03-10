package com.rental.modules.property.service;

import com.rental.common.service.ImageStorageService;
import com.rental.modules.property.entity.PropertyImage;
import com.rental.modules.property.repository.PropertyImageRepository;
import com.rental.modules.property.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/**
 * 房源图片服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyImageServiceImpl implements PropertyImageService {

    private final PropertyImageRepository propertyImageRepository;
    private final PropertyRepository propertyRepository;
    private final ImageStorageService imageStorageService;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Value("${server.port:8080}")
    private int serverPort;

    @Override
    @Transactional
    public List<PropertyImage> uploadImages(Long propertyId, MultipartFile[] files) {
        // 验证房源是否存在
        propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("房源不存在"));

        List<PropertyImage> images = new ArrayList<>();

        // 获取当前最大排序值
        List<PropertyImage> existingImages = propertyImageRepository.findByPropertyIdOrderBySortOrderAsc(propertyId);
        int maxSortOrder = existingImages.isEmpty() ? 0 : existingImages.get(existingImages.size() - 1).getSortOrder();

        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                // 保存图片到文件系统
                String imageUrl = imageStorageService.saveImage(file, propertyId);

                // 保存图片记录到数据库
                PropertyImage image = PropertyImage.builder()
                        .propertyId(propertyId)
                        .imageUrl(imageUrl)
                        .sortOrder(++maxSortOrder)
                        .build();

                images.add(propertyImageRepository.save(image));
                log.info("房源 {} 图片上传成功: {}", propertyId, imageUrl);
            }
        }

        return images;
    }

    @Override
    public List<PropertyImage> getImagesByPropertyId(Long propertyId) {
        List<PropertyImage> images = propertyImageRepository.findByPropertyIdOrderBySortOrderAsc(propertyId);
        
        // 构建完整的图片访问URL
        String baseUrl = "http://localhost:" + serverPort + contextPath;
        for (PropertyImage image : images) {
            String relativeUrl = image.getImageUrl();
            // 如果已经是完整URL则跳过
            if (relativeUrl != null && !relativeUrl.startsWith("http")) {
                image.setImageUrl(baseUrl + relativeUrl);
            }
        }
        
        return images;
    }

    @Override
    @Transactional
    public void deleteImage(Long imageId) {
        PropertyImage image = propertyImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("图片不存在"));

        // 删除文件系统中的图片
        imageStorageService.deleteImage(image.getImageUrl());

        // 删除数据库记录
        propertyImageRepository.delete(image);
        log.info("房源图片删除成功: id={}", imageId);
    }

    @Override
    @Transactional
    public void reorderImages(Long propertyId, List<Long> imageIds) {
        // 验证房源是否存在
        propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("房源不存在"));

        // 更新排序
        for (int i = 0; i < imageIds.size(); i++) {
            final int sortOrder = i;
            Long imageId = imageIds.get(i);
            propertyImageRepository.findById(imageId).ifPresent(image -> {
                if (image.getPropertyId().equals(propertyId)) {
                    image.setSortOrder(sortOrder);
                    propertyImageRepository.save(image);
                }
            });
        }

        log.info("房源 {} 图片排序更新成功", propertyId);
    }
}
