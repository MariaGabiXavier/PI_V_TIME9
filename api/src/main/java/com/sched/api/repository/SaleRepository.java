package com.sched.api.repository;

import com.sched.api.domain.Sale;
import com.sched.api.dto.response.AiProductDataResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByProduct_DeletedFalse();

    @Query("""
    SELECT new com.sched.api.dto.response.AiProductDataResponse(
        p.name,
        p.category,
        COALESCE(SUM(st.quantity), 0),
        COALESCE(SUM(s.totalSold), 0)
    )
    FROM Sale s
    JOIN s.product p
    LEFT JOIN Stock st ON st.product.id = p.id
    GROUP BY p.name, p.category
    """)
        List<AiProductDataResponse> getAiProductData();
}