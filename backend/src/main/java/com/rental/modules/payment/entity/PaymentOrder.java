package com.rental.modules.payment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付订单实体
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "payment_order")
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 订单号（唯一）
     */
    @Column(name = "order_no", nullable = false, unique = true, length = 64)
    private String orderNo;

    /**
     * 支付者（租客）ID
     */
    @Column(name = "payer_id", nullable = false)
    private Long payerId;

    /**
     * 支付者用户名
     */
    @Formula("(SELECT u.username FROM users u WHERE u.id = payer_id)")
    private String payerUsername;

    /**
     * 支付者真实姓名
     */
    @Formula("(SELECT u.real_name FROM users u WHERE u.id = payer_id)")
    private String payerRealName;

    /**
     * 收款者（房东）ID
     */
    @Column(name = "payee_id", nullable = false)
    private Long payeeId;

    /**
     * 收款者用户名
     */
    @Formula("(SELECT u.username FROM users u WHERE u.id = payee_id)")
    private String payeeUsername;

    /**
     * 收款者真实姓名
     */
    @Formula("(SELECT u.real_name FROM users u WHERE u.id = payee_id)")
    private String payeeRealName;

    /**
     * 关联房源ID
     */
    @Column(name = "property_id")
    private Long propertyId;

    /**
     * 房源标题（冗余展示）
     */
    @Formula("(SELECT p.title FROM properties p WHERE p.id = property_id)")
    private String propertyTitle;

    /**
     * 支付类型：DEPOSIT（押金）、RENT（月租）
     */
    @Column(name = "payment_type", nullable = false, length = 20)
    private String paymentType;

    /**
     * 金额
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /**
     * 订单状态：PENDING（待房东确认）、LANDLORD_CONFIRMED（房东已确认，待管理员审核）、SUCCESS（已完成）、REJECTED（已拒绝）、REFUNDED（已退款）
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    /**
     * 支付方式：WECHAT（微信）、ALIPAY（支付宝）
     */
    @Column(name = "payment_channel", length = 20)
    private String paymentChannel;

    /**
     * 审核备注
     */
    @Column(name = "review_note", length = 500)
    private String reviewNote;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 支付类型常量
     */
    public static final String TYPE_DEPOSIT = "DEPOSIT";
    public static final String TYPE_RENT = "RENT";

    /**
     * 状态常量
     */
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_LANDLORD_CONFIRMED = "LANDLORD_CONFIRMED";
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_REFUNDED = "REFUNDED";

    /**
     * 支付渠道常量
     */
    public static final String CHANNEL_WECHAT = "WECHAT";
    public static final String CHANNEL_ALIPAY = "ALIPAY";
}
