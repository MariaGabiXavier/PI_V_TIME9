package com.sched.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sched.api.domain.Sale;
import com.sched.api.dto.response.DemandDataResponse;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findByProduct_Company_Id(Long companyId);

    @Query("""
        SELECT new com.sched.api.dto.response.DemandDataResponse(
            p.id,
            p.name,
            p.category,
            p.price,
            CAST(SUM(s.totalSold) AS integer),
            CAST(EXTRACT(MONTH FROM MAX(s.saleDate)) AS integer),
            COALESCE(SUM(st.quantity), 0)
        )
        FROM Sale s
        JOIN s.product p
        LEFT JOIN Stock st ON st.product.id = p.id
        WHERE p.company.id = :companyId
        GROUP BY
            p.id,
            p.name,
            p.category,
            p.price
    """)
    List<DemandDataResponse> getDemandDataByCompany(
            @Param("companyId") Long companyId
    );
}