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
     * 根据房源ID、租客ID、房东ID查询已完成合同数量
     */
    long countByPropertyIdAndTenantIdAndLandlordIdAndStatus(
            Long propertyId, Long tenantId, Long landlordId, RentalContract.ContractStatus status);

    /**
     * 根据合同编号查询
     */
    Optional<RentalContract> findByContractNo(String contractNo);
}


