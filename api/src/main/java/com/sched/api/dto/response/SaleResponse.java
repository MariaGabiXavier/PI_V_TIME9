package com.sched.api.dto.response;

import com.sched.api.domain.Sale;

import java.time.LocalDateTime;

public record SaleResponse(
        Long id,

        String productName,
        String productCategory,

        Double totalPrice,
        Integer totalSold,
        String soldBy,
        LocalDateTime saleDate
) {
    public SaleResponse(Sale sale) {
        this(
                sale.getId(),
                sale.getProduct().getName(),
                sale.getProduct().getCategory(),
                sale.getTotalPrice(),
                sale.getTotalSold(),
                sale.getSoldBy().getName(),
                sale.getSaleDate()
        );
    }
}
