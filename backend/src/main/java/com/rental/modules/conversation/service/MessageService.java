package com.rental.modules.conversation.service;

import com.rental.modules.conversation.entity.Message;

import java.util.List;

/**
 * 消息服务接口
 */
public interface MessageService {

    /**
     * 发送消息
     */
    Message sendMessage(Long conversationId, Long senderId, String senderRole, String content);

    /**
     * 获取对话的所有消息（按时间正序）
     */
    List<Message> getMessagesByConversationId(Long conversationId);

    /**
     * 根据ID获取消息
     */
    Message getMessageById(Long messageId);

    /**
     * 统计对话的未读消息数
     */
    long getUnreadCount(Long conversationId);
}
