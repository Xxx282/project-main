package com.rental.modules.contract.service;

import com.rental.common.exception.BusinessException;
import com.rental.common.service.EmailService;
import com.rental.modules.contract.dto.CreateContractRequest;
import com.rental.modules.contract.dto.SignContractRequest;
import com.rental.modules.contract.entity.RentalContract;
import com.rental.modules.contract.repository.RentalContractRepository;
import com.rental.modules.user.entity.UserEntity;
import com.rental.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

/**
 * 合同服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContractService {

    private final RentalContractRepository contractRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * 创建合同（租客发起，进入签署流程）
     */
    @Transactional
    public RentalContract createContract(Long tenantId, CreateContractRequest request) {
        log.info("创建租房合同: tenantId={}, propertyId={}", tenantId, request.getPropertyId());

        // 验证房东存在
        userRepository.findById(request.getLandlordId())
                .orElseThrow(() -> new BusinessException("房东不存在"));

        // 生成合同编号
        String contractNo = generateContractNo();

        RentalContract contract = RentalContract.builder()
                .contractNo(contractNo)
                .tenantId(tenantId)
                .landlordId(request.getLandlordId())
                .propertyId(request.getPropertyId())
                .monthlyRent(request.getMonthlyRent())
                .deposit(request.getDeposit())
                .leaseStart(request.getLeaseStart())
                .leaseEnd(request.getLeaseEnd())
                .status(RentalContract.STATUS_PENDING_SIGN)
                .build();

        contract = contractRepository.save(contract);
        log.info("合同创建成功: contractNo={}", contractNo);
        return contract;
    }

    /**
     * 签署合同（租客电子签名）
     */
    @Transactional
    public RentalContract signContract(Long tenantId, SignContractRequest request, String clientIp) {
        log.info("签署合同: contractId={}, tenantId={}", request.getContractId(), tenantId);

        RentalContract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new BusinessException("合同不存在"));

        if (!contract.getTenantId().equals(tenantId)) {
            throw new BusinessException("无权操作此合同");
        }

        if (RentalContract.STATUS_SIGNED.equals(contract.getStatus())) {
            throw new BusinessException("合同已签署");
        }

        contract.setTenantSignature(request.getSignature());
        contract.setSignedAt(LocalDateTime.now());
        contract.setTenantIp(clientIp);
        contract.setStatus(RentalContract.STATUS_SIGNED);

        contract = contractRepository.save(contract);
        log.info("合同签署成功: contractNo={}", contract.getContractNo());

        // 异步发送通知邮件给管理员和房东
        sendContractSignedNotifications(contract);

        return contract;
    }

    /**
     * 查询我的合同列表（租客）
     */
    public List<RentalContract> getMyContracts(Long tenantId) {
        return contractRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    /**
     * 查询我的合同列表（房东）
     */
    public List<RentalContract> getMyContractsAsLandlord(Long landlordId) {
        return contractRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId);
    }

    /**
     * 签署合同（房东电子签名）
     */
    @Transactional
    public RentalContract signContractAsLandlord(Long landlordId, SignContractRequest request, String clientIp) {
        log.info("房东签署合同: contractId={}, landlordId={}", request.getContractId(), landlordId);

        RentalContract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new BusinessException("合同不存在"));

        if (!contract.getLandlordId().equals(landlordId)) {
            throw new BusinessException("无权操作此合同");
        }

        if (RentalContract.STATUS_COMPLETED.equals(contract.getStatus())) {
            throw new BusinessException("合同已完成签署");
        }

        if (!RentalContract.STATUS_SIGNED.equals(contract.getStatus())) {
            throw new BusinessException("租客尚未签署合同");
        }

        contract.setLandlordSignature(request.getSignature());
        contract.setLandlordSignedAt(LocalDateTime.now());
        contract.setLandlordIp(clientIp);
        contract.setStatus(RentalContract.STATUS_COMPLETED);

        contract = contractRepository.save(contract);
        log.info("房东签署合同成功: contractNo={}", contract.getContractNo());

        // 发送通知给管理员和租客
        sendLandlordSignedNotifications(contract);

        return contract;
    }

    /**
     * 查询合同详情
     */
    public RentalContract getContractById(Long contractId, Long userId) {
        RentalContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new BusinessException("合同不存在"));
        // 仅当事人和管理员可查看
        if (!contract.getTenantId().equals(userId) && !contract.getLandlordId().equals(userId)) {
            // 管理员权限由 Controller 层控制
            throw new BusinessException("无权查看此合同");
        }
        return contract;
    }

    /**
     * 管理员查询所有合同
     */
    public List<RentalContract> getAllContracts() {
        return contractRepository.findAll();
    }

    /**
     * 发送合同签署通知
     */
    private void sendContractSignedNotifications(RentalContract contract) {
        try {
            // 查询管理员列表
            List<UserEntity> admins = userRepository.findByRole(UserEntity.UserRole.admin);

            String subject = "【租房平台】租房合同已签署 - " + contract.getContractNo();
            String body = buildNotificationBody(contract);

            // 发送给所有管理员
            for (UserEntity admin : admins) {
                try {
                    emailService.sendContractSignedEmail(admin.getEmail(), admin.getUsername(), contract, body);
                    log.info("合同通知已发送给管理员: email={}", admin.getEmail());
                } catch (Exception e) {
                    log.error("发送通知给管理员失败: email={}, err={}", admin.getEmail(), e.getMessage());
                }
            }

            // 发送给房东
            userRepository.findById(contract.getLandlordId()).ifPresent(landlord -> {
                try {
                    emailService.sendContractSignedEmail(landlord.getEmail(), landlord.getUsername(), contract, body);
                    log.info("合同通知已发送给房东: email={}", landlord.getEmail());
                } catch (Exception e) {
                    log.error("发送通知给房东失败: email={}, err={}", landlord.getEmail(), e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("发送合同签署通知失败: contractNo={}, err={}", contract.getContractNo(), e.getMessage());
        }
    }

    /**
     * 房东签署合同后，通知管理员和租客
     */
    private void sendLandlordSignedNotifications(RentalContract contract) {
        try {
            // 查询管理员列表
            List<UserEntity> admins = userRepository.findByRole(UserEntity.UserRole.admin);

            String subject = "【租房平台】租房合同已完成签署 - " + contract.getContractNo();
            String body = buildLandlordSignedBody(contract);

            // 发送给所有管理员
            for (UserEntity admin : admins) {
                try {
                    emailService.sendContractSignedEmail(admin.getEmail(), admin.getUsername(), contract, body);
                    log.info("房东签署通知已发送给管理员: email={}", admin.getEmail());
                } catch (Exception e) {
                    log.error("发送通知给管理员失败: email={}, err={}", admin.getEmail(), e.getMessage());
                }
            }

            // 发送给租客
            userRepository.findById(contract.getTenantId()).ifPresent(tenant -> {
                try {
                    emailService.sendContractSignedEmail(tenant.getEmail(), tenant.getUsername(), contract, body);
                    log.info("房东签署通知已发送给租客: email={}", tenant.getEmail());
                } catch (Exception e) {
                    log.error("发送通知给租客失败: email={}, err={}", tenant.getEmail(), e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("发送房东签署通知失败: contractNo={}, err={}", contract.getContractNo(), e.getMessage());
        }
    }

    /**
     * 构建房东签署通知邮件正文
     */
    private String buildLandlordSignedBody(RentalContract contract) {
        return String.format(
                "租房合同签署完成通知\n\n" +
                "合同编号：%s\n" +
                "房源：%s\n" +
                "地址：%s\n" +
                "租客：%s\n" +
                "房东：%s\n" +
                "月租金：¥%.2f\n" +
                "押金：¥%.2f\n" +
                "租期：%s 至 %s\n" +
                "房东签署时间：%s\n\n" +
                "合同双方已完成签署，正式生效。\n\n" +
                "--- 租房平台",
                contract.getContractNo(),
                contract.getPropertyTitle() != null ? contract.getPropertyTitle() : "-",
                contract.getPropertyAddress() != null ? contract.getPropertyAddress() : "-",
                contract.getTenantRealName() != null ? contract.getTenantRealName() : contract.getTenantUsername(),
                contract.getLandlordRealName() != null ? contract.getLandlordRealName() : contract.getLandlordUsername(),
                contract.getMonthlyRent(),
                contract.getDeposit(),
                contract.getLeaseStart(),
                contract.getLeaseEnd(),
                contract.getLandlordSignedAt() != null ? contract.getLandlordSignedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "-"
        );
    }

    /**
     * 构建通知邮件正文
     */
    private String buildNotificationBody(RentalContract contract) {
        return String.format(
                "租房合同签署通知\n\n" +
                "合同编号：%s\n" +
                "房源：%s\n" +
                "地址：%s\n" +
                "租客：%s\n" +
                "房东：%s\n" +
                "月租金：¥%.2f\n" +
                "押金：¥%.2f\n" +
                "租期：%s 至 %s\n" +
                "签署时间：%s\n\n" +
                "租客已完成电子签名，合同正式生效。\n\n" +
                "--- 租房平台",
                contract.getContractNo(),
                contract.getPropertyTitle() != null ? contract.getPropertyTitle() : "-",
                contract.getPropertyAddress() != null ? contract.getPropertyAddress() : "-",
                contract.getTenantRealName() != null ? contract.getTenantRealName() : contract.getTenantUsername(),
                contract.getLandlordRealName() != null ? contract.getLandlordRealName() : contract.getLandlordUsername(),
                contract.getMonthlyRent(),
                contract.getDeposit(),
                contract.getLeaseStart(),
                contract.getLeaseEnd(),
                contract.getSignedAt() != null ? contract.getSignedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "-"
        );
    }

    /**
     * 生成合同编号
     */
    private String generateContractNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "CONTRACT" + date + random;
    }
}


