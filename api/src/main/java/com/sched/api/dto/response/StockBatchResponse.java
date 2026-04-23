package com.sched.api.dto.response;

import java.time.LocalDateTime;

public record StockBatchResponse(
        Long id,
        String productName,
        String productCategory,
        Boolean isPerishable,
        Integer quantity,
        LocalDateTime createdAt,
        LocalDateTime expirationDate,
        String createdBy
) { }
