package com.sched.api.repository;

import com.sched.api.domain.Stock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findById(Long id);
    List<Stock> findByProductIdOrderByExpirationDateAsc(Long productId);
}
