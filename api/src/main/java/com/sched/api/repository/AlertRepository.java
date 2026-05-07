package com.sched.api.repository;


import com.sched.api.domain.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertRepository extends JpaRepository<Stock, Long> {
    List<Stock> findByExpirationDateBetween(
            LocalDateTime startDate,
            LocalDateTime endDate
    );
}
