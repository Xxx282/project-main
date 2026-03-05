package com.rental.common.service;

import com.rental.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 邮件服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    /**
     * 发送邮箱验证码
     */
    public void sendVerificationEmail(String toEmail, String username, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("【租房平台】邮箱验证");
            message.setText(String.format(
                "您好 %s，\n\n" +
                "您的邮箱验证码是：%s\n" +
                "验证码有效期为 10 分钟，请尽快完成验证。\n\n" +
                "如果不是您本人操作，请忽略此邮件。\n\n" +
                "--- 租房平台",
                username, code
            ));
            
            mailSender.send(message);
            log.info("验证码邮件发送成功: to={}", toEmail);
        } catch (Exception e) {
            log.error("发送验证码邮件失败: to={}, error={}", toEmail, e.getMessage());
            throw new BusinessException("邮件发送失败，请稍后重试");
        }
    }
}
