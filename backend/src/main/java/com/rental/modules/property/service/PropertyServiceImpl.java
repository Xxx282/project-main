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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        // 移除对单个词的限制，现在允许任意关键词进行标题搜索
        if (keywordPart.isEmpty()) {
            keywordPart = null;
        }

        // 支持中文城市名和关键词搜索
        Map<String, String> chineseToEnglish = new HashMap<>();
        chineseToEnglish.put("上海", "shanghai");
        chineseToEnglish.put("北京", "beijing");
        chineseToEnglish.put("广州", "guangzhou");
        chineseToEnglish.put("深圳", "shenzhen");
        chineseToEnglish.put("杭州", "hangzhou");
        chineseToEnglish.put("成都", "chengdu");
        chineseToEnglish.put("南京", "nanjing");
        chineseToEnglish.put("武汉", "wuhan");
        chineseToEnglish.put("西安", "xian");
        chineseToEnglish.put("苏州", "suzhou");
        chineseToEnglish.put("天津", "tianjin");
        chineseToEnglish.put("重庆", "chongqing");

        // 如果检测到中文城市名，转换为英文（保留关键词搜索，但移除已解析的城市名）
        if (city == null) {
            for (Map.Entry<String, String> entry : chineseToEnglish.entrySet()) {
                if (keywordPart.contains(entry.getKey())) {
                    city = entry.getValue();
                    // 从关键词中移除已解析的城市名，避免重复搜索
                    keywordPart = keywordPart.replace(entry.getKey(), " ").trim();
                    log.info("  Parsed Chinese city: {} -> {}", entry.getKey(), city);
                    break;
                }
            }
        }

        // 支持区域名/别名映射到城市（如：钱塘 -> 杭州，西湖 -> 杭州）
        // Key: 中文区域名, Value: 对应城市的英文名
        // 注意：区域检测应该在城市检测之后执行，即使城市已解析也要继续检测区域
        Map<String, String> regionToCity = new HashMap<>();
        // 杭州区域
        regionToCity.put("钱塘", "hangzhou");
        regionToCity.put("余杭", "hangzhou");
        regionToCity.put("西湖", "hangzhou");
        regionToCity.put("拱墅", "hangzhou");
        regionToCity.put("滨江", "hangzhou");
        regionToCity.put("萧山", "hangzhou");
        regionToCity.put("上城", "hangzhou");
        regionToCity.put("临平", "hangzhou");
        regionToCity.put("富阳", "hangzhou");
        regionToCity.put("临安", "hangzhou");
        // 上海区域
        regionToCity.put("浦东", "shanghai");
        regionToCity.put("黄浦", "shanghai");
        regionToCity.put("静安", "shanghai");
        regionToCity.put("徐汇", "shanghai");
        regionToCity.put("长宁", "shanghai");
        regionToCity.put("普陀", "shanghai");
        regionToCity.put("虹口", "shanghai");
        regionToCity.put("杨浦", "shanghai");
        regionToCity.put("闵行", "shanghai");
        regionToCity.put("宝山", "shanghai");
        regionToCity.put("嘉定", "shanghai");
        regionToCity.put("金山", "shanghai");
        regionToCity.put("松江", "shanghai");
        regionToCity.put("青浦", "shanghai");
        regionToCity.put("奉贤", "shanghai");
        regionToCity.put("崇明", "shanghai");
        // 北京区域
        regionToCity.put("朝阳", "beijing");
        regionToCity.put("海淀", "beijing");
        regionToCity.put("丰台", "beijing");
        regionToCity.put("石景山", "beijing");
        regionToCity.put("通州", "beijing");
        regionToCity.put("顺义", "beijing");
        regionToCity.put("房山", "beijing");
        regionToCity.put("大兴", "beijing");
        regionToCity.put("昌平", "beijing");
        regionToCity.put("怀柔", "beijing");
        regionToCity.put("平谷", "beijing");
        regionToCity.put("门头沟", "beijing");
        regionToCity.put("延庆", "beijing");
        regionToCity.put("密云", "beijing");
        // 广州区域
        regionToCity.put("天河", "guangzhou");
        regionToCity.put("越秀", "guangzhou");
        regionToCity.put("海珠", "guangzhou");
        regionToCity.put("荔湾", "guangzhou");
        regionToCity.put("白云", "guangzhou");
        regionToCity.put("黄埔", "guangzhou");
        regionToCity.put("番禺", "guangzhou");
        regionToCity.put("花都", "guangzhou");
        regionToCity.put("南沙", "guangzhou");
        regionToCity.put("从化", "guangzhou");
        regionToCity.put("增城", "guangzhou");
        // 深圳区域
        regionToCity.put("福田", "shenzhen");
        regionToCity.put("罗湖", "shenzhen");
        regionToCity.put("南山", "shenzhen");
        regionToCity.put("宝安", "shenzhen");
        regionToCity.put("龙岗", "shenzhen");
        regionToCity.put("龙华", "shenzhen");
        regionToCity.put("盐田", "shenzhen");
        regionToCity.put("坪山", "shenzhen");
        regionToCity.put("光明", "shenzhen");

        // 区域名翻译映射：中文区域名 -> 英文区域名
        Map<String, String> regionTranslation = new HashMap<>();
        // 杭州区域
        regionTranslation.put("钱塘", "qiantang");
        regionTranslation.put("余杭", "yuhang");
        regionTranslation.put("西湖", "xihu");
        regionTranslation.put("拱墅", "gongshu");
        regionTranslation.put("滨江", "binjiang");
        regionTranslation.put("萧山", "xiaoshan");
        regionTranslation.put("上城", "shangcheng");
        regionTranslation.put("临平", "linping");
        regionTranslation.put("富阳", "fuyang");
        regionTranslation.put("临安", "linan");
        // 上海区域
        regionTranslation.put("浦东", "pudong");
        regionTranslation.put("黄浦", "huangpu");
        regionTranslation.put("静安", "jingan");
        regionTranslation.put("徐汇", "xuhui");
        regionTranslation.put("长宁", "changning");
        regionTranslation.put("普陀", "putuo");
        regionTranslation.put("虹口", "hongkou");
        regionTranslation.put("杨浦", "yangpu");
        regionTranslation.put("闵行", "minhang");
        regionTranslation.put("宝山", "baoshan");
        regionTranslation.put("嘉定", "jiading");
        regionTranslation.put("金山", "jinshan");
        regionTranslation.put("松江", "songjiang");
        regionTranslation.put("青浦", "qingpu");
        regionTranslation.put("奉贤", "fengxian");
        regionTranslation.put("崇明", "chongming");
        // 北京区域
        regionTranslation.put("朝阳", "chaoyang");
        regionTranslation.put("海淀", "haidian");
        regionTranslation.put("丰台", "fengtai");
        regionTranslation.put("石景山", "shijingshan");
        regionTranslation.put("通州", "tongzhou");
        regionTranslation.put("顺义", "shunyi");
        regionTranslation.put("房山", "fangshan");
        regionTranslation.put("大兴", "daxing");
        regionTranslation.put("昌平", "changping");
        regionTranslation.put("怀柔", "huairou");
        regionTranslation.put("平谷", "pinggu");
        regionTranslation.put("门头沟", "mentougou");
        regionTranslation.put("延庆", "yanqing");
        regionTranslation.put("密云", "miyun");
        // 广州区域
        regionTranslation.put("天河", "tianhe");
        regionTranslation.put("越秀", "yuexiu");
        regionTranslation.put("海珠", "haizhu");
        regionTranslation.put("荔湾", "liwan");
        regionTranslation.put("白云", "baiyun");
        regionTranslation.put("黄埔", "huangpu");
        regionTranslation.put("番禺", "panyu");
        regionTranslation.put("花都", "huadu");
        regionTranslation.put("南沙", "nansha");
        regionTranslation.put("从化", "conghua");
        regionTranslation.put("增城", "zengcheng");
        // 深圳区域
        regionTranslation.put("福田", "futian");
        regionTranslation.put("罗湖", "luohu");
        regionTranslation.put("南山", "nanshan");
        regionTranslation.put("宝安", "baoan");
        regionTranslation.put("龙岗", "longgang");
        regionTranslation.put("龙华", "longhua");
        regionTranslation.put("盐田", "yantian");
        regionTranslation.put("坪山", "pingshan");
        regionTranslation.put("光明", "guangming");

        // 检测区域名并映射到城市，同时翻译为英文
        // 注意：即使城市已解析，也要继续检测区域名（用户可能输入如 "杭州 钱塘"）
        if (region == null && keywordPart != null && !keywordPart.isEmpty()) {
            for (Map.Entry<String, String> entry : regionToCity.entrySet()) {
                if (keywordPart.contains(entry.getKey())) {
                    // 如果城市还未解析，从区域映射获取城市
                    if (city == null) {
                        city = entry.getValue();
                    }
                    // 翻译区域名为英文
                    String englishRegion = regionTranslation.get(entry.getKey());
                    region = englishRegion != null ? englishRegion : entry.getKey();
                    // 从关键词中移除已解析的区域名，避免重复搜索
                    keywordPart = keywordPart.replace(entry.getKey(), " ").trim();
                    log.info("  Parsed region: {} -> city: {}, region: {}", entry.getKey(), city, region);
                    break;
                }
            }
        }

        // 支持英文城市名和关键词搜索（已有城市名时不重复处理）
        Map<String, String> englishToChinese = new HashMap<>();
        englishToChinese.put("shanghai", "上海");
        englishToChinese.put("beijing", "北京");
        englishToChinese.put("guangzhou", "广州");
        englishToChinese.put("shenzhen", "深圳");
        englishToChinese.put("hangzhou", "杭州");
        englishToChinese.put("chengdu", "成都");
        englishToChinese.put("nanjing", "南京");
        englishToChinese.put("wuhan", "武汉");
        englishToChinese.put("xian", "西安");
        englishToChinese.put("suzhou", "苏州");
        englishToChinese.put("tianjin", "天津");
        englishToChinese.put("chongqing", "重庆");

        // 检查是否包含英文城市名，如果是则提取并转换为英文用于数据库查询
        String lowerKeyword = keywordPart != null ? keywordPart.toLowerCase() : "";
        for (Map.Entry<String, String> entry : englishToChinese.entrySet()) {
            if (lowerKeyword.contains(entry.getKey())) {
                if (city == null) {
                    city = entry.getKey();
                    // 从关键词中移除已解析的英文城市名，避免重复搜索
                    if (keywordPart != null) {
                        keywordPart = keywordPart.replaceAll("(?i)" + entry.getKey(), " ").trim();
                    }
                    log.info("  Parsed English city: {} -> {}", entry.getKey(), city);
                }
                break;
            }
        }

        // 支持英文区域名检测（如：qiantang, xihu 等）
        if (region == null && keywordPart != null && !keywordPart.isEmpty()) {
            // 英文区域名 -> 中文区域名 -> 城市映射
            Map<String, String> englishRegionToCity = new HashMap<>();
            // 杭州区域
            englishRegionToCity.put("qiantang", "hangzhou");
            englishRegionToCity.put("yuhang", "hangzhou");
            englishRegionToCity.put("xihu", "hangzhou");
            englishRegionToCity.put("gongshu", "hangzhou");
            englishRegionToCity.put("binjiang", "hangzhou");
            englishRegionToCity.put("xiaoshan", "hangzhou");
            englishRegionToCity.put("shangcheng", "hangzhou");
            englishRegionToCity.put("linping", "hangzhou");
            englishRegionToCity.put("fuyang", "hangzhou");
            englishRegionToCity.put("linan", "hangzhou");
            // 上海区域
            englishRegionToCity.put("pudong", "shanghai");
            englishRegionToCity.put("huangpu", "shanghai");
            englishRegionToCity.put("jingan", "shanghai");
            englishRegionToCity.put("xuhui", "shanghai");
            englishRegionToCity.put("changning", "shanghai");
            englishRegionToCity.put("putuo", "shanghai");
            englishRegionToCity.put("hongkou", "shanghai");
            englishRegionToCity.put("yangpu", "shanghai");
            englishRegionToCity.put("minhang", "shanghai");
            englishRegionToCity.put("baoshan", "shanghai");
            englishRegionToCity.put("jiading", "shanghai");
            englishRegionToCity.put("jinshan", "shanghai");
            englishRegionToCity.put("songjiang", "shanghai");
            englishRegionToCity.put("qingpu", "shanghai");
            englishRegionToCity.put("fengxian", "shanghai");
            englishRegionToCity.put("chongming", "shanghai");
            // 北京区域
            englishRegionToCity.put("chaoyang", "beijing");
            englishRegionToCity.put("haidian", "beijing");
            englishRegionToCity.put("fengtai", "beijing");
            englishRegionToCity.put("shijingshan", "beijing");
            englishRegionToCity.put("tongzhou", "beijing");
            englishRegionToCity.put("shunyi", "beijing");
            englishRegionToCity.put("fangshan", "beijing");
            englishRegionToCity.put("daxing", "beijing");
            englishRegionToCity.put("changping", "beijing");
            englishRegionToCity.put("huairou", "beijing");
            englishRegionToCity.put("pinggu", "beijing");
            englishRegionToCity.put("mentougou", "beijing");
            englishRegionToCity.put("yanqing", "beijing");
            englishRegionToCity.put("miyun", "beijing");
            // 广州区域
            englishRegionToCity.put("tianhe", "guangzhou");
            englishRegionToCity.put("yuexiu", "guangzhou");
            englishRegionToCity.put("haizhu", "guangzhou");
            englishRegionToCity.put("liwan", "guangzhou");
            englishRegionToCity.put("baiyun", "guangzhou");
            englishRegionToCity.put("huangpu", "guangzhou");
            englishRegionToCity.put("panyu", "guangzhou");
            englishRegionToCity.put("huadu", "guangzhou");
            englishRegionToCity.put("nansha", "guangzhou");
            englishRegionToCity.put("conghua", "guangzhou");
            englishRegionToCity.put("zengcheng", "guangzhou");
            // 深圳区域
            englishRegionToCity.put("futian", "shenzhen");
            englishRegionToCity.put("luohu", "shenzhen");
            englishRegionToCity.put("nanshan", "shenzhen");
            englishRegionToCity.put("baoan", "shenzhen");
            englishRegionToCity.put("longgang", "shenzhen");
            englishRegionToCity.put("longhua", "shenzhen");
            englishRegionToCity.put("yantian", "shenzhen");
            englishRegionToCity.put("pingshan", "shenzhen");
            englishRegionToCity.put("guangming", "shenzhen");

            for (Map.Entry<String, String> entry : englishRegionToCity.entrySet()) {
                if (lowerKeyword.contains(entry.getKey())) {
                    // 如果城市还未解析，从区域映射获取城市
                    if (city == null) {
                        city = entry.getValue();
                    }
                    // 直接使用英文区域名
                    region = entry.getKey();
                    // 从关键词中移除已解析的英文区域名
                    keywordPart = keywordPart.replaceAll("(?i)" + entry.getKey(), " ").trim();
                    log.info("  Parsed English region: {} -> city: {}, region: {}", entry.getKey(), city, region);
                    break;
                }
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
