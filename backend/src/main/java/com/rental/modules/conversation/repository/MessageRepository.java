package com.rental.modules.conversation.repository;

import com.rental.modules.conversation.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 消息仓储接口
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * 根据对话ID查找消息列表（按时间正序）
     */
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    /**
     * 根据对话ID查找消息列表（按时间倒序，分页用）
     */
    List<Message> findByConversationIdOrderByCreatedAtDesc(Long conversationId);

    /**
     * 查找对话中未读消息数量
     */
    long countByConversationIdAndIsReadFalse(Long conversationId);

    /**
     * 标记对话中所有消息为已读
     */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversationId = :conversationId AND m.isRead = false")
    void markAllAsRead(@Param("conversationId") Long conversationId);
}
