package com.sched.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record SaleRequest(
        @NotNull(message = "totalSold cannot be empty")
        Integer totalSold
) {
}