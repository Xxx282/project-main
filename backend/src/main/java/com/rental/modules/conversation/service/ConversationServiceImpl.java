package com.rental.modules.conversation.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.ResultCode;
import com.rental.modules.conversation.entity.Conversation;
import com.rental.modules.conversation.entity.Message;
import com.rental.modules.conversation.repository.ConversationRepository;
import com.rental.modules.conversation.repository.MessageRepository;
import com.rental.modules.property.entity.Property;
import com.rental.modules.property.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 对话服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PropertyRepository propertyRepository;

    @Override
    @Transactional
    public Conversation getOrCreateConversation(Long propertyId, Long tenantId, Long landlordId) {
        log.info("获取或创建对话: propertyId={}, tenantId={}, landlordId={}", propertyId, tenantId, landlordId);

        // 验证房源是否存在
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(ResultCode.PROPERTY_NOT_FOUND));

        // 查找是否已有对话
        return conversationRepository.findByPropertyIdAndTenantId(propertyId, tenantId)
                .orElseGet(() -> {
                    // 创建新对话
                    Conversation conversation = Conversation.builder()
                            .propertyId(propertyId)
                            .tenantId(tenantId)
                            .landlordId(landlordId)
                            .status(Conversation.ConversationStatus.active)
                            .unreadTenantCount(0)
                            .unreadLandlordCount(0)
                            .build();
                    return conversationRepository.save(conversation);
                });
    }

    @Override
    @Transactional
    public Conversation sendFirstMessage(Long propertyId, Long tenantId, Long landlordId, String message) {
        log.info("发送第一条消息: propertyId={}, tenantId={}", propertyId, tenantId);

        // 获取或创建对话
        Conversation conversation = getOrCreateConversation(propertyId, tenantId, landlordId);

        // 创建消息
        Message msg = Message.builder()
                .conversationId(conversation.getId())
                .senderId(tenantId)
                .senderRole(Message.SenderRole.tenant)
                .content(message)
                .isRead(false)
                .build();
        messageRepository.save(msg);

        // 更新对话的最后消息
        String preview = message.length() > 500 ? message.substring(0, 500) : message;
        conversation.setLastMessage(preview);
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setUnreadLandlordCount(conversation.getUnreadLandlordCount() + 1);

        return conversationRepository.save(conversation);
    }

    @Override
    public Page<Conversation> getLandlordConversations(Long landlordId, Conversation.ConversationStatus status, Pageable pageable) {
        if (status != null) {
            return conversationRepository.findByLandlordIdAndStatusOrderByLastMessageAtDesc(landlordId, status, pageable);
        }
        return conversationRepository.findByLandlordIdOrderByLastMessageAtDesc(landlordId, pageable);
    }

    @Override
    public Page<Conversation> getTenantConversations(Long tenantId, Conversation.ConversationStatus status, Pageable pageable) {
        if (status != null) {
            return conversationRepository.findByTenantIdAndStatusOrderByLastMessageAtDesc(tenantId, status, pageable);
        }
        return conversationRepository.findByTenantIdOrderByLastMessageAtDesc(tenantId, pageable);
    }

    @Override
    public List<Conversation> getLandlordConversations(Long landlordId) {
        return conversationRepository.findByLandlordIdOrderByLastMessageAtDesc(landlordId);
    }

    @Override
    public List<Conversation> getTenantConversations(Long tenantId) {
        return conversationRepository.findByTenantIdOrderByLastMessageAtDesc(tenantId);
    }

    @Override
    public Conversation getConversationById(Long conversationId, Long userId) {
        return conversationRepository.findByIdAndParticipantId(conversationId, userId)
                .orElseThrow(() -> new BusinessException(ResultCode.CONVERSATION_NOT_FOUND));
    }

    @Override
    @Transactional
    public Conversation closeConversation(Long conversationId, Long userId) {
        Conversation conversation = getConversationById(conversationId, userId);
        conversation.setStatus(Conversation.ConversationStatus.closed);
        return conversationRepository.save(conversation);
    }

    @Override
    @Transactional
    public void markAsRead(Long conversationId, Long userId) {
        Conversation conversation = getConversationById(conversationId, userId);

        // 判断用户是房东还是租客
        if (conversation.getLandlordId().equals(userId)) {
            // 房东标记为已读
            messageRepository.markAllAsRead(conversationId);
            conversationRepository.markLandlordMessagesAsRead(conversationId);
            conversation.setUnreadLandlordCount(0);
            conversationRepository.save(conversation);
        } else {
            // 租客标记为已读
            messageRepository.markAllAsRead(conversationId);
            conversationRepository.markTenantMessagesAsRead(conversationId);
            conversation.setUnreadTenantCount(0);
            conversationRepository.save(conversation);
        }
    }

    @Override
    public long getUnreadCount(Long userId, String role) {
        if ("landlord".equals(role)) {
            return conversationRepository.countUnreadByLandlordId(userId);
        } else {
            return conversationRepository.countUnreadByTenantId(userId);
        }
    }

    @Override
    @Transactional
    public void updateLastMessage(Long conversationId, String lastMessage) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new BusinessException(ResultCode.CONVERSATION_NOT_FOUND));

        String preview = lastMessage.length() > 500 ? lastMessage.substring(0, 500) : lastMessage;
        conversation.setLastMessage(preview);
        conversation.setLastMessageAt(LocalDateTime.now());

        conversationRepository.save(conversation);
    }

    @Override
    public long getTodayConversationCount() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        return conversationRepository.countTodayConversations(startOfDay);
    }
}
