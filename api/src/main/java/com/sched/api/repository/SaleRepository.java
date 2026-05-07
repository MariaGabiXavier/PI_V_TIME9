package com.sched.api.repository;

import com.sched.api.domain.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByProduct_DeletedFalse();
}