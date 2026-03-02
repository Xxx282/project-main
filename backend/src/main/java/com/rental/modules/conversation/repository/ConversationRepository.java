package com.rental.modules.conversation.repository;

import com.rental.modules.conversation.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 对话仓储接口
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * 根据房源ID和租客ID查找对话（用于判断是否已存在对话）
     */
    Optional<Conversation> findByPropertyIdAndTenantId(Long propertyId, Long tenantId);

    /**
     * 房东获取所有对话列表
     */
    Page<Conversation> findByLandlordIdOrderByLastMessageAtDesc(Long landlordId, Pageable pageable);

    /**
     * 房东获取对话列表（可按状态筛选）
     */
    Page<Conversation> findByLandlordIdAndStatusOrderByLastMessageAtDesc(Long landlordId, Conversation.ConversationStatus status, Pageable pageable);

    /**
     * 租客获取所有对话列表
     */
    Page<Conversation> findByTenantIdOrderByLastMessageAtDesc(Long tenantId, Pageable pageable);

    /**
     * 租客获取对话列表（可按状态筛选）
     */
    Page<Conversation> findByTenantIdAndStatusOrderByLastMessageAtDesc(Long tenantId, Conversation.ConversationStatus status, Pageable pageable);

    /**
     * 查找某个房东的所有对话（不分页，用于列表展示）
     */
    List<Conversation> findByLandlordIdOrderByLastMessageAtDesc(Long landlordId);

    /**
     * 查找某个租客的所有对话（不分页，用于列表展示）
     */
    List<Conversation> findByTenantIdOrderByLastMessageAtDesc(Long tenantId);

    /**
     * 根据ID和用户ID查找对话详情（同时验证用户是对话的参与方）
     */
    @Query("SELECT c FROM Conversation c WHERE c.id = :id AND (c.landlordId = :userId OR c.tenantId = :userId)")
    Optional<Conversation> findByIdAndParticipantId(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * 统计房东的未读消息总数
     */
    @Query("SELECT COALESCE(SUM(c.unreadLandlordCount), 0) FROM Conversation c WHERE c.landlordId = :landlordId")
    long countUnreadByLandlordId(@Param("landlordId") Long landlordId);

    /**
     * 统计租客的未读消息总数
     */
    @Query("SELECT COALESCE(SUM(c.unreadTenantCount), 0) FROM Conversation c WHERE c.tenantId = :tenantId")
    long countUnreadByTenantId(@Param("tenantId") Long tenantId);

    /**
     * 统计今日新增对话数
     */
    @Query("SELECT COUNT(c) FROM Conversation c WHERE c.createdAt >= :startOfDay")
    long countTodayConversations(@Param("startOfDay") LocalDateTime startOfDay);

    /**
     * 更新房东未读数
     */
    @Modifying
    @Query("UPDATE Conversation c SET c.unreadLandlordCount = 0 WHERE c.id = :conversationId")
    void markLandlordMessagesAsRead(@Param("conversationId") Long conversationId);

    /**
     * 更新租客未读数
     */
    @Modifying
    @Query("UPDATE Conversation c SET c.unreadTenantCount = 0 WHERE c.id = :conversationId")
    void markTenantMessagesAsRead(@Param("conversationId") Long conversationId);
}
