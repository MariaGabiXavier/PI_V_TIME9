package com.sched.api.repository;

import com.sched.api.domain.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByIdAndProduct_DeletedFalse(Long id);
    List<Stock> findByProductIdAndProduct_DeletedFalseOrderByExpirationDateAsc(Long productId);
    List<Stock> findByProduct_Company_IdAndProduct_DeletedFalse(Long companyId);
    boolean existsByProductIdAndQuantityGreaterThanAndProduct_DeletedFalse(Long productId, Integer quantity);

}
