package com.rental.modules.payment.controller;

import com.rental.common.Result;
import com.rental.modules.payment.dto.CreatePaymentRequest;
import com.rental.modules.payment.dto.ReviewPaymentRequest;
import com.rental.modules.payment.entity.PaymentOrder;
import com.rental.modules.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 支付控制器
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "支付管理", description = "支付订单管理")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * 创建支付订单（租客）
     */
    @PostMapping("/create")
    @Operation(summary = "创建支付订单")
    public ResponseEntity<Result<PaymentOrder>> createPayment(
            HttpServletRequest request,
            @Valid @RequestBody CreatePaymentRequest createRequest) {
        Long userId = (Long) request.getAttribute("userId");
        PaymentOrder order = paymentService.createPaymentOrder(userId, createRequest);
        return ResponseEntity.ok(Result.success(order));
    }

    /**
     * 获取我的订单列表（租客/房东）
     */
    @GetMapping("/my")
    @Operation(summary = "获取我的订单")
    public ResponseEntity<Result<Page<PaymentOrder>>> getMyOrders(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Long userId = (Long) request.getAttribute("userId");
        Sort sort = sortDir.equalsIgnoreCase("asc") ?
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PaymentOrder> orders = paymentService.getMyOrders(userId, pageable);
        return ResponseEntity.ok(Result.success(orders));
    }

    /**
     * 获取订单详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取订单详情")
    public ResponseEntity<Result<PaymentOrder>> getOrderById(@PathVariable Long id) {
        PaymentOrder order = paymentService.getOrderById(id);
        return ResponseEntity.ok(Result.success(order));
    }

    /**
     * 房东获取自己的订单（作为收款者）
     */
    @GetMapping("/landlord/my")
    @PreAuthorize("hasRole('landlord')")
    @Operation(summary = "获取我的订单（房东）")
    public ResponseEntity<Result<Page<PaymentOrder>>> getMyOrdersAsLandlord(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long landlordId = (Long) request.getAttribute("userId");
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PaymentOrder> orders = paymentService.getMyOrdersAsLandlord(landlordId, pageable);
        return ResponseEntity.ok(Result.success(orders));
    }

    /**
     * 确认收款（房东）
     */
    @PostMapping("/landlord/confirm")
    @PreAuthorize("hasRole('landlord')")
    @Operation(summary = "房东确认收款")
    public ResponseEntity<Result<PaymentOrder>> confirmPayment(
            HttpServletRequest request,
            @Valid @RequestBody ReviewPaymentRequest reviewRequest) {
        Long landlordId = (Long) request.getAttribute("userId");
        PaymentOrder order = paymentService.confirmPayment(landlordId, reviewRequest);
        return ResponseEntity.ok(Result.success(order));
    }

    /**
     * 管理员获取待审核订单列表
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "获取待审核订单（管理员）")
    public ResponseEntity<Result<Page<PaymentOrder>>> getPendingOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PaymentOrder> orders = paymentService.getPendingOrders(pageable);
        return ResponseEntity.ok(Result.success(orders));
    }

    /**
     * 管理员获取所有订单
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "获取所有订单（管理员）")
    public ResponseEntity<Result<Page<PaymentOrder>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<PaymentOrder> orders;
        if (status != null && !status.isEmpty()) {
            orders = paymentService.getPendingOrders(pageable); // 简化：暂时复用
        } else {
            orders = paymentService.getAllOrders(pageable);
        }
        return ResponseEntity.ok(Result.success(orders));
    }

    /**
     * 审核订单（管理员）
     */
    @PostMapping("/admin/review")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "审核订单（同意/拒绝/退款）")
    public ResponseEntity<Result<PaymentOrder>> reviewOrder(
            @Valid @RequestBody ReviewPaymentRequest reviewRequest) {
        PaymentOrder order = paymentService.reviewOrder(reviewRequest);
        return ResponseEntity.ok(Result.success(order));
    }

    /**
     * 统计待审核订单数量
     */
    @GetMapping("/admin/pending-count")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "统计待审核订单数量")
    public ResponseEntity<Result<Map<String, Long>>> countPendingOrders() {
        long count = paymentService.countPendingOrders();
        return ResponseEntity.ok(Result.success(Map.of("count", count)));
    }
}
