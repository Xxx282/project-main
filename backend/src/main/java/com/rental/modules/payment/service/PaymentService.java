package com.rental.modules.payment.service;

import com.rental.common.exception.BusinessException;
import com.rental.modules.payment.dto.CreatePaymentRequest;
import com.rental.modules.payment.dto.ReviewPaymentRequest;
import com.rental.modules.payment.entity.PaymentOrder;
import com.rental.modules.payment.repository.PaymentOrderRepository;
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
import java.util.Random;
import java.util.UUID;

/**
 * 支付服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final UserRepository userRepository;

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

        return order;
    }

    /**
     * 获取我的订单（作为支付者或收款者）
     */
    public Page<PaymentOrder> getMyOrders(Long userId, Pageable pageable) {
        return paymentOrderRepository.findByUserIdPage(userId, pageable);
    }

    /**
     * 获取订单详情
     */
    public PaymentOrder getOrderById(Long orderId) {
        return paymentOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("订单不存在"));
    }

    /**
     * 管理员获取所有待审核订单
     */
    public Page<PaymentOrder> getPendingOrders(Pageable pageable) {
        return paymentOrderRepository.findByStatus(PaymentOrder.STATUS_PENDING, pageable);
    }

    /**
     * 管理员获取所有订单
     */
    public Page<PaymentOrder> getAllOrders(Pageable pageable) {
        return paymentOrderRepository.findAll(pageable);
    }

    /**
     * 审核订单（同意/拒绝/退款）
     */
    @Transactional
    public PaymentOrder reviewOrder(Long reviewerId, ReviewPaymentRequest request) {
        log.info("审核支付订单: orderId={}, action={}, reviewerId={}",
                request.getOrderId(), request.getAction(), reviewerId);

        PaymentOrder order = getOrderById(request.getOrderId());

        // 检查订单状态
        if (!order.getStatus().equals(PaymentOrder.STATUS_PENDING)) {
            throw new BusinessException("只能审核待处理的订单");
        }

        String action = request.getAction().toUpperCase();
        LocalDateTime now = LocalDateTime.now();

        switch (action) {
            case "APPROVE":
                // 同意支付
                order.setStatus(PaymentOrder.STATUS_SUCCESS);
                order.setPaidAt(now);
                // 生成模拟交易号
                order.setTransactionId(generateTransactionId(order.getPaymentChannel()));
                break;
            case "REJECT":
                // 拒绝支付
                order.setStatus(PaymentOrder.STATUS_REJECTED);
                break;
            case "REFUND":
                // 退款（只能对已支付的订单操作）
                if (!order.getStatus().equals(PaymentOrder.STATUS_SUCCESS)) {
                    throw new BusinessException("只能对已支付的订单进行退款");
                }
                order.setStatus(PaymentOrder.STATUS_REFUNDED);
                break;
            default:
                throw new BusinessException("无效的审核操作");
        }

        order.setReviewerId(reviewerId);
        order.setReviewedAt(now);
        order.setReviewNote(request.getNote());

        order = paymentOrderRepository.save(order);
        log.info("订单审核完成: orderNo={}, status={}", order.getOrderNo(), order.getStatus());

        return order;
    }

    /**
     * 统计待审核数量
     */
    public long countPendingOrders() {
        return paymentOrderRepository.countByStatus(PaymentOrder.STATUS_PENDING);
    }

    /**
     * 生成订单号
     */
    private String generateOrderNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "PAY" + date + random;
    }

    /**
     * 生成模拟交易号
     */
    private String generateTransactionId(String channel) {
        String prefix = channel.equals(PaymentOrder.CHANNEL_WECHAT) ? "WX" : "ALI";
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return prefix + timestamp + random;
    }
}
