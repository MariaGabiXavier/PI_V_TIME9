package com.sched.api.dto.response;

import java.time.LocalDateTime;

public record StockResponse(
        Long productId,
        String productName,
        String productCategory,
        Boolean productIsPerishable,

        Integer availableQuantity,
        LocalDateTime lastStockEntry,

        LocalDateTime nextToExpireDate,
        LocalDateTime latestExpirationDate
) { }
