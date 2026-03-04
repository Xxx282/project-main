package com.rental.modules.property.repository;

import com.rental.modules.property.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {
    List<PropertyImage> findByPropertyIdOrderBySortOrderAsc(Long propertyId);
    void deleteByPropertyId(Long propertyId);
}
