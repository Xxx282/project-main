package com.rental.modules.inquiry.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.ResultCode;
import com.rental.modules.inquiry.entity.Inquiry;
import com.rental.modules.inquiry.repository.InquiryRepository;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

/**
 * 咨询服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InquiryServiceImpl implements InquiryService {

    private final InquiryRepository inquiryRepository;
    private final PropertyRepository propertyRepository;

    @Override
    @Transactional
    public Inquiry createInquiry(Long listingId, Long tenantId, String message) {
        log.info("创建咨询: listingId={}, tenantId={}", listingId, tenantId);

        Property property = propertyRepository.findById(listingId)
                .orElseThrow(() -> new BusinessException(ResultCode.PROPERTY_NOT_FOUND));

        Inquiry inquiry = Inquiry.builder()
                .listingId(listingId)
                .tenantId(tenantId)
                .landlordId(property.getLandlordId())
                .message(message)
                .status(Inquiry.InquiryStatus.pending)
                .build();

        return inquiryRepository.save(inquiry);
    }

    @Override
    @Transactional
    public Inquiry replyToInquiry(Long inquiryId, String reply) {
        log.info("回复咨询: inquiryId={}", inquiryId);

        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new BusinessException(ResultCode.INQUIRY_NOT_FOUND));

        if (inquiry.getStatus() == Inquiry.InquiryStatus.replied) {
            throw new BusinessException(ResultCode.INQUIRY_REPLY_ERROR, "该咨询已回复");
        }

        inquiry.setReply(reply);
        inquiry.setStatus(Inquiry.InquiryStatus.replied);

        return inquiryRepository.save(inquiry);
    }

    @Override
    @Transactional
    public Inquiry closeInquiry(Long inquiryId) {
        log.info("关闭咨询: inquiryId={}", inquiryId);

        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new BusinessException(ResultCode.INQUIRY_NOT_FOUND));

        inquiry.setStatus(Inquiry.InquiryStatus.closed);

        return inquiryRepository.save(inquiry);
    }

    @Override
    public List<Inquiry> findByTenantId(Long tenantId) {
        return inquiryRepository.findByTenantId(tenantId);
    }

    @Override
    public List<Inquiry> findByLandlordId(Long landlordId) {
        return inquiryRepository.findByLandlordId(landlordId);
    }

    @Override
    public List<Inquiry> findByListingId(Long listingId) {
        return inquiryRepository.findByListingId(listingId);
    }

    @Override
    public Inquiry findById(Long id) {
        return inquiryRepository.findById(id).orElse(null);
    }

    @Override
    public List<Inquiry> findByLandlordIdAndStatus(Long landlordId, Inquiry.InquiryStatus status) {
        return inquiryRepository.findByLandlordIdAndStatus(landlordId, status);
    }
}
