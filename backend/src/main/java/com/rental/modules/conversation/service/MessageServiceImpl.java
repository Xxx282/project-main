package com.rental.modules.conversation.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.ResultCode;
import com.rental.modules.conversation.entity.Conversation;
import com.rental.modules.conversation.entity.Message;
import com.rental.modules.conversation.repository.ConversationRepository;
import com.rental.modules.conversation.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 消息服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    @Override
    @Transactional
    public Message sendMessage(Long conversationId, Long senderId, String senderRole, String content, byte[] imageData, String imageContentType) {
        boolean hasImage = imageData != null && imageData.length > 0;
        log.info("发送消息: conversationId={}, senderId={}, role={}, hasImage={}", conversationId, senderId, senderRole, hasImage);

        // 验证对话是否存在
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException(ResultCode.CONVERSATION_NOT_FOUND));

        // 验证对话是否处于活跃状态
        if (conversation.getStatus() == Conversation.ConversationStatus.closed) {
            throw new BusinessException(ResultCode.MESSAGE_SEND_ERROR, "对话已关闭，无法发送消息");
        }

        // 创建消息（图片存库，与文字共用接口）
        Message.MessageBuilder builder = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .senderRole(Message.SenderRole.valueOf(senderRole))
                .content(content)
                .isRead(false);
        if (hasImage) {
            builder.imageData(imageData).imageContentType(imageContentType != null ? imageContentType : "image/jpeg");
        }
        Message message = messageRepository.save(builder.build());

        // 更新对话的最后消息和未读数
        String preview = content;
        if (hasImage) {
            preview = "[图片] " + content;
        }
        if (preview.length() > 500) {
            preview = preview.substring(0, 500);
        }
        conversation.setLastMessage(preview);
        conversation.setLastMessageAt(LocalDateTime.now());

        // 根据发送者角色增加对应未读数
        if (Message.SenderRole.landlord.name().equals(senderRole)) {
            conversation.setUnreadTenantCount(conversation.getUnreadTenantCount() + 1);
        } else {
            conversation.setUnreadLandlordCount(conversation.getUnreadLandlordCount() + 1);
        }

        conversationRepository.save(conversation);

        return message;
    }

    @Override
    public List<Message> getMessagesByConversationId(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Override
    public Message getMessageById(Long messageId) {
        return messageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException(ResultCode.MESSAGE_SEND_ERROR, "消息不存在"));
    }

    @Override
    public long getUnreadCount(Long conversationId) {
        return messageRepository.countByConversationIdAndIsReadFalse(conversationId);
    }
}
