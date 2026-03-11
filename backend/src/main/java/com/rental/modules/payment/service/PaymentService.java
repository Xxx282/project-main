package com.rental.modules.payment.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.service.EmailService;
import com.rental.modules.payment.dto.CreatePaymentRequest;
import com.rental.modules.payment.dto.ReviewPaymentRequest;
import com.rental.modules.payment.entity.PaymentOrder;
import com.rental.modules.payment.repository.PaymentOrderRepository;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.repository.PropertyRepository;
import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

/**
 * 支付服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final EmailService emailService;

    /**
     * 创建支付订单
     */
    @Transactional
    public PaymentOrder createPaymentOrder(Long payerId, CreatePaymentRequest request) {
        log.info("创建支付订单: payerId={}, payeeId={}, type={}, amount={}",
                payerId, request.getPayeeId(), request.getPaymentType(), request.getAmount());

        // 验证收款人存在
        UserEntity payee = userRepository.findById(request.getPayeeId())
                .orElseThrow(() -> new BusinessException("收款人不存在"));

        // 验证支付类型
        String paymentType = request.getPaymentType().toUpperCase();
        if (!paymentType.equals(PaymentOrder.TYPE_DEPOSIT) && !paymentType.equals(PaymentOrder.TYPE_RENT)) {
            throw new BusinessException("支付类型只能是 DEPOSIT 或 RENT");
        }

        // 验证支付渠道
        String channel = request.getPaymentChannel().toUpperCase();
        if (!channel.equals(PaymentOrder.CHANNEL_WECHAT) && !channel.equals(PaymentOrder.CHANNEL_ALIPAY)) {
            throw new BusinessException("支付渠道只能是 WECHAT 或 ALIPAY");
        }

        // 生成订单号
        String orderNo = generateOrderNo();

        // 创建订单
        PaymentOrder order = PaymentOrder.builder()
                .orderNo(orderNo)
                .payerId(payerId)
                .payeeId(request.getPayeeId())
                .propertyId(request.getPropertyId())
                .paymentType(paymentType)
                .amount(request.getAmount())
                .paymentChannel(channel)
                .status(PaymentOrder.STATUS_PENDING)
                .build();

        order = paymentOrderRepository.save(order);
        log.info("支付订单创建成功: orderNo={}", orderNo);

        // 将房源状态改为下架
        if (request.getPropertyId() != null) {
            propertyRepository.updateStatus(request.getPropertyId(), Property.PropertyStatus.offline);
            log.info("房源已下架: propertyId={}", request.getPropertyId());
        }

        return order;
    }

    /**
     * 获取我的订单（作为支付者或收款者）
     */
    public Page<PaymentOrder> getMyOrders(Long userId, Pageable pageable) {
        return paymentOrderRepository.findByUserIdPage(userId, pageable);
    }

    /**
     * 房东获取自己的订单（作为收款者）
     */
    public Page<PaymentOrder> getMyOrdersAsLandlord(Long landlordId, Pageable pageable) {
        return paymentOrderRepository.findByPayeeId(landlordId, pageable);
    }

    /**
     * 确认收款（房东确认支付）
     */
    @Transactional
    public PaymentOrder confirmPayment(Long landlordId, ReviewPaymentRequest request) {
        log.info("房东确认收款: orderId={}, action={}", request.getOrderId(), request.getAction());

        PaymentOrder order = getOrderById(request.getOrderId());

        // 验证是否是房东确认
        if (!order.getPayeeId().equals(landlordId)) {
            throw new BusinessException("无权操作此订单");
        }

        // 检查订单状态
        if (!order.getStatus().equals(PaymentOrder.STATUS_PENDING)) {
            throw new BusinessException("只能处理待处理的订单");
        }

        String action = request.getAction().toUpperCase();

        switch (action) {
            case "CONFIRM":
                // 房东确认收款，状态变为待管理员审核
                order.setStatus(PaymentOrder.STATUS_LANDLORD_CONFIRMED);
                order.setReviewNote(request.getNote());
                // 发送通知给管理员
                sendLandlordConfirmedNotification(order);
                break;
            case "REJECT":
                // 房东拒绝收款
                order.setStatus(PaymentOrder.STATUS_REJECTED);
                order.setReviewNote(request.getNote());
                // 发送通知给租客
                sendPaymentRejectedNotification(order);
                break;
            default:
                throw new BusinessException("无效的操作");
        }

        order = paymentOrderRepository.save(order);
        log.info("房东确认收款完成: orderNo={}, status={}", order.getOrderNo(), order.getStatus());

        return order;
    }

    /**
     * 获取订单详情
     */
    public PaymentOrder getOrderById(Long orderId) {
        return paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("订单不存在"));
    }

    /**
     * 管理员获取所有待审核订单（房东已确认、待管理员审核）
     */
    public Page<PaymentOrder> getPendingOrders(Pageable pageable) {
        return paymentOrderRepository.findByStatus(PaymentOrder.STATUS_LANDLORD_CONFIRMED, pageable);
    }

    /**
     * 管理员获取所有订单
     */
    public Page<PaymentOrder> getAllOrders(Pageable pageable) {
        return paymentOrderRepository.findAll(pageable);
    }

    /**
     * 审核订单（同意/拒绝/退款）- 管理员操作
     */
    @Transactional
    public PaymentOrder reviewOrder(ReviewPaymentRequest request) {
        log.info("管理员审核支付订单: orderId={}, action={}",
                request.getOrderId(), request.getAction());

        PaymentOrder order = getOrderById(request.getOrderId());

        // 检查订单状态：只能审核房东已确认的订单
        if (!order.getStatus().equals(PaymentOrder.STATUS_LANDLORD_CONFIRMED)) {
            throw new BusinessException("只能审核房东已确认的订单");
        }

        String action = request.getAction().toUpperCase();

        switch (action) {
            case "APPROVE":
                // 同意支付
                order.setStatus(PaymentOrder.STATUS_SUCCESS);
                // 发送通知给房东和租客
                sendPaymentApprovedNotification(order);
                break;
            case "REJECT":
                // 拒绝支付
                order.setStatus(PaymentOrder.STATUS_REJECTED);
                // 发送通知给房东和租客
                sendPaymentRejectedNotification(order);
                break;
            case "REFUND":
                // 退款（只能对已支付的订单操作）
                if (!order.getStatus().equals(PaymentOrder.STATUS_SUCCESS)) {
                    throw new BusinessException("只能对已支付的订单进行退款");
                }
                order.setStatus(PaymentOrder.STATUS_REFUNDED);
                sendPaymentRefundedNotification(order);
                break;
            default:
                throw new BusinessException("无效的审核操作");
        }

        order.setReviewNote(request.getNote());

        order = paymentOrderRepository.save(order);
        log.info("订单审核完成: orderNo={}, status={}", order.getOrderNo(), order.getStatus());

        return order;
    }

    /**
     * 统计待审核数量（房东已确认的订单）
     */
    public long countPendingOrders() {
        return paymentOrderRepository.countByStatus(PaymentOrder.STATUS_LANDLORD_CONFIRMED);
    }

    // ==================== 邮件通知方法 ====================

    /**
     * 房东确认收款后，通知管理员审核
     */
    private void sendLandlordConfirmedNotification(PaymentOrder order) {
        try {
            List<UserEntity> admins = userRepository.findByRole(UserEntity.UserRole.admin);
            String subject = "【租房平台】支付订单待审核 - " + order.getOrderNo();
            String body = buildOrderNotificationBody(order, "房东已确认收款，请审核");

            for (UserEntity admin : admins) {
                try {
                    emailService.sendPaymentReviewEmail(admin.getEmail(), admin.getUsername(), order, subject, body);
                    log.info("支付待审核通知已发送给管理员: email={}", admin.getEmail());
                } catch (Exception e) {
                    log.error("发送通知给管理员失败: email={}, err={}", admin.getEmail(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("发送房东确认通知失败: orderNo={}, err={}", order.getOrderNo(), e.getMessage());
        }
    }

    /**
     * 管理员审核通过后，通知房东和租客
     */
    private void sendPaymentApprovedNotification(PaymentOrder order) {
        try {
            // 通知房东
            userRepository.findById(order.getPayeeId()).ifPresent(landlord -> {
                try {
                    String subject = "【租房平台】支付订单已通过 - " + order.getOrderNo();
                    String body = buildOrderNotificationBody(order, "您的收款已通过审核");
                    emailService.sendPaymentStatusEmail(landlord.getEmail(), landlord.getUsername(), order, subject, body);
                    log.info("支付通过通知已发送给房东: email={}", landlord.getEmail());
                } catch (Exception e) {
                    log.error("发送通知给房东失败: email={}, err={}", landlord.getEmail(), e.getMessage());
                }
            });

            // 通知租客
            userRepository.findById(order.getPayerId()).ifPresent(tenant -> {
                try {
                    String subject = "【租房平台】支付成功 - " + order.getOrderNo();
                    String body = buildOrderNotificationBody(order, "您的支付已成功完成");
                    emailService.sendPaymentStatusEmail(tenant.getEmail(), tenant.getUsername(), order, subject, body);
                    log.info("支付成功通知已发送给租客: email={}", tenant.getEmail());
                } catch (Exception e) {
                    log.error("发送通知给租客失败: email={}, err={}", tenant.getEmail(), e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("发送支付通过通知失败: orderNo={}, err={}", order.getOrderNo(), e.getMessage());
        }
    }

    /**
     * 支付被拒绝后，通知房东和租客
     */
    private void sendPaymentRejectedNotification(PaymentOrder order) {
        try {
            // 通知房东
            userRepository.findById(order.getPayeeId()).ifPresent(landlord -> {
                try {
                    String subject = "【租房平台】支付订单被拒绝 - " + order.getOrderNo();
                    String body = buildOrderNotificationBody(order, "支付订单已被拒绝");
                    emailService.sendPaymentStatusEmail(landlord.getEmail(), landlord.getUsername(), order, subject, body);
                } catch (Exception e) {
                    log.error("发送通知给房东失败: email={}", landlord.getEmail(), e);
                }
            });

            // 通知租客
            userRepository.findById(order.getPayerId()).ifPresent(tenant -> {
                try {
                    String subject = "【租房平台】支付被拒绝 - " + order.getOrderNo();
                    String body = buildOrderNotificationBody(order, "您的支付被拒绝，请查看原因");
                    emailService.sendPaymentStatusEmail(tenant.getEmail(), tenant.getUsername(), order, subject, body);
                } catch (Exception e) {
                    log.error("发送通知给租客失败: email={}", tenant.getEmail(), e);
                }
            });
        } catch (Exception e) {
            log.error("发送支付拒绝通知失败: orderNo={}, err={}", order.getOrderNo(), e.getMessage());
        }
    }

    /**
     * 退款后通知
     */
    private void sendPaymentRefundedNotification(PaymentOrder order) {
        try {
            userRepository.findById(order.getPayerId()).ifPresent(tenant -> {
                try {
                    String subject = "【租房平台】已退款 - " + order.getOrderNo();
                    String body = buildOrderNotificationBody(order, "您的支付已退款");
                    emailService.sendPaymentStatusEmail(tenant.getEmail(), tenant.getUsername(), order, subject, body);
                } catch (Exception e) {
                    log.error("发送退款通知失败: email={}", tenant.getEmail(), e);
                }
            });
        } catch (Exception e) {
            log.error("发送退款通知失败: orderNo={}, err={}", order.getOrderNo(), e.getMessage());
        }
    }

    /**
     * 构建订单通知邮件正文
     */
    private String buildOrderNotificationBody(PaymentOrder order, String statusMessage) {
        String paymentType = PaymentOrder.TYPE_DEPOSIT.equals(order.getPaymentType()) ? "押金" : "月租";
        String status = order.getStatus();
        String statusText = switch (status) {
            case "PENDING" -> "待房东确认";
            case "LANDLORD_CONFIRMED" -> "待管理员审核";
            case "SUCCESS" -> "已完成";
            case "REJECTED" -> "已拒绝";
            case "REFUNDED" -> "已退款";
            default -> status;
        };

        return String.format(
                "%s\n\n" +
                "订单编号：%s\n" +
                "房源：%s\n" +
                "付款人：%s\n" +
                "收款人：%s\n" +
                "支付类型：%s\n" +
                "金额：¥%.2f\n" +
                "支付方式：%s\n" +
                "订单状态：%s\n" +
                "创建时间：%s\n" +
                "%s\n\n" +
                "--- 租房平台",
                statusMessage,
                order.getOrderNo(),
                order.getPropertyTitle() != null ? order.getPropertyTitle() : "-",
                order.getPayerRealName() != null ? order.getPayerRealName() : order.getPayerUsername(),
                order.getPayeeRealName() != null ? order.getPayeeRealName() : order.getPayeeUsername(),
                paymentType,
                order.getAmount(),
                "WECHAT".equals(order.getPaymentChannel()) ? "微信支付" : "支付宝",
                statusText,
                order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                order.getReviewNote() != null && !order.getReviewNote().isEmpty() ?
                        "备注：" + order.getReviewNote() : ""
        );
    }

    /**
     * 生成订单号
     */
    private String generateOrderNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "PAY" + date + random;
    }
}
