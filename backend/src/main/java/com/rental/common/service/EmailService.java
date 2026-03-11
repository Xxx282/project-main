package com.rental.common.service;

import com.rental.common.exception.BusinessException;
import com.rental.modules.contract.entity.RentalContract;
import com.rental.modules.payment.entity.PaymentOrder;
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

    /**
     * 发送合同签署通知邮件（给管理员/房东）
     */
    public void sendContractSignedEmail(String toEmail, String recipientName, RentalContract contract, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("【租房平台】租房合同已签署 - " + contract.getContractNo());
            message.setText(
                "您好 " + recipientName + "，\n\n" +
                "以下租房合同已由租客完成电子签名：\n\n" +
                body + "\n"
            );
            mailSender.send(message);
            log.info("合同通知邮件发送成功: to={}, contractNo={}", toEmail, contract.getContractNo());
        } catch (Exception e) {
            log.error("发送合同通知邮件失败: to={}, error={}", toEmail, e.getMessage());
            throw new BusinessException("合同通知邮件发送失败");
        }
    }

    /**
     * 发送支付订单待审核邮件（给管理员）
     */
    public void sendPaymentReviewEmail(String toEmail, String recipientName, PaymentOrder order, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(
                "您好 " + recipientName + "，\n\n" +
                body + "\n\n" +
                "请登录后台进行审核处理。\n\n" +
                "--- 租房平台"
            );
            mailSender.send(message);
            log.info("支付待审核邮件发送成功: to={}, orderNo={}", toEmail, order.getOrderNo());
        } catch (Exception e) {
            log.error("发送支付待审核邮件失败: to={}, error={}", toEmail, e.getMessage());
        }
    }

    /**
     * 发送支付状态通知邮件（给房东/租客）
     */
    public void sendPaymentStatusEmail(String toEmail, String recipientName, PaymentOrder order, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(
                "您好 " + recipientName + "，\n\n" +
                body + "\n\n" +
                "--- 租房平台"
            );
            mailSender.send(message);
            log.info("支付状态通知邮件发送成功: to={}, orderNo={}", toEmail, order.getOrderNo());
        } catch (Exception e) {
            log.error("发送支付状态通知邮件失败: to={}, error={}", toEmail, e.getMessage());
        }
    }
}
