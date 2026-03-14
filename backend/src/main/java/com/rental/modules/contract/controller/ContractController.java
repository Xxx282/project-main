package com.rental.modules.contract.controller;

import com.rental.common.Result;
import com.rental.modules.contract.dto.CreateContractRequest;
import com.rental.modules.contract.dto.SignContractRequest;
import com.rental.modules.contract.entity.RentalContract;
import com.rental.modules.contract.service.ContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 租房合同控制器
 */
@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@Tag(name = "租房合同", description = "租房合同签署管理")
public class ContractController {

    private final ContractService contractService;

    /**
     * 创建合同（租客）
     */
    @PostMapping("/create")
    @Operation(summary = "创建租房合同")
    public ResponseEntity<Result<RentalContract>> createContract(
            HttpServletRequest request,
            @Valid @RequestBody CreateContractRequest createRequest) {
        Long tenantId = (Long) request.getAttribute("userId");
        RentalContract contract = contractService.createContract(tenantId, createRequest);
        return ResponseEntity.ok(Result.success(contract));
    }

    /**
     * 签署合同（租客电子签名）
     */
    @PostMapping("/sign")
    @Operation(summary = "签署合同（电子签名）")
    public ResponseEntity<Result<RentalContract>> signContract(
            HttpServletRequest request,
            @Valid @RequestBody SignContractRequest signRequest) {
        Long tenantId = (Long) request.getAttribute("userId");
        String clientIp = getClientIp(request);
        RentalContract contract = contractService.signContract(tenantId, signRequest, clientIp);
        return ResponseEntity.ok(Result.success(contract));
    }

    /**
     * 获取我的合同列表（租客）
     */
    @GetMapping("/my")
    @Operation(summary = "获取我的合同列表")
    public ResponseEntity<Result<List<RentalContract>>> getMyContracts(HttpServletRequest request) {
        Long tenantId = (Long) request.getAttribute("userId");
        List<RentalContract> contracts = contractService.getMyContracts(tenantId);
        return ResponseEntity.ok(Result.success(contracts));
    }

    /**
     * 获取合同详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取合同详情")
    public ResponseEntity<Result<RentalContract>> getContractById(
            @PathVariable Long id,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        RentalContract contract = contractService.getContractById(id, userId);
        return ResponseEntity.ok(Result.success(contract));
    }

    /**
     * 管理员获取所有合同
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "获取所有合同（管理员）")
    public ResponseEntity<Result<List<RentalContract>>> getAllContracts() {
        List<RentalContract> contracts = contractService.getAllContracts();
        return ResponseEntity.ok(Result.success(contracts));
    }

    /**
     * 获取我的合同列表（房东）
     */
    @GetMapping("/landlord/my")
    @PreAuthorize("hasRole('landlord')")
    @Operation(summary = "获取我的合同列表（房东）")
    public ResponseEntity<Result<List<RentalContract>>> getMyContractsAsLandlord(HttpServletRequest request) {
        Long landlordId = (Long) request.getAttribute("userId");
        List<RentalContract> contracts = contractService.getMyContractsAsLandlord(landlordId);
        return ResponseEntity.ok(Result.success(contracts));
    }

    /**
     * 签署合同（房东电子签名）
     */
    @PostMapping("/landlord/sign")
    @PreAuthorize("hasRole('landlord')")
    @Operation(summary = "房东签署合同")
    public ResponseEntity<Result<RentalContract>> signContractAsLandlord(
            HttpServletRequest request,
            @Valid @RequestBody SignContractRequest signRequest) {
        Long landlordId = (Long) request.getAttribute("userId");
        String clientIp = getClientIp(request);
        RentalContract contract = contractService.signContractAsLandlord(landlordId, signRequest, clientIp);
        return ResponseEntity.ok(Result.success(contract));
    }

    /**
     * 获取客户端IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}


