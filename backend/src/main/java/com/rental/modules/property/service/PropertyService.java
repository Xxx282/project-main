package com.rental.modules.property.service;

import com.rental.modules.property.entity.Property;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * 房源服务接口
 */
public interface PropertyService {

    List<Property> findByLandlordId(Long landlordId);

    Page<Property> findByLandlordId(Long landlordId, Pageable pageable);

    List<Property> findByStatus(Property.PropertyStatus status);

    Page<Property> findByStatus(Property.PropertyStatus status, Pageable pageable);

    Page<Property> findByFilters(
            String city, String region,
            BigDecimal minPrice, BigDecimal maxPrice,
            Integer bedrooms, Property.PropertyStatus status,
            Pageable pageable);

    Optional<Property> findById(Long id);

    Property findByIdOrThrow(Long id);

    Property createProperty(Property property);

    Property updateProperty(Property property);

    Property updateStatus(Long id, Property.PropertyStatus status);

    void deleteProperty(Long id);

    Property incrementViewCount(Long id);

    long countByLandlordId(Long landlordId);

    long countByStatus(Property.PropertyStatus status);

    List<Object[]> countByCityGroupByStatus(Property.PropertyStatus status);
}
