package com.rental.modules.conversation.service;

import com.rental.modules.conversation.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 对话服务接口
 */
public interface ConversationService {

    /**
     * 创建或获取已有对话
     * 如果租客与该房源已有对话，则返回已有对话；否则创建新对话
     */
    Conversation getOrCreateConversation(Long propertyId, Long tenantId, Long landlordId);

    /**
     * 发送消息（创建对话时发送第一条消息）
     */
    Conversation sendFirstMessage(Long propertyId, Long tenantId, Long landlordId, String message);

    /**
     * 房东获取对话列表
     */
    Page<Conversation> getLandlordConversations(Long landlordId, Conversation.ConversationStatus status, Pageable pageable);

    /**
     * 租客获取对话列表
     */
    Page<Conversation> getTenantConversations(Long tenantId, Conversation.ConversationStatus status, Pageable pageable);

    /**
     * 获取所有对话（不分页，用于列表展示）
     */
    List<Conversation> getLandlordConversations(Long landlordId);

    /**
     * 获取所有对话（不分页，用于列表展示）
     */
    List<Conversation> getTenantConversations(Long tenantId);

    /**
     * 根据ID获取对话详情
     */
    Conversation getConversationById(Long conversationId, Long userId);

    /**
     * 关闭对话
     */
    Conversation closeConversation(Long conversationId, Long userId);

    /**
     * 标记消息为已读
     */
    void markAsRead(Long conversationId, Long userId);

    /**
     * 统计未读消息数
     */
    long getUnreadCount(Long userId, String role);

    /**
     * 更新对话的最后消息
     */
    void updateLastMessage(Long conversationId, String lastMessage);

    /**
     * 统计今日对话数（用于管理员仪表盘）
     */
    long getTodayConversationCount();
}
