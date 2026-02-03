package com.rental.modules.inquiry.service;

import com.rental.modules.inquiry.entity.Inquiry;
import java.util.List;

/**
 * 咨询服务接口
 */
public interface InquiryService {
    Inquiry createInquiry(Long listingId, Long tenantId, String message);
    Inquiry replyToInquiry(Long inquiryId, String reply);
    Inquiry closeInquiry(Long inquiryId);
    List<Inquiry> findByTenantId(Long tenantId);
    List<Inquiry> findByLandlordId(Long landlordId);
    List<Inquiry> findByListingId(Long listingId);
    Inquiry findById(Long id);
    List<Inquiry> findByLandlordIdAndStatus(Long landlordId, Inquiry.InquiryStatus status);
}
