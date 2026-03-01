package com.rental.modules.property.repository;

import com.rental.modules.property.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * 房源仓储接口
 */
@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    /**
     * 根据房东ID查找房源
     */
    List<Property> findByLandlordId(Long landlordId);

    /**
     * 根据房东ID分页查找房源
     */
    Page<Property> findByLandlordId(Long landlordId, Pageable pageable);

    /**
     * 根据状态查找房源
     */
    List<Property> findByStatus(Property.PropertyStatus status);

    /**
     * 根据城市和状态查找房源
     */
    List<Property> findByCityAndStatus(String city, Property.PropertyStatus status);

    /**
     * 根据城市查找房源（分页）
     */
    Page<Property> findByCity(String city, Pageable pageable);

    /**
     * 根据区域查找房源（分页）
     */
    Page<Property> findByRegion(String region, Pageable pageable);

    /**
     * 根据状态分页查找
     */
    Page<Property> findByStatus(Property.PropertyStatus status, Pageable pageable);

    /**
     * 自定义查询：筛选房源
     */
    @Query("SELECT p FROM Property p WHERE " +
           "(:city IS NULL OR p.city = :city) AND " +
           "(:region IS NULL OR p.region = :region) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:bedrooms IS NULL OR p.bedrooms = :bedrooms) AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<Property> findByFilters(
            @Param("city") String city,
            @Param("region") String region,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("bedrooms") Integer bedrooms,
            @Param("status") Property.PropertyStatus status,
            Pageable pageable);

    /**
     * 根据关键词搜索房源标题（模糊匹配）
     */
    @Query("SELECT p FROM Property p WHERE " +
           "(:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR p.status = :status)")
    Page<Property> findByTitleContaining(
            @Param("keyword") String keyword,
            @Param("status") Property.PropertyStatus status,
            Pageable pageable);

    /**
     * 增加浏览次数
     */
    @Modifying
    @Query("UPDATE Property p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    /**
     * 更新房源状态
     */
    @Modifying
    @Query("UPDATE Property p SET p.status = :status WHERE p.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") Property.PropertyStatus status);

    /**
     * 统计房东房源数量
     */
    long countByLandlordId(Long landlordId);

    /**
     * 统计某状态的房源数量
     */
    long countByStatus(Property.PropertyStatus status);

    /**
     * 根据ID和房东ID查找（用于权限验证）
     */
    Optional<Property> findByIdAndLandlordId(Long id, Long landlordId);

    /**
     * 统计每个城市的房源数量
     */
    @Query("SELECT p.city, COUNT(p) FROM Property p WHERE p.status = :status GROUP BY p.city")
    List<Object[]> countByCityGroupByStatus(@Param("status") Property.PropertyStatus status);
}
