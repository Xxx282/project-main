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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    public Page<Property> searchBySmartQuery(String query, Property.PropertyStatus status, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return propertyRepository.findByFilters(null, null, null, null, null, status, pageable);
        }
        String q = query.trim();
        log.info("AI Smart Search: query={}", q);
        
        List<String> knownCities = propertyRepository.findDistinctCitiesByStatus(Property.PropertyStatus.available);
        String city = null;
        String region = null;
        Integer bedrooms = null;
        BigDecimal minRent = null;
        BigDecimal maxRent = null;
        String keywordPart = q;

        for (String c : knownCities) {
            if (q.contains(c)) {
                city = c;
                keywordPart = keywordPart.replace(c, " ").trim();
                log.info("  Parsed city: {}", city);
                break;
            }
        }

        // 支持中文/英文卧室：2室、2 BHK、二室、2 bedroom、2 bedrooms、2 bed
        Pattern roomPattern = Pattern.compile(
            "(\\d)\\s*室|(\\d)\\s*BHK|(一|两|二|三|四|五|六)室|(\\d+)\\s*bed(?:room)?s?",
            Pattern.CASE_INSENSITIVE);
        Matcher roomMatcher = roomPattern.matcher(q);
        if (roomMatcher.find()) {
            String g1 = roomMatcher.group(1);
            String g2 = roomMatcher.group(2);
            String g3 = roomMatcher.group(3);
            String g4 = roomMatcher.group(4);
            if (g1 != null) bedrooms = Integer.parseInt(g1);
            else if (g2 != null) bedrooms = Integer.parseInt(g2);
            else if (g3 != null) {
                switch (g3) {
                    case "一": bedrooms = 1; break;
                    case "两": case "二": bedrooms = 2; break;
                    case "三": bedrooms = 3; break;
                    case "四": bedrooms = 4; break;
                    case "五": bedrooms = 5; break;
                    case "六": bedrooms = 6; break;
                    default: break;
                }
            } else if (g4 != null) {
                bedrooms = Integer.parseInt(g4);
            }
            if (bedrooms != null) {
                keywordPart = keywordPart.replace(roomMatcher.group(0), " ").trim();
                log.info("  Parsed bedrooms: {}", bedrooms);
            }
        }

        Pattern wanPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*万|(\\d+)\\s*万\\s*以内|(?:一万|1万)\\s*以内");
        Matcher wanMatcher = wanPattern.matcher(q);
        log.info("  Testing '万' pattern on: '{}', find={}", q, wanMatcher.find());
        if (wanMatcher.find()) {
            log.info("  Wan matcher groups: g1={}, g2={}, g3={}", wanMatcher.group(1), wanMatcher.group(2), wanMatcher.group(3));
            try {
                if (wanMatcher.group(1) != null) {
                    double w = Double.parseDouble(wanMatcher.group(1));
                    maxRent = BigDecimal.valueOf((long) (w * 10000));
                    log.info("  Parsed maxRent from g1: {}", maxRent);
                } else if (wanMatcher.group(2) != null) {
                    maxRent = BigDecimal.valueOf(Long.parseLong(wanMatcher.group(2)) * 10000L);
                    log.info("  Parsed maxRent from g2: {}", maxRent);
                } else {
                    maxRent = BigDecimal.valueOf(10000L);
                    log.info("  Parsed maxRent from default: {}", maxRent);
                }
            } catch (Exception ignored) {}
        }
        Pattern numPricePattern = Pattern.compile("(\\d+)\\s*[-~到至]\\s*(\\d+)\\s*元|(\\d+)\\s*以内");
        Matcher numPriceMatcher = numPricePattern.matcher(q);
        if (numPriceMatcher.find()) {
            try {
                if (numPriceMatcher.group(1) != null && numPriceMatcher.group(2) != null) {
                    minRent = BigDecimal.valueOf(Long.parseLong(numPriceMatcher.group(1)));
                    maxRent = BigDecimal.valueOf(Long.parseLong(numPriceMatcher.group(2)));
                } else if (numPriceMatcher.group(3) != null) {
                    maxRent = BigDecimal.valueOf(Long.parseLong(numPriceMatcher.group(3)));
                }
            } catch (Exception ignored) {}
        }
        if (minRent == null && maxRent == null) {
            Pattern plainNum = Pattern.compile("(\\d{4,5})\\s*元|(\\d{4,5})\\s*/");
            Matcher m = plainNum.matcher(q);
            if (m.find()) {
                String n = m.group(1) != null ? m.group(1) : m.group(2);
                if (n != null) maxRent = BigDecimal.valueOf(Long.parseLong(n));
            }
        }

        keywordPart = keywordPart.replaceAll("\\s+", " ").trim();
        if (keywordPart.isEmpty()) {
            keywordPart = null;
        } else {
            // 若剩余仅为单个词且不在数据库城市列表中，可能是英文地名等，不按标题过滤以返回其他条件的结果
            String single = keywordPart.split("\\s+")[0];
            if (single.equals(keywordPart) && !knownCities.contains(single)) {
                log.info("  Ignoring single unknown place keyword for broader results: {}", keywordPart);
                keywordPart = null;
            }
        }

        log.info("  Final params: city={}, bedrooms={}, maxRent={}, keyword={}", city, bedrooms, maxRent, keywordPart);
        
        return propertyRepository.findByFiltersAndKeyword(
                city, region, minRent, maxRent, bedrooms, status, keywordPart, pageable);
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

    @Override
    public List<Property> findSimilarProperties(String city, String region, Integer bedrooms, Integer limit) {
        // 限制最多返回 5 条，避免太多
        int maxResults = Math.min(limit, 5);

        // 第一次尝试：精确匹配（相同城市 + 区域 + 户型）
        List<Property> results = propertyRepository.findSimilarProperties(
                Property.PropertyStatus.available,
                city,
                region,
                bedrooms
        );

        // 第二次尝试：只匹配城市 + 户型（忽略区域）
        if (results.size() < maxResults) {
            results = propertyRepository.findSimilarProperties(
                    Property.PropertyStatus.available,
                    city,
                    null,
                    bedrooms
            );
        }

        // 第三次尝试：不限制城市 / 区域 / 户型，直接给出全局最接近的一些房源作为参考
        if (results.size() < maxResults) {
            results = propertyRepository.findSimilarProperties(
                    Property.PropertyStatus.available,
                    null,
                    null,
                    null
            );
        }

        // 按价格排序，返回最相似的（最多 5 条）
        return results.stream().limit(maxResults).toList();
    }

    @Override
    public Property findClosestProperty(String city, Integer bedrooms, Integer area) {
        // 优先：相同城市 + 相同户型
        List<Property> results = propertyRepository.findSimilarProperties(
                Property.PropertyStatus.available,
                city,
                null,
                bedrooms
        );

        // 如果有结果，找面积最接近的（过滤 area 为 null 的）
        if (!results.isEmpty()) {
            Property closest = null;
            int minDiff = Integer.MAX_VALUE;
            for (Property p : results) {
                if (p.getArea() == null) continue;
                int diff = Math.abs(p.getArea().intValue() - area);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = p;
                }
            }
            if (closest != null) {
                return closest;
            }
        }

        // 备选：只匹配城市
        results = propertyRepository.findSimilarProperties(
                Property.PropertyStatus.available,
                city,
                null,
                null
        );

        if (!results.isEmpty()) {
            Property closest = null;
            int minDiff = Integer.MAX_VALUE;
            for (Property p : results) {
                if (p.getArea() == null) continue;
                int diff = Math.abs(p.getArea().intValue() - area);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = p;
                }
            }
            if (closest != null) {
                return closest;
            }
        }

        // 最后备选：全局查找（忽略所有条件）
        results = propertyRepository.findSimilarProperties(
                Property.PropertyStatus.available,
                null,
                null,
                null
        );

        if (!results.isEmpty()) {
            Property closest = null;
            int minDiff = Integer.MAX_VALUE;
            for (Property p : results) {
                if (p.getArea() == null) continue;
                int diff = Math.abs(p.getArea().intValue() - area);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = p;
                }
            }
            return closest;
        }

        return null;
    }
}
