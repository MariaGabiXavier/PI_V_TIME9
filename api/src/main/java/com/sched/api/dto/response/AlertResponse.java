package com.sched.api.dto.response;

import com.sched.api.domain.Stock;

import java.time.LocalDateTime;

public record AlertResponse(
        Long stockId,
        LocalDateTime expirationDate,
        Integer quantity,
        String productName
) {

    public AlertResponse(Stock stock) {
        this(
                stock.getId(),
                stock.getExpirationDate(),
                stock.getQuantity(),
                stock.getProduct().getName()
        );
    }
}