package com.rental.modules.ml.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * 租金预测请求 DTO - 匹配 ML 服务 API
 */
@Data
public class PricePredictionRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // ML 服务 API 字段
    private Integer bedrooms;           // 卧室数量 (BHK)
    private Double area;               // 面积
    private String city;               // 城市
    private String region;             // 区域
    private Double bathrooms = 1.0;    // 卫生间数量
    private String propertyType = "Super Area";  // 房屋类型
    private String decoration = "Unfurnished";   // 装修状态
    private Integer floor = 1;        // 楼层
    private Integer totalFloors = 5;   // 总楼层
}
