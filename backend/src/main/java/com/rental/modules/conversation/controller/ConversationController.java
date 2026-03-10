package com.rental.modules.conversation.controller;

import com.rental.common.Result;
import com.rental.modules.conversation.entity.Conversation;
import com.rental.modules.conversation.entity.Message;
import com.rental.modules.conversation.service.ConversationService;
import com.rental.modules.conversation.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 对话控制器
 * 提供对话和消息相关的 REST API
 */
@Slf4j
@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@Tag(name = "对话管理", description = "房东与租客之间的对话管理")
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    /**
     * 发起对话（租客发送第一条消息）
     */
    @PostMapping
    @PreAuthorize("hasRole('tenant')")
    @Operation(summary = "发起对话", description = "租客对房源发起咨询对话")
    public ResponseEntity<Result<Conversation>> createConversation(
            @Valid @RequestBody CreateConversationRequest request,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("role");

        log.info("发起对话: userId={}, propertyId={}", userId, request.getPropertyId());

        // 获取房源信息来确定房东ID
        // 这里通过服务层处理

        Conversation conversation = conversationService.sendFirstMessage(
                request.getPropertyId(),
                userId,
                request.getLandlordId(),
                request.getMessage()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Result.success(conversation));
    }

    /**
     * 获取房东的对话列表
     */
    @GetMapping("/landlord")
    @PreAuthorize("hasRole('landlord')")
    @Operation(summary = "获取房东的对话列表")
    public ResponseEntity<Result<Page<Conversation>>> getLandlordConversations(
            HttpServletRequest httpRequest,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) httpRequest.getAttribute("userId");

        Pageable pageable = PageRequest.of(page, size);
        Conversation.ConversationStatus conversationStatus = null;
        if (status != null && !status.isEmpty()) {
            conversationStatus = Conversation.ConversationStatus.valueOf(status);
        }

        Page<Conversation> conversations = conversationService.getLandlordConversations(
                userId, conversationStatus, pageable);

        return ResponseEntity.ok(Result.success(conversations));
    }

    /**
     * 获取租客的对话列表
     */
    @GetMapping("/tenant")
    @PreAuthorize("hasRole('tenant')")
    @Operation(summary = "获取租客的对话列表")
    public ResponseEntity<Result<Page<Conversation>>> getTenantConversations(
            HttpServletRequest httpRequest,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) httpRequest.getAttribute("userId");

        Pageable pageable = PageRequest.of(page, size);
        Conversation.ConversationStatus conversationStatus = null;
        if (status != null && !status.isEmpty()) {
            conversationStatus = Conversation.ConversationStatus.valueOf(status);
        }

        Page<Conversation> conversations = conversationService.getTenantConversations(
                userId, conversationStatus, pageable);

        return ResponseEntity.ok(Result.success(conversations));
    }

    /**
     * 获取对话详情（含消息历史）
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('landlord', 'tenant')")
    @Operation(summary = "获取对话详情")
    public ResponseEntity<Result<ConversationDetailResponse>> getConversationDetail(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");

        Conversation conversation = conversationService.getConversationById(id, userId);
        List<Message> messages = messageService.getMessagesByConversationId(id);

        ConversationDetailResponse response = new ConversationDetailResponse();
        response.setConversation(conversation);
        response.setMessages(messages);

        return ResponseEntity.ok(Result.success(response));
    }

    /**
     * 获取对话的消息列表
     */
    @GetMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('landlord', 'tenant')")
    @Operation(summary = "获取对话的消息列表")
    public ResponseEntity<Result<List<Message>>> getMessages(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");

        // 验证用户有权访问此对话
        conversationService.getConversationById(id, userId);

        List<Message> messages = messageService.getMessagesByConversationId(id);

        return ResponseEntity.ok(Result.success(messages));
    }

    /**
     * 发送消息
     */
    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('landlord', 'tenant')")
    @Operation(summary = "发送消息")
    public ResponseEntity<Result<Message>> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest requestBody,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("role");

        log.info("发送消息: conversationId={}, userId={}, role={}", id, userId, role);

        Message message = messageService.sendMessage(id, userId, role, requestBody.getContent());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Result.success(message));
    }

    /**
     * 标记消息为已读
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('landlord', 'tenant')")
    @Operation(summary = "标记消息为已读")
    public ResponseEntity<Result<Void>> markAsRead(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");

        conversationService.markAsRead(id, userId);

        return ResponseEntity.ok(Result.success(null));
    }

    /**
     * 关闭对话
     */
    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('landlord', 'tenant')")
    @Operation(summary = "关闭对话")
    public ResponseEntity<Result<Conversation>> closeConversation(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");

        Conversation conversation = conversationService.closeConversation(id, userId);

        return ResponseEntity.ok(Result.success(conversation));
    }

    /**
     * 获取当前用户的未读消息总数
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('landlord', 'tenant')")
    @Operation(summary = "获取未读消息数")
    public ResponseEntity<Result<Long>> getUnreadCount(HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("role");

        long count = conversationService.getUnreadCount(userId, role);

        return ResponseEntity.ok(Result.success(count));
    }

    // ==================== 请求类 ====================

    @Data
    public static class CreateConversationRequest {
        @NotNull(message = "房源ID不能为空")
        private Long propertyId;

        @NotNull(message = "房东ID不能为空")
        private Long landlordId;

        @NotBlank(message = "消息内容不能为空")
        private String message;
    }

    @Data
    public static class SendMessageRequest {
        @NotBlank(message = "消息内容不能为空")
        private String content;
    }

    @Data
    public static class ConversationDetailResponse {
        private Conversation conversation;
        private List<Message> messages;
    }
}
