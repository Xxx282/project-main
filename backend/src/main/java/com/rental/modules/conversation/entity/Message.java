package com.rental.modules.conversation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;

import java.time.LocalDateTime;

/**
 * 消息实体
 * 表示对话中的每一条消息
 */
@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    /**
     * 发送者用户名，通过 SQL 子查询获取
     */
    @Formula("(SELECT u.username FROM users u WHERE u.id = sender_id)")
    private String senderUsername;

    /**
     * 发送者真实姓名
     */
    @Formula("(SELECT u.real_name FROM users u WHERE u.id = sender_id)")
    private String senderRealName;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false, length = 20)
    private SenderRole senderRole;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 是否已读: 0-未读, 1-已读
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 发送者角色枚举
     */
    public enum SenderRole {
        tenant,    // 租客
        landlord   // 房东
    }
}
