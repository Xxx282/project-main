package com.rental.modules.property.service;

import com.rental.modules.property.entity.PropertyImage;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 房源图片服务接口
 */
public interface PropertyImageService {

    /**
     * 上传图片
     */
    List<PropertyImage> uploadImages(Long propertyId, MultipartFile[] files);

    /**
     * 获取房源的所有图片
     */
    List<PropertyImage> getImagesByPropertyId(Long propertyId);

    /**
     * 删除图片
     */
    void deleteImage(Long imageId);

    /**
     * 更新图片排序
     */
    void reorderImages(Long propertyId, List<Long> imageIds);
}
