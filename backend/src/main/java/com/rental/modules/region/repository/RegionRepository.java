package com.rental.modules.region.repository;

import com.rental.modules.region.entity.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 区域数据访问层
 */
@Repository
public interface RegionRepository extends JpaRepository<Region, Long> {

    /**
     * 根据城市和区域名称查找区域
     */
    Optional<Region> findByCityAndName(String city, String name);

    /**
     * 根据城市英文名和区域英文名查找区域
     */
    Optional<Region> findByCityEnAndNameEn(String cityEn, String nameEn);

    /**
     * 根据城市查找所有区域
     */
    List<Region> findByCity(String city);

    /**
     * 根据城市英文名查找所有区域
     */
    List<Region> findByCityEn(String cityEn);

    /**
     * 根据城市（支持中英文）查找所有区域
     */
    @Query("SELECT r FROM Region r WHERE r.city = :city OR r.cityEn = :city")
    List<Region> findByCityAny(@Param("city") String city);

    /**
     * 根据城市和区域名称（支持中英文）查找区域
     */
    @Query("SELECT r FROM Region r WHERE (r.city = :city OR r.cityEn = :city) AND (r.name = :name OR r.nameEn = :name)")
    Optional<Region> findByCityAndNameAny(@Param("city") String city, @Param("name") String name);
}
