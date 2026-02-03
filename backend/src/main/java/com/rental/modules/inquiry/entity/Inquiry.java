package com.rental.modules.inquiry.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

/**
 * 咨询实体
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "inquiries")
public class Inquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "landlord_id", nullable = false)
    private Long landlordId;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String reply;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InquiryStatus status = InquiryStatus.pending;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime repliedAt;

    /**
     * 咨询状态枚举
     */
    public enum InquiryStatus {
        pending,    // 待回复
        replied,     // 已回复
        closed       // 已关闭
    }
}
