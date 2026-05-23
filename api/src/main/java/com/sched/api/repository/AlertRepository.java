package com.sched.api.repository;


import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sched.api.domain.Stock;

public interface AlertRepository extends JpaRepository<Stock, Long> {
    List<Stock> findByExpirationDateBetweenAndProduct_Company_IdAndProduct_DeletedFalse(
            LocalDateTime startDate,
            LocalDateTime endDate,
            Long companyId
    );

    List<Stock> findByProduct_Company_IdAndProduct_DeletedFalse(Long companyId);

    List<Stock> findByQuantityLessThanEqualAndProduct_Company_IdAndProduct_DeletedFalse(
        Integer quantity,
        Long companyId
    );
}
