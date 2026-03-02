package com.rental.modules.inquiry.controller;

import com.rental.common.Result;
import com.rental.common.ResultCode;
import com.rental.modules.inquiry.entity.Inquiry;
import com.rental.modules.inquiry.service.InquiryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/inquiries")
@RequiredArgsConstructor
@Tag(name = "咨询管理", description = "房源咨询管理")
public class InquiryController {

    private final InquiryService inquiryService;

    /**
     * 创建咨询
     */
    @PostMapping
    @PreAuthorize("hasRole('tenant')")
    @Operation(summary = "提交咨询")
    public ResponseEntity<Result<Inquiry>> createInquiry(
            @Valid @RequestBody CreateInquiryRequest request,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("提交咨询: userId={}, listingId={}", userId, request.getListingId());

        Inquiry inquiry = inquiryService.createInquiry(
                request.getListingId(), userId, request.getMessage());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Result.success(inquiry));
    }

    /**
     * 回复咨询
     */
    @PostMapping("/{id}/reply")
    @PreAuthorize("hasRole('landlord')")
    @Operation(summary = "回复咨询")
    public ResponseEntity<Result<Inquiry>> replyToInquiry(
            @PathVariable Long id,
            @Valid @RequestBody ReplyRequest request,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        log.info("回复咨询: inquiryId={}, userId={}", id, userId);

        Inquiry inquiry = inquiryService.replyToInquiry(id, request.getReply());

        return ResponseEntity.ok(Result.success(inquiry));
    }

    /**
     * 关闭咨询
     */
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('landlord', 'tenant')")
    @Operation(summary = "关闭咨询")
    public ResponseEntity<Result<Inquiry>> closeInquiry(@PathVariable Long id) {
        Inquiry inquiry = inquiryService.closeInquiry(id);
        return ResponseEntity.ok(Result.success(inquiry));
    }

    /**
     * 获取当前用户的咨询（租客视角）
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('tenant')")
    @Operation(summary = "获取我的咨询列表")
    public ResponseEntity<Result<List<Inquiry>>> getMyInquiries(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<Inquiry> inquiries = inquiryService.findByTenantId(userId);
        return ResponseEntity.ok(Result.success(inquiries));
    }

    /**
     * 获取房东的咨询列表
     */
    @GetMapping("/landlord")
    @PreAuthorize("hasRole('landlord')")
    @Operation(summary = "获取收到的咨询列表")
    public ResponseEntity<Result<List<Inquiry>>> getLandlordInquiries(
            HttpServletRequest request,
            @RequestParam(required = false) String status) {
        Long userId = (Long) request.getAttribute("userId");
        List<Inquiry> inquiries;
        if (status != null && !status.isEmpty()) {
            inquiries = inquiryService.findByLandlordIdAndStatus(
                    userId, Inquiry.InquiryStatus.valueOf(status));
        } else {
            inquiries = inquiryService.findByLandlordId(userId);
        }
        return ResponseEntity.ok(Result.success(inquiries));
    }

    /**
     * 根据咨询ID获取详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取咨询详情")
    public ResponseEntity<Result<Inquiry>> getInquiryById(@PathVariable Long id) {
        Inquiry inquiry = inquiryService.findById(id);
        if (inquiry == null) {
            return ResponseEntity.ok(Result.error(ResultCode.INQUIRY_NOT_FOUND));
        }
        return ResponseEntity.ok(Result.success(inquiry));
    }

    /**
     * 请求类
     */
    @Data
    public static class CreateInquiryRequest {
        @NotNull(message = "房源ID不能为空")
        private Long listingId;
        @NotBlank(message = "咨询内容不能为空")
        private String message;
    }

    @Data
    public static class ReplyRequest {
        @NotBlank(message = "回复内容不能为空")
        private String reply;
    }
}
