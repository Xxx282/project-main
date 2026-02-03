package com.rental.modules.ml.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * 租金预测请求 DTO
 */
@Data
public class PricePredictionRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // 必填字段
    private Integer bedrooms;           // 卧室数量
    private Double area;                // 面积（平方米）
    private String city;                // 城市
    private String region;              // 区域

    // 选填字段
    private Double bathrooms;           // 卫生间数量
    private String propertyType;        // 房屋类型
    private String decoration;          // 装修情况
    private Integer floor;              // 楼层
    private Integer totalFloors;        // 总楼层
    private String orientation;         // 朝向
    private Boolean hasParking;         // 是否有停车位
    private Boolean hasElevator;        // 是否有电梯
    private Boolean hasBalcony;         // 是否有阳台
}
