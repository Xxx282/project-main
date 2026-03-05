package com.rental.modules.payment.repository;

import com.rental.modules.payment.entity.PaymentOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    /**
     * 根据订单号查找
     */
    Optional<PaymentOrder> findByOrderNo(String orderNo);

    /**
     * 查找用户作为支付者的订单
     */
    Page<PaymentOrder> findByPayerId(Long payerId, Pageable pageable);

    /**
     * 查找用户作为收款者的订单
     */
    Page<PaymentOrder> findByPayeeId(Long payeeId, Pageable pageable);

    /**
     * 查找待审核的订单（管理员）
     */
    Page<PaymentOrder> findByStatus(String status, Pageable pageable);

    /**
     * 统计待审核订单数量
     */
    long countByStatus(String status);

    /**
     * 查找用户的所有订单（作为支付者或收款者）
     */
    @Query("SELECT p FROM PaymentOrder p WHERE p.payerId = :userId OR p.payeeId = :userId ORDER BY p.createdAt DESC")
    List<PaymentOrder> findByUserId(@Param("userId") Long userId);

    /**
     * 查找用户的所有订单（分页）
     */
    @Query("SELECT p FROM PaymentOrder p WHERE p.payerId = :userId OR p.payeeId = :userId ORDER BY p.createdAt DESC")
    Page<PaymentOrder> findByUserIdPage(@Param("userId") Long userId, Pageable pageable);
}
