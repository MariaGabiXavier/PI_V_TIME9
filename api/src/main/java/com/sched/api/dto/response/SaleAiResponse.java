package com.sched.api.dto.response;

public record SaleAiResponse(
        String productName,
        String category,
        Double price,
        Integer totalSold,
        Integer month
) {
}