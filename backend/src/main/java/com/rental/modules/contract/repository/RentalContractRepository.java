package com.rental.modules.contract.repository;

import com.rental.modules.contract.entity.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 租房合同仓储
 */
@Repository
public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {

    /**
     * 根据租客ID查询合同列表
     */
    List<RentalContract> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    /**
     * 根据房东ID查询合同列表
     */
    List<RentalContract> findByLandlordIdOrderByCreatedAtDesc(Long landlordId);

    /**
     * 根据房源ID和租客ID查询最新未签合同
     */
    Optional<RentalContract> findTopByPropertyIdAndTenantIdAndStatusOrderByCreatedAtDesc(
            Long propertyId, Long tenantId, String status);

    /**
     * 根据合同编号查询
     */
    Optional<RentalContract> findByContractNo(String contractNo);
}


