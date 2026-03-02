package com.rental.modules.inquiry.repository;

import com.rental.modules.inquiry.entity.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;

/**
 * 咨询仓储接口
 */
@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    /**
     * 根据房源ID查找咨询
     */
    List<Inquiry> findByListingId(Long listingId);

    /**
     * 根据租客ID查找咨询
     */
    List<Inquiry> findByTenantId(Long tenantId);

    /**
     * 根据房东ID查找咨询
     */
    List<Inquiry> findByLandlordId(Long landlordId);

    /**
     * 根据状态查找咨询
     */
    List<Inquiry> findByStatus(Inquiry.InquiryStatus status);

    /**
     * 根据房东ID和状态查找
     */
    List<Inquiry> findByLandlordIdAndStatus(Long landlordId, Inquiry.InquiryStatus status);

    /**
     * 统计今日咨询数量
     */
    @Query("SELECT COUNT(i) FROM Inquiry i WHERE i.createdAt >= :startOfDay")
    long countTodayInquiries(LocalDateTime startOfDay);
}
