package com.sched.api.repository;

import com.sched.api.domain.Sale;
import com.sched.api.dto.response.AiProductDataResponse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByProduct_DeletedFalse();

    List<Sale> findByProduct_Company_Id(Long companyId);

    @Query("""
        SELECT new com.sched.api.dto.response.AiProductDataResponse(
            p.name,
            p.category,
            COALESCE(SUM(st.quantity), 0),
            SUM(s.totalSold)
        )
        FROM Sale s
        JOIN s.product p
        LEFT JOIN Stock st ON st.product.id = p.id
        WHERE p.deleted = false
        GROUP BY p.id, p.name, p.category
    """)
    List<AiProductDataResponse> getDemandDataForAi();
}