package com.rental.modules.conversation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 对话实体
 * 表示房东与租客之间关于某个房源的对话
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    /**
     * 房源标题，通过 SQL 子查询获取
     */
    @Formula("(SELECT p.title FROM properties p WHERE p.id = property_id)")
    private String propertyTitle;

    @Column(name = "landlord_id", nullable = false)
    private Long landlordId;

    /**
     * 房东用户名，通过 SQL 子查询获取
     */
    @Formula("(SELECT u.username FROM users u WHERE u.id = landlord_id)")
    private String landlordUsername;

    /**
     * 房东真实姓名
     */
    @Formula("(SELECT u.real_name FROM users u WHERE u.id = landlord_id)")
    private String landlordRealName;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    /**
     * 租客用户名，通过 SQL 子查询获取
     */
    @Formula("(SELECT u.username FROM users u WHERE u.id = tenant_id)")
    private String tenantUsername;

    /**
     * 租客真实姓名
     */
    @Formula("(SELECT u.real_name FROM users u WHERE u.id = tenant_id)")
    private String tenantRealName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.active;

    /**
     * 最后一条消息预览（最多500字符）
     */
    @Column(name = "last_message", length = 500)
    private String lastMessage;

    /**
     * 最后消息时间
     */
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    /**
     * 租客未读消息数
     */
    @Column(name = "unread_tenant_count", nullable = false)
    @Builder.Default
    private Integer unreadTenantCount = 0;

    /**
     * 房东未读消息数
     */
    @Column(name = "unread_landlord_count", nullable = false)
    @Builder.Default
    private Integer unreadLandlordCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 对话状态枚举
     */
    public enum ConversationStatus {
        active,   // 进行中
        closed    // 已关闭
    }
}
