package com.rental.modules.contract.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 租赁合同实体
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "rental_contracts")
public class RentalContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_no", nullable = false, unique = true, length = 50)
    private String contractNo;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    /**
     * 租客用户名，通过 SQL 子查询获取
     */
    @Formula("(SELECT u.username FROM users u WHERE u.id = tenant_id)")
    private String tenantUsername;

    /**
     * 租客真实姓名
     */
    @Formula("(SELECT u.real_name FROM users u WHERE u.id = tenant_id)")
    private String tenantRealName;

    @Column(name = "landlord_id", nullable = false)
    private Long landlordId;

    /**
     * 房东用户名，通过 SQL 子查询获取
     */
    @Formula("(SELECT u.username FROM users u WHERE u.id = landlord_id)")
    private String landlordUsername;

    /**
     * 房东真实姓名
     */
    @Formula("(SELECT u.real_name FROM users u WHERE u.id = landlord_id)")
    private String landlordRealName;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    /**
     * 房源标题
     */
    @Formula("(SELECT p.title FROM properties p WHERE p.id = property_id)")
    private String propertyTitle;

    /**
     * 房源地址
     */
    @Formula("(SELECT p.address FROM properties p WHERE p.id = property_id)")
    private String propertyAddress;

    @Column(name = "monthly_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyRent;

    @Column(name = "deposit", nullable = false, precision = 10, scale = 2)
    private BigDecimal deposit;

    @Column(name = "lease_start", nullable = false)
    private LocalDate leaseStart;

    @Column(name = "lease_end", nullable = false)
    private LocalDate leaseEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContractStatus status = ContractStatus.pending_sign;

    /**
     * 租客电子签名
     */
    @Column(name = "tenant_signature", columnDefinition = "TEXT")
    private String tenantSignature;

    /**
     * 房东电子签名
     */
    @Column(name = "landlord_signature", columnDefinition = "TEXT")
    private String landlordSignature;

    /**
     * 租客签署时间
     */
    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    /**
     * 房东签署时间
     */
    @Column(name = "landlord_signed_at")
    private LocalDateTime landlordSignedAt;

    /**
     * 租客签署 IP
     */
    @Column(name = "tenant_ip", length = 50)
    private String tenantIp;

    /**
     * 房东签署 IP
     */
    @Column(name = "landlord_ip", length = 50)
    private String landlordIp;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 合同状态枚举
     */
    public enum ContractStatus {
        pending_sign,    // 待签署
        signed,          // 已签署（租客已签）
        completed,       // 已完成（双方已签）
        cancelled        // 已取消
    }

    // 状态常量（供代码中使用）
    public static final ContractStatus STATUS_PENDING_SIGN = ContractStatus.pending_sign;
    public static final ContractStatus STATUS_SIGNED = ContractStatus.signed;
    public static final ContractStatus STATUS_COMPLETED = ContractStatus.completed;
    public static final ContractStatus STATUS_CANCELLED = ContractStatus.cancelled;
}
