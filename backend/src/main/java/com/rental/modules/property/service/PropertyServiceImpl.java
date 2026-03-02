package com.rental.modules.property.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.ResultCode;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * 房源服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;

    @Override
    public List<Property> findByLandlordId(Long landlordId) {
        return propertyRepository.findByLandlordId(landlordId);
    }

    @Override
    public Page<Property> findByLandlordId(Long landlordId, Pageable pageable) {
        return propertyRepository.findByLandlordId(landlordId, pageable);
    }

    @Override
    public List<Property> findByStatus(Property.PropertyStatus status) {
        return propertyRepository.findByStatus(status);
    }

    @Override
    public Page<Property> findByStatus(Property.PropertyStatus status, Pageable pageable) {
        return propertyRepository.findByStatus(status, pageable);
    }

    @Override
    public List<Property> findAllAvailable() {
        return propertyRepository.findByStatus(Property.PropertyStatus.available);
    }

    @Override
    public Page<Property> findByFilters(
            String city, String region,
            BigDecimal minPrice, BigDecimal maxPrice,
            Integer bedrooms, Property.PropertyStatus status,
            Pageable pageable) {
        return propertyRepository.findByFilters(
                city, region, minPrice, maxPrice, bedrooms, status, pageable);
    }

    @Override
    public Page<Property> searchByKeyword(String keyword, Property.PropertyStatus status, Pageable pageable) {
        return propertyRepository.findByTitleContaining(keyword, status, pageable);
    }

    @Override
    public Optional<Property> findById(Long id) {
        return propertyRepository.findById(id);
    }

    @Override
    public Property findByIdOrThrow(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ResultCode.PROPERTY_NOT_FOUND));
    }

    @Override
    @Transactional
    public Property createProperty(Property property) {
        log.info("创建房源: title={}, landlordId={}", property.getTitle(), property.getLandlordId());
        return propertyRepository.save(property);
    }

    @Override
    @Transactional
    public Property updateProperty(Property property) {
        if (!propertyRepository.existsById(property.getId())) {
            throw new BusinessException(ResultCode.PROPERTY_NOT_FOUND);
        }
        log.info("更新房源: id={}", property.getId());
        return propertyRepository.save(property);
    }

    @Override
    @Transactional
    public Property updateStatus(Long id, Property.PropertyStatus status) {
        Property property = findByIdOrThrow(id);
        property.setStatus(status);
        log.info("更新房源状态: id={}, status={}", id, status);
        return propertyRepository.save(property);
    }

    @Override
    @Transactional
    public void deleteProperty(Long id) {
        if (!propertyRepository.existsById(id)) {
            throw new BusinessException(ResultCode.PROPERTY_NOT_FOUND);
        }
        log.info("删除房源: id={}", id);
        propertyRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Property incrementViewCount(Long id) {
        propertyRepository.incrementViewCount(id);
        return findByIdOrThrow(id);
    }

    @Override
    public long countByLandlordId(Long landlordId) {
        return propertyRepository.countByLandlordId(landlordId);
    }

    @Override
    public long countByStatus(Property.PropertyStatus status) {
        return propertyRepository.countByStatus(status);
    }

    @Override
    public List<Object[]> countByCityGroupByStatus(Property.PropertyStatus status) {
        return propertyRepository.countByCityGroupByStatus(status);
    }

    @Override
    public List<Property> findPendingListings() {
        return propertyRepository.findByStatus(Property.PropertyStatus.pending);
    }

    @Override
    public Property reviewListing(Long id, boolean approved) {
        Property property = findByIdOrThrow(id);
        if (property.getStatus() != Property.PropertyStatus.pending) {
            throw new BusinessException("只能审核待审核状态的房源");
        }
        // 通过设置为 available（可租），拒绝设置为 offline（下架）
        property.setStatus(approved ? Property.PropertyStatus.available : Property.PropertyStatus.offline);
        log.info("审核房源: id={}, approved={}, newStatus={}", id, approved, property.getStatus());
        return propertyRepository.save(property);
    }

    @Override
    public long countAll() {
        return propertyRepository.count();
    }

    @Override
    public long countPending() {
        return propertyRepository.countByStatus(Property.PropertyStatus.pending);
    }
}
